import express from 'express';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';
import { createSafetyEmergencyController, createUserFeedbackController } from '../controllers/helpSupport.controller.js';

const router = express.Router();

// User Help & Support (Bearer token + USER role)
router.post('/feedback', authMiddleware, requireRoles('USER'), createUserFeedbackController);
router.post('/safety-emergency', authMiddleware, requireRoles('USER'), createSafetyEmergencyController);

export default router;

