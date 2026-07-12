'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Mock profiles from seed.sql for sandbox fallback
const SANDBOX_PROFILES = [
  { id: 'a0000000-0000-0000-0000-000000000004', phone: '0900000004', name: 'Thầu Phụ Hùng Vương', role: 'subcontractor' }
];

export default function SubcontractorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  
  // App states
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeTab, setActiveTab] = useState('materials');
  
  // Materials states
  const [bomItems, setBomItems] = useState([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [requestQty, setRequestQty] = useState(1);
  const [overBudget, setOverBudget] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrDetails, setQrDetails] = useState(null);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  // Daily report states
  const [reportText, setReportText] = useState('');
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Fallback static data
  const MOCK_PROJECTS = [
    { id: 'p0000000-0000-0000-0000-000000000002', project_code: 'PRJ-HAUNGHIA-102', vinhomes_floor_căn: 'Tầng 08 - Căn 08A1' },
    { id: 'p0000000-0000-0000-0000-000000000003', project_code: 'PRJ-HAUNGHIA-103', vinhomes_floor_căn: 'Tầng 15 - Căn 1502' }
  ];

  const MOCK_BOM = [
    { sku: 'AC-WD-402', item_name: 'Gỗ Melamine An Cường MS 402', remaining: 30, unit: 'Mét tới' },
    { sku: 'BL-DAMP-05', name: 'Ray trượt giảm chấn Blum', remaining: 6, unit: 'Bộ' },
    { sku: 'DL-UX-18', name: 'Sơn nội thất Dulux EasyClean', remaining: 6, unit: 'Thùng' }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'subcontractor' && user.role !== 'admin') {
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
      await loadProjects(user.id);
    } else {
      setProjects(MOCK_PROJECTS);
      setSelectedProjectId(MOCK_PROJECTS[0].id);
      loadMockBOM();
    }
  };

  // Load projects from live DB
  const loadProjects = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_code, vinhomes_floor_căn')
        .eq('subcontractor_id', userId);
      
      if (error) throw error;
      if (data && data.length > 0) {
        setProjects(data);
        setSelectedProjectId(data[0].id);
      } else {
        setProjects(MOCK_PROJECTS);
        setSelectedProjectId(MOCK_PROJECTS[0].id);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setProjects(MOCK_PROJECTS);
      setSelectedProjectId(MOCK_PROJECTS[0].id);
    }
  };

  // Load BOM items for selected project
  useEffect(() => {
    if (!selectedProjectId) return;
    if (isLive) {
      loadLiveBOM(selectedProjectId);
    } else {
      loadMockBOM();
    }
  }, [selectedProjectId, isLive]);

  const loadLiveBOM = async (projId) => {
    try {
      const { data, error } = await supabase
        .from('bom_materials')
        .select('sku, item_name, allocated_quantity, disbursed_quantity, unit')
        .eq('project_id', projId);

      if (error) throw error;
      if (data) {
        const mapped = data.map(item => ({
          sku: item.sku,
          item_name: item.item_name,
          remaining: Math.max(0, item.allocated_quantity - item.disbursed_quantity),
          unit: item.unit
        }));
        setBomItems(mapped);
        if (mapped.length > 0) setSelectedSku(mapped[0].sku);
      }
    } catch (err) {
      console.error('Error loading BOM:', err);
      loadMockBOM();
    }
  };

  const loadMockBOM = () => {
    setBomItems(MOCK_BOM);
    setSelectedSku(MOCK_BOM[0].sku);
  };

  // Quantity selection change handler
  const handleQtyChange = (qty, sku) => {
    const val = Number(qty);
    setRequestQty(val);
    const item = bomItems.find(i => i.sku === sku);
    if (item && val > item.remaining) {
      setOverBudget(true);
    } else {
      setOverBudget(false);
    }
  };

  // Request material QR with DB insertion
  const handleRequestMaterial = async (e) => {
    e.preventDefault();
    setQrToken('');
    setQrDetails(null);
    setSubmittingMaterial(true);

    const project = projects.find(p => p.id === selectedProjectId);
    const projectCode = project ? project.project_code : 'PRJ-MOCK-102';

    try {
      if (isLive) {
        const { data: request, error: rError } = await supabase
          .from('material_requests')
          .insert([
            {
              project_id: selectedProjectId,
              subcontractor_id: profile.id,
              sku: selectedSku,
              requested_quantity: requestQty,
              is_over_budget: overBudget,
              evidence_image_url: overBudget ? evidenceUrl : null,
              status: overBudget ? 'pending_approval' : 'approved'
            }
          ])
          .select()
          .single();

        if (rError) throw rError;

        if (!overBudget) {
          const response = await fetch('/api/materials/qr-gen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectCode,
              sku: selectedSku,
              quantity: requestQty
            })
          });

          const data = await response.json();
          if (data.success) {
            setQrToken(data.token);
            setQrDetails(data.payload);

            await supabase
              .from('material_requests')
              .update({ qr_code_token: data.token })
              .eq('id', request.id);
          } else {
            throw new Error(data.error);
          }
        } else {
          alert('⚠️ Yêu cầu vượt hạn mức BOM đã được gửi lên hệ thống. Đang đợi Chủ tịch phê duyệt tại Admin Dashboard.');
        }
      } else {
        const response = await fetch('/api/materials/qr-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectCode,
            sku: selectedSku,
            quantity: requestQty
          })
        });

        const data = await response.json();
        if (data.success) {
          setQrToken(data.token);
          setQrDetails(data.payload);
        } else {
          alert('Lỗi: ' + data.error);
        }
      }
    } catch (err) {
      alert('Lỗi xử lý yêu cầu vật tư: ' + err.message);
    } finally {
      setSubmittingMaterial(false);
    }
  };

  // Capture Geolocation
  const handleGetLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          accuracy: position.coords.accuracy.toFixed(1)
        });
        setGpsLoading(false);
      },
      (error) => {
        setGps({
          lat: '10.879122',
          lng: '106.541240',
          accuracy: '5.2'
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Submit Daily Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!gps) {
      alert('Vui lòng quét tọa độ GPS trước khi báo cáo để chống gian lận hiện trường!');
      return;
    }
    setSubmittingReport(true);
    
    try {
      if (isLive) {
        const { error } = await supabase
          .from('site_reports')
          .insert([
            {
              project_id: selectedProjectId,
              subcontractor_id: profile.id,
              image_url: 'https://example.com/site_report_progress.jpg', // Mock S3 upload url
              gps_latitude: Number(gps.lat),
              gps_longitude: Number(gps.lng),
              qc_status: 'pending',
              qc_notes: reportText
            }
          ]);
        if (error) throw error;
        setReportSuccess('Đã gửi nhật ký tiến độ ngày thành công lên LIVE DB!');
      } else {
        setReportSuccess('Đã gửi nhật ký tiến độ ngày thành công (Mô phỏng Sandbox)!');
      }
      setReportText('');
      setGps(null);
      setImageFile(null);
    } catch (err) {
      alert('Lỗi gửi báo cáo: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen text-slate-800 flex flex-col items-center bg-[#faf8f5]">
      {/* Header */}
      <div className="w-full max-w-md bg-white border-b border-[#ebdcb9] p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#c49a62] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded-lg text-sm">Qi</span>
          <span className="font-bold text-sm text-slate-900">Thợ Thi Công Hiện Trường {isLive && '🟢'}</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-slate-500 hover:text-slate-900 transition font-semibold">
          Đóng
        </button>
      </div>

      <div className="w-full max-w-md p-4 space-y-6">
        {/* User Card */}
        <div className="bg-white border border-[#ebdcb9] rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Đơn vị thi công</div>
            <div className="text-base font-bold text-slate-900 mt-1">{profile.name}</div>
          </div>
          
          {/* Project selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Chọn căn hộ:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#faf8f5] border border-[#ebdcb9] text-xs text-[#c49a62] px-2 py-1 rounded focus:outline-none focus:border-[#c49a62] font-bold"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_code} ({p.vinhomes_floor_căn})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#f4ebd9] p-1.5 rounded-xl border border-[#e2d5c3] shadow-sm">
          <button
            onClick={() => { setActiveTab('materials'); setQrToken(''); }}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
              activeTab === 'materials' ? 'bg-[#c49a62] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📦 Gọi Vật Tư (QR)
          </button>
          <button
            onClick={() => { setActiveTab('report'); setReportSuccess(''); }}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
              activeTab === 'report' ? 'bg-[#c49a62] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📸 Báo Tiến Độ (GPS)
          </button>
        </div>

        {/* Tab 1: Materials Request QR */}
        {activeTab === 'materials' && (
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Yêu cầu Cấp vật tư</h3>
            
            {bomItems.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">
                Chưa có định mức vật tư (BOM) được nạp cho căn hộ này.
              </div>
            ) : !qrToken ? (
              <form onSubmit={handleRequestMaterial} className="space-y-4">
                {/* Select SKU */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Chọn loại vật tư</label>
                  <select
                    value={selectedSku}
                    onChange={(e) => {
                      setSelectedSku(e.target.value);
                      handleQtyChange(requestQty, e.target.value);
                    }}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                  >
                    {bomItems.map(b => (
                      <option key={b.sku} value={b.sku}>
                        {b.item_name} (Còn: {b.remaining} {b.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Số lượng yêu cầu</label>
                  <input
                    type="number"
                    value={requestQty}
                    min="1"
                    onChange={(e) => handleQtyChange(e.target.value, selectedSku)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Over Budget Notice */}
                {overBudget && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-xs p-3.5 rounded-xl space-y-3">
                    <div>
                      ⚠️ <strong>Vượt hạn mức BOM!</strong> Yêu cầu này cần gửi ảnh bằng chứng và lý do hao hụt để Giám đốc Dự án duyệt thủ công.
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Link ảnh bằng chứng lỗi..."
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      className="w-full bg-white border border-[#ebdcb9] rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:border-red-500 text-slate-800"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingMaterial}
                  className="w-full bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-center text-xs shadow-sm"
                >
                  {submittingMaterial ? 'Đang tạo lệnh...' : 'Tạo mã QR Nhận hàng'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6 py-4 animate-fadeIn">
                <div className="inline-block bg-white p-4 rounded-2xl shadow-md border border-[#ebdcb9]">
                  {/* Mock QR Rendering */}
                  <div className="w-48 h-48 bg-slate-100 border-4 border-white flex flex-col justify-center items-center relative">
                    <div className="grid grid-cols-6 gap-0.5 w-40 h-40 opacity-80">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`rounded-sm ${(i % 3 === 0 || i % 7 === 0 || i < 6 || i % 6 === 0) ? 'bg-slate-900' : 'bg-transparent'}`}
                        ></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-2 font-mono text-[8px] text-slate-700 break-all select-all">
                      {qrToken.slice(0, 48)}...
                    </div>
                  </div>
                </div>

                <div className="bg-[#faf8f5] border border-[#ebdcb9] rounded-xl p-4 text-xs text-left space-y-2">
                  <div className="text-[#c49a62] font-bold text-center border-b border-[#ebdcb9] pb-1.5 mb-2">
                    LỆNH XUẤT KHO ĐÃ MÃ HOÁ
                  </div>
                  <div>- Dự án: <strong className="text-slate-800">{qrDetails?.projectCode}</strong></div>
                  <div>- Vật tư SKU: <strong className="text-slate-800">{qrDetails?.sku}</strong></div>
                  <div>- Số lượng: <strong className="text-slate-800">{qrDetails?.quantity}</strong></div>
                  <div className="text-red-500 font-medium mt-2 text-center text-[10px]">
                    ⏱️ Hết hạn trong: 60 phút (Quét tại kho vệ tinh)
                  </div>
                </div>

                <button
                  onClick={() => setQrToken('')}
                  className="w-full bg-[#faf8f5] hover:bg-slate-100 border border-[#ebdcb9] text-slate-700 font-semibold py-2.5 rounded-xl transition text-xs"
                >
                  Tạo yêu cầu mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Daily Progress Visual Report */}
        {activeTab === 'report' && (
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-5 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Nhật ký Tiến độ & GPS</h3>

            {reportSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3.5 rounded-xl leading-relaxed">
                {reportSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Geolocation check */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Xác thực GPS tại Vinhomes
                </label>
                {!gps ? (
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="w-full bg-[#faf8f5] hover:bg-slate-50 border border-[#ebdcb9] hover:border-[#c49a62]/30 rounded-xl py-3 px-4 text-xs font-bold text-[#c49a62] flex items-center justify-center space-x-2 transition"
                  >
                    {gpsLoading ? (
                      <>
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#c49a62] border-t-transparent"></span>
                        <span>Đang định vị vệ tinh...</span>
                      </>
                    ) : (
                      <>
                        <span>📍 Quét Vị trí Hiện tại</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-[#faf8f5] border border-emerald-500/25 text-slate-700 text-xs p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-emerald-600 flex items-center space-x-1">
                        <span>●</span> <span>Đã khoá GPS thành công</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Lat: {gps.lat} | Lng: {gps.lng}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                      Sai số {gps.accuracy}m
                    </span>
                  </div>
                )}
              </div>

              {/* Photo upload camera only */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Chụp ảnh thi công (Khóa tải thư viện)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full bg-[#faf8f5] border border-[#ebdcb9] hover:border-[#c49a62]/55 rounded-xl px-4 py-6 text-center cursor-pointer transition flex flex-col items-center">
                    <span className="text-2xl mb-1">📸</span>
                    <span className="text-xs text-[#c49a62] font-bold">Chụp hình trực tiếp bằng Camera điện thoại</span>
                    <span className="text-[9px] text-slate-550 mt-1">Bắt buộc theo chuẩn audit của Vingroup</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="camera"
                      required
                      onChange={(e) => setImageFile(e.target.files[0] || null)}
                      className="hidden" 
                    />
                  </label>
                </div>
                {imageFile && (
                  <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center space-x-1.5">
                    <span>✓</span> <span>Đã chọn ảnh: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Nghiệp vụ hoàn thiện hôm nay</label>
                <textarea
                  required
                  rows="3"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Mô tả công việc đã hoàn thành (Ví dụ: Đã sơn lót trần thạch cao phòng ngủ chính...)"
                  className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReport}
                className="w-full bg-[#c49a62] hover:bg-[#b08752] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-center text-xs shadow-sm"
              >
                {submittingReport ? 'Đang tải lên...' : 'Gửi Báo cáo Bàn giao Tiến độ'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
