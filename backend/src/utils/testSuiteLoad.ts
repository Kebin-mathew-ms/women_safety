import http from 'http';
import axios from 'axios';
import app from '../app';
import logger from './logger';

const TEST_PORT = 5004;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      logger.info(`🧪 Performance Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });
};

const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('🧪 Performance Test Server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const runLoadSimulation = async (concurrency: number) => {
  logger.info(`🚀 Starting load simulation with ${concurrency} concurrent requests to /api/health...`);
  const startTime = Date.now();
  
  const promises = Array.from({ length: concurrency }).map(async (_, idx) => {
    try {
      const res = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      return { idx, success: res.status === 200, time: Date.now() - startTime };
    } catch (err: any) {
      return { idx, success: false, time: Date.now() - startTime, error: err.message };
    }
  });

  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  const successes = results.filter((r) => r.success).length;
  const failures = concurrency - successes;
  const avgResponseTime = results.reduce((acc, r) => acc + r.time, 0) / concurrency;

  logger.info(`📊 Results for ${concurrency} Requests:`);
  logger.info(`   - Success Rate : ${successes}/${concurrency} (${Math.round((successes/concurrency)*100)}%)`);
  logger.info(`   - Failures     : ${failures}`);
  logger.info(`   - Total Duration: ${totalTime}ms`);
  logger.info(`   - Avg Latency  : ${Math.round(avgResponseTime)}ms`);
  logger.info(`   - Throughput   : ${Math.round((concurrency / (totalTime / 1000)))} req/sec`);

  if (failures > 0) {
    logger.warn(`⚠️ Warning: ${failures} requests failed under ${concurrency} load. Check database connection pool limits.`);
  } else {
    logger.info(`✅ Success: All ${concurrency} requests completed with zero failures.`);
  }

  return { concurrency, successes, failures, totalTime, avgResponseTime };
};

const main = async () => {
  try {
    await startTestServer();

    // 100 Concurrent requests
    await runLoadSimulation(100);
    console.log('\n-----------------------------------------\n');

    // 500 Concurrent requests
    await runLoadSimulation(500);
    console.log('\n-----------------------------------------\n');

    // 1000 Concurrent requests
    await runLoadSimulation(1000);

    logger.info('🎉 Load simulation runs completed.');
  } catch (err: any) {
    logger.error('Load testing error:', err);
  } finally {
    await stopTestServer();
  }
};

main();
