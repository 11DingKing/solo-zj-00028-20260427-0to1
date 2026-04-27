import mongoose from '../db/mongo.js'
import {
  Notification,
  NotificationType,
} from '../models/Notification.js'

export interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  content: string
  relatedId?: mongoose.Types.ObjectId
  relatedType?: string
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content,
      relatedId: params.relatedId,
      relatedType: params.relatedType,
    })
  } catch (error) {
    console.error('创建通知失败:', error)
  }
}

export async function createNegotiationCreatedNotification(
  sellerId: mongoose.Types.ObjectId,
  productTitle: string,
  negotiationId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: sellerId,
    type: 'negotiation_created',
    title: '收到新议价',
    content: `有人对您的商品"${productTitle}"发起了议价`,
    relatedId: negotiationId,
    relatedType: 'Negotiation',
  })
}

export async function createNegotiationAcceptedNotification(
  buyerId: mongoose.Types.ObjectId,
  productTitle: string,
  negotiationId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: buyerId,
    type: 'negotiation_accepted',
    title: '议价已接受',
    content: `卖家接受了您对"${productTitle}"的议价`,
    relatedId: negotiationId,
    relatedType: 'Negotiation',
  })
}

export async function createNegotiationRejectedNotification(
  buyerId: mongoose.Types.ObjectId,
  productTitle: string,
  negotiationId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: buyerId,
    type: 'negotiation_rejected',
    title: '议价被拒绝',
    content: `卖家拒绝了您对"${productTitle}"的议价`,
    relatedId: negotiationId,
    relatedType: 'Negotiation',
  })
}

export async function createNegotiationCounteredNotification(
  buyerId: mongoose.Types.ObjectId,
  productTitle: string,
  negotiationId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: buyerId,
    type: 'negotiation_countered',
    title: '卖家还价',
    content: `卖家对"${productTitle}"进行了还价`,
    relatedId: negotiationId,
    relatedType: 'Negotiation',
  })
}

export async function createOrderCreatedNotification(
  sellerId: mongoose.Types.ObjectId,
  productTitle: string,
  orderId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: sellerId,
    type: 'order_created',
    title: '新订单',
    content: `您的商品"${productTitle}"有了新订单`,
    relatedId: orderId,
    relatedType: 'Order',
  })
}

export async function createOrderPaidNotification(
  sellerId: mongoose.Types.ObjectId,
  productTitle: string,
  orderId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: sellerId,
    type: 'order_paid',
    title: '订单已付款',
    content: `买家已支付"${productTitle}"的订单`,
    relatedId: orderId,
    relatedType: 'Order',
  })
}

export async function createOrderCompletedNotification(
  buyerId: mongoose.Types.ObjectId,
  sellerId: mongoose.Types.ObjectId,
  productTitle: string,
  orderId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: buyerId,
    type: 'order_completed',
    title: '订单已完成',
    content: `您购买的"${productTitle}"订单已完成`,
    relatedId: orderId,
    relatedType: 'Order',
  })

  await createNotification({
    userId: sellerId,
    type: 'order_completed',
    title: '订单已完成',
    content: `您售出的"${productTitle}"订单已完成`,
    relatedId: orderId,
    relatedType: 'Order',
  })
}

export async function createOrderCancelledNotification(
  buyerId: mongoose.Types.ObjectId,
  sellerId: mongoose.Types.ObjectId,
  productTitle: string,
  orderId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: buyerId,
    type: 'order_cancelled',
    title: '订单已取消',
    content: `您购买的"${productTitle}"订单已取消`,
    relatedId: orderId,
    relatedType: 'Order',
  })

  await createNotification({
    userId: sellerId,
    type: 'order_cancelled',
    title: '订单已取消',
    content: `您售出的"${productTitle}"订单已取消`,
    relatedId: orderId,
    relatedType: 'Order',
  })
}

export async function createReviewReceivedNotification(
  revieweeId: mongoose.Types.ObjectId,
  reviewerNickname: string,
  orderId: mongoose.Types.ObjectId
): Promise<void> {
  await createNotification({
    userId: revieweeId,
    type: 'review_received',
    title: '收到新评价',
    content: `用户 ${reviewerNickname} 对您进行了评价`,
    relatedId: orderId,
    relatedType: 'Review',
  })
}
