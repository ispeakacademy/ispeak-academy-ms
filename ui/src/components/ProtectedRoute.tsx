'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!loading && isAuthenticated && user) {
      // Force password change before accessing any protected route
      if (user.mustChangePassword && pathname !== '/set-password') {
        router.push('/set-password');
        return;
      }

      if (allowedRoles?.length) {
        const userRoleName = user.userRole?.name;
        if (userRoleName && !allowedRoles.includes(userRoleName)) {
          router.push('/login');
        }
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router, pathname]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
