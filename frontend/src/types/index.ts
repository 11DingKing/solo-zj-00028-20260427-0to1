export interface User {
  _id: string
  username: string
  email: string
  nickname: string
  avatar: string
  creditScore: number
  createdAt: string
  updatedAt: string
}

export const ProductCategories = [
  '教材',
  '电子产品',
  '生活用品',
  '服饰',
  '运动器材',
  '其他',
] as const

export type ProductCategory = (typeof ProductCategories)[number]

export const ProductConditions = [
  '全新',
  '几乎全新',
  '轻微使用痕迹',
  '明显使用痕迹',
] as const

export type ProductCondition = (typeof ProductConditions)[number]

export const TransactionMethods = ['当面交易', '邮寄', '都可以'] as const

export type TransactionMethod = (typeof TransactionMethods)[number]

export const ProductStatuses = [
  '在售',
  '已预留',
  '已售出',
  '已下架',
] as const

export type ProductStatus = (typeof ProductStatuses)[number]

export interface Product {
  _id: string
  title: string
  description: string
  originalPrice: number
  price: number
  category: ProductCategory
  condition: ProductCondition
  transactionMethod: TransactionMethod
  images: string[]
  status: ProductStatus
  sellerId: User
  viewCount: number
  favorites: number
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
}

export const NegotiationStatuses = [
  '待处理',
  '已接受',
  '已拒绝',
  '已还价',
  '已取消',
] as const

export type NegotiationStatus = (typeof NegotiationStatuses)[number]

export interface Negotiation {
  _id: string
  productId: Product
  buyerId: User
  sellerId: User
  initialPrice: number
  currentPrice: number
  message: string
  status: NegotiationStatus
  counterOfferPrice?: number
  counterOfferMessage?: string
  createdAt: string
  updatedAt: string
}

export const OrderStatuses = [
  '待付款',
  '已付款',
  '交易中',
  '已完成',
  '已取消',
] as const

export type OrderStatus = (typeof OrderStatuses)[number]

export interface Order {
  _id: string
  productId: Product
  negotiationId?: string
  buyerId: User
  sellerId: User
  price: number
  status: OrderStatus
  paidAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
  createdAt: string
  updatedAt: string
}

export interface Review {
  _id: string
  orderId: string
  productId: Product
  reviewerId: User
  revieweeId: User
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  _id: string
  userId: string
  type: string
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  read: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export interface Favorite {
  _id: string
  userId: string
  productId: Product
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductListParams {
  category?: ProductCategory
  minPrice?: number
  maxPrice?: number
  condition?: ProductCondition
  transactionMethod?: TransactionMethod
  keyword?: string
  sortBy?: 'price_asc' | 'price_desc' | 'created_at'
  page?: number
  limit?: number
}

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  nickname: string
}

export interface CreateProductForm {
  title: string
  description: string
  originalPrice: number
  price: number
  category: ProductCategory
  condition: ProductCondition
  transactionMethod: TransactionMethod
  images: string[]
}

export interface CreateNegotiationForm {
  productId: string
  price: number
  message?: string
}

export interface HandleNegotiationForm {
  action: 'accept' | 'reject' | 'counter'
  counterPrice?: number
  counterMessage?: string
}

export interface CreateReviewForm {
  orderId: string
  rating: number
  comment?: string
}
