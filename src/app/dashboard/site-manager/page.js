'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SiteManagerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  
  // App states
  const [selectedProject, setSelectedProject] = useState('PRJ-HAUNGHIA-103');
  const [qcStatus, setQcStatus] = useState('passed'); // 'passed' | 'failed'
  const [qcNotes, setQcNotes] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Digital Checklist checklist items state
  const [checklist, setChecklist] = useState({
    woodGap: false,
    woodSurface: false,
    woodFittings: false,
    paintSurface: false,
    paintAngles: false,
    electricOutlet: false,
    electricDevices: false
  });

  // Canvas Signature state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'site_manager' && user.role !== 'admin') {
      router.push('/');
      return;
    }
    setProfile(user);
    initCanvas();
  }, [router]);

  useEffect(() => {
    if (canvasRef.current) {
      initCanvas();
    }
  }, [canvasRef]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.fillStyle = '#0f172a'; // slate-900 background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Drawing operations
  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get mouse/touch coords relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    initCanvas();
  };

  // Checklist handler
  const handleCheckToggle = (key) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  // Submit QC
  const handleSubmitQC = (e) => {
    e.preventDefault();
    
    // Validate checklist completion for QC pass
    if (qcStatus === 'passed') {
      const allChecked = Object.values(checklist).every(v => v === true);
      if (!allChecked) {
        alert('⚠️ Để duyệt ĐẠT nghiệm thu, giám sát bắt buộc phải tích kiểm tra đầy đủ các tiêu chí kỹ thuật trong Checklist QC điện tử!');
        return;
      }
    }

    setSubmitting(true);

    // Simulate sending QC evaluation and signature data (to public.site_reports & public.projects tables)
    setTimeout(() => {
      setSuccess(`Đã ký nghiệm thu và cập nhật trạng thái dự án ${selectedProject} thành công! Kế toán đã được thông báo để lập lệnh chi.`);
      setQcNotes('');
      // Reset checklist
      setChecklist({
        woodGap: false,
        woodSurface: false,
        woodFittings: false,
        paintSurface: false,
        paintAngles: false,
        electricOutlet: false,
        electricDevices: false
      });
      clearSignature();
      setSubmitting(false);
    }, 1500);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Navbar Header */}
      <div className="w-full max-w-lg bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-sm">Qi</span>
          <span className="font-bold text-sm text-white">Giám Sát Công Trình (Site Manager)</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-slate-400 hover:text-white transition">
          Đóng
        </button>
      </div>

      <div className="w-full max-w-lg p-4 space-y-6">
        {/* User context card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Giám sát phụ trách</div>
            <div className="text-sm font-bold text-white mt-1">{profile.name}</div>
          </div>
          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded">
            Cụm Hậu Nghĩa
          </span>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl leading-relaxed">
            {success}
          </div>
        )}

        {/* Digital Checklist Form */}
        <form onSubmit={handleSubmitQC} className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cổng Nghiệm thu QA/QC</h3>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-amber-500 focus:outline-none"
            >
              <option value="PRJ-HAUNGHIA-101">PRJ-HAUNGHIA-101 (Mặt bằng)</option>
              <option value="PRJ-HAUNGHIA-102">PRJ-HAUNGHIA-102 (Đang SX)</option>
              <option value="PRJ-HAUNGHIA-103">PRJ-HAUNGHIA-103 (Đang QC)</option>
            </select>
          </div>

          {/* Checklist Area */}
          <div className="space-y-4">
            {/* Category 1: Woodwork */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-2">
                Hạng mục 1: Đồ gỗ liền tường (Tủ bếp, tủ quần áo, tivi)
              </div>
              <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={checklist.woodGap}
                    onChange={() => handleCheckToggle('woodGap')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Độ khít: Khe hở cánh tủ ≤ 1.5mm, không vênh lệch.</span>
                </label>
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={checklist.woodSurface}
                    onChange={() => handleCheckToggle('woodSurface')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Bề mặt: Phủ Melamine/Acrylic An Cường không trầy, dán nẹp khít.</span>
                </label>
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={checklist.woodFittings}
                    onChange={() => handleCheckToggle('woodFittings')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Phụ kiện: Bản lề, ray trượt giảm chấn Blum trơn tru, không ồn.</span>
                </label>
              </div>
            </div>

            {/* Category 2: Paint */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-2">
                Hạng mục 2: Phần sơn bả & Trần thạch cao
              </div>
              <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={checklist.paintSurface}
                    onChange={() => handleCheckToggle('paintSurface')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Bề mặt trần/tường: Đèn quét phẳng khít, sơn Dulux không loang màu.</span>
                </label>
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={checklist.paintAngles}
                    onChange={() => handleCheckToggle('paintAngles')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Góc cạnh: Góc tường, góc thạch cao vuông góc 90 độ, không sứt mẻ.</span>
                </label>
              </div>
            </div>

            {/* Category 3: Electric */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-2">
                Hạng mục 3: Hệ thống điện - Đèn chiếu sáng
              </div>
              <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={checklist.electricOutlet}
                    onChange={() => handleCheckToggle('electricOutlet')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Ổ cắm âm tường: Nguồn điện ổn định, đo kiểm đạt chuẩn an toàn.</span>
                </label>
                <label className="flex items-start space-x-2.5 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={checklist.electricDevices}
                    onChange={() => handleCheckToggle('electricDevices')}
                    className="mt-0.5 rounded accent-amber-500" 
                  />
                  <span>Thiết bị: Đèn led, chùm bật sáng đồng bộ theo phối cảnh AI.</span>
                </label>
              </div>
            </div>
          </div>

          {/* Assessment status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Kết luận Nghiệm thu</label>
              <select
                value={qcStatus}
                onChange={(e) => setQcStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="passed">🟢 ĐẠT (Passed)</option>
                <option value="failed">🔴 KHÔNG ĐẠT (Rework)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Ghi chú QC/Yêu cầu sửa lỗi</label>
              <input
                type="text"
                placeholder="Ghi chú chi tiết vị trí lỗi..."
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Handwritten Signature */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chữ ký tay điện tử của Giám sát</label>
              <button 
                type="button" 
                onClick={clearSignature}
                className="text-[9px] font-bold text-amber-500 hover:text-amber-400 uppercase"
              >
                Xóa ký lại
              </button>
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={450}
                height={120}
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={endDrawing}
                onTouchMove={draw}
                className="w-full bg-slate-900 cursor-crosshair touch-none"
              ></canvas>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
          >
            {submitting ? 'Đang gửi quyết định...' : '✓ Xác nhận & Đóng gói Biên Bản QC'}
          </button>
        </form>
      </div>
    </div>
  );
}
