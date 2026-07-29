import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

// Helper: update comments count on post
const updateCommentsCount = async (postId: string) => {
  const count = await prisma.postComment.count({ where: { postId } });
  await prisma.communityPost.update({
    where: { postId },
    data: { comments: count },
  });
};

// Helper: update likes count on post
const updateLikesCount = async (postId: string) => {
  const count = await prisma.postLike.count({ where: { postId } });
  await prisma.communityPost.update({
    where: { postId },
    data: { likes: count },
  });
};

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, category, anonymous, latitude, longitude, address, visibility } = req.body;

    const newPost = await prisma.communityPost.create({
      data: {
        userId,
        title,
        description,
        category,
        anonymous: anonymous || false,
        latitude,
        longitude,
        address,
        visibility: visibility || 'public',
      },
    });

    socketManager.emitToRoom('admin-operators', 'post-created', newPost);
    logger.info(`Community post created: ${newPost.postId} by user ${userId}`);
    ResponseHelper.success(res, 'Post published successfully', newPost, 201);
  } catch (error) {
    next(error);
  }
};

export const listPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, sort, latitude, longitude, radius = 10 } = req.query; // Radius in km
    const whereClause: any = { deletedAt: null };

    if (category && typeof category === 'string') {
      whereClause.category = category;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let orderByClause: any = { createdAt: 'desc' };
    if (sort === 'trending') {
      orderByClause = { likes: 'desc' };
    }

    let posts = await prisma.communityPost.findMany({
      where: whereClause,
      include: {
        user: {
          select: { fullName: true, profileImage: true },
        },
        images: true,
      },
      orderBy: orderByClause,
    });

    // Run Haversine filter if lat, lon exist
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const r = parseFloat(radius as string);
      const R = 6371; // Earth radius in km

      posts = posts.filter((item) => {
        if (!item.latitude || !item.longitude) return false;
        const dLat = ((item.latitude - lat) * Math.PI) / 180;
        const dLon = ((item.longitude - lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((item.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        (item as any).distance = distance;
        return distance <= r;
      });
    }

    // Map anonymous flags
    const mapped = posts.map((item) => {
      if (item.anonymous) {
        return {
          ...item,
          user: { fullName: 'Anonymous Member', profileImage: null },
        };
      }
      return item;
    });

    ResponseHelper.success(res, 'Community posts retrieved successfully', mapped);
  } catch (error) {
    next(error);
  }
};

export const getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await prisma.communityPost.findUnique({
      where: { postId: id },
      include: {
        user: {
          select: { fullName: true, profileImage: true },
        },
        images: true,
        postComments: {
          include: {
            user: { select: { fullName: true, profileImage: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post || post.deletedAt) throw new NotFoundError('Post not found');

    // Increment views
    await prisma.communityPost.update({
      where: { postId: id },
      data: { views: { increment: 1 } },
    });

    if (post.anonymous) {
      post.user = { fullName: 'Anonymous Member', profileImage: null } as any;
    }

    ResponseHelper.success(res, 'Post details retrieved successfully', post);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    const post = await prisma.communityPost.findUnique({ where: { postId: id } });
    if (!post || post.deletedAt) throw new NotFoundError('Post not found');

    if (post.userId !== userId) {
      throw new UnauthorizedError('Access Denied: Only the post creator can update this post.');
    }

    const updated = await prisma.communityPost.update({
      where: { postId: id },
      data: updateData,
    });

    socketManager.emitToRoom('admin-operators', 'post-updated', updated);
    ResponseHelper.success(res, 'Post updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({ where: { postId: id } });
    if (!post || post.deletedAt) throw new NotFoundError('Post not found');

    if (post.userId !== userId) {
      throw new UnauthorizedError('Access Denied: Only the post creator can delete this post.');
    }

    // Soft delete
    await prisma.communityPost.update({
      where: { postId: id },
      data: { deletedAt: new Date() },
    });

    socketManager.emitToRoom('admin-operators', 'post-deleted', { postId: id });
    ResponseHelper.success(res, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// COMMENTS
// ----------------------------------------------------
export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { postId, comment } = req.body;

    const post = await prisma.communityPost.findUnique({ where: { postId } });
    if (!post) throw new NotFoundError('Post not found');

    const newComment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        comment,
      },
    });

    await updateCommentsCount(postId);

    socketManager.emitToRoom(`post:${postId}`, 'comment-added', newComment);
    ResponseHelper.success(res, 'Comment added successfully', newComment, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const commentObj = await prisma.postComment.findUnique({ where: { commentId: id } });
    if (!commentObj) throw new NotFoundError('Comment not found');

    if (commentObj.userId !== userId) {
      throw new UnauthorizedError('Access Denied: Only the creator can delete this comment.');
    }

    await prisma.postComment.delete({ where: { commentId: id } });
    await updateCommentsCount(commentObj.postId);

    socketManager.emitToRoom(`post:${commentObj.postId}`, 'comment-deleted', { commentId: id });
    ResponseHelper.success(res, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// LIKES
// ----------------------------------------------------
export const likePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { postId } = req.body;

    const post = await prisma.communityPost.findUnique({ where: { postId } });
    if (!post) throw new NotFoundError('Post not found');

    // Create like entry if not exists
    const like = await prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });

    await updateLikesCount(postId);

    socketManager.emitToRoom(`post:${postId}`, 'post-liked', { postId, userId, likesCount: post.likes + 1 });
    ResponseHelper.success(res, 'Post liked successfully', like);
  } catch (error) {
    next(error);
  }
};

export const unlikePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params; // Post ID

    await prisma.postLike.delete({
      where: { postId_userId: { postId: id, userId } },
    });

    await updateLikesCount(id);

    ResponseHelper.success(res, 'Post unliked successfully');
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// SAVES
// ----------------------------------------------------
export const savePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { postId } = req.body;

    const post = await prisma.communityPost.findUnique({ where: { postId } });
    if (!post) throw new NotFoundError('Post not found');

    const saved = await prisma.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      update: {},
      create: { userId, postId },
    });

    ResponseHelper.success(res, 'Post saved successfully', saved);
  } catch (error) {
    next(error);
  }
};

export const unsavePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params; // Post ID

    await prisma.savedPost.delete({
      where: { userId_postId: { userId, postId: id } },
    });

    ResponseHelper.success(res, 'Post unsaved successfully');
  } catch (error) {
    next(error);
  }
};

export const listSavedPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const saves = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const posts = saves.map((s) => {
      if (s.post.anonymous) {
        s.post.user = { fullName: 'Anonymous Member' } as any;
      }
      return s.post;
    });

    ResponseHelper.success(res, 'Saved posts retrieved successfully', posts);
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// MODERATION
// ----------------------------------------------------
export const reportPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { postId, reason, description } = req.body;

    const report = await prisma.reportedPost.create({
      data: {
        postId,
        reportedBy: userId,
        reason,
        description,
      },
    });

    ResponseHelper.success(res, 'Post reported successfully', report, 201);
  } catch (error) {
    next(error);
  }
};
