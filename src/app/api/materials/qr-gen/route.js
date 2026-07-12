import { NextResponse } from 'next/server';
import { generateQRToken } from '@/lib/qrToken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectCode, sku, quantity } = body;

    if (!projectCode || !sku || !quantity || Number(quantity) <= 0) {
      return NextResponse.json({ error: 'Thông tin dự án, vật tư hoặc số lượng không hợp lệ.' }, { status: 400 });
    }

    // In a real database environment, we would also verify if the requested quantity is within the baseline BOM
    // by querying public.bom_materials table:
    // select (allocated_quantity - disbursed_quantity) as remaining from public.bom_materials where project_id = ... and sku = ...
    
    // Generate secure QR JWT Token (Valid for 60 minutes)
    const token = await generateQRToken(projectCode, sku, quantity);

    return NextResponse.json({
      success: true,
      token,
      expiresIn: '60 phút',
      payload: { projectCode, sku, quantity }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi sinh mã QR: ' + error.message }, { status: 500 });
  }
}
