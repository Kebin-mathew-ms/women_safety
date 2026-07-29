import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import AuditService from '../services/audit.service';

// GET /api/admin/community/posts
export const listPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, category, reported, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = { deletedAt: null };
    if (category) where.category = category;

    const [total, posts] = await Promise.all([
      prisma.communityPost.count({ where }),
      prisma.communityPost.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
          _count: { select: { postComments: true, postLikes: true, reportedPosts: true } },
        },
      }),
    ]);

    ResponseHelper.success(res, 'Community posts retrieved', { total, posts });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/community/posts/:postId/hide
export const hidePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await prisma.communityPost.findUnique({ where: { postId } });
    if (!post) throw new NotFoundError('Post not found');

    // Soft delete = hide
    const updated = await prisma.communityPost.update({ where: { postId }, data: { deletedAt: new Date() } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'community',
      action: 'HIDE',
      entityType: 'CommunityPost',
      entityId: postId,
      ipAddress: req.ip,
    });

    ResponseHelper.success(res, 'Post hidden', updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/community/posts/:postId
export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    await prisma.communityPost.update({ where: { postId }, data: { deletedAt: new Date() } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'community',
      action: 'DELETE',
      entityType: 'CommunityPost',
      entityId: postId,
      ipAddress: req.ip,
    });

    ResponseHelper.success(res, 'Post deleted', null);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/community/reports
export const listReportedPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, reports] = await Promise.all([
      prisma.reportedPost.count({ where }),
      prisma.reportedPost.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          post: { include: { user: { select: { fullName: true, email: true } } } },
          reporter: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    ResponseHelper.success(res, 'Reported posts retrieved', { total, reports });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/community/reports/:reportId
export const resolveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reportId } = req.params;
    const { action } = req.body; // dismiss | delete_post

    const report = await prisma.reportedPost.findUnique({ where: { reportId } });
    if (!report) throw new NotFoundError('Report not found');

    if (action === 'delete_post') {
      await prisma.communityPost.update({ where: { postId: report.postId }, data: { deletedAt: new Date() } });
    }

    await prisma.reportedPost.update({ where: { reportId }, data: { status: action === 'dismiss' ? 'reviewed' : 'deleted' } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'community',
      action: action === 'dismiss' ? 'DISMISS_REPORT' : 'DELETE',
      entityType: 'ReportedPost',
      entityId: reportId,
      ipAddress: req.ip,
      newValues: { action },
    });

    ResponseHelper.success(res, 'Report resolved', null);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/community/users/:userId/ban
export const banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundError('User not found');

    await prisma.user.update({ where: { userId }, data: { isBlocked: true } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'community',
      action: 'BAN',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      newValues: { reason },
    });

    ResponseHelper.success(res, 'User banned', null);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/community/users/:userId/mute
export const muteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Mute = deactivate (can still view but cannot post)
    await prisma.user.update({ where: { userId }, data: { isActive: false } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'community',
      action: 'MUTE',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      newValues: { reason },
    });

    ResponseHelper.success(res, 'User muted', null);
  } catch (err) {
    next(err);
  }
};
