import { io } from 'socket.io-client';
import logger from './logger';

logger.info('Connecting to Socket.IO Server at http://localhost:5001...');

const socket = io('http://localhost:5001', {
  transports: ['websocket'],
  auth: {
    token: '', // Soft authentication handshake
  }
});

socket.on('connect', () => {
  logger.info('🎉 SUCCESS: Handshake verified with Socket.IO server!');
  logger.info(`Socket ID: ${socket.id}`);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err: any) => {
  logger.error(`❌ ERROR: Socket.IO connection failed: ${err.message}`);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  logger.error('❌ ERROR: Socket.IO connection timed out.');
  socket.disconnect();
  process.exit(1);
}, 5000);
