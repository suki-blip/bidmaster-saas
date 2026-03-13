import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { bid_request_id } = req.body;
  const { data: assignments } = await supabaseAdmin
    .from('bid_request_vendors')
    .select('*, vendor:vendors(name,email), bid_request:bid_requests(title,due_date)')
    .eq('bid_request_id', bid_request_id);
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const results = [];
  for (const a of assignments) {
    const link = appUrl + '/vendor.html?token=' + a.token;
    try {
      await resend.emails.send({
        from: 'BidMaster <bids@bidmaster.app>',
        to: a.vendor.email,
        subject: 'New Bid Request: ' + a.bid_request.title,
        html: '<p>Hello ' + a.vendor.name + ',</p><p>You have a new bid request: <strong>' + a.bid_request.title + '</strong></p><p><a href="' + link + '">Submit your bid here</a></p>'
      });
      results.push({ vendor: a.vendor.email, status: 'sent' });
    } catch(e) {
      results.push({ vendor: a.vendor.email, status: 'failed', error: e.message });
    }
  }
  await supabaseAdmin.from('bid_requests').update({ status: 'sent' }).eq('id', bid_request_id);
  res.status(200).json({ results });
}