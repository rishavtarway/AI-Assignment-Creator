import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

export const assignmentQueue = new Queue('assignment-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const getJobState = async (jobId: string) => {
  const cached = await redis.get(`job:${jobId}:state`);
  return cached ? JSON.parse(cached) : null;
};

export const setJobState = async (jobId: string, state: any, ttl = 3600) => {
  await redis.set(`job:${jobId}:state`, JSON.stringify(state), 'EX', ttl);
};
