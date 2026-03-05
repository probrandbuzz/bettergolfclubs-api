import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow calculator to fetch this from any origin (Shopify, admin panel, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin
    .from('trade_in_pricing')
    .select('club_type, brand, model, price_new, price_above_avg, price_avg, price_below_avg')
    .eq('active', true)
    .order('club_type').order('brand').order('model');

  if (error) {
    console.error('[pricing] Supabase error:', error);
    return res.status(500).json({ error: 'Failed to load pricing' });
  }

  // Transform flat rows into the shape the calculator expects:
  // { types: string[], brands: Record<type, string[]>, models: Record<"type|brand", entry[]> }
  const typesSet = new Set<string>();
  const brands: Record<string, Set<string>> = {};
  const models: Record<string, Array<{
    model: string; new: number; above_avg: number; avg: number; below_avg: number;
  }>> = {};

  for (const row of data) {
    typesSet.add(row.club_type);
    if (!brands[row.club_type]) brands[row.club_type] = new Set();
    brands[row.club_type].add(row.brand);

    const key = `${row.club_type}|${row.brand}`;
    if (!models[key]) models[key] = [];
    models[key].push({
      model:     row.model,
      new:       Number(row.price_new),
      above_avg: Number(row.price_above_avg),
      avg:       Number(row.price_avg),
      below_avg: Number(row.price_below_avg),
    });
  }

  const result = {
    types:  Array.from(typesSet),
    brands: Object.fromEntries(
      Object.entries(brands).map(([k, v]) => [k, Array.from(v)])
    ),
    models,
  };

  // No caching -- every request hits Supabase so admin changes are immediately live
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.status(200).json(result);
}
