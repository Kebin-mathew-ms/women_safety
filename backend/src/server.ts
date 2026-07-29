import http from 'http';
import app from './app';
import { config } from './config';
import logger from './utils/logger';
import { socketManager } from './socket';
import { verifyDbConnection, disconnectDb } from './services/db.service';
import { MaintenanceService } from './services/maintenance.service';

const startServer = async () => {
  try {
    // 1. Verify Database Connection
    logger.info('Verifying database connection...');
    const isDbConnected = await verifyDbConnection();
    if (!isDbConnected) {
      logger.warn('⚠️ Starting server without successful database connection verification.');
    }

    // 2. Start HTTP Express Server
    const apiServer = http.createServer(app);
    apiServer.listen(config.PORT, () => {
      logger.info(`✅ Express Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });

    // 3. Start Socket.IO Server on distinct SOCKET_PORT
    const socketHttpServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Safe Travel Socket Server\n');
    });
    
    socketManager.initialize(socketHttpServer);
    
    socketHttpServer.listen(config.SOCKET_PORT, () => {
      logger.info(`✅ Socket.IO Server running on port ${config.SOCKET_PORT}`);
    });

    // 4. Initialize Maintenance Scheduler
    MaintenanceService.startScheduler();

    // 5. Handle Shutdown Signals Gracefully
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      apiServer.close(() => {
        logger.info('Express API server closed.');
      });
      
      socketManager.close();
      socketHttpServer.close(() => {
        logger.info('Socket HTTP server closed.');
      });

      await disconnectDb();
      process.exit(0);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
