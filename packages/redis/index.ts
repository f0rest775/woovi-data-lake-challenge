import { config } from '@data-lake/env'
import IORedis from 'ioredis'

export const redis = new IORedis(config.REDIS_URL)
