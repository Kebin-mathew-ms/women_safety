import { Router } from 'express';
import * as sosController from '../controllers/sos.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createSosSchema, cancelSosSchema, resolveSosSchema } from '../validators/sos.validator';

const router = Router();

// Secure SOS routing endpoints
router.post('/', auth, validate(createSosSchema), sosController.createSOS);
router.post('/voice', auth, sosController.voiceSOS);
router.post('/cancel', auth, validate(cancelSosSchema), sosController.cancelSOS);
router.post('/:id/resolve', auth, validate(resolveSosSchema), sosController.resolveSOS);
router.get('/history', auth, sosController.getSOSHistory);
router.get('/:id', auth, sosController.getSOSDetails);

// Recipient Acknowledge
router.post('/recipient/:recipientId/acknowledge', sosController.acknowledgeSOS);

export default router;
