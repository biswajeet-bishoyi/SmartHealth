import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    let socketUrl = window.location.origin;
    if (import.meta.env.VITE_API_URL) {
      socketUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '').replace(/\/api$/, '');
    } else if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) {
      socketUrl = 'https://smarthealthne-backend.onrender.com';
    }

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join_rooms', { role: user.role, district: user.district });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
