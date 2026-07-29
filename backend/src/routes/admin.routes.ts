import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Secure admin operator endpoints
router.get('/users', auth, adminController.listUsers);
router.put('/users/:userId/block', auth, adminController.toggleUserBlock);

// Trips tracking & statistics endpoints
router.get('/stats', auth, adminController.getTripStatistics);
router.get('/trips', auth, adminController.listAllTripsAdmin);
router.get('/trips/:id', auth, adminController.getTripDetailsAdmin);
router.get('/alerts', auth, adminController.listAllAlertsAdmin);

// Flagged community posts moderation endpoints
router.get('/reports', auth, adminController.listReportedPosts);
router.put('/reports/:id', auth, adminController.resolveReportedPost);

// Intelligent notifications & speech metrics endpoints
router.post('/broadcast', auth, adminController.broadcastNotification);
router.get('/voice-analytics', auth, adminController.listVoiceAnalytics);
router.get('/wearable-telemetry', auth, adminController.listWearableTelemetry);

export default router;
