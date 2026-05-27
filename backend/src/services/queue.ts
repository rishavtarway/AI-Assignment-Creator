import { Queue } from 'bullmq';
import { createRedisClient } from './redisClient';

export const redis = createRedisClient();

redis.on('error', (err) => {
  console.error('[Redis] Error:', err);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
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
