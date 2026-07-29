import { Router } from 'express';
import * as notifController from '../controllers/notifications.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updatePreferencesSchema } from '../validators/notifications.validator';

const router = Router();

// Secure notifications endpoints
router.get('/', auth, notifController.listNotifications);
router.put('/read', auth, notifController.markNotificationsRead);
router.delete('/:id', auth, notifController.deleteNotification);
router.get('/preferences', auth, notifController.getPreferences);
router.put('/preferences', auth, validate(updatePreferencesSchema), notifController.updatePreferences);

export default router;
