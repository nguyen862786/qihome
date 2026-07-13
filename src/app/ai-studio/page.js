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

  // Custom area for guest users who don't choose a predefined layout
  const [customArea, setCustomArea] = useState('65');

  // Checkbox Matrix states for furniture and decor integration
  const [furnitureChoices, setFurnitureChoices] = useState({
    bed: true,
    wardrobe: true,
    diningTable: true,
    sofa: true,
    coffeeTable: true
  });
  
  const [decorChoices, setDecorChoices] = useState({
    paintings: true,
    chandelier: true,
    curtains: true,
    plants: true
  });

  // Prompt input
  const [prompt, setPrompt] = useState('');

  // Rate Limiting Credits & Queue System states
  const [profile, setProfile] = useState(null);
  const [credits, setCredits] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [genLogs, setGenLogs] = useState([]);
  const [renderResult, setRenderResult] = useState(null);
  
  // Queue stats
  const [queueNum, setQueueNum] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Guest blocking dialog
  const [showRegModal, setShowRegModal] = useState(false);

  // Load profile and manage credit limits
  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (stored) {
      const user = JSON.parse(stored);
      setProfile(user);
      
      // Load credits for members
      const savedCredits = localStorage.getItem(`qihome_credits_${user.phone || user.id}`);
      if (savedCredits === null) {
        // Cư dân Vin starts with 15, generic member with 3
        const initial = user.is_vinhomes_resident ? 15 : 3;
        localStorage.setItem(`qihome_credits_${user.phone || user.id}`, String(initial));
        setCredits(initial);
      } else {
        setCredits(Number(savedCredits));
      }
    } else {
      // Guest
      const guestCredits = localStorage.getItem('qihome_guest_credits');
      if (guestCredits === null) {
        localStorage.setItem('qihome_guest_credits', '1');
        setCredits(1);
      } else {
        setCredits(Number(guestCredits));
      }
    }
  }, []);

  const handleGenerate = async () => {
    // 1. Guardrail checks for credit limits
    if (credits <= 0) {
      if (!profile) {
        setShowRegModal(true);
      } else {
        alert('⚠️ Bạn đã sử dụng hết lượt thiết kế AI miễn phí! Vui lòng mua thêm lượt để tiếp tục sáng tạo.');
      }
      return;
    }

    setGenerating(true);
    setRenderResult(null);
    setGenLogs([]);

    // 2. Consume 1 Credit
    const nextCredits = credits - 1;
    setCredits(nextCredits);
    if (profile) {
      localStorage.setItem(`qihome_credits_${profile.phone || profile.id}`, String(nextCredits));
    } else {
      localStorage.setItem('qihome_guest_credits', String(nextCredits));
    }

    // 3. Start queue countdown over 15 seconds
    setQueueNum(3);
    setTimeLeft(15);
    setProgressBarWidth(0);

    const logMessages = [
      'Đang xếp hàng gửi yêu cầu render...',
      'Đang tải bản vẽ CAD/BIM mặt bằng căn hộ...',
      'Đang phân tích ma trận đồ đạc được chọn...',
      'Đang cấu hình tham số ControlNet SDXL...',
      'Đang render phối cảnh 3D độ phân giải cao...',
      'Hoàn thành bóc tách BOQ định mức vật tư!'
    ];

    let currentLogIndex = 0;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        
        // Progress bar updates
        const nextTime = prev - 1;
        setProgressBarWidth(((15 - nextTime) / 15) * 100);

        // Queue reduction logic
        if (nextTime === 11) {
          setQueueNum(2);
        } else if (nextTime === 7) {
          setQueueNum(1);
        } else if (nextTime === 3) {
          setQueueNum(0);
        }

        // Add log messages dynamically
        if (nextTime % 2 === 0 && currentLogIndex < logMessages.length) {
          setGenLogs((prevLogs) => [...prevLogs, logMessages[currentLogIndex]]);
          currentLogIndex++;
        }

        return nextTime;
      });
    }, 1000);

    // Call Replicate/Mock API in the background after progress completion
    setTimeout(async () => {
      try {
        const response = await fetch('/api/ai/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block: selectedBlock,
            floorApartment: `Tầng ${apartmentNumber.slice(0, 2)} - Căn ${apartmentNumber}`,
            style: selectedStyle,
            budget: selectedBudget,
            customPrompt: prompt
          })
        });

        const data = await response.json();
        if (data.success) {
          setRenderResult(data);
        } else {
          alert('Có lỗi xảy ra trong quá trình render: ' + data.error);
        }
      } catch (error) {
        alert('Không thể kết nối API AI: ' + error.message);
      } finally {
        setGenerating(false);
      }
    }, 15000);
  };

  // Up-sell credits purchase trigger (Simulated)
  const handleBuyCredits = () => {
    const cost = 20000;
    const confirm = window.confirm(`💳 Bạn muốn nạp thêm 5 lượt Render phối cảnh AI với chi phí ${cost.toLocaleString()}đ qua tài khoản ngân hàng liên kết?`);
    if (confirm) {
      const nextCredits = credits + 5;
      setCredits(nextCredits);
      if (profile) {
        localStorage.setItem(`qihome_credits_${profile.phone || profile.id}`, String(nextCredits));
      } else {
        localStorage.setItem('qihome_guest_credits', String(nextCredits));
      }
      alert('⚡ Nạp lượt AI thành công! Bạn nhận thêm 5 credit thiết kế.');
    }
  };

  const handleCreateProject = async () => {
    if (!profile) {
      setShowRegModal(true);
      return;
    }
    if (!renderResult) return;
    
    let subcontractorId = 'a0000000-0000-0000-0000-000000000004';
    let siteManagerId = 'a0000000-0000-0000-0000-000000000003';
    let salesId = 'a0000000-0000-0000-0000-000000000005';

    try {
      const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                           !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
      
      if (isConfigured) {
        const { data: project, error: pError } = await supabase
          .from('projects')
          .insert([
            {
              project_code: renderResult.projectCode,
              vinhomes_block: selectedBlock,
              vinhomes_floor_căn: `Tầng ${apartmentNumber.slice(0, 2)} - Căn ${apartmentNumber}`,
              client_name: profile.name,
              sales_id: salesId,
              site_manager_id: siteManagerId,
              subcontractor_id: subcontractorId,
              total_amount: renderResult.totalAmount,
              status: 'pending_design'
            }
          ])
          .select()
          .single();

        if (pError) throw pError;

        const bomInserts = renderResult.boq.map(item => ({
          project_id: project.id,
          sku: item.sku,
          item_name: item.name,
          allocated_quantity: item.qty,
          disbursed_quantity: 0,
          unit: item.unit
        }));

        const { error: bError } = await supabase
          .from('bom_materials')
          .insert(bomInserts);

        if (bError) throw bError;

        // Split commission 1% + 1%
        await supabase
          .from('commissions')
          .insert([
            {
              project_id: project.id,
              sales_id: salesId,
              commission_rate: 0.01,
              stage: 1,
              amount: renderResult.totalAmount * 0.01,
              status: 'pending'
            },
            {
              project_id: project.id,
              sales_id: salesId,
              commission_rate: 0.01,
              stage: 2,
              amount: renderResult.totalAmount * 0.01,
              status: 'pending'
            }
          ]);

        alert(`🎉 Đã lập Hợp đồng thiết kế thi công thành công trên LIVE DB!\n- Mã dự án: ${renderResult.projectCode}\n- Định mức vật tư (BOM) đã khóa.`);
      } else {
        // Sandbox mock commissions update
        let storedComms = localStorage.getItem('qihome_shared_commissions');
        const comms = storedComms ? JSON.parse(storedComms) : [];
        const newComms = [
          { id: `COM-${Date.now()}A`, projectCode: renderResult.projectCode, clientName: profile.name, gross: renderResult.totalAmount * 0.01, stage: 1, title: 'Hoa hồng đợt 1 (Khách thanh toán đợt 1)', status: 'pending', date: '---', expectedDate: '' },
          { id: `COM-${Date.now()}B`, projectCode: renderResult.projectCode, clientName: profile.name, gross: renderResult.totalAmount * 0.01, stage: 2, title: 'Hoa hồng đợt 2 (Bàn giao căn hộ)', status: 'pending', date: '---', expectedDate: '' }
        ];
        localStorage.setItem('qihome_shared_commissions', JSON.stringify([...newComms, ...comms]));

        alert(`🎉 Đã tạo Hợp đồng thành công (Mô phỏng Sandbox)!\n- Mã dự án: ${renderResult.projectCode}\n- Trạng thái: pending_design\n- Định mức vật tư (BOM) đã được khóa cứng.\n- Ghi nhận hoa hồng đợt 1 (1%) & đợt 2 (1%) vào lịch sử giải ngân.`);
      }
      router.push('/');
    } catch (error) {
      alert('Lỗi tạo dự án: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-[#ebdcb9] bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="font-bold text-2xl tracking-wider text-[#c49a62] bg-[#c49a62]/10 border border-[#ebdcb9] px-3 py-1 rounded-xl">Qi</Link>
              <span className="font-bold text-lg text-slate-900 tracking-tight">AI Interior Studio</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-550 font-bold uppercase mr-2 flex items-center space-x-1 bg-[#faf8f5] border border-[#ebdcb9] px-3 py-1.5 rounded-xl">
                <span>Credit AI:</span>
                <strong className="text-[#c49a62] ml-1">{credits} lượt</strong>
              </span>

              <button
                onClick={handleBuyCredits}
                className="bg-[#c49a62] hover:bg-[#b08752] text-white text-[10px] px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shadow-sm uppercase tracking-wider"
              >
                + Mua thêm lượt AI
              </button>

              <Link href="/" className="text-slate-500 hover:text-slate-900 transition text-xs font-bold">
                Quay lại Storefront
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Option Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <span className="text-[#c49a62]">⚙</span>
              <span>Cấu hình Căn hộ Vinhomes</span>
            </h2>

            <div className="space-y-4">
              {profile ? (
                /* Member Block Options */
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tòa/Phân khu</label>
                    <select
                      value={selectedBlock}
                      onChange={(e) => setSelectedBlock(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                    >
                      {VIN_BLOCKS.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Số phòng/Căn</label>
                      <input
                        type="text"
                        value={apartmentNumber}
                        onChange={(e) => setApartmentNumber(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                        placeholder="1205"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mẫu mặt bằng</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none"
                      >
                        {APARTMENT_TYPES.map(a => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* Guest custom m2 entry */
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Diện tích căn hộ tự chọn (m²)</label>
                  <input
                    type="number"
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                    placeholder="Ví dụ: 65"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">* Dành cho khách vãng lai tự cấu hình</p>
                </div>
              )}

              {/* Style Selection Cards */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-2">Gu Thẩm mỹ (Style)</label>
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
                          ? 'border-[#c49a62] bg-[#c49a62]/10 text-[#c49a62] font-black' 
                          : 'border-[#ebdcb9] bg-[#faf8f5] text-slate-500 hover:border-[#c49a62]/30'
                      }`}
                    >
                      <span className="text-xl mb-1">{style.emoji}</span>
                      <span className="text-[10px] font-bold">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Matrix for Custom Furniture & Decor Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-2">Tích chọn đồ đạc (Checkbox Matrix)</label>
                
                {/* Nhóm Đồ rời */}
                <div className="space-y-1 bg-[#faf8f5] border border-[#ebdcb9] p-3 rounded-xl mb-2 text-xs">
                  <span className="text-[9px] font-extrabold uppercase text-[#c49a62] block mb-1">🛏️ Nhóm đồ rời</span>
                  {Object.keys(furnitureChoices).map((key) => (
                    <label key={key} className="flex items-center space-x-2 text-[10px] font-medium text-slate-650 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={furnitureChoices[key]}
                        onChange={(e) => setFurnitureChoices({ ...furnitureChoices, [key]: e.target.checked })}
                        className="rounded border-[#ebdcb9] text-[#c49a62] focus:ring-[#c49a62]"
                      />
                      <span className="capitalize">{key === 'bed' ? 'Giường' : key === 'wardrobe' ? 'Tủ quần áo' : key === 'diningTable' ? 'Bàn ăn' : key === 'sofa' ? 'Sofa' : 'Bàn trà'}</span>
                    </label>
                  ))}
                </div>

                {/* Nhóm Decor */}
                <div className="space-y-1 bg-[#faf8f5] border border-[#ebdcb9] p-3 rounded-xl text-xs">
                  <span className="text-[9px] font-extrabold uppercase text-[#c49a62] block mb-1">🖼️ Nhóm Decor</span>
                  {Object.keys(decorChoices).map((key) => (
                    <label key={key} className="flex items-center space-x-2 text-[10px] font-medium text-slate-650 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={decorChoices[key]}
                        onChange={(e) => setDecorChoices({ ...decorChoices, [key]: e.target.checked })}
                        className="rounded border-[#ebdcb9] text-[#c49a62] focus:ring-[#c49a62]"
                      />
                      <span className="capitalize">{key === 'paintings' ? 'Tranh ảnh' : key === 'chandelier' ? 'Đèn chùm' : key === 'curtains' ? 'Rèm cửa' : 'Cây xanh nghệ thuật'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prompt Textarea Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ý tưởng thiết kế (Prompt)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn tông màu chủ đạo là xanh đại dương, có nhiều ánh sáng tự nhiên và góc làm việc nhỏ cạnh cửa sổ..."
                  className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62] h-16 resize-none"
                />
              </div>

              {/* Budget limit cards */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Hạn mức ngân sách</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', name: 'Tiêu Chuẩn', desc: 'Modular' },
                    { id: 'premium', name: 'Cao Cấp', desc: 'An Cường Pro' },
                    { id: 'luxury', name: 'Siêu Sang', desc: 'Nhập Khẩu' }
                  ].map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBudget(b.id)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedBudget === b.id 
                          ? 'border-[#c49a62] bg-[#c49a62]/10 text-[#c49a62] font-black' 
                          : 'border-[#ebdcb9] bg-[#faf8f5] text-slate-500 hover:border-[#c49a62]/30'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{b.name}</span>
                      <span className="text-[8px] text-slate-400 mt-0.5">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Submit Render Button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition text-center text-xs mt-4 shadow-lg shadow-[#c49a62]/10 flex items-center justify-center space-x-2 uppercase tracking-wider"
              >
                {generating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    <span>Xếp hàng xử lý AI...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Kiến tạo không gian bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Viewport & Render Result */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden shadow-sm">
            
            {/* Initial Blank State */}
            {!generating && !renderResult && (
              <div className="text-center max-w-sm space-y-3">
                <div className="text-5xl">🤖</div>
                <h3 className="text-sm font-bold text-slate-900">AI Design Render Screen</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chọn các option thiết kế căn hộ Vinhomes ở cột bên trái và tích chọn đồ đạc để bắt đầu. AI sẽ tự động phân tích và trả về hình ảnh phối cảnh 3D kèm danh mục BOQ bóc tách.
                </p>
              </div>
            )}

            {/* Queue & Progress bar indicator */}
            {generating && (
              <div className="w-full max-w-md bg-[#faf8f5] border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm z-10 animate-pulse">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                  <span className="text-[#c49a62]">SYSTEM PROCESING REQUEST</span>
                  <span className="text-red-500">XẾP HÀNG THỨ {queueNum}</span>
                </div>
                
                <p className="text-xs text-slate-650 text-center leading-relaxed">
                  * AI đang tính toán bố trí và render phối cảnh. Đang xếp hàng thứ <strong className="text-red-500">{queueNum}</strong>. Dự kiến hoàn thành trong <strong className="text-[#c49a62]">{timeLeft} giây</strong>.
                </p>

                {/* Progress bar container */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#c49a62] h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${progressBarWidth}%` }}
                  ></div>
                </div>

                {/* Simulated log console */}
                <div className="bg-white border border-[#ebdcb9] rounded-xl p-3 font-mono text-[9px] text-slate-600 space-y-1.5 h-28 overflow-y-auto">
                  {genLogs.map((log, index) => (
                    <div key={index} className="flex items-center space-x-1.5">
                      <span className="text-emerald-500">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Result Output */}
            {!generating && renderResult && (
              <div className="w-full space-y-6 animate-fadeIn">
                <div className="relative rounded-2xl overflow-hidden border border-[#ebdcb9] group shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={renderResult.imageUrl} 
                    alt="AI Rendered Interior" 
                    className="w-full h-auto max-h-[460px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                    <div>
                      <span className="px-2 py-0.5 bg-[#c49a62] text-white text-[9px] font-bold rounded">
                        KẾT QUẢ AI RENDER 2K
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5">
                        Phối cảnh căn hộ {selectedBlock} - Căn {apartmentNumber} (Gu {selectedStyle.toUpperCase()})
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Separator / BOQ Table */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Bảng Báo giá & Dự toán BOQ tự động</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tách thành công từ hình ảnh AI sang mã hàng showroom</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500">Tổng gói BOQ</div>
                      <div className="text-sm font-black text-[#c49a62]">
                        {renderResult.totalAmount.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebdcb9] text-slate-500 font-semibold uppercase">
                          <th className="py-2">Mã SKU</th>
                          <th className="py-2">Tên vật tư</th>
                          <th className="py-2 text-center">Số Lượng</th>
                          <th className="py-2">Đơn vị</th>
                          <th className="py-2 text-right">Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {renderResult.boq.map((item, index) => (
                          <tr key={index}>
                            <td className="py-2 font-mono text-slate-400">{item.sku}</td>
                            <td className="py-2 text-slate-800">{item.name} <span className="text-[8px] bg-[#faf8f5] text-slate-400 border border-slate-200 px-1 rounded">{item.brand}</span></td>
                            <td className="py-2 text-center font-bold">{item.qty}</td>
                            <td className="py-2 text-slate-500">{item.unit}</td>
                            <td className="py-2 text-right font-bold text-slate-900">{item.total.toLocaleString('vi-VN')}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Deduct Banner */}
                  <div className="bg-[#faf8f5] border border-[#ebdcb9] rounded-xl p-4 mt-6 flex justify-between items-center text-xs">
                    <div>
                      <div className="text-slate-500">Trợ giá hoàn thiện Vinhomes:</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">* Chiết khấu đối tác 3 bên</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#c49a62] font-black">-{renderResult.vinSubsidy.toLocaleString('vi-VN')}đ (6%)</div>
                      <div className="text-slate-900 font-black mt-0.5">
                        Thực chi đợt 1: {(renderResult.totalAmount - renderResult.vinSubsidy).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (Ký hợp đồng / Lưu phương án) */}
                  <div className="mt-6 flex gap-4">
                    {!profile ? (
                      /* Guest view blocking button */
                      <button
                        onClick={() => setShowRegModal(true)}
                        className="flex-1 bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-3.5 px-4 rounded-xl transition text-center text-xs shadow-md"
                      >
                        🔒 Đăng ký thành viên để lưu thiết kế & ký hợp đồng
                      </button>
                    ) : (
                      /* Active member button */
                      <button
                        onClick={handleCreateProject}
                        className="flex-1 bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-3.5 px-4 rounded-xl transition text-center text-xs shadow-md"
                      >
                        ✓ Ký Hợp Đồng Ba Bên & Khóa Định Mức BOM
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Guest registration prompt modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl w-full max-w-sm p-6 relative text-slate-800">
            <button 
              onClick={() => setShowRegModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition text-lg font-bold"
            >
              ✕
            </button>
            <div className="text-center space-y-4">
              <div className="text-4xl">🔐</div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">Yêu cầu Đăng ký Thành viên</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Chào mừng bạn! Vui lòng đăng ký tài khoản thành viên (miễn phí) để mở khóa chọn vật tư, lên BOQ và kết xuất thiết kế bằng AI.
              </p>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowRegModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => {
                    setShowRegModal(false);
                    router.push('/login');
                  }}
                  className="flex-1 bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-2 rounded-xl text-xs shadow-sm"
                >
                  Đăng Ký Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
