import { NextResponse } from 'next/server';
import { verifyQRToken } from '@/lib/qrToken';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Mã Token QR trống.' }, { status: 400 });
    }

    // 1. Verify token expiration & validity via jose
    const result = await verifyQRToken(token);
    if (!result.valid) {
      return NextResponse.json({ error: `Token không hợp lệ hoặc đã hết hạn: ${result.error}` }, { status: 400 });
    }

    const { projectCode, sku, quantity } = result.payload;

    // Check if Supabase URL has been configured from template
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

    if (isConfigured) {
      // 2. Query Project from DB
      const { data: project, error: pError } = await supabase
        .from('projects')
        .select('id, project_code')
        .eq('project_code', projectCode)
        .single();

      if (pError || !project) {
        return NextResponse.json({ error: `Không tìm thấy dự án ${projectCode} trong hệ thống.` }, { status: 404 });
      }

      // 3. Query remaining BOM allocation
      const { data: bom, error: bError } = await supabase
        .from('bom_materials')
        .select('id, allocated_quantity, disbursed_quantity')
        .eq('project_id', project.id)
        .eq('sku', sku)
        .single();

      if (bError || !bom) {
        return NextResponse.json({ error: `Vật tư SKU ${sku} không có trong danh mục định mức BOM của dự án này.` }, { status: 404 });
      }

      const remaining = bom.allocated_quantity - bom.disbursed_quantity;
      if (quantity > remaining) {
        return NextResponse.json({ 
          error: `Số lượng xuất kho (${quantity}) vượt định mức còn lại của BOM (${remaining}). Vui lòng xin duyệt cấp bù từ Chủ tịch.` 
        }, { status: 400 });
      }

      // 4. Update disbursed quantity in DB
      const { error: updError } = await supabase
        .from('bom_materials')
        .update({ disbursed_quantity: bom.disbursed_quantity + Number(quantity) })
        .eq('id', bom.id);

      if (updError) throw updError;

      // 5. Update material request status to 'disbursed_in_warehouse'
      const { data: matReq } = await supabase
        .from('material_requests')
        .update({ status: 'disbursed_in_warehouse' })
        .eq('qr_code_token', token)
        .select('id')
        .single();

      // 6. Write Audit Log
      await supabase
        .from('audit_logs')
        .insert([
          {
            user_id: 'a0000000-0000-0000-0000-000000000002', // Warehouse system user context
            action: 'WAREHOUSE_DISBURSE_COMPLETED',
            table_name: 'bom_materials',
            record_id: bom.id,
            new_data: { projectCode, sku, quantity, request_id: matReq?.id }
          }
        ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Xác thực xuất kho thành công và đã cập nhật trừ lùi BOM!',
      details: {
        projectCode,
        sku,
        quantity,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xử lý xuất kho: ' + error.message }, { status: 500 });
  }
}
