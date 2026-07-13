'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Static products with real high-quality image paths, original vs promo prices, and galleries
const ECOM_PRODUCTS = [
  { 
    sku: 'SF-LTH-01', 
    name: 'Sofa Da Cao Cấp Indochine', 
    brand: 'QiPrime', 
    originalPrice: 35000000, 
    price: 28000000, 
    unit: 'Bộ', 
    image: '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg', 
    gallery: [
      '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg',
      '/images/2058be0fc565abd95aee1b05d1390795.jpg',
      '/images/3584231b70bb4769c06767be070aa59d.jpg'
    ],
    desc: 'Khung gỗ sồi tự nhiên, bọc da bò nhập khẩu Ý. Thiết kế giao thoa Đông Dương tinh tế.',
    specs: 'Kích thước: 2m4 x 0.9m. Khung: Gỗ sồi Mỹ. Đệm mút: Inoac Nhật Bản.'
  },
  { 
    sku: 'LT-CHR-02', 
    name: 'Đèn Chùm Pha Lê Indochine', 
    brand: 'Euroto', 
    originalPrice: 18000000, 
    price: 15000000, 
    unit: 'Bộ', 
    image: '/images/365c4c688df7b1f8f2b304bdc8d8f8ee.jpg', 
    gallery: [
      '/images/365c4c688df7b1f8f2b304bdc8d8f8ee.jpg',
      '/images/1626aee735a6d69aa16af41338600615.jpg'
    ],
    desc: 'Thiết kế cổ điển kết hợp tinh thể pha lê K9 lấp lánh phản chiếu ánh sáng sang trọng.',
    specs: 'Đường kính: 80cm. Số đuôi đèn: E14 x 12 bóng. Chất liệu: Đồng thau + Pha lê K9.'
  },
  { 
    sku: 'AC-WD-402', 
    name: 'Hệ Tủ Bếp Gỗ Melamine Cao Cấp', 
    brand: 'An Cường', 
    originalPrice: 4900000, 
    price: 4200000, 
    unit: 'Mét tới', 
    image: '/images/cb17520f98fa50444b4d580964fc69e7.jpg', 
    gallery: [
      '/images/cb17520f98fa50444b4d580964fc69e7.jpg',
      '/images/306d8ed842d197c34447a81976615549.jpg'
    ],
    desc: 'Chống ẩm tốt, chống trầy xước chuẩn chất lượng lõi gỗ MDF An Cường.',
    specs: 'Độ dày cánh: 18mm. Lõi: MDF chống ẩm Thái Lan. Bề mặt: Phủ Melamine mã màu chỉ định.'
  },
  { 
    sku: 'BL-DAMP-05', 
    name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', 
    brand: 'Blum', 
    originalPrice: 420000, 
    price: 350000, 
    unit: 'Bộ', 
    image: '/images/6080384cd8220dbc4c266ca5fd07b534.jpg', 
    gallery: [
      '/images/6080384cd8220dbc4c266ca5fd07b534.jpg'
    ],
    desc: 'Vận hành đóng mở êm ái tuyệt đối, triệt tiêu tiếng ồn, độ bền kiểm nghiệm 200,000 lần.',
    specs: 'Chất liệu: Thép mạ niken. Góc mở: 110 độ. Loại giảm chấn tích hợp công nghệ Blumotion.'
  },
  { 
    sku: 'DL-UX-18', 
    name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', 
    brand: 'Dulux', 
    originalPrice: 1500000, 
    price: 1200000, 
    unit: 'Thùng', 
    image: '/images/08e81d5e795d931fe999bc1780a40ba4.jpg', 
    gallery: [
      '/images/08e81d5e795d931fe999bc1780a40ba4.jpg'
    ],
    desc: 'Khả năng lau chùi vết bẩn tối ưu, kháng khuẩn hiệu quả, an toàn cho sức khỏe gia đình.',
    specs: 'Dung tích: 15 Lít. Độ phủ lý thuyết: 11-13 m²/lít/lớp. Công nghệ kháng khuẩn bạc.'
  },
  { 
    sku: 'KH-SNK-99', 
    name: 'Bồn Rửa Chén Kohler Đẳng Cấp', 
    brand: 'Kohler', 
    originalPrice: 9200000, 
    price: 7800000, 
    unit: 'Bộ', 
    image: '/images/cd9e64d0b00dd68229be9255288b0379.jpg', 
    gallery: [
      '/images/cd9e64d0b00dd68229be9255288b0379.jpg'
    ],
    desc: 'Chất liệu thép không gỉ liền khối dày dặn, chống xước, chống bám bẩn ưu việt.',
    specs: 'Kích thước: 820 x 480 x 220 mm. Lắp đặt: Dương bàn hoặc Âm bàn tủ bếp.'
  }
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
  const [products, setProducts] = useState(ECOM_PRODUCTS);
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

  // Product detail view state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Hero Banner Slider Images setup
  const HERO_IMAGES = [
    '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg',
    '/images/cb17520f98fa50444b4d580964fc69e7.jpg',
    '/images/306d8ed842d197c34447a81976615549.jpg',
    '/images/1626aee735a6d69aa16af41338600615.jpg'
  ];
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  // Slide interval for running background
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Initialize profile & affiliate parameters
  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }

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
          const mapped = data.map(item => {
            const matchLocal = ECOM_PRODUCTS.find(p => p.sku === item.sku);
            return {
              sku: item.sku,
              name: item.name,
              brand: item.brand,
              price: Number(item.price),
              originalPrice: matchLocal ? matchLocal.originalPrice : Math.round(Number(item.price) * 1.2),
              unit: item.unit,
              image: matchLocal ? matchLocal.image : '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg',
              gallery: matchLocal ? matchLocal.gallery : ['/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg'],
              desc: item.description || 'Sản phẩm hoàn thiện chính hãng chất lượng cao.',
              specs: matchLocal ? matchLocal.specs : 'Chất liệu: Đạt chuẩn quốc tế.'
            };
          });
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

    const initialQuants = {};
    ECOM_PRODUCTS.forEach(p => {
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const brandsList = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setActiveGalleryIndex(0);
  };

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

      {/* Hero Banner with moving background taken from style renders */}
      <header className="relative py-24 border-b border-[#ebdcb9] overflow-hidden transition-all duration-1000 ease-in-out">
        {/* Sliding background container */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105"
          style={{ backgroundImage: `url(${HERO_IMAGES[heroImageIndex]})` }}
        ></div>
        {/* Soft elegant warm layout overlay */}
        <div className="absolute inset-0 bg-[#f5eeda]/85 backdrop-blur-[2px]"></div>

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
          <p className="text-slate-700 text-sm max-w-xl mx-auto leading-relaxed font-semibold">
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

      {/* 3 Trục Sản Phẩm Cột Trụ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="text-center text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-6">Trục Sản Phẩm Cốt Trụ QiHome</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        
        {/* Products Grid (E-commerce Focus) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Siêu Thị Nội Thất & Thiết Bị Đạt Chuẩn</h2>
                <p className="text-xs text-slate-550 mt-0.5">Hình ảnh sản phẩm chuẩn mực trưng bày tại hệ thống QiHome Showroom</p>
              </div>
              <span className="text-xs text-slate-500 font-bold">Hiển thị: {filteredProducts.length} sản phẩm</span>
            </div>

            {/* Search and Brand Filters */}
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
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

          {/* E-Commerce Grid with Focus on High Quality Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((prod) => {
              const inCart = cart.some(item => item.sku === prod.sku);
              const discountPct = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);

              return (
                <div 
                  key={prod.sku} 
                  className="bg-white border border-[#ebdcb9] rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition duration-300 group"
                >
                  {/* Large Product Image (Hình ảnh làm trọng tâm) */}
                  <div 
                    onClick={() => handleProductClick(prod)}
                    className="h-64 overflow-hidden relative cursor-pointer bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={prod.image} 
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    {/* Brand Badge */}
                    <span className="absolute top-4 left-4 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-[#c49a62] text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm border border-[#ebdcb9]/40">
                      {prod.brand}
                    </span>

                    {/* Sale Badge */}
                    <span className="absolute top-4 right-4 px-2 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase rounded shadow-sm">
                      -{discountPct}%
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div onClick={() => handleProductClick(prod)} className="cursor-pointer space-y-1.5">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#c49a62] transition line-clamp-1">{prod.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{prod.desc}</p>
                      <div className="text-[9px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        {/* Discounted price & crossed-out original price */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs text-slate-400 line-through font-medium">
                            {prod.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-sm font-black text-[#c49a62]">
                            {prod.price.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400">Đơn vị: {prod.unit}</div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleProductClick(prod)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-2 rounded-xl transition"
                        >
                          Chi Tiết
                        </button>
                        <button
                          onClick={() => toggleCartItem(prod)}
                          className={`text-[10px] font-bold px-3 py-2 rounded-xl transition ${
                            inCart ? 'bg-[#c49a62] text-white' : 'bg-[#faf8f5] hover:bg-slate-100 border border-[#ebdcb9] text-slate-650'
                          }`}
                        >
                          {inCart ? '✓ Giỏ Hàng' : 'Chọn mua'}
                        </button>
                      </div>
                    </div>
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

            {/* Slider Value */}
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
              <div className="p-4 bg-amber-500/5 border border-[#ebdcb9] rounded-2xl text-center space-y-3">
                <div className="text-xl">🔒</div>
                <div className="text-xs font-bold text-slate-800">Tính năng Giỏ hàng bị Khóa</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Vui lòng đăng nhập để lưu cấu hình, bóc tách BOQ, nhận trợ giá hoàn thiện 6% Vin và nộp hồ sơ tín chấp Techcombank.
                </p>
                <Link href="/login" className="inline-block bg-[#c49a62] hover:bg-[#b08752] text-white font-bold text-[10px] px-4 py-2 rounded-xl transition animate-pulse">
                  Đăng Nhập / Đăng Ký Ngay
                </Link>
              </div>
            ) : (
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
                    <span>Thành toán Đợt 1 (Sau trừ 6%):</span>
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

      {/* PRODUCT DETAILS MODAL (Trang mô tả chi tiết sản phẩm) */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl w-full max-w-2xl p-6 relative text-slate-800 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition text-lg font-bold z-10"
            >
              ✕
            </button>

            {/* Left part: Product images with mini-gallery */}
            <div className="flex-1 space-y-4">
              <div className="h-64 rounded-2xl overflow-hidden bg-slate-100 border border-[#ebdcb9] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedProduct.gallery[activeGalleryIndex] || selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              </div>

              {/* Gallery switcher thumbs */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                <div className="flex space-x-2.5 overflow-x-auto py-1">
                  {selectedProduct.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition ${
                        activeGalleryIndex === idx ? 'border-[#c49a62]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right part: Description details */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#c49a62] bg-[#c49a62]/10 border border-[#ebdcb9] px-2.5 py-0.5 rounded-full">
                  {selectedProduct.brand}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-2">{selectedProduct.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">SKU: {selectedProduct.sku}</p>
                
                <div className="flex items-center space-x-2 mt-3">
                  <span className="text-xs text-slate-400 line-through font-semibold">
                    {selectedProduct.originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-base font-black text-[#c49a62]">
                    {selectedProduct.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded">
                    Khuyến mãi
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Mô tả sản phẩm:</strong>
                    <span className="text-slate-600 leading-relaxed block">{selectedProduct.desc}</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Thông số kỹ thuật:</strong>
                    <span className="text-slate-600 font-mono text-[10px] block bg-[#faf8f5] p-2 rounded-xl border border-[#ebdcb9]">{selectedProduct.specs}</span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {profile ? (
                  <>
                    <div className="flex items-center space-x-2 bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-2 py-1.5">
                      <span className="text-[9px] font-bold text-slate-400">SL:</span>
                      <input
                        type="number"
                        min="1"
                        value={quantities[selectedProduct.sku] || 1}
                        onChange={(e) => updateQuantity(selectedProduct.sku, e.target.value)}
                        className="bg-transparent text-xs font-bold text-center w-8 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => toggleCartItem(selectedProduct)}
                      className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition ${
                        cart.some(item => item.sku === selectedProduct.sku)
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-[#c49a62] hover:bg-[#b08752] text-white'
                      }`}
                    >
                      {cart.some(item => item.sku === selectedProduct.sku) ? 'Bỏ Khỏi Giỏ' : 'Thêm Vào Giỏ Hàng'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setShowRegModal(true);
                    }}
                    className="w-full bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-2.5 rounded-xl text-xs shadow-sm"
                  >
                    🔒 Đăng ký thành viên để mua hàng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
