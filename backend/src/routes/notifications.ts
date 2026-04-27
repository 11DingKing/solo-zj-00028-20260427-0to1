import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { Notification } from '../models/Notification.js'
import mongoose from '../db/mongo.js'

const notifications = new Hono()

notifications.use(authMiddleware)

notifications.get('/', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const { read, limit = '20', offset = '0' } = c.req.query()

    const filter: any = { userId }
    if (read !== undefined) {
      filter.read = read === 'true'
    }

    const limitNum = parseInt(limit) || 20
    const offsetNum = parseInt(offset) || 0

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
    ])

    return c.json({
      items,
      total,
      unreadCount,
    })
  } catch (error) {
    console.error('获取通知列表错误:', error)
    return c.json({ error: '获取通知列表失败' }, 500)
  }
})

notifications.get('/unread-count', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId

    const count = await Notification.countDocuments({
      userId,
      read: false,
    })

    return c.json({ count })
  } catch (error) {
    console.error('获取未读通知数量错误:', error)
    return c.json({ error: '获取未读通知数量失败' }, 500)
  }
})

notifications.put('/:id/read', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readAt: new Date() },
      { new: true }
    )

    if (!notification) {
      return c.json({ error: '通知不存在' }, 404)
    }

    return c.json(notification)
  } catch (error) {
    console.error('标记通知已读错误:', error)
    return c.json({ error: '标记通知已读失败' }, 500)
  }
})

notifications.put('/read-all', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    )

    return c.json({ message: '已全部标记为已读' })
  } catch (error) {
    console.error('标记全部通知已读错误:', error)
    return c.json({ error: '标记全部通知已读失败' }, 500)
  }
})

notifications.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    })

    if (!notification) {
      return c.json({ error: '通知不存在' }, 404)
    }

    return c.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除通知错误:', error)
    return c.json({ error: '删除通知失败' }, 500)
  }
})

export default notifications
