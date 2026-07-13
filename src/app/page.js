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
  'SALE-NAM86': 'Lê Thu Trang',
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

  // Guest warning registration modal
  const [showRegModal, setShowRegModal] = useState(false);

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

  // Cart operations (Locked for Guests)
  const toggleCartItem = (product) => {
    if (!profile) {
      setShowRegModal(true);
      return;
    }
    if (cart.some(item => item.sku === product.sku)) {
      setCart(cart.filter(item => item.sku !== product.sku));
    } else {
      setCart([...cart, product]);
    }
  };

  const updateQuantity = (sku, val) => {
    if (!profile) return;
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

  // Vin 6% subsidy only visible for members
  const getVinSubsidy = () => {
    if (!profile) return 0;
    return getSubtotal() * 0.06;
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
    if (!profile) {
      setShowRegModal(true);
      return;
    }
    if (cart.length === 0) return;
    const projectCode = 'PRJ-HN-STORE-' + Date.now().toString().slice(-6);

    let subcontractorId = 'a0000000-0000-0000-0000-000000000004';
    let siteManagerId = 'a0000000-0000-0000-0000-000000000003';
    let salesId = 'a0000000-0000-0000-0000-000000000005';

    try {
      if (isLive) {
        // Insert Project
        const { data: project, error: pError } = await supabase
          .from('projects')
          .insert([
            {
              project_code: projectCode,
              vinhomes_block: 'Golden Silk - Storefront',
              vinhomes_floor_căn: profile.apartment_code || 'Phòng mẫu Showroom Hậu Nghĩa',
              client_name: profile.name,
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

        // Insert split 1% + 1% commissions for sales
        await supabase
          .from('commissions')
          .insert([
            {
              project_id: project.id,
              sales_id: salesId,
              commission_rate: 0.01,
              stage: 1,
              amount: getSubtotal() * 0.01,
              status: 'pending'
            },
            {
              project_id: project.id,
              sales_id: salesId,
              commission_rate: 0.01,
              stage: 2,
              amount: getSubtotal() * 0.01,
              status: 'pending'
            }
          ]);

        alert(`🎉 Đã tạo Hợp đồng thành công trên LIVE DB!\n- Mã dự án: ${projectCode}\n- Định mức vật tư (BOM) đã được khóa.`);
      } else {
        // Mock commission updates in local storage
        let storedComms = localStorage.getItem('qihome_shared_commissions');
        const comms = storedComms ? JSON.parse(storedComms) : [];
        const newComms = [
          { id: `COM-${Date.now()}A`, projectCode, clientName: profile.name, gross: getSubtotal() * 0.01, stage: 1, title: 'Hoa hồng đợt 1 (Khách thanh toán đợt 1)', status: 'pending', date: '---', expectedDate: '' },
          { id: `COM-${Date.now()}B`, projectCode, clientName: profile.name, gross: getSubtotal() * 0.01, stage: 2, title: 'Hoa hồng đợt 2 (Bàn giao căn hộ)', status: 'pending', date: '---', expectedDate: '' }
        ];
        localStorage.setItem('qihome_shared_commissions', JSON.stringify([...newComms, ...comms]));

        alert(`🎉 Đã tạo Hợp đồng thành công (Mô phỏng Sandbox)!\n- Mã dự án: ${projectCode}\n- Trạng thái: pending_design\n- Định mức vật tư (BOM) đã được khóa cứng.\n- Ghi nhận hoa hồng đợt 1 (1%) & đợt 2 (1%) vào lịch sử giải ngân.`);
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

  const brandsList = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf8f5] text-slate-800">
      {/* Navigation */}
      <nav className="border-b border-[#ebdcb9] bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-3xl tracking-wider text-[#c49a62] bg-[#c49a62]/10 border border-[#ebdcb9] px-3 py-1 rounded-xl">Qi</span>
              <span className="font-bold text-xl text-slate-900 tracking-tight">QiHome.vn</span>
            </div>

            <div className="hidden md:flex space-x-8 text-xs font-bold items-center">
              <Link href="#catalog" className="text-slate-650 hover:text-[#c49a62] transition">Showroom Vật Tư</Link>
              <Link href="/ai-studio" className="text-slate-650 hover:text-[#c49a62] transition flex items-center space-x-1">
                <span>🪄 AI Studio</span>
                <span className="bg-[#c49a62]/10 text-[#c49a62] text-[9px] px-1.5 py-0.5 rounded border border-[#ebdcb9] font-bold uppercase">Mới</span>
              </Link>
              {profile && (
                <Link href={
                  profile.role === 'admin' ? '/dashboard/admin' :
                  profile.role === 'accounting' ? '/dashboard/accounting' :
                  profile.role === 'site_manager' ? '/dashboard/site-manager' :
                  profile.role === 'subcontractor' ? '/dashboard/subcontractor' :
                  '/dashboard/sales'
                } className="text-[#c49a62] font-extrabold hover:underline">
                  Vào Dashboard ({profile.role.toUpperCase()})
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {profile ? (
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-600 font-bold uppercase bg-[#faf8f5] border border-[#ebdcb9] px-3 py-1.5 rounded-xl">
                    {profile.name} {profile.is_vinhomes_resident && '🏡'}
                  </span>
                  <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:underline transition">
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link href="/login" className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-[#c49a62]/10">
                  Đăng Nhập / Đăng Ký
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="relative bg-[#f5eeda] py-16 border-b border-[#ebdcb9] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c49a62]/5 via-transparent to-transparent opacity-65"></div>
        <div className="max-w-4xl mx-auto text-center px-4 space-y-5 relative z-10">
          
          {affiliate && (
            <div className="inline-block bg-[#c49a62]/15 border border-[#ebdcb9] rounded-2xl px-4 py-1.5 text-xs text-[#c49a62] font-semibold animate-pulse">
              🤝 Chuyên viên tư vấn hỗ trợ: {affiliate.name}
            </div>
          )}
          
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Nền Tảng Thiết Kế AI &<br />
            <span className="text-[#c49a62]">
              Số Hóa Định Mức Vận Hành Nội Thất
            </span>
          </h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
            Dành riêng cho cư dân Vinhomes Hậu Nghĩa, Vinhomes Hóc Môn và Vinhomes Cần Giờ. Nhận tài trợ hoàn thiện đến 6% giá trị hợp đồng từ gói hợp tác Vingroup.
          </p>

          <div className="flex justify-center space-x-4 pt-3">
            <Link href="#catalog" className="bg-white hover:bg-slate-50 border border-[#ebdcb9] text-slate-800 font-bold text-xs px-6 py-3 rounded-xl transition">
              Khám Phá Vật Tư
            </Link>
            <Link href="/ai-studio" className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-[#c49a62]/10">
              🪄 Tự Thiết Kế Với AI
            </Link>
          </div>
        </div>
      </header>

      {/* Hạng mục 2A: 3 Trục Sản Phẩm Cột Trụ (Product Pillars) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="text-center text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-6">Trục Sản Phẩm Cốt Trụ QiHome</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 1 */}
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-3xl">📦</div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Combo Nội Thất Hoàn Thiện</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Các gói combo đồng bộ thiết kế chuẩn mực theo mặt bằng bàn giao Vinhomes Hậu Nghĩa. Tối ưu chi phí, hoàn thiện nhanh chóng.
              </p>
            </div>
            <Link href="/ai-studio" className="text-xs font-black text-[#c49a62] hover:underline flex items-center space-x-1.5 pt-2">
              <span>Trải nghiệm AI ngay</span> <span>➔</span>
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-3xl">🏰</div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">May Đo Biệt Thự & Shophouse</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Thiết kế thi công may đo trọn gói cá nhân hoá thẩm mỹ cho biệt thự cao cấp. Bóc tách BOQ chi tiết, kiểm soát tiến độ trên ứng dụng.
              </p>
            </div>
            <Link href="/ai-studio" className="text-xs font-black text-[#c49a62] hover:underline flex items-center space-x-1.5 pt-2">
              <span>Trải nghiệm AI ngay</span> <span>➔</span>
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-3xl">🛋️</div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Cung Ứng Đồ Rời Cao Cấp</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Showroom đồ gỗ nội thất rời cao cấp nhập khẩu và gia công tại xưởng chuẩn An Cường Pro. Bản lề Blum bảo hành trọn đời.
              </p>
            </div>
            <Link href="/ai-studio" className="text-xs font-black text-[#c49a62] hover:underline flex items-center space-x-1.5 pt-2">
              <span>Trải nghiệm AI ngay</span> <span>➔</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Catalog & Smart Cart Showcase */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12" id="catalog">
        
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Danh mục Vật tư & Thiết bị Đạt chuẩn</h2>
                <p className="text-xs text-slate-550 mt-0.5">Các sản phẩm phân phối chính hãng trưng bày tại Showroom Hậu Nghĩa 1000m²</p>
              </div>
              <span className="text-xs text-slate-500 font-bold">Hiển thị: {filteredProducts.length} sản phẩm</span>
            </div>

            {/* Search and Brand Filters */}
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm vật tư theo tên hoặc mã SKU..."
                className="bg-white border border-[#ebdcb9] rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none placeholder-slate-400 flex-1"
              />
              
              <div className="flex space-x-1.5 overflow-x-auto py-1">
                {brandsList.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedBrand === brand 
                        ? 'bg-[#c49a62] text-white' 
                        : 'bg-white border border-[#ebdcb9] hover:border-[#c49a62]/40 text-slate-500'
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
                  className={`bg-white border border-[#ebdcb9] rounded-2xl p-5 transition duration-300 flex flex-col justify-between hover:shadow-md ${
                    inCart ? 'border-[#c49a62] bg-[#c49a62]/[0.02]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{prod.image}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#faf8f5] text-slate-500 border border-[#ebdcb9] rounded">
                        {prod.brand}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 mt-4">{prod.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prod.desc}</p>
                    <div className="text-[9px] text-slate-400 mt-2 font-mono">SKU: {prod.sku}</div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-sm font-black text-[#c49a62]">
                        {prod.price.toLocaleString('vi-VN')}đ
                      </div>
                      <span className="text-[9px] text-slate-400">Đơn vị: {prod.unit}</span>
                    </div>

                    <button
                      onClick={() => toggleCartItem(prod)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                        inCart ? 'bg-[#c49a62] text-white' : 'bg-[#faf8f5] hover:bg-slate-100 border border-[#ebdcb9] text-slate-650'
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

        {/* Smart Cart Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl p-6 sticky top-24 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>🧾 Giỏ hàng (BOQ dự toán)</span>
              {profile && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black">MEMBERS-ONLY</span>}
            </h3>

            {/* Slider Value (Only works for logged-in members) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Giá trị căn hộ Vinhomes:</span>
                <strong className="text-[#c49a62]">{(houseValue / 1000000000).toFixed(1)} Tỷ VND</strong>
              </div>
              <input
                type="range"
                min="2000000000"
                max="15000000000"
                step="500000000"
                disabled={!profile}
                value={houseValue}
                onChange={(e) => setHouseValue(Number(e.target.value))}
                className="w-full h-1.5 bg-[#faf8f5] rounded-lg appearance-none cursor-pointer accent-[#c49a62]"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>2 Tỷ</span>
                <span>8 Tỷ</span>
                <span>15 Tỷ</span>
              </div>
            </div>

            {/* Cart content checks */}
            {!profile ? (
              /* GUEST CART BLOCKING WARNING */
              <div className="p-4 bg-amber-500/5 border border-[#ebdcb9] rounded-2xl text-center space-y-3">
                <div className="text-xl">🔒</div>
                <div className="text-xs font-bold text-slate-800">Tính năng Giỏ hàng bị Khóa</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Vui lòng đăng nhập để lưu cấu hình, bóc tách BOQ, nhận trợ giá hoàn thiện 6% Vin và nộp hồ sơ tín chấp Techcombank.
                </p>
                <Link href="/login" className="inline-block bg-[#c49a62] hover:bg-[#b08752] text-white font-bold text-[10px] px-4 py-2 rounded-xl transition">
                  Đăng Nhập / Đăng Ký Ngay
                </Link>
              </div>
            ) : (
              /* MEMBER CART ACTIVE VIEW */
              <>
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Chưa có vật tư nào được chọn. Hãy chọn vật tư bên trái hoặc vào AI Studio để kết xuất phối cảnh 3D bóc tách BOQ tự động.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
                    {cart.map((item) => (
                      <div key={item.sku} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 truncate w-32">{item.name}</div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] text-slate-400">Số lượng:</span>
                            <input
                              type="number"
                              value={quantities[item.sku] || 1}
                              min="1"
                              onChange={(e) => updateQuantity(item.sku, e.target.value)}
                              className="bg-[#faf8f5] border border-[#ebdcb9] text-[10px] text-center w-8 py-0.5 rounded text-slate-800"
                            />
                            <span className="text-[9px] text-slate-400">({item.unit})</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-700">
                            {((item.price * (quantities[item.sku] || 1)).toLocaleString('vi-VN'))}đ
                          </div>
                          <button 
                            onClick={() => toggleCartItem(item)} 
                            className="text-[9px] text-red-500 hover:underline mt-0.5"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subsidies Summary block */}
                <div className="bg-[#faf8f5] border border-[#ebdcb9] rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Dự toán trọn gói (BOQ):</span>
                    <span className="font-bold text-slate-700">{getSubtotal().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 border-b border-slate-100 pb-2">
                    <span className="flex items-center space-x-1">
                      <span>Vin hỗ trợ hoàn thiện:</span>
                      <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded">6%</span>
                    </span>
                    <span className="font-bold text-emerald-600">-{getVinSubsidy().toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 font-black text-slate-900">
                    <span>Thanh toán Đợt 1 (Sau trừ 6%):</span>
                    <span className="text-[#c49a62] text-sm">{getFinalAmount().toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {/* Member interactive buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setShowLoanModal(true)}
                    className="w-full bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-center text-xs shadow-md"
                  >
                    🏦 Nhận Duyệt Hạn Mức Tín Chấp Techcombank
                  </button>

                  <button
                    disabled={cart.length === 0}
                    onClick={handleCreateContract}
                    className="w-full bg-white hover:bg-slate-50 disabled:opacity-50 border border-[#ebdcb9] text-slate-700 font-bold py-3 rounded-xl transition text-center text-xs"
                  >
                    ✍️ Ký Hợp Đồng Thử Nghiệm (OTP)
                  </button>
                </div>
              </>
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

      {/* Techcombank Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl w-full max-w-md p-6 relative text-slate-800">
            <button 
              onClick={() => setShowLoanModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-sm font-extrabold text-slate-900 mb-2 uppercase tracking-wide">
              🏦 Hồ sơ Liên kết Tín chấp Techcombank
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Bạn đang đăng ký khoản vay ưu đãi 0% lãi suất hạn mức tối đa bằng 70% giá trị hợp đồng thiết kế thi công lắp đặt tại QiHome.vn.
            </p>

            <form onSubmit={submitLoanForm} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Họ và tên người vay</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Thu Trang"
                  value={loanForm.fullName}
                  onChange={(e) => setLoanForm({ ...loanForm, fullName: e.target.value })}
                  className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Số điện thoại liên kết</label>
                <input
                  type="text"
                  required
                  placeholder="0901234567"
                  value={loanForm.phone}
                  onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                  className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Thu nhập hàng tháng</label>
                <select
                  value={loanForm.income}
                  onChange={(e) => setLoanForm({ ...loanForm, income: e.target.value })}
                  className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
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
                  className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="3">3 năm (Lãi suất ưu đãi 0%)</option>
                  <option value="5">5 năm</option>
                  <option value="10">10 năm</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loanSubmitted}
                className="w-full bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-center text-xs mt-4"
              >
                {loanSubmitted ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Đăng Ký Vay'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#ebdcb9] py-8 bg-white text-center text-xs text-slate-500 mt-12">
        <p>© 2026 QiHome.vn - Nền tảng số hóa quản trị nội thất thông minh. Đối tác phân phối Blum, An Cường, Dulux, Kohler.</p>
      </footer>
    </div>
  );
}

export default function Storefront() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center text-[#c49a62] text-xs font-bold">
        Đang tải Showroom...
      </div>
    }>
      <StorefrontContent />
    </Suspense>
  );
}
