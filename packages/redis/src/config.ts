export const config = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://:redis@localhost:6379',
}