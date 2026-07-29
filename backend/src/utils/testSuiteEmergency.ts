import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';

const TEST_PORT = 5004;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Emergency Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Emergency Test Server stopped.');
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
    await prisma.wearableDevice.deleteMany({});
    await prisma.sOSRecipient.deleteMany({});
    await prisma.sOSAlert.deleteMany({});
    await prisma.emergencyContact.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'sostest@example.com' },
    });

    // Create user and log in to obtain token
    logger.info('Registering test user...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'SOS Test User',
      email: 'sostest@example.com',
      phone: '+15551112222',
      password: 'SecurePassword1',
    });

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'sostest@example.com',
      password: 'SecurePassword1',
    });

    const { accessToken } = loginResponse.data.data;
    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    logger.info('✅ Auth token acquired.');

    // ----------------------------------------------------
    // TEST 1: Validate block SOS when 0 contacts exist
    // ----------------------------------------------------
    logger.info('Test 1: Trigger SOS with zero contacts (should fail)...');
    try {
      await axios.post(
        `${BASE_URL}/sos`,
        {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'City Hall, NY',
          emergencyType: 'harassment',
        },
        authHeaders
      );
      throw new Error('SOS went through even though 0 contacts were registered!');
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message.includes('emergency contact')) {
        logger.info('✅ Successfully blocked SOS trigger when contacts list is empty');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 2: Trigger SOS after registering contact
    // ----------------------------------------------------
    logger.info('Test 2: Creating contact and triggering SOS alert...');
    
    // Add Emergency contact
    await prisma.emergencyContact.create({
      data: {
        userId: registerRes.data.data.userId,
        name: 'Guardian Angel',
        phone: '+15559876543',
        relationship: 'mother',
        priority: 1,
        isPrimary: true,
      },
    });

    const sosRes = await axios.post(
      `${BASE_URL}/sos`,
      {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'City Hall, NY',
        emergencyType: 'harassment',
        triggeredBy: 'user',
      },
      authHeaders
    );

    if (sosRes.status !== 201 || !sosRes.data.success) {
      throw new Error('Failed to create SOS alert');
    }
    const activeSos = sosRes.data.data;
    logger.info(`✅ SOS triggered successfully. SOS ID: ${activeSos.sosId}`);

    // Verify duplicate active SOS block
    logger.info('Verifying duplicate SOS block (should fail)...');
    try {
      await axios.post(
        `${BASE_URL}/sos`,
        {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        authHeaders
      );
      throw new Error('Duplicate active SOS succeeded!');
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message.includes('active SOS')) {
        logger.info('✅ Successfully blocked duplicate active SOS trigger');
      } else {
        throw err;
      }
    }

    // Cancel SOS Alert
    logger.info('Cancelling SOS alert...');
    const cancelRes = await axios.post(
      `${BASE_URL}/sos/cancel`,
      {
        sosId: activeSos.sosId,
        cancelledReason: 'False alarm, pressed by accident',
      },
      authHeaders
    );
    if (cancelRes.data.data.status !== 'cancelled' || cancelRes.data.data.cancelledReason !== 'False alarm, pressed by accident') {
      throw new Error('Failed to cancel active SOS');
    }
    logger.info('✅ Active SOS cancelled successfully');

    // ----------------------------------------------------
    // TEST 3: Voice SOS Activation
    // ----------------------------------------------------
    logger.info('Test 3: Voice SOS Trigger...');
    const voiceRes = await axios.post(
      `${BASE_URL}/sos/voice`,
      {
        triggerWord: 'Help Me',
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'City Hall Voice Trigger',
      },
      authHeaders
    );

    if (voiceRes.status !== 201 || !voiceRes.data.data.voiceActivated) {
      throw new Error('Failed to trigger Voice SOS');
    }
    const voiceSosId = voiceRes.data.data.sosId;
    logger.info(`✅ Voice SOS activated. Alert ID: ${voiceSosId}`);

    // Resolve SOS alert via operator resolve
    logger.info('Resolving voice alert via operator resolution...');
    const resolveRes = await axios.post(
      `${BASE_URL}/sos/${voiceSosId}/resolve`,
      {
        resolvedBy: 'Operator Officer Miller',
      },
      authHeaders
    );
    if (resolveRes.data.data.status !== 'resolved' || resolveRes.data.data.resolvedBy !== 'Operator Officer Miller') {
      throw new Error('Failed to resolve voice SOS alert');
    }
    logger.info('✅ SOS resolved by operator');

    // ----------------------------------------------------
    // TEST 4: Wearable Device Pairing CRUD
    // ----------------------------------------------------
    logger.info('Test 4: Wearable Device Mac Address Pairing CRUD...');
    
    // Pair Watch (Should block invalid mac format)
    try {
      await axios.post(
        `${BASE_URL}/wearable`,
        {
          deviceName: 'Apple Watch Series 9',
          deviceType: 'WearOS',
          macAddress: 'invalid-mac-format',
        },
        authHeaders
      );
      throw new Error('Invalid MAC address paired successfully!');
    } catch (err: any) {
      if (err.response?.status === 400 && JSON.stringify(err.response.data.errors).includes('Invalid MAC')) {
        logger.info('✅ Successfully blocked invalid MAC address format');
      } else {
        throw err;
      }
    }

    // Pair watch successfully
    const pairRes = await axios.post(
      `${BASE_URL}/wearable`,
      {
        deviceName: 'Apple Watch Series 9',
        deviceType: 'WearOS',
        macAddress: 'AB:CD:EF:12:34:56',
      },
      authHeaders
    );
    if (pairRes.status !== 201 || pairRes.data.data.macAddress !== 'AB:CD:EF:12:34:56') {
      throw new Error('Failed to pair Wearable device');
    }
    const deviceId = pairRes.data.data.deviceId;
    logger.info('✅ Wearable watch paired successfully');

    // Update connection status and battery
    const updateRes = await axios.put(
      `${BASE_URL}/wearable/${deviceId}`,
      {
        batteryLevel: 88.5,
        connected: false,
      },
      authHeaders
    );
    if (updateRes.data.data.connected !== false || updateRes.data.data.batteryLevel !== 88.5) {
      throw new Error('Failed to update wearable battery status');
    }
    logger.info('✅ Wearable status update verified');

    // Delete paired device
    await axios.delete(`${BASE_URL}/wearable/${deviceId}`, authHeaders);
    logger.info('✅ Wearable watch unpaired successfully');

    logger.info('🎉 ALL EMERGENCY & SAFETY INTEGRATION TESTS PASSED SUCCESFULLY!');
  } catch (error: any) {
    logger.error(`❌ EMERGENCY TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    await prisma.wearableDevice.deleteMany({});
    await prisma.sOSRecipient.deleteMany({});
    await prisma.sOSAlert.deleteMany({});
    await prisma.emergencyContact.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'sostest@example.com' },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
