import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabase';

// Simple JWT-lite: base64(header).base64(payload).base64(sig)
// We use a signed payload so it can't be forged without NEXTAUTH_SECRET
function signToken(payload: object): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body    = Buffer.from(JSON.stringify(payload)).toString('base64url');
  // Simple HMAC-SHA256 using Node crypto
  const { createHmac } = require('crypto');
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): any | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const [header, body, sig] = token.split('.');
    const { createHmac } = require('crypto');
    const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data: admin, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, name, password_hash, role, active')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !admin || !admin.active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // Update last_login
  await supabaseAdmin
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', admin.id);

  const token = signToken({
    id:    admin.id,
    email: admin.email,
    name:  admin.name,
    role:  admin.role,
    exp:   Date.now() + (8 * 60 * 60 * 1000), // 8 hours
  });

  return res.status(200).json({
    token,
    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
}
