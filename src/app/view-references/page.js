'use client';

import React from 'react';
import Link from 'next/link';

// Array of images found in public/images
const REFERENCE_IMAGES = [
  { name: 'bidv422.jpg', type: 'Landscape Desktop', desc: 'Giao diện mẫu biểu mẫu/lịch trình thanh toán hoặc cổng ngân hàng (kích thước lớn 2944x1965).', size: '2944x1965' },
  { name: 'bidv560.jpg', type: 'Landscape Desktop', desc: 'Giao diện ngân hàng, tín dụng mẫu (kích thước lớn 3645x2433).', size: '3645x2433' },
  { name: '6e4ef2dce8d96c71f835b282ed30ad71.jpg', type: 'Tall Mobile Page', desc: 'Giao diện thiết kế giao diện Mobile Web dạng đứng dài, tối ưu cho giao dịch.', size: '1200x4034' },
  { name: '9e38a39b93363a30bf93d38a94c7d5f7.jpg', type: 'Tall Mobile Page', desc: 'Layout ứng dụng thương mại điện tử hoặc tin tức trên điện thoại.', size: '736x2061' },
  { name: '88379cbc1f2efe85a4e777359024f264.jpg', type: 'Mobile Screen', desc: 'Giao diện chi tiết sản phẩm / giỏ hàng di động.', size: '736x1456' },
  { name: 'cd9e64d0b00dd68229be9255288b0379.jpg', type: 'Mobile Screen', desc: 'Giao diện thanh toán / xác nhận OTP di động.', size: '736x1418' },
  { name: '04fcf5b83b0cfdede7cf80f279bcce7b.jpg', type: 'Mobile Screen', desc: 'Mẫu thiết kế thẻ sản phẩm / danh sách vật tư trên mobile.', size: '736x1472' },
  { name: '3584231b70bb4769c06767be070aa59d.jpg', type: 'Mobile Screen', desc: 'Mẫu giao diện tiến độ dự án / báo cáo GPS trên di động.', size: '736x1262' },
  { name: '84b7fdc914a5dabb92f7969852f23449.jpg', type: 'Mobile Screen', desc: 'Giao diện checklist giám sát QC trên di động.', size: '736x1138' },
  { name: '3ba7aecadbb591ec3ea1c15a853362f5.jpg', type: 'Interior Design', desc: 'Thiết kế mẫu phong cách Đông Dương (Indochine) - Phòng khách Vinhomes.', size: '736x1104' },
  { name: 'cb17520f98fa50444b4d580964fc69e7.jpg', type: 'Interior Design', desc: 'Thiết kế mẫu phong cách Hiện đại (Modern) - Phối cảnh phòng mẫu.', size: '768x1376' },
  { name: '306d8ed842d197c34447a81976615549.jpg', type: 'Interior Design', desc: 'Thiết kế mẫu phong cách Tối giản (Minimalist) - Phòng khách căn hộ.', size: '736x1104' },
  { name: '1626aee735a6d69aa16af41338600615.jpg', type: 'Interior Design', desc: 'Thiết kế mẫu phong cách Tân cổ điển (Neoclassical) - Phòng khách luxury.', size: '848x1264' }
];

export default function ViewReferences() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <header className="border-b border-slate-900 pb-4 flex justify-between items-center max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">📁 Bộ Sưu Tập Hình Ảnh Tham Khảo</h1>
          <p className="text-xs text-slate-500 mt-1">Dành cho việc đối chiếu giao diện mẫu và phong cách thiết kế của QiHome.vn</p>
        </div>
        <Link href="/" className="text-xs text-amber-500 hover:underline">
          Quay lại Storefront
        </Link>
      </header>

      {/* Grid of reference assets */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {REFERENCE_IMAGES.map((img, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
            {/* Visual Preview */}
            <div className="bg-slate-950 flex items-center justify-center p-4 border-b border-slate-900 relative group min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/${img.name}`}
                alt={img.name}
                className="max-h-[350px] max-w-full object-contain rounded-lg shadow-lg group-hover:scale-[1.02] transition duration-300"
              />
            </div>

            {/* Information details */}
            <div className="p-5 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                  {img.type}
                </span>
                <span className="text-[9px] font-mono text-slate-500">{img.size}</span>
              </div>
              <h3 className="text-xs font-bold text-white truncate">{img.name}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{img.desc}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
