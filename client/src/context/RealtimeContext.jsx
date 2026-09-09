import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
};

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!user) {
      if (socketRef.current) socketRef.current.close();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When in dev mode with Vite proxy, or direct port 3001
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Trigger registered listeners
          const listeners = listenersRef.current.get(data.type) || [];
          listeners.forEach(cb => cb(data.payload));
        } catch (e) {
          console.warn('Realtime message parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn('WebSocket connection attempt error:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  // Subscribe to specific message types (e.g. 'NEW_MESSAGE', 'ATTENDANCE_EVENT', 'CALL_SIGNAL')
  const subscribe = (type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, []);
    }
    listenersRef.current.get(type).push(callback);

    return () => {
      const list = listenersRef.current.get(type) || [];
      listenersRef.current.set(type, list.filter(cb => cb !== callback));
    };
  };

  // Broadcast message
  const broadcast = (type, payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, subscribe, broadcast }}>
      {children}
    </RealtimeContext.Provider>
  );
};
