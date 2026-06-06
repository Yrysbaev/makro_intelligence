import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/lib/intuit';
import crypto from 'crypto';

export async function GET(request: Request) {
  // Validate required env vars before attempting OAuth
  const clientId = process.env.INTUIT_CLIENT_ID;
  const clientSecret = process.env.INTUIT_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || clientId === 'your-intuit-client-id') {
    return NextResponse.json(
      { error: 'INTUIT_CLIENT_ID is not set. Add it to your .env.local file.' },
      { status: 500 }
    );
  }
  if (!clientSecret || clientSecret === 'your-intuit-client-secret') {
    return NextResponse.json(
      { error: 'INTUIT_CLIENT_SECRET is not set. Add it to your .env.local file.' },
      { status: 500 }
    );
  }
  if (!appUrl || appUrl === 'http://localhost:3000') {
    // Allow localhost for dev — just warn if it looks unconfigured
  }

  const state = crypto.randomBytes(16).toString('hex');

  // Build redirect URI — falls back to request origin if NEXT_PUBLIC_APP_URL not set
  const origin = appUrl || new URL(request.url).origin;
  const redirectUri = `${origin}/api/intuit/callback`;

  const authUrl = buildAuthUrl(state, redirectUri);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('intuit_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  });

  return response;
}
