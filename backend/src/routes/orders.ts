import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Negotiation } from '../models/Negotiation.js'
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../utils/validation.js'
import mongoose from '../db/mongo.js'
import {
  createOrderCancelledNotification,
  createOrderCompletedNotification,
  createOrderCreatedNotification,
  createOrderPaidNotification,
} from '../services/notification.js'

const orders = new Hono()

orders.use(authMiddleware)

orders.post('/', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const body = await c.req.json()
    const validated = createOrderSchema.parse(body)

    const product = await Product.findById(validated.productId)
    if (!product) {
      return c.json({ error: '商品不存在' }, 404)
    }

    if (product.status !== '在售') {
      return c.json({ error: '商品已不在在售状态' }, 400)
    }

    if (product.sellerId.toString() === userId.toString()) {
      return c.json({ error: '不能购买自己的商品' }, 400)
    }

    let price = product.price
    let negotiationId: mongoose.Types.ObjectId | undefined

    if (validated.negotiationId) {
      const negotiation = await Negotiation.findById(validated.negotiationId)
      if (!negotiation) {
        return c.json({ error: '议价不存在' }, 404)
      }
      if (negotiation.buyerId.toString() !== userId.toString()) {
        return c.json({ error: '议价不属于当前用户' }, 403)
      }
      if (negotiation.status !== '已接受') {
        return c.json({ error: '议价未被接受' }, 400)
      }
      price = negotiation.currentPrice
      negotiationId = negotiation._id as mongoose.Types.ObjectId
    }

    const order = new Order({
      productId: product._id,
      negotiationId,
      buyerId: userId,
      sellerId: product.sellerId,
      price,
    })

    await order.save()

    product.status = '已预留'
    await product.save()

    await createOrderCreatedNotification(
      product.sellerId,
      product.title,
      order._id as mongoose.Types.ObjectId
    )

    const populated = await order.populate([
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
    console.error('创建订单错误:', error)
    return c.json({ error: '创建订单失败' }, 500)
  }
})

orders.get('/my', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const { type } = c.req.query()

    const filter: any = {}
    if (type === 'bought') {
      filter.buyerId = userId
    } else if (type === 'sold') {
      filter.sellerId = userId
    } else {
      filter.$or = [{ buyerId: userId }, { sellerId: userId }]
    }

    const items = await Order.find(filter)
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
    console.error('获取订单列表错误:', error)
    return c.json({ error: '获取订单列表失败' }, 500)
  }
})

orders.get('/:id', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const order = await Order.findById(id).populate([
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

    if (!order) {
      return c.json({ error: '订单不存在' }, 404)
    }

    if (
      order.buyerId._id.toString() !== userId.toString() &&
      order.sellerId._id.toString() !== userId.toString()
    ) {
      return c.json({ error: '无权限查看此订单' }, 403)
    }

    return c.json(order)
  } catch (error) {
    console.error('获取订单详情错误:', error)
    return c.json({ error: '获取订单详情失败' }, 500)
  }
})

orders.post('/:id/pay', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const order = await Order.findById(id).populate([
      {
        path: 'productId',
        model: Product,
      },
    ])

    if (!order) {
      return c.json({ error: '订单不存在' }, 404)
    }

    if (order.buyerId.toString() !== userId.toString()) {
      return c.json({ error: '只有买家可以支付订单' }, 403)
    }

    if (order.status !== '待付款') {
      return c.json({ error: '订单不在待付款状态' }, 400)
    }

    order.status = '已付款'
    order.paidAt = new Date()
    await order.save()

    const product = order.productId as any

    await createOrderPaidNotification(
      order.sellerId,
      product.title,
      order._id as mongoose.Types.ObjectId
    )

    const populated = await order.populate([
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
    console.error('支付订单错误:', error)
    return c.json({ error: '支付订单失败' }, 500)
  }
})

orders.post('/:id/complete', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')

    const order = await Order.findById(id).populate([
      {
        path: 'productId',
        model: Product,
      },
    ])

    if (!order) {
      return c.json({ error: '订单不存在' }, 404)
    }

    if (
      order.buyerId.toString() !== userId.toString() &&
      order.sellerId.toString() !== userId.toString()
    ) {
      return c.json({ error: '无权限操作此订单' }, 403)
    }

    if (order.status !== '已付款' && order.status !== '交易中') {
      return c.json({ error: '订单不在可完成状态' }, 400)
    }

    order.status = '已完成'
    order.completedAt = new Date()
    await order.save()

    const product = order.productId as any
    const productDoc = await Product.findById(product._id)
    if (productDoc) {
      productDoc.status = '已售出'
      await productDoc.save()
    }

    await createOrderCompletedNotification(
      order.buyerId,
      order.sellerId,
      product.title,
      order._id as mongoose.Types.ObjectId
    )

    const populated = await order.populate([
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
    console.error('完成订单错误:', error)
    return c.json({ error: '完成订单失败' }, 500)
  }
})

orders.post('/:id/cancel', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const id = c.req.param('id')
    const body = await c.req.json()

    const order = await Order.findById(id).populate([
      {
        path: 'productId',
        model: Product,
      },
    ])

    if (!order) {
      return c.json({ error: '订单不存在' }, 404)
    }

    if (
      order.buyerId.toString() !== userId.toString() &&
      order.sellerId.toString() !== userId.toString()
    ) {
      return c.json({ error: '无权限操作此订单' }, 403)
    }

    if (order.status === '已完成') {
      return c.json({ error: '已完成的订单不能取消' }, 400)
    }

    order.status = '已取消'
    order.cancelledAt = new Date()
    order.cancelReason = body?.reason || '用户取消'
    await order.save()

    const product = order.productId as any
    const productDoc = await Product.findById(product._id)
    if (productDoc && productDoc.status === '已预留') {
      productDoc.status = '在售'
      await productDoc.save()
    }

    await createOrderCancelledNotification(
      order.buyerId,
      order.sellerId,
      product.title,
      order._id as mongoose.Types.ObjectId
    )

    return c.json({ message: '订单已取消' })
  } catch (error) {
    console.error('取消订单错误:', error)
    return c.json({ error: '取消订单失败' }, 500)
  }
})

export default orders
