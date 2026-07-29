import { Router } from 'express';
import * as contactController from '../controllers/contact.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { emergencyContactSchema } from '../validators/auth.validator';

const router = Router();

// Secure emergency contacts endpoints
router.get('/', auth, contactController.listContacts);
router.post('/', auth, validate(emergencyContactSchema), contactController.addContact);
router.put('/:id', auth, validate(emergencyContactSchema), contactController.editContact);
router.delete('/:id', auth, contactController.deleteContact);

export default router;
