import { z } from 'zod'
import {
  ProductCategories,
  ProductConditions,
  TransactionMethods,
} from '../models/Product.js'
import { NegotiationStatuses } from '../models/Negotiation.js'
import { OrderStatuses } from '../models/Order.js'

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().min(1).max(30),
})

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export const createProductSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(2000),
  originalPrice: z.number().min(0),
  price: z.number().min(0),
  category: z.enum(ProductCategories),
  condition: z.enum(ProductConditions),
  transactionMethod: z.enum(TransactionMethods),
})

export const updateProductSchema = createProductSchema.partial().extend({
  status: z
    .enum(['在售', '已预留', '已售出', '已下架'] as const)
    .optional(),
})

export const productListSchema = z.object({
  category: z.enum(ProductCategories).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: z.enum(ProductConditions).optional(),
  transactionMethod: z.enum(TransactionMethods).optional(),
  keyword: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'created_at']).default('created_at'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createNegotiationSchema = z.object({
  productId: z.string(),
  price: z.number().min(0),
  message: z.string().max(500).optional(),
})

export const handleNegotiationSchema = z.object({
  action: z.enum(['accept', 'reject', 'counter']),
  counterPrice: z.number().min(0).optional(),
  counterMessage: z.string().max(500).optional(),
})

export const createOrderSchema = z.object({
  productId: z.string(),
  negotiationId: z.string().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['已付款', '交易中', '已完成', '已取消'] as const),
  cancelReason: z.string().max(500).optional(),
})

export const createReviewSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const favoriteSchema = z.object({
  productId: z.string(),
})

export const updateUserSchema = z.object({
  nickname: z.string().min(1).max(30).optional(),
  avatar: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductListParams = z.infer<typeof productListSchema>
export type CreateNegotiationInput = z.infer<typeof createNegotiationSchema>
export type HandleNegotiationInput = z.infer<typeof handleNegotiationSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type FavoriteInput = z.infer<typeof favoriteSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
