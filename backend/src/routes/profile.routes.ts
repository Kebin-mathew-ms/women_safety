import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadProfileImage } from '../middleware/upload.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Secure profile routes
router.get('/', auth, profileController.getProfile);
router.put('/', auth, validate(updateProfileSchema), profileController.updateProfile);
router.post('/change-password', auth, validate(changePasswordSchema), authController.changePassword);
router.post('/image', auth, uploadProfileImage, profileController.uploadImage);
router.delete('/', auth, profileController.deleteAccount);

export default router;
