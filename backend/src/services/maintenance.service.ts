import fs from 'fs';
import path from 'path';
import prisma from './db.service';
import logger from '../utils/logger';
import { config } from '../config';

export class MaintenanceService {
  // ─── 1. Clean read notifications older than 30 days ───────────────────────
  static async cleanupNotifications(): Promise<number> {
    const cutOff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutOff },
      },
    });
    logger.info(`🧹 Maintenance: Cleaned ${result.count} old read notifications.`);
    return result.count;
  }

  // ─── 2. Force end old active tracking sessions (older than 24h) ───────────
  static async cleanupTracking(): Promise<number> {
    const cutOff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.liveTrackingSession.updateMany({
      where: {
        status: 'active',
        startedAt: { lt: cutOff },
      },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });
    logger.info(`🧹 Maintenance: Ended ${result.count} stale tracking sessions.`);
    return result.count;
  }

  // ─── 3. AI Cache Purge (older than 90 days) ────────────────────────────────
  static async cleanupAICache(): Promise<number> {
    const cutOff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await prisma.aIConversations.deleteMany({
      where: {
        createdAt: { lt: cutOff },
      },
    });
    logger.info(`🧹 Maintenance: Purged ${result.count} old AI conversations.`);
    return result.count;
  }

  // ─── 4. Delete unreferenced upload files from disk ─────────────────────────
  static async cleanupOrphanUploads(): Promise<number> {
    let deletedCount = 0;
    try {
      const profileUploadsDir = path.resolve(__dirname, '../../uploads/profile');
      if (!fs.existsSync(profileUploadsDir)) return 0;

      // Read files on disk
      const files = fs.readdirSync(profileUploadsDir);
      if (files.length === 0) return 0;

      // Query database users who have a profile image
      const dbUsers = await prisma.user.findMany({
        where: { profileImage: { not: null } },
        select: { profileImage: true },
      });

      const referencedFiles = new Set(
        dbUsers
          .map((u) => {
            const filename = u.profileImage?.split('/').pop();
            return filename;
          })
          .filter(Boolean)
      );

      for (const file of files) {
        // Skip hidden files
        if (file.startsWith('.')) continue;

        if (!referencedFiles.has(file)) {
          const filePath = path.join(profileUploadsDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      logger.info(`🧹 Maintenance: Deleted ${deletedCount} orphaned profile images from storage.`);
    } catch (err) {
      logger.error('Failed to cleanup orphan uploads', err);
    }
    return deletedCount;
  }

  // ─── Trigger all cleaners ───────────────────────────────────────────────
  static async runAll(): Promise<void> {
    logger.info('🏃 Starting Scheduled Maintenance Task Run...');
    try {
      await MaintenanceService.cleanupNotifications();
      await MaintenanceService.cleanupTracking();
      await MaintenanceService.cleanupAICache();
      await MaintenanceService.cleanupOrphanUploads();
      logger.info('🎉 Scheduled Maintenance completed successfully.');
    } catch (err) {
      logger.error('Maintenance execution encountered an error:', err);
    }
  }

  // ─── Initialize recurring daily interval ─────────────────────────────
  static startScheduler(intervalMs = 24 * 60 * 60 * 1000): void {
    logger.info('⏰ Maintenance Scheduler successfully initialized (daily intervals).');
    // Run immediately on start
    MaintenanceService.runAll();
    // Run periodically
    setInterval(() => {
      MaintenanceService.runAll();
    }, intervalMs);
  }
}

export default MaintenanceService;
