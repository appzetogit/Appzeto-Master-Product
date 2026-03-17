import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const listQuerySchema = z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    search: z.string().optional().or(z.literal('')),
    rating: z.string().optional().or(z.literal('')),
    status: z.string().optional().or(z.literal('')),
    priority: z.string().optional().or(z.literal(''))
});

export const validateHelpSupportListQuery = (query) => {
    const result = listQuerySchema.safeParse(query || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

const safetyStatusSchema = z.object({
    status: z.enum(['unread', 'read', 'resolved', 'urgent'])
});

export const validateSafetyStatusDto = (body) => {
    const result = safetyStatusSchema.safeParse(body || {});
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    return result.data;
};

const safetyPrioritySchema = z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical'])
});

export const validateSafetyPriorityDto = (body) => {
    const result = safetyPrioritySchema.safeParse(body || {});
    if (!result.success) throw new ValidationError(result.error.errors[0].message);
    return result.data;
};

