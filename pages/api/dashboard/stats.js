import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const [projects, vendors, bids, activity] = await Promise.all([
    supabaseAdmin.from('projects').select('id', { count: 'exact' }),
    supabaseAdmin.from('vendors').select('id', { count: 'exact' }),
    supabaseAdmin.from('bids').select('id', { count: 'exact' }),
    supabaseAdmin.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10)
  ]);
  res.status(200).json({
    projects: projects.count || 0,
    vendors: vendors.count || 0,
    bids: bids.count || 0,
    activity: activity.data || []
  });
}