import { NextResponse } from 'next/server';

// Mapping style to reference images copied to public/images
const STYLE_IMAGES = {
  indochine: '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg',
  modern: '/images/cb17520f98fa50444b4d580964fc69e7.jpg',
  minimalist: '/images/306d8ed842d197c34447a81976615549.jpg',
  neoclassical: '/images/1626aee735a6d69aa16af41338600615.jpg'
};

// Mock mapping of styles to BOQ materials
const STYLE_BOQ_ITEMS = {
  indochine: [
    { sku: 'SF-LTH-01', name: 'Sofa Da Cao Cấp Indochine', brand: 'QiPrime', price: 28000000, unit: 'Bộ', qty: 1 },
    { sku: 'LT-CHR-02', name: 'Đèn Chùm Pha Lê Indochine', brand: 'Euroto', price: 15000000, unit: 'Bộ', qty: 1 },
    { sku: 'AC-WD-402', name: 'Hệ Tủ Bếp Gỗ Melamine Cao Cấp', brand: 'An Cường', price: 4200000, unit: 'Mét tới', qty: 12 },
    { sku: 'BL-DAMP-05', name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', brand: 'Blum', price: 350000, unit: 'Bộ', qty: 20 },
    { sku: 'DL-UX-18', name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', brand: 'Dulux', price: 1200000, unit: 'Thùng', qty: 15 }
  ],
  modern: [
    { sku: 'SF-LTH-01', name: 'Sofa Da Nhập Khẩu Hiện Đại', brand: 'QiPrime', price: 35000000, unit: 'Bộ', qty: 1 },
    { sku: 'AC-WD-402', name: 'Hệ Tủ Gỗ Acrylic Phủ Bóng Hiện Đại', brand: 'An Cường', price: 5500000, unit: 'Mét tới', qty: 15 },
    { sku: 'BL-DAMP-05', name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', brand: 'Blum', price: 350000, unit: 'Bộ', qty: 25 },
    { sku: 'DL-UX-18', name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', brand: 'Dulux', price: 1200000, unit: 'Thùng', qty: 10 },
    { sku: 'KH-SNK-99', name: 'Bồn Rửa Chén Kohler Đẳng Cấp', brand: 'Kohler', price: 7800000, unit: 'Bộ', qty: 1 }
  ],
  minimalist: [
    { sku: 'SF-LTH-01', name: 'Sofa Vải Nỉ Tối Giản Nhập Khẩu', brand: 'QiPrime', price: 19000000, unit: 'Bộ', qty: 1 },
    { sku: 'AC-WD-402', name: 'Hệ Tủ Bếp MFC Tối Giản', brand: 'An Cường', price: 3800000, unit: 'Mét tới', qty: 10 },
    { sku: 'BL-DAMP-05', name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', brand: 'Blum', price: 350000, unit: 'Bộ', qty: 15 },
    { sku: 'DL-UX-18', name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', brand: 'Dulux', price: 1200000, unit: 'Thùng', qty: 8 }
  ],
  neoclassical: [
    { sku: 'SF-LTH-01', name: 'Sofa Tân Cổ Điển Hoàng Gia', brand: 'QiPrime', price: 55000000, unit: 'Bộ', qty: 1 },
    { sku: 'LT-CHR-02', name: 'Đèn Chùm Pha Lê Tân Cổ Điển', brand: 'Euroto', price: 25000000, unit: 'Bộ', qty: 1 },
    { sku: 'AC-WD-402', name: 'Hệ Tủ Bếp Gỗ Sơn Men Tân Cổ Điển', brand: 'An Cường', price: 6200000, unit: 'Mét tới', qty: 18 },
    { sku: 'BL-DAMP-05', name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', brand: 'Blum', price: 350000, unit: 'Bộ', qty: 30 },
    { sku: 'DL-UX-18', name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', brand: 'Dulux', price: 1200000, unit: 'Thùng', qty: 20 },
    { sku: 'KH-SNK-99', name: 'Bồn Rửa Chén Kohler Đẳng Cấp', brand: 'Kohler', price: 7800000, unit: 'Bộ', qty: 2 }
  ]
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { block, floorApartment, style, budget } = body;

    if (!block || !floorApartment || !style || !budget) {
      return NextResponse.json({ error: 'Thiếu thông tin căn hộ hoặc tuỳ chọn thiết kế.' }, { status: 400 });
    }

    // In a real production system, this API router would make a post request to:
    // https://api.replicate.com/v1/predictions
    // passing the Stable Diffusion + ControlNet configs & payload, and polling for the result.
    // Here we simulate the 2-second render processing and return a real matched image from the showroom database.
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI render delay

    const imageUrl = STYLE_IMAGES[style.toLowerCase()] || STYLE_IMAGES.modern;
    const boqItems = STYLE_BOQ_ITEMS[style.toLowerCase()] || STYLE_BOQ_ITEMS.modern;

    // Apply budget multipliers (mock adjustments)
    let budgetMultiplier = 1.0;
    if (budget === 'premium') budgetMultiplier = 1.25;
    if (budget === 'luxury') budgetMultiplier = 1.6;

    const adjustedBoq = boqItems.map(item => {
      // Modify price based on budget selection except standard items like hinges
      const adjustedPrice = item.sku === 'BL-DAMP-05' ? item.price : Math.round(item.price * budgetMultiplier);
      return {
        ...item,
        price: adjustedPrice,
        total: adjustedPrice * item.qty
      };
    });

    const totalAmount = adjustedBoq.reduce((sum, item) => sum + item.total, 0);

    return NextResponse.json({
      success: true,
      imageUrl,
      boq: adjustedBoq,
      totalAmount,
      vinSubsidy: Math.round(totalAmount * 0.06),
      projectCode: `PRJ-HN-${block.replace(/\s+/g, '')}-${floorApartment.replace(/[^a-zA-Z0-9]/g, '')}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ trong quá trình xử lý AI: ' + error.message }, { status: 500 });
  }
}
