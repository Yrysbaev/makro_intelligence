import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  fetchCustomers, fetchInvoices, fetchItems, fetchEmployees,
  refreshAccessToken, mapQBOCustomer, mapQBOItem, mapQBOInvoice, mapQBOEmployee,
} from '@/lib/intuit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { entities = ['customers', 'items', 'employees', 'invoices'], since } = body as {
      entities?: string[];
      since?: string;
    };

    // Load connection from Supabase
    const { data: conn, error: connErr } = await supabase
      .from('intuit_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (connErr || !conn) {
      return NextResponse.json({ error: 'No active QuickBooks connection found.' }, { status: 400 });
    }

    // Refresh token if expired (within 5 min buffer)
    let accessToken = conn.access_token;
    if (new Date(conn.expires_at).getTime() - Date.now() < 5 * 60 * 1000) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      accessToken = refreshed.access_token;
      await supabase
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

    // ── Sync Employees / Sales Managers ─────────────────────────────────────
    if (entities.includes('employees')) {
      const employees = await fetchEmployees(realmId, accessToken);
      let upserted = 0;
      for (const emp of employees) {
        const mapped = mapQBOEmployee(emp);
        const { error } = await supabase
          .from('sales_managers')
          .upsert({ ...mapped, territory: 'Unassigned' }, { onConflict: 'qbo_id' });
        if (!error) upserted++;
      }
      results.employees = upserted;
    }

    // ── Sync Products / Items ────────────────────────────────────────────────
    if (entities.includes('items')) {
      const items = await fetchItems(realmId, accessToken);
      let upserted = 0;
      for (const item of items) {
        const mapped = mapQBOItem(item);
        const { error } = await supabase
          .from('products')
          .upsert({ ...mapped, unit_of_measure: 'unit' }, { onConflict: 'qbo_id' });
        if (!error) upserted++;
      }
      results.items = upserted;
    }

    // ── Sync Customers ───────────────────────────────────────────────────────
    if (entities.includes('customers')) {
      const customers = await fetchCustomers(realmId, accessToken);
      let upserted = 0;
      for (const customer of customers) {
        const mapped = mapQBOCustomer(customer);
        const { error } = await supabase
          .from('customers')
          .upsert(mapped, { onConflict: 'qbo_id' });
        if (!error) upserted++;
      }
      results.customers = upserted;
    }

    // ── Sync Invoices ────────────────────────────────────────────────────────
    if (entities.includes('invoices')) {
      const invoices = await fetchInvoices(realmId, accessToken, since);
      let upserted = 0;

      for (const inv of invoices) {
        const { invoice, line_items } = mapQBOInvoice(inv);

        // Look up our internal customer ID by qbo_customer_id
        const { data: customerRow } = await supabase
          .from('customers')
          .select('id')
          .eq('qbo_id', invoice.qbo_customer_id)
          .single();

        if (!customerRow) continue; // skip if customer not yet synced

        const { data: invoiceRow, error: invErr } = await supabase
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

        if (invErr || !invoiceRow) continue;

        // Upsert line items
        for (const line of line_items) {
          const { data: productRow } = await supabase
            .from('products')
            .select('id')
            .eq('qbo_id', line.qbo_item_id)
            .single();

          if (!productRow) continue;

          await supabase.from('invoice_items').upsert(
            {
              invoice_id: invoiceRow.id,
              product_id: productRow.id,
              quantity: line.quantity,
              unit_price: line.unit_price,
              total: line.total,
            },
            { onConflict: 'invoice_id,product_id' }
          );
        }

        upserted++;
      }
      results.invoices = upserted;
    }

    // Update last sync time
    await supabase
      .from('intuit_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('realm_id', realmId);

    return NextResponse.json({
      success: true,
      synced: results,
      synced_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('QBO sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Return current connection status
  const { data: conn } = await supabase
    .from('intuit_connections')
    .select('realm_id, connected_at, last_synced_at, expires_at, is_active')
    .eq('is_active', true)
    .single();

  return NextResponse.json({ connected: !!conn, connection: conn || null });
}
