import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('vendors').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { name, email, phone, specialty, org_id } = req.body;
    const { data, error } = await supabaseAdmin.from('vendors').upsert([{ name, email, phone, specialty, org_id }], { onConflict: 'org_id,email' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  res.status(405).json({ error: 'Method not allowed' });
}