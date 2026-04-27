<template>
  <div class="negotiations-page">
    <el-card class="filter-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部议价" name="all" />
        <el-tab-pane label="我发起的" name="sent" />
        <el-tab-pane label="我收到的" name="received" />
      </el-tabs>
    </el-card>

    <div class="negotiation-list">
      <template v-if="!loading">
        <div v-if="negotiations.length > 0">
          <div v-for="item in negotiations" :key="item._id" class="negotiation-item">
            <el-card>
              <div class="negotiation-header">
                <div class="header-left">
                  <span class="status-tag">
                    <el-tag :type="getStatusType(item.status)" size="small">
                      {{ item.status }}
                    </el-tag>
                  </span>
                  <span class="time">{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>

              <router-link :to="`/negotiations/${item._id}`" class="negotiation-content">
                <img
                  :src="(item.productId as any)?.images?.[0] || defaultImage"
                  class="product-image"
                />
                <div class="product-info">
                  <h4 class="product-title">{{ (item.productId as any)?.title }}</h4>
                  <div class="price-info">
                    <div class="price-row">
                      <span class="label">商品原价:</span>
                      <span class="original-price">¥{{ (item.productId as any)?.price }}</span>
                    </div>
                    <div class="price-row">
                      <span class="label">我的报价:</span>
                      <span class="offer-price">¥{{ item.currentPrice }}</span>
                    </div>
                    <div class="price-row" v-if="item.counterOfferPrice">
                      <span class="label">卖家还价:</span>
                      <span class="counter-price">¥{{ item.counterOfferPrice }}</span>
                    </div>
                  </div>
                </div>
                <div class="counterparty-info">
                  <div class="info-label">
                    {{ activeTab === 'sent' ? '卖家' : '买家' }}:
                  </div>
                  <el-avatar :size="40">
                    {{ (activeTab === 'sent' ? (item.sellerId as any)?.nickname : (item.buyerId as any)?.nickname)?.charAt(0) || 'U' }}
                  </el-avatar>
                  <span class="nickname">
                    {{ activeTab === 'sent' ? (item.sellerId as any)?.nickname : (item.buyerId as any)?.nickname }}
                  </span>
                </div>
              </router-link>

              <div class="negotiation-actions">
                <template v-if="activeTab === 'received'">
                  <el-button
                    v-if="item.status === '待处理'"
                    type="success"
                    size="small"
                    @click="handleAccept(item._id)"
                  >
                    接受议价
                  </el-button>
                  <el-button
                    v-if="item.status === '待处理' || item.status === '已还价'"
                    type="warning"
                    size="small"
                    @click="showCounterDialog(item)"
                  >
                    还价
                  </el-button>
                  <el-button
                    v-if="item.status === '待处理'"
                    type="danger"
                    size="small"
                    text
                    @click="handleReject(item._id)"
                  >
                    拒绝
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    v-if="item.status === '已还价'"
                    type="success"
                    size="small"
                    @click="handleAcceptCounter(item._id)"
                  >
                    接受还价
                  </el-button>
                  <el-button
                    v-if="item.status === '待处理' || item.status === '已还价'"
                    type="danger"
                    size="small"
                    text
                    @click="handleCancel(item._id)"
                  >
                    取消议价
                  </el-button>
                </template>
                <el-button type="primary" size="small" text :to="`/negotiations/${item._id}`">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
        <el-empty v-else description="暂无议价记录" />
      </template>
      <div v-else class="skeleton-container">
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <el-dialog v-model="counterDialogVisible" title="发起还价" width="500px">
      <el-form :model="counterForm" label-width="80px">
        <el-form-item label="商品信息">
          <span>{{ currentNegotiation?.productId?.title }}</span>
        </el-form-item>
        <el-form-item label="买家报价">
          <span class="offer-price">¥{{ currentNegotiation?.currentPrice }}</span>
        </el-form-item>
        <el-form-item label="我的还价">
          <el-input-number
            v-model="counterForm.price"
            :min="0"
            :precision="2"
            placeholder="请输入还价金额"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { negotiationApi } from '@/api'
import type { Negotiation } from '@/types'

const router = useRouter()

const activeTab = ref('all')
const negotiations = ref<Negotiation[]>([])
const loading = ref(false)
const counterDialogVisible = ref(false)
const currentNegotiation = ref<Negotiation | null>(null)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const counterForm = reactive({
  price: 0,
  message: '',
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchNegotiations() {
  loading.value = true
  try {
    let type: 'sent' | 'received' | undefined
    if (activeTab.value === 'sent') type = 'sent'
    else if (activeTab.value === 'received') type = 'received'

    const response = await negotiationApi.getMy(type)
    negotiations.value = response.data
  } catch (error) {
    console.error('获取议价列表失败:', error)
    ElMessage.error('获取议价列表失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  fetchNegotiations()
}

async function handleAccept(negotiationId: string) {
  try {
    await ElMessageBox.confirm('确定接受这个议价吗？', '确认接受', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
    await negotiationApi.handle(negotiationId, { action: 'accept' })
    ElMessage.success('已接受议价，订单已创建')
    fetchNegotiations()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleAcceptCounter(negotiationId: string) {
  try {
    await ElMessageBox.confirm('确定接受卖家的还价吗？', '确认接受', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
    await negotiationApi.handle(negotiationId, { action: 'accept' })
    ElMessage.success('已接受还价，订单已创建')
    fetchNegotiations()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleReject(negotiationId: string) {
  try {
    await ElMessageBox.confirm('确定拒绝这个议价吗？', '确认拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await negotiationApi.handle(negotiationId, { action: 'reject' })
    ElMessage.success('已拒绝议价')
    fetchNegotiations()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

function showCounterDialog(item: Negotiation) {
  currentNegotiation.value = item
  counterForm.price = item.currentPrice
  counterForm.message = ''
  counterDialogVisible.value = true
}

async function submitCounter() {
  if (!currentNegotiation.value) return
  try {
    await negotiationApi.handle(currentNegotiation.value._id, {
      action: 'counter',
      counterPrice: counterForm.price,
      counterMessage: counterForm.message,
    })
    ElMessage.success('已发起还价')
    counterDialogVisible.value = false
    fetchNegotiations()
  } catch (error) {
    ElMessage.error('还价失败')
  }
}

async function handleCancel(negotiationId: string) {
  try {
    await ElMessageBox.confirm('确定取消这个议价吗？', '确认取消', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await negotiationApi.cancel(negotiationId)
    ElMessage.success('已取消议价')
    fetchNegotiations()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  fetchNegotiations()
})
</script>

<style scoped>
.negotiations-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.filter-card {
  background: #fff;
}

.negotiation-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.negotiation-item {
  transition: all 0.3s;
}

.negotiation-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.negotiation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time {
  font-size: 13px;
  color: #999;
}

.negotiation-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.product-info {
  flex: 1;
}

.product-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
}

.price-row .label {
  color: #666;
}

.original-price {
  color: #999;
  text-decoration: line-through;
}

.offer-price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 18px;
}

.counter-price {
  color: #e6a23c;
  font-weight: 600;
  font-size: 18px;
}

.counterparty-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.nickname {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.negotiation-actions {
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
