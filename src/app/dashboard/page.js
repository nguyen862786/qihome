'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPortal() {
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch user profile from local storage
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(stored);
      // 2. Redirect to their specific dashboard based on role
      switch (user.role) {
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
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 text-xs">
      <div className="flex flex-col items-center space-y-4">
        <span className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></span>
        <p className="tracking-wide">Đang định tuyến Cổng Dashboard...</p>
      </div>
    </div>
  );
}
