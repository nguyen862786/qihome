'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'requests' | 'vendors'
  
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

  // New Vendor Evaluation Form states
  const [subcontractorsList, setSubcontractorsList] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [formQuality, setFormQuality] = useState(9.0);
  const [formSpeed, setFormSpeed] = useState(9.0);
  const [formReworks, setFormReworks] = useState(0);
  const [formNotes, setFormNotes] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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
    { name: 'Thầu Phụ Hùng Vương', type: 'Đồ gỗ & Hoàn thiện', rating: 'Hạng A', score: 9.2, speed: 9.5, reworks: 2, notes: 'Thi công sắc nét, đúng thời hạn bàn giao.' },
    { name: 'Thầu Phụ Đông Á', type: 'Cơ điện & Sơn bả', rating: 'Hạng B', score: 8.1, speed: 7.8, reworks: 5, notes: 'Sơn bả thạch cao đợt đầu hơi loang, đã yêu cầu sửa đổi.' }
  ];

  const MOCK_SUBS = [
    { id: 'a0000000-0000-0000-0000-000000000004', full_name: 'Thầu Phụ Hùng Vương' },
    { id: 'sub-east-asia', full_name: 'Thầu Phụ Đông Á' }
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
      setSubcontractorsList(MOCK_SUBS);
      if (MOCK_SUBS.length > 0) setSelectedSubId(MOCK_SUBS[0].id);
    }
  };

  // Load real-time admin KPIs and Vendor Evaluations
  const loadLiveAdminData = async () => {
    try {
      // 1. Fetch Projects
      const { data: projects, error: pError } = await supabase.from('projects').select('*');
      if (pError) throw pError;

      // 2. Fetch Over-budget material requests
      const { data: requests, error: rError } = await supabase
        .from('material_requests')
        .select(`
          id, sku, requested_quantity, evidence_image_url, status,
          project:project_id(project_code),
          subcontractor:subcontractor_id(full_name)
        `)
        .eq('is_over_budget', true)
        .eq('status', 'pending_approval');
      if (rError) throw rError;

      // 3. Fetch Subcontractor Profiles
      const { data: subs, error: sError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'subcontractor');
      if (sError) throw sError;
      setSubcontractorsList(subs || MOCK_SUBS);
      if (subs && subs.length > 0) setSelectedSubId(subs[0].id);

      // 4. Fetch Vendor Evaluations
      const { data: evals, error: eError } = await supabase
        .from('vendor_evaluations')
        .select(`
          id, quality_score, speed_score, reworks_count, notes,
          vendor:vendor_id(full_name)
        `);
      if (eError) throw eError;

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
          const bankAmt = Number(p.total_amount) * 0.7 - Number(p.vin_subsidy);
          if (bankAmt > 0) bankDisbursed += bankAmt;
          profitGross += Number(p.total_amount) * 0.15;

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

      // Group evaluations by vendor to render dynamically
      if (evals && evals.length > 0) {
        const vendorGroups = {};
        evals.forEach(ev => {
          const vName = ev.vendor?.full_name || 'Đối tác liên kết';
          if (!vendorGroups[vName]) {
            vendorGroups[vName] = { count: 0, qualitySum: 0, speedSum: 0, reworks: 0, notesList: [] };
          }
          vendorGroups[vName].count += 1;
          vendorGroups[vName].qualitySum += Number(ev.quality_score);
          vendorGroups[vName].speedSum += Number(ev.speed_score);
          vendorGroups[vName].reworks += Number(ev.reworks_count);
          if (ev.notes) vendorGroups[vName].notesList.push(ev.notes);
        });

        const dynamicScorecards = Object.keys(vendorGroups).map(vName => {
          const group = vendorGroups[vName];
          const quality = (group.qualitySum / group.count).toFixed(1);
          const speed = (group.speedSum / group.count).toFixed(1);
          const rating = quality >= 9.0 ? 'Hạng A' : quality >= 7.5 ? 'Hạng B' : 'Hạng C';
          return {
            name: vName,
            type: 'Đối tác hoàn thiện',
            rating,
            score: Number(quality),
            speed: Number(speed),
            reworks: group.reworks,
            notes: group.notesList[0] || 'Chưa ghi chú'
          };
        });
        setScorecards(dynamicScorecards);
      } else {
        setScorecards(MOCK_SCORECARDS);
      }

    } catch (err) {
      console.error('Error loading live admin metrics:', err);
      setFinancials(MOCK_FINANCIALS);
      setOverBudgetRequests(MOCK_REQUESTS);
      setProjectHealth(MOCK_HEALTH);
      setScorecards(MOCK_SCORECARDS);
    }
  };

  // Submit new Vendor Evaluation to database
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setLoading(true);

    try {
      if (isLive) {
        const { error } = await supabase
          .from('vendor_evaluations')
          .insert([
            {
              vendor_id: selectedSubId,
              evaluated_by: profile.id,
              quality_score: formQuality,
              speed_score: formSpeed,
              reworks_count: formReworks,
              notes: formNotes
            }
          ]);

        if (error) throw error;
        setFormSuccess('Đã gửi đánh giá năng lực đối tác lên LIVE DB thành công!');
        await loadLiveAdminData();
      } else {
        // Mock Sandbox simulation
        setFormSuccess('Đã lưu đánh giá (Mô phỏng Sandbox)!');
        const targetSub = subcontractorsList.find(s => s.id === selectedSubId);
        const subName = targetSub ? targetSub.full_name : 'Thầu Phụ Hùng Vương';
        
        setScorecards(prev => {
          const exists = prev.find(v => v.name === subName);
          if (exists) {
            return prev.map(v => v.name === subName ? {
              ...v,
              score: Number(((v.score + formQuality) / 2).toFixed(1)),
              speed: Number(((v.speed + formSpeed) / 2).toFixed(1)),
              reworks: v.reworks + Number(formReworks),
              notes: formNotes
            } : v);
          } else {
            return [...prev, {
              name: subName,
              type: 'Đối tác hoàn thiện',
              rating: formQuality >= 9.0 ? 'Hạng A' : 'Hạng B',
              score: Number(formQuality),
              speed: Number(formSpeed),
              reworks: Number(formReworks),
              notes: formNotes
            }];
          }
        });
      }
      setFormNotes('');
      setFormReworks(0);
    } catch (err) {
      alert('Lỗi lưu đánh giá: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle over-budget requests approvals
  const handleApproveRequest = async (id, approved) => {
    setLoading(true);
    try {
      const statusUpdate = approved ? 'approved' : 'rejected';
      
      if (isLive) {
        const { error } = await supabase
          .from('material_requests')
          .update({ status: statusUpdate })
          .eq('id', id);

        if (error) throw error;

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
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      {/* Ambient background decorative light orbs (Wow factor) */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-500/[0.04] rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Admin Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/20 p-4 sticky top-0 z-20 backdrop-blur-xl relative">
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
      <main className="max-w-7xl mx-auto w-full p-6 space-y-8 relative z-10">
        
        {/* KPI Financial Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel gold-glow rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doanh thu dự án lũy kế</div>
            <div className="text-2xl font-black mt-2 gold-text-gradient">{financials.totalRevenue.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-emerald-400 mt-1">Hợp đồng tay ba đã ký kết</div>
          </div>
          <div className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dòng vốn tài trợ Vin 6%</div>
            <div className="text-2xl font-black text-amber-500 mt-2">{financials.vinSubsidy.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Đã đối soát với Vin Accounting</div>
          </div>
          <div className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ngân hàng giải ngân (TCB)</div>
            <div className="text-2xl font-black text-blue-400 mt-2">{financials.bankDisbursed.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-slate-500 mt-1">Tín chấp bảo lãnh dự án</div>
          </div>
          <div className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lợi nhuận gộp mục tiêu</div>
            <div className="text-2xl font-black text-emerald-400 mt-2">{financials.profitGross.toLocaleString('vi-VN')}đ</div>
            <div className="text-[10px] text-emerald-500/80 mt-1">Biên lợi nhuận định mức 15%</div>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex glass-panel p-1 rounded-xl max-w-lg">
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition duration-200 ${
              activeTab === 'health' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold gold-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚦 Sức Khỏe Dự Án
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition duration-200 ${
              activeTab === 'requests' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold gold-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔔 Đơn Vượt BOM ({overBudgetRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition duration-200 ${
              activeTab === 'vendors' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold gold-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏆 Đánh Giá Đối Tác & Thầu
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          
          {/* Left Column: Active tab content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab 1: Project Health */}
            {activeTab === 'health' && (
              <div className="glass-panel rounded-2xl p-6 space-y-5 shadow-2xl">
                <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">🚦 Báo Cáo Sức Khỏe Dự Án (Global Project Health)</h3>
                
                <div className="divide-y divide-slate-900 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {projectHealth.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-6">
                      Chưa có dự án thi công nào trên cơ sở dữ liệu.
                    </div>
                  ) : (
                    projectHealth.map((proj, idx) => (
                      <div key={idx} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              proj.alert === 'green' ? 'bg-emerald-500' : proj.alert === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                            } shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></span>
                            <strong className="text-xs text-white">{proj.code}</strong>
                            <span className="text-[10px] text-slate-500">Khách hàng: {proj.client}</span>
                          </div>
                          <p className="text-xs text-slate-400">{proj.desc}</p>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-slate-950 border border-slate-900 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 font-bold">{proj.progress}%</span>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                            {proj.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Over Budget Approval Center */}
            {activeTab === 'requests' && (
              <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center justify-between border-b border-slate-900 pb-3">
                  <span>🔔 Phê Duyệt Phát Sinh Ngoài Định Mức</span>
                  <span className="text-xs font-medium px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                    {overBudgetRequests.length} Đơn chờ duyệt
                  </span>
                </h3>

                {overBudgetRequests.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-6">
                    Không có yêu cầu vượt định mức nào đang chờ duyệt.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overBudgetRequests.map((req) => (
                      <div key={req.id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-3">
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
                        
                        <div className="text-xs bg-slate-950/60 p-2.5 rounded border border-slate-900 text-slate-400 leading-relaxed">
                          📝 {req.reason}
                        </div>

                        {req.image && (
                          <div className="text-[10px] text-amber-500 font-semibold underline cursor-pointer">
                            🔍 Xem ảnh bằng chứng lỗi hỏng
                          </div>
                        )}

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
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-4 py-1.5 rounded-lg font-bold transition shadow-md shadow-amber-500/10"
                          >
                            ✓ Duyệt Cấp Phát
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Vendor & Supplier Evaluations */}
            {activeTab === 'vendors' && (
              <div className="space-y-6">
                
                {/* Interactive Evaluation Form */}
                <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">📝 Biểu Mẫu Đánh Giá Năng Lực Đối Tác</h3>
                  
                  {formSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl">
                      {formSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSubmitEvaluation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Chọn Thầu phụ / Đối tác</label>
                      <select
                        value={selectedSubId}
                        onChange={(e) => setSelectedSubId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        {subcontractorsList.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Số lần Rework (Sửa lỗi hoàn thiện)</label>
                      <input
                        type="number"
                        min="0"
                        value={formReworks}
                        onChange={(e) => setFormReworks(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-205 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Điểm Chất lượng thi công (0 - 10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formQuality}
                        onChange={(e) => setFormQuality(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-205 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Điểm Tiến độ bàn giao (0 - 10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formSpeed}
                        onChange={(e) => setFormSpeed(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-205 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Ghi chú nhận xét năng lực</label>
                      <textarea
                        required
                        rows="2"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Nhận xét chi tiết về tác phong công nghiệp, chất lượng gỗ, sơn bả của nhà thầu..."
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-205 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      ></textarea>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-lg shadow-amber-500/10"
                      >
                        {loading ? 'Đang gửi...' : 'Gửi Đánh Giá KPI'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Historical Evaluations Table */}
                <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">Danh sách nhật ký năng lực</h3>
                  <div className="space-y-3">
                    {scorecards.map((vendor, idx) => (
                      <div key={idx} className="bg-slate-950/30 border border-slate-900 p-3 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200">{vendor.name}</span>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-500 font-bold">
                            {vendor.rating}
                          </span>
                        </div>
                        <p className="text-slate-400 italic">" {vendor.notes} "</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Scorecards overview (Fixed Summary) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Vendor Scorecard Summary */}
            <div className="glass-panel gold-glow rounded-2xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">🏆 Bảng Xếp Hạng Đối Tác & Thầu (Vendor Scorecard)</h3>
              
              <div className="space-y-4">
                {scorecards.map((vendor, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-2 hover:border-amber-500/20 transition duration-300">
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
                        <div className="text-[9px] text-slate-500">Chất lượng</div>
                        <div className="text-xs font-bold text-white mt-0.5">{vendor.score}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500">Tiến độ</div>
                        <div className="text-xs font-bold text-white mt-0.5">{vendor.speed}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500">Lỗi Rework</div>
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
