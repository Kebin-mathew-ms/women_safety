import { Router } from 'express';
import wearableController from '../controllers/wearable.controller';
import * as logsController from '../controllers/wearablelogs.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { pairWearableSchema } from '../validators/sos.validator';
import { wearableLogSchema } from '../validators/notifications.validator';

const router = Router();

// Secure wearable smartwatch endpoints (Prompt 4 compatibility)
router.get('/', auth, wearableController.listDevices);
router.post('/', auth, validate(pairWearableSchema), wearableController.pairDevice);
router.put('/:id', auth, wearableController.updateDeviceStatus);
router.delete('/:id', auth, wearableController.unpairDevice);

// Prompt 7 specific endpoints
router.post('/pair', auth, validate(pairWearableSchema), wearableController.pairDevice);
router.delete('/unpair/:id', auth, logsController.unpairWearable);
router.get('/status', auth, logsController.getWearableStatus);
router.post('/telemetry', auth, validate(wearableLogSchema), logsController.logTelemetry);

export default router;
