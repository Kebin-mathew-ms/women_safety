import { Router } from 'express';
import { getRouteSafetyRecommendation } from '../controllers/routeSafety.controller';
import { validate } from '../middleware/validation.middleware';
import { routeSafetyRecommendationSchema } from '../validators/routeSafety.validator';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// POST /api/routes/safety-recommendation
router.post('/safety-recommendation', auth, validate(routeSafetyRecommendationSchema), getRouteSafetyRecommendation);

export default router;
