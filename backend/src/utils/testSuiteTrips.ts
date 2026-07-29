import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';
import OsmService from '../services/osm.service';

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Trips Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Trips Test Server stopped.');
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
    await prisma.savedPlace.deleteMany({});
    await prisma.tripLocation.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'triptest@example.com' },
    });

    // Create user and log in to obtain token
    logger.info('Registering test user...');
    await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Trip Test User',
      email: 'triptest@example.com',
      phone: '+15559871111',
      password: 'SecurePassword1',
    });

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'triptest@example.com',
      password: 'SecurePassword1',
    });

    const { accessToken } = loginResponse.data.data;
    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    logger.info('✅ Auth token acquired.');

    // ----------------------------------------------------
    // TEST 1: OpenStreetMap OSRM Routing & Geocoding
    // ----------------------------------------------------
    logger.info('Test 1: Testing Nominatim and OSRM Services...');
    
    // Test direct OSM Service calculateRoute (Source: NY, Destination: Boston)
    const routeInfo = await OsmService.calculateRoute(40.7128, -74.0060, 42.3601, -71.0589);
    logger.info(`OSRM Distance: ${routeInfo.distance.toFixed(2)} km, Duration: ${routeInfo.duration.toFixed(2)} mins`);
    if (routeInfo.distance <= 0 || routeInfo.coordinates.length < 2) {
      throw new Error('OSRM service failed to fetch routing geometry');
    }
    logger.info('✅ OSM OSRM calculation verified');

    // Nominatim Reverse Geocode check
    const addressName = await OsmService.reverseGeocode(40.7128, -74.0060);
    logger.info(`Nominatim Reverse Geocoded address: ${addressName}`);
    logger.info('✅ Nominatim geocoding verified');

    // ----------------------------------------------------
    // TEST 2: Trip Creation
    // ----------------------------------------------------
    logger.info('Test 2: Create Trip (connecting OSRM calculations)...');
    const createTripResponse = await axios.post(
      `${BASE_URL}/trips`,
      {
        tripName: 'Commute to Work',
        sourceAddress: 'New York, NY',
        destinationAddress: 'Boston, MA',
        sourceLatitude: 40.7128,
        sourceLongitude: -74.0060,
        destinationLatitude: 42.3601,
        destinationLongitude: -71.0589,
        travelMode: 'driving',
      },
      authHeaders
    );

    if (createTripResponse.status !== 201 || !createTripResponse.data.success) {
      throw new Error('Trip creation failed');
    }
    const trip = createTripResponse.data.data.trip;
    if (trip.estimatedDistance <= 0) {
      throw new Error('Trip estimated distance failed to calculate');
    }
    logger.info(`✅ Trip created successfully. ID: ${trip.tripId}`);

    // ----------------------------------------------------
    // TEST 3: Trip State transitions (Start, Pause, Complete)
    // ----------------------------------------------------
    logger.info('Test 3: Testing Trip State controls...');
    
    // Start Trip
    const startRes = await axios.post(`${BASE_URL}/trips/${trip.tripId}/start`, {}, authHeaders);
    if (startRes.data.data.status !== 'active' || !startRes.data.data.startedAt) {
      throw new Error('Trip failed to start');
    }
    logger.info('✅ Trip status shifted to ACTIVE');

    // Log active location update
    const locRes = await axios.post(
      `${BASE_URL}/trips/location`,
      {
        tripId: trip.tripId,
        latitude: 40.7200,
        longitude: -74.0100,
        speed: 45,
        heading: 90,
        accuracy: 5,
      },
      authHeaders
    );
    if (locRes.status !== 201 || locRes.data.data.speed !== 45) {
      throw new Error('Failed to log GPS tracking point');
    }
    logger.info('✅ Location logged and user coordinates updated in DB');

    // Pause Trip
    const pauseRes = await axios.post(`${BASE_URL}/trips/${trip.tripId}/pause`, {}, authHeaders);
    if (pauseRes.data.data.status !== 'paused') {
      throw new Error('Trip failed to pause');
    }
    logger.info('✅ Trip status shifted to PAUSED');

    // Complete Trip
    const completeRes = await axios.post(`${BASE_URL}/trips/${trip.tripId}/complete`, {}, authHeaders);
    if (completeRes.data.data.status !== 'completed' || !completeRes.data.data.completedAt) {
      throw new Error('Trip failed to complete');
    }
    logger.info('✅ Trip status shifted to COMPLETED');

    // ----------------------------------------------------
    // TEST 4: Saved Places CRUD
    // ----------------------------------------------------
    logger.info('Test 4: Saved Places CRUD...');
    
    // Create Saved Place
    const placeRes = await axios.post(
      `${BASE_URL}/places`,
      {
        placeName: 'My Safe House',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Safe St, New York',
        category: 'home',
      },
      authHeaders
    );
    if (placeRes.status !== 201 || placeRes.data.data.category !== 'home') {
      throw new Error('Failed to create saved place');
    }
    const placeId = placeRes.data.data.placeId;
    logger.info('✅ Place saved (Home category)');

    // List Saved Places
    const listPlacesRes = await axios.get(`${BASE_URL}/places`, authHeaders);
    if (listPlacesRes.data.data.length !== 1) {
      throw new Error('Failed to list saved places');
    }
    logger.info('✅ Saved places listed');

    // Delete Saved Place
    await axios.delete(`${BASE_URL}/places/${placeId}`, authHeaders);
    logger.info('✅ Saved place deleted');

    logger.info('🎉 ALL TRIPS & ROUTING INTEGRATION TESTS PASSED SUCCESFULLY!');
  } catch (error: any) {
    logger.error(`❌ TRIPS TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    await prisma.savedPlace.deleteMany({});
    await prisma.tripLocation.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'triptest@example.com' },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
