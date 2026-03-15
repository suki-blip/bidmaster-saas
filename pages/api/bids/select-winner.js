import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { bid_id, bid_request_id } = req.body;
  if (!bid_id || !bid_request_id) return res.status(400).json({ error: 'bid_id and bid_request_id are required' });

  // Mark winner
  await supabaseAdmin.from('bids').update({ status: 'selected' }).eq('id', bid_id);
  // Reject others
  await supabaseAdmin.from('bids').update({ status: 'rejected' }).eq('bid_request_id', bid_request_id).neq('id', bid_id);
  // Close bid request
  await supabaseAdmin.from('bid_requests').update({ status: 'closed' }).eq('id', bid_request_id);

  res.status(200).json({ success: true });
}
