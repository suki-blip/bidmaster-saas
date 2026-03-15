import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { token } = req.query;

  if (req.method === 'GET') {
    // Find vendor by token
    const { data: vendor, error: vErr } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('token', token)
      .single();
    if (vErr || !vendor) return res.status(404).json({ error: 'Invalid token' });

    // Get all bid requests assigned to this vendor
    const { data: assignments } = await supabaseAdmin
      .from('bid_request_vendors')
      .select('bid_request_id')
      .eq('vendor_id', vendor.id);

    const bidRequestIds = assignments ? assignments.map(a => a.bid_request_id) : [];

    let bidRequests = [];
    if (bidRequestIds.length > 0) {
      const { data: brs } = await supabaseAdmin
        .from('bid_requests')
        .select('*, project:projects(name)')
        .in('id', bidRequestIds);
      bidRequests = brs || [];
    }

    // Get all bids submitted by this vendor
    const { data: bids } = await supabaseAdmin
      .from('bids')
      .select('*, bid_request:bid_requests(trade, project:projects(name))')
      .eq('vendor_id', vendor.id);

    return res.status(200).json({ vendor, bid_requests: bidRequests, bids: bids || [] });
  }

  if (req.method === 'POST') {
    const { bid_request_id, amount, notes } = req.body;
    if (!bid_request_id || !amount) return res.status(400).json({ error: 'bid_request_id and amount are required' });

    // Find vendor by token
    const { data: vendor, error: vErr } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('token', token)
      .single();
    if (vErr || !vendor) return res.status(404).json({ error: 'Invalid token' });

    const { data: bid, error } = await supabaseAdmin
      .from('bids')
      .insert([{ bid_request_id, vendor_id: vendor.id, amount, notes, status: 'pending' }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(bid);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
