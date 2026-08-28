import { useState, useEffect, useRef, useCallback } from 'react';

function getWebSocketBaseUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In local development fallback to localhost:8000 if frontend is running on 5173
    if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
      return `${protocol}//localhost:8000`;
    }
    return `${protocol}//${host}`;
  }
  return 'ws://localhost:8000';
}

export function useWebSocket(roomName = 'default_room') {
  const [isConnected, setIsConnected] = useState(false);
  const [serverState, setServerState] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const baseUrl = getWebSocketBaseUrl();
      const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('access') || localStorage.getItem('token')) : null;
      const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
      const wsUrl = `${baseUrl}/ws/game/${roomName}/${tokenQuery}`;
      
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT_STATE' || data.type === 'STATE_UPDATE') {
            setServerState(data.state);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onerror = () => {
        setConnectionError('WebSocket connection error');
        setIsConnected(false);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = socket;
    } catch (err) {
      setConnectionError(err.message);
    }
  }, [roomName]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendAction = useCallback((action, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...payload }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    serverState,
    connectionError,
    sendAction,
    reconnect: connect,
  };
}
