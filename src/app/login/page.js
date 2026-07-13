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
  { id: 'a0000000-0000-0000-0000-000000000005', phone: '0900000005', name: 'Lê Thu Trang', role: 'sales', desc: 'Sales Affiliate Vinhomes' }
];

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Register state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regApartment, setRegApartment] = useState(''); // Vin apartment code

  // Check if already logged in and redirect
  useEffect(() => {
    const checkSession = async () => {
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

  // OTP flow handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setIsOtpSent(true);
      setLoading(false);
      setSuccess('Mã OTP xác thực (123456) đã được gửi tới số điện thoại của bạn!');
    }, 800);
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
      const matchedProfile = SANDBOX_PROFILES.find(p => p.phone === phoneNumber);
      
      if (matchedProfile) {
        // Load additional legal/KYC details from profile if present
        const savedProfile = localStorage.getItem('qihome_user_profile');
        const parsedSaved = savedProfile ? JSON.parse(savedProfile) : {};
        const merged = { ...matchedProfile, ...parsedSaved, role: matchedProfile.role };
        
        localStorage.setItem('qihome_user_profile', JSON.stringify(merged));
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          redirectUser(matchedProfile.role);
        }, 1000);
      } else {
        // Fallback or generic resident login
        const newCustomer = { 
          id: 'cust-' + Date.now(), 
          phone: phoneNumber, 
          name: 'Khách hàng Cư dân', 
          role: 'sales', 
          is_vinhomes_resident: true,
          apartment_code: 'S2.01-1205',
          credits: 15
        };
        localStorage.setItem('qihome_user_profile', JSON.stringify(newCustomer));
        setSuccess('Đăng nhập thành công với tài khoản Cư dân Vinhomes!');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (err) {
      setError('Đăng nhập thất bại: ' + err.message);
      setLoading(false);
    }
  };

  // User registration handler
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regPhone || regPhone.length < 9) {
      setError('Vui lòng nhập số điện thoại đăng ký hợp lệ');
      return;
    }
    if (!regName) {
      setError('Vui lòng nhập họ và tên');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Cư dân Vin has 15 credits, standard has 3
      const isVin = !!regApartment.trim();
      const newProfile = {
        id: 'cust-' + Date.now(),
        name: regName,
        phone: regPhone,
        role: 'sales', // customer role shares dashboard components
        is_vinhomes_resident: isVin,
        apartment_code: regApartment.trim(),
        credits: isVin ? 15 : 3,
        kyc_status: 'unverified',
        is_contract_signed: false
      };

      localStorage.setItem('qihome_user_profile', JSON.stringify(newProfile));
      setSuccess(`Đăng ký thành công! Nhận ${isVin ? '15' : '3'} Credit Render AI. Đang chuyển hướng...`);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 1000);
  };

  // Sandbox login bypass (Developer Mode)
  const handleSandboxLogin = (profile) => {
    setLoading(true);
    setError('');
    setSuccess(`Đăng nhập Sandbox: [${profile.name}] vai trò [${profile.role}]`);
    setTimeout(() => {
      // Merge with stored details to persist local updates
      const savedProfile = localStorage.getItem('qihome_user_profile');
      const parsedSaved = savedProfile ? JSON.parse(savedProfile) : {};
      const merged = { 
        ...profile, 
        ...parsedSaved, 
        role: profile.role,
        name: profile.name,
        phone: profile.phone
      };

      localStorage.setItem('qihome_user_profile', JSON.stringify(merged));
      redirectUser(profile.role);
    }, 1000);
  };

  return (
    <div className="flex-1 min-h-screen text-slate-100 flex flex-col justify-center items-center p-4 bg-[#faf8f5]">
      {/* Background patterns */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c49a62]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ebdcb9]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-[#ebdcb9] rounded-3xl p-8 shadow-2xl relative z-10 text-slate-800">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c49a62]/10 border border-[#ebdcb9] text-[#c49a62] font-bold text-3xl mb-3 tracking-wider">
            Qi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">QiHome.vn</h1>
          <p className="text-xs text-slate-500 mt-1">Cổng đăng nhập dịch vụ & AI Studio nội thất</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        {/* Tab selector */}
        <div className="flex bg-[#faf8f5] rounded-xl p-1 mb-6 border border-[#ebdcb9]">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setIsOtpSent(false); }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition ${
              !isRegisterMode ? 'bg-[#c49a62] text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition ${
              isRegisterMode ? 'bg-[#c49a62] text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Ký Thành Viên
          </button>
        </div>

        {/* Form rendering */}
        {isRegisterMode ? (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Lê Thu Trang"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Số điện thoại nhận OTP
              </label>
              <input
                type="tel"
                required
                placeholder="Ví dụ: 0901234567"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex justify-between">
                <span>Mã căn hộ Vinhomes (Nếu có)</span>
                <span className="text-emerald-600 font-extrabold normal-case">Nhận 15 lượt AI</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: S2.01-1205 (Để nhận đặc quyền)"
                value={regApartment}
                onChange={(e) => setRegApartment(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
              />
              <p className="text-[9px] text-slate-500 mt-1">
                * Khách hàng không điền mã căn hộ sẽ đăng ký dưới vai trò thành viên thường (Nhận 3 lượt AI).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 text-xs uppercase tracking-wider mt-2"
            >
              {loading ? 'Đang khởi tạo...' : 'Đăng Ký & Nhận Đặc Quyền'}
            </button>
          </form>
        ) : (
          /* LOGIN FORM */
          <>
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Số điện thoại đã đăng ký
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0901234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c49a62]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 text-xs"
                >
                  {loading ? 'Đang gửi...' : 'Nhận mã OTP xác thực'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Mã xác thực OTP gửi về SMS (Nhập: 123456)
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-4 py-3 text-center tracking-[1em] text-lg font-bold text-[#c49a62] placeholder-slate-300 focus:outline-none focus:border-[#c49a62]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c49a62] hover:bg-[#b08752] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 text-xs"
                >
                  {loading ? 'Đang đăng nhập...' : 'Xác nhận Đăng nhập'}
                </button>
              </form>
            )}
          </>
        )}

        {/* Sandbox Dev Panel */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sandbox Bypass (Mô phỏng Thợ/Kế toán)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {SANDBOX_PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSandboxLogin(p)}
                className="text-left bg-[#faf8f5] hover:bg-slate-100 border border-[#ebdcb9] hover:border-[#c49a62]/40 rounded-xl p-2.5 transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-800">{p.name}</span>
                <span className="text-[8px] font-semibold text-[#c49a62] uppercase tracking-wider mt-1">{p.role}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
