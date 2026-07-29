import http from 'http';
import axios from 'axios';
import app from '../app';
import prisma from '../services/db.service';
import logger from './logger';

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Community Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Community Test Server stopped.');
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
    await prisma.reportedPost.deleteMany({});
    await prisma.messageRead.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.chatParticipant.deleteMany({});
    await prisma.chatRoom.deleteMany({});
    await prisma.savedPost.deleteMany({});
    await prisma.postLike.deleteMany({});
    await prisma.postComment.deleteMany({});
    await prisma.postImage.deleteMany({});
    await prisma.communityPost.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ['commtest@example.com', 'commtarget@example.com'] } },
    });

    // Create primary test user & log in
    logger.info('Registering test users...');
    await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Primary Community User',
      email: 'commtest@example.com',
      phone: '+15559998888',
      password: 'SecurePassword1',
    });

    // Register second target traveler user for chat tests
    const secondUserRes = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Target Traveler',
      email: 'commtarget@example.com',
      phone: '+15557776666',
      password: 'SecurePassword1',
    });
    const targetUserId = secondUserRes.data.data.userId;

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'commtest@example.com',
      password: 'SecurePassword1',
    });

    const { accessToken } = loginResponse.data.data;
    const authHeaders = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    logger.info('✅ Auth token acquired.');

    // ----------------------------------------------------
    // TEST 1: Community Posts Feed CRUD & Radius
    // ----------------------------------------------------
    logger.info('Test 1: Community Posts Feed CRUD...');
    
    // Create Post
    const postRes = await axios.post(
      `${BASE_URL}/community/posts`,
      {
        title: 'Safety Alert: Broken light near metro',
        description: 'Broken streetlight on 5th Avenue alley. Extremely dark after 8 PM.',
        category: 'safety_alert',
        anonymous: true,
        latitude: 40.7128,
        longitude: -74.0060,
        address: '5th Ave Metro, NY',
      },
      authHeaders
    );
    if (postRes.status !== 201 || !postRes.data.success) {
      throw new Error('Post creation failed');
    }
    const post = postRes.data.data;
    logger.info(`✅ Post created. ID: ${post.postId}`);

    // Radius Search (Within 5km: should find it)
    const listResNear = await axios.get(
      `${BASE_URL}/community/posts?latitude=40.7128&longitude=-74.0060&radius=5`,
      authHeaders
    );
    if (listResNear.data.data.length !== 1) {
      throw new Error('Radius check failed to find nearby post');
    }
    logger.info('✅ Nearby posts radius filter verified');

    // Anonymous Flag Verification (should mask name in listings)
    const anonymousPost = listResNear.data.data[0];
    if (anonymousPost.user.fullName !== 'Anonymous Member') {
      throw new Error('Anonymous post failed to mask traveler name');
    }
    logger.info('✅ Anonymous traveler name masking verified');

    // ----------------------------------------------------
    // TEST 2: Likes & Comments Recalculations
    // ----------------------------------------------------
    logger.info('Test 2: Likes and Comments incremental loops...');

    // Like Post
    await axios.post(
      `${BASE_URL}/community/likes`,
      { postId: post.postId },
      authHeaders
    );
    logger.info('✅ Post liked');

    // Comment Post
    await axios.post(
      `${BASE_URL}/community/comments`,
      {
        postId: post.postId,
        comment: 'Agreed, walked there yesterday, felt very unsafe!',
      },
      authHeaders
    );
    logger.info('✅ Comment added');

    // Retrieve details to assert counters
    const detailRes = await axios.get(`${BASE_URL}/community/posts/${post.postId}`, authHeaders);
    const updatedPost = detailRes.data.data;
    if (updatedPost.likes !== 1 || updatedPost.comments !== 1) {
      throw new Error('Likes or Comments counts failed to increment on Post');
    }
    logger.info('✅ Correctly incremented likes & comments counters');

    // ----------------------------------------------------
    // TEST 3: Saves CRUD
    // ----------------------------------------------------
    logger.info('Test 3: Saved Posts CRUD...');

    await axios.post(`${BASE_URL}/community/save`, { postId: post.postId }, authHeaders);
    logger.info('✅ Post saved to bookmarks');

    const savedRes = await axios.get(`${BASE_URL}/community/saved`, authHeaders);
    if (savedRes.data.data.length !== 1) {
      throw new Error('Failed to retrieve bookmarked posts list');
    }
    logger.info('✅ Bookmarked saved posts lookup verified');

    // ----------------------------------------------------
    // TEST 4: Chat Room & Messages Integration
    // ----------------------------------------------------
    logger.info('Test 4: Chat Rooms creation and real-time Messaging...');

    // Create Room (with second target user)
    const roomRes = await axios.post(
      `${BASE_URL}/chat/rooms`,
      {
        roomType: 'private',
        participants: [targetUserId],
      },
      authHeaders
    );
    if (roomRes.status !== 201) {
      throw new Error('Failed to create private chat room');
    }
    const room = roomRes.data.data;
    logger.info(`✅ Chat room created. ID: ${room.roomId}`);

    // Send Message
    const msgRes = await axios.post(
      `${BASE_URL}/chat/messages`,
      {
        roomId: room.roomId,
        messageType: 'text',
        message: 'Hello, are you heading to the safe zone PG?',
      },
      authHeaders
    );
    if (msgRes.status !== 201) {
      throw new Error('Failed to send chat message');
    }
    logger.info('✅ Message sent');

    // Fetch Messages index
    const listMsgRes = await axios.get(`${BASE_URL}/chat/messages/${room.roomId}`, authHeaders);
    if (listMsgRes.data.data.length !== 1) {
      throw new Error('Failed to list messages history');
    }
    logger.info('✅ Messaging history lookup verified');

    logger.info('🎉 ALL COMMUNITY & CHAT INTEGRATION TESTS PASSED SUCCESFULLY!');
  } catch (error: any) {
    logger.error(`❌ COMMUNITY TEST SUITE FAILED: ${error.message}`);
    if (error.response?.data) {
      logger.error(`Response details: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  } finally {
    // Clean up
    await prisma.reportedPost.deleteMany({});
    await prisma.messageRead.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.chatParticipant.deleteMany({});
    await prisma.chatRoom.deleteMany({});
    await prisma.savedPost.deleteMany({});
    await prisma.postLike.deleteMany({});
    await prisma.postComment.deleteMany({});
    await prisma.postImage.deleteMany({});
    await prisma.communityPost.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ['commtest@example.com', 'commtarget@example.com'] } },
    });
    await prisma.$disconnect();
    await stopTestServer();
  }
};

runTests();
