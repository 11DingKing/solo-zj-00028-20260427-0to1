import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { updateUserSchema } from '../utils/validation.js'
import mongoose from '../db/mongo.js'

const users = new Hono()

users.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return c.json({ error: '用户不存在' }, 404)
    }

    return c.json(user)
  } catch (error) {
    console.error('获取当前用户错误:', error)
    return c.json({ error: '获取用户信息失败' }, 500)
  }
})

users.put('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const body = await c.req.json()
    const validated = updateUserSchema.parse(body)

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: validated },
      { new: true }
    ).select('-password')

    if (!user) {
      return c.json({ error: '用户不存在' }, 404)
    }

    return c.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: '参数验证失败', details: error.errors },
        400
      )
    }
    console.error('更新用户信息错误:', error)
    return c.json({ error: '更新用户信息失败' }, 500)
  }
})

users.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const user = await User.findById(id).select(
      '-password -email -username'
    )
    if (!user) {
      return c.json({ error: '用户不存在' }, 404)
    }

    return c.json(user)
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return c.json({ error: '获取用户信息失败' }, 500)
  }
})

export default users
