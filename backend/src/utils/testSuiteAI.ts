import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';

const TEST_PORT = 5008;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 AI Intelligence Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 AI Intelligence Test Server stopped.');
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
    await prisma.aIReviewSummaries.deleteMany({});
    await prisma.aIConversations.deleteMany({});
    await prisma.aISafetyAnalyses.deleteMany({});
    await prisma.aIPromptTemplate.deleteMany({});
    await prisma.placeReview.deleteMany({});
    await prisma.safePlace.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'aitest@example.com' },
    });

    // Create user and log in to obtain token
    logger.info('Registering test user...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'AI Test User',
      email: 'aitest@example.com',
      phone: '+15559998888',
      password: 'SecurePassword1',
    });
    const userId = registerRes.data.data.userId;

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'aitest@example.com',
      password: 'SecurePassword1',
    });

    const { accessToken } = loginResponse.data.data;
    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    logger.info('✅ Auth token acquired.');

    // ----------------------------------------------------
    // TEST 1: AI Chat Assistant (with Fallback Engine)
    // ----------------------------------------------------
    logger.info('Test 1: Conversational AI Chat and fallback validation...');
    const chatRes = await axios.post(
      `${BASE_URL}/ai/chat`,
      { question: 'Can I travel tonight safely?' },
      authHeaders
    );
    if (!chatRes.data.success || !chatRes.data.data.answer) {
      throw new Error('AI Chat response mapping failed');
    }
    logger.info(`✅ Chat assistant response: "${chatRes.data.data.answer.substring(0, 50)}..."`);

    // Verify history log
    const historyRes = await axios.get(`${BASE_URL}/ai/history`, authHeaders);
    if (historyRes.data.data.length !== 1) {
      throw new Error('AI Conversation history logging failed');
    }
    logger.info('✅ AI history lookup verified');

    // ----------------------------------------------------
    // TEST 2: Route Safety score calculations
    // ----------------------------------------------------
    logger.info('Test 2: Route Risk calculations scoring...');
    
    // Create a trip record
    const tripRes = await prisma.trip.create({
      data: {
        userId,
        tripName: 'AI Evaluation Journey',
        sourceAddress: 'Central Station',
        destinationAddress: 'Safe Zone Hostels',
        sourceLatitude: 40.7128,
        sourceLongitude: -74.0060,
        destinationLatitude: 40.7306,
        destinationLongitude: -73.9352,
        estimatedDistance: 4.5,
        estimatedDuration: 12.0,
      },
    });

    const analysisRes = await axios.post(
      `${BASE_URL}/ai/route-analysis`,
      { tripId: tripRes.tripId },
      authHeaders
    );
    if (
      !analysisRes.data.success ||
      analysisRes.data.data.riskScore === undefined ||
      !analysisRes.data.data.riskLevel
    ) {
      throw new Error('Route safety score engine failed');
    }
    logger.info(`✅ Journey Risk Score: ${analysisRes.data.data.riskScore} (${analysisRes.data.data.riskLevel})`);

    // ----------------------------------------------------
    // TEST 3: Safe Hotel Recommendations
    // ----------------------------------------------------
    logger.info('Test 3: AI Hotel recommendations rating...');
    
    // Create safe hotel place
    const place = await prisma.safePlace.create({
      data: {
        name: 'Shield Verified PG Options',
        category: 'hotel',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '456 Safety Blvd',
        city: 'New York',
        state: 'NY',
        country: 'US',
        womenOnly: true,
        verified: true,
        securityGuard: true,
        cctv: true,
        averageRating: 4.8,
      },
    });

    const hotelRes = await axios.post(
      `${BASE_URL}/ai/hotel-recommendation`,
      { latitude: 40.7128, longitude: -74.0060 },
      authHeaders
    );
    const recHotel = hotelRes.data.data[0];
    if (recHotel.safetyScore < 90.0 || !recHotel.womenOnly || !recHotel.verified) {
      throw new Error('AI Hotel safety scores sorting failed');
    }
    logger.info(`✅ Recommended Hotel safety score rank: ${recHotel.safetyScore} points`);

    // ----------------------------------------------------
    // TEST 4: Safe Place Reviews cache summarization
    // ----------------------------------------------------
    logger.info('Test 4: Reviews summarizations cache triggers...');
    
    // Insert place review
    await prisma.placeReview.create({
      data: {
        placeId: place.placeId,
        userId,
        rating: 5,
        lighting: 5,
        crowd: 4,
        cleanliness: 5,
        security: 5,
        comment: 'Absolutely amazing security systems. Guard stands outside 24x7. Highly lit entrances.',
      },
    });

    const summaryRes = await axios.get(
      `${BASE_URL}/ai/review-summary/${place.placeId}`,
      authHeaders
    );
    if (!summaryRes.data.success || !summaryRes.data.data.summary) {
      throw new Error('Review summary compilation failed');
    }
    logger.info('✅ Review summary generated & cached');

    // Fetch again to verify cache lookup returns 200
    const summaryCacheRes = await axios.get(
      `${BASE_URL}/ai/review-summary/${place.placeId}`,
      authHeaders
    );
    if (summaryCacheRes.data.data.summaryId !== summaryRes.data.data.summaryId) {
      throw new Error('Review summary cache check failed');
    }
    logger.info('✅ Review summary cache hit successfully');

    logger.info('🎉 ALL AI INTELLIGENCE MODULE TESTS PASSED SUCCESFULLY!');
  } catch (error: any) {
    logger.error(`❌ AI TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    await prisma.aIReviewSummaries.deleteMany({});
    await prisma.aIConversations.deleteMany({});
    await prisma.aISafetyAnalyses.deleteMany({});
    await prisma.aIPromptTemplate.deleteMany({});
    await prisma.placeReview.deleteMany({});
    await prisma.safePlace.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'aitest@example.com' },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
