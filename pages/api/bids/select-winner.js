import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { bid_id, bid_request_id } = req.body;
  await supabaseAdmin.from('bids').update({ status: 'winner' }).eq('id', bid_id);
  await supabaseAdmin.from('bids').update({ status: 'rejected' }).eq('bid_request_id', bid_request_id).neq('id', bid_id);
  await supabaseAdmin.from('bid_requests').update({ status: 'awarded', winner_bid_id: bid_id }).eq('id', bid_request_id);
  const { data: allBids } = await supabaseAdmin.from('bids').select('*, vendor:vendors(name,email)').eq('bid_request_id', bid_request_id);
  for (const b of allBids) {
    const isWinner = b.id === bid_id;
    try {
      await resend.emails.send({
        from: 'BidMaster <bids@bidmaster.app>',
        to: b.vendor.email,
        subject: isWinner ? 'Congratulations! You won the bid' : 'Bid Result Notification',
        html: isWinner ? '<p>Congratulations! Your bid has been selected.</p>' : '<p>Thank you for your submission. Unfortunately your bid was not selected this time.</p>'
      });
    } catch(e) {}
  }
  res.status(200).json({ success: true });
}