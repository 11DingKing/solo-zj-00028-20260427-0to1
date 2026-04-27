<template>
  <div class="order-detail-page">
    <template v-if="!loading">
      <el-card class="status-card">
        <div class="status-display">
          <div class="status-icon">
            <el-icon :size="48">
              <component :is="getStatusIcon(order.status)" />
            </el-icon>
          </div>
          <div class="status-info">
            <h2 class="status-title">{{ order.status }}</h2>
            <p class="status-desc">{{ getStatusDescription(order.status) }}</p>
          </div>
        </div>

        <el-steps
          :active="getStepIndex(order.status)"
          finish-status="success"
          align-center
          class="order-steps"
        >
          <el-step title="创建订单" :description="formatTime(order.createdAt)" />
          <el-step title="已付款" :description="order.paidAt ? formatTime(order.paidAt) : ''" />
          <el-step title="交易中" />
          <el-step title="已完成" :description="order.completedAt ? formatTime(order.completedAt) : ''" />
        </el-steps>
      </el-card>

      <el-card class="product-card">
        <template #header>
          <span>商品信息</span>
        </template>
        <router-link
          :to="`/products/${(order.productId as any)?._id}`"
          class="product-link"
        >
          <img
            :src="(order.productId as any)?.images?.[0] || defaultImage"
            class="product-image"
          />
          <div class="product-info">
            <h3 class="product-title">{{ (order.productId as any)?.title }}</h3>
            <div class="product-meta">
              <span class="category">{{ (order.productId as any)?.category }}</span>
              <span class="condition">{{ (order.productId as any)?.condition }}</span>
            </div>
            <div class="price-row">
              <span class="original-price" v-if="(order.productId as any)?.originalPrice > order.price">
                原价: ¥{{ (order.productId as any)?.originalPrice }}
              </span>
              <span class="current-price">成交价: ¥{{ order.price }}</span>
            </div>
          </div>
        </router-link>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>卖家信息</span>
            </template>
            <div class="user-info">
              <el-avatar :size="50">
                {{ (order.sellerId as any)?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="user-details">
                <div class="nickname">{{ (order.sellerId as any)?.nickname }}</div>
                <div class="credit">
                  <el-rate
                    :model-value="Math.round(((order.sellerId as any)?.creditScore || 0) / 20)"
                    disabled
                    :max="5"
                    :text-color="'#f56c6c'"
                  />
                  <span>信用评分: {{ (order.sellerId as any)?.creditScore || 0 }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>买家信息</span>
            </template>
            <div class="user-info">
              <el-avatar :size="50">
                {{ (order.buyerId as any)?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="user-details">
                <div class="nickname">{{ (order.buyerId as any)?.nickname }}</div>
                <div class="credit">
                  <el-rate
                    :model-value="Math.round(((order.buyerId as any)?.creditScore || 0) / 20)"
                    disabled
                    :max="5"
                    :text-color="'#f56c6c'"
                  />
                  <span>信用评分: {{ (order.buyerId as any)?.creditScore || 0 }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="info-card">
        <template #header>
          <span>订单详情</span>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ order._id }}</el-descriptions-item>
          <el-descriptions-item label="交易方式">
            {{ (order.productId as any)?.transactionMethod }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(order.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="支付时间" v-if="order.paidAt">
            {{ formatDateTime(order.paidAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间" v-if="order.completedAt">
            {{ formatDateTime(order.completedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="取消时间" v-if="order.cancelledAt">
            {{ formatDateTime(order.cancelledAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="取消原因" v-if="order.cancelReason">
            {{ order.cancelReason }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <div class="action-bar">
        <template v-if="isBuyer">
          <el-button
            v-if="order.status === '待付款'"
            type="primary"
            size="large"
            @click="handlePay"
          >
            立即支付
          </el-button>
          <el-button
            v-if="order.status === '待付款'"
            size="large"
            @click="handleCancel"
          >
            取消订单
          </el-button>
          <el-button
            v-if="order.status === '交易中'"
            type="success"
            size="large"
            @click="handleComplete"
          >
            确认收货
          </el-button>
        </template>
        <template v-else>
          <el-button
            v-if="order.status === '已付款'"
            type="primary"
            size="large"
            @click="handleStartTrade"
          >
            开始交易
          </el-button>
        </template>
        <el-button
          v-if="order.status === '已完成'"
          type="primary"
          size="large"
          :to="`/reviews/${order._id}`"
        >
          发表评价
        </el-button>
      </div>
    </template>

    <div v-else class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { orderApi } from '@/api'
import type { Order } from '@/types'
import {
  Clock,
  Money,
  Box,
  CircleCheck,
  CircleClose,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const order = ref<Order | null>(null)
const loading = ref(true)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const isBuyer = computed(() => {
  if (!order.value) return false
  return (order.value.buyerId as any)?._id === authStore.user?._id
})

function getStatusIcon(status: string) {
  const icons: Record<string, any> = {
    '待付款': Clock,
    '已付款': Money,
    '交易中': Box,
    '已完成': CircleCheck,
    '已取消': CircleClose,
  }
  return icons[status] || Clock
}

function getStatusDescription(status: string) {
  const descriptions: Record<string, string> = {
    '待付款': '请尽快完成支付，订单将在一段时间后自动取消',
    '已付款': '付款成功，等待卖家确认发货',
    '交易中': '卖家已发货，请确认收货',
    '已完成': '交易已完成，欢迎再次光顾',
    '已取消': '订单已取消',
  }
  return descriptions[status] || ''
}

function getStepIndex(status: string) {
  const steps: Record<string, number> = {
    '待付款': 0,
    '已付款': 1,
    '交易中': 2,
    '已完成': 3,
    '已取消': -1,
  }
  return steps[status] ?? 0
}

function formatTime(time: string | Date) {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatDateTime(time: string | Date) {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function fetchOrder() {
  loading.value = true
  try {
    const orderId = route.params.id as string
    const response = await orderApi.getById(orderId)
    order.value = response.data
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  try {
    await ElMessageBox.confirm('确定要模拟付款吗？', '模拟支付', {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderApi.pay(order.value!._id)
    ElMessage.success('支付成功')
    fetchOrder()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('支付失败')
    }
  }
}

async function handleCancel() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入取消原因（可选）',
    })
    await orderApi.cancel(order.value!._id, reason)
    ElMessage.success('订单已取消')
    fetchOrder()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

async function handleComplete() {
  try {
    await ElMessageBox.confirm('确定已收到货物吗？', '确认收货', {
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderApi.complete(order.value!._id)
    ElMessage.success('交易完成')
    fetchOrder()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('确认失败')
    }
  }
}

async function handleStartTrade() {
  try {
    await ElMessageBox.confirm('确定要开始交易吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    ElMessage.success('已开始交易，等待买家确认收货')
    fetchOrder()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.order-detail-page {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.status-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 15px;
}

.status-info .status-title {
  font-size: 24px;
  margin: 0 0 5px 0;
}

.status-info .status-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.order-steps {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
}

:deep(.order-steps .el-step__title) {
  color: #fff;
}

:deep(.order-steps .el-step__description) {
  color: rgba(255, 255, 255, 0.7);
}

.product-card .product-link {
  display: flex;
  gap: 20px;
}

.product-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.product-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 10px 0;
}

.product-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.product-meta span {
  font-size: 12px;
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  color: #666;
}

.price-row {
  display: flex;
  gap: 15px;
  align-items: baseline;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.current-price {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-details .nickname {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.user-details .credit {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.info-card {
  background: #fff;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.loading-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
</style>
