import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendConfirmation, sendAdminAlert } from '../../../lib/email';
import { SubmitSchema } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ─── 1. Validate ────────────────────────────────────────────
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  const d = parsed.data;

  // ─── 2. Build bank_details string for cash ──────────────────
  const bankDetails = d.paymentType === 'cash'
    ? `BSB: ${d.bsb} | Account: ${d.accountNumber}`
    : null;

  // ─── 3. Insert one row per club ─────────────────────────────
  const rows = d.clubs.map(club => ({
    club_type:      club.clubType,
    brand:          club.brand,
    model:          club.model,
    condition:      club.condition,
    iron_config:    club.ironConfig   || null,
    missing_clubs:  club.missingClubs || [],
    payment_type:   d.paymentType,
    quoted_cash:    club.notFound ? null : club.cashVal,
    quoted_credit:  club.notFound ? null : club.creditVal,
    member_code:    d.memberCode    || null,
    member_bonus:   d.memberBonus   ?? null,
    customer_name:  d.customerName,
    customer_email: d.customerEmail,
    customer_phone: d.customerPhone || null,
    address:        d.address       || null,
    bank_details:   bankDetails,
    collection_date: d.collectionDate || null,
    notes:          d.boxMeasurements || null,
    shopify_customer_id: d.shopifyCustomerId || null,
    status: 'pending',
  }));

  const { data: subs, error } = await supabaseAdmin
    .from('trade_in_submissions')
    .insert(rows)
    .select();

  if (error || !subs?.length) {
    console.error('[submit] Supabase error:', error);
    return res.status(500).json({ error: 'Failed to save submission. Please try again.' });
  }

  // ─── 4. Send emails (non-blocking) ──────────────────────────
  const totalVal = d.paymentType === 'cash' ? d.totalCash : d.totalCredit;
  Promise.all([
    sendConfirmation({ subs, paymentType: d.paymentType, totalVal })
      .catch(e => console.error('[email] confirmation failed:', e)),
    sendAdminAlert({ subs, paymentType: d.paymentType, totalVal })
      .catch(e => console.error('[email] admin alert failed:', e)),
  ]);

  // ─── 5. Respond ─────────────────────────────────────────────
  const first = subs[0];
  return res.status(200).json({
    success: true,
    ref: first.ref_code || first.id.slice(0, 8).toUpperCase(),
    submissionIds: subs.map((s: any) => s.id),
    clubCount: subs.length,
  });
}
