<template>
  <div class="profile-page">
    <el-card class="profile-header">
      <div class="profile-info">
        <el-avatar :size="80">
          {{ authStore.user?.nickname?.charAt(0) || 'U' }}
        </el-avatar>
        <div class="user-details">
          <h2>{{ authStore.user?.nickname }}</h2>
          <div class="user-meta">
            <span class="username">@{{ authStore.user?.username }}</span>
            <el-rate
              v-model="creditRating"
              disabled
              :max="5"
              :text-color="'#f56c6c'"
              :show-text="true"
            />
          </div>
        </div>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" type="border-card" class="profile-tabs">
      <el-tab-pane label="我发布的" name="published">
        <template v-if="!publishedLoading">
          <div v-if="publishedProducts.length > 0" class="product-grid">
            <div v-for="product in publishedProducts" :key="product._id" class="product-item">
              <router-link :to="`/products/${product._id}`">
                <el-card>
                  <img
                    :src="product.images[0] || defaultImage"
                    :alt="product.title"
                    class="product-img"
                  />
                  <div class="product-info">
                    <h4 class="title">{{ product.title }}</h4>
                    <div class="price-row">
                      <span class="price">¥{{ product.price }}</span>
                      <el-tag :type="getStatusType(product.status)" size="small">
                        {{ product.status }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </router-link>
              <div class="product-actions">
                <el-button
                  v-if="product.status === '在售'"
                  type="danger"
                  size="small"
                  @click="handleOffline(product._id)"
                >
                  下架
                </el-button>
                <el-button
                  v-else-if="product.status === '已下架'"
                  type="primary"
                  size="small"
                  @click="handleOnline(product._id)"
                >
                  上架
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无发布的商品" />
        </template>
        <el-skeleton v-else :rows="3" animated />
      </el-tab-pane>

      <el-tab-pane label="我买到的" name="bought">
        <template v-if="!ordersLoading">
          <div v-if="boughtOrders.length > 0" class="order-list">
            <div v-for="order in boughtOrders" :key="order._id" class="order-item">
              <el-card>
                <div class="order-header">
                  <span class="order-id">订单号: {{ order._id }}</span>
                  <el-tag :type="getOrderStatusType(order.status)" size="small">
                    {{ order.status }}
                  </el-tag>
                </div>
                <router-link :to="`/orders/${order._id}`" class="order-content">
                  <img
                    :src="(order.productId as any)?.images?.[0] || defaultImage"
                    class="order-img"
                  />
                  <div class="order-info">
                    <h4>{{ (order.productId as any)?.title }}</h4>
                    <div class="order-meta">
                      <span>卖家: {{ (order.sellerId as any)?.nickname }}</span>
                      <span class="price">¥{{ order.price }}</span>
                    </div>
                  </div>
                </router-link>
                <div class="order-actions">
                  <el-button
                    v-if="order.status === '待付款'"
                    type="primary"
                    size="small"
                    @click="handlePay(order._id)"
                  >
                    去付款
                  </el-button>
                  <el-button
                    v-if="order.status === '待付款'"
                    type="danger"
                    size="small"
                    text
                    @click="handleCancelOrder(order._id)"
                  >
                    取消订单
                  </el-button>
                  <el-button
                    v-if="order.status === '交易中'"
                    type="success"
                    size="small"
                    @click="handleCompleteOrder(order._id)"
                  >
                    确认收货
                  </el-button>
                  <el-button
                    v-if="order.status === '已完成'"
                    type="primary"
                    size="small"
                    text
                    :to="`/reviews/${order._id}`"
                  >
                    评价
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
          <el-empty v-else description="暂无购买的商品" />
        </template>
        <el-skeleton v-else :rows="3" animated />
      </el-tab-pane>

      <el-tab-pane label="我卖出的" name="sold">
        <template v-if="!ordersLoading">
          <div v-if="soldOrders.length > 0" class="order-list">
            <div v-for="order in soldOrders" :key="order._id" class="order-item">
              <el-card>
                <div class="order-header">
                  <span class="order-id">订单号: {{ order._id }}</span>
                  <el-tag :type="getOrderStatusType(order.status)" size="small">
                    {{ order.status }}
                  </el-tag>
                </div>
                <router-link :to="`/orders/${order._id}`" class="order-content">
                  <img
                    :src="(order.productId as any)?.images?.[0] || defaultImage"
                    class="order-img"
                  />
                  <div class="order-info">
                    <h4>{{ (order.productId as any)?.title }}</h4>
                    <div class="order-meta">
                      <span>买家: {{ (order.buyerId as any)?.nickname }}</span>
                      <span class="price">¥{{ order.price }}</span>
                    </div>
                  </div>
                </router-link>
                <div class="order-actions">
                  <el-button
                    v-if="order.status === '已付款'"
                    type="primary"
                    size="small"
                    @click="handleStartTransaction(order._id)"
                  >
                    开始交易
                  </el-button>
                  <el-button
                    v-if="order.status === '已完成'"
                    type="primary"
                    size="small"
                    text
                    :to="`/reviews/${order._id}`"
                  >
                    评价
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
          <el-empty v-else description="暂无卖出的商品" />
        </template>
        <el-skeleton v-else :rows="3" animated />
      </el-tab-pane>

      <el-tab-pane label="我的收藏" name="favorites">
        <template v-if="!favoritesLoading">
          <div v-if="favoriteProducts.length > 0" class="product-grid">
            <router-link
              v-for="product in favoriteProducts"
              :key="product._id"
              :to="`/products/${product._id}`"
            >
              <el-card class="product-card">
                <img
                  :src="product.images[0] || defaultImage"
                  :alt="product.title"
                  class="product-img"
                />
                <div class="product-info">
                  <h4 class="title">{{ product.title }}</h4>
                  <div class="price-row">
                    <span class="price">¥{{ product.price }}</span>
                    <span class="seller">{{ (product.sellerId as any)?.nickname }}</span>
                  </div>
                </div>
              </el-card>
            </router-link>
          </div>
          <el-empty v-else description="暂无收藏的商品" />
        </template>
        <el-skeleton v-else :rows="3" animated />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { productApi, orderApi, favoriteApi } from '@/api'
import type { Product, Order } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('published')
const publishedProducts = ref<Product[]>([])
const boughtOrders = ref<Order[]>([])
const soldOrders = ref<Order[]>([])
const favoriteProducts = ref<Product[]>([])
const publishedLoading = ref(false)
const ordersLoading = ref(false)
const favoritesLoading = ref(false)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const creditRating = computed(() => {
  const score = authStore.user?.creditScore || 5
  return Math.round(score)
})

watch(
  () => route.query.tab,
  (tab) => {
    if (tab) {
      activeTab.value = tab as string
    }
  },
  { immediate: true }
)

function getStatusType(status: string) {
  const types: Record<string, string> = {
    '在售': 'success',
    '已预留': 'warning',
    '已售出': 'info',
    '已下架': 'danger',
  }
  return types[status] || 'info'
}

function getOrderStatusType(status: string) {
  const types: Record<string, string> = {
    '待付款': 'warning',
    '已付款': 'primary',
    '交易中': 'info',
    '已完成': 'success',
    '已取消': 'danger',
  }
  return types[status] || 'info'
}

async function fetchPublishedProducts() {
  publishedLoading.value = true
  try {
    const response = await productApi.getMy()
    publishedProducts.value = response.data.items
  } catch (error) {
    console.error('获取发布商品失败:', error)
  } finally {
    publishedLoading.value = false
  }
}

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const boughtResponse = await orderApi.getMy('bought')
    const soldResponse = await orderApi.getMy('sold')
    boughtOrders.value = boughtResponse.data
    soldOrders.value = soldResponse.data
  } catch (error) {
    console.error('获取订单失败:', error)
  } finally {
    ordersLoading.value = false
  }
}

async function fetchFavorites() {
  favoritesLoading.value = true
  try {
    const response = await favoriteApi.getMy({ page: 1, limit: 100 })
    favoriteProducts.value = response.data.items
  } catch (error) {
    console.error('获取收藏失败:', error)
  } finally {
    favoritesLoading.value = false
  }
}

async function handleOnline(productId: string) {
  try {
    await productApi.update(productId, { status: '在售' as any })
    ElMessage.success('上架成功')
    fetchPublishedProducts()
  } catch (error) {
    ElMessage.error('上架失败')
  }
}

async function handleOffline(productId: string) {
  try {
    await ElMessageBox.confirm('确定要下架该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await productApi.update(productId, { status: '已下架' as any })
    ElMessage.success('下架成功')
    fetchPublishedProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('下架失败')
    }
  }
}

async function handlePay(orderId: string) {
  try {
    await ElMessageBox.confirm('确定要模拟付款吗？', '模拟支付', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderApi.pay(orderId)
    ElMessage.success('支付成功')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('支付失败')
    }
  }
}

async function handleCancelOrder(orderId: string) {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await orderApi.cancel(orderId)
    ElMessage.success('订单已取消')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

async function handleStartTransaction(orderId: string) {
  try {
    await ElMessageBox.confirm('确定要开始交易吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    ElMessage.success('已开始交易，等待买家确认收货')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleCompleteOrder(orderId: string) {
  try {
    await ElMessageBox.confirm('确定已收到货物吗？', '确认收货', {
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderApi.complete(orderId)
    ElMessage.success('交易完成')
    fetchOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('确认失败')
    }
  }
}

onMounted(() => {
  fetchPublishedProducts()
  fetchOrders()
  fetchFavorites()
})
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-details h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.profile-tabs {
  background: #fff;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.product-item {
  display: flex;
  flex-direction: column;
}

.product-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  margin: -20px -20px 15px -20px;
  border-radius: 4px 4px 0 0;
}

.product-info .title {
  font-size: 14px;
  color: #333;
  margin: 0 0 10px 0;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.seller {
  font-size: 12px;
  color: #999;
}

.product-actions {
  padding: 10px 0;
  text-align: center;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-item {
  transition: all 0.3s;
}

.order-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
}

.order-id {
  font-size: 13px;
  color: #999;
}

.order-content {
  display: flex;
  gap: 15px;
}

.order-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.order-info {
  flex: 1;
}

.order-info h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-meta span {
  font-size: 14px;
  color: #666;
}

.order-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}
</style>
