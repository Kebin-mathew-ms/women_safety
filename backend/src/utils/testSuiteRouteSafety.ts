import http from 'http';
import axios from 'axios';
import app from '../app';
import logger from './logger';

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Route Safety Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Route Safety Test Server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const runRouteSafetyTests = async () => {
  try {
    await startTestServer();
    logger.info('🏃 Starting AI Route Safety Recommendation System Integration Tests...');

    // 1. Authenticate user to get JWT token
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@safetravel.com',
      password: 'Password@123',
    });

    const token = loginRes.data?.data?.token || loginRes.data?.data?.accessToken;
    if (!token) {
      throw new Error('User login failed during test runner setup');
    }
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    logger.info('✅ User authentication successful');

    // 2. Test Route Safety Recommendation Endpoint (12:30 AM departure Kochi -> Kottayam)
    logger.info('Test 1: Requesting 12:30 AM Route Safety Recommendation (Kochi → Kottayam)...');
    const reqBody = {
      origin: 'Kochi',
      destination: 'Kottayam',
      departureTime: '2026-09-13T00:30:00+05:30',
      modeOfTransport: 'car',
      numberOfTravellers: 1,
      preferences: ['prefer_highways', 'avoid_isolated_roads', 'prefer_well_lit_roads'],
      priority: 'safest',
    };

    const res = await axios.post(`${BASE_URL}/routes/safety-recommendation`, reqBody, authHeaders);

    if (!res.data.success || !res.data.data.recommendedRoute) {
      throw new Error('Route safety recommendation API response missing recommendedRoute');
    }

    const rec = res.data.data;
    logger.info(`✅ Recommended Route: ${rec.recommendedRoute.name}`);
    logger.info(`✅ Safety Score: ${rec.recommendedRoute.safetyScore}/100 (${rec.recommendedRoute.suitabilityLabel})`);
    logger.info(`✅ Distance: ${rec.recommendedRoute.distanceKm} km | Time: ${rec.recommendedRoute.durationMinutes} mins`);
    logger.info(`✅ Waypoints Flow: ${rec.recommendedRoute.waypointsFlow}`);
    logger.info(`✅ Alternatives Count: ${rec.alternativeRoutes.length}`);

    if (rec.recommendedRoute.riskySegments.length > 0) {
      logger.info(`⚠️ Flagged Risky Segment: ${rec.recommendedRoute.riskySegments[0].segmentName}`);
    }

    if (!rec.aiExplanation || rec.aiExplanation.length < 50) {
      throw new Error('AI Markdown explanation generation failed or returned empty content');
    }

    logger.info('🎉 ALL AI ROUTE SAFETY RECOMMENDATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err: any) {
    logger.error('❌ Route Safety Integration Tests Failed:', err.message);
    if (err.response) {
      logger.error('Response Status:', err.response.status);
      logger.error('Response Body:', JSON.stringify(err.response.data));
    }
    process.exit(1);
  } finally {
    await stopTestServer();
  }
};

runRouteSafetyTests();
