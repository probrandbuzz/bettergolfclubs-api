import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function codesHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { code, bonus, label } = req.body;
    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .insert([{ code, bonus, label }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'DELETE') {
    const { code } = req.body;
    const { error } = await supabaseAdmin
      .from('discount_codes')
      .delete()
      .eq('code', code);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}