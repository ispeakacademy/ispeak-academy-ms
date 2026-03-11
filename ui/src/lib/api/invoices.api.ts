import type { PaginatedResponse } from '@/types/clients';
import type { CreateInvoiceDto, Invoice, Payment, QueryInvoicesDto, RecordPaymentDto } from '@/types/invoices';
import apiClient from '.';

export const getInvoices = async (query?: QueryInvoicesDto): Promise<PaginatedResponse<Invoice>> => {
  const response = await apiClient.get('/invoices', { params: query });
  return response.data?.data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data.data;
};

export const createInvoice = async (data: CreateInvoiceDto): Promise<Invoice> => {
  const response = await apiClient.post('/invoices', data);
  return response.data.data;
};

export const updateInvoice = async (id: string, data: Partial<CreateInvoiceDto>): Promise<Invoice> => {
  const response = await apiClient.patch(`/invoices/${id}`, data);
  return response.data.data;
};

export const sendInvoice = async (id: string): Promise<Invoice> => {
  const response = await apiClient.post(`/invoices/${id}/send`);
  return response.data.data;
};

export const voidInvoice = async (id: string, reason: string): Promise<Invoice> => {
  const response = await apiClient.post(`/invoices/${id}/void`, { reason });
  return response.data.data;
};

export const recordPayment = async (invoiceId: string, data: RecordPaymentDto): Promise<Payment> => {
  const response = await apiClient.post(`/invoices/${invoiceId}/record-payment`, data);
  return response.data.data;
};

export const getInvoicePayments = async (invoiceId: string): Promise<{ payments: Payment[]; total: number }> => {
  const response = await apiClient.get(`/invoices/${invoiceId}/payments`);
  return response.data.data;
};

export const getEnrollmentInvoicedAmount = async (enrollmentId: string): Promise<{
  alreadyInvoiced: number;
  agreedAmount: number;
  remaining: number;
  agreedCurrency: string;
}> => {
  const response = await apiClient.get(`/invoices/enrollment/${enrollmentId}/invoiced-amount`);
  return response.data.data;
};

export const getOverdueInvoices = async (): Promise<{ invoices: Invoice[]; totalCount: number }> => {
  const response = await apiClient.get('/invoices/overdue');
  return response.data.data;
};

export const getPayment = async (id: string): Promise<Payment> => {
  const response = await apiClient.get(`/payments/${id}`);
  return response.data.data;
};

export const reversePayment = async (id: string): Promise<Payment> => {
  const response = await apiClient.post(`/payments/${id}/reverse`);
  return response.data.data;
};

const invoicesApi = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  sendInvoice,
  voidInvoice,
  recordPayment,
  getInvoicePayments,
  getEnrollmentInvoicedAmount,
  getOverdueInvoices,
  getPayment,
  reversePayment,
};

export default invoicesApi;
