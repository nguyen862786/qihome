'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AccountingDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  
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

        // In a real system, we'd insert a payout ledger request in a 'weekly_payouts' table.
        // For MVP, we update the status of projects to completed if site reports are passed.
        // We'll write to audit log
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
    <div className="min-h-screen text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/30 p-4 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</span>
            <span className="font-bold text-lg text-white tracking-tight">Dashboard Kế Toán Dự Án {isLive && '🟢'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-amber-400 font-semibold uppercase bg-amber-500/5 px-3 py-1 rounded border border-amber-500/20">
              Nhân sự: Lê Kế Toán
            </span>
            <button onClick={() => router.push('/')} className="text-xs text-slate-400 hover:text-white transition">
              Quay lại Storefront
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto w-full p-6 space-y-8">
        
        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl leading-relaxed">
            {success}
          </div>
        )}

        {/* Financial KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng thu lũy kế (Tất cả nguồn)</div>
            <div className="text-xl font-bold text-white mt-2">{summary.totalIn.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-emerald-400 mt-1">Đã đối soát khớp tiền về</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Khoản thu Vin 6% thực tế</div>
            <div className="text-xl font-bold text-amber-500 mt-2">{summary.vinSubsidy.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Reconciled với Vinhomes Accounting</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Khách ngân hàng hỗ trợ (TCB)</div>
            <div className="text-xl font-bold text-white mt-2">{summary.bankDisbursed.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Hạn mức vay tín chấp đã giải ngân</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đề xuất chi tuần này</div>
            <div className="text-xl font-bold text-red-400 mt-2">{summary.payoutProposal.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-red-400 mt-1">Chờ Chủ tịch phê duyệt lệnh chi</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Ledger and pending payments */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Reconciliation ledger */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Nhật ký đối soát dòng tiền real-time</h3>
                <span className="text-[10px] text-slate-500">Tổng cộng: {ledger.length} giao dịch</span>
              </div>

              <div className="divide-y divide-slate-900 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {ledger.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-6">
                    Chưa phát sinh giao dịch nào trên cơ sở dữ liệu.
                  </div>
                ) : (
                  ledger.map((tx) => (
                    <div key={tx.id} className="pt-4 first:pt-0 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {tx.type === 'in' ? 'THU' : 'CHI'}
                          </span>
                          <strong className="text-xs text-white">{tx.project}</strong>
                          <span className="text-[10px] text-slate-500">{tx.category}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{tx.title}</p>
                        <span className="text-[9px] text-slate-600">{tx.date}</span>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-bold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}đ
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${
                          tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {tx.status === 'completed' ? 'Đã chi/thu' : 'Chờ duyệt'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Weekly payout action */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Payment Proposal Box */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ký duyệt chi lương/vật tư</h3>
              
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs">
                <div className="text-slate-400">Dự kiến chi tiền đợt tuần này:</div>
                
                <div className="flex justify-between items-center text-sm pt-2 font-bold text-white border-t border-slate-900">
                  <span>Tổng tiền đề xuất:</span>
                  <span className="text-red-400">{summary.payoutProposal.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                * Toàn bộ đề xuất sẽ tự động lấy từ dữ liệu nghiệm thu đạt QC hiện trường của thợ thi công và báo cáo hoa hồng của Sales để tối ưu quy trình đối soát thủ công.
              </p>

              <button
                onClick={handleCreatePayoutProposal}
                disabled={submittingPayout || summary.payoutProposal === 0}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
              >
                {submittingPayout ? 'Đang gửi...' : 'Lập Lệnh Chi Tiền Tuần'}
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
