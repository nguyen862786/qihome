'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Mock client project details
const MOCK_PROJECT = {
  projectCode: 'HĐ-HAUNGHIA-001',
  clientName: 'Phan Văn Trị',
  vinhomesBlock: 'Tòa Golden Silk (Phân khu 1)',
  vinhomesFloorCăn: 'Căn 1205',
  totalAmount: 350000000,
  status: 'in_production',
  dateSigned: '10/07/2026',
  kTSName: 'Nguyễn Văn Minh (Senior Architect)',
  handoverDate: '2026-10-15',
  vinSubsidy: 300000000, // 6% of 5.0 Billion VND house value
  paidAmount: 15000000, // 30% of remaining 50M
  nextPaymentAmount: 15000000, // 30% of remaining 50M
  nextPaymentDate: '30/07/2026'
};

const MOCK_REPORTS = [
  {
    id: 'rep-1',
    title: 'Lắp ráp hệ tủ bếp dưới & phụ kiện bản lề Blum',
    date: '12/07/2026',
    image: '/images/cb17520f98fa50444b4d580964fc69e7.jpg',
    status: 'QC_PASSED',
    details: 'Đội thợ Hùng Vương lắp đặt hoàn thiện ray âm tủ và tay nâng cánh tủ Blum. Bản lề hoạt động êm ái.'
  },
  {
    id: 'rep-2',
    title: 'Hoàn thiện lớp lót tường Dulux EasyClean',
    date: '09/07/2026',
    image: '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg',
    status: 'QC_PASSED',
    details: 'Thi công lớp sơn bả và sơn lót thứ 2 chống nấm mốc ẩm ướt tại khu vực phòng khách.'
  },
  {
    id: 'rep-3',
    title: 'Nghiệm thu phần thô điện nước & đế âm',
    date: '06/07/2026',
    image: '/images/6080384cd8220dbc4c266ca5fd07b534.jpg',
    status: 'QC_PASSED',
    details: 'Đo đạc khớp sơ đồ 2D CAD, chôn hộp đế âm tường và luồn ống nhựa bọc dây chống cháy.'
  }
];

export default function ClientDashboard() {
  const router = useRouter();
  
  // Auth state
  const [contractCode, setContractCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'finance' | 'collab' | 'loyalty' | 'referral' | 'review'
  
  // Live connection check
  const [isLive, setIsLive] = useState(false);

  // Chat/Collaboration state
  const [messages, setMessages] = useState([
    { sender: 'kts', text: 'Chào anh Trị, em đã gửi bản vẽ bố trí điện nước lên hệ thống. Anh xem qua nhé!', time: '05/07/2026 14:30' },
    { sender: 'client', text: 'Chào Minh, anh đã kiểm tra thấy hoàn toàn khớp sơ đồ thiết bị bếp rồi.', time: '05/07/2026 15:10' },
    { sender: 'kts', text: 'Dạ vâng ạ, đội thợ điện nước đã bắt đầu thi công chôn đế âm thô hôm qua.', time: '06/07/2026 09:15' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Hydrate login session
  useEffect(() => {
    const session = localStorage.getItem('qihome_client_project');
    if (session) {
      const data = JSON.parse(session);
      setProject(data);
      setIsLoggedIn(true);
      setReports(MOCK_REPORTS);
    }
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = () => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);
  };

  // Handle client sign-in
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    if (contractCode.toUpperCase() === 'HĐ-HAUNGHIA-001' && password === '123456') {
      setTimeout(() => {
        localStorage.setItem('qihome_client_project', JSON.stringify(MOCK_PROJECT));
        setProject(MOCK_PROJECT);
        setReports(MOCK_REPORTS);
        setIsLoggedIn(true);
        setLoading(false);
      }, 800);
    } else {
      // In live mode, verify contract code from Supabase projects table
      if (isLive) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('project_code', contractCode)
            .single();

          if (error || !data) {
            setLoginError('Không tìm thấy Mã hợp đồng này trên hệ thống database.');
          } else {
            const mapped = {
              projectCode: data.project_code,
              clientName: data.client_name,
              vinhomesBlock: data.vinhomes_block,
              vinhomesFloorCăn: data.vinhomes_floor_căn,
              totalAmount: Number(data.total_amount),
              status: data.status,
              dateSigned: new Date(data.created_at).toLocaleDateString('vi-VN'),
              kTSName: 'Nguyễn Văn Minh (Senior Architect)',
              handoverDate: '2026-10-15',
              vinSubsidy: Math.round(Number(data.total_amount) * 0.06),
              paidAmount: Math.round(Number(data.total_amount) * 0.3),
              nextPaymentAmount: Math.round(Number(data.total_amount) * 0.3),
              nextPaymentDate: '30/07/2026'
            };
            localStorage.setItem('qihome_client_project', JSON.stringify(mapped));
            setProject(mapped);
            setIsLoggedIn(true);
            
            // Load live site reports from DB
            const { data: dbReports } = await supabase
              .from('site_reports')
              .select('*')
              .eq('project_id', data.id)
              .order('created_at', { ascending: false });

            if (dbReports && dbReports.length > 0) {
              setReports(dbReports.map(r => ({
                id: r.id,
                title: r.checklist_item || 'Báo cáo hiện trường',
                date: new Date(r.created_at).toLocaleDateString('vi-VN'),
                image: r.photo_url || '/images/cb17520f98fa50444b4d580964fc69e7.jpg',
                status: 'QC_PASSED',
                details: r.geo_coords ? `Địa chỉ tọa độ: ${r.geo_coords}` : 'Báo cáo tiến độ thợ thi công.'
              })));
            } else {
              setReports(MOCK_REPORTS);
            }
          }
        } catch (err) {
          setLoginError('Lỗi kiểm tra hệ thống: ' + err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setTimeout(() => {
          setLoginError('Mã hợp đồng hoặc mật khẩu demo không đúng. Vui lòng nhập: HĐ-HAUNGHIA-001 / 123456');
          setLoading(false);
        }, 500);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qihome_client_project');
    setIsLoggedIn(false);
    setProject(null);
  };

  // Submit urgent request to site manager
  const triggerUrgentAlert = () => {
    alert('🚨 YÊU CẦU CHỈNH SỬA KHẨN CẤP ĐÃ ĐƯỢC GỬI!\nThông báo tin nhắn ưu tiên cao đã được chuyển thẳng tới thiết bị di động của Giám Sát hiện trường và Kiến trúc sư phụ trách.');
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const newMsg = {
      sender: 'client',
      text: chatInput,
      time: now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setChatInput('');

    // Simulated reply from Architect
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender: 'kts',
          text: 'Dạ vâng anh Trị, em đã ghi nhận ý kiến. Em sẽ trao đổi ngay với đội thợ thạch cao để điều chỉnh thiết kế cao độ giật cấp trần phòng khách!',
          time: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  // Submit project evaluation review
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    alert(`⭐️ Cảm ơn anh ${project.clientName} đã đánh giá ${rating} sao cho QiHome!\nNhận xét của anh đã được đồng bộ làm Social Proof chứng thực uy tín.`);
    setComment('');
  };

  // Calculate days remaining to expected handover
  const getDaysLeft = () => {
    if (!project) return 0;
    const today = new Date('2026-07-13'); // Baseline matching current local metadata context
    const end = new Date(project.handoverDate);
    const diff = end - today;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Referral link copier
  const copyReferralLink = () => {
    const url = `${window.location.origin}/?aff=CLIENT-TRI1205`;
    navigator.clipboard.writeText(url);
    alert('📋 Đã sao chép link giới thiệu của bạn! Gửi cho bạn bè để nhận eVoucher 10 triệu khi họ chốt hợp đồng.');
  };

  if (!isLoggedIn) {
    /* CLIENT LOGIN PORTAL SCREEN */
    return (
      <div className="min-h-screen text-slate-800 flex justify-center items-center p-4 bg-[#faf8f5]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c49a62]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ebdcb9]/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-white border border-[#ebdcb9] rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#c49a62]/10 border border-[#ebdcb9] text-[#c49a62] font-bold text-2xl mb-3">
              Qi
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Cổng Tra Cứu Khách Hàng</h1>
            <p className="text-xs text-slate-550 mt-1">Theo dõi tiến độ, tài chính & tương tác 3 bên</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-655 text-xs p-3 rounded-xl mb-4 font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mã Hợp Đồng (Contract ID)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: HĐ-HAUNGHIA-001"
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mật khẩu khởi tạo</label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu (Mặc định: 123456)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-350 focus:outline-none focus:border-[#c49a62]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-md"
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Cổng Khách Hàng'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs text-[#c49a62] hover:underline font-bold">
              Quay lại Storefront mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* SIGNED CLIENT DASHBOARD ACTIVE VIEW */
  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row relative overflow-hidden bg-[#faf8f5]">
      
      {/* LEFT SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-[#14151b] border-r border-[#262832] flex flex-col z-10 relative">
        <div className="p-6 border-b border-[#262832] flex items-center space-x-3">
          <span className="font-bold text-2xl tracking-wider text-[#c49a62] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded-xl">Qi</span>
          <span className="font-bold text-base text-white tracking-tight">QiHome.vn</span>
        </div>

        {/* Client identity section */}
        <div className="px-6 py-6 border-b border-[#262832] flex items-center space-x-3 text-white">
          <div className="w-10 h-10 rounded-full bg-[#c49a62]/20 border border-[#c49a62]/40 flex items-center justify-center font-bold text-[#c49a62] text-sm">
            KH
          </div>
          <div>
            <div className="text-xs font-bold text-white">{project.clientName}</div>
            <div className="text-[10px] text-slate-500">Mã căn: {project.vinhomesFloorCăn}</div>
          </div>
        </div>

        {/* Vertical stacked navigation menu */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Cổng Cư Dân
          </div>
          
          <button
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'timeline' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>📈</span>
            <span>Tiến Độ Thi Công</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'finance' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>💵</span>
            <span>Tài Chính & Kế Hoạch</span>
          </button>

          <button
            onClick={() => setActiveTab('collab')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'collab' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>💬</span>
            <span>Tương Tác KTS</span>
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'loyalty' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>💳</span>
            <span>Thẻ VIP & Voucher</span>
          </button>

          <button
            onClick={() => setActiveTab('referral')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'referral' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>📢</span>
            <span>Lan Tỏa Hạnh Phúc</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'review' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>📰</span>
            <span>Đánh Giá & Sự Kiện</span>
          </button>
        </nav>

        {/* Exit portal button */}
        <div className="p-4 border-t border-[#262832]">
          <button
            onClick={handleLogout}
            className="w-full bg-[#1c1d25] hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-2"
          >
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 relative">
        <header className="h-16 border-b border-[#ebdcb9] bg-white px-8 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-sm text-slate-800">Cổng Tra Cứu Dự Án Cư Dân</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase bg-[#faf8f5] border border-[#ebdcb9] px-3 py-1 rounded-lg">
              Hợp đồng: {project.projectCode}
            </span>
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1">

          {/* Project Details Overview Card */}
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Địa chỉ thi công</span>
              <strong className="text-slate-800">{project.vinhomesFloorCăn} - {project.vinhomesBlock}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Ngày ký hợp đồng</span>
              <strong className="text-slate-800">{project.dateSigned}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Kiến trúc sư phụ trách</span>
              <strong className="text-[#c49a62]">{project.kTSName}</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Ngày bàn giao dự kiến</span>
              <strong className="text-slate-800">{new Date(project.handoverDate).toLocaleDateString('vi-VN')}</strong>
            </div>
          </div>

          {/* TAB 1: Construction Timeline & Site Feed */}
          {activeTab === 'timeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Construction Reports Feed */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    📈 Nhật ký nghiệm thu hiện trường thực tế
                  </h3>

                  <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ebdcb9]/60">
                    {reports.map((rep) => (
                      <div key={rep.id} className="relative pl-12 space-y-3">
                        {/* Timeline dot marker */}
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-white border-4 border-[#c49a62] shadow-sm"></div>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400">{rep.date}</span>
                            <h4 className="text-xs font-bold text-slate-900 mt-0.5">{rep.title}</h4>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] font-bold rounded">
                            {rep.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-650 leading-relaxed">{rep.details}</p>

                        {/* Large site photos */}
                        <div className="w-full max-w-md h-56 rounded-xl overflow-hidden border border-[#ebdcb9] shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={rep.image} alt={rep.title} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Countdown panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 shadow-sm text-center space-y-4">
                  <div className="text-3xl">🔑</div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Thời gian đến lúc nhận nhà</h3>
                  <div className="text-3xl font-black text-[#c49a62]">
                    Còn {getDaysLeft()} ngày
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    * Dự toán thời gian lắp đặt thô và hoàn thiện chi tiết trang trí căn hộ Vinhomes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Finance & Payment Roadmaps */}
          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Financial stats and roadmaps */}
              <div className="lg:col-span-8">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-6 text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    💵 Lịch Trình Tài Chính & Tiến Độ Đợt Đóng Tiền
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#faf8f5] p-4 rounded-xl border border-[#ebdcb9] text-xs mb-6">
                    <div>
                      <span className="text-slate-500 block">Dự toán gói nội thất (BOQ):</span>
                      <strong className="text-sm font-bold text-slate-800">{project.totalAmount.toLocaleString('vi-VN')}đ</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Vin hỗ trợ (6% giá trị nhà):</span>
                      <strong className="text-sm font-bold text-emerald-600">-{project.vinSubsidy.toLocaleString('vi-VN')}đ</strong>
                      <span className="text-[9px] text-slate-400 block">* 6% trên căn hộ 5.0 Tỷ</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Thực chi Khách hàng cần đóng:</span>
                      <strong className="text-sm font-bold text-[#c49a62]">
                        {Math.max(0, project.totalAmount - project.vinSubsidy).toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebdcb9] text-slate-500 font-semibold uppercase">
                          <th className="py-3 px-2">Đợt Thanh Toán</th>
                          <th className="py-3 px-2">Hạn Thanh Toán</th>
                          <th className="py-3 px-2 text-right">Số Tiền</th>
                          <th className="py-3 px-2 text-right">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-3 px-2 font-bold">Đợt 1 (30% cọc thiết kế thi công)</td>
                          <td className="py-3 px-2">{project.dateSigned}</td>
                          <td className="py-3 px-2 text-right font-black">
                            {Math.round(Math.max(0, project.totalAmount - project.vinSubsidy) * 0.3).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold rounded">
                              Đã đóng cọc đợt 1
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 font-bold">Đợt 2 (30% sau khi gỗ An Cường xuất xưởng)</td>
                          <td className="py-3 px-2">{project.nextPaymentDate}</td>
                          <td className="py-3 px-2 text-right font-black">
                            {Math.round(Math.max(0, project.totalAmount - project.vinSubsidy) * 0.3).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold rounded">
                              Chờ nghiệm thu gỗ
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 font-bold">Đợt 3 (40% sau khi nghiệm thu bàn giao)</td>
                          <td className="py-3 px-2">Dự kiến {new Date(project.handoverDate).toLocaleDateString('vi-VN')}</td>
                          <td className="py-3 px-2 text-right font-black">
                            {Math.round(Math.max(0, project.totalAmount - project.vinSubsidy) * 0.4).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold rounded">
                              Khi bàn giao nhà
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Gantt milestones summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                    📅 Lộ trình thi công (Gantt Milestones)
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">1. Nghiệm thu phần thô:</span>
                      <span className="text-emerald-600 font-bold">Hoàn thành ✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">2. Lắp đặt nội thất gỗ:</span>
                      <span className="text-amber-500 font-bold">Đang thi công ⚙</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">3. Vệ sinh & Setup decor:</span>
                      <span className="text-slate-400">Chưa bắt đầu</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">4. Bàn giao chìa khóa:</span>
                      <span className="text-slate-400">Dự kiến 15/10</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Collaboration Hub & Live Chat */}
          {activeTab === 'collab' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Message thread */}
              <div className="lg:col-span-8">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[450px] text-slate-800">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">💬 Trao đổi thảo luận cùng KTS & Giám sát</h3>
                    <button
                      onClick={triggerUrgentAlert}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition uppercase tracking-wider shadow-sm animate-pulse"
                    >
                      🚨 Yêu cầu chỉnh sửa khẩn cấp
                    </button>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
                    {messages.map((msg, index) => {
                      const isClient = msg.sender === 'client';
                      return (
                        <div key={index} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl p-3.5 ${
                            isClient ? 'bg-[#c49a62] text-white rounded-tr-none' : 'bg-[#faf8f5] border border-[#ebdcb9] text-slate-700 rounded-tl-none'
                          }`}>
                            <div className="text-[8px] opacity-70 block mb-1">
                              {isClient ? 'Quý khách' : 'KTS Phụ Trách'} - {msg.time}
                            </div>
                            <p className="leading-relaxed font-semibold">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send field */}
                  <form onSubmit={sendChatMessage} className="border-t border-slate-100 pt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập nội dung tin nhắn gửi KTS..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none placeholder-slate-400"
                    />
                    <button
                      type="submit"
                      className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-4 py-2 rounded-xl transition text-xs shadow-sm"
                    >
                      Gửi tin
                    </button>
                  </form>
                </div>
              </div>

              {/* Site contact details */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                    📞 Liên hệ ban chỉ huy
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <strong className="text-slate-900 block">KTS Thiết Kế:</strong>
                      <span className="text-slate-650">Nguyễn Văn Minh - 0912.444.888</span>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">Giám Sát QC hiện trường:</strong>
                      <span className="text-slate-650">Trần Văn Giám Sát - 0900.000.003</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Loyalty VIP Card & Voucher Wallet */}
          {activeTab === 'loyalty' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* VIP card design graphic */}
              <div className="lg:col-span-6">
                <div className="bg-gradient-to-br from-[#14151b] via-[#2a2c38] to-[#14151b] border border-[#ebdcb9] rounded-3xl p-8 text-white relative shadow-2xl h-56 flex flex-col justify-between overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#c49a62]/10 rounded-full blur-xl group-hover:bg-[#c49a62]/20 transition"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <span className="font-bold text-2xl text-[#c49a62] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded-lg">Qi</span>
                      <div className="text-[10px] tracking-wider text-slate-400 mt-1 uppercase">QiHome VIP Club</div>
                    </div>
                    <span className="px-3 py-1 bg-[#c49a62] text-white text-[9px] font-black rounded-full shadow-sm tracking-wider uppercase">
                      VIP GOLD
                    </span>
                  </div>

                  <div className="z-10 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Chủ sở hữu</span>
                    <strong className="text-sm tracking-wide block uppercase">{project.clientName}</strong>
                  </div>

                  <div className="flex justify-between items-end border-t border-[#ebdcb9]/20 pt-4 z-10">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Mã thẻ thành viên</span>
                      <span className="text-[10px] font-mono text-slate-300">MEM-TRI-1205</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Tích lũy QiPoints</span>
                      <strong className="text-base text-[#c49a62] font-black">35,000 QiP</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* eVouchers wallet */}
              <div className="lg:col-span-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    🎟️ Ví eVoucher mua sắm thiết bị gia dụng
                  </h3>

                  <div className="space-y-3">
                    <div className="border border-[#ebdcb9] bg-[#faf8f5] rounded-xl p-4 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-850 block">Voucher 10,000,000đ mua thiết bị Bosch</strong>
                        <span className="text-[9px] text-slate-400 block mt-0.5">*Hạn dùng: 31/12/2026</span>
                      </div>
                      <Link 
                        href="/#catalog"
                        className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-sm"
                      >
                        Dùng ngay
                      </Link>
                    </div>

                    <div className="border border-[#ebdcb9] bg-[#faf8f5] rounded-xl p-4 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-850 block">Giảm 15% đồ decor rời QiPrime</strong>
                        <span className="text-[9px] text-slate-400 block mt-0.5">*Hạn dùng: 31/12/2026</span>
                      </div>
                      <Link 
                        href="/#catalog"
                        className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-sm"
                      >
                        Dùng ngay
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Referral Link System */}
          {activeTab === 'referral' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Referral copier box */}
              <div className="lg:col-span-8">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    📢 Lan Tỏa Hạnh Phúc - Giới thiệu bạn bè
                  </h3>
                  
                  <p className="text-xs text-slate-650 leading-relaxed">
                    Chia sẻ hình ảnh không gian thiết kế của căn hộ của bạn cho bạn bè ở các phân khu Vinhomes Hậu Nghĩa. 
                    Khi người được giới thiệu chốt hợp đồng nội thất thành công, **cả hai bên sẽ tự động nhận eVoucher 10,000,000đ** mua thiết bị điện tử.
                  </p>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?aff=CLIENT-TRI1205`}
                      className="bg-[#faf8f5] border border-[#ebdcb9] rounded-lg px-3 py-2 text-xs text-[#c49a62] w-full focus:outline-none font-mono"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="bg-[#c49a62] hover:bg-[#b08752] text-white text-xs px-4 py-2 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      Chia Sẻ Ngay
                    </button>
                  </div>
                </div>
              </div>

              {/* Referral promo stats details */}
              <div className="lg:col-span-4">
                <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 shadow-sm text-xs space-y-3">
                  <strong className="text-slate-850 block font-bold uppercase tracking-wider border-b border-[#ebdcb9]/40 pb-2">Quy tắc tích luỹ</strong>
                  <p className="text-slate-650 leading-relaxed">
                    - Link giới thiệu được mã hoá tự động gắn cookie cư dân 60 ngày.<br />
                    - Tiền hoa hồng/điểm thưởng sẽ được kế toán duyệt nạp ví tự động sau khi đối tác ký HĐ 3 bên.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: Events & Reviews testimonial submit */}
          {activeTab === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Testimonial Form evaluation */}
              <div className="lg:col-span-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    ⭐ Đánh Giá & Nhận Xét Dịch Vụ
                  </h3>

                  <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Chấm điểm sao dịch vụ</label>
                      <div className="flex space-x-2 text-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`transition ${rating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nội dung nhận xét</label>
                      <textarea
                        required
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Hãy gửi nhận xét về thái độ thi công của đội thợ, chất lượng thiết kế của KTS và dịch vụ hỗ trợ của QiHome..."
                        className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none h-24 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-sm"
                    >
                      Gửi Đánh Giá Cư Dân
                    </button>
                  </form>
                </div>
              </div>

              {/* Event Board newsletter list */}
              <div className="lg:col-span-6">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 shadow-sm space-y-4 text-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    📰 Bản tin cư dân & Sự kiện QiHome
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex space-x-3 items-start">
                      <div className="bg-[#c49a62]/10 border border-[#ebdcb9] text-[#c49a62] px-3 py-2 rounded-xl text-center font-bold">
                        <div>20</div>
                        <div className="text-[8px] uppercase tracking-wider">Th7</div>
                      </div>
                      <div>
                        <strong className="text-slate-850 hover:underline cursor-pointer">Workshop "Nghệ thuật thắp sáng không gian sống"</strong>
                        <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">Tổ chức tại Showroom Hậu Nghĩa 1000m² - Chia sẻ kinh nghiệm phối màu đèn trang trí bởi KTS đầu ngành.</p>
                      </div>
                    </div>

                    <div className="flex space-x-3 items-start">
                      <div className="bg-[#c49a62]/10 border border-[#ebdcb9] text-[#c49a62] px-3 py-2 rounded-xl text-center font-bold">
                        <div>25</div>
                        <div className="text-[8px] uppercase tracking-wider">Th7</div>
                      </div>
                      <div>
                        <strong className="text-slate-850 hover:underline cursor-pointer">Lễ bàn gia & Tri ân cư dân phân khu Golden Silk</strong>
                        <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">Tiệc rượu vang nhẹ cảm ơn các cư dân đầu tiên chốt thi công trọn gói QiHome.vn.</p>
                      </div>
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
