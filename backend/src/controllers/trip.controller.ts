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
    let {
      tripName,
      sourceAddress,
      destinationAddress,
      sourceLatitude,
      sourceLongitude,
      destinationLatitude,
      destinationLongitude,
      travelMode,
    } = req.body;

    // 1. Geocode source location if missing or zero
    let srcLat = parseFloat(sourceLatitude) || 0;
    let srcLon = parseFloat(sourceLongitude) || 0;
    if (srcLat === 0 && srcLon === 0) {
      const srcQuery = (sourceAddress && !sourceAddress.includes('Current')) ? sourceAddress : 'Trivandrum';
      const srcResults = await OsmService.searchAddress(srcQuery);
      if (srcResults.length > 0) {
        srcLat = srcResults[0].latitude;
        srcLon = srcResults[0].longitude;
        sourceAddress = srcResults[0].address;
      } else {
        throw new NotFoundError(`Starting location "${srcQuery}" could not be found. Please enter a valid place name.`);
      }
    }

    // 2. Geocode destination location if missing or zero
    let destLat = parseFloat(destinationLatitude) || 0;
    let destLon = parseFloat(destinationLongitude) || 0;
    if (destLat === 0 && destLon === 0) {
      if (!destinationAddress) {
        throw new BadRequestError('Destination address is required to create a trip.');
      }
      const destResults = await OsmService.searchAddress(destinationAddress);
      if (destResults.length > 0) {
        destLat = destResults[0].latitude;
        destLon = destResults[0].longitude;
        destinationAddress = destResults[0].address;
      } else {
        throw new NotFoundError(`Destination location "${destinationAddress}" could not be found. Please check spelling or enter a valid place name.`);
      }
    }

    // 3. Calculate OSRM route between real coordinates
    const route = await OsmService.calculateRoute(
      srcLat,
      srcLon,
      destLat,
      destLon
    );

    const formattedDistance = Math.round(route.distance * 10) / 10;
    const formattedDuration = Math.round(route.duration);

    const newTrip = await prisma.trip.create({
      data: {
        userId,
        tripName: tripName || `Trip to ${destinationAddress.split(',')[0]}`,
        sourceAddress: sourceAddress || 'Starting Location',
        destinationAddress,
        sourceLatitude: srcLat,
        sourceLongitude: srcLon,
        destinationLatitude: destLat,
        destinationLongitude: destLon,
        travelMode: travelMode || 'driving',
        estimatedDistance: formattedDistance, // in km
        estimatedDuration: formattedDuration, // in minutes
        status: 'created',
      },
    });

    logger.info(`Trip created: ${newTrip.tripId} for user ${userId} (${formattedDistance} km)`);
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
