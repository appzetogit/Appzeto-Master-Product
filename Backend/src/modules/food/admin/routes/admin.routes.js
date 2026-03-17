import express from 'express';
import { AuthError } from '../../../../core/auth/errors.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

const requireAdmin = (req, _res, next) => {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
        return next(new AuthError('Admin access required'));
    }
    return next();
};

router.use(requireAdmin);

// ----- Restaurants -----
router.get('/restaurants', adminController.getRestaurants);
router.get('/restaurants/pending', adminController.getPendingRestaurants);
router.get('/restaurants/:id', adminController.getRestaurantById);
router.post('/restaurants', adminController.createRestaurant);
router.patch('/restaurants/:id/approve', adminController.approveRestaurant);
router.patch('/restaurants/:id/reject', adminController.rejectRestaurant);

// ----- Delivery -----
router.get('/delivery/join-requests', adminController.getDeliveryJoinRequests);
router.get('/delivery/wallets', adminController.getDeliveryWallets);
router.get('/delivery/support-tickets/stats', adminController.getSupportTicketStats);
router.get('/delivery/support-tickets', adminController.getSupportTickets);
router.patch('/delivery/support-tickets/:id', adminController.updateSupportTicket);
router.get('/delivery/partners', adminController.getDeliveryPartners);
router.get('/delivery/:id', adminController.getDeliveryPartnerById);
router.patch('/delivery/:id/approve', adminController.approveDeliveryPartner);
router.patch('/delivery/:id/reject', adminController.rejectDeliveryPartner);

// ----- Zones -----
router.get('/zones', adminController.getZones);
router.get('/zones/:id', adminController.getZoneById);
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);
router.delete('/zones/:id', adminController.deleteZone);

export default router;
