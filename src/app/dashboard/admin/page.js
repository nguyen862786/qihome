'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'clients' | 'vendors' | 'sales_affiliate' | 'requests' | 'financial_report'
  
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

  // Filters for Project Health / Client Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterVinhomes, setFilterVinhomes] = useState('All');

  // Sales time filter
  const [salesTimeFilter, setSalesTimeFilter] = useState('month'); // 'month' | 'quarter' | 'year'

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
    { code: 'PRJ-HAUNGHIA-101', client: 'Phan Văn Trị', progress: 10, status: 'pending_design', alert: 'green', desc: 'Đã ký HĐ, đang chuẩn bị concept phối cảnh AI.', type: 'Chung cư', vinhomes: 'Vinhomes Hậu Nghĩa', location: 'Tòa S1.02 - Căn 1205', total_amount: 500000000, created_at: '2026-06-01', expected_delivery: '15/07/2026' },
    { code: 'PRJ-HAUNGHIA-102', client: 'Hoàng Thị Hoa', progress: 45, status: 'in_production', alert: 'green', desc: 'Hàng đã về kho vệ tinh, đang tiến hành lắp đặt.', type: 'Nhà phố', vinhomes: 'Vinhomes Hậu Nghĩa', location: 'Liền kề LK-08', total_amount: 450000000, created_at: '2026-05-15', expected_delivery: '30/06/2026' },
    { code: 'PRJ-GRANDPARK-201', client: 'Nguyễn Thị Bình', progress: 85, status: 'qc_inspection', alert: 'yellow', desc: 'Đang làm kiểm tra QC checklist gỗ liền tường.', type: 'Chung cư', vinhomes: 'Vinhomes Grand Park', location: 'Tòa L3 - Căn 2004', total_amount: 600000000, created_at: '2026-04-20', expected_delivery: '05/06/2026' },
    { code: 'PRJ-OCEANPARK-301', client: 'Trịnh Quốc Bảo', progress: 100, status: 'completed', alert: 'green', desc: 'Công trình đã bàn giao hoàn thiện, đạt QC.', type: 'Biệt thự', vinhomes: 'Vinhomes Ocean Park', location: 'Biệt thự San Hô SH-12', total_amount: 650000000, created_at: '2026-03-10', expected_delivery: '25/04/2026' }
  ];

  const MOCK_SCORECARDS = [
    { name: 'Thầu Phụ Hùng Vương', type: 'Đồ gỗ & Hoàn thiện', rating: 'Hạng A', score: 9.2, speed: 9.5, reworks: 2, notes: 'Thi công sắc nét, đúng thời hạn bàn giao.' },
    { name: 'Thầu Phụ Đông Á', type: 'Cơ điện & Sơn bả', rating: 'Hạng B', score: 8.1, speed: 7.8, reworks: 5, notes: 'Sơn bả thạch cao đợt đầu hơi loang, đã yêu cầu sửa đổi.' },
    { name: 'Studio Hoàng Gia', type: 'Thiết kế & Concept', rating: 'Hạng A', score: 9.5, speed: 9.2, reworks: 0, notes: 'Concept 3D dựng AI chuẩn chỉ, cư dân duyệt nhanh.' },
    { name: 'Nhà Máy Qi Wood', type: 'Nhà máy Sản xuất', rating: 'Hạng A', score: 9.8, speed: 9.6, reworks: 1, notes: 'Sản xuất gỗ công nghiệp An Cường đúng tiến độ và định mức BOM.' }
  ];

  const MOCK_SUBS = [
    { id: 'a0000000-0000-0000-0000-000000000004', full_name: 'Thầu Phụ Hùng Vương' },
    { id: 'sub-east-asia', full_name: 'Thầu Phụ Đông Á' }
  ];

  // Mock Sales statistics
  const MOCK_SALES_DATA = {
    month: {
      personalRevenue: 400000000,
      floorRevenue: 1800000000,
      contractsCount: 4,
      leaderboard: [
        { name: 'Nguyễn Minh Nam', role: 'Sales Lead', amount: 1200000000, count: 2 },
        { name: 'Lê Thu Trang', role: 'Affiliate Partner', amount: 400000000, count: 1 },
        { name: 'Trần Hoàng Bách', role: 'Sales Consultant', amount: 200000000, count: 1 }
      ]
    },
    quarter: {
      personalRevenue: 1200000000,
      floorRevenue: 5400000000,
      contractsCount: 12,
      leaderboard: [
        { name: 'Nguyễn Minh Nam', role: 'Sales Lead', amount: 3100000000, count: 6 },
        { name: 'Lê Thu Trang', role: 'Affiliate Partner', amount: 1500000000, count: 4 },
        { name: 'Trần Hoàng Bách', role: 'Sales Consultant', amount: 800000000, count: 2 }
      ]
    },
    year: {
      personalRevenue: 4500000000,
      floorRevenue: 21000000000,
      contractsCount: 45,
      leaderboard: [
        { name: 'Nguyễn Minh Nam', role: 'Sales Lead', amount: 12500000000, count: 25 },
        { name: 'Lê Thu Trang', role: 'Affiliate Partner', amount: 5500000000, count: 12 },
        { name: 'Trần Hoàng Bách', role: 'Sales Consultant', amount: 3000000000, count: 8 }
      ]
    }
  };

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
          totalRevenue += Number(p.total_amount || 0);
          vinSubsidy += Number(p.vin_subsidy || 0);
          const bankAmt = Number(p.total_amount || 0) * 0.7 - Number(p.vin_subsidy || 0);
          if (bankAmt > 0) bankDisbursed += bankAmt;
          profitGross += Number(p.total_amount || 0) * 0.15;

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

          let expected_delivery = 'Chưa xác định';
          if (p.created_at) {
            expected_delivery = new Date(new Date(p.created_at).getTime() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN');
          }

          healthList.push({
            code: p.project_code,
            client: p.client_name,
            progress,
            status: p.status,
            alert,
            desc,
            type,
            vinhomes,
            location: `${p.vinhomes_block || ''} - ${p.vinhomes_floor_căn || ''}`,
            total_amount: Number(p.total_amount || 0),
            created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : '---',
            expected_delivery
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
          
          let subType = 'Thi công hoàn thiện';
          if (vName.includes('Studio') || vName.includes('Concept')) subType = 'Thiết kế';
          else if (vName.includes('Nhà Máy')) subType = 'Nhà máy sản xuất';
          else if (vName.includes('Đông Á')) subType = 'Điện nước & Sơn bả';

          return {
            name: vName,
            type: subType,
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

  const currentSalesData = MOCK_SALES_DATA[salesTimeFilter] || MOCK_SALES_DATA.month;

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row relative overflow-hidden bg-[#faf8f5]">
      {/* LEFT SIDEBAR PANEL (Matching the reference screenshots) */}
      <aside className="w-full md:w-64 bg-[#14151b] border-r border-[#262832] flex flex-col z-10 relative">
        {/* Brand Header Logo */}
        <div className="p-6 border-b border-[#262832] flex items-center space-x-3">
          <span className="font-bold text-2xl tracking-wider text-[#c49a62] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded-xl">Qi</span>
          <span className="font-bold text-base text-white tracking-tight">QiHome.vn</span>
        </div>

        {/* User profile section */}
        <div className="px-6 py-6 border-b border-[#262832] flex items-center space-x-3 text-white">
          <div className="w-10 h-10 rounded-full bg-[#c49a62]/20 border border-[#c49a62]/40 flex items-center justify-center font-bold text-[#c49a62] text-sm">
            QD
          </div>
          <div>
            <div className="text-xs font-bold text-white">Nguyễn Duy Quang</div>
            <div className="text-[10px] text-slate-500">Founder & Chairman</div>
          </div>
        </div>

        {/* Stacked Vertical Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Quản trị & Giám sát
          </div>
          
          <button
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'health' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>📊</span>
            <span>Tiến Độ Dự Án</span>
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
            onClick={() => setActiveTab('vendors')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'vendors' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>🤝</span>
            <span>Đối Tác</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_affiliate')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'sales_affiliate' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>📢</span>
            <span>Sale / Affiliate</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'requests' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>🔔</span>
            <span className="flex-1 text-left">Đơn Cần Duyệt</span>
            {overBudgetRequests.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'requests' ? 'bg-[#14151b] text-[#c49a62]' : 'bg-red-500/20 text-red-400'
              }`}>
                {overBudgetRequests.length}
              </span>
            )}
          </button>

          <Link
            href="/dashboard/admin/products"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/40 transition duration-200"
          >
            <span>📦</span>
            <span>Quản Lý Sản Phẩm</span>
          </Link>

          <div className="pt-4 text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Báo cáo hệ thống
          </div>

          <button
            onClick={() => setActiveTab('financial_report')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              activeTab === 'financial_report' 
                ? 'bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <span>💵</span>
            <span>Báo Cáo Tài Chỉh</span>
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
        {/* Top Header Search & Notifications bar */}
        <header className="h-16 border-b border-[#ebdcb9] bg-white px-8 flex justify-between items-center sticky top-0 z-20">
          {/* Search input matching reference */}
          <div className="relative w-80 hidden md:block">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search projects, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
            />
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1.5 px-2.5 py-1 bg-[#faf8f5] border border-[#ebdcb9] rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{isLive ? 'Live DB Connection' : 'Sandbox Cache Mode'}</span>
            </span>

            <div className="relative cursor-pointer text-slate-500">
              <span className="hover:text-[#c49a62] transition">🔔</span>
              {overBudgetRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {overBudgetRequests.length}
                </span>
              )}
            </div>

            <div className="w-px h-6 bg-[#ebdcb9]"></div>

            <div className="flex items-center space-x-2 text-xs text-slate-700">
              <span className="font-bold">Nguyễn Duy Quang</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#c49a62]/10 text-[#c49a62] border border-[#c49a62]/20 rounded font-black">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 space-y-6 flex-1">
          {/* Welcome Dashboard Banner - Gold background matching screen */}
          <div className="bg-[#c49a62] text-white rounded-3xl p-6 relative overflow-hidden shadow-md flex justify-between items-center">
            <div className="relative z-10 space-y-1">
              <h2 className="text-xl font-bold text-white">Welcome back, Nguyễn Duy Quang!</h2>
              <p className="text-xs text-white/80 leading-relaxed max-w-xl">
                Hệ thống số hóa QiHome.vn đang vận hành ổn định. Dưới đây là phân tích hiệu suất tổng quát của các công trình và nhà cung cấp.
              </p>
            </div>
            <div className="absolute right-6 top-4 text-7xl font-black text-white/5 select-none pointer-events-none tracking-wider">
              QI PRIME
            </div>
          </div>

          {/* KPI Financial Cards (Arranged dynamically on top) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#c49a62]/60 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Doanh thu lũy kế</div>
              <div className="text-xl font-black mt-2 text-[#c49a62]">{financials.totalRevenue.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-[#c49a62] font-semibold mt-1">✓ Hợp đồng ba bên</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#c49a62]/60 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vin tài trợ 6%</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{financials.vinSubsidy.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Đã đối soát Vin Accounting</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#c49a62]/60 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Giải ngân TCB</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{financials.bankDisbursed.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Tín chấp bảo lãnh dự án</div>
            </div>
            <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#c49a62]/60 transition duration-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lợi nhuận gộp</div>
              <div className="text-xl font-black text-[#c49a62] mt-2">{financials.profitGross.toLocaleString('vi-VN')}đ</div>
              <div className="text-[9px] text-slate-500 mt-1">Biên định mức 15%</div>
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
                      <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-5 shadow-sm text-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">📊 Tiến Độ Dự Án (Project Progress Health)</h3>
                        
                        {/* Search & Filters Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#faf8f5] p-3 rounded-xl border border-[#ebdcb9] text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tìm kiếm dự án / khách</label>
                            <input
                              type="text"
                              placeholder="Tên khách, mã..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dự án Vinhomes</label>
                            <select
                              value={filterVinhomes}
                              onChange={(e) => setFilterVinhomes(e.target.value)}
                              className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
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
                              className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
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
                              className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
                            >
                              <option value="All">Tất cả loại hình</option>
                              <option value="Chung cư">Chung cư</option>
                              <option value="Nhà phố">Nhà phố</option>
                              <option value="Biệt thự">Biệt thự</option>
                            </select>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {filteredProjects.length === 0 ? (
                            <div className="text-center text-xs text-slate-400 py-6">
                              Không tìm thấy dự án nào khớp với bộ lọc.
                            </div>
                          ) : (
                            filteredProjects.map((proj, idx) => (
                              <div key={idx} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                      proj.alert === 'green' ? 'bg-emerald-500' : proj.alert === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}></span>
                                    <strong className="text-xs text-slate-900">{proj.code}</strong>
                                    <span className="text-[10px] text-slate-500 mr-2">Khách hàng: {proj.client}</span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-5 border border-slate-200 rounded font-semibold text-slate-600">
                                      {proj.vinhomes}
                                    </span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#c49a62]/10 border border-[#c49a62]/20 rounded font-bold text-[#c49a62]">
                                      {proj.type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500">{proj.desc}</p>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="w-24 bg-slate-150 border border-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-[#c49a62] h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-600 font-bold">{proj.progress}%</span>
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded">
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

                {/* Right part: Vendor Scorecard ranking (Matching the warm activity card layout - col-span-4) */}
                <div className="lg:col-span-4">
                  <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight border-b border-[#e2d5c3] pb-3">🏆 Bảng Xếp Hạng Đối Tác</h3>
                    
                    <div className="space-y-4">
                      {scorecards.map((vendor, idx) => (
                        <div key={idx} className="bg-white border border-[#e9e3d5] rounded-xl p-4 space-y-2 hover:border-[#c49a62]/50 transition duration-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-slate-900">{vendor.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{vendor.type}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#c49a62]/10 text-[#c49a62] border border-[#c49a62]/20 rounded">
                              {vendor.rating}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                            <div>
                              <div className="text-[9px] text-slate-400">Chất lượng</div>
                              <div className="text-xs font-bold text-[#c49a62] mt-0.5">{vendor.score}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400">Tiến độ</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">{vendor.speed}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-slate-400">Rework</div>
                              <div className="text-xs font-bold text-red-500 mt-0.5">{vendor.reworks}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* NEW TAB: Tab 2: Danh Sách Khách Hàng (clients) */}
            {activeTab === 'clients' && (
              <div className="lg:col-span-12">
                <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-5 shadow-sm text-slate-800 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#ebdcb9] pb-3">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">👥 Danh Sách Quản Lý Khách Hàng & Hợp Đồng</h3>
                    <span className="text-xs px-2.5 py-0.5 bg-[#c49a62]/10 text-[#c49a62] border border-[#c49a62]/20 rounded-full font-bold">
                      {projectHealth.length} Khách hàng đăng ký
                    </span>
                  </div>

                  {/* Filter box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#faf8f5] p-3 rounded-xl border border-[#ebdcb9] text-xs">
                    <input
                      type="text"
                      placeholder="Tìm theo tên cư dân hoặc mã dự án..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border border-[#ebdcb9] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
                    />
                    <select
                      value={filterVinhomes}
                      onChange={(e) => setFilterVinhomes(e.target.value)}
                      className="bg-white border border-[#ebdcb9] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="All">Tất cả dự án Vin</option>
                      <option value="Vinhomes Hậu Nghĩa">Vinhomes Hậu Nghĩa</option>
                      <option value="Vinhomes Grand Park">Vinhomes Grand Park</option>
                      <option value="Vinhomes Ocean Park">Vinhomes Ocean Park</option>
                    </select>
                    <select
                      value={filterStage}
                      onChange={(e) => setFilterStage(e.target.value)}
                      className="bg-white border border-[#ebdcb9] rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="All">Tất cả tiến độ</option>
                      <option value="pending_design">Concept phối cảnh AI</option>
                      <option value="in_production">Đang thi công</option>
                      <option value="qc_inspection">Đang kiểm định QC</option>
                      <option value="completed">Đã bàn giao</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebdcb9] text-slate-500 font-semibold uppercase">
                          <th className="py-3 px-2">Khách Hàng</th>
                          <th className="py-3 px-2">Mã Dự Án</th>
                          <th className="py-3 px-2">Địa Chỉ Căn Hộ</th>
                          <th className="py-3 px-2 text-right">Giá Trị HĐ</th>
                          <th className="py-3 px-2 text-center">Tiến Độ Thực Tế</th>
                          <th className="py-3 px-2 text-center">Ngày Bàn Giao Dự Kiến</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projectHealth
                          .filter(p => {
                            const matchQuery = p.client.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase());
                            const matchVin = filterVinhomes === 'All' || p.vinhomes === filterVinhomes;
                            const matchStage = filterStage === 'All' || p.status === filterStage;
                            return matchQuery && matchVin && matchStage;
                          })
                          .map((client, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-3 px-2 font-bold text-slate-900">{client.client}</td>
                              <td className="py-3 px-2 font-mono font-semibold text-slate-600">{client.code}</td>
                              <td className="py-3 px-2">
                                <div className="text-slate-700">{client.vinhomes}</div>
                                <div className="text-[10px] text-slate-400">{client.location}</div>
                              </td>
                              <td className="py-3 px-2 text-right font-bold text-[#c49a62]">
                                {(client.total_amount || 500000000).toLocaleString('vi-VN')}đ
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${
                                  client.status === 'completed' 
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                    : client.status === 'qc_inspection'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                }`}>
                                  {client.status === 'pending_design' ? 'Concept phối cảnh AI' :
                                   client.status === 'in_production' ? 'Đang thi công lắp đặt' :
                                   client.status === 'qc_inspection' ? 'Đang chấm điểm QC' : 'Đã bàn giao'}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center text-slate-600 font-semibold">
                                📅 {client.expected_delivery || '30/08/2026'}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Đối Tác (vendors) */}
            {activeTab === 'vendors' && (
              <>
                <div className="lg:col-span-8 space-y-6">
                  {/* Interactive Evaluation Form */}
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">📝 Biểu Mẫu Đánh Giá Năng Lực Đối Tác</h3>
                    
                    {formSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3.5 rounded-xl">
                        {formSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSubmitEvaluation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Chọn Thầu phụ / Đối tác</label>
                        <select
                          value={selectedSubId}
                          onChange={(e) => setSelectedSubId(e.target.value)}
                          className="w-full bg-white border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
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
                          className="w-full bg-white border border-[#ebdcb9] rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
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
                          className="w-full bg-white border border-[#ebdcb9] rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
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
                          className="w-full bg-white border border-[#ebdcb9] rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c49a62]"
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
                          className="w-full bg-white border border-[#ebdcb9] rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
                        ></textarea>
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-sm"
                        >
                          {loading ? 'Đang gửi...' : 'Gửi Đánh Giá KPI'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  {/* Historical Evaluations Table */}
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-850">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">Phân loại & Điểm số đối tác</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {scorecards.map((vendor, idx) => (
                        <div key={idx} className="bg-[#faf8f5] border border-[#ebdcb9] p-3 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800 block">{vendor.name}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#c49a62]/10 border border-[#c49a62]/20 rounded text-[#c49a62] font-black">{vendor.type}</span>
                            </div>
                            <span className="text-[10px] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded text-[#c49a62] font-bold">
                              {vendor.rating}
                            </span>
                          </div>
                          <p className="text-slate-500 italic">" {vendor.notes} "</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* NEW TAB: Tab 4: Sale / Affiliate (sales_affiliate) */}
            {activeTab === 'sales_affiliate' && (
              <>
                <div className="lg:col-span-8 space-y-6">
                  {/* Sales performance details card */}
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                        <span>📢 Báo cáo doanh số & bảng xếp hạng</span>
                      </h3>

                      {/* Time Filter Month / Quarter / Year */}
                      <select
                        value={salesTimeFilter}
                        onChange={(e) => setSalesTimeFilter(e.target.value)}
                        className="bg-[#faf8f5] border border-[#ebdcb9] rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="month">Thời gian: Tháng này</option>
                        <option value="quarter">Thời gian: Quý này</option>
                        <option value="year">Thời gian: Năm nay</option>
                      </select>
                    </div>

                    {/* Sales overview chart details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#faf8f5] border border-[#ebdcb9] p-4 rounded-2xl space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Doanh thu Sale Cá Nhân</div>
                        <div className="text-lg font-black text-[#c49a62]">{currentSalesData.personalRevenue.toLocaleString('vi-VN')}đ</div>
                        <div className="text-[9px] text-slate-400">Doanh số tiếp thị liên kết cá nhân</div>
                      </div>
                      <div className="bg-[#faf8f5] border border-[#ebdcb9] p-4 rounded-2xl space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Doanh thu toàn sàn (Floor)</div>
                        <div className="text-lg font-black text-slate-900">{currentSalesData.floorRevenue.toLocaleString('vi-VN')}đ</div>
                        <div className="text-[9px] text-slate-400">Tổng doanh số toàn bộ đại lý/affiliates</div>
                      </div>
                    </div>

                    {/* Leaderboard of Top Sales */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                        <span>🏆 Bảng Xếp Hạng Doanh Số Top Sales</span>
                      </h4>

                      <div className="space-y-2">
                        {currentSalesData.leaderboard.map((sale, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <span className="w-5 h-5 rounded-full bg-[#c49a62]/10 border border-[#c49a62]/20 text-[#c49a62] font-black text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <strong className="text-xs text-slate-900">{sale.name}</strong>
                                <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#c49a62]/10 text-[#c49a62] font-bold rounded ml-2">{sale.role}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-800">{sale.amount.toLocaleString('vi-VN')}đ</div>
                              <div className="text-[9px] text-slate-500">Đã chốt: <strong className="text-[#c49a62]">{sale.count} HĐ</strong></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  {/* Statistics Closed successfully */}
                  <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-[#e2d5c3] pb-3">📈 Thống Kê Affiliate</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>Số lượng hợp đồng chốt thành công:</span>
                          <span className="text-slate-900 font-bold">{currentSalesData.contractsCount} HĐ</span>
                        </div>
                        <div className="w-full bg-white border border-[#e2d5c3] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#c49a62] h-full" style={{ width: `${(currentSalesData.contractsCount / 50) * 100}%` }}></div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#e2d5c3] rounded-xl space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-700">Chính sách hoa hồng Sale:</div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Mỗi thành viên khi giới thiệu cư dân Vinhomes sử dụng dịch vụ QiHome.vn sẽ được hưởng <strong>2.0% giá trị hợp đồng thi công thực tế</strong> sau khi đối soát giải ngân.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 5: Over Budget Approval Center */}
            {activeTab === 'requests' && (
              <>
                <div className="lg:col-span-8">
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-between border-b border-slate-100 pb-3">
                      <span>🔔 Phê Duyệt Phát Sinh Ngoài Định Mức</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full">
                        {overBudgetRequests.length} Đơn chờ duyệt
                      </span>
                    </h3>

                    {overBudgetRequests.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-6">
                        Không có yêu cầu vượt định mức nào đang chờ duyệt.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {overBudgetRequests.map((req) => (
                          <div key={req.id} className="bg-[#faf8f5] border border-[#ebdcb9] rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-slate-900">{req.projectCode} - {req.contractor}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Yêu cầu cấp thêm: <strong className="text-slate-700">{req.qty} đơn vị</strong> ({req.item})
                                </div>
                              </div>
                              <span className="text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded">
                                Vượt BOM
                              </span>
                            </div>
                            
                            <div className="text-xs bg-white p-2.5 rounded border border-[#ebdcb9] text-slate-600 leading-relaxed">
                              📝 {req.reason}
                            </div>

                            {req.image && (
                              <div className="text-[10px] text-[#c49a62] font-semibold underline cursor-pointer">
                                🔍 Xem ảnh bằng chứng lỗi hỏng
                              </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-2">
                              <button
                                disabled={loading}
                                onClick={() => handleApproveRequest(req.id, false)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs px-3.5 py-1.5 rounded-lg transition"
                              >
                                Từ chối
                              </button>
                              <button
                                disabled={loading}
                                onClick={() => handleApproveRequest(req.id, true)}
                                className="bg-[#c49a62] hover:bg-[#b08752] text-white text-xs px-4 py-1.5 rounded-lg font-bold transition shadow-sm"
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
                  <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-[#e2d5c3] pb-3">ℹ Quyền Phê Duyệt</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Để hạn chế thất thoát vật tư, mọi yêu cầu vượt định mức của thầu phụ hoặc thợ thi công đều phải được trình lên Chủ tịch kiểm duyệt.
                    </p>
                    <div className="p-3 bg-[#c49a62]/10 border border-[#c49a62]/20 text-[#c49a62] rounded-xl space-y-1 mt-2">
                      <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ hình ảnh hiện trạng thợ gửi lên trước khi đồng ý giải ngân xuất vật tư bổ sung.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 6: Financial Report */}
            {activeTab === 'financial_report' && (
              <>
                <div className="lg:col-span-8">
                  <div className="bg-white border border-[#ebdcb9] rounded-2xl p-6 space-y-4 shadow-sm text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">📊 Báo Cáo Doanh Thu Chi Tiết Dự Án</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#ebdcb9] text-slate-500 font-semibold uppercase">
                            <th className="py-3 px-2">Dự Án</th>
                            <th className="py-3 px-2">Khách Hàng</th>
                            <th className="py-3 px-2">Giá Trị HĐ</th>
                            <th className="py-3 px-2">Cọc Vin 6%</th>
                            <th className="py-3 px-2">Giải Ngân TCB</th>
                            <th className="py-3 px-2">LN Định Mức</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projectHealth.map((proj, idx) => {
                            const contractVal = proj.code.includes('HAUNGHIA-101') ? 500000000 : 
                                               proj.code.includes('HAUNGHIA-102') ? 450000000 : 
                                               proj.code.includes('GRANDPARK') ? 600000000 : 650000000;
                            const vin6 = contractVal * 0.06;
                            const tcbVal = contractVal * 0.7 - vin6;
                            const profit15 = contractVal * 0.15;
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-3 px-2 font-mono font-bold text-slate-900">{proj.code}</td>
                                <td className="py-3 px-2 text-slate-700">{proj.client}</td>
                                <td className="py-3 px-2 text-[#c49a62] font-bold">{contractVal.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-2 text-slate-500">{vin6.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-2 text-blue-500">{tcbVal.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-2 text-emerald-600">{profit15.toLocaleString('vi-VN')}đ</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-[#f4ebd9] border border-[#e2d5c3] rounded-2xl p-6 space-y-4 shadow-sm text-xs text-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-[#e2d5c3] pb-3">📈 Cơ Cấu Dòng Tiền Dự Án</h3>
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>Tiền Cọc Thu Cư Dân (30%):</span>
                          <span className="text-slate-900 font-bold">{(financials.totalRevenue * 0.3).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-white border border-[#e2d5c3] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#c49a62] h-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>Ngân hàng TCB Giải Ngân (70%):</span>
                          <span className="text-slate-900 font-bold">{(financials.totalRevenue * 0.7).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-white border border-[#e2d5c3] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: '70%' }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>Vin Hỗ Trợ Đợt 1 (6% Căn Hộ):</span>
                          <span className="text-slate-900 font-bold">{financials.vinSubsidy.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-white border border-[#e2d5c3] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: '60%' }}></div>
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
