import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/lib/intuit';
import crypto from 'crypto';

export async function GET() {
  // Generate a random state value to prevent CSRF
  const state = crypto.randomBytes(16).toString('hex');

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/intuit/callback`;
  const authUrl = buildAuthUrl(state, redirectUri);

  // Set the state in a cookie so we can verify it on callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('intuit_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}
