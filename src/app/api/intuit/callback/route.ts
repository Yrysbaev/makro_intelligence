import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/intuit';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?qbo=denied`
    );
  }

  // Validate required params
  if (!code || !realmId || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?qbo=error&msg=missing_params`
    );
  }

  // Verify state cookie to prevent CSRF
  const cookieState = request.cookies.get('intuit_oauth_state')?.value;
  if (cookieState !== state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?qbo=error&msg=state_mismatch`
    );
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/intuit/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Upsert connection record in Supabase
    const { error: dbError } = await supabase
      .from('intuit_connections')
      .upsert({
        realm_id: realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(expiresAt).toISOString(),
        connected_at: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'realm_id' });

    if (dbError) throw dbError;

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?qbo=connected`
    );
    // Clear state cookie
    response.cookies.delete('intuit_oauth_state');
    return response;
  } catch (err: any) {
    console.error('QBO OAuth callback error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?qbo=error&msg=${encodeURIComponent(err.message)}`
    );
  }
}
