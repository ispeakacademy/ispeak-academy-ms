import type { Notification } from '@/types/notifications';
import type { PaginatedResponse } from '@/types/clients';
import apiClient from '.';

export const getNotifications = async (page = 1, limit = 20): Promise<PaginatedResponse<Notification>> => {
  const response = await apiClient.get('/notifications', { params: { page, limit } });
  return response.data?.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data?.data?.count ?? 0;
};

export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/read-all');
};

const notificationsApi = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationsApi;
