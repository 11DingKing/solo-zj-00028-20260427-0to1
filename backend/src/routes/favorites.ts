import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { Favorite } from '../models/Favorite.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { favoriteSchema } from '../utils/validation.js'
import mongoose from '../db/mongo.js'

const favorites = new Hono()

favorites.use(authMiddleware)

favorites.post('/', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const body = await c.req.json()
    const validated = favoriteSchema.parse(body)

    const product = await Product.findById(validated.productId)
    if (!product) {
      return c.json({ error: '商品不存在' }, 404)
    }

    const existing = await Favorite.findOne({
      userId,
      productId: product._id,
    })

    if (existing) {
      return c.json({ message: '已收藏', isFavorite: true })
    }

    const favorite = new Favorite({
      userId,
      productId: product._id,
    })

    await favorite.save()

    product.favorites += 1
    await product.save()

    return c.json({ message: '收藏成功', isFavorite: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: '参数验证失败', details: error.errors },
        400
      )
    }
    console.error('添加收藏错误:', error)
    return c.json({ error: '添加收藏失败' }, 500)
  }
})

favorites.delete('/:productId', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const productId = c.req.param('productId')

    const favorite = await Favorite.findOneAndDelete({
      userId,
      productId,
    })

    if (!favorite) {
      return c.json({ error: '收藏不存在' }, 404)
    }

    const product = await Product.findById(productId)
    if (product && product.favorites > 0) {
      product.favorites -= 1
      await product.save()
    }

    return c.json({ message: '取消收藏成功', isFavorite: false })
  } catch (error) {
    console.error('取消收藏错误:', error)
    return c.json({ error: '取消收藏失败' }, 500)
  }
})

favorites.get('/', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const { page = '1', limit = '20' } = c.req.query()

    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20
    const skip = (pageNum - 1) * limitNum

    const [favorites, total] = await Promise.all([
      Favorite.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'productId',
          model: Product,
          populate: {
            path: 'sellerId',
            select: 'nickname avatar creditScore',
            model: User,
          },
        }),
      Favorite.countDocuments({ userId }),
    ])

    const items = favorites
      .filter((f) => f.productId)
      .map((f) => ({
        ...(f.productId as any).toObject(),
        isFavorite: true,
      }))

    return c.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (error) {
    console.error('获取收藏列表错误:', error)
    return c.json({ error: '获取收藏列表失败' }, 500)
  }
})

favorites.get('/check/:productId', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const productId = c.req.param('productId')

    const favorite = await Favorite.findOne({
      userId,
      productId,
    })

    return c.json({ isFavorite: !!favorite })
  } catch (error) {
    console.error('检查收藏状态错误:', error)
    return c.json({ error: '检查收藏状态失败' }, 500)
  }
})

export default favorites
