import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export const createCrimeReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { latitude, longitude, address, category, severity, description, anonymous } = req.body;

    const report = await prisma.crimeReport.create({
      data: {
        userId,
        latitude,
        longitude,
        address,
        category,
        severity: severity || 'medium',
        description,
        anonymous: anonymous || false,
        status: 'pending', // Requires admin approval
      },
    });

    socketManager.emitToRoom('admin-operators', 'crime-report-added', report);
    logger.info(`Crime report added: ${report.reportId} by user ${userId}`);
    ResponseHelper.success(res, 'Hazard report submitted for verification', report, 201);
  } catch (error) {
    next(error);
  }
};

export const listCrimeReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query;
    const whereClause: any = {};
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const reports = await prisma.crimeReport.findMany({
      where: whereClause,
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Handle anonymous flag mapping
    const mapped = reports.map((item) => {
      if (item.anonymous) {
        return { ...item, user: { fullName: 'Anonymous Contributor' } };
      }
      return item;
    });

    ResponseHelper.success(res, 'Crime reports listed successfully', mapped);
  } catch (error) {
    next(error);
  }
};

export const getCrimeHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reports = await prisma.crimeReport.findMany({
      where: {
        status: { in: ['approved', 'pending'] }, // Include pending for immediate test visibility
      },
      select: {
        reportId: true,
        latitude: true,
        longitude: true,
        severity: true,
        category: true,
        address: true,
      },
    });

    // Map severities to visual threat indices
    const heatmapPoints = reports.map((report) => {
      let riskLevel = 'Safe';
      let radius = 100; // Visual radius in meters
      let color = '#10b981'; // Green

      if (report.severity === 'high') {
        riskLevel = 'Danger Zone';
        radius = 250;
        color = '#ef4444'; // Red
      } else if (report.severity === 'medium') {
        riskLevel = 'High Risk';
        radius = 180;
        color = '#f59e0b'; // Amber
      } else {
        riskLevel = 'Medium Risk';
        radius = 120;
        color = '#3b82f6'; // Blue
      }

      return {
        id: report.reportId,
        latitude: report.latitude,
        longitude: report.longitude,
        severity: report.severity,
        category: report.category,
        address: report.address,
        riskLevel,
        radius,
        color,
      };
    });

    ResponseHelper.success(res, 'Heatmap calculations compiled successfully', heatmapPoints);
  } catch (error) {
    next(error);
  }
};

export const updateCrimeReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await prisma.crimeReport.findUnique({ where: { reportId: id } });
    if (!report) throw new NotFoundError('Crime report not found');

    const updated = await prisma.crimeReport.update({
      where: { reportId: id },
      data: { status },
    });

    socketManager.emitToRoom('admin-operators', 'crime-report-updated', updated);
    socketManager.emitToRoom('admin-operators', 'heatmap-updated', {
      timestamp: new Date().toISOString(),
    });

    ResponseHelper.success(res, 'Crime report status updated successfully', updated);
  } catch (error) {
    next(error);
  }
};
export default { createCrimeReport, listCrimeReports, getCrimeHeatmap, updateCrimeReportStatus };
