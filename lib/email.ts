import nodemailer from 'nodemailer';

// ─── TRANSPORT ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM         = process.env.EMAIL_FROM         || 'tradein@bettergolfclubs.shop';
const ADMIN_EMAIL  = process.env.ADMIN_ALERT_EMAIL  || 'admin@bettergolfclubs.shop';
const ADMIN_URL    = process.env.ADMIN_PANEL_URL    || '';
const STORE_URL    = process.env.STORE_URL          || 'https://bettergolfclubs.shop';
const GREEN        = '#124c33';
const BRAND_NAME   = 'Better Golf Clubs';

// ─── TYPES ────────────────────────────────────────────────────
interface SubRow {
  id:             string;
  ref_code?:      string;
  customer_name:  string;
  customer_email: string;
  brand:          string;
  model:          string;
  condition:      string;
  payment_type:   string;
  quoted_cash?:   number | null;
  quoted_credit?: number | null;
  member_code?:   string | null;
  address?:       string | null;
  collection_date?: string | null;
  discount_code?: string | null;
  gift_card_code?: string | null;
}

// What submit.ts now passes to sendConfirmation / sendAdminAlert
interface MultiSubPayload {
  subs:        SubRow[];
  paymentType: string;
  totalVal?:   number;
}

// ─── HELPERS ─────────────────────────────────────────────────
function fmt(v: number | null | undefined) {
  if (!v && v !== 0) return '—';
  return '$' + Math.round(v).toLocaleString();
}

function condLabel(c: string) {
  const map: Record<string, string> = {
    new: 'New', above_avg: 'Above Average', avg: 'Average', below_avg: 'Below Average',
  };
  return map[c] || c;
}

function ref(sub: SubRow) {
  return '#' + (sub.ref_code || sub.id.slice(0, 8).toUpperCase());
}

function row(label: string, value: string) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;
              padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px">
    <span style="color:#6b7280">${label}</span>
    <span style="font-weight:600;color:#1f2937">${value}</span>
  </div>`;
}

function rowHL(label: string, value: string) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;
              padding:10px 0;font-size:16px;font-weight:700">
    <span style="color:#1f2937">${label}</span>
    <span style="color:${GREEN}">${value}</span>
  </div>`;
}

// Renders a compact club row for multi-club summaries
function clubRow(sub: SubRow, paymentType: string) {
  const val = paymentType === 'credit' ? sub.quoted_credit : sub.quoted_cash;
  return `
  <div style="display:flex;justify-content:space-between;align-items:baseline;
              padding:7px 0;border-bottom:1px solid #e5e7eb;font-size:13px">
    <span style="color:#1f2937;font-weight:500">
      ${sub.brand} ${sub.model}
      <span style="color:#9ca3af;font-weight:400;font-size:12px"> — ${condLabel(sub.condition)}</span>
    </span>
    <span style="font-weight:700;color:${GREEN};white-space:nowrap">
      ${val ? fmt(val) : 'Pending review'}
    </span>
  </div>`;
}

// ─── BASE TEMPLATE ────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${BRAND_NAME} Trade-In</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;
              border-radius:12px;overflow:hidden;
              box-shadow:0 4px 24px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:${GREEN};padding:32px 28px;text-align:center">
      <div style="color:rgba(255,255,255,.6);font-size:11px;font-weight:700;
                  letter-spacing:3px;text-transform:uppercase;margin-bottom:6px">
        ${BRAND_NAME.toUpperCase()}
      </div>
      <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px">
        Trade-In Programme
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px">${content}</div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;
                text-align:center;font-size:12px;color:#9ca3af;line-height:1.6">
      ${BRAND_NAME} &bull;
      <a href="mailto:${ADMIN_EMAIL}" style="color:#9ca3af">${ADMIN_EMAIL}</a><br>
      <span style="font-size:11px">Automated message — please do not reply directly.</span>
    </div>

  </div>
</body>
</html>`;
}

// ─── 1. CUSTOMER CONFIRMATION (new submission) ────────────────
export async function sendConfirmation({ subs, paymentType, totalVal }: MultiSubPayload) {
  const first      = subs[0];
  const isMulti    = subs.length > 1;
  const isCredit   = paymentType === 'credit';
  const payLabel   = isCredit ? 'Store Credit' : 'Cash';
  const valueLabel = isCredit ? 'Estimated Store Credit' : 'Estimated Cash Value';
  const refNum     = ref(first);

  // Club summary block — single or itemised list
  const clubsBlock = isMulti
    ? `<div style="margin-bottom:4px">
         ${subs.map(s => clubRow(s, paymentType)).join('')}
       </div>
       ${rowHL(`Total ${payLabel}`, fmt(totalVal))}`
    : `${row('Club', `${first.brand} ${first.model}`)}
       ${row('Condition', condLabel(first.condition))}
       ${rowHL(valueLabel, fmt(totalVal))}`;

  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      Hi ${first.customer_name},
    </p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Thanks for submitting your trade-in${isMulti ? ` (${subs.length} clubs)` : ''}!
      Our team will review it within <strong>1 business day</strong> and send you
      a prepaid shipping label.
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:22px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                  letter-spacing:1px;color:#6b7280;margin-bottom:14px">
        Quote Summary
      </div>
      ${row('Reference', refNum)}
      ${row('Payment Type', payLabel)}
      ${first.member_code ? row('Member Code', first.member_code + ' ✓') : ''}
      ${clubsBlock}
    </div>

    <div style="background:#edf5f0;border-left:4px solid ${GREEN};
                border-radius:0 8px 8px 0;padding:16px 18px;margin-bottom:24px">
      <strong style="color:${GREEN};font-size:13px">What happens next?</strong>
      <ol style="color:#374151;font-size:13px;margin:8px 0 0;padding-left:18px;line-height:1.8">
        <li>We verify your quote <em>(within 1 business day)</em></li>
        <li>A <strong>prepaid shipping label</strong> is emailed to you</li>
        <li>Pack your ${isMulti ? 'clubs' : 'club'}, tape the shipping label, and wait for courier collection</li>
        <li>Once inspected, your ${isCredit ? 'store credit is issued' : 'payment is processed'}</li>
      </ol>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">
      Questions? Email us at
      <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  const subjectClub = isMulti
    ? `${subs.length} Clubs`
    : `${first.brand} ${first.model}`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      first.customer_email,
    subject: `Trade-In Received — ${subjectClub} (${refNum})`,
    html:    baseTemplate(content),
  });
}

// ─── 2. ADMIN ALERT (new submission) ─────────────────────────
export async function sendAdminAlert({ subs, paymentType, totalVal }: MultiSubPayload) {
  const first    = subs[0];
  const isMulti  = subs.length > 1;
  const isCredit = paymentType === 'credit';
  const refNum   = ref(first);

  const clubsBlock = isMulti
    ? subs.map(s => clubRow(s, paymentType)).join('')
    : `${row('Club', `${first.brand} ${first.model}`)}
       ${row('Condition', condLabel(first.condition))}`;

  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      A new trade-in has been submitted and is waiting for review.
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:22px;margin-bottom:24px">
      ${row('Reference', refNum)}
      ${row('Customer', `${first.customer_name} &lt;${first.customer_email}&gt;`)}
      ${first.customer_email ? '' : ''}
      ${row('Payment', isCredit ? 'Store Credit' : 'Cash')}
      ${clubsBlock}
      ${rowHL('Total Quoted', fmt(totalVal))}
      ${first.member_code ? row('Member Code', first.member_code) : ''}
      ${first.collection_date ? row('Collection Date', first.collection_date) : ''}
    </div>

    <div style="text-align:center;margin-bottom:8px">
      <a href="${ADMIN_URL}?submission=${first.id}"
         style="display:inline-block;background:${GREEN};color:#fff;
                padding:13px 32px;border-radius:8px;font-weight:700;
                font-size:14px;text-decoration:none">
        Review in Admin Panel →
      </a>
    </div>`;

  const subjectClub = isMulti
    ? `${subs.length} clubs — ${first.customer_name}`
    : `${first.brand} ${first.model} — ${first.customer_name}`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      ADMIN_EMAIL,
    subject: `[New Trade-In] ${subjectClub} — ${fmt(totalVal)} ${isCredit ? 'credit' : 'cash'}`,
    html:    baseTemplate(content),
  });
}

// ─── 3. APPROVAL — STORE CREDIT ──────────────────────────────
export async function sendApprovalCredit(sub: SubRow, giftCardCode: string) {
  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Great news — your trade-in has been <strong style="color:${GREEN}">approved!</strong>
      Your store credit is ready to use.
    </p>

    <div style="background:${GREEN};border-radius:12px;padding:28px;
                text-align:center;margin-bottom:24px">
      <div style="color:rgba(255,255,255,.65);font-size:11px;font-weight:700;
                  letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">
        Your Store Credit Code
      </div>
      <div style="color:#fff;font-size:30px;font-weight:800;
                  letter-spacing:5px;font-family:monospace">
        ${giftCardCode}
      </div>
      <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:10px">
        ${fmt(sub.quoted_credit)} credit &bull; No expiry
      </div>
    </div>

    <div style="background:#f8f9fa;border-radius:10px;padding:18px;margin-bottom:24px">
      <strong style="color:#374151;font-size:13px">How to redeem:</strong>
      <ol style="color:#374151;font-size:13px;margin:8px 0 0;padding-left:18px;line-height:1.8">
        <li>Shop at <a href="${STORE_URL}" style="color:${GREEN}">${STORE_URL.replace('https://', '')}</a></li>
        <li>Proceed to checkout and find the gift card / discount field</li>
        <li>Enter <strong style="font-family:monospace">${giftCardCode}</strong></li>
        <li>Credit applies automatically — no expiry</li>
      </ol>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">
      Need help?
      <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `Trade-In Approved — ${fmt(sub.quoted_credit)} Store Credit Ready!`,
    html:    baseTemplate(content),
  });
}

// ─── 4. APPROVAL — CASH ───────────────────────────────────────
export async function sendApprovalCash(sub: SubRow) {
  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Your trade-in has been <strong style="color:${GREEN}">approved!</strong>
      We'll transfer <strong>${fmt(sub.quoted_cash)}</strong> to your nominated account.
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:18px;margin-bottom:24px">
      ${row('Club', `${sub.brand} ${sub.model}`)}
      ${rowHL('Cash Payment', fmt(sub.quoted_cash))}
      ${row('Processing Time', '3–5 business days after we receive your club')}
    </div>

    <div style="background:#eff6ff;border-left:4px solid #2563eb;
                border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <strong style="color:#2563eb;font-size:13px">Next step:</strong>
      <p style="color:#374151;font-size:13px;margin:6px 0 0">
        We'll email you a <strong>prepaid shipping label</strong> shortly.
        Payment is released once we receive and inspect your club.
      </p>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">
      Questions?
      <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `Trade-In Approved — ${fmt(sub.quoted_cash)} Cash Payment Incoming`,
    html:    baseTemplate(content),
  });
}

// ─── 5. SHIPPING LABEL ────────────────────────────────────────
export async function sendShippingLabel(sub: SubRow, labelUrl: string) {
  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Your prepaid shipping label is ready. Please follow the steps below.
    </p>

    <div style="text-align:center;margin-bottom:28px">
      <a href="${labelUrl}"
         style="display:inline-block;background:${GREEN};color:#fff;
                padding:14px 36px;border-radius:8px;font-weight:700;
                font-size:15px;text-decoration:none">
        📄 Download Shipping Label (PDF) →
      </a>
    </div>
    <p style="text-align:center;color:#6b7280;font-size:12px;margin:-20px 0 24px">
      Click the button above to open or save your PDF shipping label.
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:18px;margin-bottom:24px">
      <strong style="color:#374151;font-size:13px;display:block;margin-bottom:10px">
        Packing instructions:
      </strong>
      <ol style="color:#374151;font-size:13px;margin:0;padding-left:18px;line-height:1.8">
        <li>Wrap your club securely in bubble wrap or newspaper</li>
        <li>Place in a sturdy box (max <strong>120cm × 15cm × 15cm</strong>)</li>
        <li>Print and attach the label to the outside of the box</li>
        <li>Drop off at any compatible courier location</li>
      </ol>
    </div>

    <div style="background:#f8f9fa;border-radius:10px;padding:14px 18px">
      ${row('Club', `${sub.brand} ${sub.model}`)}
      ${row('Reference', ref(sub))}
    </div>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `Shipping Label Ready — ${sub.brand} ${sub.model} (${ref(sub)})`,
    html:    baseTemplate(content),
  });
}

// ─── 6. REJECTION ────────────────────────────────────────────
export async function sendRejection(sub: SubRow, reason?: string) {
  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 20px">
      Thank you for your trade-in request for your
      <strong>${sub.brand} ${sub.model}</strong>.
      Unfortunately, we're unable to proceed with this trade-in at this time.
    </p>

    ${reason ? `
    <div style="background:#fef2f2;border-left:4px solid #dc2626;
                border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <strong style="color:#dc2626;font-size:13px">Reason:</strong>
      <p style="color:#374151;font-size:13px;margin:6px 0 0">${reason}</p>
    </div>` : ''}

    <p style="color:#374151;font-size:14px;margin:0 0 20px">
      If you have any questions or think this was made in error,
      please don't hesitate to get in touch.
    </p>

    <p style="color:#6b7280;font-size:13px;margin:0">
      <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `Update on Your Trade-In — ${sub.brand} ${sub.model}`,
    html:    baseTemplate(content),
  });
}

// ─── 7. REVIEWING ─────────────────────────────────────────────
export async function sendReviewing(sub: SubRow) {
  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Good news — our team has started reviewing your trade-in request.
      We'll be in touch shortly with the outcome.
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:18px;margin-bottom:24px">
      ${row('Club', `${sub.brand} ${sub.model}`)}
      ${row('Reference', ref(sub))}
      ${row('Status', 'Under Review')}
    </div>

    <div style="background:#edf5f0;border-left:4px solid ${GREEN};
                border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <strong style="color:${GREEN};font-size:13px">What happens next?</strong>
      <p style="color:#374151;font-size:13px;margin:6px 0 0">
        Once our team has reviewed your club, you'll receive an email confirming
        whether it's been approved along with your payment details.
        This usually takes <strong>1 business day</strong>.
      </p>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">
      Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `We're Reviewing Your Trade-In — ${sub.brand} ${sub.model}`,
    html:    baseTemplate(content),
  });
}

// ─── 8. SHIPPED (club received, being processed) ──────────────
export async function sendShipped(sub: SubRow) {
  const isCredit = sub.payment_type === 'credit';
  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Great news — we've received your <strong>${sub.brand} ${sub.model}</strong>
      and it's now being inspected by our team.
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:18px;margin-bottom:24px">
      ${row('Club', `${sub.brand} ${sub.model}`)}
      ${row('Reference', ref(sub))}
      ${row('Payment Type', isCredit ? 'Store Credit' : 'Cash')}
      ${isCredit
        ? row('Credit Value', `${sub.quoted_credit ? '$' + Math.round(sub.quoted_credit).toLocaleString() : 'As quoted'}`)
        : row('Cash Payment', `${sub.quoted_cash ? '$' + Math.round(sub.quoted_cash).toLocaleString() : 'As quoted'}`)
      }
    </div>

    <div style="background:#edf5f0;border-left:4px solid ${GREEN};
                border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <strong style="color:${GREEN};font-size:13px">Almost there!</strong>
      <p style="color:#374151;font-size:13px;margin:6px 0 0">
        We're inspecting your club now. Once complete, your
        ${isCredit ? 'store credit code will be emailed to you' : 'cash payment will be processed to your account'}.
        This usually takes <strong>1–2 business days</strong>.
      </p>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">
      Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `We've Received Your Club — ${sub.brand} ${sub.model} (${ref(sub)})`,
    html:    baseTemplate(content),
  });
}

// ─── 9. COMPLETE ──────────────────────────────────────────────
export async function sendComplete(sub: SubRow) {
  const isCredit = sub.payment_type === 'credit';
  const code     = sub.discount_code || sub.gift_card_code || null;

  const content = `
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${sub.customer_name},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px">
      Your trade-in is now <strong style="color:${GREEN}">complete!</strong>
      ${isCredit
        ? 'Your store credit is ready to use.'
        : 'Your cash payment has been processed.'}
    </p>

    <div style="background:#f8f9fa;border-radius:10px;padding:18px;margin-bottom:24px">
      ${row('Club', `${sub.brand} ${sub.model}`)}
      ${row('Reference', ref(sub))}
      ${isCredit
        ? row('Store Credit', `$${sub.quoted_credit ? Math.round(sub.quoted_credit).toLocaleString() : '—'}`)
        : row('Cash Payment', `$${sub.quoted_cash ? Math.round(sub.quoted_cash).toLocaleString() : '—'}`)}
      ${code ? row('Credit Code', code) : ''}
    </div>

    ${isCredit && code ? `
    <div style="background:${GREEN};border-radius:12px;padding:22px;
                text-align:center;margin-bottom:24px">
      <div style="color:rgba(255,255,255,.65);font-size:11px;font-weight:700;
                  letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">
        Your Store Credit Code
      </div>
      <div style="color:#fff;font-size:28px;font-weight:800;
                  letter-spacing:5px;font-family:monospace">
        ${code}
      </div>
    </div>` : ''}

    <div style="background:#edf5f0;border-left:4px solid ${GREEN};
                border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <strong style="color:${GREEN};font-size:13px">Thank you!</strong>
      <p style="color:#374151;font-size:13px;margin:6px 0 0">
        Thanks for trading in with ${BRAND_NAME}. We hope to see you again soon —
        check out our latest range at
        <a href="${STORE_URL}" style="color:${GREEN}">${STORE_URL.replace('https://', '')}</a>.
      </p>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0">
      Questions? <a href="mailto:${ADMIN_EMAIL}" style="color:${GREEN}">${ADMIN_EMAIL}</a>
    </p>`;

  await transporter.sendMail({
    from:    `"${BRAND_NAME} Trade-In" <${FROM}>`,
    to:      sub.customer_email,
    subject: `Trade-In Complete — ${sub.brand} ${sub.model} (${ref(sub)})`,
    html:    baseTemplate(content),
  });
}
