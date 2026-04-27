<template>
  <div class="negotiation-detail-page">
    <template v-if="!loading">
      <el-card class="status-card">
        <div class="status-display">
          <div class="status-icon">
            <el-tag :type="getStatusType(negotiation.status)" size="large">
              {{ negotiation.status }}
            </el-tag>
          </div>
          <div class="status-info">
            <p class="status-desc">{{ getStatusDescription(negotiation.status) }}</p>
          </div>
        </div>
      </el-card>

      <el-card class="product-card">
        <template #header>
          <span>商品信息</span>
        </template>
        <router-link
          :to="`/products/${(negotiation.productId as any)?._id}`"
          class="product-link"
        >
          <img
            :src="(negotiation.productId as any)?.images?.[0] || defaultImage"
            class="product-image"
          />
          <div class="product-info">
            <h3 class="product-title">{{ (negotiation.productId as any)?.title }}</h3>
            <div class="product-meta">
              <span class="category">{{ (negotiation.productId as any)?.category }}</span>
              <span class="condition">{{ (negotiation.productId as any)?.condition }}</span>
            </div>
            <div class="price-row">
              <span class="original-price">
                商品原价: ¥{{ (negotiation.productId as any)?.originalPrice }}
              </span>
              <span class="current-price">
                商品售价: ¥{{ (negotiation.productId as any)?.price }}
              </span>
            </div>
          </div>
        </router-link>
      </el-card>

      <el-card class="timeline-card">
        <template #header>
          <span>议价记录</span>
        </template>
        <el-timeline>
          <el-timeline-item
            :timestamp="formatDateTime(negotiation.createdAt)"
            placement="top"
            type="primary"
          >
            <el-card shadow="never">
              <h4>买家发起议价</h4>
              <div class="timeline-content">
                <div class="price-item">
                  <span class="label">报价金额:</span>
                  <span class="price">¥{{ negotiation.initialPrice }}</span>
                </div>
                <div class="message-item" v-if="negotiation.message">
                  <span class="label">留言:</span>
                  <span class="message">{{ negotiation.message }}</span>
                </div>
              </div>
              <div class="user-info">
                <el-avatar :size="24">
                  {{ (negotiation.buyerId as any)?.nickname?.charAt(0) || 'B' }}
                </el-avatar>
                <span class="nickname">{{ (negotiation.buyerId as any)?.nickname }}</span>
                <el-tag size="small">买家</el-tag>
              </div>
            </el-card>
          </el-timeline-item>

          <el-timeline-item
            v-if="negotiation.counterOfferPrice"
            :timestamp="formatDateTime(negotiation.updatedAt)"
            placement="top"
            type="warning"
          >
            <el-card shadow="never">
              <h4>卖家还价</h4>
              <div class="timeline-content">
                <div class="price-item">
                  <span class="label">还价金额:</span>
                  <span class="price">¥{{ negotiation.counterOfferPrice }}</span>
                </div>
                <div class="message-item" v-if="negotiation.counterOfferMessage">
                  <span class="label">留言:</span>
                  <span class="message">{{ negotiation.counterOfferMessage }}</span>
                </div>
              </div>
              <div class="user-info">
                <el-avatar :size="24">
                  {{ (negotiation.sellerId as any)?.nickname?.charAt(0) || 'S' }}
                </el-avatar>
                <span class="nickname">{{ (negotiation.sellerId as any)?.nickname }}</span>
                <el-tag size="small" type="success">卖家</el-tag>
              </div>
            </el-card>
          </el-timeline-item>

          <el-timeline-item
            v-if="negotiation.status !== '待处理'"
            :timestamp="formatDateTime(negotiation.updatedAt)"
            placement="top"
            :type="getStatusTimelineType(negotiation.status)"
          >
            <el-card shadow="never">
              <h4>{{ negotiation.status }}</h4>
              <div class="timeline-content">
                <p>{{ getStatusFinalMessage(negotiation.status) }}</p>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>买家信息</span>
            </template>
            <div class="user-info-card">
              <el-avatar :size="50">
                {{ (negotiation.buyerId as any)?.nickname?.charAt(0) || 'B' }}
              </el-avatar>
              <div class="user-details">
                <div class="nickname">{{ (negotiation.buyerId as any)?.nickname }}</div>
                <div class="credit">
                  <el-rate
                    :model-value="Math.round(((negotiation.buyerId as any)?.creditScore || 0) / 20)"
                    disabled
                    :max="5"
                    :text-color="'#f56c6c'"
                  />
                  <span>信用评分: {{ (negotiation.buyerId as any)?.creditScore || 0 }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>卖家信息</span>
            </template>
            <div class="user-info-card">
              <el-avatar :size="50">
                {{ (negotiation.sellerId as any)?.nickname?.charAt(0) || 'S' }}
              </el-avatar>
              <div class="user-details">
                <div class="nickname">{{ (negotiation.sellerId as any)?.nickname }}</div>
                <div class="credit">
                  <el-rate
                    :model-value="Math.round(((negotiation.sellerId as any)?.creditScore || 0) / 20)"
                    disabled
                    :max="5"
                    :text-color="'#f56c6c'"
                  />
                  <span>信用评分: {{ (negotiation.sellerId as any)?.creditScore || 0 }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="action-bar" v-if="negotiation.status === '待处理' || negotiation.status === '已还价'">
        <template v-if="isSeller">
          <el-button type="success" size="large" @click="handleAccept">
            接受议价
          </el-button>
          <el-button type="warning" size="large" @click="showCounterDialog">
            还价
          </el-button>
          <el-button type="danger" size="large" @click="handleReject" v-if="negotiation.status === '待处理'">
            拒绝
          </el-button>
        </template>
        <template v-else>
          <el-button type="success" size="large" @click="handleAccept" v-if="negotiation.status === '已还价'">
            接受还价
          </el-button>
          <el-button type="danger" size="large" @click="handleCancel">
            取消议价
          </el-button>
        </template>
      </div>

      <el-dialog v-model="counterDialogVisible" title="发起还价" width="500px">
        <el-form :model="counterForm" label-width="100px">
          <el-form-item label="买家当前报价">
            <span class="current-offer">¥{{ negotiation.currentPrice }}</span>
          </el-form-item>
          <el-form-item label="我的还价">
            <el-input-number
              v-model="counterForm.price"
              :min="0"
              :precision="2"
              placeholder="请输入还价金额"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="留言">
            <el-input
              v-model="counterForm.message"
              type="textarea"
              :rows="3"
              placeholder="请输入留言（可选）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="counterDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCounter">确认还价</el-button>
        </template>
      </el-dialog>
    </template>

    <div v-else class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { negotiationApi } from '@/api'
import type { Negotiation } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const negotiation = ref<Negotiation | null>(null)
const loading = ref(true)
const counterDialogVisible = ref(false)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const counterForm = reactive({
  price: 0,
  message: '',
})

const isSeller = computed(() => {
  if (!negotiation.value) return false
  return (negotiation.value.sellerId as any)?._id === authStore.user?._id
})

function getStatusType(status: string) {
  const types: Record<string, string> = {
    '待处理': 'warning',
    '已接受': 'success',
    '已拒绝': 'danger',
    '已还价': 'primary',
    '已取消': 'info',
  }
  return types[status] || 'info'
}

function getStatusTimelineType(status: string) {
  const types: Record<string, string> = {
    '已接受': 'success',
    '已拒绝': 'danger',
    '已取消': 'info',
  }
  return types[status] || 'primary'
}

function getStatusDescription(status: string) {
  const descriptions: Record<string, string> = {
    '待处理': '等待卖家处理议价请求',
    '已接受': '议价已接受，订单已创建',
    '已拒绝': '议价已被拒绝',
    '已还价': '卖家已还价，等待买家回应',
    '已取消': '议价已取消',
  }
  return descriptions[status] || ''
}

function getStatusFinalMessage(status: string) {
  const messages: Record<string, string> = {
    '已接受': '双方达成一致，订单已创建，可以前往订单页面查看',
    '已拒绝': '卖家拒绝了议价请求',
    '已取消': '议价已被取消',
  }
  return messages[status] || ''
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

async function fetchNegotiation() {
  loading.value = true
  try {
    const negotiationId = route.params.id as string
    const response = await negotiationApi.getById(negotiationId)
    negotiation.value = response.data
    counterForm.price = response.data.currentPrice
  } catch (error) {
    console.error('获取议价详情失败:', error)
    ElMessage.error('获取议价详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

async function handleAccept() {
  try {
    const message = isSeller.value ? '确定接受买家的议价吗？' : '确定接受卖家的还价吗？'
    await ElMessageBox.confirm(message, '确认接受', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
    await negotiationApi.handle(negotiation.value!._id, { action: 'accept' })
    ElMessage.success('已接受，订单已创建')
    fetchNegotiation()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleReject() {
  try {
    await ElMessageBox.confirm('确定拒绝这个议价吗？', '确认拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await negotiationApi.handle(negotiation.value!._id, { action: 'reject' })
    ElMessage.success('已拒绝议价')
    fetchNegotiation()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

function showCounterDialog() {
  counterForm.message = ''
  counterDialogVisible.value = true
}

async function submitCounter() {
  if (!negotiation.value) return
  try {
    await negotiationApi.handle(negotiation.value._id, {
      action: 'counter',
      counterPrice: counterForm.price,
      counterMessage: counterForm.message,
    })
    ElMessage.success('已发起还价')
    counterDialogVisible.value = false
    fetchNegotiation()
  } catch (error) {
    ElMessage.error('还价失败')
  }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定取消这个议价吗？', '确认取消', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await negotiationApi.cancel(negotiation.value!._id)
    ElMessage.success('已取消议价')
    fetchNegotiation()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  fetchNegotiation()
})
</script>

<style scoped>
.negotiation-detail-page {
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
}

.status-info .status-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 10px 0 0 0;
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
  gap: 20px;
  align-items: baseline;
}

.original-price {
  font-size: 14px;
  color: #999;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.timeline-card {
  background: #fff;
}

.timeline-content {
  margin-bottom: 10px;
}

.price-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.price-item .label {
  font-size: 14px;
  color: #666;
}

.price-item .price {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.message-item {
  margin-top: 8px;
}

.message-item .label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.message-item .message {
  font-size: 14px;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.user-info .nickname {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.user-info-card {
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

.action-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
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

.current-offer {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}
</style>
