import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { Negotiation } from '../models/Negotiation.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import {
  createNegotiationSchema,
  handleNegotiationSchema,
} from '../utils/validation.js'
import mongoose from '../db/mongo.js'
import {
  createNegotiationAcceptedNotification,
  createNegotiationCounteredNotification,
  createNegotiationCreatedNotification,
  createNegotiationRejectedNotification,
} from '../services/notification.js'

const negotiations = new Hono()

negotiations.use(authMiddleware)

negotiations.post('/', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const body = await c.req.json()
    const validated = createNegotiationSchema.parse(body)

    const product = await Product.findById(validated.productId)
    if (!product) {
      return c.json({ error: '商品不存在' }, 404)
    }

    if (product.status !== '在售') {
      return c.json({ error: '商品已不在在售状态' }, 400)
    }

    if (product.sellerId.toString() === userId.toString()) {
      return c.json({ error: '不能对自己的商品议价' }, 400)
    }

    const existingNegotiation = await Negotiation.findOne({
      productId: product._id,
      buyerId: userId,
      status: { $in: ['待处理', '已还价'] },
    })

    if (existingNegotiation) {
      return c.json({ error: '您已有进行中的议价' }, 400)
    }

    const negotiation = new Negotiation({
      productId: product._id,
      buyerId: userId,
      sellerId: product.sellerId,
      initialPrice: validated.price,
      currentPrice: validated.price,
      message: validated.message || '',
    })

    await negotiation.save()

    await createNegotiationCreatedNotification(
      product.sellerId,
      product.title,
      negotiation._id as mongoose.Types.ObjectId
    )

    const populated = await negotiation.populate([
      {
        path: 'productId',
        model: Product,
      },
      {
        path: 'buyerId',
        select: 'nickname avatar creditScore',
        model: User,
      },
      {
        path: 'sellerId',
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
    console.error('创建议价错误:', error)
    return c.json({ error: '创建议价失败' }, 500)
  }
})

negotiations.get('/my', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const { type } = c.req.query()

    const filter: any = {}
    if (type === 'sent') {
      filter.buyerId = userId
    } else if (type === 'received') {
      filter.sellerId = userId
    } else {
      filter.$or = [{ buyerId: userId }, { sellerId: userId }]
    }

    const items = await Negotiation.find(filter)
      .sort({ createdAt: -1 })
      .populate([
        {
          path: 'productId',
          model: Product,
        },
        {
          path: 'buyerId',
          select: 'nickname avatar creditScore',
          model: User,
        },
        {
          path: 'sellerId',
          select: 'nickname avatar creditScore',
          model: User,
        },
      ])

    return c.json(items)
  } catch (error) {
    console.error('获取议价列表错误:', error)
    return c.json({ error: '获取议价列表失败' }, 500)
  }
})

negotiations.get('/:id', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const negotiation = await Negotiation.findById(id).populate([
      {
        path: 'productId',
        model: Product,
      },
      {
        path: 'buyerId',
        select: 'nickname avatar creditScore',
        model: User,
      },
      {
        path: 'sellerId',
        select: 'nickname avatar creditScore',
        model: User,
      },
    ])

    if (!negotiation) {
      return c.json({ error: '议价不存在' }, 404)
    }

    if (
      negotiation.buyerId._id.toString() !== userId.toString() &&
      negotiation.sellerId._id.toString() !== userId.toString()
    ) {
      return c.json({ error: '无权限查看此议价' }, 403)
    }

    return c.json(negotiation)
  } catch (error) {
    console.error('获取议价详情错误:', error)
    return c.json({ error: '获取议价详情失败' }, 500)
  }
})

negotiations.post('/:id/handle', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = handleNegotiationSchema.parse(body)

    const negotiation = await Negotiation.findById(id).populate([
      {
        path: 'productId',
        model: Product,
      },
    ])

    if (!negotiation) {
      return c.json({ error: '议价不存在' }, 404)
    }

    if (negotiation.sellerId.toString() !== userId.toString()) {
      return c.json({ error: '只有卖家可以处理议价' }, 403)
    }

    if (negotiation.status !== '待处理' && negotiation.status !== '已还价') {
      return c.json({ error: '议价已处理' }, 400)
    }

    const product = negotiation.productId as any
    const productId = product._id

    if (validated.action === 'accept') {
      negotiation.status = '已接受'
      negotiation.currentPrice =
        negotiation.counterOfferPrice ?? negotiation.initialPrice

      const productDoc = await Product.findById(productId)
      if (productDoc) {
        productDoc.status = '已预留'
        await productDoc.save()
      }

      await createNegotiationAcceptedNotification(
        negotiation.buyerId,
        product.title,
        negotiation._id as mongoose.Types.ObjectId
      )
    } else if (validated.action === 'reject') {
      negotiation.status = '已拒绝'

      await createNegotiationRejectedNotification(
        negotiation.buyerId,
        product.title,
        negotiation._id as mongoose.Types.ObjectId
      )
    } else if (validated.action === 'counter') {
      if (!validated.counterPrice) {
        return c.json({ error: '还价必须提供价格' }, 400)
      }
      negotiation.status = '已还价'
      negotiation.counterOfferPrice = validated.counterPrice
      negotiation.counterOfferMessage = validated.counterMessage

      await createNegotiationCounteredNotification(
        negotiation.buyerId,
        product.title,
        negotiation._id as mongoose.Types.ObjectId
      )
    }

    await negotiation.save()

    const populated = await negotiation.populate([
      {
        path: 'buyerId',
        select: 'nickname avatar creditScore',
        model: User,
      },
      {
        path: 'sellerId',
        select: 'nickname avatar creditScore',
        model: User,
      },
    ])

    return c.json(populated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: '参数验证失败', details: error.errors },
        400
      )
    }
    console.error('处理议价错误:', error)
    return c.json({ error: '处理议价失败' }, 500)
  }
})

negotiations.post('/:id/cancel', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const negotiation = await Negotiation.findById(id)

    if (!negotiation) {
      return c.json({ error: '议价不存在' }, 404)
    }

    if (negotiation.buyerId.toString() !== userId.toString()) {
      return c.json({ error: '只有买家可以取消议价' }, 403)
    }

    if (negotiation.status === '已接受') {
      const product = await Product.findById(negotiation.productId)
      if (product && product.status === '已预留') {
        product.status = '在售'
        await product.save()
      }
    }

    negotiation.status = '已取消'
    await negotiation.save()

    return c.json({ message: '议价已取消' })
  } catch (error) {
    console.error('取消议价错误:', error)
    return c.json({ error: '取消议价失败' }, 500)
  }
})

export default negotiations
