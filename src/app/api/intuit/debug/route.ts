import { NextResponse } from 'next/server';

// DEVELOPMENT ONLY — remove before going to production
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return NextResponse.json({
    INTUIT_CLIENT_ID: process.env.INTUIT_CLIENT_ID
      ? `✅ set (${process.env.INTUIT_CLIENT_ID.slice(0, 8)}...)`
      : '❌ MISSING',
    INTUIT_CLIENT_SECRET: process.env.INTUIT_CLIENT_SECRET
      ? '✅ set'
      : '❌ MISSING',
    INTUIT_ENVIRONMENT: process.env.INTUIT_ENVIRONMENT || '⚠️  not set (defaults to sandbox)',
    NEXT_PUBLIC_APP_URL: appUrl || '⚠️  not set',
    redirect_uri_will_be: `${appUrl || '(origin from request)'}/api/intuit/callback`,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `✅ set`
      : '❌ MISSING',
  });
}
