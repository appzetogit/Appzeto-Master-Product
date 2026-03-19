import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '@food/api/config';
import { userAPI } from '@food/api';

const debugLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log('📬 [UserSocket]', ...args);
  }
};

/**
 * Hook for user to receive real-time order notifications.
 * Dispatches 'orderStatusNotification' custom event for OrderTrackingCard.
 */
export const useUserNotifications = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.data?.success && response.data.data?.user) {
          const user = response.data.data.user;
          const id = user._id?.toString() || user.userId || user.id;
          setUserId(id);
        }
      } catch (error) {
        // Not logged in or error
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!API_BASE_URL || !String(API_BASE_URL).trim()) {
      setIsConnected(false);
      return;
    }
    if (!userId) {
      return;
    }

    // Normalize backend URL
    let backendUrl = API_BASE_URL;
    try {
      backendUrl = new URL(backendUrl).origin;
    } catch {
      backendUrl = String(backendUrl || "")
        .replace(/\/api\/v\d+\/?$/i, "")
        .replace(/\/api\/?$/i, "")
        .replace(/\/+$/, "");
    }

    const socketUrl = `${backendUrl}`;
    
    // Auth token
    const token = localStorage.getItem('user_accessToken') || localStorage.getItem('accessToken');
    if (!token) return;

    debugLog('🔌 Connecting to User Socket.IO:', socketUrl);

    socketRef.current = io(socketUrl, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      reconnection: true,
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      debugLog('✅ User Socket connected, userId:', userId);
      setIsConnected(true);
      // Backend auto-joins 'user:userId' room based on role/token in config/socket.js
    });

    socketRef.current.on('order_status_update', (data) => {
      debugLog('🔔 Order status update received:', data);
      
      // Dispatch custom event for OrderTrackingCard and other listeners
      const event = new CustomEvent('orderStatusNotification', {
        detail: {
          orderMongoId: data.orderMongoId,
          orderId: data.orderId,
          status: data.orderStatus,
          orderStatus: data.orderStatus, // Ensure compatibility with different UI checks
          deliveryState: data.deliveryState,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });

    socketRef.current.on('connect_error', (error) => {
      if (import.meta.env.DEV) {
        // debugLog('❌ Socket connection error:', error.message);
      }
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      debugLog('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  return { isConnected };
};
