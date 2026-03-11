'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { ASSIGNMENTS_QUERY_KEYS } from './useAssignments';
import { NOTIFICATIONS_QUERY_KEYS } from './useNotifications';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    // Derive WebSocket URL from API base URL
    const wsUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/^http/, 'ws');

    const socket = io(wsUrl || window.location.origin, {
      path: '/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('notification', (data: { title: string; message: string; type?: string }) => {
      // Invalidate notification queries so the bell updates
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });

      // Invalidate assignment queries when assignment-related notifications arrive
      if (data.type?.startsWith('assignment_')) {
        queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEYS.all });
      }

      // Show a toast for the new notification
      toast.info(data.title || data.message, { autoClose: 8000 });
    });

    socket.on('connect_error', () => {
      // Silent reconnection — no toast spam
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef;
}
