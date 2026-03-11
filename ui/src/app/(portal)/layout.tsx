'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UserSidebar from '@/components/layout/user-sidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="flex h-screen bg-gray-50">
        <UserSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
