'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  
  // Dashboard real-time states
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    vinSubsidy: 0,
    bankDisbursed: 0,
    profitGross: 0
  });

  const [overBudgetRequests, setOverBudgetRequests] = useState([]);
  const [projectHealth, setProjectHealth] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fallback static data
  const MOCK_FINANCIALS = {
    totalRevenue: 2200000000,
    vinSubsidy: 132000000,
    bankDisbursed: 1500000000,
    profitGross: 350000000
  };

  const MOCK_REQUESTS = [
    { id: 'req-1', projectCode: 'PRJ-HAUNGHIA-102', contractor: 'Thầu Phụ Hùng Vương', sku: 'BL-DAMP-05', qty: 2, item: 'Ray trượt giảm chấn Blum', reason: 'Thợ thi công cắt hỏng gỗ nẹp bản lề.' },
    { id: 'req-2', projectCode: 'PRJ-HAUNGHIA-104', contractor: 'Thầu Phụ Đông Á', sku: 'DL-UX-18', qty: 4, item: 'Sơn nước Dulux EasyClean', reason: 'Diện tích tường thô bị hút sơn nhiều hơn dự toán.' }
  ];

  const MOCK_HEALTH = [
    { code: 'PRJ-HAUNGHIA-101', client: 'Phan Văn Trị', progress: 10, status: 'pending_design', alert: 'green', desc: 'Đã ký HĐ, đang chuẩn bị concept phối cảnh AI.' },
    { code: 'PRJ-HAUNGHIA-102', client: 'Hoàng Thị Hoa', progress: 45, status: 'in_production', alert: 'green', desc: 'Hàng đã về kho vệ tinh, đang tiến hành lắp đặt.' },
    { code: 'PRJ-HAUNGHIA-103', client: 'Nguyễn Thị Bình', progress: 85, status: 'qc_inspection', alert: 'yellow', desc: 'Đang làm kiểm tra QC checklist gỗ liền tường.' },
    { code: 'PRJ-HAUNGHIA-104', client: 'Trịnh Quốc Bảo', progress: 100, status: 'completed', alert: 'green', desc: 'Công trình đã bàn giao hoàn thiện, đạt QC.' }
  ];

  const MOCK_SCORECARDS = [
    { name: 'Thầu Phụ Hùng Vương', type: 'Đồ gỗ & Hoàn thiện', rating: 'Hạng A', score: 9.2, ontimedelivery: '95%', reworks: 2 },
    { name: 'Thầu Phụ Đông Á', type: 'Cơ điện & Sơn bả', rating: 'Hạng B', score: 8.1, ontimedelivery: '88%', reworks: 5 }
  ];

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
    checkConnection();
  }, [router]);

  const checkConnection = async () => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);
    
    if (isConfigured) {
      await loadLiveAdminData();
    } else {
      setFinancials(MOCK_FINANCIALS);
      setOverBudgetRequests(MOCK_REQUESTS);
      setProjectHealth(MOCK_HEALTH);
      setScorecards(MOCK_SCORECARDS);
    }
  };

  // Load real-time admin KPIs from Supabase
  const loadLiveAdminData = async () => {
    try {
      // 1. Fetch Projects for Revenue and Health
      const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('*');

      if (pError) throw pError;

      // 2. Fetch Over-budget material requests
      const { data: requests, error: rError } = await supabase
        .from('material_requests')
        .select(`
          id,
          sku,
          requested_quantity,
          evidence_image_url,
          status,
          project:project_id(project_code),
          subcontractor:subcontractor_id(full_name)
        `)
        .eq('is_over_budget', true)
        .eq('status', 'pending_approval');

      if (rError) throw rError;

      // Calculate financials
      let totalRevenue = 0;
      let vinSubsidy = 0;
      let bankDisbursed = 0;
      let profitGross = 0;

      const healthList = [];

      if (projects) {
        projects.forEach(p => {
          totalRevenue += Number(p.total_amount);
          vinSubsidy += Number(p.vin_subsidy);
          // Bank loan disburse simulation (70% value less Vin subsidy)
          const bankAmt = Number(p.total_amount) * 0.7 - Number(p.vin_subsidy);
          if (bankAmt > 0) bankDisbursed += bankAmt;

          // Estimated profit (15% margins)
          profitGross += Number(p.total_amount) * 0.15;

          // Project health list mapping
          let progress = 10;
          let alert = 'green';
          let desc = 'Đang chuẩn bị lên bản vẽ concept 3D AI.';

          if (p.status === 'in_production') {
            progress = 50;
            desc = 'Đang trong tiến trình thi công lắp đặt tại Vinhomes.';
          } else if (p.status === 'qc_inspection') {
            progress = 85;
            alert = 'yellow';
            desc = 'Đang tiến hành chấm checklist QC kiểm định chất lượng.';
          } else if (p.status === 'completed') {
            progress = 100;
            desc = 'Dự án đã bàn giao nghiệm thu hoàn tất cho khách hàng.';
          }

          healthList.push({
            code: p.project_code,
            client: p.client_name,
            progress,
            status: p.status,
            alert,
            desc
          });
        });
      }

      setFinancials({
        totalRevenue,
        vinSubsidy,
        bankDisbursed,
        profitGross: Math.round(profitGross)
      });

      // Map over budget requests
      const mappedRequests = (requests || []).map(r => ({
        id: r.id,
        projectCode: r.project?.project_code || 'PRJ-MOCK',
        contractor: r.subcontractor?.full_name || 'Thợ thi công',
        sku: r.sku,
        qty: r.requested_quantity,
        item: r.sku === 'AC-WD-402' ? 'Gỗ An Cường' : r.sku === 'BL-DAMP-05' ? 'Ray trượt Blum' : 'Sơn nước Dulux',
        reason: r.evidence_image_url ? 'Yêu cầu ứng phát sinh do thợ thi công lỗi hoặc hao hụt thực tế.' : 'Ứng vật tư dự phòng.',
        image: r.evidence_image_url
      }));

      setOverBudgetRequests(mappedRequests);
      setProjectHealth(healthList);
      setScorecards(MOCK_SCORECARDS); // Standalone vendor scorecards (MVP seeded)

    } catch (err) {
      console.error('Error loading live admin metrics:', err);
      setFinancials(MOCK_FINANCIALS);
      setOverBudgetRequests(MOCK_REQUESTS);
      setProjectHealth(MOCK_HEALTH);
      setScorecards(MOCK_SCORECARDS);
    }
  };

  // Handle over-budget requests approvals directly on DB
  const handleApproveRequest = async (id, approved) => {
    setLoading(true);
    try {
      const statusUpdate = approved ? 'approved' : 'rejected';
      
      if (isLive) {
        // 1. Update request status in Database
        const { error } = await supabase
          .from('material_requests')
          .update({ status: statusUpdate })
          .eq('id', id);

        if (error) throw error;

        // 2. Insert audit log record
        await supabase
          .from('audit_logs')
          .insert([
            {
              user_id: profile.id,
              action: `ADMIN_DECISION_${statusUpdate.toUpperCase()}`,
              table_name: 'material_requests',
              record_id: id,
              new_data: { status: statusUpdate }
            }
          ]);

        alert(`Đã ${approved ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu thành công trên LIVE DB!`);
        await loadLiveAdminData();
      } else {
        // Mock Sandbox Fallback
        alert(`Đã ${approved ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu thành công (Mô phỏng Sandbox)!`);
        setOverBudgetRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Lỗi phê duyệt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/60 p-4 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">Qi</span>
            <span className="font-bold text-lg text-white tracking-tight">Trung Tâm Quản Trị Tối Cao {isLive && '🟢'}</span>
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
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Doanh thu dự án lũy kế</div>
            <div className="text-2xl font-black text-white mt-2">{financials.totalRevenue.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-emerald-400 mt-1">Hợp đồng tay ba đã ký kết</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dòng vốn tài trợ Vin 6%</div>
            <div className="text-2xl font-black text-amber-500 mt-2">{financials.vinSubsidy.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Đã đối soát với Vin Accounting</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ngân hàng giải ngân (TCB)</div>
            <div className="text-2xl font-black text-white mt-2">{financials.bankDisbursed.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Tín chấp bảo lãnh dự án</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur shadow">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lợi nhuận gộp mục tiêu</div>
            <div className="text-2xl font-black text-emerald-500 mt-2">{financials.profitGross.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-emerald-400 mt-1">Biên lợi nhuận định mức 15%</div>
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
                            Yêu cầu cấp thêm: <strong className="text-slate-300">{req.qty} đơn vị</strong> ({req.item})
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                          Vượt BOM
                        </span>
                      </div>
                      
                      <div className="text-xs bg-slate-950 p-2.5 rounded border border-slate-900 text-slate-400 leading-relaxed">
                        📝 {req.reason}
                      </div>

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          disabled={loading}
                          onClick={() => handleApproveRequest(req.id, false)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-lg transition"
                        >
                          Từ chối
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleApproveRequest(req.id, true)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-4 py-1.5 rounded-lg font-bold transition"
                        >
                          ✓ Duyệt Lệnh Chi
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
              
              <div className="divide-y divide-slate-900 space-y-4 max-h-72 overflow-y-auto pr-1">
                {projectHealth.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-6">
                    Chưa có dự án thi công nào trên cơ sở dữ liệu.
                  </div>
                ) : (
                  projectHealth.map((proj, idx) => (
                    <div key={idx} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        <div className="w-24 bg-slate-950 border border-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${proj.progress}%` }}></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{proj.progress}%</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                          {proj.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded`}>
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
