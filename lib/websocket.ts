"use client";

import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    setSocket(socketIo);

    socketIo.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    return () => {
      socketIo.disconnect();
    };
  }, []);

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket?.on(event, callback);
    },
    [socket]
  );

  const off = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket?.off(event, callback);
    },
    [socket]
  );

  return { socket, isConnected, on, off };
};
