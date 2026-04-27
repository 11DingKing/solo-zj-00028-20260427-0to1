import Redis from 'ioredis'
import { config } from '../config.js'

const redis = new Redis(config.redisUrl)

redis.on('connect', () => {
  console.log('Redis connected successfully')
})

redis.on('error', (error) => {
  console.error('Redis connection error:', error)
})

export default redis
