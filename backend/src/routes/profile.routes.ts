import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadProfileImage } from '../middleware/upload.middleware';
import { updateProfileSchema } from '../validators/auth.validator';

const router = Router();

// Secure profile routes
router.get('/', auth, profileController.getProfile);
router.put('/', auth, validate(updateProfileSchema), profileController.updateProfile);
router.post('/image', auth, uploadProfileImage, profileController.uploadImage);
router.delete('/', auth, profileController.deleteAccount);

export default router;
