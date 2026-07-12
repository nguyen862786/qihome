'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Mock Vinhomes blocks
const VIN_BLOCKS = [
  { id: 'block-1', name: 'Tòa Golden Silk (Phân khu 1)' },
  { id: 'block-2', name: 'Tòa Ruby Plaza (Phân khu 2)' },
  { id: 'block-3', name: 'Tòa Diamond Center (Phân khu 3)' }
];

// Mock apartment layouts
const APARTMENT_TYPES = [
  { id: 'apt-studio', name: 'Căn hộ Studio (32m²)' },
  { id: 'apt-1pn', name: 'Căn hộ 1PN+ (48m²)' },
  { id: 'apt-2pn', name: 'Căn hộ 2PN (65m²)' },
  { id: 'apt-3pn', name: 'Căn hộ 3PN (85m²)' }
];

export default function AIStudio() {
  const router = useRouter();
  
  // Selection states
  const [selectedBlock, setSelectedBlock] = useState(VIN_BLOCKS[0].name);
  const [apartmentNumber, setApartmentNumber] = useState('1205');
  const [selectedType, setSelectedType] = useState(APARTMENT_TYPES[2].name);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedBudget, setSelectedBudget] = useState('premium');

  // Generator states
  const [generating, setGenerating] = useState(false);
  const [genLogs, setGenLogs] = useState([]);
  const [renderResult, setRenderResult] = useState(null);
  const [profile, setProfile] = useState(null);

  // Load profile
  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setRenderResult(null);
    setGenLogs([]);

    const logMessages = [
      'Đang tải bản vẽ CAD/BIM mặt bằng 2D...',
      'Đang cấu hình tham số ControlNet 1.1 (Scribble)...',
      'Đang khởi động Stable Diffusion XL trên RunPod API...',
      'Đang kết xuất phối cảnh 3D & bố trí đồ đạc theo kích thước thực...',
      'Đang ánh xạ (mapping) đồ rời với danh mục SKU showroom...',
      'Hoàn thành bóc tách BOQ định mức vật tư!'
    ];

    // Push logs step-by-step
    for (let i = 0; i < logMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 3 ? 1200 : 500));
      setGenLogs(prev => [...prev, logMessages[i]]);
    }

    try {
      const response = await fetch('/api/ai/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block: selectedBlock,
          floorApartment: `Tầng ${apartmentNumber.slice(0, 2)} - Căn ${apartmentNumber}`,
          style: selectedStyle,
          budget: selectedBudget
        })
      });

      const data = await response.json();
      if (data.success) {
        setRenderResult(data);
      } else {
        alert('Có lỗi xảy ra: ' + data.error);
      }
    } catch (error) {
      alert('Không thể kết nối API AI: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!renderResult) return;
    
    // Check if thợ/admin/customer
    let userId = 'guest';
    let subcontractorId = null;
    let siteManagerId = null;
    let salesId = null;

    if (profile) {
      userId = profile.id;
      if (profile.role === 'subcontractor') subcontractorId = profile.id;
      if (profile.role === 'site_manager') siteManagerId = profile.id;
      if (profile.role === 'sales') salesId = profile.id;
    }

    try {
      // For Demo MVP, we construct the request to save mock project
      // In production, we write directly to public.projects & public.bom_materials tables
      // We will simulate database creation:
      alert(`🎉 Đã tạo Hợp đồng thành công!\n- Mã dự án: ${renderResult.projectCode}\n- Trạng thái: pending_design\n- Định mức vật tư (BOM) đã được khóa cứng.`);
      router.push('/');
    } catch (error) {
      alert('Lỗi tạo dự án: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <Link href="/" className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</Link>
              <span className="font-bold text-xl text-white tracking-tight">AI Interior Studio</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-slate-400 hover:text-white transition text-xs font-semibold">
                Quay lại Storefront
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl">
            <h2 className="text-base font-bold text-white mb-6 flex items-center space-x-2">
              <span className="text-amber-500">⚙</span>
              <span>Cấu hình Căn hộ Vinhomes</span>
            </h2>

            <div className="space-y-4">
              {/* Select Block */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tòa/Phân khu</label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  {VIN_BLOCKS.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Apartment details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Số phòng/Căn</label>
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                    placeholder="1205"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Thiết kế góc/Dòng</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    {APARTMENT_TYPES.map(a => (
                      <option key={a.id} value={a.name}>{b => b.name} {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Gu Thẩm mỹ (Style)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'indochine', name: 'Đông Dương', emoji: '🕌' },
                    { id: 'modern', name: 'Hiện đại', emoji: '🏢' },
                    { id: 'minimalist', name: 'Tối giản', emoji: '⚪' },
                    { id: 'neoclassical', name: 'Tân cổ điển', emoji: '🏛️' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedStyle === style.id 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl mb-1">{style.emoji}</span>
                      <span className="text-xs font-semibold">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Slider */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Hạn mức Ngân sách</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', name: 'Vừa vặn', desc: 'Modular' },
                    { id: 'premium', name: 'Cao cấp', desc: 'An Cường Pro' },
                    { id: 'luxury', name: 'Siêu sang', desc: 'Nhập khẩu' }
                  ].map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBudget(b.id)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedBudget === b.id 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">{b.name}</span>
                      <span className="text-[9px] text-slate-500">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition text-center text-xs mt-4 shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></span>
                    <span>Đang render AI...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Bắt đầu Phối cảnh AI (30s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Viewport & Render Result */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            
            {/* Initial Blank State */}
            {!generating && !renderResult && (
              <div className="text-center max-w-sm">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-base font-bold text-white">AI Interior Render Workspace</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Thiết lập thông số căn hộ Vinhomes ở cột bên trái và bấm kết xuất để AI tự động sắp xếp sản phẩm thật và trả về thiết kế 3D.
                </p>
              </div>
            )}

            {/* Rendering Progress logs */}
            {generating && (
              <div className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 rounded-xl p-6 font-mono text-[11px] text-slate-400 space-y-2 shadow-2xl relative z-10">
                <div className="text-amber-500 font-bold mb-3 flex items-center justify-between">
                  <span>SYSTEM ACTIVE // GEN AI ENGINE</span>
                  <span className="animate-pulse">RUNNING...</span>
                </div>
                {genLogs.map((log, index) => (
                  <div key={index} className="flex items-center space-x-2 text-slate-300">
                    <span className="text-emerald-500">✔</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Rendered Result Output */}
            {!generating && renderResult && (
              <div className="w-full space-y-6 animate-fadeIn">
                {/* 3D Render Image Frame */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 group shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={renderResult.imageUrl} 
                    alt="AI Rendered Interior" 
                    className="w-full h-auto max-h-[460px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                    <div>
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold rounded">
                        KẾT QUẢ AI RENDER 2K
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">
                        Phối cảnh căn hộ {selectedBlock} - Căn {apartmentNumber}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Separator / BOQ Table */}
                <div className="border-t border-slate-800 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Bảng Dự toán BOQ tự động từ AI</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tách thành công từ hình ảnh AI sang mã hàng thật</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Tổng gói BOQ</div>
                      <div className="text-sm font-bold text-amber-500">
                        {renderResult.totalAmount.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                          <th className="py-2.5">Mã SKU</th>
                          <th className="py-2.5">Tên vật tư</th>
                          <th className="py-2.5 text-center">Định lượng</th>
                          <th className="py-2.5">Đơn vị</th>
                          <th className="py-2.5 text-right">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {renderResult.boq.map((item, index) => (
                          <tr key={index}>
                            <td className="py-2.5 font-mono text-slate-400">{item.sku}</td>
                            <td className="py-2.5 font-medium">{item.name} <span className="text-[9px] text-slate-500">({item.brand})</span></td>
                            <td className="py-2.5 text-center">{item.qty}</td>
                            <td className="py-2.5 text-slate-500">{item.unit}</td>
                            <td className="py-2.5 text-right font-bold text-slate-200">{item.total.toLocaleString('vi-VN')}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Deduct Banner */}
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mt-6 flex justify-between items-center text-xs">
                    <div>
                      <div className="text-slate-400">Trừ 6% Vinhomes tài trợ:</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Khấu trừ tay ba trực tiếp</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-500 font-bold">-{renderResult.vinSubsidy.toLocaleString('vi-VN')}đ</div>
                      <div className="text-white font-bold mt-0.5">
                        Thực chi: {(renderResult.totalAmount - renderResult.vinSubsidy).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {/* Contract Button */}
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={handleCreateProject}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
                    >
                      ✓ Ký Hợp Đồng Ba Bên & Khóa Định Mức BOM
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
