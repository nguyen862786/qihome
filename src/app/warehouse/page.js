'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WarehouseDashboard() {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanResult, setScanResult] = useState(null);
  
  // Warehouse transaction logs
  const [logs, setLogs] = useState([
    { id: '1', project: 'PRJ-HAUNGHIA-102', sku: 'AC-WD-402', qty: 15, unit: 'Mét tới', time: '10 phút trước' },
    { id: '2', project: 'PRJ-HAUNGHIA-102', sku: 'BL-DAMP-05', qty: 4, unit: 'Bộ', time: '2 giờ trước' },
    { id: '3', project: 'PRJ-HAUNGHIA-102', sku: 'DL-UX-18', qty: 6, unit: 'Thùng', time: '5 giờ trước' }
  ]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setScanResult(null);

    if (!tokenInput.trim()) {
      setError('Vui lòng nhập/dán mã Token QR để quét.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/materials/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        setScanResult(data.details);
        
        // Add log item
        const newLog = {
          id: Date.now().toString(),
          project: data.details.projectCode,
          sku: data.details.sku,
          qty: data.details.quantity,
          unit: data.details.sku === 'AC-WD-402' ? 'Mét tới' : data.details.sku === 'BL-DAMP-05' ? 'Bộ' : 'Thùng',
          time: 'Vừa xong'
        };
        setLogs(prev => [newLog, ...prev]);
        setTokenInput('');
      } else {
        setError('Lỗi xác thực: ' + data.error);
      }
    } catch (err) {
      setError('Không kết nối được API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full max-w-lg bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-sm">Qi</span>
          <span className="font-bold text-sm text-white">Quản Lý Kho Hậu Nghĩa (Just-In-Time)</span>
        </div>
        <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
          Storefront
        </Link>
      </div>

      <div className="w-full max-w-lg p-4 space-y-6">
        {/* Warehouse Status Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Trạm trung chuyển</div>
            <div className="text-sm font-bold text-white mt-1">Kho Vệ Tinh Vinhomes Hậu Nghĩa</div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded">
            Đang hoạt động
          </span>
        </div>

        {/* Scan Results Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl leading-relaxed animate-fadeIn">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl leading-relaxed animate-fadeIn">
            🎉 {success}
            {scanResult && (
              <div className="mt-2 pt-2 border-t border-emerald-500/15 text-[11px] text-slate-300 space-y-0.5">
                <div>- Dự án: <strong className="text-white">{scanResult.projectCode}</strong></div>
                <div>- Mã SKU: <strong className="text-white">{scanResult.sku}</strong></div>
                <div>- Số lượng: <strong className="text-white">{scanResult.quantity}</strong></div>
                <div>- Lúc: {new Date(scanResult.timestamp).toLocaleTimeString('vi-VN')}</div>
              </div>
            )}
          </div>
        )}

        {/* Mock QR Scanner */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quét Mã QR Nhận Hàng Của Thợ</h3>
          
          {/* Visual camera scan box simulation */}
          <div className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-center items-center">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>
            {/* Scan animation line */}
            <div className="w-4/5 h-0.5 bg-amber-500/40 absolute animate-[bounce_3s_infinite] shadow shadow-amber-500"></div>
            <span className="text-[10px] text-slate-500 select-none">Hệ thống Camera quét QR tự động...</span>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Nhập hoặc dán mã QR Token (JWT chuỗi)
              </label>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Dán chuỗi token mã QR nhận được từ thợ..."
                rows="2"
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-700 font-mono focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-center text-xs shadow-lg shadow-amber-500/10"
            >
              {loading ? 'Đang xác thực...' : 'Quét Xác nhận xuất kho'}
            </button>
          </form>
        </div>

        {/* Warehouse logs */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lịch sử xuất kho trong ngày</h3>
          <div className="divide-y divide-slate-900 space-y-3 max-h-52 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="pt-3 flex justify-between items-center text-xs first:pt-0">
                <div>
                  <div className="font-semibold text-slate-200">{log.project}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    SKU: <strong className="text-slate-400">{log.sku}</strong> | {log.qty} {log.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500">{log.time}</span>
                  <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Đã xuất</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
