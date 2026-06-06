import { NextResponse } from 'next/server';

// Dev-only diagnostics endpoint — returns env var status without exposing values
export async function GET() {
  const clientId = process.env.INTUIT_CLIENT_ID;
  const clientSecret = process.env.INTUIT_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const environment = process.env.INTUIT_ENVIRONMENT || 'sandbox';

  const issues: string[] = [];
  if (!clientId || clientId === 'your-intuit-client-id') issues.push('INTUIT_CLIENT_ID is missing or placeholder');
  if (!clientSecret || clientSecret === 'your-intuit-client-secret') issues.push('INTUIT_CLIENT_SECRET is missing or placeholder');

  return NextResponse.json({
    ready: issues.length === 0,
    issues,
    environment,
    redirect_uri: `${appUrl || 'http://localhost:3000'}/api/intuit/callback`,
    vars: {
      INTUIT_CLIENT_ID: clientId ? `set (${clientId.slice(0, 6)}…)` : 'MISSING',
      INTUIT_CLIENT_SECRET: clientSecret ? 'set' : 'MISSING',
      INTUIT_ENVIRONMENT: environment,
      NEXT_PUBLIC_APP_URL: appUrl || 'not set — defaulting to http://localhost:3000',
    },
  });
}
