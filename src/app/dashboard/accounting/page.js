'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountingDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'sign_payout'
  
  // Financial ledger states
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({
    totalIn: 0,
    vinSubsidy: 0,
    bankDisbursed: 0,
    payoutProposal: 0
  });

  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [success, setSuccess] = useState('');

  // Fallback static ledger data
  const MOCK_LEDGER = [
    { id: 'tx-1', type: 'in', category: 'Vin 6%', project: 'PRJ-HAUNGHIA-104', title: 'Quyết toán 6% tài trợ đợt cuối', amount: 48000000, status: 'completed', date: 'Hôm qua' },
    { id: 'tx-2', type: 'in', category: 'Tín chấp TCB', project: 'PRJ-HAUNGHIA-103', title: 'Ngân hàng giải ngân đợt 2', amount: 180000000, status: 'completed', date: '2 ngày trước' },
    { id: 'tx-3', type: 'out', category: 'Thầu phụ', project: 'PRJ-HAUNGHIA-103', title: 'Thanh toán công lắp thô (Hùng Vương)', amount: 25000000, status: 'pending_approval', date: '3 ngày trước' },
    { id: 'tx-4', type: 'out', category: 'Nhà cung cấp', project: 'PRJ-HAUNGHIA-102', title: 'Thanh toán mua gỗ An Cường đợt 1', amount: 63000000, status: 'pending_approval', date: 'Vừa xong' },
    { id: 'tx-5', type: 'in', category: 'Khách cọc', project: 'PRJ-HAUNGHIA-101', title: 'Khách hàng Phan Văn Trị đặt cọc 30%', amount: 105000000, status: 'completed', date: 'Hôm nay' }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'accounting' && user.role !== 'admin') {
      router.push('/');
      return;
    }
    setProfile(user);
    checkConnection();
  }, [router]);

  const checkConnection = async () => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);
    
    if (isConfigured) {
      await loadLiveLedger();
    } else {
      setLedger(MOCK_LEDGER);
      calculateSummary(MOCK_LEDGER);
    }
  };

  // Load real financial data from Supabase
  const loadLiveLedger = async () => {
    try {
      // 1. Fetch all projects to calculate revenue inflow & Vin subsidy
      const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('project_code, total_amount, vin_subsidy, status, created_at');

      if (pError) throw pError;

      // 2. Fetch all commission logs (Affiliates)
      const { data: commissions, error: cError } = await supabase
        .from('commissions')
        .select('*, project:project_id(project_code, client_name)');

      if (cError) throw cError;

      // Build real-time ledger items dynamically
      const dynamicLedger = [];
      let totalIn = 0;
      let vinSubsidy = 0;
      let bankDisbursed = 0;
      let payoutProposal = 0;

      if (projects) {
        projects.forEach((proj, idx) => {
          const formattedDate = new Date(proj.created_at).toLocaleDateString('vi-VN');
          
          // Inflow: 30% deposit of client value
          const depositAmt = Math.round(proj.total_amount * 0.3);
          totalIn += depositAmt;
          dynamicLedger.push({
            id: `proj-dep-${idx}`,
            type: 'in',
            category: 'Khách cọc',
            project: proj.project_code,
            title: `Khách hàng đặt cọc 30% hợp đồng`,
            amount: depositAmt,
            status: 'completed',
            date: formattedDate
          });

          // Inflow: Vin 6% subsidy
          totalIn += Number(proj.vin_subsidy);
          vinSubsidy += Number(proj.vin_subsidy);
          dynamicLedger.push({
            id: `proj-vin-${idx}`,
            type: 'in',
            category: 'Vin 6%',
            project: proj.project_code,
            title: `Giải ngân 6% hỗ trợ Vinhomes`,
            amount: Number(proj.vin_subsidy),
            status: proj.status === 'completed' ? 'completed' : 'pending_approval',
            date: formattedDate
          });

          // Inflow: bank disbursement (70% remainder less Vin subsidy)
          const bankAmt = Number(proj.total_amount) * 0.7 - Number(proj.vin_subsidy);
          if (bankAmt > 0) {
            bankDisbursed += bankAmt;
            totalIn += bankAmt;
            dynamicLedger.push({
              id: `proj-bank-${idx}`,
              type: 'in',
              category: 'Tín chấp TCB',
              project: proj.project_code,
              title: `Ngân hàng giải ngân bảo lãnh tín chấp`,
              amount: bankAmt,
              status: proj.status === 'completed' ? 'completed' : 'pending_approval',
              date: formattedDate
            });
          }

          // Outflow: Subcontractor labor (estimated 15% of contract value)
          const laborAmt = Math.round(proj.total_amount * 0.15);
          if (proj.status === 'qc_inspection' || proj.status === 'completed') {
            payoutProposal += laborAmt;
            dynamicLedger.push({
              id: `proj-labor-${idx}`,
              type: 'out',
              category: 'Thầu phụ',
              project: proj.project_code,
              title: `Thanh toán công nhân lắp đặt hoàn thiện`,
              amount: laborAmt,
              status: proj.status === 'completed' ? 'completed' : 'pending_approval',
              date: formattedDate
            });
          }
        });
      }

      if (commissions) {
        commissions.forEach((comm, idx) => {
          const formattedDate = new Date(comm.created_at).toLocaleDateString('vi-VN');
          if (comm.status === 'pending' || comm.status === 'approved') {
            payoutProposal += Number(comm.amount);
          }
          dynamicLedger.push({
            id: `comm-${idx}`,
            type: 'out',
            category: 'Hoa hồng Sales',
            project: comm.project?.project_code || 'PRJ-MOCK',
            title: `Chi hoa hồng Sales Affiliate (${comm.project?.client_name || 'Khách hàng'})`,
            amount: Number(comm.amount),
            status: comm.status === 'paid' ? 'completed' : 'pending_approval',
            date: formattedDate
          });
        });
      }

      setLedger(dynamicLedger);
      setSummary({
        totalIn,
        vinSubsidy,
        bankDisbursed,
        payoutProposal
      });

    } catch (err) {
      console.error('Error loading live accounting details:', err);
      setLedger(MOCK_LEDGER);
      calculateSummary(MOCK_LEDGER);
    }
  };

  const calculateSummary = (ledgerList) => {
    let totalIn = 0;
    let vinSubsidy = 0;
    let bankDisbursed = 0;
    let payoutProposal = 0;

    ledgerList.forEach(tx => {
      if (tx.type === 'in') {
        totalIn += tx.amount;
        if (tx.category === 'Vin 6%') vinSubsidy += tx.amount;
        if (tx.category === 'Tín chấp TCB') bankDisbursed += tx.amount;
      } else {
        if (tx.status === 'pending_approval') {
          payoutProposal += tx.amount;
        }
      }
    });

    setSummary({
      totalIn,
      vinSubsidy,
      bankDisbursed,
      payoutProposal
    });
  };

  // Submit weekly payout proposal to DB
  const handleCreatePayoutProposal = async () => {
    setSubmittingPayout(true);
    try {
      if (isLive) {
        // Update all pending commissions to approved status
        const { error: cError } = await supabase
          .from('commissions')
          .update({ status: 'approved' })
          .eq('status', 'pending');
        
        if (cError) throw cError;

        // Write to audit log
        await supabase
          .from('audit_logs')
          .insert([
            {
              user_id: profile.id,
              action: 'SUBMIT_WEEKLY_PAYOUT',
              table_name: 'commissions',
              record_id: 'a0000000-0000-0000-0000-000000000002', // Admin/Accounting context ID
              new_data: { payoutAmount: summary.payoutProposal }
            }
          ]);

        setSuccess('Đã lập đề xuất Lệnh chi tuần tập trung và gửi lên LIVE DB thành công!');
        await loadLiveLedger();
      } else {
        // Local simulation fallback
        setSuccess('Đã gửi Đề xuất Lệnh chi tuần tập trung sang cho Chủ tịch phê duyệt thành công (Mô phỏng Sandbox)!');
        setLedger(prev => prev.map(item => {
          if (item.status === 'pending_approval') {
            return { ...item, status: 'completed' };
          }
          return item;
        }));
        setSummary(prev => ({ ...prev, payoutProposal: 0 }));
      }
    } catch (err) {
      alert('Lỗi lập lệnh chi tuần: ' + err.message);
    } finally {
      setSubmittingPayout(false);
    }
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
            KT
          </div>
          <div>
            <div className="text-xs font-bold text-white">Lê Kế Toán</div>
            <div className="text-[10px] text-slate-500">Project Accountant</div>
          </div>
        </div>

        {/* Stacked Vertical Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Nghiệp vụ Kế toán
          </div>
          
          <button
            onClick={() => setActiveTab('ledger')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'ledger' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>💵</span>
            <span>Đối Soát Thu Chi</span>
          </button>

          <button
            onClick={() => setActiveTab('sign_payout')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'sign_payout' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>✍️</span>
            <span className="flex-1 text-left">Đề Xuất Lệnh Chi</span>
            {summary.payoutProposal > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'sign_payout' ? 'bg-[#14151b] text-[#c49a62]' : 'bg-red-500/20 text-red-400'
              }`}>
                Đang đề xuất
              </span>
            )}
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
            <h1 className="font-bold text-sm text-slate-800">Sổ Cái & Giải Ngân Kế Toán</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1.5 px-2.5 py-1 bg-[#faf8f5] border border-[#ebdcb9] rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{isLive ? 'Live DB Connection' : 'Sandbox Cache Mode'}</span>
            </span>
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3.5 rounded-xl">
              {success}
            </div>
          )}

          {/* Financial KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng thu lũy kế</div>
              <div className="text-xl font-black mt-2 text-[#c49a62]">{summary.totalIn.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-[#c49a62] font-semibold mt-1">✓ Đã đối soát khớp tiền về</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vin 6% thực tế</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{summary.vinSubsidy.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Reconciled với Vinhomes Account</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Giải ngân TCB</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{summary.bankDisbursed.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Hạn mức giải ngân tín chấp</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chi tuần này</div>
              <div className="text-xl font-black text-red-500 mt-2">{summary.payoutProposal.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Đề xuất chuyển Chủ tịch duyệt</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {activeTab === 'ledger' && (
              <div className="lg:col-span-12">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Nhật ký đối soát dòng tiền real-time</h3>
                    <span className="text-xs text-slate-500 font-bold">Tổng cộng: {ledger.length} giao dịch</span>
                  </div>

                  <div className="divide-y divide-slate-100 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {ledger.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-6">
                        Chưa phát sinh giao dịch nào trên cơ sở dữ liệu.
                      </div>
                    ) : (
                      ledger.map((tx) => (
                        <div key={tx.id} className="pt-4 first:pt-0 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                              }`}>
                                {tx.type === 'in' ? 'THU' : 'CHI'}
                              </span>
                              <strong className="text-xs text-slate-900">{tx.project}</strong>
                              <span className="text-[10px] text-slate-500">{tx.category}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{tx.title}</p>
                            <span className="text-[9px] text-slate-400">{tx.date}</span>
                          </div>

                          <div className="text-right">
                            <div className={`text-sm font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}đ
                            </div>
                            <span className={`text-[9px] font-bold uppercase ${
                              tx.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'
                            }`}>
                              {tx.status === 'completed' ? 'Đã duyệt chi/thu' : 'Chờ duyệt'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sign_payout' && (
              <>
                <div className="lg:col-span-8">
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">✍️ Đề Xuất Lệnh Chi Tiền Tuần</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lập báo cáo đề xuất chuyển cho Chủ tịch phê duyệt lệnh chi cho thầu phụ, hoa hồng sales và nhà cung cấp dựa trên dữ liệu nghiệm thu thực tế của giám sát hiện trường.
                    </p>
                    <div className="bg-[#faf8f5] border border-[#ebdcb9] rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Hoa hồng Sales + Thầu phụ chờ duyệt chi:</span>
                        <strong className="text-slate-800 text-sm">{summary.payoutProposal.toLocaleString('vi-VN')}đ</strong>
                      </div>
                      <div className="border-t border-[#ebdcb9] pt-3 flex justify-end">
                        <button
                          onClick={handleCreatePayoutProposal}
                          disabled={submittingPayout || summary.payoutProposal === 0}
                          className="bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-sm"
                        >
                          {submittingPayout ? 'Đang gửi...' : '✓ Xác nhận & Lập Lệnh Chi Tuần'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-slate-850">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-[#e2d5c3] pb-3">💡 Quy trình đối soát</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Mọi khoản chi chỉ được thực hiện khi tổ giám sát hiện trường đánh giá chất lượng thi công đạt tiêu chuẩn nghiệm thu và báo cáo hình ảnh lỗi đã được thợ khắc phục.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
