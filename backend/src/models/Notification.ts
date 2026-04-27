import mongoose from '../db/mongo.js'

export const NotificationTypes = [
  'negotiation_created',
  'negotiation_accepted',
  'negotiation_rejected',
  'negotiation_countered',
  'order_created',
  'order_paid',
  'order_completed',
  'order_cancelled',
  'review_received',
] as const

export type NotificationType = (typeof NotificationTypes)[number]

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  content: string
  relatedId?: mongoose.Types.ObjectId
  relatedType?: string
  read: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: NotificationTypes,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedType',
    },
    relatedType: {
      type: String,
      enum: ['Product', 'Negotiation', 'Order', 'Review'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

notificationSchema.index({ userId: 1 })
notificationSchema.index({ userId: 1, read: 1 })
notificationSchema.index({ createdAt: -1 })

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
)
