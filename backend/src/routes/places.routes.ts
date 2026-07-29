import { Router } from 'express';
import * as placesController from '../controllers/savedplaces.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { savePlaceSchema } from '../validators/trip.validator';

const router = Router();

// Secure saved places endpoints
router.get('/', auth, placesController.listPlaces);
router.post('/', auth, validate(savePlaceSchema), placesController.createPlace);
router.put('/:id', auth, validate(savePlaceSchema), placesController.updatePlace);
router.delete('/:id', auth, placesController.deletePlace);

export default router;
