import mongoose from '../db/mongo.js'

export interface IFavorite extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const favoriteSchema = new mongoose.Schema<IFavorite>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })
favoriteSchema.index({ userId: 1 })
favoriteSchema.index({ productId: 1 })

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema)
