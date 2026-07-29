import { Router } from 'express';
import * as trackingController from '../controllers/tracking.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Secure live tracking endpoints
router.post('/start', auth, trackingController.startTracking);
router.post('/stop', auth, trackingController.stopTracking);
router.get('/:sessionId', auth, trackingController.getTrackingSession);

export default router;
