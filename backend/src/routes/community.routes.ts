import { Router } from 'express';
import * as communityController from '../controllers/community.controller';
import { auth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  createLikeSchema,
} from '../validators/community.validator';

const router = Router();

// Posts CRUD
router.post('/posts', auth, validate(createPostSchema), communityController.createPost);
router.get('/posts', auth, communityController.listPosts);
router.get('/posts/:id', auth, communityController.getPost);
router.put('/posts/:id', auth, validate(updatePostSchema), communityController.updatePost);
router.delete('/posts/:id', auth, communityController.deletePost);

// Comments CRUD
router.post('/comments', auth, validate(createCommentSchema), communityController.createComment);
router.delete('/comments/:id', auth, communityController.deleteComment);

// Likes CRUD
router.post('/likes', auth, validate(createLikeSchema), communityController.likePost);
router.delete('/likes/:id', auth, communityController.unlikePost);

// Saves CRUD
router.post('/save', auth, communityController.savePost);
router.delete('/save/:id', auth, communityController.unsavePost);
router.get('/saved', auth, communityController.listSavedPosts);

// Moderation / Flag
router.post('/report', auth, communityController.reportPost);

export default router;
