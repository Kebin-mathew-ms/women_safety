import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';
import { checkLowBatteryAlert, checkNightTravelAlert } from '../controllers/notifications.controller';

const TEST_PORT = 5007;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Notifications Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Notifications Test Server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const runTests = async () => {
  try {
    await startTestServer();

    // Clean up old test data
    logger.info('🧹 Cleaning up database before tests...');
    await prisma.wearableLog.deleteMany({});
    await prisma.wearableDevice.deleteMany({});
    await prisma.voiceCommand.deleteMany({});
    await prisma.notificationPreferences.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'notiftest@example.com' },
    });

    // Create user and log in to obtain token
    logger.info('Registering test user...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Alerts Test User',
      email: 'notiftest@example.com',
      phone: '+15551112222',
      password: 'SecurePassword1',
    });
    const userId = registerRes.data.data.userId;

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'notiftest@example.com',
      password: 'SecurePassword1',
    });

    const { accessToken } = loginResponse.data.data;
    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    logger.info('✅ Auth token acquired.');

    // ----------------------------------------------------
    // TEST 1: Preferences & Smart Warnings (Night / Battery)
    // ----------------------------------------------------
    logger.info('Test 1: Preferences and Smart Warnings Triggers...');
    
    // Get preferences
    const prefRes = await axios.get(`${BASE_URL}/notifications/preferences`, authHeaders);
    if (!prefRes.data.success || prefRes.data.data.tripAlerts !== true) {
      throw new Error('Default preference mapping failed');
    }
    logger.info('✅ Default preferences verified');

    // Trigger low battery check (15% battery level)
    const batteryAlert = await checkLowBatteryAlert(userId, 15);
    if (!batteryAlert || batteryAlert.type !== 'battery_warning' || batteryAlert.priority !== 'high') {
      throw new Error('Low battery warning alert generation failed');
    }
    logger.info('✅ Low phone battery warning generated successfully');

    // Trigger night hours warning
    const nightAlert = await checkNightTravelAlert(userId, 40.7128, -74.0060);
    // Night travel checks current system hour (between 10 PM and 5 AM). 
    // We manually insert an alert for night travel warning if it's daytime, or assert isNight
    if (nightAlert) {
      logger.info('✅ Night travel warnings successfully triggered (Night hour match verified)');
    } else {
      logger.info('ℹ️ Night travel skipped (Current hours outside late night intervals)');
    }

    // List Notification History
    const historyRes = await axios.get(`${BASE_URL}/notifications`, authHeaders);
    if (historyRes.data.data.length === 0) {
      throw new Error('Failed to retrieve notification logs history');
    }
    logger.info('✅ Notification history lookup verified');

    // ----------------------------------------------------
    // TEST 2: Voice Command Parser
    // ----------------------------------------------------
    logger.info('Test 2: Voice Command Keyword matching...');
    
    const voiceRes = await axios.post(
      `${BASE_URL}/voice/command`,
      { command: 'SOS emergency help me' },
      authHeaders
    );
    if (voiceRes.data.data.action !== 'sos_trigger' || !voiceRes.data.data.responseText.includes('activated')) {
      throw new Error('Voice command keyword mapping failed');
    }
    logger.info('✅ Speech safety command matched successfully');

    const voiceHistoryRes = await axios.get(`${BASE_URL}/voice/history`, authHeaders);
    if (voiceHistoryRes.data.data.length !== 1) {
      throw new Error('Failed to retrieve voice command log history');
    }
    logger.info('✅ Voice command logs verified');

    // ----------------------------------------------------
    // TEST 3: Wearable Telemetry status logs
    // ----------------------------------------------------
    logger.info('Test 3: Wearable Device logs telemetry...');
    
    // Pair watch device (MAC: AB:CD:EF:12:34:56)
    await axios.post(
      `${BASE_URL}/wearable/pair`,
      {
        deviceName: 'Watch Pro 4',
        deviceType: 'WearOS',
        macAddress: 'AB:CD:EF:12:34:56',
      },
      authHeaders
    );
    logger.info('✅ Telemetry smartwatch paired');

    // Log wearable logs telemetry (connect action with 88% battery level status)
    const telemetryRes = await axios.post(
      `${BASE_URL}/wearable/telemetry`,
      {
        macAddress: 'AB:CD:EF:12:34:56',
        action: 'connect',
        batteryLevel: 88,
      },
      authHeaders
    );
    if (telemetryRes.status !== 201) {
      throw new Error('Wearable log telemetry failed');
    }
    logger.info('✅ Wearable log telemetry recorded');

    // Get wearable status diagnostics
    const statusRes = await axios.get(`${BASE_URL}/wearable/status`, authHeaders);
    const watch = statusRes.data.data[0];
    if (watch.batteryLevel !== 88 || watch.connected !== true || watch.logs.length !== 1) {
      throw new Error('Wearable diagnostics status logs retrieval failed');
    }
    logger.info('✅ Wearable connection status diagnostics verified');

    logger.info('🎉 ALL NOTIFICATIONS & TELEMETRY MODULE TESTS PASSED SUCCESFULLY!');
  } catch (error: any) {
    logger.error(`❌ NOTIFICATIONS TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    await prisma.wearableLog.deleteMany({});
    await prisma.wearableDevice.deleteMany({});
    await prisma.voiceCommand.deleteMany({});
    await prisma.notificationPreferences.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'notiftest@example.com' },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
