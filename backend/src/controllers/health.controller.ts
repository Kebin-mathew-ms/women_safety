import { Request, Response, NextFunction } from 'express';
import { verifyDbConnection } from '../services/db.service';
import socketManager from '../socket';
import ResponseHelper from '../utils/response';
import logger from '../utils/logger';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const getHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isDbConnected = await verifyDbConnection();
    const socketStatus = socketManager.getStatus();

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Ping Ollama local AI server
    let aiStatus = 'OFFLINE';
    try {
      const ollamaRes = await axios.get('http://localhost:11434/api/tags', { timeout: 1000 }).catch(() => null);
      if (ollamaRes && ollamaRes.status === 200) {
        aiStatus = 'ONLINE';
      }
    } catch {
      aiStatus = 'OFFLINE';
    }

    // foot print of Uploads folder
    let uploadsFolderSize = 0;
    try {
      const uploadsPath = path.resolve(__dirname, '../../uploads');
      const getDirSize = (dir: string): number => {
        let size = 0;
        if (!fs.existsSync(dir)) return size;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            size += getDirSize(filePath);
          } else {
            size += stat.size;
          }
        }
        return size;
      };
      uploadsFolderSize = getDirSize(uploadsPath);
    } catch {
      uploadsFolderSize = 0;
    }

    const healthInfo = {
      status: 'UP',
      uptime: `${Math.floor(uptime)}s`,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
        },
        socket: {
          status: socketStatus.initialized ? 'RUNNING' : 'STOPPED',
          connections: socketStatus.activeConnections,
        },
        ai: {
          status: aiStatus,
          endpoint: 'http://localhost:11434',
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        },
        storage: {
          uploadsDirFootprint: `${Math.round(uploadsFolderSize / 1024)} KB`,
        },
      },
    };

    logger.debug('Health check API invoked successfully');
    ResponseHelper.success(res, 'Health status fetched successfully', healthInfo);
  } catch (error) {
    logger.error('Health check failed', error);
    next(error);
  }
};
