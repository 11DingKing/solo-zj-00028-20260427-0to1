import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { Review } from '../models/Review.js'
import { Order } from '../models/Order.js'
import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { createReviewSchema } from '../utils/validation.js'
import mongoose from '../db/mongo.js'
import { createReviewReceivedNotification } from '../services/notification.js'

const reviews = new Hono()

reviews.use(authMiddleware)

reviews.post('/', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const body = await c.req.json()
    const validated = createReviewSchema.parse(body)

    const order = await Order.findById(validated.orderId)
    if (!order) {
      return c.json({ error: '订单不存在' }, 404)
    }

    if (order.status !== '已完成') {
      return c.json({ error: '只能对已完成的订单进行评价' }, 400)
    }

    const isBuyer = order.buyerId.toString() === userId.toString()
    const isSeller = order.sellerId.toString() === userId.toString()

    if (!isBuyer && !isSeller) {
      return c.json({ error: '无权限评价此订单' }, 403)
    }

    const revieweeId = isBuyer ? order.sellerId : order.buyerId

    const existingReview = await Review.findOne({
      orderId: order._id,
      reviewerId: userId,
    })

    if (existingReview) {
      return c.json({ error: '您已评价过此订单' }, 400)
    }

    const review = new Review({
      orderId: order._id,
      productId: order.productId,
      reviewerId: userId,
      revieweeId,
      rating: validated.rating,
      comment: validated.comment || '',
    })

    await review.save()

    const allReviews = await Review.find({ revieweeId })
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allReviews.length

    const user = await User.findById(revieweeId)
    if (user) {
      user.creditScore = Math.round(avgRating * 10) / 10
      await user.save()
    }

    const reviewer = await User.findById(userId)
    if (reviewer) {
      await createReviewReceivedNotification(
        revieweeId,
        reviewer.nickname,
        order._id as mongoose.Types.ObjectId
      )
    }

    const populated = await review.populate([
      {
        path: 'reviewerId',
        select: 'nickname avatar creditScore',
        model: User,
      },
      {
        path: 'revieweeId',
        select: 'nickname avatar creditScore',
        model: User,
      },
    ])

    return c.json(populated, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: '参数验证失败', details: error.errors },
        400
      )
    }
    console.error('创建评价错误:', error)
    return c.json({ error: '创建评价失败' }, 500)
  }
})

reviews.get('/my', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId

    const reviews = await Review.find({
      $or: [{ reviewerId: userId }, { revieweeId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate([
        {
          path: 'productId',
          model: Product,
        },
        {
          path: 'reviewerId',
          select: 'nickname avatar creditScore',
          model: User,
        },
        {
          path: 'revieweeId',
          select: 'nickname avatar creditScore',
          model: User,
        },
      ])

    return c.json(reviews)
  } catch (error) {
    console.error('获取评价列表错误:', error)
    return c.json({ error: '获取评价列表失败' }, 500)
  }
})

reviews.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')

    const reviews = await Review.find({ revieweeId: userId })
      .sort({ createdAt: -1 })
      .populate([
        {
          path: 'productId',
          model: Product,
        },
        {
          path: 'reviewerId',
          select: 'nickname avatar creditScore',
          model: User,
        },
      ])

    const stats = await Review.aggregate([
      { $match: { revieweeId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ])

    return c.json({
      reviews,
      stats: stats[0] || { averageRating: 0, totalReviews: 0 },
    })
  } catch (error) {
    console.error('获取用户评价错误:', error)
    return c.json({ error: '获取用户评价失败' }, 500)
  }
})

export default reviews
