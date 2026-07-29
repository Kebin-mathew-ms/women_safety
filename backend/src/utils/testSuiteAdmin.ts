import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}/api/admin2`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Admin Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Admin Test Server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const runAdminTests = async () => {
  try {
    await startTestServer();

    logger.info('🧹 Cleaning up admin test data from database...');
    // Delete existing admin announcements, audit logs, role-permissions, roles, permissions, settings, and admin users to start fresh
    await prisma.adminAnnouncements.deleteMany({});
    await prisma.auditLogs.deleteMany({});
    await prisma.rolePermissions.deleteMany({});
    await prisma.roles.deleteMany({});
    await prisma.permissions.deleteMany({});
    await prisma.systemSettings.deleteMany({});
    await prisma.adminUsers.deleteMany({});

    logger.info('🏃 Starting Admin Integration Tests...');

    // ----------------------------------------------------
    // TEST 1: Admin Seeding
    // ----------------------------------------------------
    logger.info('Test 1: Admin Seeding...');
    const seedRes = await axios.post(`${BASE_URL}/auth/seed`);
    if (seedRes.status !== 201 && seedRes.status !== 200) {
      throw new Error(`Admin seeding failed with status ${seedRes.status}`);
    }
    logger.info('✅ Admin seed succeeded');

    // ----------------------------------------------------
    // TEST 2: Admin Login
    // ----------------------------------------------------
    logger.info('Test 2: Admin Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@safetravel.app',
      password: 'Admin@123',
    });

    if (!loginRes.data.success || !loginRes.data.data.accessToken) {
      throw new Error('Admin login failed');
    }
    const token = loginRes.data.data.accessToken;
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    logger.info('✅ Admin login succeeded');

    // ----------------------------------------------------
    // TEST 3: Dashboard Stats retrieval
    // ----------------------------------------------------
    logger.info('Test 3: Fetching Dashboard Stats...');
    const dashRes = await axios.get(`${BASE_URL}/dashboard`, authHeader);
    if (!dashRes.data.success || dashRes.data.data.totalUsers === undefined) {
      throw new Error('Failed to retrieve dashboard stats');
    }
    logger.info(`✅ Dashboard stats loaded. Total Users: ${dashRes.data.data.totalUsers}`);

    // ----------------------------------------------------
    // TEST 4: System Settings CRUD
    // ----------------------------------------------------
    logger.info('Test 4: System Settings management...');
    const settingsGet = await axios.get(`${BASE_URL}/settings`, authHeader);
    if (!settingsGet.data.success || settingsGet.data.data.length === 0) {
      throw new Error('Failed to fetch system settings');
    }
    logger.info(`✅ System settings loaded: ${settingsGet.data.data.length} keys`);

    // Let's modify a setting
    const testSetting = {
      key: 'app.name',
      value: 'Safe Travel Companion Test Run',
      category: 'general',
      description: 'Modified via admin test runner',
    };
    const settingsPut = await axios.put(`${BASE_URL}/settings`, { settings: [testSetting] }, authHeader);
    if (!settingsPut.data.success) {
      throw new Error('Failed to update system settings');
    }
    logger.info('✅ System settings update succeeded');

    // ----------------------------------------------------
    // TEST 5: Audit Log validation
    // ----------------------------------------------------
    logger.info('Test 5: Audit Logs validation...');
    const auditRes = await axios.get(`${BASE_URL}/audit-logs`, authHeader);
    if (!auditRes.data.success || auditRes.data.data.logs.length === 0) {
      throw new Error('Failed to fetch audit logs or audit log was not written on system settings change');
    }
    const settingChangeLog = auditRes.data.data.logs.find((l: any) => l.action === 'UPDATE' && l.module === 'settings');
    if (!settingChangeLog) {
      throw new Error('Settings update action not recorded in Audit Logs');
    }
    logger.info('✅ Audit logs correctly recorded system settings modifications');

    // ----------------------------------------------------
    // TEST 6: Report Generation Engine
    // ----------------------------------------------------
    logger.info('Test 6: Report Generation...');
    const reportRes = await axios.get(`${BASE_URL}/reports/users`, authHeader);
    if (!reportRes.data.success || !Array.isArray(reportRes.data.data)) {
      throw new Error('Failed to generate user reports');
    }
    logger.info(`✅ User report generated successfully: ${reportRes.data.data.length} rows`);

    // ----------------------------------------------------
    // TEST 7: RBAC Configuration retrieval
    // ----------------------------------------------------
    logger.info('Test 7: Roles & Permissions listing...');
    const rolesRes = await axios.get(`${BASE_URL}/roles`, authHeader);
    const permsRes = await axios.get(`${BASE_URL}/permissions`, authHeader);
    if (!rolesRes.data.success || !permsRes.data.success) {
      throw new Error('Failed to retrieve roles and permissions lists');
    }
    logger.info(`✅ RBAC roles and permissions retrieved successfully: ${rolesRes.data.data.length} roles, ${permsRes.data.data.length} permissions`);

    // ----------------------------------------------------
    // TEST 8: Create Announcement
    // ----------------------------------------------------
    logger.info('Test 8: Creating an Announcement...');
    const announceRes = await axios.post(`${BASE_URL}/announcements`, {
      title: 'Safety Warning: Heavy Rains Expected',
      message: 'Intense rainstorms projected between 8 PM and 11 PM. Stay indoors or near safe shelters.',
      priority: 'high',
      targetAudience: 'all',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
    }, authHeader);

    if (!announceRes.data.success || !announceRes.data.data.announcementId) {
      throw new Error('Failed to create system announcement');
    }
    logger.info('✅ Admin announcements engine successfully verified');

    // ----------------------------------------------------
    // TEST 9: Global Search Verification
    // ----------------------------------------------------
    logger.info('Test 9: Performing cross-module global search...');
    const searchRes = await axios.get(`${BASE_URL}/search?q=Safety`, authHeader);
    if (!searchRes.data.success || !searchRes.data.data.posts) {
      throw new Error('Global search did not return structured modules');
    }
    logger.info('✅ Global search successfully executed');

    logger.info('🎉 ALL ADMIN INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (err: any) {
    logger.error('❌ Integration Tests Failed:', err.message);
    if (err.response) {
      logger.error('Status Code:', err.response.status);
      logger.error('Response Body:', JSON.stringify(err.response.data));
    }
    process.exit(1);
  } finally {
    await stopTestServer();
  }
};

runAdminTests();
