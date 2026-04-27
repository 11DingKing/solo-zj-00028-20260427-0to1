import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '校园二手交易平台' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guest: true },
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/Products.vue'),
    meta: { title: '商品列表' },
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    meta: { title: '商品详情' },
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('@/views/Publish.vue'),
    meta: { title: '发布商品', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true },
  },
  {
    path: '/negotiations',
    name: 'Negotiations',
    component: () => import('@/views/Negotiations.vue'),
    meta: { title: '议价管理', requiresAuth: true },
  },
  {
    path: '/negotiations/:id',
    name: 'NegotiationDetail',
    component: () => import('@/views/NegotiationDetail.vue'),
    meta: { title: '议价详情', requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { title: '订单管理', requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true },
  },
  {
    path: '/reviews/:orderId',
    name: 'ReviewForm',
    component: () => import('@/views/ReviewForm.vue'),
    meta: { title: '发表评价', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  document.title = to.meta.title as string || '校园二手交易平台'

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
