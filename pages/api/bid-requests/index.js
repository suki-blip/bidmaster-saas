import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { project_id } = req.query;
    let query = supabaseAdmin.from('bid_requests').select('*, project:projects(name), bid_request_vendors(*, vendor:vendors(name,email))');
    if (project_id) query = query.eq('project_id', project_id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { project_id, title, description, due_date, fields, vendor_ids, org_id } = req.body;
    const { data: br, error } = await supabaseAdmin.from('bid_requests').insert([{ project_id, title, description, due_date, fields, org_id }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (vendor_ids && vendor_ids.length > 0) {
      const assignments = vendor_ids.map(vid => ({ bid_request_id: br.id, vendor_id: vid, token: uuidv4() }));
      await supabaseAdmin.from('bid_request_vendors').insert(assignments);
    }
    return res.status(201).json(br);
  }
  res.status(405).json({ error: 'Method not allowed' });
}