/**
 * QuickBooks Online (Intuit) API client
 * Handles OAuth 2.0 token management and QBO REST API calls
 */

import { withRetry } from '@/lib/retry';
import { getIntuitEnvironment, resilientFetch } from '@/lib/resilient-fetch';

const INTUIT_BASE_URL =
  getIntuitEnvironment() === 'production'
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

export { getIntuitEnvironment } from '@/lib/resilient-fetch';

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export function getIntuitRedirectUri(): string {
  if (process.env.INTUIT_REDIRECT_URI) {
    return process.env.INTUIT_REDIRECT_URI;
  }
  return `${getAppBaseUrl()}/api/intuit/callback`;
}

/** Production keys require HTTPS redirect URIs; localhost is sandbox-only per Intuit. */
export function getOAuthSetupIssue(): string | null {
  if (getIntuitEnvironment() !== 'production') return null;

  try {
    const { protocol, hostname } = new URL(getIntuitRedirectUri());
    if (protocol !== 'https:') {
      return [
        'Production QuickBooks OAuth requires an HTTPS redirect URI.',
        'localhost only works with sandbox keys (Development tab).',
        'To connect your real company locally, use ngrok (ngrok http 3000), set INTUIT_REDIRECT_URI to https://YOUR-TUNNEL/api/intuit/callback, and add that exact URI under Production → Keys & OAuth on developer.intuit.com.',
      ].join(' ');
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'Production OAuth cannot use localhost or IP addresses. Use an HTTPS tunnel or deploy the app.';
    }
  } catch {
    return 'INTUIT_REDIRECT_URI is not a valid URL.';
  }

  return null;
}

export function buildAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INTUIT_CLIENT_ID!,
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

  const res = await resilientFetch(TOKEN_URL, {
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

  const res = await resilientFetch(TOKEN_URL, {
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

  const res = await withRetry(
    () =>
      resilientFetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }),
    { label: 'QBO query', attempts: 3, delayMs: 2000 }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QBO query failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const queryResponse = data.QueryResponse;

  // QBO omits QueryResponse contents entirely when a page has no rows
  if (!queryResponse || typeof queryResponse !== 'object') return [];

  // QBO returns the entity name as the key (e.g. { Customer: [...] })
  const entityKey = Object.keys(queryResponse).find((k) => k !== 'maxResults' && k !== 'startPosition' && k !== 'totalCount');
  if (!entityKey) return [];
  return queryResponse[entityKey] as T[];
}

async function qboQueryAll<T>(
  realmId: string,
  accessToken: string,
  selectSql: string,
  pageSize = 1000
): Promise<T[]> {
  const results: T[] = [];
  let start = 1;

  while (true) {
    const sql = `${selectSql} STARTPOSITION ${start} MAXRESULTS ${pageSize}`;
    const page = await qboQuery<T>(realmId, accessToken, sql);
    results.push(...page);
    if (page.length < pageSize) break;
    start += pageSize;
  }

  return results;
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
  // Include inactive/deleted customers — invoices reference them, and skipping
  // them would silently drop that revenue from the sync.
  return qboQueryAll<QBOCustomer>(
    realmId, accessToken,
    'SELECT * FROM Customer'
  );
}

/**
 * Floor date for invoice sync. Pulling the entire invoice history (multiple
 * years) is what makes the sync exceed serverless time limits, so we only
 * sync invoices dated on/after this day. Override with INTUIT_SYNC_START_DATE.
 */
export const SYNC_START_DATE = process.env.INTUIT_SYNC_START_DATE || '2026-01-01';

function isValidQboDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export async function fetchInvoices(
  realmId: string,
  accessToken: string,
  since?: string,
  startDate: string = SYNC_START_DATE,
  endDate?: string
): Promise<QBOInvoice[]> {
  const conditions: string[] = [];
  if (startDate && isValidQboDate(startDate)) {
    conditions.push(`TxnDate >= '${startDate}'`);
  }
  if (endDate && isValidQboDate(endDate)) {
    conditions.push(`TxnDate <= '${endDate}'`);
  }
  if (since) {
    conditions.push(`MetaData.LastUpdatedTime > '${since}'`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return qboQueryAll<QBOInvoice>(
    realmId, accessToken,
    `SELECT * FROM Invoice ${whereClause}`.trim()
  );
}

export async function fetchItems(realmId: string, accessToken: string): Promise<QBOItem[]> {
  // Include inactive items so invoice line items always resolve to a product.
  return qboQueryAll<QBOItem>(
    realmId, accessToken,
    'SELECT * FROM Item'
  );
}

export async function fetchEmployees(realmId: string, accessToken: string): Promise<QBOEmployee[]> {
  return qboQueryAll<QBOEmployee>(
    realmId, accessToken,
    'SELECT * FROM Employee WHERE Active = true'
  );
}

// ─── Data Mappers ─────────────────────────────────────────────────────────────

export function truncateField(value: string | null | undefined, maxLength: number): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length >= 10) return truncateField(digits, 50);
  return truncateField(phone.replace(/\s+/g, ' ').trim(), 50);
}

/** Unique SKU for products — disambiguate when QBO shares SKUs across items. */
export function buildProductSku(item: QBOItem, usedSkus: Set<string>): string {
  const qboSku = `QBO-${item.Id}`;
  const raw = item.Sku?.trim();
  if (!raw) {
    usedSkus.add(qboSku);
    return qboSku;
  }

  let candidate = raw.slice(0, 50);
  if (usedSkus.has(candidate)) {
    candidate = `${raw.slice(0, 42)}-${item.Id}`.slice(0, 50);
  }
  if (usedSkus.has(candidate)) {
    candidate = qboSku;
  }

  usedSkus.add(candidate);
  return candidate;
}

export function mapQBOCustomer(c: QBOCustomer) {
  return {
    qbo_id: c.Id,
    name: truncateField(c.DisplayName, 200)!,
    city: truncateField(c.BillAddr?.City, 100),
    state: truncateField(c.BillAddr?.CountrySubDivisionCode, 50),
    address: c.BillAddr?.Line1 || null,
    phone: normalizePhone(c.PrimaryPhone?.FreeFormNumber),
    email: truncateField(c.PrimaryEmailAddr?.Address, 150),
    is_active: c.Active,
    created_at: c.MetaData.CreateTime,
  };
}

export function mapQBOItem(item: QBOItem, usedSkus: Set<string>) {
  return {
    qbo_id: item.Id,
    name: truncateField(item.Name, 200)!,
    sku: buildProductSku(item, usedSkus),
    category: truncateField(item.IncomeAccountRef?.name || item.Type || 'Uncategorized', 100)!,
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
      invoice_number: inv.DocNumber || `QBO-${inv.Id}`,
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
    name: truncateField(emp.DisplayName, 100)!,
    email: truncateField(emp.PrimaryEmailAddr?.Address, 150),
    phone: normalizePhone(emp.PrimaryPhone?.FreeFormNumber),
    is_active: emp.Active,
  };
}
