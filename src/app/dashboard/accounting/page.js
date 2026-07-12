'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountingDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  
  // Accounting mock ledger state
  const [ledger, setLedger] = useState([
    { id: 'tx-1', type: 'in', category: 'Vin 6%', project: 'PRJ-HAUNGHIA-104', title: 'Quyết toán 6% tài trợ đợt cuối', amount: 48000000, status: 'completed', date: 'Hôm qua' },
    { id: 'tx-2', type: 'in', category: 'Tín chấp TCB', project: 'PRJ-HAUNGHIA-103', title: 'Ngân hàng giải ngân đợt 2', amount: 180000000, status: 'completed', date: '2 ngày trước' },
    { id: 'tx-3', type: 'out', category: 'Thầu phụ', project: 'PRJ-HAUNGHIA-103', title: 'Thanh toán công lắp thô (Hùng Vương)', amount: 25000000, status: 'pending_approval', date: '3 ngày trước' },
    { id: 'tx-4', type: 'out', category: 'Nhà cung cấp', project: 'PRJ-HAUNGHIA-102', title: 'Thanh toán mua gỗ An Cường đợt 1', amount: 63000000, status: 'pending_approval', date: 'Vừa xong' },
    { id: 'tx-5', type: 'in', category: 'Khách cọc', project: 'PRJ-HAUNGHIA-101', title: 'Khách hàng Phan Văn Trị đặt cọc 30%', amount: 105000000, status: 'completed', date: 'Hôm nay' }
  ]);

  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [success, setSuccess] = useState('');

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
  }, [router]);

  const handleCreatePayoutProposal = () => {
    setSubmittingPayout(true);
    setTimeout(() => {
      setSuccess('Đã gửi Đề xuất Lệnh chi tuần tập trung sang cho Chủ tịch phê duyệt thành công!');
      // Update ledger status for pending ones
      setLedger(prev => prev.map(item => {
        if (item.status === 'pending_approval') {
          return { ...item, status: 'completed' }; // Mock complete
        }
        return item;
      }));
      setSubmittingPayout(false);
    }, 1500);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/60 p-4 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</span>
            <span className="font-bold text-lg text-white tracking-tight">Dashboard Kế Toán Dự Án (Accounting)</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Ledger and pending payments */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Reconciliation ledger */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Nhật ký thu chi dòng tiền real-time</h3>
                <span className="text-[10px] text-slate-500">Hiển thị: 5 giao dịch gần nhất</span>
              </div>

              <div className="divide-y divide-slate-900 space-y-4">
                {ledger.map((tx) => (
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
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Weekly payout action */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Payment Proposal Box */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ký duyệt chi lương/vật tư</h3>
              
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs">
                <div className="text-slate-400">Công nợ chi trong tuần:</div>
                
                <div className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">- Nhà thầu phụ công thô:</span>
                  <span className="font-bold text-slate-300">25,000,000đ</span>
                </div>
                <div className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">- Gỗ ép MFC An Cường:</span>
                  <span className="font-bold text-slate-300">63,000,000đ</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 font-bold text-white">
                  <span>Tổng đề xuất chi tuần:</span>
                  <span className="text-red-400">88,000,000đ</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                * Đề xuất này tập hợp tất cả các cột mốc QC thi công lắp đặt và mua vật liệu đã được Giám sát trưởng xác nhận nghiệm thu ĐẠT trên công trường Vinhomes Hậu Nghĩa.
              </p>

              <button
                onClick={handleCreatePayoutProposal}
                disabled={submittingPayout}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
              >
                {submittingPayout ? 'Đang lập đề xuất...' : 'Lập Lệnh Chi Tiền Tuần'}
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
