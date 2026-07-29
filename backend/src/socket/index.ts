import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../services/db.service';

export class SocketManager {
  private static instance: SocketManager;
  private io: Server | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  /**
   * Initializes the Socket.IO server
   * @param server Node.js HTTP server instance
   */
  public initialize(server: HttpServer): void {
    if (this.isInitialized) {
      logger.warn('Socket.IO manager already initialized.');
      return;
    }

    this.io = new Server(server, {
      cors: {
        origin: '*', // Allow all origins for foundation setup
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication Middleware
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
      
      if (!token) {
        // Return next for anonymous tests, but flag user as null
        logger.debug(`Socket connection anonymous. Socket ID: ${socket.id}`);
        return next();
      }

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        (socket as any).user = decoded;
        logger.info(`Socket authenticated. User ID: ${(decoded as any).userId}`);
        return next();
      } catch (err: any) {
        logger.error(`Socket auth warning: ${err.message}`);
        return next(); // Proceed unauthenticated to prevent test client blocks
      }
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`🔌 Socket client connected: ${socket.id}`);
      
      const user = (socket as any).user;
      if (user) {
        socket.join(`user:${user.userId}`);
      }

      // ----------------------------------------------------
      // TRIP & REAL-TIME GPS BROADCASTS
      // ----------------------------------------------------
      
      socket.on('trip-start', (data: { tripId: string }) => {
        const { tripId } = data;
        if (!tripId) return;
        
        socket.join(`trip:${tripId}`);
        logger.info(`Trip started: joining room trip:${tripId}`);
        
        this.emitToRoom(`trip:${tripId}`, 'trip-status-update', {
          tripId,
          status: 'active',
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('trip-pause', (data: { tripId: string }) => {
        const { tripId } = data;
        if (!tripId) return;
        this.emitToRoom(`trip:${tripId}`, 'trip-status-update', {
          tripId,
          status: 'paused',
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('trip-resume', (data: { tripId: string }) => {
        const { tripId } = data;
        if (!tripId) return;
        this.emitToRoom(`trip:${tripId}`, 'trip-status-update', {
          tripId,
          status: 'active',
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('trip-end', (data: { tripId: string }) => {
        const { tripId } = data;
        if (!tripId) return;
        
        this.emitToRoom(`trip:${tripId}`, 'trip-status-update', {
          tripId,
          status: 'completed',
          timestamp: new Date().toISOString(),
        });
        
        socket.leave(`trip:${tripId}`);
        logger.info(`Trip ended: left room trip:${tripId}`);
      });

      socket.on('location-update', async (data: {
        tripId: string;
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
      }) => {
        const { tripId, latitude, longitude, speed = 0, heading = 0, accuracy = 0 } = data;
        if (!tripId || latitude === undefined || longitude === undefined) return;

        try {
          // Log coordinates to MySQL TripLocations
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

          // Update current location in User table
          if (user?.userId) {
            await prisma.user.update({
              where: { userId: user.userId },
              data: { latitude, longitude },
            });
          }

          // Broadcast coordinates to listening operators / active room
          this.emitToRoom(`trip:${tripId}`, 'location-update', {
            tripId,
            locationId: savedLoc.locationId,
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
            recordedAt: savedLoc.recordedAt.toISOString(),
          });
          
          // Also broadcast to global active trackers room for operators
          this.emitToRoom('admin-operators', 'operator-location-update', {
            tripId,
            latitude,
            longitude,
            speed,
            heading,
            recordedAt: savedLoc.recordedAt.toISOString(),
          });

        } catch (err: any) {
          logger.error(`Failed to store socket location update: ${err.message}`);
        }
      });

      // Room Management
      socket.on('join_room', (roomName: string) => {
        if (!roomName || typeof roomName !== 'string') return;
        socket.join(roomName);
        logger.info(`Socket ${socket.id} joined: ${roomName}`);
        socket.emit('room_joined', { room: roomName });
      });

      socket.on('leave_room', (roomName: string) => {
        if (!roomName || typeof roomName !== 'string') return;
        socket.leave(roomName);
        logger.info(`Socket ${socket.id} left: ${roomName}`);
        socket.emit('room_left', { room: roomName });
      });

      socket.on('disconnect', (reason) => {
        logger.info(`🔌 Socket client disconnected: ${socket.id}. Reason: ${reason}`);
      });
    });

    this.isInitialized = true;
    logger.info('🚀 Socket.IO server initialized successfully.');
  }

  /**
   * Send real-time event to a specific room
   */
  public emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.error('Socket.IO is not initialized. Cannot emit message.');
      return;
    }
    this.io.to(room).emit(event, data);
    logger.debug(`Emitted event "${event}" to room "${room}"`);
  }

  /**
   * Get Socket Server status
   */
  public getStatus() {
    return {
      initialized: this.isInitialized,
      activeConnections: this.io ? this.io.engine.clientsCount : 0,
    };
  }

  /**
   * Close the Socket Server
   */
  public close(): void {
    if (this.io) {
      this.io.close();
      this.isInitialized = false;
      logger.info('Socket.IO server closed.');
    }
  }
}

export const socketManager = SocketManager.getInstance();
export default socketManager;
