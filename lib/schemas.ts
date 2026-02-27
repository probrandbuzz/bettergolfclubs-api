import { z } from 'zod';

// ─── CART ITEM (one club in a multi-club submission) ─────────
export const CartItemSchema = z.object({
  brand:        z.string().min(1),
  model:        z.string().min(1),
  clubType:     z.string().min(1),
  condition:    z.enum(['new','above_avg','avg','below_avg']),
  condLabel:    z.string(),
  ironConfig:   z.string().optional(),
  missingClubs: z.array(z.string()).optional().default([]),
  cashVal:      z.number().nonnegative(),
  creditVal:    z.number().nonnegative(),
  notFound:     z.boolean().default(false),
});

// ─── SUBMIT TRADE-IN ─────────────────────────────────────────
export const SubmitSchema = z.object({
  // Multi-club cart (always an array; single club = array of 1)
  clubs: z.array(CartItemSchema).min(1, 'At least one club required'),

  // Step 2 — valuation totals
  paymentType:  z.enum(['credit','cash']),
  totalCash:    z.number().nonnegative().optional(),
  totalCredit:  z.number().nonnegative().optional(),
  memberCode:   z.string().optional(),
  memberBonus:  z.number().min(0).max(1).optional(),

  // Step 3 — contact
  customerName:  z.string().min(1, 'Name required'),
  customerEmail: z.string().email('Valid email required'),
  customerPhone: z.string().optional(),

  // Shipping (both payment types need this)
  address:        z.string().optional(),
  collectionDate: z.string().optional(),

  // Cash-only banking
  bsb:           z.string().optional(),
  accountNumber: z.string().optional(),

  // Box measurements (replaces notes)
  boxMeasurements: z.string().optional(),

  // Shopify pass-through (optional)
  shopifyCustomerId: z.string().optional(),
}).superRefine((data, ctx) => {
  // Both payment types require address + collection date
  if (!data.address?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['address'], message: 'Address is required' });
  }
  if (!data.collectionDate) {
    ctx.addIssue({ code: 'custom', path: ['collectionDate'], message: 'Collection date is required' });
  } else {
    const d = new Date(data.collectionDate);
    const min = new Date();
    min.setDate(min.getDate() + 1);
    min.setHours(0, 0, 0, 0);
    if (d < min) {
      ctx.addIssue({ code: 'custom', path: ['collectionDate'], message: 'Date must be at least 1 day from today' });
    }
  }
  // Cash also requires banking details
  if (data.paymentType === 'cash') {
    if (!data.bsb?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['bsb'], message: 'BSB required for cash payment' });
    }
    if (!data.accountNumber?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['accountNumber'], message: 'Account number required for cash payment' });
    }
  }
});

// ─── VALIDATE CODE ───────────────────────────────────────────
export const ValidateCodeSchema = z.object({
  code: z.string().min(1, 'Code required').max(30),
});

// ─── ADMIN: UPDATE STATUS ────────────────────────────────────
export const UpdateStatusSchema = z.object({
  id:     z.string().uuid(),
  status: z.enum(['pending','reviewing','approved','rejected','shipped','complete']),
  adminNotes: z.string().optional(),
});

// ─── ADMIN: APPROVE ──────────────────────────────────────────
export const ApproveSchema = z.object({
  id:           z.string().uuid(),
  useGiftCard:  z.boolean().default(true), // false = use discount code
  adminNotes:   z.string().optional(),
});

// ─── ADMIN: ATTACH LABEL ─────────────────────────────────────
export const AttachLabelSchema = z.object({
  id:              z.string().uuid(),
  shippingLabelUrl: z.string().url('Valid URL required'),
  trackingNumber:   z.string().optional(),
});

// ─── ADMIN: UPSERT PRICING ───────────────────────────────────
export const UpsertPricingSchema = z.object({
  clubType:    z.string().min(1),
  brand:       z.string().min(1),
  model:       z.string().min(1),
  priceNew:       z.number().positive(),
  priceAboveAvg:  z.number().positive(),
  priceAvg:       z.number().positive(),
  priceBelowAvg:  z.number().positive(),
  active:      z.boolean().default(true),
});

// ─── ADMIN: UPSERT CODE ──────────────────────────────────────
export const UpsertCodeSchema = z.object({
  code:       z.string().min(2).max(30).toUpperCase(),
  label:      z.string().min(1),
  bonus:      z.number().min(0.01).max(1),
  active:     z.boolean().default(true),
  maxUses:    z.number().int().positive().optional(),
  expiresAt:  z.string().datetime().optional(),
});
