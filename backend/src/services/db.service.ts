import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

class DatabaseService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Bind Prisma events to the Winston logger
      (DatabaseService.instance as any).$on('query', (e: any) => {
        logger.debug(`Prisma Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
      });

      (DatabaseService.instance as any).$on('error', (e: any) => {
        logger.error(`Prisma Error: ${e.message}`);
      });

      (DatabaseService.instance as any).$on('warn', (e: any) => {
        logger.warn(`Prisma Warning: ${e.message}`);
      });

      (DatabaseService.instance as any).$on('info', (e: any) => {
        logger.info(`Prisma Info: ${e.message}`);
      });
    }

    return DatabaseService.instance;
  }

  /**
   * Checks database connectivity
   * @returns boolean indicating if the database is reachable
   */
  public static async verifyConnection(): Promise<boolean> {
    const client = DatabaseService.getInstance();
    try {
      // Execute simple query to test connection
      await client.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection verified successfully.');
      return true;
    } catch (error: any) {
      logger.error(`❌ Database connection verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      logger.info('Database service disconnected.');
    }
  }
}

export const prisma = DatabaseService.getInstance();
export const verifyDbConnection = DatabaseService.verifyConnection;
export const disconnectDb = DatabaseService.disconnect;
export default prisma;
