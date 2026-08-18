import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const { user, isAuthenticated } = useAuth0();

  // Keep a ref to the current user and roomData so reconnect handler can access them
  const userRef = useRef(user);
  const roomDataRef = useRef(roomData);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { roomDataRef.current = roomData; }, [roomData]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      // Auto-reconnect is on by default; we handle the reconnect event ourselves
    });

    // Global room state listeners
    newSocket.on('room-updated', (data) => {
      setRoomData(data);
    });

    // When the socket reconnects after a brief disconnect (tab switch, network blip),
    // automatically rejoin the room so the user stays connected.
    newSocket.on('connect', () => {
      const currentRoomData = roomDataRef.current;
      const currentUser = userRef.current;
      if (currentRoomData?.roomCode && currentUser) {
        console.log('[Socket] Reconnected — rejoining room', currentRoomData.roomCode);
        newSocket.emit('join-room', {
          roomCode: currentRoomData.roomCode,
          user: currentUser,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('room-updated');
      newSocket.off('connect');
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.sub]);

  const leaveRoom = () => {
    if (socket && roomData?.roomCode) {
      socket.emit('leave-room', { roomCode: roomData.roomCode });
      setRoomData(null);
    }
  };

  const value = {
    socket,
    roomData,
    roomCode: roomData?.roomCode || null,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
