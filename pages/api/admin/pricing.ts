import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { UpsertPricingSchema, UpsertCodeSchema } from '../../../lib/schemas';

// ── /api/admin/pricing ────────────────────────────────────────
export const pricingHandler = withAdminAuth(async function(req, res, session) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('trade_in_pricing')
      .select('*')
      .order('club_type').order('brand').order('model');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const parsed = UpsertPricingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const d = parsed.data;
    const { data, error } = await supabaseAdmin
      .from('trade_in_pricing')
      .upsert({
        club_type:      d.clubType,
        brand:          d.brand,
        model:          d.model,
        price_new:      d.priceNew,
        price_above_avg:d.priceAboveAvg,
        price_avg:      d.priceAvg,
        price_below_avg:d.priceBelowAvg,
        active:         d.active,
        updated_by:     session.user.email,
      }, { onConflict: 'club_type,brand,model' })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabaseAdmin
      .from('trade_in_pricing')
      .update({ active: false })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

// ── /api/admin/codes ──────────────────────────────────────────
export const codesHandler = withAdminAuth(async function(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('member_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const parsed = UpsertCodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const d = parsed.data;
    const { data, error } = await supabaseAdmin
      .from('member_codes')
      .upsert({
        code:       d.code,
        label:      d.label,
        bonus:      d.bonus,
        active:     d.active,
        max_uses:   d.maxUses   ?? null,
        expires_at: d.expiresAt ?? null,
      }, { onConflict: 'code' })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, active } = req.body;
    const { data, error } = await supabaseAdmin
      .from('member_codes')
      .update({ active })
      .eq('id', id)
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

// ── /api/admin/stats ──────────────────────────────────────────
export const statsHandler = withAdminAuth(async function(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [totals, recent, byStatus, byType] = await Promise.all([
    // Total counts
    supabaseAdmin.from('trade_in_submissions')
      .select('status, payment_type', { count: 'exact' }),

    // Last 7 days
    supabaseAdmin.from('trade_in_submissions')
      .select('id, created_at, status, customer_name, brand, model, payment_type, quoted_cash, quoted_credit')
      .order('created_at', { ascending: false })
      .limit(10),

    // By status
    supabaseAdmin.rpc('count_by_status').catch(() => ({ data: null })),

    // By club type
    supabaseAdmin.from('trade_in_submissions')
      .select('club_type')
      .order('club_type'),
  ]);

  const subs = totals.data || [];
  const pending  = subs.filter(s => s.status === 'pending').length;
  const approved = subs.filter(s => s.status === 'approved' || s.status === 'complete').length;
  const credit   = subs.filter(s => s.payment_type === 'credit').length;
  const cash     = subs.filter(s => s.payment_type === 'cash').length;

  // Club type distribution
  const typeCount: Record<string, number> = {};
  for (const s of subs) {
    typeCount[(s as any).club_type] = (typeCount[(s as any).club_type] || 0) + 1;
  }

  return res.status(200).json({
    total:   subs.length,
    pending,
    approved,
    credit,
    cash,
    recent:  recent.data || [],
    byType:  typeCount,
  });
});

export default pricingHandler; // default export for /api/admin/pricing route
