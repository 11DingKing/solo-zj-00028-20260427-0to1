import axios from 'axios'
import {
  User,
  Product,
  Negotiation,
  Order,
  Review,
  Notification,
  PaginatedResponse,
  ProductListParams,
  LoginForm,
  RegisterForm,
  CreateProductForm,
  CreateNegotiationForm,
  HandleNegotiationForm,
  CreateReviewForm,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: LoginForm) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  register: (data: RegisterForm) =>
    api.post<{ user: User; token: string }>('/auth/register', data),
  getCurrentUser: () => api.get<User>('/users/me'),
}

export const productApi = {
  getHot: () => api.get<Product[]>('/products/hot'),
  getCategories: () =>
    api.get<{ category: string; count: number }[]>('/products/categories'),
  getList: (params: ProductListParams) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<CreateProductForm, 'images'>) =>
    api.post<Product>('/products', data),
  update: (id: string, data: Partial<CreateProductForm>) =>
    api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  uploadImages: (productId: string, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    return api.post<{ images: string[] }>(`/upload/product/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage: (productId: string, index: number) =>
    api.delete<{ images: string[] }>(`/upload/product/${productId}/${index}`),
}

export const negotiationApi = {
  create: (data: CreateNegotiationForm) =>
    api.post<Negotiation>('/negotiations', data),
  getMy: (type?: 'sent' | 'received') =>
    api.get<Negotiation[]>('/negotiations/my', { params: { type } }),
  getById: (id: string) => api.get<Negotiation>(`/negotiations/${id}`),
  handle: (id: string, data: HandleNegotiationForm) =>
    api.post<Negotiation>(`/negotiations/${id}/handle`, data),
  cancel: (id: string) => api.post(`/negotiations/${id}/cancel`),
}

export const orderApi = {
  create: (data: { productId: string; negotiationId?: string }) =>
    api.post<Order>('/orders', data),
  getMy: (type?: 'bought' | 'sold') =>
    api.get<Order[]>('/orders/my', { params: { type } }),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  pay: (id: string) => api.post<Order>(`/orders/${id}/pay`),
  complete: (id: string) => api.post<Order>(`/orders/${id}/complete`),
  cancel: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
}

export const reviewApi = {
  create: (data: CreateReviewForm) => api.post<Review>('/reviews', data),
  getMy: () => api.get<Review[]>('/reviews/my'),
  getByUser: (userId: string) =>
    api.get<{ reviews: Review[]; stats: { averageRating: number; totalReviews: number } }>(
      `/reviews/user/${userId}`
    ),
}

export const notificationApi = {
  getList: (params?: { read?: boolean; limit?: number; offset?: number }) =>
    api.get<{ items: Notification[]; total: number; unreadCount: number }>(
      '/notifications',
      { params }
    ),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: string) => api.put<Notification>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
}

export const favoriteApi = {
  add: (productId: string) =>
    api.post<{ isFavorite: boolean }>('/favorites', { productId }),
  remove: (productId: string) =>
    api.delete<{ isFavorite: boolean }>(`/favorites/${productId}`),
  getMy: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Product>>('/favorites', { params }),
  check: (productId: string) =>
    api.get<{ isFavorite: boolean }>(`/favorites/check/${productId}`),
}

export const userApi = {
  getById: (id: string) => api.get<User>(`/users/${id}`),
  update: (data: { nickname?: string; avatar?: string }) =>
    api.put<User>('/users/me', data),
}

export default api
