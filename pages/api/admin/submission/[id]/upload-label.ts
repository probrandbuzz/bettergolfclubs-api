// pages/api/admin/submission/[id]/upload-label.ts
// Accepts a multipart PDF upload, stores it in Supabase Storage,
// saves the public URL to the submission, and emails the customer.

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendShippingLabel } from '@/lib/email';
import formidable, { File } from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // required for formidable
};

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  _session: any,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing submission ID' });
  }

  // ── Parse multipart form ──────────────────────────────────
  const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10 MB limit

  let fields: formidable.Fields;
  let files: formidable.Files;
  try {
    [fields, files] = await form.parse(req);
  } catch (e: any) {
    return res.status(400).json({ error: 'Failed to parse upload: ' + e.message });
  }

  const fileArr = files['file'];
  const file: File | undefined = Array.isArray(fileArr) ? fileArr[0] : fileArr;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Only PDF files are accepted' });
  }

  const trackingNumber = Array.isArray(fields.trackingNumber)
    ? fields.trackingNumber[0]
    : fields.trackingNumber ?? '';

  // ── Fetch submission ──────────────────────────────────────
  const { data: sub, error: fetchErr } = await supabaseAdmin
    .from('trade_in_submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !sub) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  // ── Upload PDF to Supabase Storage ───────────────────────
  const fileBuffer = fs.readFileSync(file.filepath);
  const fileName = `shipping-labels/${id}-${Date.now()}.pdf`;

  const { data: uploadData, error: uploadErr } = await supabaseAdmin
    .storage
    .from('trade-in-labels')          // bucket name — create this in Supabase Storage
    .upload(fileName, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    return res.status(500).json({ error: 'Storage upload failed: ' + uploadErr.message });
  }

  // ── Get public URL ────────────────────────────────────────
  const { data: urlData } = supabaseAdmin
    .storage
    .from('trade-in-labels')
    .getPublicUrl(fileName);

  const labelUrl = urlData.publicUrl;

  // ── Update submission record ──────────────────────────────
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('trade_in_submissions')
    .update({
      shipping_label_url: labelUrl,
      tracking_number: trackingNumber || null,
      status: sub.status === 'pending' ? 'approved' : sub.status,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return res.status(500).json({ error: updateErr.message });
  }

  // ── Email shipping label to customer ─────────────────────
  await sendShippingLabel(sub, labelUrl).catch(console.error);

  return res.status(200).json({ success: true, labelUrl, submission: updated });
});
