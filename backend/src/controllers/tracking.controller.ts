import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export const startTracking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { tripId } = req.body;

    const session = await prisma.liveTrackingSession.create({
      data: {
        userId,
        tripId,
        status: 'active',
        startedAt: new Date(),
      },
    });

    socketManager.emitToRoom('admin-operators', 'tracking-started', {
      sessionId: session.sessionId,
      userId,
      tripId,
      timestamp: session.startedAt.toISOString(),
    });

    logger.info(`Live tracking session started: ${session.sessionId}`);
    ResponseHelper.success(res, 'Live tracking session started successfully', session, 201);
  } catch (error) {
    next(error);
  }
};

export const stopTracking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.body;

    const session = await prisma.liveTrackingSession.findUnique({ where: { sessionId } });
    if (!session) throw new NotFoundError('Live tracking session not found');

    const updatedSession = await prisma.liveTrackingSession.update({
      where: { sessionId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    socketManager.emitToRoom('admin-operators', 'tracking-stopped', {
      sessionId,
      timestamp: updatedSession.endedAt?.toISOString(),
    });

    logger.info(`Live tracking session stopped: ${sessionId}`);
    ResponseHelper.success(res, 'Live tracking session ended successfully', updatedSession);
  } catch (error) {
    next(error);
  }
};

export const getTrackingSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.liveTrackingSession.findUnique({
      where: { sessionId },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        viewers: true,
      },
    });

    if (!session) throw new NotFoundError('Session not found');
    ResponseHelper.success(res, 'Live tracking session retrieved successfully', session);
  } catch (error) {
    next(error);
  }
};
