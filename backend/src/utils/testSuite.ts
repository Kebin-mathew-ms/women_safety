import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Test Server stopped.');
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

    // Clean up test data from database first
    logger.info('🧹 Cleaning up database before tests...');
    await prisma.refreshToken.deleteMany({});
    await prisma.emergencyContact.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ['testuser@example.com', 'contactuser@example.com'] },
      },
    });

    logger.info('🏃 Starting Integration Tests...');

    // ----------------------------------------------------
    // TEST 1: User Registration
    // ----------------------------------------------------
    logger.info('Test 1: User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Test User',
      email: 'testuser@example.com',
      phone: '+15551234567',
      password: 'SecurePassword1',
      gender: 'female',
    });
    
    if (registerResponse.status !== 201 || !registerResponse.data.success) {
      throw new Error('Registration failed');
    }
    logger.info('✅ Registration succeeded');

    // ----------------------------------------------------
    // TEST 2: Duplicate Email Block
    // ----------------------------------------------------
    logger.info('Test 2: Duplicate Email Block...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        fullName: 'Another User',
        email: 'testuser@example.com',
        phone: '+15557654321',
        password: 'Password999',
      });
      throw new Error('Duplicate registration should have failed');
    } catch (err: any) {
      if (err.response?.status === 400) {
        logger.info('✅ Duplicate email registration successfully blocked');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 3: User Login
    // ----------------------------------------------------
    logger.info('Test 3: User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'SecurePassword1',
      deviceName: 'Integration Test Client',
      deviceId: 'test-device-uuid',
    });

    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const { accessToken, refreshToken } = loginResponse.data.data;
    logger.info('✅ Login succeeded, retrieved JWT tokens');

    const authHeaders = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    // ----------------------------------------------------
    // TEST 4: Get Profile details
    // ----------------------------------------------------
    logger.info('Test 4: Get Profile details...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, authHeaders);
    if (profileResponse.status !== 200 || profileResponse.data.data.fullName !== 'Test User') {
      throw new Error('Failed to fetch profile details');
    }
    logger.info('✅ Profile retrieved successfully');

    // ----------------------------------------------------
    // TEST 5: Update Profile details
    // ----------------------------------------------------
    logger.info('Test 5: Update Profile details...');
    const updateResponse = await axios.put(
      `${BASE_URL}/profile`,
      {
        fullName: 'Sarah Connor',
        bloodGroup: 'O+',
        city: 'Los Angeles',
      },
      authHeaders
    );

    if (updateResponse.status !== 200 || updateResponse.data.data.fullName !== 'Sarah Connor') {
      throw new Error('Failed to update profile details');
    }
    logger.info('✅ Profile updated successfully');

    // ----------------------------------------------------
    // TEST 6: Emergency Contacts CRUD Checks
    // ----------------------------------------------------
    logger.info('Test 6: Emergency Contacts CRUD...');
    
    // Add 1st Contact (should automatically become Primary)
    const contact1 = await axios.post(
      `${BASE_URL}/emergency-contacts`,
      {
        name: 'John Connor',
        phone: '+15559876543',
        relationship: 'Son',
        priority: 1,
        isPrimary: false, // will force to true since it's the first
      },
      authHeaders
    );
    if (!contact1.data.data.isPrimary) {
      throw new Error('First contact should automatically be primary');
    }
    logger.info('✅ Added 1st contact (Primary)');

    // Add 2nd Contact
    const contact2 = await axios.post(
      `${BASE_URL}/emergency-contacts`,
      {
        name: 'Kyle Reese',
        phone: '+15551112222',
        relationship: 'Guardian',
        priority: 2,
        isPrimary: false,
      },
      authHeaders
    );
    logger.info('✅ Added 2nd contact');

    // Test Duplicate Phone constraint
    try {
      await axios.post(
        `${BASE_URL}/emergency-contacts`,
        {
          name: 'Fake Kyle',
          phone: '+15551112222', // Duplicate phone
          relationship: 'Fake',
          priority: 3,
        },
        authHeaders
      );
      throw new Error('Duplicate contact phone should have failed');
    } catch (err: any) {
      if (err.response?.status === 400) {
        logger.info('✅ Duplicate contact phone successfully blocked');
      } else {
        throw err;
      }
    }

    // Set 2nd Contact to Primary (should reset 1st Contact Primary status)
    const updateContact2 = await axios.put(
      `${BASE_URL}/emergency-contacts/${contact2.data.data.contactId}`,
      {
        name: 'Kyle Reese',
        phone: '+15551112222',
        relationship: 'Guardian',
        priority: 1,
        isPrimary: true, // Swapping Primary status
      },
      authHeaders
    );

    if (!updateContact2.data.data.isPrimary) {
      throw new Error('Contact 2 should now be Primary');
    }

    // Check contact 1 is no longer primary
    const contactsList = await axios.get(`${BASE_URL}/emergency-contacts`, authHeaders);
    const jcContact = contactsList.data.data.find(
      (c: any) => c.contactId === contact1.data.data.contactId
    );
    if (jcContact.isPrimary) {
      throw new Error('Contact 1 should have been demoted from Primary');
    }
    logger.info('✅ Primary contact swap successfully verified');

    // ----------------------------------------------------
    // TEST 7: Refresh Token Rotation (RTR)
    // ----------------------------------------------------
    logger.info('Test 7: Refresh Token Rotation...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      token: refreshToken,
    });
    if (refreshResponse.status !== 200 || !refreshResponse.data.data.accessToken) {
      throw new Error('Token refresh failed');
    }
    logger.info('✅ Refresh Token Rotation succeeded');

    // ----------------------------------------------------
    // TEST 8: Soft Delete Account
    // ----------------------------------------------------
    logger.info('Test 8: Soft Delete Account...');
    const deleteResponse = await axios.delete(`${BASE_URL}/profile`, authHeaders);
    if (deleteResponse.status !== 200 || !deleteResponse.data.success) {
      throw new Error('Soft delete failed');
    }

    // Check user cannot log back in
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'testuser@example.com',
        password: 'SecurePassword1',
      });
      throw new Error('Login of soft-deleted user should have failed');
    } catch (err: any) {
      if (err.response?.status === 401) {
        logger.info('✅ Soft-delete verified. User blocked from logins');
      } else {
        throw err;
      }
    }

    logger.info('🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
  } catch (error: any) {
    logger.error(`❌ TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    await prisma.refreshToken.deleteMany({});
    await prisma.emergencyContact.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ['testuser@example.com', 'contactuser@example.com'] },
      },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
