import { Router } from 'express';
import * as placesController from '../controllers/places.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createSafePlaceSchema, updateSafePlaceSchema } from '../validators/places.validator';

const router = Router();

// Secure safe places endpoints
router.get('/', auth, placesController.listSafePlaces);
router.get('/:id', auth, placesController.getSafePlace);
router.post('/', auth, validate(createSafePlaceSchema), placesController.createSafePlace);
router.put('/:id', auth, validate(updateSafePlaceSchema), placesController.updateSafePlace);
router.delete('/:id', auth, placesController.deleteSafePlace);

export default router;
