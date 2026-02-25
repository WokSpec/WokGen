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
 */
export async function deliverWebhook(options: WebhookDeliveryOptions): Promise<WebhookDeliveryResult> {
  const { url, secret, payload } = options;
  const body = JSON.stringify(payload);
  const deliveryId = randomUUID();

  const signature = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WokGen-Signature': `sha256=${signature}`,
      'X-WokGen-Event': payload.type,
      'X-WokGen-Delivery': deliveryId,
    },
    body,
  });

  return { ok: res.ok, status: res.status, deliveryId };
}
