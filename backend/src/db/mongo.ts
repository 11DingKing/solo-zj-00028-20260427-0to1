import mongoose from 'mongoose'
import { config } from '../config.js'

const MAX_RETRIES = 5
const RETRY_DELAY = 3000

export async function connectMongo() {
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      console.log(`MongoDB 连接尝试 ${retries + 1}/${MAX_RETRIES}...`)
      console.log(`MongoDB URI: ${config.mongoUri}`)

      await mongoose.connect(config.mongoUri)
      console.log('✅ MongoDB 连接成功')
      return
    } catch (error) {
      retries++
      console.error(`❌ MongoDB 连接失败 (尝试 ${retries}/${MAX_RETRIES}):`, error)

      if (retries >= MAX_RETRIES) {
        console.error('MongoDB 连接重试次数耗尽，退出进程')
        process.exit(1)
      }

      console.log(`等待 ${RETRY_DELAY / 1000} 秒后重试...`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
    }
  }
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', err)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB 连接已断开')
})

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB 重新连接成功')
})

export default mongoose
