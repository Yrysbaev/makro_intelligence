import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { invalidateAnalyticsCache } from '@/lib/analytics';
import { formatFetchError } from '@/lib/retry';
import { getIntuitEnvironment } from '@/lib/resilient-fetch';
import { getIntuitRedirectUri, getOAuthSetupIssue } from '@/lib/intuit';
import {
  fetchCustomers, fetchInvoices, fetchItems, fetchEmployees,
  refreshAccessToken, mapQBOCustomer, mapQBOItem, mapQBOInvoice, mapQBOEmployee,
} from '@/lib/intuit';

// Allow long-running syncs on serverless hosts (Vercel caps hobby plans at 60s)
export const maxDuration = 60;

const UPSERT_CHUNK_SIZE = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function resilientUpsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  retryRow?: (row: Record<string, unknown>, errorMessage: string) => Record<string, unknown> | null
): Promise<{ upserted: number; errors: string[] }> {
  if (rows.length === 0) return { upserted: 0, errors: [] };

  const admin = getSupabaseAdmin();
  const { error: batchError } = await admin
    .from(table)
    .upsert(rows as never[], { onConflict });

  if (!batchError) return { upserted: rows.length, errors: [] };

  let upserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    let payload = row;
    let { error } = await admin.from(table).upsert(payload as never, { onConflict });

    if (error && retryRow) {
      const retry = retryRow(row, error.message);
      if (retry) {
        payload = retry;
        ({ error } = await admin.from(table).upsert(payload as never, { onConflict }));
      }
    }

    if (error) {
      const id = String(row.qbo_id ?? row.name ?? 'unknown');
      errors.push(`${table} ${id}: ${error.message}`);
    } else {
      upserted++;
    }
  }

  if (upserted === 0 && errors.length === 0) {
    errors.push(`${table}: ${batchError.message}`);
  }

  return { upserted, errors };
}

export async function POST(request: NextRequest) {
  const errors: string[] = [];

  try {
    const body = await request.json().catch(() => ({}));
    const { entities = ['customers', 'items', 'employees', 'invoices'], since } = body as {
      entities?: string[];
      since?: string;
    };

    const { data: conn, error: connErr } = await getSupabaseAdmin()
      .from('intuit_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (connErr || !conn) {
      return NextResponse.json({ error: 'No active QuickBooks connection found.' }, { status: 400 });
    }

    let accessToken = conn.access_token;
    if (new Date(conn.expires_at).getTime() - Date.now() < 5 * 60 * 1000) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      accessToken = refreshed.access_token;
      await getSupabaseAdmin()
        .from('intuit_connections')
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq('realm_id', conn.realm_id);
    }

    const realmId = conn.realm_id;
    const results: Record<string, number> = {};
    const fetched: Record<string, number> = {};
    const environment = getIntuitEnvironment();

    if (entities.includes('employees')) {
      const employees = await fetchEmployees(realmId, accessToken);
      fetched.employees = employees.length;
      const rows = employees.map((emp) => ({
        ...mapQBOEmployee(emp),
        territory: 'Unassigned',
      }));
      const r = await resilientUpsert('sales_managers', rows, 'qbo_id');
      results.employees = r.upserted;
      errors.push(...r.errors);
    }

    if (entities.includes('items')) {
      const items = await fetchItems(realmId, accessToken);
      fetched.items = items.length;
      const usedSkus = new Set<string>();
      const rows = items.map((item) => ({
        ...mapQBOItem(item, usedSkus),
        unit_of_measure: 'unit',
      }));
      const r = await resilientUpsert(
        'products',
        rows,
        'qbo_id',
        (row, message) =>
          message.includes('products_sku_key')
            ? { ...row, sku: `QBO-${row.qbo_id}` }
            : null
      );
      results.items = r.upserted;
      errors.push(...r.errors);
    }

    if (entities.includes('customers')) {
      const customers = await fetchCustomers(realmId, accessToken);
      fetched.customers = customers.length;
      const rows = customers.map((c) => mapQBOCustomer(c));
      const r = await resilientUpsert('customers', rows, 'qbo_id');
      results.customers = r.upserted;
      errors.push(...r.errors);
    }

    if (entities.includes('invoices')) {
      const admin = getSupabaseAdmin();
      const invoices = await fetchInvoices(realmId, accessToken, since);
      fetched.invoices = invoices.length;

      // Resolve customer/product ids in two queries instead of one per row —
      // the per-invoice lookups were slow enough to hit serverless timeouts.
      const [{ data: customerRows, error: custErr }, { data: productRows, error: prodErr }] =
        await Promise.all([
          admin.from('customers').select('id, qbo_id'),
          admin.from('products').select('id, qbo_id'),
        ]);
      if (custErr) errors.push(`customers lookup: ${custErr.message}`);
      if (prodErr) errors.push(`products lookup: ${prodErr.message}`);

      const customerIdByQbo = new Map(
        (customerRows || []).map((c) => [String(c.qbo_id), c.id as string])
      );
      const productIdByQbo = new Map(
        (productRows || []).map((p) => [String(p.qbo_id), p.id as string])
      );

      const mapped = invoices.map((inv) => mapQBOInvoice(inv));
      let skipped = 0;
      const invoiceRows: Record<string, unknown>[] = [];

      for (const { invoice } of mapped) {
        const customerId = customerIdByQbo.get(String(invoice.qbo_customer_id));
        if (!customerId) {
          skipped++;
          continue;
        }
        invoiceRows.push({
          qbo_id: invoice.qbo_id,
          invoice_number: invoice.invoice_number,
          customer_id: customerId,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          status: invoice.status,
        });
      }

      // Upsert in chunks — a single multi-thousand-row request can exceed the
      // platform's payload/time limits and return a non-JSON error page
      const invoiceIdByQbo = new Map<string, string>();
      for (const batch of chunk(invoiceRows, UPSERT_CHUNK_SIZE)) {
        const { data: upsertedInvoices, error: invErr } = await admin
          .from('invoices')
          .upsert(batch as never[], { onConflict: 'qbo_id' })
          .select('id, qbo_id');

        if (invErr) {
          errors.push(`invoices: ${invErr.message}`);
        }
        for (const row of upsertedInvoices || []) {
          invoiceIdByQbo.set(String(row.qbo_id), row.id as string);
        }
      }

      // Aggregate duplicate (invoice, product) lines so a single batch upsert
      // never hits the same row twice
      const lineByKey = new Map<
        string,
        { invoice_id: string; product_id: string; quantity: number; unit_price: number; total: number }
      >();
      for (const { invoice, line_items } of mapped) {
        const invoiceId = invoiceIdByQbo.get(String(invoice.qbo_id));
        if (!invoiceId) continue;
        for (const line of line_items) {
          const productId = productIdByQbo.get(String(line.qbo_item_id));
          if (!productId) continue;
          const key = `${invoiceId}:${productId}`;
          const existing = lineByKey.get(key);
          if (existing) {
            existing.quantity += line.quantity;
            existing.total += line.total;
          } else {
            lineByKey.set(key, {
              invoice_id: invoiceId,
              product_id: productId,
              quantity: line.quantity,
              unit_price: line.unit_price,
              total: line.total,
            });
          }
        }
      }

      for (const batch of chunk([...lineByKey.values()], UPSERT_CHUNK_SIZE)) {
        const { error: lineErr } = await admin
          .from('invoice_items')
          .upsert(batch as never[], { onConflict: 'invoice_id,product_id' });
        if (lineErr) errors.push(`invoice line items: ${lineErr.message}`);
      }

      results.invoices = invoiceIdByQbo.size;
      if (skipped > 0) {
        errors.push(`${skipped} invoice(s) skipped — sync customers first`);
      }
    }

    await getSupabaseAdmin()
      .from('intuit_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('realm_id', realmId);

    invalidateAnalyticsCache();

    const totalSynced = Object.values(results).reduce((a, b) => a + b, 0);
    const totalFetched = Object.values(fetched).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: errors.length === 0 || totalSynced > 0,
      synced: results,
      fetched,
      environment,
      errors: errors.slice(0, 10),
      synced_at: new Date().toISOString(),
      warning:
        environment === 'sandbox'
          ? 'Connected to QuickBooks Sandbox — data is from your sandbox company, not live books. Set INTUIT_ENVIRONMENT=production for real data.'
          : totalFetched === 0
            ? 'QuickBooks returned no records. Check that your company has customers, items, and invoices.'
            : undefined,
    });
  } catch (err: unknown) {
    console.error('QBO sync error:', err);
    return NextResponse.json({ error: formatFetchError(err) }, { status: 500 });
  }
}

export async function GET() {
  const { data: conn } = await getSupabaseAdmin()
    .from('intuit_connections')
    .select('realm_id, connected_at, last_synced_at, expires_at, is_active')
    .eq('is_active', true)
    .single();

  return NextResponse.json({
    connected: !!conn,
    connection: conn || null,
    environment: getIntuitEnvironment(),
    redirect_uri: getIntuitRedirectUri(),
    oauth_issue: getOAuthSetupIssue(),
  });
}
