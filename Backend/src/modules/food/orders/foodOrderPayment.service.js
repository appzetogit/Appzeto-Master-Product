import mongoose from 'mongoose';
import { FoodOrderPayment } from './foodOrderPayment.model.js';
import { FoodOrder } from './order.model.js';
import { ForbiddenError, ValidationError } from '../../../core/auth/errors.js';

function buildOrderIdentityFilter(orderIdOrMongoId) {
    const raw = String(orderIdOrMongoId || '').trim();
    if (!raw) return null;
    if (mongoose.isValidObjectId(raw)) return { _id: new mongoose.Types.ObjectId(raw) };
    return { orderId: raw };
}

/**
 * Persist a ledger row + return the created doc (lean).
 * Does not modify the FoodOrder document — caller updates order.payment separately.
 */
export async function recordFoodOrderPaymentEvent(payload) {
    const doc = await FoodOrderPayment.create({
        orderId: payload.orderId,
        userId: payload.userId,
        orderReadableId: payload.orderReadableId,
        kind: payload.kind,
        method: payload.method,
        status: payload.status,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        amountDue: payload.amountDue,
        razorpay: payload.razorpay,
        qr: payload.qr,
        metadata: payload.metadata,
        recordedByRole: payload.recordedByRole || 'SYSTEM',
        recordedById: payload.recordedById
    });
    return doc.toObject();
}

/** Snapshot helper from embedded order.payment + pricing */
export function paymentSnapshotFromOrder(orderLike) {
    const p = orderLike?.payment || {};
    return {
        method: p.method,
        status: p.status,
        amount: orderLike?.pricing?.total ?? p.amountDue ?? 0,
        currency: orderLike?.pricing?.currency || 'INR',
        amountDue: p.amountDue ?? orderLike?.pricing?.total ?? 0,
        razorpay: p.razorpay && Object.keys(p.razorpay).length ? { ...p.razorpay } : undefined,
        qr: p.qr && Object.keys(p.qr).length ? { ...p.qr } : undefined
    };
}

/**
 * List ledger entries for an order (newest first). User must own the order.
 */
export async function listFoodOrderPaymentsForUser(orderIdParam, userId) {
    const identity = buildOrderIdentityFilter(orderIdParam);
    if (!identity) throw new ValidationError('Order id required');

    const order = await FoodOrder.findOne(identity).select('_id userId orderId').lean();
    if (!order) throw new ValidationError('Order not found');
    if (order.userId?.toString() !== String(userId)) throw new ForbiddenError('Not your order');

    const rows = await FoodOrderPayment.find({ orderId: order._id })
        .sort({ createdAt: -1 })
        .lean();

    return { orderId: order.orderId, orderMongoId: order._id.toString(), payments: rows };
}
