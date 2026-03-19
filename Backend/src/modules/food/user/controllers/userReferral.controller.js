import { sendResponse } from '../../../../utils/response.js';
import { getUserReferralStats } from '../services/userReferral.service.js';

export const getUserReferralStatsController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const stats = await getUserReferralStats(userId);
        return sendResponse(res, 200, 'Referral stats fetched successfully', { stats });
    } catch (error) {
        next(error);
    }
};

