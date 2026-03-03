import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { withAdminAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

export default withAdminAuth(async function handler(req, res, session) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  // Fetch current admin
  const { data: admin, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, password_hash')
    .eq('email', session.user.email)
    .single();

  if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 12);

  // Update
  const { error: updateError } = await supabaseAdmin
    .from('admin_users')
    .update({ password_hash: newHash })
    .eq('id', admin.id);

  if (updateError) return res.status(500).json({ error: 'Failed to update password' });

  return res.status(200).json({ success: true });
});
