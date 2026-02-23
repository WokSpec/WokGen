export type ApiErrorCode =
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_CREDITS'
  | 'MODEL_UNAVAILABLE'
  | 'INVALID_PROMPT'
  | 'WRONG_ENDPOINT'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface StudioError {
  message: string;      // User-friendly message
  code: ApiErrorCode;
  retryable: boolean;
  hint?: string;        // Optional action hint
}

export function parseApiError(response: { status: number; error?: string; code?: string; retryable?: boolean }, rawMessage?: string): StudioError {
  const code = (response.code as ApiErrorCode) || 'UNKNOWN';
  const retryable = response.retryable ?? true;

  // User-friendly messages mapped from error codes
  const messages: Record<string, string> = {
    RATE_LIMITED:          'You\'ve hit the generation limit. Please wait a moment before trying again.',
    INSUFFICIENT_CREDITS:  'You\'ve run out of HD credits. Upgrade your plan or add more credits.',
    MODEL_UNAVAILABLE:     'Generation providers are temporarily busy. Your request will succeed if you try again.',
    INVALID_PROMPT:        'Your prompt couldn\'t be processed. Try making it more specific.',
    TIMEOUT:               'Generation took too long. This sometimes happens — please try again.',
    NETWORK_ERROR:         'Connection issue. Check your internet and try again.',
    UNKNOWN:               rawMessage || response.error || 'Something went wrong. Please try again.',
  };

  const hints: Partial<Record<string, string>> = {
    RATE_LIMITED:         'Free tier: 20 generations/hour',
    INSUFFICIENT_CREDITS: 'Go to Settings → Billing to add credits',
    INVALID_PROMPT:       'Tip: Be specific about style, subject, and format',
  };

  return {
    message:   messages[code] || messages.UNKNOWN,
    code,
    retryable,
    hint:      hints[code],
  };
}

export async function fetchWithStudioError(url: string, options: RequestInit): Promise<{ ok: true; data: unknown } | { ok: false; error: StudioError }> {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: parseApiError({ status: res.status, ...data as Record<string, unknown> }) };
    }

    return { ok: true, data };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: { message: 'Generation timed out. Please try again.', code: 'TIMEOUT', retryable: true } };
    }
    return { ok: false, error: { message: 'Network error. Check your connection.', code: 'NETWORK_ERROR', retryable: true } };
  }
}
