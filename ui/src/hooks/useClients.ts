import { parseError } from '@/lib/api/parseError';
import * as clientsApi from '@/lib/api/clients.api';
import type { CreateClientDto, CreateInteractionDto, QueryClientsDto, UpdateClientDto } from '@/types/clients';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const CLIENTS_QUERY_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENTS_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryClientsDto) => [...CLIENTS_QUERY_KEYS.lists(), query] as const,
  details: () => [...CLIENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLIENTS_QUERY_KEYS.details(), id] as const,
  timeline: (id: string) => [...CLIENTS_QUERY_KEYS.all, 'timeline', id] as const,
  interactions: (id: string) => [...CLIENTS_QUERY_KEYS.all, 'interactions', id] as const,
  enrollments: (id: string) => [...CLIENTS_QUERY_KEYS.all, 'enrollments', id] as const,
  invoices: (id: string) => [...CLIENTS_QUERY_KEYS.all, 'invoices', id] as const,
  referrals: (id: string) => [...CLIENTS_QUERY_KEYS.all, 'referrals', id] as const,
  search: (q: string) => [...CLIENTS_QUERY_KEYS.all, 'search', q] as const,
};

export const useClients = (query?: QueryClientsDto) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.list(query),
    queryFn: () => clientsApi.getClients(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.detail(id),
    queryFn: () => clientsApi.getClient(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useClientSearch = (q: string) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.search(q),
    queryFn: () => clientsApi.searchClients(q),
    enabled: q.length >= 2,
    staleTime: 30 * 1000,
  });
};

export const useClientTimeline = (id: string, enabled = true) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.timeline(id),
    queryFn: () => clientsApi.getClientTimeline(id),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
};

export const useClientInteractions = (id: string, enabled = true) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.interactions(id),
    queryFn: () => clientsApi.getClientInteractions(id),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
};

export const useClientEnrollments = (id: string, enabled = true) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.enrollments(id),
    queryFn: () => clientsApi.getClientEnrollments(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useClientInvoices = (id: string, enabled = true) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.invoices(id),
    queryFn: () => clientsApi.getClientInvoices(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useClientReferrals = (id: string, enabled = true) => {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEYS.referrals(id),
    queryFn: () => clientsApi.getClientReferrals(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsApi.createClient(data),
    onSuccess: () => {
      toast.success('Client created successfully');
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create client'));
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) => clientsApi.updateClient(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Client updated successfully');
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update client'));
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(id),
    onSuccess: () => {
      toast.success('Client deleted successfully');
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to delete client'));
    },
  });
};

export const useAddInteraction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CreateInteractionDto }) =>
      clientsApi.addInteraction(clientId, data),
    onSuccess: (_data, variables) => {
      toast.success('Interaction logged successfully');
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.interactions(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.timeline(variables.clientId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to log interaction'));
    },
  });
};

export const useAssignClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, employeeId }: { clientId: string; employeeId: string }) =>
      clientsApi.assignClient(clientId, employeeId),
    onSuccess: (_data, variables) => {
      toast.success('Client assigned successfully');
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.detail(variables.clientId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to assign client'));
    },
  });
};

export const useConvertToProspect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => clientsApi.convertToProspect(clientId),
    onSuccess: (_data, clientId) => {
      toast.success('Client converted to prospect');
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.detail(clientId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to convert client'));
    },
  });
};

export const useSendPortalInvite = () => {
  return useMutation({
    mutationFn: (clientId: string) => clientsApi.sendPortalInvite(clientId),
    onSuccess: () => {
      toast.success('Portal invite sent successfully');
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to send portal invite'));
    },
  });
};
