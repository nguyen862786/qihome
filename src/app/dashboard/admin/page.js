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

  // Filters for Project Health Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterVinhomes, setFilterVinhomes] = useState('All');

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
    { code: 'PRJ-HAUNGHIA-101', client: 'Phan Văn Trị', progress: 10, status: 'pending_design', alert: 'green', desc: 'Đã ký HĐ, đang chuẩn bị concept phối cảnh AI.', type: 'Chung cư', vinhomes: 'Vinhomes Hậu Nghĩa' },
    { code: 'PRJ-HAUNGHIA-102', client: 'Hoàng Thị Hoa', progress: 45, status: 'in_production', alert: 'green', desc: 'Hàng đã về kho vệ tinh, đang tiến hành lắp đặt.', type: 'Nhà phố', vinhomes: 'Vinhomes Hậu Nghĩa' },
    { code: 'PRJ-GRANDPARK-201', client: 'Nguyễn Thị Bình', progress: 85, status: 'qc_inspection', alert: 'yellow', desc: 'Đang làm kiểm tra QC checklist gỗ liền tường.', type: 'Chung cư', vinhomes: 'Vinhomes Grand Park' },
    { code: 'PRJ-OCEANPARK-301', client: 'Trịnh Quốc Bảo', progress: 100, status: 'completed', alert: 'green', desc: 'Công trình đã bàn giao hoàn thiện, đạt QC.', type: 'Biệt thự', vinhomes: 'Vinhomes Ocean Park' }
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

          let type = 'Chung cư';
          if (p.vinhomes_floor_căn?.toLowerCase().includes('biệt thự') || p.vinhomes_floor_căn?.toLowerCase().includes('bt')) {
            type = 'Biệt thự';
          } else if (p.vinhomes_floor_căn?.toLowerCase().includes('nhà phố') || p.vinhomes_floor_căn?.toLowerCase().includes('np') || p.vinhomes_floor_căn?.toLowerCase().includes('shophouse')) {
            type = 'Nhà phố';
          }
          let vinhomes = p.vinhomes_block || 'Vinhomes Hậu Nghĩa';

          healthList.push({
            code: p.project_code,
            client: p.client_name,
            progress,
            status: p.status,
            alert,
            desc,
            type,
            vinhomes
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
    <div className="min-h-screen text-slate-100 flex flex-col md:flex-row relative overflow-hidden bg-[#070a13]">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* LEFT SIDEBAR PANEL (Matching the reference screenshots) */}
      <aside className="w-full md:w-64 bg-slate-950/70 border-r border-slate-900 flex flex-col z-10 relative backdrop-blur-xl">
        {/* Brand Header Logo */}
        <div className="p-6 border-b border-slate-900 flex items-center space-x-3">
          <span className="font-bold text-2xl tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-xl">Qi</span>
          <span className="font-bold text-base text-white tracking-tight">QiHome.vn</span>
        </div>

        {/* User profile section */}
        <div className="px-6 py-6 border-b border-slate-900 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-sm">
            QD
          </div>
          <div>
            <div className="text-xs font-bold text-white">Nguyễn Duy Quang</div>
            <div className="text-[10px] text-slate-500">Founder & Chairman</div>
          </div>
        </div>

        {/* Stacked Vertical Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-600 px-3 mb-2 tracking-wider">
            Quản trị & Giám sát
          </div>
          
          <button
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'health' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 gold-glow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>🚦</span>
            <span>Sức Khỏe Dự Án</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'requests' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 gold-glow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>🔔</span>
            <span className="flex-1 text-left">Đơn Cần Duyệt</span>
            {overBudgetRequests.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'requests' ? 'bg-slate-950 text-amber-500' : 'bg-red-500/20 text-red-400'
              }`}>
                {overBudgetRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'vendors' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 gold-glow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>🏆</span>
            <span>Đánh Giá Đối Tác</span>
          </button>

          <div className="pt-4 text-[10px] uppercase font-bold text-slate-600 px-3 mb-2 tracking-wider">
            Báo cáo hệ thống
          </div>

          <button
            onClick={() => setActiveTab('financial_report')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'financial_report' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 gold-glow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>📊</span>
            <span>Báo Cáo Tài Chính</span>
          </button>
        </nav>

        {/* Logout / Exit at Bottom */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-slate-900/40 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-2"
          >
            <span>Quay lại Storefront</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 relative">
        {/* Top Header Search & Notifications bar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/20 px-8 flex justify-between items-center backdrop-blur-xl sticky top-0 z-20">
          {/* Mock Search input matching the reference screenshots */}
          <div className="relative w-80 hidden md:block">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search projects, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{isLive ? 'Live DB Connection' : 'Sandbox Cache Mode'}</span>
            </span>

            <div className="relative cursor-pointer">
              <span className="text-slate-400 hover:text-white transition">🔔</span>
              {overBudgetRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {overBudgetRequests.length}
                </span>
              )}
            </div>

            <div className="w-px h-6 bg-slate-900"></div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium">Nguyễn Duy Quang</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-black">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 space-y-6 flex-1">
          {/* Welcome Dashboard Banner */}
          <div className="bg-gradient-to-r from-amber-600/10 via-indigo-600/5 to-transparent border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-1">
              <h2 className="text-lg font-black text-white">Chào mừng trở lại, Chủ tịch Nguyễn Duy Quang</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Hệ thống số hóa QiHome.vn đang vận hành ổn định. Dưới đây là phân tích hiệu suất tổng quát của các công trình và nhà cung cấp.
              </p>
            </div>
            <div className="absolute right-6 top-4 text-6xl font-black text-amber-500/[0.03] select-none pointer-events-none tracking-wider">
              QI PRIME
            </div>
          </div>

          {/* KPI Financial Cards (Arranged dynamically on top) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel gold-glow rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doanh thu lũy kế</div>
              <div className="text-xl font-black mt-2 gold-text-gradient">{financials.totalRevenue.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-emerald-400 mt-1 flex items-center space-x-1">
                <span>✓</span> <span>Hợp đồng ba bên</span>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vin tài trợ 6%</div>
              <div className="text-xl font-black text-amber-500 mt-2">{financials.vinSubsidy.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Đã đối soát Vin Accounting</div>
            </div>
            <div className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Giải ngân TCB</div>
              <div className="text-xl font-black text-blue-400 mt-2">{financials.bankDisbursed.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Tín chấp bảo lãnh dự án</div>
            </div>
            <div className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lợi nhuận gộp</div>
              <div className="text-xl font-black text-emerald-400 mt-2">{financials.profitGross.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-emerald-500/80 mt-1">Biên định mức 15%</div>
            </div>
          </div>

          {/* MAIN TAB SWITCHER GRIDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
            
            {/* Tab 1: Project Health */}
            {activeTab === 'health' && (
              <>
                {/* Left part: list of projects (col-span-8) */}
                <div className="lg:col-span-8">
                  {(() => {
                    const filteredProjects = projectHealth.filter(proj => {
                      const matchesSearch = proj.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            proj.code.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesStage = filterStage === 'All' || proj.status === filterStage;
                      const matchesType = filterType === 'All' || proj.type === filterType;
                      const matchesVinhomes = filterVinhomes === 'All' || proj.vinhomes === filterVinhomes;
                      
                      return matchesSearch && matchesStage && matchesType && matchesVinhomes;
                    });

                    return (
                      <div className="glass-panel rounded-2xl p-6 space-y-5 shadow-2xl">
                        <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">🚦 Báo Cáo Sức Khỏe Dự Án (Global Project Health)</h3>
                        
                        {/* Search & Filters Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/20 p-3 rounded-xl border border-slate-900 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tìm kiếm dự án / khách</label>
                            <input
                              type="text"
                              placeholder="Tên khách, mã..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dự án Vinhomes</label>
                            <select
                              value={filterVinhomes}
                              onChange={(e) => setFilterVinhomes(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              <option value="All">Tất cả dự án</option>
                              <option value="Vinhomes Hậu Nghĩa">Vinhomes Hậu Nghĩa</option>
                              <option value="Vinhomes Grand Park">Vinhomes Grand Park</option>
                              <option value="Vinhomes Ocean Park">Vinhomes Ocean Park</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Giai đoạn tiến độ</label>
                            <select
                              value={filterStage}
                              onChange={(e) => setFilterStage(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              <option value="All">Tất cả giai đoạn</option>
                              <option value="pending_design">Concept phối cảnh AI</option>
                              <option value="in_production">Đang thi công lắp đặt</option>
                              <option value="qc_inspection">Đang chấm điểm QC</option>
                              <option value="completed">Đã hoàn thành bàn giao</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Loại hình nhà</label>
                            <select
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              <option value="All">Tất cả loại hình</option>
                              <option value="Chung cư">Chung cư</option>
                              <option value="Nhà phố">Nhà phố</option>
                              <option value="Biệt thự">Biệt thự</option>
                            </select>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-900 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {filteredProjects.length === 0 ? (
                            <div className="text-center text-xs text-slate-500 py-6">
                              Không tìm thấy dự án nào khớp với bộ lọc.
                            </div>
                          ) : (
                            filteredProjects.map((proj, idx) => (
                              <div key={idx} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                      proj.alert === 'green' ? 'bg-emerald-500' : proj.alert === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                                    } shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></span>
                                    <strong className="text-xs text-white">{proj.code}</strong>
                                    <span className="text-[10px] text-slate-500 mr-2">Khách hàng: {proj.client}</span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-400">
                                      {proj.vinhomes}
                                    </span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded font-bold text-amber-500">
                                      {proj.type}
                                    </span>
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
                    );
                  })()}
                </div>

                {/* Right part: Vendor Scorecard ranking (col-span-4) */}
                <div className="lg:col-span-4">
                  <div className="glass-panel gold-glow rounded-2xl p-6 space-y-4 shadow-2xl">
                    <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">🏆 Bảng Xếp Hạng Đối Tác</h3>
                    
                    <div className="space-y-4">
                      {scorecards.map((vendor, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-2 hover:border-amber-500/20 transition duration-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-slate-200">{vendor.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{vendor.type}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
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
                              <div className="text-[9px] text-slate-500">Rework</div>
                              <div className="text-xs font-bold text-red-400 mt-0.5">{vendor.reworks}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 2: Over Budget Approval Center */}
            {activeTab === 'requests' && (
              <>
                <div className="lg:col-span-8">
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
                </div>

                <div className="lg:col-span-4">
                  <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl text-xs">
                    <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">ℹ Quyền Phê Duyệt</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Để hạn chế thất thoát vật tư, mọi yêu cầu vượt định mức của thầu phụ hoặc thợ thi công đều phải được trình lên Chủ tịch kiểm duyệt.
                    </p>
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-500/90 rounded-xl space-y-1 mt-2">
                      <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ hình ảnh hiện trạng thợ gửi lên trước khi đồng ý giải ngân xuất vật tư bổ sung.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 3: Vendor & Supplier Evaluations */}
            {activeTab === 'vendors' && (
              <>
                <div className="lg:col-span-8 space-y-6">
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
                </div>

                <div className="lg:col-span-4">
                  {/* Historical Evaluations Table */}
                  <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">Nhật ký đánh giá năng lực</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
              </>
            )}

            {/* NEW TAB: Tab 4: Financial Report (Arranging details on right matching layout) */}
            {activeTab === 'financial_report' && (
              <>
                <div className="lg:col-span-8">
                  <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
                    <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">📊 Báo Cáo Doanh Thu Chi Tiết Dự Án</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-semibold uppercase">
                            <th className="py-3 px-2">Dự Án</th>
                            <th className="py-3 px-2">Khách Hàng</th>
                            <th className="py-3 px-2">Giá Trị HĐ</th>
                            <th className="py-3 px-2">Cọc Vin 6%</th>
                            <th className="py-3 px-2">Giải Ngân TCB</th>
                            <th className="py-3 px-2">LN Định Mức</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {projectHealth.map((proj, idx) => {
                            const contractVal = proj.code.includes('HAUNGHIA-101') ? 500000000 : 
                                               proj.code.includes('HAUNGHIA-102') ? 450000000 : 
                                               proj.code.includes('GRANDPARK') ? 600000000 : 650000000;
                            const vin6 = contractVal * 0.06;
                            const tcbVal = contractVal * 0.7 - vin6;
                            const profit15 = contractVal * 0.15;
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-900/10">
                                <td className="py-3 px-2 font-mono font-bold text-white">{proj.code}</td>
                                <td className="py-3 px-2 text-slate-300">{proj.client}</td>
                                <td className="py-3 px-2 text-amber-500 font-bold">{contractVal.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-2 text-slate-400">{vin6.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-2 text-blue-400">{tcbVal.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-2 text-emerald-400">{profit15.toLocaleString('vi-VN')}đ</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="glass-panel gold-glow rounded-2xl p-6 space-y-4 shadow-2xl text-xs">
                    <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-900 pb-3">📈 Cơ Cấu Dòng Tiền Dự Án</h3>
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Tiền Cọc Thu Cư Dân (30%):</span>
                          <span className="text-white font-bold">{(financials.totalRevenue * 0.3).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full w-[30%]"></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Ngân hàng TCB Giải Ngân (70%):</span>
                          <span className="text-white font-bold">{(financials.totalRevenue * 0.7).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[70%]"></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Vin Hỗ Trợ Đợt 1 (6% Căn Hộ):</span>
                          <span className="text-white font-bold">{financials.vinSubsidy.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[60%]"></div>
                        </div>
                      </div>
                    </div>
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

