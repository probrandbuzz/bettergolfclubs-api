import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createGiftCard, createDiscountCode } from '@/lib/shopify';
import { sendApprovalCredit, sendApprovalCash, sendRejection, sendShippingLabel } from '@/lib/email';
import { UpdateStatusSchema, ApproveSchema, AttachLabelSchema } from '@/lib/schemas';

export default withAdminAuth(async function handler(req, res, session) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing submission ID' });

  // ─── GET: fetch single submission ─────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('trade_in_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Submission not found' });
    return res.status(200).json(data);
  }

  // ─── PATCH: update status / notes ─────────────────────────
  if (req.method === 'PATCH') {
    const { action } = req.body;

    // Action: update-status
    if (action === 'update-status') {
      const parsed = UpdateStatusSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

      const { data, error } = await supabaseAdmin
        .from('trade_in_submissions')
        .update({
          status:      parsed.data.status,
          admin_notes: parsed.data.adminNotes || null,
          reviewed_by: session.user.email,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // Action: approve
    if (action === 'approve') {
      const parsed = ApproveSchema.safeParse({ ...req.body, id });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

      const { data: sub } = await supabaseAdmin
        .from('trade_in_submissions')
        .select('*')
        .eq('id', id)
        .single();
      if (!sub) return res.status(404).json({ error: 'Not found' });

      const updates: Record<string, any> = {
        status:      'approved',
        admin_notes: parsed.data.adminNotes || null,
        reviewed_by: session.user.email,
        reviewed_at: new Date().toISOString(),
      };

      if (sub.payment_type === 'credit') {
        const note = `Trade-in: ${sub.brand} ${sub.model} — ${sub.customer_email}`;
        const amount = sub.quoted_credit || 0;

        try {
          if (parsed.data.useGiftCard) {
            const gc = await createGiftCard(amount, note);
            updates.gift_card_code = gc.code;
            updates.gift_card_id   = String(gc.id);
            await sendApprovalCredit(sub, gc.code);
          } else {
            const dc = await createDiscountCode(amount, note);
            updates.discount_code = dc.code;
            await sendApprovalCredit(sub, dc.code);
          }
        } catch (shopifyErr) {
          console.error('[approve] Shopify error:', shopifyErr);
          updates.admin_notes = `[Shopify error — issue credit manually] ${parsed.data.adminNotes || ''}`;
          await sendApprovalCredit(sub, 'MANUAL-ISSUE');
        }
      } else {
        await sendApprovalCash(sub);
      }

      const { data, error } = await supabaseAdmin
        .from('trade_in_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // Action: attach-label
    if (action === 'attach-label') {
      const parsed = AttachLabelSchema.safeParse({ ...req.body, id });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

      const { data: sub } = await supabaseAdmin
        .from('trade_in_submissions')
        .select('*').eq('id', id).single();
      if (!sub) return res.status(404).json({ error: 'Not found' });

      const { data, error } = await supabaseAdmin
        .from('trade_in_submissions')
        .update({
          shipping_label_url: parsed.data.shippingLabelUrl,
          tracking_number:    parsed.data.trackingNumber || null,
          status: sub.status === 'pending' ? 'approved' : sub.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      await sendShippingLabel(sub, parsed.data.shippingLabelUrl).catch(console.error);
      return res.status(200).json(data);
    }

    // Action: reject
    if (action === 'reject') {
      const { reason } = req.body;

      const { data: sub } = await supabaseAdmin
        .from('trade_in_submissions')
        .select('*').eq('id', id).single();
      if (!sub) return res.status(404).json({ error: 'Not found' });

      const { data, error } = await supabaseAdmin
        .from('trade_in_submissions')
        .update({
          status:      'rejected',
          admin_notes: reason || null,
          reviewed_by: session.user.email,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      await sendRejection(sub, reason || '').catch(console.error);
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
