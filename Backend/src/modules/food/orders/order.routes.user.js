import express from 'express';
import {
    calculateOrderController,
    createOrderController,
    verifyPaymentController,
    listOrdersUserController,
    getOrderPaymentsUserController,
    getOrderByIdUserController,
    cancelOrderController
} from './order.controller.js';

const router = express.Router();

router.post('/calculate', calculateOrderController);
router.post('/', createOrderController);
router.post('/verify-payment', verifyPaymentController);
router.get('/', listOrdersUserController);
router.get('/:orderId/payments', getOrderPaymentsUserController);
router.get('/:orderId', getOrderByIdUserController);
router.patch('/:orderId/cancel', cancelOrderController);

export default router;
