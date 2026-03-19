import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from "@food/context/OrdersContext";
import { orderAPI } from '@food/api';

const getOrderKey = (order) => order?.id || order?._id || order?.orderId || null;

const getOrderStatus = (order) =>
  String(order?.orderStatus || order?.status || order?.deliveryState?.status || '').toLowerCase();

const getOrderPhase = (order) =>
  String(order?.deliveryState?.currentPhase || '').toLowerCase();

const isActiveOrder = (order) => {
  const status = getOrderStatus(order);
  return !(
    status === 'delivered' ||
    status === 'cancelled' ||
    status === 'completed' ||
    status === ''
  );
};

const getTimeRemaining = (order) => {
  if (!order) return null;

  const orderTime = new Date(
    order.createdAt || order.orderDate || order.created_at || order.date || Date.now(),
  );
  const estimatedMinutes =
    order.estimatedDeliveryTime ||
    order.estimatedTime ||
    order.estimated_delivery_time ||
    35;
  const deliveryTime = new Date(orderTime.getTime() + estimatedMinutes * 60000);
  return Math.max(0, Math.floor((deliveryTime - new Date()) / 60000));
};

export default function OrderTrackingCard() {
  const navigate = useNavigate();
  const { orders: contextOrders } = useOrders();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [apiOrders, setApiOrders] = useState([]);
  const [activeOrderOverride, setActiveOrderOverride] = useState(null);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const userToken =
      localStorage.getItem('user_accessToken') || localStorage.getItem('accessToken');
    if (!userToken) {
      return;
    }

    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getOrders({ limit: 10, page: 1 });
        let nextOrders = [];

        if (response?.data?.success && response?.data?.data?.orders) {
          nextOrders = response.data.data.orders;
        } else if (response?.data?.orders) {
          nextOrders = response.data.orders;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          nextOrders = response.data.data;
        }

        if (isMounted) {
          setApiOrders(Array.isArray(nextOrders) ? nextOrders : []);
        }
      } catch {
        if (isMounted) {
          setApiOrders([]);
        }
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const uniqueOrders = useMemo(() => {
    const seen = new Set();

    return [...contextOrders, ...apiOrders].filter((order) => {
      const key = getOrderKey(order);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [contextOrders, apiOrders]);

  const activeOrder = useMemo(
    () => {
      const candidate = uniqueOrders.find((order) => isActiveOrder(order)) || null;
      if (!candidate) return null;
      const overrideKey = getOrderKey(activeOrderOverride);
      const candidateKey = getOrderKey(candidate);
      if (overrideKey && candidateKey && overrideKey === candidateKey) return activeOrderOverride;
      return candidate;
    },
    [uniqueOrders, activeOrderOverride],
  );

  useEffect(() => {
    const handleOrderStatusNotification = async (event) => {
      const detail = event?.detail || {};
      const incomingKey = String(detail?.orderMongoId || detail?.orderId || '').trim();
      const currentKey = String(getOrderKey(activeOrder) || '').trim();
      if (!incomingKey || !currentKey) return;
      if (incomingKey !== currentKey) return;

      // Merge best-effort update immediately for snappy UI.
      setActiveOrderOverride((prev) => ({
        ...(prev || activeOrder || {}),
        orderStatus: detail?.orderStatus || prev?.orderStatus || activeOrder?.orderStatus,
        deliveryState: detail?.deliveryState
          ? { ...(prev?.deliveryState || activeOrder?.deliveryState || {}), ...detail.deliveryState }
          : (prev?.deliveryState || activeOrder?.deliveryState),
        status: detail?.status || prev?.status || activeOrder?.status,
      }));

      // Debounced refresh from API for correctness.
      const now = Date.now();
      if (now - lastRefreshRef.current < 1500) return;
      lastRefreshRef.current = now;

      try {
        const response = await orderAPI.getOrderDetails(incomingKey);
        const fresh = response?.data?.data?.order || response?.data?.order || null;
        if (fresh) setActiveOrderOverride(fresh);
      } catch {
        // ignore: card will still show optimistic status
      }
    };

    window.addEventListener('orderStatusNotification', handleOrderStatusNotification);
    return () => window.removeEventListener('orderStatusNotification', handleOrderStatusNotification);
  }, [activeOrder]);

  useEffect(() => {
    if (!activeOrder) {
      setTimeRemaining(null);
      return;
    }

    const updateRemainingTime = () => {
      setTimeRemaining(getTimeRemaining(activeOrder));
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  if (!activeOrder) {
    return null;
  }

  const orderStatus = getOrderStatus(activeOrder) || 'preparing';
  const orderPhase = getOrderPhase(activeOrder);
  if (orderStatus === 'delivered' || orderStatus === 'completed' || timeRemaining === 0) {
    return null;
  }

  const restaurantName =
    activeOrder.restaurant || activeOrder.restaurantName || 'Restaurant';
  const statusText = (() => {
    const s = String(orderStatus);
    const p = String(orderPhase);

    if (s === 'confirmed') return 'Order confirmed';
    if (s === 'preparing' || s === 'created' || s === 'pending') return 'Preparing your order';
    if (s === 'ready_for_pickup') return 'Ready for pickup';

    // Delivery-state driven statuses
    if (s === 'reached_pickup' || p === 'at_pickup') return 'Delivery partner reached restaurant';
    if (s === 'picked_up' || p === 'en_route_to_delivery') return 'On the way';
    if (s === 'reached_drop' || p === 'at_drop') return 'Arrived near you';

    if (s === 'delivered' || p === 'delivered' || p === 'completed') return 'Delivered';
    return 'Preparing your order';
  })();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-20 left-4 right-4 z-60 md:hidden"
        onClick={() => navigate(`/user/orders/${activeOrder.id || activeOrder._id || activeOrder.orderId}`)}
      >
        <div className="bg-gray-800 rounded-xl p-4 shadow-2xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{restaurantName}</p>
                <div className="flex items-center gap-1">
                  <p className="text-gray-300 text-xs truncate">{statusText}</p>
                  <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                </div>
              </div>
            </div>

            <div className="bg-[#EB590E] rounded-lg px-3 py-2 shrink-0">
              <p className="text-white text-[10px] font-medium uppercase leading-tight">
                arriving in
              </p>
              <p className="text-white text-sm font-bold leading-tight">
                {timeRemaining !== null ? `${timeRemaining} mins` : '-- mins'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
