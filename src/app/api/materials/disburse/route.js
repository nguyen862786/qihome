import { NextResponse } from 'next/server';
import { verifyQRToken } from '@/lib/qrToken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Mã Token QR trống.' }, { status: 400 });
    }

    // Verify token expiration & validity
    const result = await verifyQRToken(token);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { projectCode, sku, quantity } = result.payload;

    // In a real system, we execute database queries inside a transaction:
    // 1. Check current inventory and confirm we don't exceed the BOM allocation
    // 2. Update disbursed_quantity in public.bom_materials
    // 3. Insert or update record in public.material_requests to status 'disbursed_in_warehouse'
    // 4. Write to public.audit_logs

    return NextResponse.json({
      success: true,
      message: 'Xác thực xuất kho thành công!',
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
