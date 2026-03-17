import { FoodUser } from '../../../core/users/user.model.js';
import { FoodUserFeedback } from '../../food/admin/models/userFeedback.model.js';
import { FoodSafetyEmergency } from '../../food/admin/models/safetyEmergency.model.js';

export const createUserFeedback = async (userId, dto) => {
    const user = await FoodUser.findById(userId).lean();

    const doc = await FoodUserFeedback.create({
        customer: {
            name: user?.name || '',
            email: user?.email || ''
        },
        phone: user?.phone || '',
        orderId: dto.orderId || '',
        restaurantName: dto.restaurantName || '',
        rating: dto.rating,
        comment: dto.comment,
        submittedAt: new Date()
    });

    return doc.toObject();
};

export const createSafetyEmergency = async (userId, dto) => {
    const user = await FoodUser.findById(userId).lean();

    const doc = await FoodSafetyEmergency.create({
        userName: user?.name || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        message: dto.message,
        status: 'unread',
        priority: 'medium'
    });

    return doc.toObject();
};

