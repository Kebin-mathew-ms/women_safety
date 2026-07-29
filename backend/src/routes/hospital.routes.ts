import { Router } from 'express';
import hospitalController from '../controllers/hospital.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Secure hospitals query endpoints
router.get('/', auth, hospitalController.listHospitals);
router.get('/nearby', auth, hospitalController.listNearbyHospitals);

export default router;
