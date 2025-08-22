export const config = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://:redis@localhost:6379',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017?authSource=admin',
  CLICKHOUSE_URL: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  CLICKHOUSE_USERNAME: process.env.CLICKHOUSE_USERNAME || 'clickhouse',
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD || 'clickhouse123',
  CLICKHOUSE_DB: process.env.CLICKHOUSE_DB || 'pix_analytics',
}