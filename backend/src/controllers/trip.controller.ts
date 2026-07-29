import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import OsmService from '../services/osm.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

export const createTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const {
      tripName,
      sourceAddress,
      destinationAddress,
      sourceLatitude,
      sourceLongitude,
      destinationLatitude,
      destinationLongitude,
      travelMode,
    } = req.body;

    // Call OSM Service to calculate estimated distance, duration, and route polyline path
    const route = await OsmService.calculateRoute(
      sourceLatitude,
      sourceLongitude,
      destinationLatitude,
      destinationLongitude
    );

    const newTrip = await prisma.trip.create({
      data: {
        userId,
        tripName: tripName || 'My Safe Trip',
        sourceAddress,
        destinationAddress,
        sourceLatitude,
        sourceLongitude,
        destinationLatitude,
        destinationLongitude,
        travelMode: travelMode || 'driving',
        estimatedDistance: route.distance, // in km
        estimatedDuration: route.duration, // in minutes
        status: 'created',
      },
    });

    logger.info(`Trip created: ${newTrip.tripId} for user ${userId}`);
    ResponseHelper.success(res, 'Trip created successfully', {
      trip: newTrip,
      routeCoordinates: route.coordinates,
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const listTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Trips listed successfully', trips);
  } catch (error) {
    next(error);
  }
};

export const getTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({
      where: { tripId: id, userId },
      include: {
        locations: {
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError('Trip not found or unauthorized');
    }

    ResponseHelper.success(res, 'Trip details retrieved successfully', trip);
  } catch (error) {
    next(error);
  }
};

export const editTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updatedTrip = await prisma.trip.update({
      where: { tripId: id },
      data: updateData,
    });

    ResponseHelper.success(res, 'Trip updated successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    await prisma.trip.delete({ where: { tripId: id } });

    logger.info(`Trip deleted: ${id}`);
    ResponseHelper.success(res, 'Trip deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// TRIP STATUS TRANSITIONS
// ----------------------------------------------------

export const startTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updatedTrip = await prisma.trip.update({
      where: { tripId: id },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });

    // Broadcast socket trip status update
    socketManager.emitToRoom(`trip:${id}`, 'trip-status-update', {
      tripId: id,
      status: 'active',
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip started: ${id}`);
    ResponseHelper.success(res, 'Trip started successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

export const pauseTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updatedTrip = await prisma.trip.update({
      where: { tripId: id },
      data: { status: 'paused' },
    });

    socketManager.emitToRoom(`trip:${id}`, 'trip-status-update', {
      tripId: id,
      status: 'paused',
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip paused: ${id}`);
    ResponseHelper.success(res, 'Trip paused successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

export const resumeTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updatedTrip = await prisma.trip.update({
      where: { tripId: id },
      data: { status: 'active' },
    });

    socketManager.emitToRoom(`trip:${id}`, 'trip-status-update', {
      tripId: id,
      status: 'active',
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip resumed: ${id}`);
    ResponseHelper.success(res, 'Trip resumed successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

export const completeTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updatedTrip = await prisma.trip.update({
      where: { tripId: id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    socketManager.emitToRoom(`trip:${id}`, 'trip-status-update', {
      tripId: id,
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip completed: ${id}`);
    ResponseHelper.success(res, 'Trip completed successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

export const cancelTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({ where: { tripId: id, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    const updatedTrip = await prisma.trip.update({
      where: { tripId: id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    socketManager.emitToRoom(`trip:${id}`, 'trip-status-update', {
      tripId: id,
      status: 'cancelled',
      timestamp: new Date().toISOString(),
    });

    logger.info(`Trip cancelled: ${id}`);
    ResponseHelper.success(res, 'Trip cancelled successfully', updatedTrip);
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// LOCATION LOGGING & HISTORY
// ----------------------------------------------------

export const logLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { tripId, latitude, longitude, speed, heading, accuracy } = req.body;

    const trip = await prisma.trip.findFirst({ where: { tripId, userId } });
    if (!trip) throw new NotFoundError('Trip not found');

    if (trip.status !== 'active') {
      throw new BadRequestError('Cannot log locations on an inactive trip');
    }

    const savedLoc = await prisma.tripLocation.create({
      data: {
        tripId,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
      },
    });

    // Update current location coordinates in User details
    await prisma.user.update({
      where: { userId },
      data: { latitude, longitude },
    });

    // Broadcast location update using sockets
    socketManager.emitToRoom(`trip:${tripId}`, 'location-update', {
      tripId,
      locationId: savedLoc.locationId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      recordedAt: savedLoc.recordedAt.toISOString(),
    });

    ResponseHelper.success(res, 'Location logged successfully', savedLoc, 201);
  } catch (error) {
    next(error);
  }
};

export const getTripHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const history = await prisma.trip.findMany({
      where: {
        userId,
        status: { in: ['completed', 'cancelled'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Trip history fetched successfully', history);
  } catch (error) {
    next(error);
  }
};
