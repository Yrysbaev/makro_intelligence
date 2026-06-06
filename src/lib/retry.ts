export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; delayMs?: number; label?: string } = {}
): Promise<T> {
  const { attempts = 3, delayMs = 1500, label = 'operation' } = opts;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await sleep(delayMs * (i + 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${attempts} attempts`);
}

export function formatFetchError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Unknown error';

  const e = err as Record<string, unknown>;
  const details = typeof e.details === 'string' ? e.details : '';
  const message = typeof e.message === 'string' ? e.message : '';

  if (details.includes('Connect Timeout') || details.includes('UND_ERR_CONNECT_TIMEOUT')) {
    return 'Database connection timed out. Check your network or Supabase project status, then retry.';
  }
  if (message.includes('fetch failed') && details) {
    if (details.includes('ENOTFOUND')) {
      return 'Supabase URL not found. Verify NEXT_PUBLIC_SUPABASE_URL in .env.local';
    }
    return 'Database connection failed. Please retry in a moment.';
  }
  if (message && message !== 'TypeError: fetch failed') return message;
  if (details) return details.split('\n')[0];
  return 'Failed to load data';
}
