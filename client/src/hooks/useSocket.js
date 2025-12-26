// client/src/hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, profile } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('Socket connection error - will retry');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // 채팅방 입장
  const joinRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-room', roomId);
    }
  }, []);

  // 채팅방 퇴장
  const leaveRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room', roomId);
    }
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((roomId, message) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-message', { 
        roomId, 
        message,
        senderId: profile?.id,
        senderName: profile?.name
      });
    }
  }, [profile]);

  // 새 메시지 수신
  const onMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('new-message', callback);
      return () => socketRef.current?.off('new-message', callback);
    }
    return () => {};
  }, []);

  // 새 메시지 알림 수신
  const onMessageNotification = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('message-notification', callback);
      return () => socketRef.current?.off('message-notification', callback);
    }
    return () => {};
  }, []);

  // 타이핑 전송
  const sendTyping = useCallback((roomId, isTyping = true) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { 
        roomId, 
        isTyping,
        userId: profile?.id,
        userName: profile?.name
      });
    }
  }, [profile]);

  // 타이핑 멈춤
  const stopTyping = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { roomId, isTyping: false });
    }
  }, []);

  // 타이핑 수신
  const onTyping = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-typing', callback);
      return () => socketRef.current?.off('user-typing', callback);
    }
    return () => {};
  }, []);

  // 읽음 처리 (필요시)
  const markAsRead = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark-as-read', { roomId });
    }
  }, []);

  // 알림 수신
  const onNotification = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('notification', callback);
      return () => socketRef.current?.off('notification', callback);
    }
    return () => {};
  }, []);

  // 위험 알림 수신
  const onAlert = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('danger-alert', callback);
      return () => socketRef.current?.off('danger-alert', callback);
    }
    return () => {};
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessage,
    onMessageNotification,
    sendTyping,
    stopTyping,
    onTyping,
    markAsRead,
    onNotification,
    onAlert,
  };
};

export default useSocket;
