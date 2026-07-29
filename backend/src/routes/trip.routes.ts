import { Router } from 'express';
import * as tripController from '../controllers/trip.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createTripSchema, updateTripSchema, logLocationSchema } from '../validators/trip.validator';

const router = Router();

// Secure trip routing endpoints
router.post('/', auth, validate(createTripSchema), tripController.createTrip);
router.get('/', auth, tripController.listTrips);
router.get('/history', auth, tripController.getTripHistory);
router.get('/:id', auth, tripController.getTrip);
router.put('/:id', auth, validate(updateTripSchema), tripController.editTrip);
router.delete('/:id', auth, tripController.deleteTrip);

// Trip state control routes
router.post('/:id/start', auth, tripController.startTrip);
router.post('/:id/pause', auth, tripController.pauseTrip);
router.post('/:id/resume', auth, tripController.resumeTrip);
router.post('/:id/complete', auth, tripController.completeTrip);
router.post('/:id/cancel', auth, tripController.cancelTrip);

// Location Logging
router.post('/location', auth, validate(logLocationSchema), tripController.logLocation);

export default router;
