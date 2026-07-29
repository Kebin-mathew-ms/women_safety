import { Router } from 'express';
import policeController from '../controllers/police.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Secure police query endpoints
router.get('/', auth, policeController.listStations);
router.get('/nearby', auth, policeController.listNearbyStations);

export default router;
