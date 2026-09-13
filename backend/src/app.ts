import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import requestLogger from './middleware/requestLogger.middleware';
import errorHandler from './middleware/error.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import contactRoutes from './routes/contact.routes';
import adminRoutes from './routes/admin.routes';
import tripRoutes from './routes/trip.routes';
import placesRoutes from './routes/places.routes';
import sosRoutes from './routes/sos.routes';
import trackingRoutes from './routes/tracking.routes';
import wearableRoutes from './routes/wearable.routes';
import safePlaceRoutes from './routes/safeplace.routes';
import reviewRoutes from './routes/review.routes';
import crimeRoutes from './routes/crime.routes';
import policeRoutes from './routes/police.routes';
import hospitalRoutes from './routes/hospital.routes';
import communityRoutes from './routes/community.routes';
import chatRoutes from './routes/chat.routes';
import notificationsRoutes from './routes/notifications.routes';
import voiceRoutes from './routes/voice.routes';
import aiRoutes from './routes/ai.routes';
import admin2Routes from './routes/admin2.routes';
import routeSafetyRoutes from './routes/routeSafety.routes';
import sanitizeInput from './middleware/sanitize.middleware';
import { NotFoundError } from './utils/errors';

const app: Application = express();

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows accessing local images from emulator client
}));

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for foundation setup
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Custom Request Logger
app.use(requestLogger);

// Static Uploads Folder
const profileDir = path.resolve(__dirname, '..', config.UPLOAD_PATH, 'profile');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}
app.use('/uploads', express.static(path.resolve(__dirname, '..', config.UPLOAD_PATH)));

// Route Registrations
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/emergency-contacts', contactRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/live-tracking', trackingRoutes);
app.use('/api/wearable', wearableRoutes);
app.use('/api/safe-places', safePlaceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/crime-reports', crimeRoutes);
app.use('/api/police-stations', policeRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin2', admin2Routes);
app.use('/api/routes', routeSafetyRoutes);

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Requested route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
