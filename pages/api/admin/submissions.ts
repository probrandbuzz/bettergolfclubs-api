import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export default withAdminAuth(async function handler(req, res) {
  // ─── GET: list submissions with filters ───────────────────
  if (req.method === 'GET') {
    const {
      status, paymentType, clubType,
      search, from, to,
      page = '1', limit = '25',
      ref_code,
    } = req.query;

    let q = supabaseAdmin
      .from('trade_in_submissions')
      .select('id, ref_code, created_at, status, customer_name, customer_email, brand, model, condition, payment_type, quoted_cash, quoted_credit, member_code, club_type', { count: 'exact' });

    // ref_code lookup — returns all clubs sharing a quote (used by admin modal grouping)
    if (ref_code) {
      q = q.eq('ref_code', ref_code as string);
      const { data, error, count } = await q.order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ submissions: data, total: count, page: 1, pages: 1 });
    }

    if (status)      q = q.eq('status', status);
    if (paymentType) q = q.eq('payment_type', paymentType);
    if (clubType)    q = q.eq('club_type', clubType);
    if (from)        q = q.gte('created_at', from as string);
    if (to)          q = q.lte('created_at', to as string);
    if (search) {
      q = q.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,ref_code.ilike.%${search}%`
      );
    }

    const pageNum  = Math.max(1, parseInt(page as string));
    const pageSize = Math.min(100, parseInt(limit as string));
    const offset   = (pageNum - 1) * pageSize;

    q = q.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
      submissions: data,
      total: count,
      page: pageNum,
      pages: Math.ceil((count || 0) / pageSize),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});