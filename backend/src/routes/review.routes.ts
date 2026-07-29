import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createReviewSchema, updateReviewSchema } from '../validators/places.validator';

const router = Router();

// Secure place reviews endpoints
router.post('/', auth, validate(createReviewSchema), reviewsController.createReview);
router.put('/:id', auth, validate(updateReviewSchema), reviewsController.updateReview);
router.delete('/:id', auth, reviewsController.deleteReview);
router.get('/place/:id', auth, reviewsController.listPlaceReviews);

export default router;
