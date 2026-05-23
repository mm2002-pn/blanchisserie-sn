import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:4000';

/**
 * Hook React Native pour Socket.IO authentifié.
 * Reconnexion auto avec backoff. Déconnecte automatiquement au logout.
 *
 * Usage :
 *   const { socket, connected } = useRealtime();
 *   useEffect(() => {
 *     socket?.on('order:ready', (p) => refetchOrders());
 *     return () => socket?.off('order:ready');
 *   }, [socket]);
 */
export function useRealtime() {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(WS_URL, {
      path: '/realtime',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.warn('[realtime] connect_error', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return { socket: socketRef.current, connected };
}
