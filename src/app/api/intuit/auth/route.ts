import { NextResponse } from 'next/server';
import { buildAuthUrl, getAppBaseUrl, getIntuitRedirectUri, getOAuthSetupIssue } from '@/lib/intuit';
import crypto from 'crypto';

export async function GET() {
  const oauthIssue = getOAuthSetupIssue();
  if (oauthIssue) {
    const url = new URL('/settings', getAppBaseUrl());
    url.searchParams.set('qbo', 'error');
    url.searchParams.set('msg', oauthIssue);
    return NextResponse.redirect(url);
  }

  // Generate a random state value to prevent CSRF
  const state = crypto.randomBytes(16).toString('hex');

  const redirectUri = getIntuitRedirectUri();
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
