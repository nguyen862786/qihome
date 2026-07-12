'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  
  // Dashboard mock data states
  const [houseValueSeed, setHouseValueSeed] = useState(5000000000);
  const [overBudgetRequests, setOverBudgetRequests] = useState([
    { id: 'req-1', projectCode: 'PRJ-HAUNGHIA-102', contractor: 'Thầu Phụ Hùng Vương', sku: 'BL-DAMP-05', qty: 2, item: 'Ray trượt giảm chấn Blum', reason: 'Thợ thi công cắt hỏng gỗ nẹp bản lề.', image: 'https://example.com/broken_hinge.jpg' },
    { id: 'req-2', projectCode: 'PRJ-HAUNGHIA-104', contractor: 'Thầu Phụ Đông Á', sku: 'DL-UX-18', qty: 4, item: 'Sơn nước Dulux EasyClean', reason: 'Diện tích tường thô bị hút sơn nhiều hơn dự toán.', image: 'https://example.com/dry_wall.jpg' }
  ]);

  const [projectHealth, setProjectHealth] = useState([
    { code: 'PRJ-HAUNGHIA-101', client: 'Phan Văn Trị', progress: 10, status: 'pending_design', alert: 'green', desc: 'Đã ký HĐ, đang chuẩn bị concept phối cảnh AI.' },
    { code: 'PRJ-HAUNGHIA-102', client: 'Hoàng Thị Hoa', progress: 45, status: 'in_production', alert: 'green', desc: 'Hàng đã về kho vệ tinh, đang tiến hành lắp đặt.' },
    { code: 'PRJ-HAUNGHIA-103', client: 'Nguyễn Thị Bình', progress: 85, status: 'qc_inspection', alert: 'yellow', desc: 'Đang làm kiểm tra QC checklist gỗ liền tường.' },
    { code: 'PRJ-HAUNGHIA-104', client: 'Trịnh Quốc Bảo', progress: 95, status: 'completed', alert: 'red', desc: 'Trễ hạn bàn giao > 48h do thợ sửa lỗi sơn bả.' }
  ]);

  const [scorecards, setScorecards] = useState([
    { name: 'Thầu Phụ Hùng Vương', type: 'Đồ gỗ & Hoàn thiện', rating: 'Hạng A', score: 9.2, ontimedelivery: '95%', reworks: 2 },
    { name: 'Thầu Phụ Đông Á', type: 'Cơ điện & Sơn bả', rating: 'Hạng B', score: 8.1, ontimedelivery: '88%', reworks: 5 },
    { name: 'Nhà cung cấp An Cường', type: 'Vật liệu gỗ công nghiệp', rating: 'Hạng A', score: 9.6, ontimedelivery: '98%', reworks: 0 }
  ]);

  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
    setProfile(user);
  }, [router]);

  // Handle over budget approval
  const handleApproveRequest = (id, approved) => {
    alert(`Đã ${approved ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu cấp bù vật tư vượt định mức.`);
    setOverBudgetRequests(prev => prev.filter(r => r.id !== id));
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/60 p-4 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</span>
            <span className="font-bold text-lg text-white tracking-tight">Trung Tâm Quản Trị Tối Cao (Admin Center)</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-amber-400 font-semibold uppercase bg-amber-500/5 px-3 py-1 rounded border border-amber-500/20">
              Chủ tịch: Nguyễn Duy Quang
            </span>
            <button onClick={() => router.push('/')} className="text-xs text-slate-400 hover:text-white transition">
              Quay lại Storefront
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* KPI Financial Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Doanh thu chốt (BOQ)</div>
            <div className="text-2xl font-black text-white mt-2">2,200,000,000đ</div>
            <div className="text-[10px] text-emerald-400 mt-1">▲ 12.5% so với tuần trước</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vin giải ngân 6% thực tế</div>
            <div className="text-2xl font-black text-amber-500 mt-2">132,000,000đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Đã khấu trừ trực tiếp hợp đồng</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hạn mức ngân hàng liên kết</div>
            <div className="text-2xl font-black text-white mt-2">1,500,000,000đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Khách ký giải ngân tín chấp TCB</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lợi nhuận gộp dự kiến</div>
            <div className="text-2xl font-black text-emerald-500 mt-2">350,000,000đ</div>
            <div className="text-[10px] text-emerald-400 mt-1">Đạt chỉ tiêu tài chính MVP</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Health and Over-budget Queue */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Approval Center for Over Budget */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
                <span>🔔 Trung Tâm Phê Duyệt Cấp Phát Phát Sinh (Over-budget Queue)</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                  {overBudgetRequests.length} Yêu cầu chờ duyệt
                </span>
              </h3>

              {overBudgetRequests.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  Không có yêu cầu vượt định mức nào đang chờ duyệt.
                </div>
              ) : (
                <div className="space-y-4">
                  {overBudgetRequests.map((req) => (
                    <div key={req.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{req.projectCode} - {req.contractor}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Yêu cầu cấp thêm: <strong className="text-slate-300">{req.qty} {req.sku === 'BL-DAMP-05' ? 'Bộ' : 'Thùng'}</strong> ({req.item})
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                          Vượt BOM
                        </span>
                      </div>
                      
                      <div className="text-xs bg-slate-950 p-2.5 rounded border border-slate-900 text-slate-400 leading-relaxed">
                        📝 <strong>Lý do thợ báo:</strong> {req.reason}
                      </div>

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          onClick={() => handleApproveRequest(req.id, false)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-lg transition"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req.id, true)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-4 py-1.5 rounded-lg font-bold transition"
                        >
                          ✓ Duyệt Xuất Kho
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Project Health Status */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-tight">🚦 Báo Cáo Sức Khỏe Dự Án (Global Project Health)</h3>
              
              <div className="divide-y divide-slate-900 space-y-4">
                {projectHealth.map((proj) => (
                  <div key={proj.code} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          proj.alert === 'green' ? 'bg-emerald-500' : proj.alert === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        <strong className="text-xs text-white">{proj.code}</strong>
                        <span className="text-[10px] text-slate-500">Khách hàng: {proj.client}</span>
                      </div>
                      <p className="text-xs text-slate-400">{proj.desc}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Progress bar */}
                      <div className="w-24 bg-slate-950 border border-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${proj.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{proj.progress}%</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                        {proj.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Scorecards */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Vendor Scorecard */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-tight">🏆 Bảng Xếp Hạng Thầu Phụ (Vendor Scorecard)</h3>
              
              <div className="space-y-4">
                {scorecards.map((vendor, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-slate-200">{vendor.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{vendor.type}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        vendor.rating === 'Hạng A' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {vendor.rating}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center">
                      <div>
                        <div className="text-[9px] text-slate-600">Đơn vị KPI</div>
                        <div className="text-xs font-bold text-white mt-0.5">{vendor.score}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-600">Đúng tiến độ</div>
                        <div className="text-xs font-bold text-white mt-0.5">{vendor.ontimedelivery}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-600">Lỗi Rework</div>
                        <div className="text-xs font-bold text-red-400 mt-0.5">{vendor.reworks}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
