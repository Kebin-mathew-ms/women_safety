import { verifyDbConnection, disconnectDb } from '../services/db.service';
import logger from './logger';

async function verify() {
  logger.info('Testing Prisma Database Connection...');
  const success = await verifyDbConnection();
  
  if (success) {
    logger.info('🎉 SUCCESS: Connected to MySQL database "women" successfully!');
    process.exit(0);
  } else {
    logger.error('❌ ERROR: Failed to connect to database "women". Please check connection URL or local MySQL service status.');
    process.exit(1);
  }
}

verify().finally(async () => {
  await disconnectDb();
});
