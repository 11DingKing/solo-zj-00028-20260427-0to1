import { Hono } from 'hono'
import { z } from 'zod'
import { User } from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import { registerSchema, loginSchema } from '../utils/validation.js'

const auth = new Hono()

auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    const existingUser = await User.findOne({
      $or: [
        { username: validated.username },
        { email: validated.email },
      ],
    })

    if (existingUser) {
      if (existingUser.username === validated.username) {
        return c.json({ error: '用户名已存在' }, 400)
      }
      return c.json({ error: '邮箱已被注册' }, 400)
    }

    const user = new User({
      username: validated.username,
      email: validated.email,
      password: validated.password,
      nickname: validated.nickname,
    })

    await user.save()

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    })

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      creditScore: user.creditScore,
      createdAt: user.createdAt,
    }

    return c.json(
      {
        message: '注册成功',
        user: userResponse,
        token,
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: '参数验证失败', details: error.errors },
        400
      )
    }
    console.error('注册错误:', error)
    return c.json({ error: '注册失败' }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validated = loginSchema.parse(body)

    const user = await User.findOne({
      username: validated.username,
    })

    if (!user) {
      return c.json({ error: '用户名或密码错误' }, 401)
    }

    const isPasswordValid = await user.comparePassword(validated.password)
    if (!isPasswordValid) {
      return c.json({ error: '用户名或密码错误' }, 401)
    }

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    })

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      creditScore: user.creditScore,
      createdAt: user.createdAt,
    }

    return c.json({
      message: '登录成功',
      user: userResponse,
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: '参数验证失败', details: error.errors },
        400
      )
    }
    console.error('登录错误:', error)
    return c.json({ error: '登录失败' }, 500)
  }
})

export default auth
