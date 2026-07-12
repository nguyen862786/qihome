'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SalesDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('affiliate'); // 'affiliate' | 'clients' | 'kyc'

  // Date filters states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickPeriod, setQuickPeriod] = useState('All'); // 'month' | 'last_month' | 'quarter' | 'year' | 'All'

  // KYC and Profile states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bankNo, setBankNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [mst, setMst] = useState('');
  const [kycStatus, setKycStatus] = useState('unverified'); // 'unverified' | 'pending' | 'verified'
  const [isContractSigned, setIsContractSigned] = useState(false);
  const [signLog, setSignLog] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);

  // OTP signing states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Affiliate performance stats
  const [stats, setStats] = useState({
    referredClients: 0,
    signedContracts: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    commissionsPaid: 0
  });

  // Referred clients table
  const [clients, setClients] = useState([]);

  // Fallback mock data for sales sandbox spanning multiple months
  const MOCK_CLIENTS = [
    { id: '1', name: 'Phan Văn Trị', unit: 'Căn 1205 - Golden Silk', boqValue: 350000000, commission: 7000000, status: 'pending', date: '2026-07-12', customerStatus: 'ĐANG TƯ VẤN' },
    { id: '2', name: 'Hoàng Thị Hoa', unit: 'Căn 08A1 - Ruby Plaza', boqValue: 450000000, commission: 9000000, status: 'pending', date: '2026-07-11', customerStatus: 'ĐÃ KÝ HỢP ĐỒNG' },
    { id: '3', name: 'Nguyễn Thị Bình', unit: 'Căn 1502 - Golden Silk', boqValue: 600000000, commission: 12000000, status: 'approved', date: '2026-07-08', customerStatus: 'ĐÃ BÀN GIAO' },
    { id: '4', name: 'Trần Văn Tám', unit: 'Biệt thự BT-04 - Hậu Nghĩa', boqValue: 800000000, commission: 16000000, status: 'paid', date: '2026-06-15', customerStatus: 'ĐÃ BÀN GIAO' },
    { id: '5', name: 'Phạm Minh Trí', unit: 'Căn S2.01-1002 - Grand Park', boqValue: 300000000, commission: 6000000, status: 'pending', date: '2026-05-20', customerStatus: 'ĐANG TƯ VẤN' }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'sales' && user.role !== 'admin') {
      router.push('/');
      return;
    }
    setProfile(user);

    // Hydrate form states
    setFullName(user.full_name || user.name || '');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setBankNo(user.bank_no || '');
    setBankName(user.bank_name || '');
    setBankBranch(user.bank_branch || '');
    setMst(user.tax_code || '');
    setKycStatus(user.kyc_status || 'unverified');
    setIsContractSigned(user.is_contract_signed || false);
    setSignLog(user.sign_log || '');
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    checkConnection(profile);
  }, [profile, startDate, endDate]);

  const checkConnection = async (user) => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);
    
    const isProfileComplete = user.kyc_status === 'verified' && user.is_contract_signed && user.tax_code;

    if (isConfigured) {
      await loadLiveSalesData(user.id, isProfileComplete);
    } else {
      // Sandbox mode filtering
      let filtered = [...MOCK_CLIENTS];
      if (startDate) {
        filtered = filtered.filter(c => c.date >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(c => c.date <= endDate);
      }

      // Re-calculate mock stats dynamically
      let totalSalesValue = 0;
      let commissionsEarned = 0;
      let commissionsPaid = 0;
      const signedContracts = filtered.filter(c => c.customerStatus !== 'ĐANG TƯ VẤN').length;

      filtered.forEach(c => {
        totalSalesValue += c.boqValue;
        commissionsEarned += c.commission;
        if (c.status === 'paid') {
          commissionsPaid += c.commission;
        }
      });

      // Apply guardrail blocking to mock clients display
      const mappedClients = filtered.map(c => {
        let disbursementStatus = c.status;
        if (!isProfileComplete && (c.status === 'pending' || c.status === 'approved')) {
          disbursementStatus = 'YÊU CẦU BỔ SÚNG HỒ SƠ PHÁP LÝ';
        }
        return {
          ...c,
          status: disbursementStatus,
          date: new Date(c.date).toLocaleDateString('vi-VN')
        };
      });

      setClients(mappedClients);

      setStats({
        referredClients: filtered.length,
        signedContracts,
        totalSalesValue,
        commissionsEarned,
        commissionsPaid
      });
    }
  };

  // Load real commission ledger and referrers from Supabase
  const loadLiveSalesData = async (salesId, isProfileComplete) => {
    try {
      // 1. Fetch projects referred by this sales agent with Date Range Filters
      let query = supabase
        .from('projects')
        .select('id, client_name, vinhomes_block, vinhomes_floor_căn, total_amount, status, created_at')
        .eq('sales_id', salesId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: projects, error: pError } = await query;
      if (pError) throw pError;

      // 2. Fetch commission ledger from DB
      const { data: commissions, error: cError } = await supabase
        .from('commissions')
        .select('*')
        .eq('sales_id', salesId);

      if (cError) throw cError;

      // Parse stats and build table
      let totalSalesValue = 0;
      let commissionsEarned = 0;
      let commissionsPaid = 0;
      const signedContracts = projects ? projects.filter(p => p.status !== 'pending_design').length : 0;

      const clientList = (projects || []).map((p) => {
        totalSalesValue += Number(p.total_amount);
        
        // Find corresponding commission log
        const comm = commissions ? commissions.find(c => c.project_id === p.id) : null;
        const commAmt = comm ? Number(comm.amount) : Math.round(p.total_amount * 0.02);
        
        if (comm) {
          commissionsEarned += commAmt;
          if (comm.status === 'paid') {
            commissionsPaid += commAmt;
          }
        } else {
          commissionsEarned += commAmt;
        }

        // Map status to "Tình trạng khách hàng"
        let customerStatus = 'ĐANG TƯ VẤN';
        if (p.status === 'in_production' || p.status === 'qc_inspection') {
          customerStatus = 'ĐÃ KÝ HỢP ĐỒNG';
        } else if (p.status === 'completed') {
          customerStatus = 'ĐÃ BÀN GIAO';
        }

        // Apply guardrail blocking based on KYC and contract signing
        let disbursementStatus = comm ? comm.status : 'pending';
        if (!isProfileComplete && (disbursementStatus === 'pending' || disbursementStatus === 'approved')) {
          disbursementStatus = 'YÊU CẦU BỔ SÚNG HỒ SƠ PHÁP LÝ';
        }

        return {
          id: p.id,
          name: p.client_name,
          unit: `${p.vinhomes_floor_căn} - ${p.vinhomes_block}`,
          boqValue: p.total_amount,
          commission: commAmt,
          status: disbursementStatus,
          customerStatus,
          date: new Date(p.created_at).toLocaleDateString('vi-VN')
        };
      });

      setClients(clientList);
      setStats({
        referredClients: projects ? projects.length : 0,
        signedContracts,
        totalSalesValue,
        commissionsEarned,
        commissionsPaid
      });

    } catch (err) {
      console.error('Error loading live sales dashboard:', err);
    }
  };

  // Quick Period Dropdown handler
  const handleQuickPeriodChange = (period) => {
    setQuickPeriod(period);
    const now = new Date('2026-07-12'); // Mock relative baseline
    let start = '';
    let end = '';

    if (period === 'month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
      end = `${year}-${month}-31`;
    } else if (period === 'last_month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonthDate.getFullYear();
      const month = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
      end = `${year}-${month}-31`;
    } else if (period === 'quarter') {
      const year = now.getFullYear();
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      const month = String(quarterStartMonth).padStart(2, '0');
      start = `${year}-${month}-01`;
      end = `${year}-12-31`;
    } else if (period === 'year') {
      start = `${now.getFullYear()}-01-01`;
      end = `${now.getFullYear()}-12-31`;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // Profile submission handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Tax code validation (10 or 13 digits)
    const mstRegex = /^[0-9]{10}$|^[0-9]{13}$/;
    if (!mstRegex.test(mst)) {
      alert('⚠️ Mã số thuế cá nhân phải gồm chính xác 10 hoặc 13 chữ số!');
      return;
    }

    try {
      if (isLive && profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            email,
            bank_no: bankNo,
            bank_name: bankName,
            bank_branch: bankBranch,
            tax_code: mst,
            kyc_status: kycStatus
          })
          .eq('id', profile.id);
        
        if (error) throw error;
      }

      // Save to localStorage cache
      const updated = {
        ...profile,
        full_name: fullName,
        name: fullName,
        phone,
        email,
        bank_no: bankNo,
        bank_name: bankName,
        bank_branch: bankBranch,
        tax_code: mst,
        kyc_status: kycStatus,
        is_contract_signed: isContractSigned,
        sign_log: signLog
      };

      localStorage.setItem('qihome_user_profile', JSON.stringify(updated));
      setProfile(updated);
      alert('💾 Đã cập nhật hồ sơ cá nhân và thông tin tài khoản thành công!');
    } catch (err) {
      alert('Lỗi lưu hồ sơ: ' + err.message);
    }
  };

  // Mock document uploading simulating AWS S3 push
  const handleDocUpload = (side) => {
    alert(`📸 Kích hoạt Camera di động... Đã tải ảnh mặt ${side === 'front' ? 'trước' : 'sau'} CCCD lên thư mục mã hoá bảo mật S3!`);
    if (side === 'front') {
      setFrontImage('front_cccd_uploaded.jpg');
    } else {
      setBackImage('back_cccd_uploaded.jpg');
    }
    
    // Switch status to pending validation
    if (kycStatus === 'unverified') {
      setKycStatus('pending');
      const updated = {
        ...profile,
        kyc_status: 'pending'
      };
      localStorage.setItem('qihome_user_profile', JSON.stringify(updated));
      setProfile(updated);
    }
  };

  // OTP E-Contract signing triggers
  const handleSendOTP = () => {
    if (!phone) {
      alert('⚠️ Vui lòng cung cấp và lưu Số điện thoại ở form Thông tin trước khi gửi mã OTP ký hợp đồng!');
      return;
    }
    setOtpSent(true);
    alert(`📲 Mã OTP xác thực ký Hợp đồng đã được gửi về số điện thoại: ${phone} (Vui lòng dùng mã test: 123456)`);
  };

  const handleVerifyOTP = () => {
    if (otpCode !== '123456') {
      alert('❌ Mã OTP không hợp lệ. Vui lòng nhập mã thử nghiệm: 123456');
      return;
    }

    const now = new Date();
    const mockIP = '14.161.42.95';
    const mockDevice = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 60) + '...' : 'Chrome Mobile';
    const logStr = `Signed Log: Đã ký điện tử lúc ${now.toLocaleString('vi-VN')} - IP: ${mockIP} - Thiết bị: ${mockDevice}`;

    setIsContractSigned(true);
    setSignLog(logStr);

    const updated = {
      ...profile,
      is_contract_signed: true,
      sign_log: logStr
    };
    localStorage.setItem('qihome_user_profile', JSON.stringify(updated));
    setProfile(updated);
    alert('✍️ Bạn đã ký Hợp đồng cộng tác viên tiếp thị số hóa thành công! File lưu vết pháp lý đã được ghi nhận.');
  };

  // Dev bypass triggers to easily set verified
  const devBypassVerify = () => {
    setKycStatus('verified');
    const updated = {
      ...profile,
      kyc_status: 'verified'
    };
    localStorage.setItem('qihome_user_profile', JSON.stringify(updated));
    setProfile(updated);
    alert('🔧 [Developer Mode] Đã chuyển đổi trạng thái KYC tài khoản sang: ĐÃ XÁC THỰC để mở khóa ký E-Contract.');
  };

  const getReferralUrl = () => {
    if (typeof window !== 'undefined') {
      const code = profile?.affiliate_code || 'SALE-NAM86';
      return `${window.location.origin}/?aff=${code}`;
    }
    return 'http://localhost:3000/?aff=SALE-NAM86';
  };

  const copyReferralUrl = () => {
    navigator.clipboard.writeText(getReferralUrl());
    alert('📋 Đã sao chép đường link Affiliate của bạn!');
  };

  if (!profile) return null;

  const isProfileComplete = kycStatus === 'verified' && isContractSigned && mst;

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row relative overflow-hidden bg-[#faf8f5]">
      {/* LEFT SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-[#14151b] border-r border-[#262832] flex flex-col z-10 relative">
        {/* Brand Header Logo */}
        <div className="p-6 border-b border-[#262832] flex items-center space-x-3">
          <span className="font-bold text-2xl tracking-wider text-[#c49a62] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded-xl">Qi</span>
          <span className="font-bold text-base text-white tracking-tight">QiHome.vn</span>
        </div>

        {/* User profile section */}
        <div className="px-6 py-6 border-b border-[#262832] flex items-center space-x-3 text-white">
          <div className="w-10 h-10 rounded-full bg-[#c49a62]/20 border border-[#c49a62]/40 flex items-center justify-center font-bold text-[#c49a62] text-sm">
            SL
          </div>
          <div>
            <div className="text-xs font-bold text-white">{fullName || 'Sales Partner'}</div>
            <div className="text-[10px] text-slate-500">Affiliate Specialist</div>
          </div>
        </div>

        {/* Stacked Vertical Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Nghiệp vụ Sales
          </div>
          
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'affiliate' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>🔗</span>
            <span>Tiếp Thị Liên Kết</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'clients' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>👥</span>
            <span>Danh Sách Khách Hàng</span>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'kyc' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>👤</span>
            <span>KYC & Pháp Lý</span>
          </button>
        </nav>

        {/* Logout / Exit at Bottom */}
        <div className="p-4 border-t border-[#262832]">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#1c1d25] hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-2"
          >
            <span>Quay lại Storefront</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 relative">
        <header className="h-16 border-b border-[#ebdcb9] bg-white px-8 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-sm text-slate-800">Cổng Tiếp Thị Sales Affiliate</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Guardrail alert badge in header */}
            {!isProfileComplete ? (
              <span className="text-[9px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-1 rounded">
                ⚠️ Bổ sung Hồ Sơ Pháp Lý
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-550/20 px-2 py-1 rounded">
                ✓ Pháp lý Hoàn tất (Đạt KYC)
              </span>
            )}

            <span className="text-[10px] font-bold text-slate-550 uppercase bg-[#faf8f5] border border-[#ebdcb9] px-3 py-1 rounded-lg">
              Mã: {profile.affiliate_code || 'SALE-NAM86'}
            </span>
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1">
          
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cư dân click link</div>
              <div className="text-xl font-black mt-2 text-[#c49a62]">{stats.referredClients} cư dân</div>
              <div className="text-[9px] text-slate-500 mt-1">Đã lưu mã cookie 30 ngày</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hợp đồng đã ký chốt</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{stats.signedContracts} căn hộ</div>
              <div className="text-[9px] text-[#c49a62] font-semibold mt-1">✓ Đang thi công đạt chuẩn</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng doanh số của bạn</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{stats.totalSalesValue.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Dựa trên gói BOQ thực tế</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hoa hồng tích lũy (2%)</div>
              <div className="text-xl font-black text-emerald-600 mt-2">{stats.commissionsEarned.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">
                Đã nhận: <strong className="text-emerald-600">{stats.commissionsPaid.toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>
          </div>

          {activeTab === 'affiliate' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                {/* Sales Link & QR Generation Box */}
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">🔗 Đường link Định danh Giới thiệu Khách hàng</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Chia sẻ link này cho cư dân Vinhomes Hậu Nghĩa tự thiết kế bằng AI. Khi khách hàng bấm ký hợp đồng tay ba, hệ thống tự động ghi nhận hoa hồng 2% cho bạn.
                  </p>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      readOnly
                      value={getReferralUrl()}
                      className="bg-[#faf8f5] border border-[#ebdcb9] rounded-lg px-3 py-2 text-xs text-[#c49a62] w-full focus:outline-none font-mono"
                    />
                    <button
                      onClick={copyReferralUrl}
                      className="bg-[#c49a62] hover:bg-[#b08752] text-white text-xs px-4 py-2 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      Sao Chép Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual QR Code Box */}
              <div className="lg:col-span-4">
                <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl border border-[#e2d5c3] flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-100 flex flex-col justify-center items-center opacity-85 relative">
                      <div className="grid grid-cols-4 gap-0.5 w-20 h-20">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className={`rounded-sm ${(i % 2 === 0 || i < 4) ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-1 font-mono text-[7px] text-slate-600 break-all select-all">
                        {profile.affiliate_code || 'SALE-NAM86'}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-2 tracking-wider">Mã QR Tiếp Thị</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Danh Sách Khách Hàng</h3>
                <span className="text-xs font-mono text-[#c49a62] font-extrabold bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded">
                  Bộ lọc thời gian
                </span>
              </div>

              {/* Filter controls row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#faf8f5] p-4 rounded-xl border border-[#ebdcb9] text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Khoảng thời gian nhanh</label>
                  <select
                    value={quickPeriod}
                    onChange={(e) => handleQuickPeriodChange(e.target.value)}
                    className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62] font-bold"
                  >
                    <option value="All">Tất cả thời gian</option>
                    <option value="month">Tháng này</option>
                    <option value="last_month">Tháng trước</option>
                    <option value="quarter">Quý này</option>
                    <option value="year">Năm nay</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Từ ngày (StartDate)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setQuickPeriod('All');
                    }}
                    className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:border-[#c49a62]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Đến ngày (EndDate)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setQuickPeriod('All');
                    }}
                    className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:border-[#c49a62]"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#ebdcb9] text-slate-500 font-semibold">
                      <th className="py-3 px-2">Tên Khách hàng</th>
                      <th className="py-3 px-2">Căn hộ & Toà</th>
                      <th className="py-3 px-2">Giá trị gói BOQ</th>
                      <th className="py-3 px-2">Hoa hồng nhận (2%)</th>
                      <th className="py-3 px-2">Thời gian</th>
                      <th className="py-3 px-2">Trạng thái giải ngân</th>
                      <th className="py-3 px-2 text-right">Tình trạng khách hàng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-6 text-center text-slate-450 text-xs">
                          Chưa có khách hàng nào truy cập qua đường link của bạn hoặc nằm ngoài khoảng thời gian lọc.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-2 font-semibold text-slate-900">{client.name}</td>
                          <td className="py-3 px-2 text-slate-500">{client.unit}</td>
                          <td className="py-3 px-2 font-mono">{client.boqValue.toLocaleString('vi-VN')}đ</td>
                          <td className="py-3 px-2 font-mono text-emerald-600 font-semibold">+{client.commission.toLocaleString('vi-VN')}đ</td>
                          <td className="py-3 px-2 text-slate-500">{client.date}</td>
                          <td className="py-3 px-2">
                            {client.status.includes('YÊU CẦU BỔ SUNG') ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-red-100 border border-red-200 text-red-600">
                                {client.status}
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                client.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                                client.status === 'approved' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                                'bg-slate-100 text-slate-550 border border-slate-200'
                              }`}>
                                {client.status === 'paid' ? 'Đã thanh toán' : client.status === 'approved' ? 'Chờ chi' : 'Chờ Vin duyệt'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              client.customerStatus === 'ĐÃ BÀN GIAO' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                              client.customerStatus === 'ĐÃ KÝ HỢP ĐỒNG' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                              'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {client.customerStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEW TAB: Tab 3: KYC & Pháp Lý (kyc) */}
          {activeTab === 'kyc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Form updates */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>👤 Hồ Sơ Cá Nhân & Thông Tin Tài Khoản</span>
                    {/* Developer bypass button */}
                    <button
                      type="button"
                      onClick={devBypassVerify}
                      className="text-[9px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[#c49a62] font-black hover:bg-slate-200 transition"
                    >
                      [Developer Bypass: Phê duyệt KYC]
                    </button>
                  </h3>
                  
                  <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Họ và tên (KYC)</label>
                      <input
                        type="text"
                        required
                        disabled={kycStatus === 'verified'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 disabled:opacity-60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Mã số thuế cá nhân (MST)</label>
                      <input
                        type="text"
                        required
                        value={mst}
                        onChange={(e) => setMst(e.target.value)}
                        placeholder="MST gồm 10 hoặc 13 chữ số"
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Số điện thoại liên hệ</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Địa chỉ Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 border-t border-slate-100 pt-3">
                      <h4 className="text-[10px] uppercase font-bold text-[#c49a62] mb-3 tracking-wider">Thông tin tài khoản thụ hưởng hoa hồng</h4>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Số tài khoản ngân hàng</label>
                      <input
                        type="text"
                        required
                        value={bankNo}
                        onChange={(e) => setBankNo(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tên ngân hàng</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Techcombank, Vietcombank..."
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Chi nhánh ngân hàng</label>
                      <input
                        type="text"
                        required
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-6 py-2 rounded-xl transition text-xs shadow-sm"
                      >
                        💾 Lưu Thông Tin Tài Khoản
                      </button>
                    </div>
                  </form>
                </div>

                {/* E-Contract Digital Signing Area */}
                {kycStatus === 'verified' && (
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800 animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                      <span>✍️ Hợp Đồng Hợp Tác Tiếp Thị Số Hóa (E-Contract)</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        isContractSigned ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-520/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {isContractSigned ? 'ĐÃ KÝ THÀNH CÔNG' : 'CHƯA KÝ HỢP ĐỒNG'}
                      </span>
                    </h3>

                    {/* Contract Template Text Box */}
                    <div className="bg-[#faf8f5] border border-[#ebdcb9] p-4 rounded-xl text-[10px] text-slate-650 h-44 overflow-y-auto leading-relaxed font-mono">
                      <div className="text-center font-bold text-slate-800 text-xs mb-3">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                        Độc lập - Tự do - Hạnh phúc<br />
                        ---<br />
                        HỢP ĐỒNG HỢP TÁC TIẾP THỊ SỐ HÓA
                      </div>
                      <p className="mb-2"><strong>BÊN A:</strong> Công ty Cổ phần Nội thất Thông minh QiHome.vn</p>
                      <p className="mb-2">
                        <strong>BÊN B (Cộng tác viên / Sales Affiliate):</strong><br />
                        - Họ và tên: {fullName || '---'}<br />
                        - Mã số thuế: {mst || '---'}<br />
                        - Số tài khoản ngân hàng: {bankNo || '---'} ({bankName || '---'} - {bankBranch || '---'})
                      </p>
                      <p className="mb-2">
                        <strong>ĐIỀU 1: PHẠM VI HỢP TÁC</strong><br />
                        Bên B thực hiện tiếp thị, giới thiệu cư dân các khu đô thị Vinhomes đăng ký và sử dụng phần mềm AI Studio tự thiết kế căn hộ của Bên A.
                      </p>
                      <p className="mb-2">
                        <strong>ĐIỀU 2: CHÍNH SÁCH HOA HỒNG & THUẾ</strong><br />
                        - Bên B được hưởng 2.0% trên tổng giá trị hợp đồng BOQ ký chốt thi công thành công thực tế.<br />
                        - Khoản thuế thu nhập cá nhân (TNCN) 10% sẽ được Bên A tự động trích nộp hộ về chi cục thuế dựa trên MST cá nhân Bên B cung cấp trước khi giải ngân.
                      </p>
                      {isContractSigned && (
                        <div className="mt-4 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded">
                          ✓ {signLog}
                        </div>
                      )}
                    </div>

                    {/* Verification & OTP Verification Button */}
                    {!isContractSigned ? (
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          * Bấm nút gửi mã OTP. Hệ thống sẽ gửi tin nhắn SMS chứa mã xác nhận 6 số để tiến hành ký chữ ký số pháp lý cho Hợp đồng trên.
                        </p>
                        <div className="flex items-center space-x-3">
                          {!otpSent ? (
                            <button
                              type="button"
                              onClick={handleSendOTP}
                              className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-sm"
                            >
                              📲 Gửi Mã OTP Ký Hợp Đồng
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2 w-full">
                              <input
                                type="text"
                                placeholder="Nhập mã OTP (123456)"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOTP}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition text-xs shadow-sm"
                              >
                                ✓ Ký Xác Nhận Hợp Đồng
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-600 font-bold flex items-center space-x-2 pt-2">
                        <span>✓</span> <span>Hợp đồng điện tử đã được ký kết và lưu trữ vĩnh viễn trên AWS S3.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* KYC Camera uploads */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* KYC status card */}
                <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-[#e2d5c3] pb-3">🛡️ Trạng Thái Xác Thực KYC</h3>
                  
                  <div className="flex items-center justify-between">
                    <span>KYC Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      kycStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                      kycStatus === 'pending' ? 'bg-amber-500/10 text-amber-600 border border-amber-550/20 animate-pulse' :
                      'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                      {kycStatus === 'verified' ? 'ĐÃ XÁC THỰC' :
                       kycStatus === 'pending' ? 'ĐANG THẨM ĐỊNH' : 'CHƯA XÁC THỰC'}
                    </span>
                  </div>

                  {kycStatus === 'unverified' && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl leading-relaxed">
                      <strong>Cảnh báo:</strong> Tài khoản của bạn sẽ bị tạm khoá tính năng rút tiền hoa hồng cho đến khi KYC thành công và ký hợp đồng CTV.
                    </div>
                  )}

                  {kycStatus === 'pending' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl leading-relaxed">
                      <strong>Đang chờ thẩm định:</strong> Phòng nhân sự QiHome đang kiểm tra đối soát ảnh CCCD mặt trước/sau của bạn.
                    </div>
                  )}

                  {kycStatus === 'verified' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl leading-relaxed">
                      <strong>Xác thực thành công:</strong> Tài khoản đã được kích hoạt chức năng thanh toán hoa hồng tự động.
                    </div>
                  )}
                </div>

                {/* CCCD image uploads card (Mobile Camera Web upload simulated) */}
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">📸 Tải Lên Giấy Tờ Xác Minh (CCCD)</h3>
                  
                  <div className="space-y-4">
                    {/* Front CCCD */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Mặt trước CCCD</div>
                      {!frontImage ? (
                        <button
                          type="button"
                          onClick={() => handleDocUpload('front')}
                          className="w-full bg-[#faf8f5] border border-[#ebdcb9] hover:border-[#c49a62]/40 rounded-xl py-4 flex flex-col items-center justify-center text-slate-500 transition"
                        >
                          <span className="text-xl">📷</span>
                          <span className="text-[10px] font-bold text-[#c49a62] mt-1">Chụp ảnh mặt trước</span>
                        </button>
                      ) : (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded flex items-center justify-between">
                          <span>CCCD_Front.jpg</span>
                          <span>✓ Đã tải</span>
                        </div>
                      )}
                    </div>

                    {/* Back CCCD */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Mặt sau CCCD</div>
                      {!backImage ? (
                        <button
                          type="button"
                          onClick={() => handleDocUpload('back')}
                          className="w-full bg-[#faf8f5] border border-[#ebdcb9] hover:border-[#c49a62]/40 rounded-xl py-4 flex flex-col items-center justify-center text-slate-500 transition"
                        >
                          <span className="text-xl">📷</span>
                          <span className="text-[10px] font-bold text-[#c49a62] mt-1">Chụp ảnh mặt sau</span>
                        </button>
                      ) : (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded flex items-center justify-between">
                          <span>CCCD_Back.jpg</span>
                          <span>✓ Đã tải</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
