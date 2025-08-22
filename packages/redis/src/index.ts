import { config } from './config'
import IORedis from 'ioredis'

export const redis = new IORedis(config.REDIS_URL)
