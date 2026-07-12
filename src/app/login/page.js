'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Mock profiles from seed.sql for sandbox login
const SANDBOX_PROFILES = [
  { id: 'a0000000-0000-0000-0000-000000000001', phone: '0900000001', name: 'Nguyễn Duy Quang', role: 'admin', desc: 'Chủ tịch / Giám đốc tối cao' },
  { id: 'a0000000-0000-0000-0000-000000000002', phone: '0900000002', name: 'Lê Kế Toán', role: 'accounting', desc: 'Đối soát tài chính & công nợ' },
  { id: 'a0000000-0000-0000-0000-000000000003', phone: '0900000003', name: 'Trần Văn Giám Sát', role: 'site_manager', desc: 'Giám sát hiện trường Hậu Nghĩa' },
  { id: 'a0000000-0000-0000-0000-000000000004', phone: '0900000004', name: 'Thầu Phụ Hùng Vương', role: 'subcontractor', desc: 'Đội thi công đồ gỗ & hoàn thiện' },
  { id: 'a0000000-0000-0000-0000-000000000005', phone: '0900000005', name: 'Phạm Hoàng Nam', role: 'sales', desc: 'Sales Affiliate Vinhomes' }
];

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if already logged in and redirect
  useEffect(() => {
    const checkSession = async () => {
      // Local check or Supabase session check
      const localProfile = localStorage.getItem('qihome_user_profile');
      if (localProfile) {
        const user = JSON.parse(localProfile);
        redirectUser(user.role);
      }
    };
    checkSession();
  }, []);

  const redirectUser = (role) => {
    switch (role) {
      case 'admin':
        router.push('/dashboard/admin');
        break;
      case 'accounting':
        router.push('/dashboard/accounting');
        break;
      case 'site_manager':
        router.push('/dashboard/site-manager');
        break;
      case 'subcontractor':
        router.push('/dashboard/subcontractor');
        break;
      case 'sales':
        router.push('/dashboard/sales');
        break;
      default:
        router.push('/');
    }
  };

  // Real OTP flow handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }

    setLoading(true);
    try {
      // In production, we'd use Supabase OTP auth:
      // const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      // For MVP Demo, we simulate the OTP sending
      setTimeout(() => {
        setIsOtpSent(true);
        setLoading(false);
        setSuccess('Mã OTP giả lập (123456) đã được gửi tới số điện thoại!');
      }, 800);
    } catch (err) {
      setError('Gửi mã OTP thất bại: ' + err.message);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (otpCode !== '123456') {
      setError('Mã OTP không chính xác. Thử lại với mã: 123456');
      return;
    }

    setLoading(true);
    try {
      // In production:
      // const { data, error } = await supabase.auth.verifyOtp({ phone: phoneNumber, token: otpCode, type: 'sms' });
      // For MVP, we look up the phone in our pre-seeded profiles:
      const matchedProfile = SANDBOX_PROFILES.find(p => p.phone === phoneNumber);
      
      if (matchedProfile) {
        localStorage.setItem('qihome_user_profile', JSON.stringify(matchedProfile));
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          redirectUser(matchedProfile.role);
        }, 1000);
      } else {
        // Create a default customer/sales role if not matched
        const newCustomer = { id: 'cust-' + Date.now(), phone: phoneNumber, name: 'Khách hàng mới', role: 'sales' };
        localStorage.setItem('qihome_user_profile', JSON.stringify(newCustomer));
        setSuccess('Đăng nhập thành công với tài khoản mới!');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (err) {
      setError('Đăng nhập thất bại: ' + err.message);
      setLoading(false);
    }
  };

  // Sandbox login bypass (Developer Mode)
  const handleSandboxLogin = (profile) => {
    setLoading(true);
    setError('');
    setSuccess(`Đăng nhập Sandbox: [${profile.name}] vai trò [${profile.role}]`);
    setTimeout(() => {
      localStorage.setItem('qihome_user_profile', JSON.stringify(profile));
      redirectUser(profile.role);
    }, 1000);
  };

  return (
    <div className="flex-1 min-h-screen text-slate-100 flex flex-col justify-center items-center p-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-3xl mb-3 tracking-wider">
            Qi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">QiHome.vn</h1>
          <p className="text-sm text-slate-400 mt-1">Hệ thống Quản lý Vận hành & Bán hàng Nội thất</p>
        </div>

        {/* Messaging */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Real SMS OTP Form */}
        {!isOtpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Số điện thoại Đăng nhập
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Ví dụ: 0901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Nhận mã xác thực OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Nhập mã xác thực OTP (Nhập: 123456)
              </label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-center tracking-[1em] text-lg font-bold text-amber-500 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Xác nhận Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => setIsOtpSent(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1"
            >
              Quay lại nhập số điện thoại
            </button>
          </form>
        )}

        {/* Sandbox Developer Panel */}
        <div className="mt-8 pt-8 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500/80">
              Sandbox Login (Bỏ qua OTP thợ/Kế toán)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
              Dành cho Demo
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {SANDBOX_PROFILES.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSandboxLogin(profile)}
                disabled={loading}
                className="w-full text-left bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800/60 hover:border-amber-500/30 rounded-xl p-3 flex items-center justify-between group transition"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition">
                    {profile.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{profile.desc}</div>
                </div>
                <div className="text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-amber-500 group-hover:border-amber-500/20 transition">
                  {profile.role}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
