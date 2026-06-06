import { NextRequest, NextResponse } from 'next/server';
import { invalidateAnalyticsCache } from '@/lib/analytics';
import { exchangeCodeForTokens, getAppBaseUrl, getIntuitRedirectUri } from '@/lib/intuit';
import { getSupabaseAdmin, formatSupabaseAdminError } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial
  if (error) {
    return NextResponse.redirect(`${getAppBaseUrl()}/settings?qbo=denied`);
  }

  // Validate required params
  if (!code || !realmId || !state) {
    return NextResponse.redirect(`${getAppBaseUrl()}/settings?qbo=error&msg=missing_params`);
  }

  // Verify state cookie to prevent CSRF
  const cookieState = request.cookies.get('intuit_oauth_state')?.value;
  if (cookieState !== state) {
    return NextResponse.redirect(`${getAppBaseUrl()}/settings?qbo=error&msg=state_mismatch`);
  }

  try {
    const redirectUri = getIntuitRedirectUri();
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Upsert connection record in Supabase
    const { error: dbError } = await getSupabaseAdmin()
      .from('intuit_connections')
      .upsert({
        realm_id: realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(expiresAt).toISOString(),
        connected_at: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'realm_id' });

    if (dbError) {
      throw new Error(formatSupabaseAdminError(dbError));
    }

    invalidateAnalyticsCache();

    const response = NextResponse.redirect(`${getAppBaseUrl()}/settings?qbo=connected`);
    // Clear state cookie
    response.cookies.delete('intuit_oauth_state');
    return response;
  } catch (err: unknown) {
    console.error('QBO OAuth callback error:', err);
    return NextResponse.redirect(
      `${getAppBaseUrl()}/settings?qbo=error&msg=${encodeURIComponent(formatSupabaseAdminError(err))}`
    );
  }
}
