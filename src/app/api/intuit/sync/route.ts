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
      const invoices = await fetchInvoices(realmId, accessToken, since);
      fetched.invoices = invoices.length;
      let upserted = 0;
      let skipped = 0;

      for (const inv of invoices) {
        const { invoice, line_items } = mapQBOInvoice(inv);

        const { data: customerRow } = await getSupabaseAdmin()
          .from('customers')
          .select('id')
          .eq('qbo_id', invoice.qbo_customer_id)
          .single();

        if (!customerRow) {
          skipped++;
          continue;
        }

        const { data: invoiceRow, error: invErr } = await getSupabaseAdmin()
          .from('invoices')
          .upsert(
            {
              qbo_id: invoice.qbo_id,
              invoice_number: invoice.invoice_number,
              customer_id: customerRow.id,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date,
              subtotal: invoice.subtotal,
              tax: invoice.tax,
              total: invoice.total,
              status: invoice.status,
            },
            { onConflict: 'qbo_id' }
          )
          .select('id')
          .single();

        if (invErr || !invoiceRow) {
          errors.push(`invoice ${invoice.qbo_id}: ${invErr?.message || 'upsert failed'}`);
          continue;
        }

        for (const line of line_items) {
          const { data: productRow } = await getSupabaseAdmin()
            .from('products')
            .select('id')
            .eq('qbo_id', line.qbo_item_id)
            .single();

          if (!productRow) continue;

          const { error: lineErr } = await getSupabaseAdmin().from('invoice_items').upsert(
            {
              invoice_id: invoiceRow.id,
              product_id: productRow.id,
              quantity: line.quantity,
              unit_price: line.unit_price,
              total: line.total,
            },
            { onConflict: 'invoice_id,product_id' }
          );

          if (lineErr) errors.push(`line item ${invoice.qbo_id}: ${lineErr.message}`);
        }

        upserted++;
      }

      results.invoices = upserted;
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
