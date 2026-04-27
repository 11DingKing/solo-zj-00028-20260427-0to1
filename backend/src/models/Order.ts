import mongoose from '../db/mongo.js'

export const OrderStatuses = [
  '待付款',
  '已付款',
  '交易中',
  '已完成',
  '已取消',
] as const

export type OrderStatus = (typeof OrderStatuses)[number]

export interface IOrder extends mongoose.Document {
  productId: mongoose.Types.ObjectId
  negotiationId?: mongoose.Types.ObjectId
  buyerId: mongoose.Types.ObjectId
  sellerId: mongoose.Types.ObjectId
  price: number
  status: OrderStatus
  paidAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  cancelReason?: string
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: OrderStatuses,
      default: '待付款',
    },
    paidAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

orderSchema.index({ productId: 1 })
orderSchema.index({ buyerId: 1 })
orderSchema.index({ sellerId: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })

export const Order = mongoose.model<IOrder>('Order', orderSchema)
