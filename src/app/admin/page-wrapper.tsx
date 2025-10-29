'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPageWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check for auth cookie on mount
    const hasAuthCookie = document.cookie.includes('admin-auth=');
    
    if (!hasAuthCookie) {
      router.replace('/admin/login');
    }
  }, [router]);

  // Don't render anything if not authenticated
  const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('admin-auth=');
  
  if (!hasAuthCookie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

