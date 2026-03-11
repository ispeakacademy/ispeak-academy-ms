import { parseError } from '@/lib/api/parseError';
import * as portalApi from '@/lib/api/portal.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const PORTAL_QUERY_KEYS = {
  all: ['portal'] as const,
  enrollments: () => [...PORTAL_QUERY_KEYS.all, 'enrollments'] as const,
  enrollment: (id: string) => [...PORTAL_QUERY_KEYS.all, 'enrollment', id] as const,
  enrollmentProgress: (id: string) => [...PORTAL_QUERY_KEYS.all, 'enrollment-progress', id] as const,
  invoices: () => [...PORTAL_QUERY_KEYS.all, 'invoices'] as const,
  invoice: (id: string) => [...PORTAL_QUERY_KEYS.all, 'invoice', id] as const,
  invoicePayments: (id: string) => [...PORTAL_QUERY_KEYS.all, 'invoice-payments', id] as const,
  sessions: () => [...PORTAL_QUERY_KEYS.all, 'sessions'] as const,
  certificates: () => [...PORTAL_QUERY_KEYS.all, 'certificates'] as const,
  referrals: () => [...PORTAL_QUERY_KEYS.all, 'referrals'] as const,
  profile: () => [...PORTAL_QUERY_KEYS.all, 'profile'] as const,
};

// ---- Enrollments ----
export const useMyEnrollments = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...PORTAL_QUERY_KEYS.enrollments(), page, limit],
    queryFn: () => portalApi.getMyEnrollments(page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyEnrollment = (id: string) => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.enrollment(id),
    queryFn: () => portalApi.getMyEnrollment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyEnrollmentProgress = (id: string, enabled = true) => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.enrollmentProgress(id),
    queryFn: () => portalApi.getMyEnrollmentProgress(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// ---- Invoices ----
export const useMyInvoices = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...PORTAL_QUERY_KEYS.invoices(), page, limit],
    queryFn: () => portalApi.getMyInvoices(page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyInvoice = (id: string) => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.invoice(id),
    queryFn: () => portalApi.getMyInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyInvoicePayments = (invoiceId: string, enabled = true) => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.invoicePayments(invoiceId),
    queryFn: () => portalApi.getMyInvoicePayments(invoiceId),
    enabled: !!invoiceId && enabled,
    staleTime: 60 * 1000,
  });
};

// ---- Sessions ----
export const useMySessions = () => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.sessions(),
    queryFn: portalApi.getMySessions,
    staleTime: 2 * 60 * 1000,
  });
};

// ---- Certificates ----
export const useMyCertificates = () => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.certificates(),
    queryFn: portalApi.getMyCertificates,
    staleTime: 10 * 60 * 1000,
  });
};

// ---- Referrals ----
export const useMyReferrals = () => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.referrals(),
    queryFn: portalApi.getMyReferrals,
    staleTime: 5 * 60 * 1000,
  });
};

// ---- M-Pesa Payment ----
export const useInitiateMpesaPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, phoneNumber, amount }: { invoiceId: string; phoneNumber: string; amount: number }) =>
      portalApi.initiateMpesaPayment(invoiceId, phoneNumber, amount),
    onSuccess: () => {
      toast.success('M-Pesa payment request sent. Check your phone to complete the payment.');
      queryClient.invalidateQueries({ queryKey: PORTAL_QUERY_KEYS.invoices() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to initiate M-Pesa payment'));
    },
  });
};

// ---- Profile ----
export const useMyProfile = () => {
  return useQuery({
    queryKey: PORTAL_QUERY_KEYS.profile(),
    queryFn: portalApi.getMyProfile,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      portalApi.updateMyProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: PORTAL_QUERY_KEYS.profile() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update profile'));
    },
  });
};

export const useChangeMyPassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      portalApi.changeMyPassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to change password'));
    },
  });
};
