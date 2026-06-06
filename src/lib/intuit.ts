/**
 * QuickBooks Online (Intuit) API client
 * Handles OAuth 2.0 token management and QBO REST API calls
 */

const INTUIT_BASE_URL = process.env.INTUIT_ENVIRONMENT === 'production'
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com';

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

export const INTUIT_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
export const INTUIT_SCOPES = 'com.intuit.quickbooks.accounting';

// ─── Token Management ────────────────────────────────────────────────────────

export interface IntuitTokens {
  access_token: string;
  refresh_token: string;
  realm_id: string;
  expires_at: number; // unix timestamp ms
}

export function buildAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.INTUIT_CLIENT_ID;
  if (!clientId) throw new Error('INTUIT_CLIENT_ID environment variable is not set.');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: INTUIT_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `${INTUIT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const credentials = Buffer.from(
    `${process.env.INTUIT_CLIENT_ID}:${process.env.INTUIT_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(
    `${process.env.INTUIT_CLIENT_ID}:${process.env.INTUIT_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  return res.json();
}

export async function revokeToken(token: string): Promise<void> {
  const credentials = Buffer.from(
    `${process.env.INTUIT_CLIENT_ID}:${process.env.INTUIT_CLIENT_SECRET}`
  ).toString('base64');

  await fetch(REVOKE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ token }),
  });
}

// ─── QBO API Query Helper ─────────────────────────────────────────────────────

async function qboQuery<T>(
  realmId: string,
  accessToken: string,
  sql: string
): Promise<T[]> {
  const url = `${INTUIT_BASE_URL}/v3/company/${realmId}/query?query=${encodeURIComponent(sql)}&minorversion=65`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QBO query failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const queryResponse = data.QueryResponse;

  // QBO returns the entity name as the key (e.g. { Customer: [...] })
  const entityKey = Object.keys(queryResponse).find((k) => k !== 'maxResults' && k !== 'startPosition' && k !== 'totalCount');
  if (!entityKey) return [];
  return queryResponse[entityKey] as T[];
}

// ─── QBO Data Fetchers ────────────────────────────────────────────────────────

export interface QBOCustomer {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  Active: boolean;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: {
    City?: string;
    CountrySubDivisionCode?: string;
    Line1?: string;
  };
  SalesTermRef?: { value: string };
  MetaData: { CreateTime: string; LastUpdatedTime: string };
}

export interface QBOInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate?: string;
  CustomerRef: { value: string; name: string };
  SalesTermRef?: { value: string };
  Line: QBOInvoiceLine[];
  TotalAmt: number;
  Balance: number;
  EmailStatus?: string;
  MetaData: { CreateTime: string };
  SalesRepRef?: { value: string; name?: string };
  ShipAddr?: { City?: string; CountrySubDivisionCode?: string };
}

export interface QBOInvoiceLine {
  Id?: string;
  LineNum?: number;
  Amount: number;
  DetailType: string;
  SalesItemLineDetail?: {
    ItemRef: { value: string; name: string };
    UnitPrice: number;
    Qty: number;
  };
  Description?: string;
}

export interface QBOItem {
  Id: string;
  Name: string;
  FullyQualifiedName: string;
  Active: boolean;
  Type: string; // Inventory, Service, NonInventory
  UnitPrice: number;
  PurchaseCost?: number;
  Description?: string;
  Sku?: string;
  IncomeAccountRef?: { value: string; name: string };
  MetaData: { CreateTime: string; LastUpdatedTime: string };
}

export interface QBOEmployee {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  Active: boolean;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  MetaData: { CreateTime: string };
}

export async function fetchCustomers(realmId: string, accessToken: string): Promise<QBOCustomer[]> {
  return qboQuery<QBOCustomer>(
    realmId, accessToken,
    "SELECT * FROM Customer WHERE Active = true MAXRESULTS 1000"
  );
}

export async function fetchInvoices(
  realmId: string,
  accessToken: string,
  since?: string
): Promise<QBOInvoice[]> {
  const whereClause = since
    ? `WHERE MetaData.LastUpdatedTime > '${since}'`
    : '';
  return qboQuery<QBOInvoice>(
    realmId, accessToken,
    `SELECT * FROM Invoice ${whereClause} MAXRESULTS 1000`
  );
}

export async function fetchItems(realmId: string, accessToken: string): Promise<QBOItem[]> {
  return qboQuery<QBOItem>(
    realmId, accessToken,
    "SELECT * FROM Item WHERE Active = true MAXRESULTS 1000"
  );
}

export async function fetchEmployees(realmId: string, accessToken: string): Promise<QBOEmployee[]> {
  return qboQuery<QBOEmployee>(
    realmId, accessToken,
    "SELECT * FROM Employee WHERE Active = true MAXRESULTS 200"
  );
}

// ─── Data Mappers ─────────────────────────────────────────────────────────────

export function mapQBOCustomer(c: QBOCustomer) {
  return {
    qbo_id: c.Id,
    name: c.DisplayName,
    city: c.BillAddr?.City || null,
    state: c.BillAddr?.CountrySubDivisionCode || null,
    address: c.BillAddr?.Line1 || null,
    phone: c.PrimaryPhone?.FreeFormNumber || null,
    email: c.PrimaryEmailAddr?.Address || null,
    is_active: c.Active,
    created_at: c.MetaData.CreateTime,
  };
}

export function mapQBOItem(item: QBOItem) {
  return {
    qbo_id: item.Id,
    name: item.Name,
    sku: item.Sku || item.Id,
    category: item.IncomeAccountRef?.name || item.Type || 'Uncategorized',
    unit_price: item.UnitPrice || 0,
    cost_price: item.PurchaseCost || 0,
    description: item.Description || null,
    is_active: item.Active,
  };
}

export function mapQBOInvoice(inv: QBOInvoice) {
  const lineItems = inv.Line.filter(
    (l) => l.DetailType === 'SalesItemLineDetail' && l.SalesItemLineDetail
  ).map((l) => ({
    qbo_item_id: l.SalesItemLineDetail!.ItemRef.value,
    product_name: l.SalesItemLineDetail!.ItemRef.name,
    quantity: l.SalesItemLineDetail!.Qty,
    unit_price: l.SalesItemLineDetail!.UnitPrice,
    total: l.Amount,
  }));

  return {
    invoice: {
      qbo_id: inv.Id,
      invoice_number: inv.DocNumber,
      qbo_customer_id: inv.CustomerRef.value,
      customer_name: inv.CustomerRef.name,
      invoice_date: inv.TxnDate,
      due_date: inv.DueDate || null,
      total: inv.TotalAmt,
      subtotal: inv.TotalAmt,
      tax: 0,
      status: inv.Balance === 0 ? 'paid' : 'pending',
    },
    line_items: lineItems,
  };
}

export function mapQBOEmployee(emp: QBOEmployee) {
  return {
    qbo_id: emp.Id,
    name: emp.DisplayName,
    email: emp.PrimaryEmailAddr?.Address || null,
    phone: emp.PrimaryPhone?.FreeFormNumber || null,
    is_active: emp.Active,
  };
}
