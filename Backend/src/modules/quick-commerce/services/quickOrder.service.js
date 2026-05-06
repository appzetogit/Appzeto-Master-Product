import mongoose from 'mongoose';
import { logger } from '../../../utils/logger.js';
import { getIO, rooms } from '../../../config/socket.js';
import { Seller } from '../seller/models/seller.model.js';
import { SellerOrder } from '../seller/models/sellerOrder.model.js';
import { QuickOrder } from '../models/order.model.js';
import { FoodDeliveryPartner } from '../../food/delivery/models/deliveryPartner.model.js';
import {
  pushStatusHistory,
  notifyOwnerSafely,
  notifyOwnersSafely,
  buildDeliverySocketPayload,
  enqueueOrderEvent,
  isStatusAdvance,
} from '../../food/orders/services/order.helpers.js';
import { initiateRazorpayRefund } from '../../food/orders/helpers/razorpay.helper.js';
import * as foodTransactionService from '../../food/orders/services/foodTransaction.service.js';
import { ValidationError, NotFoundError } from '../../../core/auth/errors.js';

/**
 * Status mapping from SellerOrder to Parent QuickOrder (FoodOrder)
 */
const SELLER_TO_PARENT_STATUS_MAP = {
  pending: "placed",
  confirmed: "confirmed",
  packed: "preparing",
  ready_for_pickup: "ready_for_pickup",
  out_for_delivery: "picked_up",
  delivered: "delivered",
  cancelled: "cancelled_by_restaurant",
};

/**
 * Workflow status mapping for parent order
 */
const SELLER_TO_WORKFLOW_MAP = {
  pending: "SELLER_PENDING",
  confirmed: "SELLER_ACCEPTED",
  packed: "PICKUP_READY", // Or stay in SELLER_ACCEPTED until ready
  ready_for_pickup: "PICKUP_READY",
  out_for_delivery: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

/**
 * Main service for Quick Commerce Order lifecycle
 */
export const updateSellerOrderStatus = async (sellerOrderId, sellerId, nextStatus) => {
  const isId = mongoose.Types.ObjectId.isValid(sellerOrderId);
  const sellerOrder = await SellerOrder.findOne({
    sellerId,
    $or: [
      ...(isId ? [{ _id: sellerOrderId }] : []),
      { orderId: sellerOrderId }
    ]
  });
  if (!sellerOrder) throw new NotFoundError('Seller order not found');

  const currentStatus = sellerOrder.status;
  if (currentStatus === nextStatus) return sellerOrder;

  // 1. Update SellerOrder
  sellerOrder.status = nextStatus;
  sellerOrder.workflowStatus = SELLER_TO_WORKFLOW_MAP[nextStatus] || sellerOrder.workflowStatus;
  if (nextStatus === 'delivered') sellerOrder.deliveredAt = new Date();
  await sellerOrder.save();

  // 2. Sync Parent Order
  const parentOrder = await QuickOrder.findById(sellerOrder.parentOrderId);
  if (parentOrder) {
    const parentNextStatus = SELLER_TO_PARENT_STATUS_MAP[nextStatus];
    const fromStatus = parentOrder.orderStatus;

    if (parentNextStatus) {
      const fromStatus = parentOrder.orderStatus;
      const shouldUpdateParentStatus = parentOrder.orderType !== 'mixed' || isStatusAdvance(fromStatus, parentNextStatus);

      if (shouldUpdateParentStatus) {
        parentOrder.orderStatus = parentNextStatus;
      }

      pushStatusHistory(parentOrder, {
        byRole: 'SELLER',
        byId: sellerId,
        from: fromStatus,
        to: parentOrder.orderStatus,
        note: parentOrder.orderType === 'mixed' 
          ? `Seller updated mixed-order leg to ${nextStatus}`
          : `Seller updated status to ${nextStatus}`,
      });

      // Handle Side Effects
      
      // If confirmed -> trigger dispatch
      if (nextStatus === 'confirmed') {
        void triggerQuickOrderDispatch(parentOrder._id, sellerId).catch(err => 
          logger.error(`[QuickDispatch] Trigger failed: ${err.message}`)
        );
      }

      // If ready_for_pickup -> ping rider
      if (nextStatus === 'ready_for_pickup') {
        const assignedId = parentOrder.dispatch?.deliveryPartnerId;
        if (assignedId) {
          const seller = await Seller.findById(sellerId).select('shopName').lean();
          const io = getIO();
          const payload = buildDeliverySocketPayload(parentOrder, seller);
          io.to(rooms.delivery(assignedId)).emit('order_ready', payload);
        }
      }

      // If cancelled -> handle refund
      if (nextStatus === 'cancelled') {
        await handleSellerOrderCancellation(parentOrder);
      }

      await parentOrder.save();
      
      // Emit Socket Updates
      const io = getIO();
      if (io) {
        const payload = {
          orderMongoId: parentOrder._id.toString(),
          orderId: parentOrder.orderId,
          orderStatus: parentOrder.orderStatus,
        };
        io.to(rooms.user(parentOrder.userId)).emit('order_status_update', payload);
        io.to(rooms.tracking(parentOrder.orderId)).emit('order_status_update', payload);
        // Also notify the seller room for UI consistency
        io.to(rooms.seller(sellerId)).emit('order_status_update', payload);
      }

      // FCM Notification to User
      await notifyOwnerSafely(
        { ownerType: 'USER', ownerId: parentOrder.userId },
        {
          title: `Order Update: ${nextStatus.replace(/_/g, ' ')}`,
          body: `Your order #${parentOrder.orderId} from ${sellerOrder.items?.[0]?.name || 'the store'} is now ${nextStatus.replace(/_/g, ' ')}.`,
          data: {
            type: 'order_status_update',
            orderId: parentOrder.orderId,
            orderMongoId: parentOrder._id.toString(),
          }
        }
      );
    }
  }

  return sellerOrder;
};

const handleSellerOrderCancellation = async (parentOrder) => {
  // Refund logic
  if (
    parentOrder.payment?.status === "paid" &&
    parentOrder.payment?.method === "razorpay" &&
    parentOrder.payment?.razorpay?.paymentId &&
    (!parentOrder.payment?.refund || parentOrder.payment?.refund?.status !== "processed")
  ) {
    try {
      const refundResult = await initiateRazorpayRefund(
        parentOrder.payment.razorpay.paymentId,
        parentOrder.pricing?.total || 0
      );

      if (refundResult.success) {
        parentOrder.payment.status = "refunded";
        parentOrder.payment.refund = {
          status: "processed",
          amount: parentOrder.pricing?.total || 0,
          refundId: refundResult.refundId,
          processedAt: new Date()
        };
      } else {
        parentOrder.payment.refund = { status: "failed", amount: parentOrder.pricing?.total || 0 };
      }
    } catch (err) {
      logger.error(`Automated refund failed for Quick Order ${parentOrder.orderId}:`, err);
      parentOrder.payment.refund = { status: "failed", amount: parentOrder.pricing?.total || 0 };
    }
  }

  // Update transaction
  try {
    await foodTransactionService.updateTransactionStatus(
      parentOrder._id, 
      'cancelled_by_restaurant', 
      { note: 'Cancelled by seller' }
    );
  } catch (err) {
    logger.error(`Transaction update failed for Quick Order ${parentOrder.orderId}:`, err);
  }
};

export const syncSellerOrderFromDelivery = async (parentOrderId, deliveryStatus) => {
  const nextSellerStatus = deliveryStatus === 'picked_up' ? 'out_for_delivery' : (deliveryStatus === 'delivered' ? 'delivered' : null);
  if (!nextSellerStatus) return;

  await SellerOrder.updateMany(
    { parentOrderId },
    { $set: { status: nextSellerStatus, workflowStatus: SELLER_TO_WORKFLOW_MAP[nextSellerStatus] } }
  );
};

export const triggerQuickOrderDispatch = async (parentOrderId, sellerId) => {
  try {
    const quickOrder = await QuickOrder.findById(parentOrderId);
    if (!quickOrder) return;

    if (quickOrder.dispatch?.status === "accepted" && quickOrder.dispatch?.deliveryPartnerId) {
      return;
    }

    const seller = await Seller.findById(sellerId).select("shopName name phone location").lean();
    if (!seller) return;

    const origin = getSellerLocation(seller) || getOrderAddressPoint(quickOrder);
    if (!origin) return;

    const nearbyPartners = await listNearbyOnlineDeliveryPartnersByCoords(origin, {
      maxKm: 15,
      limit: 25,
    });

    if (nearbyPartners.length === 0) {
      logger.info(`[QuickDispatch] No nearby partners found for order ${quickOrder.orderId}`);
      return;
    }

    const io = getIO();
    const deliveryPayload = {
      ...buildDeliverySocketPayload(quickOrder, seller),
      orderId: quickOrder.orderId,
      orderMongoId: quickOrder._id?.toString?.(),
      restaurantName: seller?.shopName || seller?.name || "Quick Commerce Seller",
      restaurantPhone: seller?.phone || "",
      dispatch: quickOrder.dispatch,
      sourceType: "quick",
    };

    for (const partner of nearbyPartners) {
      const deliveryRoom = rooms.delivery(partner.partnerId);
      if (io) {
        io.to(deliveryRoom).emit("new_order_available", {
          ...deliveryPayload,
          pickupDistanceKm: partner.distanceKm,
        });
        io.to(deliveryRoom).emit("play_notification_sound", {
          orderId: quickOrder.orderId,
          orderMongoId: quickOrder._id?.toString?.(),
        });
      }

      await notifyOwnerSafely(
        { ownerType: "DELIVERY_PARTNER", ownerId: partner.partnerId },
        {
          title: "New quick commerce order nearby",
          body: `A new order #${quickOrder.orderId} is available near you.`,
          data: {
            type: "new_order",
            orderId: quickOrder.orderId,
            orderMongoId: quickOrder._id?.toString?.(),
            link: "/delivery",
          },
        },
      );
    }

    logger.info(`[QuickDispatch] Broadcasted order ${quickOrder.orderId} to ${nearbyPartners.length} partners`);
  } catch (error) {
    logger.error(`[QuickDispatch] Failed for order ${parentOrderId}: ${error.message}`);
  }
};

const getSellerLocation = (seller) => {
  if (Array.isArray(seller?.location?.coordinates) && seller.location.coordinates.length === 2) {
    return { lat: Number(seller.location.coordinates[1]), lng: Number(seller.location.coordinates[0]) };
  }
  if (Number.isFinite(Number(seller?.location?.latitude)) && Number.isFinite(Number(seller?.location?.longitude))) {
    return { lat: Number(seller.location.latitude), lng: Number(seller.location.longitude) };
  }
  return null;
};

const getOrderAddressPoint = (order) => {
  const lat = Number(order?.address?.location?.lat);
  const lng = Number(order?.address?.location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const listNearbyOnlineDeliveryPartnersByCoords = async (origin, { maxKm = 15, limit = 10 } = {}) => {
  const onlinePartners = await FoodDeliveryPartner.find({
    availabilityStatus: "online",
    status: { $in: process.env.NODE_ENV === "production" ? ["approved"] : ["approved", "pending"] },
  })
    .select("_id name phone lastLat lastLng lastLocationAt")
    .lean();

  if (!origin || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    return onlinePartners.slice(0, Math.max(1, limit)).map((partner) => ({
      partnerId: partner._id,
      distanceKm: null,
      name: partner.name || "Delivery Partner",
      phone: partner.phone || "",
    }));
  }

  const STALE_GPS_MS = 10 * 60 * 1000;
  const scored = onlinePartners
    .map((partner) => {
      const lat = Number(partner.lastLat);
      const lng = Number(partner.lastLng);
      const isStale = !partner.lastLocationAt || Date.now() - new Date(partner.lastLocationAt).getTime() > STALE_GPS_MS;

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || isStale) {
        return {
          partnerId: partner._id,
          distanceKm: null,
          score: Number.MAX_SAFE_INTEGER,
          name: partner.name || "Delivery Partner",
          phone: partner.phone || "",
        };
      }

      const d = haversineKm(origin.lat, origin.lng, lat, lng);
      return {
        partnerId: partner._id,
        distanceKm: d,
        score: d,
        name: partner.name || "Delivery Partner",
        phone: partner.phone || "",
      };
    })
    .filter((p) => p.distanceKm === null || p.distanceKm <= maxKm)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, limit);
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
