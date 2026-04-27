<template>
  <div class="review-form-page">
    <template v-if="!loading">
      <el-card class="order-info-card">
        <template #header>
          <span>订单信息</span>
        </template>
        <div class="order-content">
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
              <span class="price">成交价: ¥{{ order.price }}</span>
              <span class="time">交易时间: {{ formatDateTime(order.completedAt || order.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="review-form-card">
        <template #header>
          <span>发表评价</span>
        </template>

        <div class="reviewee-section">
          <div class="reviewee-info">
            <el-avatar :size="50">
              {{ reviewee?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="reviewee-details">
              <div class="nickname">{{ reviewee?.nickname }}</div>
              <div class="role-tag">
                <el-tag :type="isBuyer ? 'success' : 'primary'" size="small">
                  {{ isBuyer ? '卖家' : '买家' }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="hint-text">
            请对{{ isBuyer ? '卖家' : '买家' }}进行评价
          </div>
        </div>

        <el-divider />

        <el-form :model="reviewForm" :rules="rules" ref="formRef" label-width="80px">
          <el-form-item label="评分" prop="rating">
            <el-rate
              v-model="reviewForm.rating"
              :max="5"
              show-text
              :texts="ratingTexts"
              :text-color="'#f56c6c'"
            />
          </el-form-item>

          <el-form-item label="评价内容" prop="comment">
            <el-input
              v-model="reviewForm.comment"
              type="textarea"
              :rows="5"
              placeholder="请输入评价内容（最多500字）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-divider />

          <div class="quick-comments">
            <span class="quick-label">快捷评价:</span>
            <div class="quick-tags">
              <el-tag
                v-for="tag in quickComments"
                :key="tag"
                size="small"
                effect="plain"
                class="quick-tag"
                @click="addQuickComment(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <el-form-item class="form-actions">
            <el-button size="large" @click="handleCancel">取消</el-button>
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              提交评价
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="tips-card">
        <template #header>
          <span>温馨提示</span>
        </template>
        <ul class="tips-list">
          <li>评价将影响对方的信用评分，请根据实际交易体验进行评价</li>
          <li>评价提交后无法修改，请谨慎填写</li>
          <li>禁止发布广告、违规内容，否则将被处理</li>
        </ul>
      </el-card>
    </template>

    <div v-else class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { orderApi, reviewApi } from '@/api'
import type { Order, User } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const order = ref<Order | null>(null)
const loading = ref(true)
const submitting = ref(false)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const reviewForm = reactive({
  rating: 5,
  comment: '',
})

const ratingTexts = ['极差', '较差', '一般', '较好', '极好']

const quickComments = [
  '交易顺利',
  '态度很好',
  '商品满意',
  '沟通顺畅',
  '发货及时',
  '值得推荐',
  '非常满意',
  '靠谱的交易',
]

const rules: FormRules = {
  rating: [{ required: true, message: '请选择评分', trigger: 'change' }],
  comment: [{ max: 500, message: '评价内容不能超过500字', trigger: 'blur' }],
}

const isBuyer = computed(() => {
  if (!order.value || !authStore.user) return false
  return (order.value.buyerId as any)?._id === authStore.user._id
})

const reviewee = computed<User | null>(() => {
  if (!order.value) return null
  if (isBuyer.value) {
    return order.value.sellerId as User
  }
  return order.value.buyerId as User
})

function formatDateTime(time: string | Date) {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function addQuickComment(tag: string) {
  if (reviewForm.comment && !reviewForm.comment.endsWith('。')) {
    reviewForm.comment += '，'
  }
  reviewForm.comment += tag
}

async function fetchOrder() {
  loading.value = true
  try {
    const orderId = route.params.orderId as string
    const response = await orderApi.getById(orderId)
    order.value = response.data
    if (order.value.status !== '已完成') {
      ElMessage.warning('该订单尚未完成，无法评价')
      router.back()
    }
  } catch (error) {
    console.error('获取订单失败:', error)
    ElMessage.error('获取订单失败')
    router.back()
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.back()
}

async function handleSubmit() {
  if (!formRef.value || !order.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await reviewApi.create({
          orderId: order.value._id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        })
        ElMessage.success('评价提交成功')
        router.push({ name: 'Profile', query: { tab: isBuyer.value ? 'bought' : 'sold' } })
      } catch (error) {
        console.error('提交评价失败:', error)
        ElMessage.error('提交评价失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.review-form-page {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-info-card {
  background: #fff;
}

.order-content {
  display: flex;
  gap: 20px;
}

.product-image {
  width: 120px;
  height: 120px;
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
  line-height: 1.5;
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
  justify-content: space-between;
  align-items: center;
}

.price-row .price {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.price-row .time {
  font-size: 14px;
  color: #999;
}

.review-form-card {
  background: #fff;
}

.reviewee-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reviewee-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.reviewee-details .nickname {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.hint-text {
  font-size: 14px;
  color: #999;
}

.quick-comments {
  margin-bottom: 20px;
}

.quick-label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.quick-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.quick-tag:hover {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.form-actions {
  margin-bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.tips-card {
  background: #fafafa;
  border: 1px solid #ebeef5;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.loading-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
</style>
