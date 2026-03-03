const STORE   = process.env.SHOPIFY_STORE_DOMAIN!;
const TOKEN   = process.env.SHOPIFY_ADMIN_API_TOKEN!;
const API_VER = '2025-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

async function shopifyFetch(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify ${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── GIFT CARD (Shopify Plus only) ───────────────────────────
export async function createGiftCard(amount: number, note: string) {
  const data = await shopifyFetch('POST', '/gift_cards.json', {
    gift_card: {
      initial_value: amount.toFixed(2),
      note,
      // expires_on: null means no expiry
    }
  });
  return {
    id:   data.gift_card.id,
    code: data.gift_card.code,
    maskedCode: data.gift_card.masked_code,
    balance: data.gift_card.balance,
  };
}

export async function disableGiftCard(giftCardId: string) {
  return shopifyFetch('POST', `/gift_cards/${giftCardId}/disable.json`);
}

// ─── DISCOUNT CODES (works on all Shopify plans) ──────────────
export async function createDiscountCode(amount: number, note: string) {
  const code = 'TRADEIN-' + Date.now().toString(36).toUpperCase().slice(-6);

  // Step 1: Price rule
  const pr = await shopifyFetch('POST', '/price_rules.json', {
    price_rule: {
      title:             `Trade-In Credit: ${note}`,
      target_type:       'line_item',
      target_selection:  'all',
      allocation_method: 'across',
      value_type:        'fixed_amount',
      value:             `-${amount.toFixed(2)}`,
      customer_selection:'all',
      usage_limit:       1,
      starts_at:         new Date().toISOString(),
    }
  });

  // Step 2: Discount code on that price rule
  await shopifyFetch('POST', `/price_rules/${pr.price_rule.id}/discount_codes.json`, {
    discount_code: { code }
  });

  return { code, priceRuleId: pr.price_rule.id };
}

// ─── CUSTOMER LOOKUP ─────────────────────────────────────────
export async function getCustomerByEmail(email: string) {
  const data = await shopifyFetch('GET', `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`);
  return data.customers?.[0] || null;
}

export async function getCustomerTags(email: string): Promise<string[]> {
  const customer = await getCustomerByEmail(email);
  if (!customer?.tags) return [];
  return customer.tags.split(',').map((t: string) => t.trim());
}
