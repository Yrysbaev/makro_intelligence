import { sleep } from '@/lib/retry';

/** Fetch with retries for transient network timeouts (Node default connect timeout is 10s). */
export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(input, { ...init, cache: 'no-store' });
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(2000 * (i + 1));
    }
  }
  throw lastError;
}

export function getIntuitEnvironment(): 'sandbox' | 'production' {
  const env = process.env.INTUIT_ENVIRONMENT || process.env.QBO_ENV || 'sandbox';
  return env === 'production' ? 'production' : 'sandbox';
}
