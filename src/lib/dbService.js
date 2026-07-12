import { supabase } from './supabase';

/**
 * database service abstractions for QiHome.vn
 * handles all standard data operations against Supabase tables with active RLS
 */

// 1. Auth & Profiles
export async function dbFetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function dbFetchProfileByPhone(phone) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_number', phone)
    .single();
  return { data, error };
}

// 2. Projects & Micro-Projects
export async function dbFetchProjects(role, userId) {
  let query = supabase.from('projects').select(`
    *,
    sales:sales_id(full_name, phone_number),
    site_manager:site_manager_id(full_name, phone_number),
    subcontractor:subcontractor_id(full_name, phone_number)
  `);

  if (role === 'site_manager') {
    query = query.eq('site_manager_id', userId);
  } else if (role === 'subcontractor') {
    query = query.eq('subcontractor_id', userId);
  } else if (role === 'sales') {
    query = query.eq('sales_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

// 3. BOM Materials
export async function dbFetchBOM(projectId) {
  const { data, error } = await supabase
    .from('bom_materials')
    .select('*')
    .eq('project_id', projectId);
  return { data, error };
}

// 4. Material Requests
export async function dbFetchMaterialRequests(projectId, subcontractorId = null) {
  let query = supabase
    .from('material_requests')
    .select('*')
    .eq('project_id', projectId);
  
  if (subcontractorId) {
    query = query.eq('subcontractor_id', subcontractorId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function dbCreateMaterialRequest({ projectId, subcontractorId, sku, quantity, isOverBudget, evidenceImageUrl }) {
  const { data, error } = await supabase
    .from('material_requests')
    .insert([
      {
        project_id: projectId,
        subcontractor_id: subcontractorId,
        sku,
        requested_quantity: quantity,
        is_over_budget: isOverBudget,
        evidence_image_url: evidenceImageUrl,
        status: 'pending_approval'
      }
    ])
    .select()
    .single();
  return { data, error };
}

// 5. Site Reports & QC Checklist
export async function dbFetchSiteReports(projectId) {
  const { data, error } = await supabase
    .from('site_reports')
    .select(`
      *,
      subcontractor:subcontractor_id(full_name)
    `)
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false });
  return { data, error };
}

export async function dbCreateSiteReport({ projectId, subcontractorId, imageUrl, lat, lng }) {
  const { data, error } = await supabase
    .from('site_reports')
    .insert([
      {
        project_id: projectId,
        subcontractor_id: subcontractorId,
        image_url: imageUrl,
        gps_latitude: lat,
        gps_longitude: lng,
        qc_status: 'pending'
      }
    ])
    .select()
    .single();
  return { data, error };
}

export async function dbUpdateQCStatus(reportId, status, notes) {
  const { data, error } = await supabase
    .from('site_reports')
    .update({ qc_status: status, qc_notes: notes })
    .eq('id', reportId)
    .select()
    .single();
  return { data, error };
}

// 6. Admin Approvals
export async function dbFetchPendingOverBudgetRequests() {
  const { data, error } = await supabase
    .from('material_requests')
    .select(`
      *,
      project:project_id(project_code),
      subcontractor:subcontractor_id(full_name)
    `)
    .eq('is_over_budget', true)
    .eq('status', 'pending_approval');
  return { data, error };
}

export async function dbApproveOverBudgetRequest(requestId, status) {
  // If approved, in real database context we would have a DB trigger to deduct stock
  const { data, error } = await supabase
    .from('material_requests')
    .update({ status: status }) // 'approved' or 'disbursed_in_warehouse' (denied is handled by changing status or deleting)
    .eq('id', requestId)
    .select()
    .single();
  return { data, error };
}

// 7. Commissions & Ledger for Accounting
export async function dbFetchCommissions(salesId = null) {
  let query = supabase.from('commissions').select(`
    *,
    project:project_id(project_code, client_name, total_amount)
  `);

  if (salesId) {
    query = query.eq('sales_id', salesId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}
