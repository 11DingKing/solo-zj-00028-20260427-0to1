import mongoose from '../db/mongo.js'

export interface IReview extends mongoose.Document {
  orderId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  reviewerId: mongoose.Types.ObjectId
  revieweeId: mongoose.Types.ObjectId
  rating: number
  comment: string
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new mongoose.Schema<IReview>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

reviewSchema.index({ orderId: 1 })
reviewSchema.index({ productId: 1 })
reviewSchema.index({ reviewerId: 1 })
reviewSchema.index({ revieweeId: 1 })
reviewSchema.index({ createdAt: -1 })

export const Review = mongoose.model<IReview>('Review', reviewSchema)
