import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const schema = z.object({
    message: z.string().min(1, 'Message is required').max(8000).transform((v) => v.trim())
});

export const validateSafetyEmergencyCreateDto = (body) => {
    const result = schema.safeParse(body || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

