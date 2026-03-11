'use client';

import { useSettings } from '@/hooks/useSettings';
import { authApi } from '@/lib/api/auth.api';
import { userApi } from '@/lib/api/user.api';
import { getRedirectPath } from '@/lib/utils/permissions';
import { useUserStore } from '@/stores/user.store';
import { User } from '@/types/users';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, redirect?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: (redirect?: boolean) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const setUserLoading = useUserStore((state) => state.setLoading);
  const isLoadingUser = useUserStore((state) => state.isLoading);
  const clearUser = useUserStore((state) => state.clearUser);

  useSettings();

  const fetchUserData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
    if (!token) {
      clearUser();
      setLoading(false);
      return;
    }

    try {
      setUserLoading(true);
      const userData = await userApi.getCurrentUser();
      if (userData?.userId) {
        setUser(userData);
      } else {
        clearUser();
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
      }
    } catch {
      clearUser();
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    } finally {
      setUserLoading(false);
      setLoading(false);
    }
  }, [clearUser, setUser, setUserLoading]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = async (email: string, password: string, redirect = true) => {
    try {
      setLoading(true);
      const result = await authApi.login({ email, password });

      if (result.accessToken) {
        sessionStorage.setItem('access_token', result.accessToken);
        if (result.refreshToken) {
          sessionStorage.setItem('refresh_token', result.refreshToken);
        }
        await fetchUserData();

        if (redirect) {
          if (result.mustChangePassword) {
            router.push('/set-password');
          } else {
            const currentUser = useUserStore.getState().user;
            router.push(getRedirectPath(currentUser));
          }
        }

        return { success: true };
      }

      return { success: false, error: 'Login failed. No access token received.' };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid credentials or account not active.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (redirect = true) => {
    clearUser();
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    if (redirect) {
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading: loading || isLoadingUser,
    isAuthenticated: !!user,
    fetchUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
