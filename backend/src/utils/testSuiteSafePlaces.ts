import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Safe Places Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Safe Places Test Server stopped.');
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
    await prisma.crimeReport.deleteMany({});
    await prisma.placeReview.deleteMany({});
    await prisma.placeImage.deleteMany({});
    await prisma.safePlace.deleteMany({});
    await prisma.policeStation.deleteMany({});
    await prisma.hospital.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'safetest@example.com' },
    });

    // Create user and log in to obtain token
    logger.info('Registering test user...');
    await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Safe Places User',
      email: 'safetest@example.com',
      phone: '+15552223333',
      password: 'SecurePassword1',
    });

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'safetest@example.com',
      password: 'SecurePassword1',
    });

    const { accessToken } = loginResponse.data.data;
    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    logger.info('✅ Auth token acquired.');

    // ----------------------------------------------------
    // TEST 1: Safe Places CRUD & Radius Filters
    // ----------------------------------------------------
    logger.info('Test 1: Safe Places CRUD and Radius Search...');
    
    // Create Safe Place (Source: NY, Times Square)
    const placeRes = await axios.post(
      `${BASE_URL}/safe-places`,
      {
        name: 'Safe Haven Hostel',
        category: 'women_hostel',
        latitude: 40.7580,
        longitude: -73.9855,
        address: 'Times Square, NY',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        womenOnly: true,
        cctv: true,
        securityGuard: true,
        reception24x7: true,
      },
      authHeaders
    );
    if (placeRes.status !== 201 || !placeRes.data.success) {
      throw new Error('Safe place creation failed');
    }
    const place = placeRes.data.data;
    logger.info(`✅ Safe Place created: ${place.placeId}`);

    // Radius Search (Within 5km: should find the hostel)
    const searchResNear = await axios.get(
      `${BASE_URL}/safe-places?latitude=40.7580&longitude=-73.9855&radius=5`,
      authHeaders
    );
    if (searchResNear.data.data.length !== 1) {
      throw new Error('Radius search failed to find nearby place');
    }
    logger.info('✅ Radius search (nearby) returned place');

    // Radius Search (Within 1km of Central Park: should NOT find Times Square hostel)
    const searchResFar = await axios.get(
      `${BASE_URL}/safe-places?latitude=40.7850&longitude=-73.9682&radius=1`,
      authHeaders
    );
    if (searchResFar.data.data.length !== 0) {
      throw new Error('Radius search found distant place unexpectedly');
    }
    logger.info('✅ Radius search (distant) correctly returned empty list');

    // ----------------------------------------------------
    // TEST 2: Place Reviews & Averages
    // ----------------------------------------------------
    logger.info('Test 2: Place Reviews and rating recalculations...');
    
    // Submit review
    const reviewRes = await axios.post(
      `${BASE_URL}/reviews`,
      {
        placeId: place.placeId,
        rating: 5,
        lighting: 4,
        crowd: 3,
        cleanliness: 5,
        security: 5,
        comment: 'Absolutely safe and well lighted hostel',
      },
      authHeaders
    );
    if (reviewRes.status !== 201 || !reviewRes.data.success) {
      throw new Error('Failed to submit review');
    }
    logger.info('✅ Review submitted successfully');

    // Verify average rating updated on the place details
    const detailRes = await axios.get(`${BASE_URL}/safe-places/${place.placeId}`, authHeaders);
    if (detailRes.data.data.averageRating !== 5 || detailRes.data.data.lightingScore !== 8) {
      throw new Error('Rating average calculations failed to update place details');
    }
    logger.info('✅ Average rating and lighting score verified');

    // ----------------------------------------------------
    // TEST 3: Crime Reports & Heatmaps
    // ----------------------------------------------------
    logger.info('Test 3: Community Hazard Crime Reports and Heatmaps...');
    
    // Submit hazard report
    const reportRes = await axios.post(
      `${BASE_URL}/crime-reports`,
      {
        latitude: 40.7580,
        longitude: -73.9855,
        address: 'Alley near Times Sq',
        category: 'poor_lighting',
        severity: 'high',
        description: 'Street light broken for three days',
        anonymous: true,
      },
      authHeaders
    );
    if (reportRes.status !== 201) {
      throw new Error('Failed to submit hazard report');
    }
    logger.info('✅ Unsafe Area report submitted');

    // Fetch Heatmap
    const heatmapRes = await axios.get(`${BASE_URL}/crime-reports/heatmap`, authHeaders);
    const point = heatmapRes.data.data.find((p: any) => p.severity === 'high');
    if (!point || point.riskLevel !== 'Danger Zone' || point.color !== '#ef4444') {
      throw new Error('Heatmap threat calculations failed');
    }
    logger.info('✅ Heatmap severity coordinates and risk colors verified');

    // ----------------------------------------------------
    // TEST 4: Police & Hospitals Radius
    // ----------------------------------------------------
    logger.info('Test 4: Police Stations and Hospitals Nearby Search...');
    
    // Mock police station
    await prisma.policeStation.create({
      data: {
        name: 'Midtown Police Station',
        latitude: 40.7580,
        longitude: -73.9855,
        address: 'Midtown, NY',
        open24Hours: true,
      },
    });

    const policeRes = await axios.get(
      `${BASE_URL}/police-stations/nearby?latitude=40.7580&longitude=-73.9855&radius=5`,
      authHeaders
    );
    if (policeRes.data.data.length !== 1) {
      throw new Error('Failed to list nearby police stations');
    }
    logger.info('✅ Nearby police stations lookup verified');

    logger.info('🎉 ALL SAFE PLACES MODULE INTEGRATION TESTS PASSED SUCCESFULLY!');
  } catch (error: any) {
    logger.error(`❌ SAFE PLACES TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    await prisma.crimeReport.deleteMany({});
    await prisma.placeReview.deleteMany({});
    await prisma.placeImage.deleteMany({});
    await prisma.safePlace.deleteMany({});
    await prisma.policeStation.deleteMany({});
    await prisma.hospital.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'safetest@example.com' },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
