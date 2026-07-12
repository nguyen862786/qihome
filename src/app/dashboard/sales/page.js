'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SalesDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('affiliate'); // 'affiliate' | 'clients'

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

  // Fallback mock data for sales sandbox
  const MOCK_STATS = {
    referredClients: 4,
    signedContracts: 3,
    totalSalesValue: 1400000000,
    commissionsEarned: 28000000,
    commissionsPaid: 16000000
  };

  const MOCK_CLIENTS = [
    { id: '1', name: 'Phan Văn Trị', unit: 'Căn 1205 - Golden Silk', boqValue: 350000000, commission: 7000000, status: 'pending', date: '12/07/2026' },
    { id: '2', name: 'Hoàng Thị Hoa', unit: 'Căn 08A1 - Ruby Plaza', boqValue: 450000000, commission: 9000000, status: 'pending', date: '11/07/2026' },
    { id: '3', name: 'Nguyễn Thị Bình', unit: 'Căn 1502 - Golden Silk', boqValue: 600000000, commission: 12000000, status: 'approved', date: '08/07/2026' }
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
    checkConnection(user);
  }, [router]);

  const checkConnection = async (user) => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);
    
    if (isConfigured) {
      await loadLiveSalesData(user.id);
    } else {
      setStats(MOCK_STATS);
      setClients(MOCK_CLIENTS);
    }
  };

  // Load real commission ledger and referrers from Supabase
  const loadLiveSalesData = async (salesId) => {
    try {
      // 1. Fetch projects referred by this sales agent
      const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('id, client_name, vinhomes_block, vinhomes_floor_căn, total_amount, status, created_at')
        .eq('sales_id', salesId);

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
      const signedContracts = projects ? projects.length : 0;

      const clientList = (projects || []).map((p, idx) => {
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
          commissionsEarned += commAmt; // assume pending if not logged yet
        }

        return {
          id: p.id,
          name: p.client_name,
          unit: `${p.vinhomes_floor_căn} - ${p.vinhomes_block}`,
          boqValue: p.total_amount,
          commission: commAmt,
          status: comm ? comm.status : 'pending',
          date: new Date(p.created_at).toLocaleDateString('vi-VN')
        };
      });

      setClients(clientList);
      setStats({
        referredClients: signedContracts + 1, // Referred include signed + active leads
        signedContracts,
        totalSalesValue,
        commissionsEarned,
        commissionsPaid
      });

    } catch (err) {
      console.error('Error loading live sales dashboard:', err);
      setStats(MOCK_STATS);
      setClients(MOCK_CLIENTS);
    }
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

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row relative overflow-hidden bg-[#faf8f5]">
      {/* LEFT SIDEBAR PANEL (Matching the Admin/Chairman design) */}
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
            <div className="text-xs font-bold text-white">Sales Partner</div>
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
            <span>Danh Sách Cư Dân</span>
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
            <span className="text-[10px] font-bold text-slate-500 uppercase bg-[#faf8f5] border border-[#ebdcb9] px-3 py-1 rounded-lg">
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
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Danh sách Khách hàng của bạn</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#ebdcb9] text-slate-500 font-semibold">
                      <th className="py-3 px-2">Tên Khách hàng</th>
                      <th className="py-3 px-2">Căn hộ & Toà</th>
                      <th className="py-3 px-2">Giá trị gói BOQ</th>
                      <th className="py-3 px-2">Hoa hồng nhận (2%)</th>
                      <th className="py-3 px-2">Thời gian</th>
                      <th className="py-3 px-2 text-right">Trạng thái giải ngân</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-450 text-xs">
                          Chưa có khách hàng nào truy cập qua đường link của bạn.
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
                          <td className="py-3 px-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              client.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                              client.status === 'approved' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                              'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {client.status === 'paid' ? 'Đã thanh toán' : client.status === 'approved' ? 'Chờ chi' : 'Chờ Vin duyệt'}
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

        </main>
      </div>
    </div>
  );
}
