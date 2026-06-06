import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { resilientFetch } from '@/lib/resilient-fetch';

/** Server-only Supabase client (bypasses RLS). Never import from client components. */
let _adminClient: SupabaseClient | null = null;

function resolveAdminKey(): string {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!key) {
    throw new Error(
      'Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY (sb_secret_...) in your environment — use the secret key from Supabase Dashboard → Settings → API Keys, not the publishable key.'
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (publishableKey && key === publishableKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is set to the publishable key. Use the secret key (sb_secret_...) from Supabase Dashboard → Settings → API Keys instead.'
    );
  }

  if (key.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY must be a secret key (sb_secret_...), not sb_publishable_...'
    );
  }

  return key;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = resolveAdminKey();

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }

  _adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: resilientFetch },
  });

  return _adminClient;
}

export function formatSupabaseAdminError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('row-level security')) {
    return [
      'Database permission error on intuit_connections.',
      'Your server is using the publishable Supabase key instead of the secret key.',
      'In Vercel → Settings → Environment Variables, set SUPABASE_SERVICE_ROLE_KEY to sb_secret_... (from Supabase → Settings → API Keys), then redeploy.',
    ].join(' ');
  }
  return message;
}
