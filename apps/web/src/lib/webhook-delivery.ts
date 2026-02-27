import { createHmac } from 'crypto';
import { randomUUID } from 'crypto';

export interface WebhookPayload {
  type: string;
  [key: string]: unknown;
}

export interface WebhookDeliveryOptions {
  url: string;
  secret: string;
  payload: WebhookPayload;
}

export interface WebhookDeliveryResult {
  ok: boolean;
  status: number;
  deliveryId: string;
}

/**
 * Deliver a signed webhook payload to a URL.
 * Signs with HMAC-SHA256 and adds standard WokGen webhook headers.
 * Enforces a 10-second timeout to avoid blocking the caller.
 */
export async function deliverWebhook(options: WebhookDeliveryOptions): Promise<WebhookDeliveryResult> {
  const { url, secret, payload } = options;
  const body = JSON.stringify(payload);
  const deliveryId = randomUUID();

  const signature = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WokGen-Signature': `sha256=${signature}`,
        'X-WokGen-Event': payload.type,
        'X-WokGen-Delivery': deliveryId,
      },
      body,
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status, deliveryId };
  } catch {
    return { ok: false, status: 0, deliveryId };
  } finally {
    clearTimeout(timeout);
  }
}
