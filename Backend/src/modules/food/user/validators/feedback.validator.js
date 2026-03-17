import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const schema = z.object({
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().min(1, 'Feedback is required').max(4000).transform((v) => v.trim()),
    orderId: z.string().optional().or(z.literal('')).transform((v) => String(v || '').trim()),
    restaurantName: z.string().optional().or(z.literal('')).transform((v) => String(v || '').trim())
});

export const validateUserFeedbackCreateDto = (body) => {
    const result = schema.safeParse(body || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

