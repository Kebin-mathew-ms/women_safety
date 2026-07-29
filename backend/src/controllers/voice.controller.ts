import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import logger from '../utils/logger';

export const parseVoiceCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { command } = req.body;

    const lower = command.toLowerCase().trim();
    let action = 'unknown';
    let responseText = 'Command not recognized. Please retry stating safety keywords.';

    if (lower.includes('sos') || lower.includes('emergency') || lower.includes('help')) {
      if (lower.includes('cancel')) {
        action = 'sos_cancel';
        responseText = 'SOS emergency beacon cancellation request registered.';
      } else {
        action = 'sos_trigger';
        responseText = 'Intelligent Voice SOS activated. Emitting emergency coordinates to guardians.';
      }
    } else if (lower.includes('home')) {
      action = 'navigate_home';
      responseText = 'Routing safety path to your home address.';
    } else if (lower.includes('share') || lower.includes('location')) {
      action = 'share_location';
      responseText = 'Sharing current coordinates logs with your primary emergency contacts.';
    } else if (lower.includes('police')) {
      action = 'find_police';
      responseText = 'Searching for nearest OpenStreetMap police stations.';
    } else if (lower.includes('hospital')) {
      action = 'find_hospital';
      responseText = 'Searching for nearest emergency hospitals.';
    } else if (lower.includes('hotel') || lower.includes('hostel') || lower.includes('pg')) {
      action = 'find_hotel';
      responseText = 'Locating nearby verified safe hotels and PGs.';
    } else if (lower.includes('start')) {
      action = 'start_trip';
      responseText = 'Safe tracking journey monitoring enabled.';
    } else if (lower.includes('stop') || lower.includes('complete')) {
      action = 'stop_trip';
      responseText = 'Journey tracking stopped and marked completed.';
    }

    // Save history
    const voiceLog = await prisma.voiceCommand.create({
      data: {
        userId,
        command,
        action,
      },
    });

    socketManager.emitToRoom(`user:${userId}`, 'voice-command', {
      command: voiceLog,
      responseText,
    });

    logger.info(`Voice command parsed: "${command}" -> Action: ${action} for user ${userId}`);
    ResponseHelper.success(res, 'Voice command processed successfully', {
      logId: voiceLog.commandId,
      action,
      responseText,
    });
  } catch (error) {
    next(error);
  }
};

export const listVoiceHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const history = await prisma.voiceCommand.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'Voice commands log history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
};
