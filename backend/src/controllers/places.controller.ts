import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export const createSafePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const newPlace = await prisma.safePlace.create({
      data,
    });

    socketManager.emitToRoom('admin-operators', 'safe-place-added', newPlace);
    logger.info(`Safe Place created: ${newPlace.placeId} - ${newPlace.name}`);
    ResponseHelper.success(res, 'Safe place created successfully', newPlace, 201);
  } catch (error) {
    next(error);
  }
};

export const listSafePlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius, // in km
      category,
      womenOnly,
      verified,
      cctv,
      securityGuard,
      search,
    } = req.query;

    const whereClause: any = {};

    if (category && typeof category === 'string') {
      whereClause.category = category;
    }
    if (womenOnly === 'true') {
      whereClause.womenOnly = true;
    }
    if (verified === 'true') {
      whereClause.verified = true;
    }
    if (cctv === 'true') {
      whereClause.cctv = true;
    }
    if (securityGuard === 'true') {
      whereClause.securityGuard = true;
    }
    if (search && typeof search === 'string') {
      whereClause.name = { contains: search };
    }

    let places = await prisma.safePlace.findMany({
      where: whereClause,
      include: {
        images: true,
      },
    });

    // Run Haversine filter if lat, lon, and radius are queried
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const r = parseFloat(radius as string);
      const R = 6371; // Earth radius in km

      places = places.filter((item) => {
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

      // Sort by nearest first
      places.sort((a: any, b: any) => a.distance - b.distance);
    }

    ResponseHelper.success(res, 'Safe places retrieved successfully', places);
  } catch (error) {
    next(error);
  }
};

export const getSafePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const place = await prisma.safePlace.findUnique({
      where: { placeId: id },
      include: {
        images: true,
        reviews: {
          include: {
            user: {
              select: { fullName: true, profileImage: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!place) throw new NotFoundError('Safe place not found');
    ResponseHelper.success(res, 'Safe place details retrieved successfully', place);
  } catch (error) {
    next(error);
  }
};

export const updateSafePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const place = await prisma.safePlace.findUnique({ where: { placeId: id } });
    if (!place) throw new NotFoundError('Safe place not found');

    const updatedPlace = await prisma.safePlace.update({
      where: { placeId: id },
      data: updateData,
    });

    ResponseHelper.success(res, 'Safe place updated successfully', updatedPlace);
  } catch (error) {
    next(error);
  }
};

export const deleteSafePlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const place = await prisma.safePlace.findUnique({ where: { placeId: id } });
    if (!place) throw new NotFoundError('Safe place not found');

    await prisma.safePlace.delete({ where: { placeId: id } });

    logger.info(`Safe Place deleted: ${id}`);
    ResponseHelper.success(res, 'Safe place deleted successfully');
  } catch (error) {
    next(error);
  }
};
