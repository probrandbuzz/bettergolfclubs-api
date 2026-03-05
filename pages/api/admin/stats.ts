import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function statsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [submissions, codes] = await Promise.all([
    supabaseAdmin
      .from('trade_in_submissions')
      .select('id, created_at, payment_type, total_cash, total_credit, customer_name', { count: 'exact' }),
    supabaseAdmin
      .from('discount_codes')
      .select('id', { count: 'exact' }),
  ]);

  if (submissions.error) return res.status(500).json({ error: submissions.error.message });
  if (codes.error) return res.status(500).json({ error: codes.error.message });

  const totalCash = submissions.data?.reduce((s, r) => s + (r.total_cash || 0), 0) ?? 0;
  const totalCredit = submissions.data?.reduce((s, r) => s + (r.total_credit || 0), 0) ?? 0;

  return res.status(200).json({
    totalSubmissions: submissions.count ?? 0,
    totalCodes: codes.count ?? 0,
    totalCashValue: totalCash,
    totalCreditValue: totalCredit,
    recentSubmissions: submissions.data?.slice(0, 5) ?? [],
  });
}