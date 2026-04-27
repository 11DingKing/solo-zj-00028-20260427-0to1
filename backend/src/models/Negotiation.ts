import mongoose from '../db/mongo.js'

export const NegotiationStatuses = [
  '待处理',
  '已接受',
  '已拒绝',
  '已还价',
  '已取消',
] as const

export type NegotiationStatus = (typeof NegotiationStatuses)[number]

export interface INegotiation extends mongoose.Document {
  productId: mongoose.Types.ObjectId
  buyerId: mongoose.Types.ObjectId
  sellerId: mongoose.Types.ObjectId
  initialPrice: number
  currentPrice: number
  message: string
  status: NegotiationStatus
  counterOfferPrice?: number
  counterOfferMessage?: string
  createdAt: Date
  updatedAt: Date
}

const negotiationSchema = new mongoose.Schema<INegotiation>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
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
    initialPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: NegotiationStatuses,
      default: '待处理',
    },
    counterOfferPrice: {
      type: Number,
      min: 0,
    },
    counterOfferMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

negotiationSchema.index({ productId: 1 })
negotiationSchema.index({ buyerId: 1 })
negotiationSchema.index({ sellerId: 1 })
negotiationSchema.index({ status: 1 })
negotiationSchema.index({ createdAt: -1 })

export const Negotiation = mongoose.model<INegotiation>(
  'Negotiation',
  negotiationSchema
)
