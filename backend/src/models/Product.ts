import mongoose from '../db/mongo.js'

export const ProductCategories = [
  '教材',
  '电子产品',
  '生活用品',
  '服饰',
  '运动器材',
  '其他',
] as const

export const ProductConditions = [
  '全新',
  '几乎全新',
  '轻微使用痕迹',
  '明显使用痕迹',
] as const

export const TransactionMethods = ['当面交易', '邮寄', '都可以'] as const

export const ProductStatuses = [
  '在售',
  '已预留',
  '已售出',
  '已下架',
] as const

export type ProductCategory = (typeof ProductCategories)[number]
export type ProductCondition = (typeof ProductConditions)[number]
export type TransactionMethod = (typeof TransactionMethods)[number]
export type ProductStatus = (typeof ProductStatuses)[number]

export interface IProduct extends mongoose.Document {
  title: string
  description: string
  originalPrice: number
  price: number
  category: ProductCategory
  condition: ProductCondition
  transactionMethod: TransactionMethod
  images: string[]
  status: ProductStatus
  sellerId: mongoose.Types.ObjectId
  viewCount: number
  favorites: number
  createdAt: Date
  updatedAt: Date
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ProductCategories,
    },
    condition: {
      type: String,
      required: true,
      enum: ProductConditions,
    },
    transactionMethod: {
      type: String,
      required: true,
      enum: TransactionMethods,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 6,
        message: '最多只能上传6张图片',
      },
    },
    status: {
      type: String,
      enum: ProductStatuses,
      default: '在售',
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    favorites: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

productSchema.index({ title: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ price: 1 })
productSchema.index({ condition: 1 })
productSchema.index({ transactionMethod: 1 })
productSchema.index({ status: 1 })
productSchema.index({ sellerId: 1 })
productSchema.index({ viewCount: -1 })
productSchema.index({ createdAt: -1 })

export const Product = mongoose.model<IProduct>('Product', productSchema)
