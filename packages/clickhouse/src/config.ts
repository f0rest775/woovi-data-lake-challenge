export const config = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  CLICKHOUSE_URL: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  CLICKHOUSE_USERNAME: process.env.CLICKHOUSE_USERNAME || 'clickhouse',
  CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD || 'clickhouse123',
  CLICKHOUSE_DB: process.env.CLICKHOUSE_DB || 'pix_analytics',
}