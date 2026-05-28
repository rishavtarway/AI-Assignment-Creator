import IORedis, { RedisOptions } from 'ioredis';

export function createRedisClient(extraOptions: Partial<RedisOptions> = {}): IORedis {
  let url = process.env.REDIS_URL;

  // Programmatic local override to prevent private Render Redis DNS errors on local machines
  if (!process.env.RENDER && url && (url.includes('red-d8c4q37avr4c73efh3dg') || url.includes('render.com') && !url.includes('external'))) {
    console.warn('[Redis] ⚠️ Private Render Redis URL detected locally. Overriding to local fallback (redis://127.0.0.1:6379).');
    url = 'redis://127.0.0.1:6379';
  }

  if (!url) {
    console.error('❌ REDIS_URL is not set! Check your Render environment variables.');
    console.error('   Current env keys:', Object.keys(process.env).filter(k => k.includes('REDIS')));
    throw new Error('REDIS_URL environment variable is required');
  }

  const useTLS = url.startsWith('rediss://');

  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(useTLS ? { tls: { rejectUnauthorized: false } } : {}),
    ...extraOptions,
  };

  console.log(`[Redis] Connecting to: ${url.replace(/:\/\/[^@]+@/, '://***@')} (TLS: ${useTLS})`);
  return new IORedis(url, options);
}