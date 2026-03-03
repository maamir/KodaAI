import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

interface RealTimeUpdateOptions {
  enabled?: boolean;
  dashboardId?: string;
  featureIds?: string[];
}

export function useRealTimeUpdates(options: RealTimeUpdateOptions = {}) {
  const { enabled = true, dashboardId, featureIds } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);

      if (dashboardId) {
        socket.emit('subscribe_dashboard', { dashboardId });
      }

      if (featureIds && featureIds.length > 0) {
        featureIds.forEach((featureId) => {
          socket.emit('subscribe_feature', { featureId });
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('metrics:updated', (data: { featureId: string; metrics: any[] }) => {
      queryClient.invalidateQueries({ queryKey: ['metrics', 'feature', data.featureId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('report:ready', (data: { reportId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'status', data.reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
    });

    socket.on('report:failed', (data: { reportId: string; error: string }) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'status', data.reportId] });
    });

    socket.on('dashboard:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      if (dashboardId) {
        socket.emit('unsubscribe_dashboard', { dashboardId });
      }

      if (featureIds && featureIds.length > 0) {
        featureIds.forEach((featureId) => {
          socket.emit('unsubscribe_feature', { featureId });
        });
      }

      socket.disconnect();
    };
  }, [enabled, dashboardId, featureIds, queryClient]);

  return {
    isConnected,
    error,
    socket: socketRef.current,
  };
}
