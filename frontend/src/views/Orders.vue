<template>
  <div class="orders-page">
    <el-card class="filter-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部订单" name="all" />
        <el-tab-pane label="我买到的" name="bought" />
        <el-tab-pane label="我卖出的" name="sold" />
      </el-tabs>
    </el-card>

    <div class="order-list">
      <template v-if="!loading">
        <div v-if="orders.length > 0">
          <div v-for="order in orders" :key="order._id" class="order-item">
            <el-card>
              <div class="order-header">
                <div class="order-header-left">
                  <span class="order-time">
                    {{ formatDate(order.createdAt) }}
                  </span>
                  <span class="order-id">订单号: {{ order._id }}</span>
                </div>
                <el-tag :type="getOrderStatusType(order.status)" size="small">
                  {{ order.status }}
                </el-tag>
              </div>

              <router-link :to="`/orders/${order._id}`" class="order-content">
                <img
                  :src="(order.productId as any)?.images?.[0] || defaultImage"
                  class="order-image"
                />
                <div class="order-info">
                  <h4 class="product-title">{{ (order.productId as any)?.title }}</h4>
                  <div class="order-meta">
                    <span>
                      {{ activeTab === 'sold' ? '买家' : '卖家' }}:
                      {{ activeTab === 'sold' ? (order.buyerId as any)?.nickname : (order.sellerId as any)?.nickname }}
                    </span>
                    <span class="price">¥{{ order.price }}</span>
                  </div>
                </div>
              </router-link>

              <div class="order-actions">
                <template v-if="activeTab !== 'sold'">
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
                    @click="handleCancel(order._id)"
                  >
                    取消订单
                  </el-button>
                  <el-button
                    v-if="order.status === '交易中'"
                    type="success"
                    size="small"
                    @click="handleComplete(order._id)"
                  >
                    确认收货
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    v-if="order.status === '已付款'"
                    type="primary"
                    size="small"
                    @click="handleStartTrade(order._id)"
                  >
                    开始交易
                  </el-button>
                </template>
                <el-button
                  v-if="order.status === '已完成'"
                  type="primary"
                  size="small"
                  text
                  :to="`/reviews/${order._id}`"
                >
                  评价
                </el-button>
                <el-button type="primary" size="small" text :to="`/orders/${order._id}`">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
        <el-empty v-else description="暂无订单" />
      </template>
      <div v-else class="skeleton-container">
        <el-skeleton :rows="3" animated />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api'
import type { Order } from '@/types'

const router = useRouter()

const activeTab = ref('all')
const orders = ref<Order[]>([])
const loading = ref(false)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const allOrders = computed(() => {
  return orders.value
})

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

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchOrders() {
  loading.value = true
  try {
    let type: 'bought' | 'sold' | undefined
    if (activeTab.value === 'bought') type = 'bought'
    else if (activeTab.value === 'sold') type = 'sold'

    const response = await orderApi.getMy(type)
    orders.value = response.data
  } catch (error) {
    console.error('获取订单失败:', error)
    ElMessage.error('获取订单失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  fetchOrders()
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

async function handleCancel(orderId: string) {
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

async function handleComplete(orderId: string) {
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

async function handleStartTrade(orderId: string) {
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

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.filter-card {
  background: #fff;
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

.order-header-left {
  display: flex;
  gap: 20px;
}

.order-time {
  font-size: 13px;
  color: #999;
}

.order-id {
  font-size: 13px;
  color: #666;
}

.order-content {
  display: flex;
  gap: 15px;
}

.order-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 16px;
  color: #333;
  margin: 0;
  line-height: 1.5;
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

.order-meta .price {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.order-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.skeleton-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
