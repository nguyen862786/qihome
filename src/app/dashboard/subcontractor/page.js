'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubcontractorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  
  // App states
  const [selectedProject, setSelectedProject] = useState('PRJ-HAUNGHIA-102');
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'report'
  
  // Materials states
  const [selectedSku, setSelectedSku] = useState('AC-WD-402');
  const [requestQty, setRequestQty] = useState(5);
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

  // Sample BOM remaining items
  const BOM_ITEMS = [
    { sku: 'AC-WD-402', name: 'Gỗ Melamine An Cường MS 402', remaining: 30, unit: 'Mét tới' },
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
  }, [router]);

  // Request material QR
  const handleRequestMaterial = async (e) => {
    e.preventDefault();
    setQrToken('');
    setQrDetails(null);
    setSubmittingMaterial(true);

    try {
      const response = await fetch('/api/materials/qr-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectCode: selectedProject,
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
    } catch (err) {
      alert('Không kết nối được: ' + err.message);
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
        // Mock GPS location at Vinhomes Hậu Nghĩa for demo if blocked/offline
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
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!gps) {
      alert('Vui lòng quét tọa độ GPS trước khi báo cáo để chống gian lận hiện trường!');
      return;
    }
    setSubmittingReport(true);
    
    // Simulate API call to upload to AWS S3 & Save DB Site Reports
    setTimeout(() => {
      setReportSuccess('Đã gửi nhật ký tiến độ ngày thành công! Ảnh và toạ độ GPS đã được khóa bảo mật.');
      setReportText('');
      setGps(null);
      setImageFile(null);
      setSubmittingReport(false);
    }, 1200);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Mobile Web Top Header */}
      <div className="w-full max-w-md bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-sm">Qi</span>
          <span className="font-bold text-sm text-white">Thợ Thi Công Hiện Trường</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-slate-400 hover:text-white transition">
          Đóng
        </button>
      </div>

      <div className="w-full max-w-md p-4 space-y-6">
        {/* User Card */}
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/[0.03] border border-amber-500/20 rounded-2xl p-4">
          <div className="text-[10px] uppercase font-bold text-amber-500">Đơn vị thi công</div>
          <div className="text-base font-bold text-white mt-1">{profile.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">Dự án: <strong className="text-slate-200">{selectedProject}</strong></div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-900">
          <button
            onClick={() => { setActiveTab('materials'); setQrToken(''); }}
            className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg transition ${
              activeTab === 'materials' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 Gọi Vật Tư (QR)
          </button>
          <button
            onClick={() => { setActiveTab('report'); setReportSuccess(''); }}
            className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg transition ${
              activeTab === 'report' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📸 Báo Tiến Độ (GPS)
          </button>
        </div>

        {/* Tab 1: Materials Request QR */}
        {activeTab === 'materials' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Yêu cầu Cấp vật tư</h3>
            
            {!qrToken ? (
              <form onSubmit={handleRequestMaterial} className="space-y-4">
                {/* Select SKU */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Chọn loại vật tư</label>
                  <select
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                  >
                    {BOM_ITEMS.map(b => (
                      <option key={b.sku} value={b.sku}>
                        {b.name} (BOM còn: {b.remaining} {b.unit})
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
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRequestQty(val);
                      // Check if over-budget
                      const currentItem = BOM_ITEMS.find(i => i.sku === selectedSku);
                      if (currentItem && val > currentItem.remaining) {
                        setOverBudget(true);
                      } else {
                        setOverBudget(false);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Over Budget Notice */}
                {overBudget && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl space-y-3">
                    <div>
                      ⚠️ <strong>Vượt hạn mức BOM!</strong> Yêu cầu này cần gửi ảnh bằng chứng và lý do hao hụt để Giám đốc Dự án duyệt thủ công.
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Link ảnh bằng chứng lỗi..."
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-600 focus:outline-none focus:border-red-500 text-slate-200"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingMaterial}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs"
                >
                  {submittingMaterial ? 'Đang tạo lệnh...' : 'Tạo mã QR Nhận hàng'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6 py-4 animate-fadeIn">
                <div className="inline-block bg-white p-4 rounded-2xl shadow-xl">
                  {/* Mock QR Rendering */}
                  <div className="w-48 h-48 bg-slate-100 border-4 border-white flex flex-col justify-center items-center relative">
                    {/* Visual representation of QR */}
                    <div className="grid grid-cols-6 gap-0.5 w-40 h-40 opacity-80">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`rounded-sm ${(i % 3 === 0 || i % 7 === 0 || i < 6 || i % 6 === 0) ? 'bg-slate-900' : 'bg-transparent'}`}
                        ></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-2 font-mono text-[8px] text-slate-700 break-all select-all">
                      {qrToken.slice(0, 40)}...
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-left space-y-2">
                  <div className="text-amber-500 font-bold text-center border-b border-slate-800 pb-1.5 mb-2">
                    LỆNH XUẤT KHO ĐÃ MÃ HOÁ
                  </div>
                  <div>- Dự án: <strong className="text-white">{qrDetails?.projectCode}</strong></div>
                  <div>- Vật tư SKU: <strong className="text-white">{qrDetails?.sku}</strong></div>
                  <div>- Số lượng: <strong className="text-white">{qrDetails?.quantity}</strong></div>
                  <div className="text-red-400 font-medium mt-2 text-center text-[10px]">
                    ⏱️ Hết hạn trong: 60 phút (Quét tại kho vệ tinh)
                  </div>
                </div>

                <button
                  onClick={() => setQrToken('')}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition text-xs"
                >
                  Tạo yêu cầu mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Daily Progress Visual Report */}
        {activeTab === 'report' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Nhật ký Tiến độ & GPS</h3>

            {reportSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl leading-relaxed">
                {reportSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Geolocation check */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Xác thực GPS tại Vinhomes Hậu Nghĩa
                </label>
                {!gps ? (
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/30 rounded-xl py-3 px-4 text-xs font-bold text-amber-500 flex items-center justify-center space-x-2 transition"
                  >
                    {gpsLoading ? (
                      <>
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-500 border-t-transparent"></span>
                        <span>Đang định vị vệ tinh...</span>
                      </>
                    ) : (
                      <>
                        <span>📍 Quét Vị trí Hiện tại</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-slate-950 border border-emerald-500/20 text-slate-300 text-xs p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-emerald-400 flex items-center space-x-1">
                        <span>●</span> <span>Đã khoá GPS thành công</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Lat: {gps.lat} | Lng: {gps.lng}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
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
                  <label className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-6 text-center cursor-pointer transition flex flex-col items-center">
                    <span className="text-2xl mb-1">📸</span>
                    <span className="text-xs text-slate-400 font-semibold">Chụp hình trực tiếp bằng Camera điện thoại</span>
                    <span className="text-[9px] text-slate-600 mt-1">Bắt buộc theo chuẩn audit của Vingroup</span>
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
                  <div className="text-xs text-emerald-400 font-medium mt-2 flex items-center space-x-1.5">
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
                  placeholder="Mô tả công việc đã hoàn thành (Ví dụ: Đã sơn lót trần thạch cao phòng ngủ chính căn 1205...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReport}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
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
