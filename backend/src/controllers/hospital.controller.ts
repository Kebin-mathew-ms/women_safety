import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';

export const listHospitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hospitals = await prisma.hospital.findMany();
    ResponseHelper.success(res, 'Hospitals listed successfully', hospitals);
  } catch (error) {
    next(error);
  }
};

export const listNearbyHospitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // Radius in km

    let hospitals = await prisma.hospital.findMany();

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const r = parseFloat(radius as string);
      const R = 6371; // Earth radius in km

      hospitals = hospitals.filter((item) => {
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

      hospitals.sort((a: any, b: any) => a.distance - b.distance);
    }

    ResponseHelper.success(res, 'Nearby hospitals fetched successfully', hospitals);
  } catch (error) {
    next(error);
  }
};
export default { listHospitals, listNearbyHospitals };
