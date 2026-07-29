import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';

export const listStations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stations = await prisma.policeStation.findMany();
    ResponseHelper.success(res, 'Police stations listed successfully', stations);
  } catch (error) {
    next(error);
  }
};

export const listNearbyStations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // Radius in km

    let stations = await prisma.policeStation.findMany();

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const r = parseFloat(radius as string);
      const R = 6371; // Earth radius in km

      stations = stations.filter((item) => {
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

      stations.sort((a: any, b: any) => a.distance - b.distance);
    }

    ResponseHelper.success(res, 'Nearby police stations fetched successfully', stations);
  } catch (error) {
    next(error);
  }
};
export default { listStations, listNearbyStations };
