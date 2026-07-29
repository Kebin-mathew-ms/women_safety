import { Router } from 'express';
import * as voiceController from '../controllers/voice.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { voiceCommandSchema } from '../validators/notifications.validator';

const router = Router();

// Secure speech parser command endpoints
router.post('/command', auth, validate(voiceCommandSchema), voiceController.parseVoiceCommand);
router.get('/history', auth, voiceController.listVoiceHistory);

export default router;
