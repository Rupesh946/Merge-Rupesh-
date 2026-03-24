"use client";

import { useEffect, useState, useCallback } from 'react';

// Mock WebSocket hook since the custom server was removed
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  // Mock implementation that does nothing
  const on = useCallback((event: string, callback: (...args: any[]) => void) => { }, []);
  const off = useCallback((event: string, callback: (...args: any[]) => void) => { }, []);

  return { socket: null, isConnected, on, off };
};
