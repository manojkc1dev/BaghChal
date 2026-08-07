import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(roomName = 'default_room') {
  const [isConnected, setIsConnected] = useState(false);
  const [serverState, setServerState] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = `ws://localhost:8000/ws/game/${roomName}/`;
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

      socket.onerror = (_err) => {
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
