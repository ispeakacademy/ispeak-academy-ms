import { parseError } from '@/lib/api/parseError';
import * as notificationsApi from '@/lib/api/notifications.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const NOTIFICATIONS_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (page?: number, limit?: number) => [...NOTIFICATIONS_QUERY_KEYS.all, 'list', page, limit] as const,
  unreadCount: () => [...NOTIFICATIONS_QUERY_KEYS.all, 'unread-count'] as const,
};

export const useNotifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.list(page, limit),
    queryFn: () => notificationsApi.getNotifications(page, limit),
    staleTime: 60 * 1000,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount(),
    queryFn: notificationsApi.getUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to mark notification as read'));
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to mark all as read'));
    },
  });
};
