import Redis from 'ioredis'
import { config } from '../config.js'

const redis = new Redis(config.redisUrl, {
  retryStrategy: (times) => {
    if (times > 5) {
      console.error('Redis 连接重试次数超过限制')
      return null
    }
    console.log(`Redis 重新连接尝试 ${times}/5...`)
    return Math.min(times * 1000, 3000)
  },
})

redis.on('connect', () => {
  console.log('✅ Redis 连接成功')
})

redis.on('ready', () => {
  console.log('✅ Redis 已就绪')
})

redis.on('error', (error) => {
  console.error('❌ Redis 连接错误:', error.message)
})

redis.on('close', () => {
  console.warn('⚠️ Redis 连接已关闭')
})

redis.on('reconnecting', () => {
  console.log('🔄 Redis 正在重连...')
})

export default redis
