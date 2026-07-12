'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock catalog items
const CATALOG_PRODUCTS = [
  { sku: 'SF-LTH-01', name: 'Sofa Da Cao Cấp Indochine', brand: 'QiPrime', price: 28000000, unit: 'Bộ', image: '🛋️', desc: 'Khung gỗ sồi tự nhiên, bọc da bò nhập khẩu Ý.' },
  { sku: 'LT-CHR-02', name: 'Đèn Chùm Pha Lê Indochine', brand: 'Euroto', price: 15000000, unit: 'Bộ', image: '💡', desc: 'Thiết kế cổ điển giao thoa Á - Âu sang trọng.' },
  { sku: 'AC-WD-402', name: 'Hệ Tủ Bếp Gỗ Melamine Cao Cấp', brand: 'An Cường', price: 4200000, unit: 'Mét tới', image: '🚪', desc: 'Chống ẩm, chống trầy xước chuẩn An Cường.' },
  { sku: 'BL-DAMP-05', name: 'Bộ Ray Trượt Bản Lề Giảm Chấn', brand: 'Blum', price: 350000, unit: 'Bộ', image: '🔩', desc: 'Vận hành êm ái, bảo hành trọn đời.' },
  { sku: 'DL-UX-18', name: 'Sơn Nội Thất Cao Cấp Dulux EasyClean', brand: 'Dulux', price: 1200000, unit: 'Thùng', image: '🎨', desc: 'Lau chùi tối ưu, kháng khuẩn bảo vệ sức khỏe.' },
  { sku: 'KH-SNK-99', name: 'Bồn Rửa Chén Kohler Đẳng Cấp', brand: 'Kohler', price: 7800000, unit: 'Bộ', image: '🚰', desc: 'Thép không gỉ đúc liền khối siêu bền.' }
];

// Mock sales agents database
const SALES_AGENTS = {
  'SALE-NAM86': 'Phạm Hoàng Nam',
  'SALE-LINH90': 'Trần Hoài Linh',
  'SALE-QUANG86': 'Nguyễn Duy Quang'
};

function StorefrontContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [affiliate, setAffiliate] = useState(null);
  const [houseValue, setHouseValue] = useState(5000000000); // Default 5 billion VND
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [profile, setProfile] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({ fullName: '', phone: '', income: '20-50', tenure: '3' });
  const [loanSubmitted, setLoanSubmitted] = useState(false);

  // Load profile and parse affiliate link
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

    // Initialize quantities for products
    const initialQuants = {};
    CATALOG_PRODUCTS.forEach(p => {
      initialQuants[p.sku] = p.sku === 'AC-WD-402' ? 10 : p.sku === 'BL-DAMP-05' ? 15 : 1;
    });
    setQuantities(initialQuants);
  }, [searchParams]);

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
    // Vin subsidy is 6% of the house value
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

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</span>
              <span className="font-bold text-xl text-white tracking-tight">QiHome.vn</span>
            </div>
            
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#catalog" className="text-slate-400 hover:text-white transition text-sm font-medium">Danh mục Sản phẩm</a>
              <Link href="/ai-studio" className="text-amber-400 hover:text-amber-300 transition text-sm font-semibold flex items-center space-x-1.5">
                <span>🤖 AI Interior Studio</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded">Mới</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {profile ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Xin chào,</div>
                    <div className="text-sm font-semibold text-white">{profile.name}</div>
                  </div>
                  <button 
                    onClick={() => {
                      // Redirect to their dashboard
                      router.push(`/dashboard/${profile.role.replace('_', '-')}`);
                    }}
                    className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-3.5 py-2 rounded-xl font-semibold hover:bg-amber-500/20 transition"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Thoát
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-amber-500 text-slate-950 text-xs px-4 py-2.5 rounded-xl font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-500/10"
                >
                  Đăng nhập Hệ thống
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Affiliate Banner */}
      {affiliate && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 text-center text-xs text-amber-400 font-medium">
          🤝 Chuyên viên tư vấn Vingroup hỗ trợ bạn: <strong className="text-white">{affiliate.name}</strong> ({affiliate.code})
        </div>
      )}

      {/* Hero Section */}
      <header className="relative py-24 overflow-hidden border-b border-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold tracking-wide uppercase">
            Giải pháp Nội thất Cách mạng 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mt-6 tracking-tight leading-none">
            Sở Hữu Căn Hộ Vinhomes <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              Nội Thất 0 Đồng*
            </span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Hợp tác chiến lược tay ba: <strong>Vinhomes tài trợ 6%</strong> giá trị nhà trực tiếp vào gói nội thất, <strong>Techcombank hỗ trợ tín chấp 3 - 5 năm</strong>. Lên thiết kế bằng <strong>AI Engine</strong> trong 30 giây!
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/ai-studio" 
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold py-3.5 px-8 rounded-xl transition text-center shadow-xl shadow-amber-500/10"
            >
              Trải nghiệm AI Thiết kế Ngay
            </Link>
            <a 
              href="#smart-billing" 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold py-3.5 px-8 rounded-xl transition text-center"
            >
              Xem Giỏ hàng & Tính toán 6%
            </a>
          </div>
        </div>
      </header>

      {/* Catalog & Smart Cart Showcase */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12" id="catalog">
        
        {/* Products Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Danh mục Sản phẩm Đạt chuẩn</h2>
              <p className="text-xs text-slate-500 mt-1">Các sản phẩm phân phối chính hãng trưng bày tại Showroom Hậu Nghĩa 1000m²</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Hiển thị: 6 sản phẩm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATALOG_PRODUCTS.map((prod) => {
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
                    <h3 className="text-base font-bold text-slate-100 mt-4 leading-tight">{prod.name}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{prod.desc}</p>
                    <div className="text-xs text-slate-600 mt-1">SKU: {prod.sku}</div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Đơn giá ({prod.unit})</div>
                      <div className="text-base font-bold text-amber-500">
                        {prod.price.toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCartItem(prod)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                        inCart 
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-600' 
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      {inCart ? '✓ Đã Chọn' : '+ Thêm gói'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Billing Cart */}
        <div className="lg:col-span-1" id="smart-billing">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur sticky top-28 shadow-2xl">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-between">
              <span>💳 Giỏ hàng thông minh (Smart Billing)</span>
              <span className="text-xs font-medium px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/80 rounded-full">
                {cart.length} món
              </span>
            </h3>

            {/* Slider for House Value */}
            <div className="mt-6 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-2">
                <span>Nhà Vinhomes Hậu Nghĩa</span>
                <span className="text-amber-400 font-bold">{(houseValue / 1000000000).toFixed(1)} Tỷ VND</span>
              </div>
              <input 
                type="range" 
                min="2000000000" 
                max="10000000000" 
                step="500000000" 
                value={houseValue}
                onChange={(e) => setHouseValue(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 mt-1.5 font-medium">
                <span>2 Tỷ</span>
                <span>6 Tỷ</span>
                <span>10 Tỷ</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2">
                💡 Vin tài trợ tương ứng (6%): <strong className="text-amber-500/90">{getVinSubsidy().toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="my-10 text-center text-xs text-slate-500 py-6">
                Giỏ hàng trống.<br/>Vui lòng chọn các sản phẩm thiết kế ở cột bên cạnh để lập bảng dự toán BOQ!
              </div>
            ) : (
              <div className="mt-6 space-y-4 max-h-56 overflow-y-auto pr-1 border-b border-slate-800/80 pb-6">
                {cart.map((item) => (
                  <div key={item.sku} className="flex justify-between items-center text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{item.image}</span>
                      <div>
                        <div className="font-semibold text-slate-200 line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.brand}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number" 
                        value={quantities[item.sku] || 1} 
                        onChange={(e) => updateQuantity(item.sku, e.target.value)}
                        className="w-12 bg-slate-900 border border-slate-800 rounded text-center text-[11px] py-1 text-slate-300 focus:outline-none"
                      />
                      <span className="font-bold text-slate-200">
                        {((item.price * (quantities[item.sku] || 1)).toLocaleString('vi-VN'))}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Financial Overview */}
            <div className="mt-6 space-y-3 pt-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tổng giá trị gói BOQ:</span>
                <span className="font-semibold text-slate-200">{getSubtotal().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-amber-500 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                <span>Vin tài trợ trực tiếp (6%):</span>
                <span className="font-bold">-{getVinSubsidy().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-sm text-white pt-2 border-t border-slate-800 font-bold">
                <span>Khách thanh toán thực tế:</span>
                <span className="text-lg text-amber-400">{getFinalAmount().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {getFinalAmount() === 0 && getSubtotal() > 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] text-center p-2.5 rounded-lg font-medium leading-relaxed">
                  🎉 Chúc mừng! Giá trị Vin tài trợ đã bao trọn gói combo nội thất của bạn (Nội thất hoàn toàn 0 đồng!).
                </div>
              ) : null}

              <button
                disabled={cart.length === 0}
                onClick={() => setShowLoanModal(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
              >
                Nhận Duyệt Hạn Mức Tín Chấp Techcombank
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  alert('Lệnh ký hợp đồng dự án giả lập thành công! Dự án PRJ-' + Date.now().toString().slice(-6) + ' đã được khởi tạo và khóa định mức vật tư.');
                }}
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
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition font-bold"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-white tracking-tight mb-4 flex items-center space-x-2">
              <span className="bg-red-500/15 text-red-500 px-2 py-0.5 rounded text-[10px] border border-red-500/20">Techcombank</span>
              <span>Đăng Ký Vay Tín Chấp Online (24h)</span>
            </h3>
            
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 mb-6">
              Khoản vay ước tính: <strong className="text-white">{getFinalAmount().toLocaleString('vi-VN')}đ</strong> (Được bảo lãnh bằng hợp đồng tay ba Vinhomes).
            </div>

            <form onSubmit={submitLoanForm} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Họ và tên khách hàng</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Phan Văn Trị"
                  value={loanForm.fullName}
                  onChange={(e) => setLoanForm({ ...loanForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Số điện thoại liên kết</label>
                <input 
                  type="tel" 
                  required
                  placeholder="Ví dụ: 0901234567"
                  value={loanForm.phone}
                  onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Thu nhập hàng tháng chuyển khoản</label>
                <select 
                  value={loanForm.income}
                  onChange={(e) => setLoanForm({ ...loanForm, income: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                >
                  <option value="under-20">Dưới 20 triệu VND</option>
                  <option value="20-50">Từ 20 - 50 triệu VND</option>
                  <option value="over-50">Trên 50 triệu VND</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Thời hạn vay mong muốn</label>
                <select 
                  value={loanForm.tenure}
                  onChange={(e) => setLoanForm({ ...loanForm, tenure: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                >
                  <option value="3">3 Năm (Lãi suất ưu đãi 6.5%)</option>
                  <option value="5">5 Năm (Lãi suất ưu đãi 7.2%)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition"
              >
                Gửi Hồ Sơ Phê Duyệt Tự Động
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 QiHolding & QiPrime. Bản quyền thuộc về anh Nguyễn Duy Quang.</p>
        <p className="mt-2 text-slate-600">Phát triển hệ thống công nghệ bởi đối tác Outsource chuyên nghiệp.</p>
      </footer>
    </div>
  );
}

export default function Storefront() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen">
        <div className="text-amber-500 font-bold text-lg animate-pulse">Đang tải QiHome Storefront...</div>
      </div>
    }>
      <StorefrontContent />
    </Suspense>
  );
}
