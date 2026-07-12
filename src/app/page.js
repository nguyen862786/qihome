'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Static fallback products
const FALLBACK_PRODUCTS = [
  { sku: 'SF-LTH-01', name: 'Sofa Da Cao Cấp Indochine', brand: 'QiPrime', price: 28000000, unit: 'Bộ', image: '🛋️', desc: 'Khung gỗ sồi tự nhiên, bọc da bò nhập khẩu Ý.' },
  { sku: 'LT-CHR-02', name: 'Đèn Chùm Pha Lê Indochine', brand: 'Euroto', price: 15000000, unit: 'Bộ', image: '💡', desc: 'Thiết kế cổ điển giao thoa Á - Âu sang trọng.' },
  { sku: 'AC-WD-402', name: 'Hệ Tủ Bếp Gỗ Melamine Cao Cấp', brand: 'An Cường', price: 4200000, unit: 'Mét tới', image: '🚪', desc: 'Chống ẩm, chống trầy xước chuẩn An Cường.' },
  { sku: 'BL-DAMP-05', name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', brand: 'Blum', price: 350000, unit: 'Bộ', image: '🔩', desc: 'Vận hành êm ái, bảo hành trọn đời.' },
  { sku: 'DL-UX-18', name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', brand: 'Dulux', price: 1200000, unit: 'Thùng', image: '🎨', desc: 'Lau chùi tối ưu, kháng khuẩn bảo vệ sức khỏe.' },
  { sku: 'KH-SNK-99', name: 'Bồn Rửa Chén Kohler Đẳng Cấp', brand: 'Kohler', price: 7800000, unit: 'Bộ', image: '🚰', desc: 'Thép không gỉ đúc liền khối siêu bền.' }
];

const SALES_AGENTS = {
  'SALE-NAM86': 'Phạm Hoàng Nam',
  'SALE-LINH90': 'Trần Hoài Linh',
  'SALE-QUANG86': 'Nguyễn Duy Quang'
};

function StorefrontContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Dynamic Catalog state
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [isLive, setIsLive] = useState(false);
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  
  // Storefront & Cart states
  const [affiliate, setAffiliate] = useState(null);
  const [houseValue, setHouseValue] = useState(5000000000); // 5B VND default
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [profile, setProfile] = useState(null);
  
  // Techcombank loan states
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({ fullName: '', phone: '', income: '20-50', tenure: '3' });
  const [loanSubmitted, setLoanSubmitted] = useState(false);

  // Initialize
  useEffect(() => {
    // 1. Get logged in user profile if exists
    const stored = localStorage.getItem('qihome_user_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }

    // 2. Parse affiliate code from URL
    const affCode = searchParams.get('aff');
    if (affCode) {
      const salesName = SALES_AGENTS[affCode.toUpperCase()];
      if (salesName) {
        const affData = { code: affCode.toUpperCase(), name: salesName };
        localStorage.setItem('qihome_affiliate_sales', JSON.stringify(affData));
        setAffiliate(affData);
      }
    } else {
      const savedAff = localStorage.getItem('qihome_affiliate_sales');
      if (savedAff) {
        setAffiliate(JSON.parse(savedAff));
      }
    }

    // 3. Load dynamic catalog from database
    checkDatabaseCatalog();
  }, [searchParams]);

  const checkDatabaseCatalog = async () => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('materials_catalog')
          .select('*');

        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map(item => ({
            sku: item.sku,
            name: item.name,
            brand: item.brand,
            price: Number(item.price),
            unit: item.unit,
            image: item.sku === 'AC-WD-402' ? '🚪' : item.sku === 'BL-DAMP-05' ? '🔩' : item.sku === 'DL-UX-18' ? '🎨' : '🚰',
            desc: item.description || 'Sản phẩm hoàn thiện chính hãng chất lượng cao.'
          }));
          setProducts(mapped);
          
          // Quantities setup
          const initialQuants = {};
          mapped.forEach(p => {
            initialQuants[p.sku] = p.sku === 'AC-WD-402' ? 10 : p.sku === 'BL-DAMP-05' ? 15 : 1;
          });
          setQuantities(initialQuants);
          return;
        }
      } catch (err) {
        console.warn('Error loading DB catalog, using fallbacks:', err.message);
      }
    }

    // Fallback quantities init
    const initialQuants = {};
    FALLBACK_PRODUCTS.forEach(p => {
      initialQuants[p.sku] = p.sku === 'AC-WD-402' ? 10 : p.sku === 'BL-DAMP-05' ? 15 : 1;
    });
    setQuantities(initialQuants);
  };

  // Cart operations
  const toggleCartItem = (product) => {
    if (cart.some(item => item.sku === product.sku)) {
      setCart(cart.filter(item => item.sku !== product.sku));
    } else {
      setCart([...cart, product]);
    }
  };

  const updateQuantity = (sku, val) => {
    const num = Math.max(1, Number(val));
    setQuantities({ ...quantities, [sku]: num });
  };

  // Calculations
  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const qty = quantities[item.sku] || 1;
      return total + (item.price * qty);
    }, 0);
  };

  const getVinSubsidy = () => {
    return houseValue * 0.06;
  };

  const getFinalAmount = () => {
    const subtotal = getSubtotal();
    const subsidy = getVinSubsidy();
    const final = subtotal - subsidy;
    return final > 0 ? final : 0;
  };

  const handleLogout = () => {
    localStorage.removeItem('qihome_user_profile');
    setProfile(null);
    router.push('/login');
  };

  const submitLoanForm = (e) => {
    e.preventDefault();
    setLoanSubmitted(true);
    setTimeout(() => {
      setShowLoanModal(false);
      setLoanSubmitted(false);
      alert('Hồ sơ của bạn đã được chuyển tiếp sang phòng thẩm định Techcombank! Hạn mức duyệt dự kiến sẽ có trong 24 giờ.');
    }, 1500);
  };

  const handleCreateContract = async () => {
    if (cart.length === 0) return;
    const projectCode = 'PRJ-HN-STORE-' + Date.now().toString().slice(-6);

    // Resolve pre-seeded IDs
    let subcontractorId = 'a0000000-0000-0000-0000-000000000004';
    let siteManagerId = 'a0000000-0000-0000-0000-000000000003';
    let salesId = 'a0000000-0000-0000-0000-000000000005';

    if (profile) {
      if (profile.role === 'subcontractor') subcontractorId = profile.id;
      if (profile.role === 'site_manager') siteManagerId = profile.id;
      if (profile.role === 'sales') salesId = profile.id;
    }

    try {
      if (isLive) {
        // Insert Project
        const { data: project, error: pError } = await supabase
          .from('projects')
          .insert([
            {
              project_code: projectCode,
              vinhomes_block: 'Golden Silk - Storefront',
              vinhomes_floor_căn: 'Phòng mẫu Showroom Hậu Nghĩa',
              client_name: 'Khách Hàng Trải Nghiệm',
              sales_id: salesId,
              site_manager_id: siteManagerId,
              subcontractor_id: subcontractorId,
              total_amount: getSubtotal(),
              status: 'pending_design'
            }
          ])
          .select()
          .single();

        if (pError) throw pError;

        // Insert BOM materials
        const bomInserts = cart.map(item => ({
          project_id: project.id,
          sku: item.sku,
          item_name: item.name,
          allocated_quantity: quantities[item.sku] || 1,
          disbursed_quantity: 0,
          unit: item.unit
        }));

        const { error: bError } = await supabase
          .from('bom_materials')
          .insert(bomInserts);

        if (bError) throw bError;

        alert(`🎉 Đã tạo Hợp đồng thành công trên LIVE DB!\n- Mã dự án: ${projectCode}\n- Định mức vật tư (BOM) đã được khóa.`);
      } else {
        alert(`🎉 Đã tạo Hợp đồng thành công (Mô phỏng Sandbox)!\n- Mã dự án: ${projectCode}\n- Trạng thái: pending_design\n- Định mức vật tư (BOM) đã được khóa cứng.\n\n(Vui lòng cấu hình Supabase trong .env.local để ghi vào database thật)`);
      }
      setCart([]);
    } catch (error) {
      alert('Lỗi tạo hợp đồng: ' + error.message);
    }
  };

  // Filter products list based on search and brand choice
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  // Extract all available brands
  const brandsList = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-3xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</span>
              <span className="font-bold text-xl text-white tracking-tight">QiHome.vn</span>
            </div>

            <div className="hidden md:flex space-x-8 text-sm">
              <Link href="#catalog" className="text-slate-300 hover:text-white transition">Showroom Vật Tư</Link>
              <Link href="/ai-studio" className="text-slate-300 hover:text-white transition flex items-center space-x-1">
                <span>🪄 AI Studio</span>
                <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase">Mới</span>
              </Link>
              {profile && (
                <Link href={
                  profile.role === 'admin' ? '/dashboard/admin' :
                  profile.role === 'accounting' ? '/dashboard/accounting' :
                  profile.role === 'site_manager' ? '/dashboard/site-manager' :
                  profile.role === 'subcontractor' ? '/dashboard/subcontractor' :
                  '/dashboard/sales'
                } className="text-amber-500 font-semibold hover:underline">
                  Vào Dashboard
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {profile ? (
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                    {profile.name}
                  </span>
                  <button onClick={handleLogout} className="text-xs text-red-400 hover:underline transition">
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link href="/login" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-amber-500/10">
                  Đăng Nhập OTP
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="relative bg-slate-900/20 py-20 border-b border-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-4xl mx-auto text-center px-4 space-y-6 relative z-10">
          {affiliate && (
            <div className="inline-block bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-1.5 text-xs text-amber-400 font-semibold animate-pulse">
              🤝 Chuyên viên tư vấn hỗ trợ: {affiliate.name} ({affiliate.code})
            </div>
          )}
          
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Nền Tảng Thiết Kế AI &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              Số Hóa Định Mức Vận Hành Nội Thất
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Dành riêng cho cư dân Vinhomes Hậu Nghĩa, Vinhomes Hóc Môn và Vinhomes Cần Giờ. Nhận tài trợ hoàn thiện đến 6% giá trị hợp đồng từ gói hợp tác Vingroup.
          </p>

          <div className="flex justify-center space-x-4 pt-4">
            <Link href="#catalog" className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition">
              Khám Phá Vật Tư
            </Link>
            <Link href="/ai-studio" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/10">
              🪄 Tự Thiết Kế Với AI
            </Link>
          </div>
        </div>
      </header>

      {/* Catalog & Smart Cart Showcase */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12" id="catalog">
        
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header & Filter Controls */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Danh mục Vật tư & Thiết bị Đạt chuẩn {isLive && '🟢'}</h2>
                <p className="text-xs text-slate-500 mt-1">Các sản phẩm phân phối chính hãng trưng bày tại Showroom Hậu Nghĩa 1000m²</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">Hiển thị: {filteredProducts.length} sản phẩm</span>
            </div>

            {/* Search Input and Brand filters */}
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm vật tư theo tên hoặc mã SKU..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600 flex-1"
              />
              
              {/* Brand select pills */}
              <div className="flex space-x-1.5 overflow-x-auto py-1">
                {brandsList.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedBrand === brand 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((prod) => {
              const inCart = cart.some(item => item.sku === prod.sku);
              return (
                <div 
                  key={prod.sku} 
                  className={`bg-slate-900/40 border rounded-2xl p-6 backdrop-blur transition flex flex-col justify-between ${
                    inCart ? 'border-amber-500 bg-amber-500/[0.02]' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{prod.image}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/80 rounded">
                        {prod.brand}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-4">{prod.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{prod.desc}</p>
                    <div className="text-[10px] text-slate-500 mt-2 font-semibold">SKU: {prod.sku}</div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-900">
                    <div>
                      <div className="text-base font-black text-amber-500">
                        {prod.price.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-[10px] text-slate-500">Đơn vị: {prod.unit}</div>
                    </div>

                    <button
                      onClick={() => toggleCartItem(prod)}
                      className={`text-xs font-bold px-4 py-2.5 rounded-xl transition ${
                        inCart ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
                      }`}
                    >
                      {inCart ? '✓ Đã Chọn' : 'Chọn Hạng Mục'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Cart Right Panel */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sticky top-24 backdrop-blur space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              🧾 Giỏ hàng thông minh (BOQ dự toán)
            </h3>

            {/* Slider Value */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Giá trị căn hộ Vinhomes:</span>
                <strong className="text-amber-500">{(houseValue / 1000000000).toFixed(1)} Tỷ VND</strong>
              </div>
              <input
                type="range"
                min="2000000000"
                max="15000000000"
                step="500000000"
                value={houseValue}
                onChange={(e) => setHouseValue(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>2 Tỷ</span>
                <span>8 Tỷ</span>
                <span>15 Tỷ</span>
              </div>
            </div>

            {/* Selected items list */}
            {cart.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Chưa có hạng mục vật tư nào được chọn. Chọn vật tư bên trái hoặc thiết kế AI để bóc tách BOQ tự động.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-900">
                {cart.map((item) => (
                  <div key={item.sku} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-200 truncate w-40">{item.name}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500">Số lượng:</span>
                        <input
                          type="number"
                          value={quantities[item.sku] || 1}
                          min="1"
                          onChange={(e) => updateQuantity(item.sku, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[10px] text-center w-10 py-0.5 rounded"
                        />
                        <span className="text-[10px] text-slate-500">({item.unit})</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-300">
                        {((item.price * (quantities[item.sku] || 1)).toLocaleString('vi-VN'))}đ
                      </div>
                      <button 
                        onClick={() => toggleCartItem(item)} 
                        className="text-[9px] text-red-400 hover:underline mt-1"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Block with Vin 6% Auto Deduct */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Dự toán trọn gói (BOQ):</span>
                <span className="font-bold text-slate-300">{getSubtotal().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
                <span className="flex items-center space-x-1">
                  <span>Vin tài trợ hoàn thiện:</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-1 py-0.5 rounded">6%</span>
                </span>
                <span className="font-bold text-emerald-400">-{getVinSubsidy().toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="flex justify-between items-center text-sm pt-1 font-black text-white">
                <span>Khách thanh toán đợt 1:</span>
                <span className="text-amber-500">{getFinalAmount().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Interactive Checkout Actions */}
            <div className="space-y-3 pt-2">
              <button
                disabled={cart.length === 0}
                onClick={() => setShowLoanModal(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
              >
                Nhận Duyệt Hạn Mức Tín Chấp Techcombank
              </button>

              <button
                disabled={cart.length === 0}
                onClick={handleCreateContract}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700/60 text-slate-200 font-semibold py-3 rounded-xl transition text-center text-xs"
              >
                Ký Hợp Đồng Thử Nghiệm (OTP)
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Credit Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowLoanModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
              🏦 Hồ sơ Liên kết Tín chấp Techcombank
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Bạn đang đăng ký khoản vay ưu đãi 0% lãi suất hạn mức tối đa bằng 70% giá trị hợp đồng thiết kế thi công lắp đặt tại QiHome.vn.
            </p>

            <form onSubmit={submitLoanForm} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={loanForm.fullName}
                  onChange={(e) => setLoanForm({ ...loanForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Số điện thoại đăng ký vay</label>
                <input
                  type="text"
                  required
                  placeholder="0912345678"
                  value={loanForm.phone}
                  onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Thu nhập hàng tháng</label>
                <select
                  value={loanForm.income}
                  onChange={(e) => setLoanForm({ ...loanForm, income: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="under-20">Dưới 20 triệu VND</option>
                  <option value="20-50">Từ 20 - 50 triệu VND</option>
                  <option value="50-100">Từ 50 - 100 triệu VND</option>
                  <option value="over-100">Trên 100 triệu VND</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Kỳ hạn vay mong muốn</label>
                <select
                  value={loanForm.tenure}
                  onChange={(e) => setLoanForm({ ...loanForm, tenure: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="3">3 năm (Lãi suất ưu đãi)</option>
                  <option value="5">5 năm</option>
                  <option value="10">10 năm</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loanSubmitted}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs mt-6"
              >
                {loanSubmitted ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Đăng Ký Vay'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950/20 text-center text-xs text-slate-500">
        <p>© 2026 QiHome.vn - Nền tảng số hóa quản trị nội thất thông minh. Đối tác phân phối Blum, An Cường, Dulux, Kohler.</p>
      </footer>
    </div>
  );
}

export default function Storefront() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 text-xs">
        Đang tải Showroom...
      </div>
    }>
      <StorefrontContent />
    </Suspense>
  );
}
