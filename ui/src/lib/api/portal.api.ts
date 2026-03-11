import type { PaginatedResponse } from '@/types/clients';
import type { Enrollment, EnrollmentProgress } from '@/types/enrollments';
import type { Invoice, Payment } from '@/types/invoices';
import type { Session } from '@/types/cohorts';
import apiClient from '.';

// Portal uses existing API endpoints filtered by the current user's context.
// The backend identifies the client via the JWT token.

// ---- Enrollments (own) ----
export const getMyEnrollments = async (page = 1, limit = 20): Promise<PaginatedResponse<Enrollment>> => {
  const response = await apiClient.get('/enrollments', { params: { page, limit, own: true } });
  return response.data?.data;
};

export const getMyEnrollment = async (id: string): Promise<Enrollment> => {
  const response = await apiClient.get(`/enrollments/${id}`);
  return response.data.data;
};

export const getMyEnrollmentProgress = async (id: string): Promise<EnrollmentProgress> => {
  const response = await apiClient.get(`/enrollments/${id}/progress`);
  return response.data.data;
};

// ---- Invoices (own) ----
export const getMyInvoices = async (page = 1, limit = 20): Promise<PaginatedResponse<Invoice>> => {
  const response = await apiClient.get('/invoices', { params: { page, limit, own: true } });
  return response.data?.data;
};

export const getMyInvoice = async (id: string): Promise<Invoice> => {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data.data;
};

export const getMyInvoicePayments = async (invoiceId: string): Promise<{ payments: Payment[]; total: number }> => {
  const response = await apiClient.get(`/invoices/${invoiceId}/payments`);
  return response.data.data;
};

// ---- Sessions (upcoming from enrolled cohorts) ----
export const getMySessions = async (): Promise<Session[]> => {
  const response = await apiClient.get('/sessions', { params: { own: true } });
  return response.data?.data || [];
};

// ---- M-Pesa Payment ----
export const initiateMpesaPayment = async (invoiceId: string, phoneNumber: string, amount: number): Promise<{
  checkoutRequestId: string;
  merchantRequestId: string;
  responseDescription: string;
  customerMessage: string;
}> => {
  const response = await apiClient.post('/mpesa/stk-push', {
    invoiceId,
    phoneNumber,
    amount,
  });
  return response.data.data;
};

// ---- Certificates ----
export const getMyCertificates = async (): Promise<Enrollment[]> => {
  // Certificates are enrollment records with certificateUrl set
  const response = await apiClient.get('/enrollments', {
    params: { own: true, status: 'completed', limit: 100 },
  });
  const result = response.data?.data;
  return Array.isArray(result) ? result : result?.data || [];
};

// ---- Referrals ----
export const getMyReferrals = async (): Promise<any[]> => {
  // Uses the client's referral data
  const response = await apiClient.get('/clients/my-referrals');
  return response.data?.data || [];
};

// ---- Profile ----
export const getMyProfile = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data?.data;
};

export const updateMyProfile = async (data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) => {
  const response = await apiClient.patch('/users/profile', data);
  return response.data.data;
};

export const changeMyPassword = async (currentPassword: string, newPassword: string) => {
  const response = await apiClient.post('/users/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data?.data;
};

const portalApi = {
  getMyEnrollments,
  getMyEnrollment,
  getMyEnrollmentProgress,
  getMyInvoices,
  getMyInvoice,
  getMyInvoicePayments,
  getMySessions,
  initiateMpesaPayment,
  getMyCertificates,
  getMyReferrals,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};

export default portalApi;
