import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { token } = req.query;
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('bid_request_vendors')
      .select('*, vendor:vendors(name,email), bid_request:bid_requests(title,description,due_date,fields)')
      .eq('token', token)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Invalid token' });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { line_items, notes, total_amount } = req.body;
    const { data: assignment } = await supabaseAdmin.from('bid_request_vendors').select('vendor_id,bid_request_id').eq('token', token).single();
    if (!assignment) return res.status(404).json({ error: 'Invalid token' });
    const { data: bid, error } = await supabaseAdmin.from('bids').insert([{
      bid_request_id: assignment.bid_request_id,
      vendor_id: assignment.vendor_id,
      notes, total_amount, status: 'submitted'
    }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (line_items) {
      await supabaseAdmin.from('bid_line_items').insert(line_items.map(li => ({ ...li, bid_id: bid.id })));
    }
    await supabaseAdmin.from('bid_request_vendors').update({ status: 'submitted' }).eq('token', token);
    return res.status(201).json(bid);
  }
  res.status(405).json({ error: 'Method not allowed' });
}