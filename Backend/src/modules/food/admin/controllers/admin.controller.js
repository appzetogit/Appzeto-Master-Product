import mongoose from 'mongoose';
import * as adminService from '../services/admin.service.js';

// ----- Restaurants -----
export async function getRestaurants(req, res, next) {
    try {
        const data = await adminService.getRestaurants(req.query);
        res.status(200).json({
            success: true,
            message: 'Restaurants fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

export async function getRestaurantById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid restaurant id' });
        }
        const restaurant = await adminService.getRestaurantById(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Restaurant fetched successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
}

export async function getPendingRestaurants(req, res, next) {
    try {
        const pending = await adminService.getPendingRestaurants();
        res.status(200).json({
            success: true,
            message: 'Pending restaurants fetched successfully',
            data: pending
        });
    } catch (error) {
        next(error);
    }
}

export async function approveRestaurant(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant id'
            });
        }
        const restaurant = await adminService.approveRestaurant(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Restaurant approved successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
}

export async function createRestaurant(req, res, next) {
    try {
        const restaurant = await adminService.createRestaurantByAdmin(req.body || {});
        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
}

export async function rejectRestaurant(req, res, next) {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant id'
            });
        }
        const restaurant = await adminService.rejectRestaurant(id, reason);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Restaurant rejected successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
}

// ----- Delivery join requests -----
export async function getDeliveryJoinRequests(req, res, next) {
    try {
        const data = await adminService.getDeliveryJoinRequests(req.query);
        res.status(200).json({
            success: true,
            message: 'Delivery join requests fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

export async function getDeliveryWallets(req, res, next) {
    try {
        const data = adminService.getDeliveryWalletsStub();
        res.status(200).json({
            success: true,
            message: 'Wallets fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

// ----- Support tickets -----
export async function getSupportTicketStats(req, res, next) {
    try {
        const data = await adminService.getSupportTicketStats();
        res.status(200).json({
            success: true,
            message: 'Support ticket stats fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

export async function getSupportTickets(req, res, next) {
    try {
        const data = await adminService.getSupportTickets(req.query);
        res.status(200).json({
            success: true,
            message: 'Support tickets fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

export async function updateSupportTicket(req, res, next) {
    try {
        const ticket = await adminService.updateSupportTicket(req.params.id, req.body);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Support ticket updated successfully',
            data: ticket
        });
    } catch (error) {
        next(error);
    }
}

// ----- Delivery partners -----
export async function getDeliveryPartners(req, res, next) {
    try {
        const data = await adminService.getDeliveryPartners(req.query);
        res.status(200).json({
            success: true,
            message: 'Delivery partners fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

export async function getDeliveryPartnerById(req, res, next) {
    try {
        const delivery = await adminService.getDeliveryPartnerById(req.params.id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Delivery partner fetched successfully',
            data: { delivery }
        });
    } catch (error) {
        next(error);
    }
}

export async function approveDeliveryPartner(req, res, next) {
    try {
        const partner = await adminService.approveDeliveryPartner(req.params.id);
        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Delivery partner approved successfully',
            data: partner
        });
    } catch (error) {
        next(error);
    }
}

export async function rejectDeliveryPartner(req, res, next) {
    try {
        const reason = req.body?.reason != null ? String(req.body.reason).trim() : '';
        const partner = await adminService.rejectDeliveryPartner(req.params.id, reason);
        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Delivery partner rejected successfully',
            data: partner
        });
    } catch (error) {
        next(error);
    }
}

// ----- Zones -----
export async function getZones(req, res, next) {
    try {
        const data = await adminService.getZones(req.query);
        res.status(200).json({
            success: true,
            message: 'Zones fetched successfully',
            data
        });
    } catch (error) {
        next(error);
    }
}

export async function getZoneById(req, res, next) {
    try {
        const zone = await adminService.getZoneById(req.params.id);
        if (!zone) {
            return res.status(404).json({
                success: false,
                message: 'Zone not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Zone fetched successfully',
            data: { zone }
        });
    } catch (error) {
        next(error);
    }
}

export async function createZone(req, res, next) {
    try {
        const result = await adminService.createZone(req.body || {});
        if (result.error) {
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }
        res.status(201).json({
            success: true,
            message: 'Zone created successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function updateZone(req, res, next) {
    try {
        const result = await adminService.updateZone(req.params.id, req.body || {});
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Zone not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Zone updated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteZone(req, res, next) {
    try {
        const result = await adminService.deleteZone(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Zone not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Zone deleted successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
}
