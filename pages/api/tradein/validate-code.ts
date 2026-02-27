import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import { ValidateCodeSchema } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const parsed = ValidateCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ valid: false, error: 'Invalid request' });
  }

  const code = parsed.data.code.toUpperCase().trim();

  const { data, error } = await supabaseAdmin
    .from('member_codes')
    .select('code, label, bonus, active, expires_at, max_uses, uses_count')
    .eq('code', code)
    .single();

  if (error || !data) {
    return res.status(200).json({ valid: false, error: 'Code not found or invalid.' });
  }

  if (!data.active) {
    return res.status(200).json({ valid: false, error: 'This code has been deactivated.' });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(200).json({ valid: false, error: 'This code has expired.' });
  }

  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return res.status(200).json({ valid: false, error: 'This code has reached its usage limit.' });
  }

  return res.status(200).json({
    valid: true,
    bonus: data.bonus,
    label: data.label,
  });
}
