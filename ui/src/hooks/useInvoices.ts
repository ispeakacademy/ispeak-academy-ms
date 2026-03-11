import { parseError } from '@/lib/api/parseError';
import * as invoicesApi from '@/lib/api/invoices.api';
import type { CreateInvoiceDto, QueryInvoicesDto, RecordPaymentDto } from '@/types/invoices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ENROLLMENTS_QUERY_KEYS } from './useEnrollments';

export const INVOICES_QUERY_KEYS = {
  all: ['invoices'] as const,
  lists: () => [...INVOICES_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryInvoicesDto) => [...INVOICES_QUERY_KEYS.lists(), query] as const,
  details: () => [...INVOICES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVOICES_QUERY_KEYS.details(), id] as const,
  payments: (invoiceId: string) => [...INVOICES_QUERY_KEYS.all, 'payments', invoiceId] as const,
  overdue: () => [...INVOICES_QUERY_KEYS.all, 'overdue'] as const,
  enrollmentInvoiced: (enrollmentId: string) => [...INVOICES_QUERY_KEYS.all, 'enrollmentInvoiced', enrollmentId] as const,
};

export const useInvoices = (query?: QueryInvoicesDto) => {
  return useQuery({
    queryKey: INVOICES_QUERY_KEYS.list(query),
    queryFn: () => invoicesApi.getInvoices(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: INVOICES_QUERY_KEYS.detail(id),
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInvoicePayments = (invoiceId: string, enabled = true) => {
  return useQuery({
    queryKey: INVOICES_QUERY_KEYS.payments(invoiceId),
    queryFn: () => invoicesApi.getInvoicePayments(invoiceId),
    enabled: !!invoiceId && enabled,
    staleTime: 60 * 1000,
  });
};

export const useOverdueInvoices = () => {
  return useQuery({
    queryKey: INVOICES_QUERY_KEYS.overdue(),
    queryFn: invoicesApi.getOverdueInvoices,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEnrollmentInvoicedAmount = (enrollmentId?: string) => {
  return useQuery({
    queryKey: INVOICES_QUERY_KEYS.enrollmentInvoiced(enrollmentId || ''),
    queryFn: () => invoicesApi.getEnrollmentInvoicedAmount(enrollmentId!),
    enabled: !!enrollmentId,
    staleTime: 30 * 1000,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoicesApi.createInvoice(data),
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create invoice'));
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.sendInvoice(id),
    onSuccess: (_data, id) => {
      toast.success('Invoice sent successfully');
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to send invoice'));
    },
  });
};

export const useVoidInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => invoicesApi.voidInvoice(id, reason),
    onSuccess: () => {
      toast.success('Invoice voided');
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to void invoice'));
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInvoiceDto> }) =>
      invoicesApi.updateInvoice(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Invoice updated successfully');
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update invoice'));
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: RecordPaymentDto }) =>
      invoicesApi.recordPayment(invoiceId, data),
    onSuccess: (_data, variables) => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.payments(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to record payment'));
    },
  });
};
