import { parseError } from '@/lib/api/parseError';
import * as communicationsApi from '@/lib/api/communications.api';
import type { CreateTemplateDto, PreviewAudienceDto, QueryCommunicationsDto, SendBulkMessageDto, SendMessageDto, UpdateTemplateDto } from '@/types/communications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const COMMS_QUERY_KEYS = {
  all: ['communications'] as const,
  lists: () => [...COMMS_QUERY_KEYS.all, 'list'] as const,
  list: (query?: QueryCommunicationsDto) => [...COMMS_QUERY_KEYS.lists(), query] as const,
  inbox: () => [...COMMS_QUERY_KEYS.all, 'inbox'] as const,
  templates: () => [...COMMS_QUERY_KEYS.all, 'templates'] as const,
};

export const useCommunications = (query?: QueryCommunicationsDto) => {
  return useQuery({
    queryKey: COMMS_QUERY_KEYS.list(query),
    queryFn: () => communicationsApi.getCommunications(query),
    staleTime: 60 * 1000,
  });
};

export const useInbox = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...COMMS_QUERY_KEYS.inbox(), page, limit],
    queryFn: () => communicationsApi.getInbox(page, limit),
    staleTime: 30 * 1000,
  });
};

export const useTemplates = () => {
  return useQuery({
    queryKey: COMMS_QUERY_KEYS.templates(),
    queryFn: communicationsApi.getTemplates,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageDto) => communicationsApi.sendMessage(data),
    onSuccess: () => {
      toast.success('Message sent successfully');
      queryClient.invalidateQueries({ queryKey: COMMS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to send message'));
    },
  });
};

export const useReplyToMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => communicationsApi.replyToMessage(id, body),
    onSuccess: () => {
      toast.success('Reply sent');
      queryClient.invalidateQueries({ queryKey: COMMS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to send reply'));
    },
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateDto) => communicationsApi.createTemplate(data),
    onSuccess: () => {
      toast.success('Template created successfully');
      queryClient.invalidateQueries({ queryKey: COMMS_QUERY_KEYS.templates() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to create template'));
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) => communicationsApi.updateTemplate(id, data),
    onSuccess: () => {
      toast.success('Template updated successfully');
      queryClient.invalidateQueries({ queryKey: COMMS_QUERY_KEYS.templates() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update template'));
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationsApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: COMMS_QUERY_KEYS.templates() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to delete template'));
    },
  });
};

export const useSendBulkMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendBulkMessageDto) => communicationsApi.sendBulkMessage(data),
    onSuccess: (result) => {
      toast.success(`Sent to ${result.sentCount} recipient(s)${result.failedCount > 0 ? `, ${result.failedCount} failed` : ''}`);
      queryClient.invalidateQueries({ queryKey: COMMS_QUERY_KEYS.lists() });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to send bulk message'));
    },
  });
};

export const usePreviewAudience = () => {
  return useMutation({
    mutationFn: (data: PreviewAudienceDto) => communicationsApi.previewAudience(data),
    onError: (error) => {
      toast.error(parseError(error, 'Failed to preview audience'));
    },
  });
};
