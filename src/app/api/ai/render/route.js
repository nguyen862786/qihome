import { NextResponse } from 'next/server';

// Mapping style to reference images copied to public/images for fallback
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

// SDXL interior design model on Replicate
const REPLICATE_MODEL_VERSION = 'da77bc59ef60420d73086cf4a5d40d5072c0f787b22f4d6a9a54558e836224ec';

export async function POST(request) {
  try {
    const body = await request.json();
    const { block, floorApartment, style, budget } = body;

    if (!block || !floorApartment || !style || !budget) {
      return NextResponse.json({ error: 'Thiếu thông tin căn hộ hoặc tuỳ chọn thiết kế.' }, { status: 400 });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const isLiveAI = replicateToken && !replicateToken.includes('your-replicate-api-token');
    
    let imageUrl = '';

    if (isLiveAI) {
      // 1. Construct prompt based on user settings
      const prompt = `A highly detailed interior design of a residential apartment living room, ${style} style, ${budget} premium finishes, clean layout, architectural digest photography, photorealistic, 4k resolution, raytracing, soft lighting.`;

      try {
        // 2. Start prediction on Replicate API
        const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: REPLICATE_MODEL_VERSION,
            input: {
              prompt,
              negative_prompt: 'deformed, bad architecture, noise, blurry, low quality, dark',
              num_inference_steps: 30,
              guidance_scale: 7.5
            }
          })
        });

        if (!startResponse.ok) {
          const errData = await startResponse.json();
          throw new Error(errData.detail || 'Replicate initialization failed.');
        }

        const prediction = await startResponse.json();
        const pollUrl = prediction.urls.get;

        // 3. Poll for results (simple timeout loop up to 10 seconds in server handler)
        let succeeded = false;
        let finalPrediction = null;

        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // wait 1.5s between polls
          
          const pollResponse = await fetch(pollUrl, {
            headers: {
              'Authorization': `Token ${replicateToken}`
            }
          });

          if (pollResponse.ok) {
            finalPrediction = await pollResponse.json();
            if (finalPrediction.status === 'succeeded') {
              succeeded = true;
              imageUrl = finalPrediction.output[0];
              break;
            } else if (finalPrediction.status === 'failed' || finalPrediction.status === 'canceled') {
              break;
            }
          }
        }

        if (!succeeded) {
          console.warn('Replicate AI polling timed out or failed. Falling back to showroom archive.');
          imageUrl = STYLE_IMAGES[style.toLowerCase()] || STYLE_IMAGES.modern;
        }

      } catch (err) {
        console.error('Replicate API error:', err.message);
        imageUrl = STYLE_IMAGES[style.toLowerCase()] || STYLE_IMAGES.modern;
      }
    } else {
      // Offline fallback: Simulate loading delay and return pre-seeded showroom photos
      await new Promise(resolve => setTimeout(resolve, 2000));
      imageUrl = STYLE_IMAGES[style.toLowerCase()] || STYLE_IMAGES.modern;
    }

    const boqItems = STYLE_BOQ_ITEMS[style.toLowerCase()] || STYLE_BOQ_ITEMS.modern;

    // Apply budget multipliers
    let budgetMultiplier = 1.0;
    if (budget === 'premium') budgetMultiplier = 1.25;
    if (budget === 'luxury') budgetMultiplier = 1.6;

    const adjustedBoq = boqItems.map(item => {
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
