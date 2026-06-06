import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revokeToken } from '@/lib/intuit';

export async function POST() {
  try {
    const { data: conn } = await getSupabaseAdmin()
      .from('intuit_connections')
      .select('refresh_token, realm_id')
      .eq('is_active', true)
      .single();

    if (conn) {
      // Revoke the token with Intuit
      await revokeToken(conn.refresh_token).catch(() => {
        // Non-fatal: continue even if revoke fails
      });

      // Mark connection as inactive
      await getSupabaseAdmin()
        .from('intuit_connections')
        .update({ is_active: false })
        .eq('realm_id', conn.realm_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
