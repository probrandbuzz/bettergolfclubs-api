import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export default withAdminAuth(async function handler(req, res) {

  // ── GET: list all pricing rows (active + inactive) ──────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('trade_in_pricing')
      .select('*')
      .order('club_type').order('brand').order('model');

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── POST: upsert a pricing row ───────────────────────────────
  if (req.method === 'POST') {
    const { clubType, brand, model, priceNew, priceAboveAvg, priceAvg, priceBelowAvg, active } = req.body;

    if (!clubType || !brand || !model || !priceNew) {
      return res.status(400).json({ error: 'clubType, brand, model, priceNew are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('trade_in_pricing')
      .upsert({
        club_type:        clubType,
        brand,
        model,
        price_new:        Number(priceNew),
        price_above_avg:  Number(priceAboveAvg || 0),
        price_avg:        Number(priceAvg || 0),
        price_below_avg:  Number(priceBelowAvg || 0),
        active:           active !== false,
      }, { onConflict: 'club_type,brand,model' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── DELETE: deactivate OR permanently delete ─────────────────
  if (req.method === 'DELETE') {
    const { id, action } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing id' });
    }

    // Hard delete when ?action=delete
    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('trade_in_pricing')
        .delete()
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ deleted: true });
    }

    // Default: soft deactivate
    const { data, error } = await supabaseAdmin
      .from('trade_in_pricing')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
