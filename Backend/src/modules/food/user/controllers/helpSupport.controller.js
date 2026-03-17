import { sendResponse } from '../../../utils/response.js';
import { validateUserFeedbackCreateDto } from '../validators/feedback.validator.js';
import { validateSafetyEmergencyCreateDto } from '../validators/safetyEmergency.validator.js';
import { createSafetyEmergency, createUserFeedback } from '../services/helpSupport.service.js';

export const createUserFeedbackController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const dto = validateUserFeedbackCreateDto(req.body || {});
        const created = await createUserFeedback(userId, dto);
        return sendResponse(res, 201, 'Feedback submitted successfully', { feedback: created });
    } catch (error) {
        next(error);
    }
};

export const createSafetyEmergencyController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const dto = validateSafetyEmergencyCreateDto(req.body || {});
        const created = await createSafetyEmergency(userId, dto);
        return sendResponse(res, 201, 'Safety emergency report submitted successfully', { safetyEmergency: created });
    } catch (error) {
        next(error);
    }
};

