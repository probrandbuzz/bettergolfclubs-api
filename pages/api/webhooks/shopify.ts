import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';
import { IncomingMessage } from 'http';
import { supabaseAdmin } from '../../../lib/supabase';

// Disable Next.js body parser — we need the raw buffer for HMAC verification
export const config = { api: { bodyParser: false } };

// Read raw body from the request stream (replaces 'micro' buffer())
function getRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function verifyShopifyWebhook(req: NextApiRequest, rawBody: Buffer): Promise<boolean> {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!hmacHeader || !secret) return false;

  const hash = createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  return hash === hmacHeader;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const isValid = await verifyShopifyWebhook(req, rawBody);
  if (!isValid) {
    console.warn('[webhook] Invalid HMAC signature — rejecting');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const topic   = req.headers['x-shopify-topic'] as string;
  const payload = JSON.parse(rawBody.toString());

  console.log(`[webhook] Received topic: ${topic}`);

  try {
    switch (topic) {
      case 'orders/paid':
        await handleOrderPaid(payload);
        break;
      case 'gift_cards/updated':
        await handleGiftCardUpdated(payload);
        break;
      case 'gift_cards/disabled':
        await handleGiftCardDisabled(payload);
        break;
      default:
        console.log(`[webhook] Unhandled topic: ${topic}`);
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${topic}:`, err);
    // Always return 200 to Shopify — otherwise it will keep retrying
  }

  return res.status(200).json({ ok: true });
}

async function handleOrderPaid(payload: any) {
  const giftCardCode = payload.payment_gateway_names?.includes('Gift Card')
    ? payload.payment_details?.gift_cards?.[0]?.code
    : null;
  if (!giftCardCode) return;

  await supabaseAdmin
    .from('trade_in_submissions')
    .update({ status: 'complete', shopify_order_id: String(payload.id) })
    .eq('gift_card_code', giftCardCode);
}

async function handleGiftCardUpdated(payload: any) {
  if (!payload.code) return;
  await supabaseAdmin
    .from('trade_in_submissions')
    .update({ gift_card_id: String(payload.id) })
    .eq('gift_card_code', payload.code);
}

async function handleGiftCardDisabled(payload: any) {
  if (!payload.code) return;
  console.log(`[webhook] Gift card disabled: ${payload.code}`);
}
