import { Router } from 'express';
import crimeController from '../controllers/crime.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createCrimeReportSchema, updateCrimeReportSchema } from '../validators/places.validator';

const router = Router();

// Secure community hazard and crime reporting endpoints
router.post('/', auth, validate(createCrimeReportSchema), crimeController.createCrimeReport);
router.get('/', auth, crimeController.listCrimeReports);
router.get('/heatmap', auth, crimeController.getCrimeHeatmap);
router.put('/:id', auth, validate(updateCrimeReportSchema), crimeController.updateCrimeReportStatus);

export default router;
