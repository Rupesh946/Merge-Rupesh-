"use client";

import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Create a singleton socket instance
const socket: Socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
  autoConnect: false, // We will connect manually
});

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Manually connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Clean up the event listeners on component unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket?.on(event, callback);
    },
    [] // socket is now a stable singleton
  );

  const off = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket?.off(event, callback);
    },
    [] // socket is now a stable singleton
  );

  return { socket, isConnected, on, off };
};
