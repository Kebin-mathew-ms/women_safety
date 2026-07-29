import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export const listPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const places = await prisma.savedPlace.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Saved places retrieved successfully', places);
  } catch (error) {
    next(error);
  }
};

export const createPlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { placeName, latitude, longitude, address, category } = req.body;

    const newPlace = await prisma.savedPlace.create({
      data: {
        userId,
        placeName,
        latitude,
        longitude,
        address,
        category: category || 'custom',
      },
    });

    logger.info(`Saved place created: ${newPlace.placeId} for user ${userId}`);
    ResponseHelper.success(res, 'Place saved successfully', newPlace, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    const place = await prisma.savedPlace.findFirst({ where: { placeId: id, userId } });
    if (!place) throw new NotFoundError('Saved place not found');

    const updatedPlace = await prisma.savedPlace.update({
      where: { placeId: id },
      data: updateData,
    });

    ResponseHelper.success(res, 'Saved place updated successfully', updatedPlace);
  } catch (error) {
    next(error);
  }
};

export const deletePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const place = await prisma.savedPlace.findFirst({ where: { placeId: id, userId } });
    if (!place) throw new NotFoundError('Saved place not found');

    await prisma.savedPlace.delete({ where: { placeId: id } });

    logger.info(`Saved place deleted: ${id}`);
    ResponseHelper.success(res, 'Saved place deleted successfully');
  } catch (error) {
    next(error);
  }
};
