import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createRoomSchema, createMessageSchema } from '../validators/community.validator';

const router = Router();

// Secure Chat & Room messaging endpoints
router.post('/rooms', auth, validate(createRoomSchema), chatController.createRoom);
router.get('/rooms', auth, chatController.listRooms);
router.get('/messages/:roomId', auth, chatController.listMessages);
router.post('/messages', auth, validate(createMessageSchema), chatController.sendMessage);

export default router;
