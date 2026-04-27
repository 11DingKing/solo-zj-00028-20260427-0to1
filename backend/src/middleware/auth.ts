import { Context, Next } from 'hono'
import { verifyToken } from '../utils/jwt.js'
import { User } from '../models/User.js'
import mongoose from '../db/mongo.js'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权，请先登录' }, 401)
  }

  const token = authHeader.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    return c.json({ error: 'Token 无效或已过期' }, 401)
  }

  try {
    const user = await User.findById(payload.userId).select('-password')
    if (!user) {
      return c.json({ error: '用户不存在' }, 401)
    }

    c.set('user', user)
    c.set('userId', new mongoose.Types.ObjectId(payload.userId))
  } catch (error) {
    return c.json({ error: '用户验证失败' }, 401)
  }

  await next()
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (payload) {
      try {
        const user = await User.findById(payload.userId).select('-password')
        if (user) {
          c.set('user', user)
          c.set('userId', new mongoose.Types.ObjectId(payload.userId))
        }
      } catch {
        // Ignore optional auth errors
      }
    }
  }

  await next()
}
