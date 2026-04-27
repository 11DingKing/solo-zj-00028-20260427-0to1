<template>
  <div class="product-detail-page" v-if="product">
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="image-card">
          <el-carousel
            v-if="product.images.length > 0"
            height="400px"
            indicator-position="outside"
          >
            <el-carousel-item v-for="(image, index) in product.images" :key="index">
              <div class="carousel-image">
                <img :src="image" :alt="product.title" />
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-image">
            <el-icon :size="64"><Picture /></el-icon>
            <p>暂无图片</p>
          </div>

          <div class="thumbnails" v-if="product.images.length > 1">
            <div
              v-for="(image, index) in product.images"
              :key="index"
              class="thumbnail"
              :class="{ active: activeIndex === index }"
              @click="activeIndex = index"
            >
              <img :src="image" />
            </div>
          </div>
        </el-card>

        <el-card class="description-card" v-if="product.description">
          <template #header>
            <h3>商品描述</h3>
          </template>
          <div class="description-content">
            {{ product.description }}
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="info-card">
          <h1 class="product-title">{{ product.title }}</h1>

          <div class="price-section">
            <span class="current-price">¥{{ product.price }}</span>
            <span class="original-price" v-if="product.originalPrice > product.price">
              ¥{{ product.originalPrice }}
            </span>
            <el-tag v-if="product.originalPrice > product.price" type="danger" effect="light">
              省 ¥{{ product.originalPrice - product.price }}
            </el-tag>
          </div>

          <el-divider />

          <div class="info-list">
            <div class="info-item">
              <span class="label">分类：</span>
              <el-tag size="small">{{ product.category }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">成色：</span>
              <el-tag size="small">{{ product.condition }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">交易方式：</span>
              <el-tag size="small" type="primary">{{ product.transactionMethod }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">发布时间：</span>
              <span>{{ formatDate(product.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">浏览量：</span>
              <span>{{ product.viewCount }}</span>
            </div>
          </div>

          <el-divider />

          <div class="seller-section" v-if="product.sellerId">
            <div class="seller-info">
              <el-avatar :size="48">
                {{ product.sellerId.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="seller-detail">
                <div class="seller-name">{{ product.sellerId.nickname }}</div>
                <div class="seller-credit">
                  <el-rate v-model="product.sellerId.creditScore" disabled show-score text-color="#ff9900" />
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="action-section">
            <template v-if="authStore.isLoggedIn && isOwner">
              <el-alert type="info" show-icon>
                <template #title>这是您发布的商品</template>
                <template #default>
                  <el-button type="primary" size="small" @click="goToProfile">
                    去个人中心管理
                  </el-button>
                </template>
              </el-alert>
            </template>
            <template v-else-if="product.status === '在售'">
              <template v-if="authStore.isLoggedIn">
                <el-button
                  type="primary"
                  size="large"
                  :loading="actionLoading"
                  @click="handleBuyNow"
                >
                  立即购买
                </el-button>
                <el-button
                  size="large"
                  :loading="actionLoading"
                  @click="showNegotiation = true"
                >
                  我要议价
                </el-button>
                <el-button
                  :type="isFavorite ? 'danger' : 'default'"
                  size="large"
                  :icon="isFavorite ? 'Star' : 'Star'"
                  @click="toggleFavorite"
                >
                  {{ isFavorite ? '已收藏' : '收藏' }}
                </el-button>
              </template>
              <template v-else>
                <el-button type="primary" size="large" @click="goToLogin">
                  登录后购买
                </el-button>
              </template>
            </template>
            <template v-else>
              <el-alert :type="product.status === '已售出' ? 'warning' : 'info'" show-icon>
                <template #title>
                  {{ product.status === '已售出' ? '该商品已售出' : '该商品已下架' }}
                </template>
              </el-alert>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showNegotiation"
      title="发起议价"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="negotiationForm" label-width="80px">
        <el-form-item label="报价">
          <el-input-number
            v-model="negotiationForm.price"
            :min="0"
            :precision="2"
            placeholder="请输入您的报价"
            style="width: 100%"
          />
          <div class="price-hint">
            商品价格：¥{{ product.price }}，建议报价不高于此价格
          </div>
        </el-form-item>
        <el-form-item label="留言">
          <el-input
            v-model="negotiationForm.message"
            type="textarea"
            :rows="3"
            placeholder="可以给卖家留言（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNegotiation = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleNegotiation">
          提交议价
        </el-button>
      </template>
    </el-dialog>
  </div>

  <div class="loading-container" v-else-if="loading">
    <el-skeleton :rows="10" animated />
  </div>

  <div class="error-container" v-else>
    <el-empty description="商品不存在或已删除">
      <el-button type="primary" @click="router.push('/products')">
        返回商品列表
      </el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { productApi, negotiationApi, favoriteApi, orderApi } from '@/api'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const loading = ref(true)
const activeIndex = ref(0)
const actionLoading = ref(false)
const showNegotiation = ref(false)
const isFavorite = ref(false)

const negotiationForm = reactive({
  price: 0,
  message: '',
})

const isOwner = computed(() => {
  if (!product.value || !authStore.user) return false
  return product.value.sellerId?._id === authStore.user._id
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}

async function fetchProduct() {
  const id = route.params.id as string
  if (!id) return

  loading.value = true
  try {
    const response = await productApi.getById(id)
    product.value = response.data
    negotiationForm.price = response.data.price

    if (authStore.isLoggedIn) {
      const favoriteResponse = await favoriteApi.check(id)
      isFavorite.value = favoriteResponse.data.isFavorite
    }
  } catch (error: any) {
    console.error('获取商品详情失败:', error)
    ElMessage.error(error.response?.data?.error || '获取商品详情失败')
  } finally {
    loading.value = false
  }
}

async function toggleFavorite() {
  if (!authStore.isLoggedIn) {
    goToLogin()
    return
  }

  const id = route.params.id as string
  actionLoading.value = true
  try {
    if (isFavorite.value) {
      await favoriteApi.remove(id)
      isFavorite.value = false
      ElMessage.success('已取消收藏')
    } else {
      await favoriteApi.add(id)
      isFavorite.value = true
      ElMessage.success('收藏成功')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleBuyNow() {
  actionLoading.value = true
  try {
    const response = await orderApi.create({ productId: route.params.id as string })
    ElMessage.success('下单成功')
    router.push(`/orders/${response.data._id}`)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '下单失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleNegotiation() {
  if (negotiationForm.price <= 0) {
    ElMessage.warning('请输入有效的报价')
    return
  }

  actionLoading.value = true
  try {
    await negotiationApi.create({
      productId: route.params.id as string,
      price: negotiationForm.price,
      message: negotiationForm.message,
    })
    ElMessage.success('议价已发送，请等待卖家回复')
    showNegotiation.value = false
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '发送失败')
  } finally {
    actionLoading.value = false
  }
}

function goToLogin() {
  router.push({
    name: 'Login',
    query: { redirect: route.fullPath },
  })
}

function goToProfile() {
  router.push('/profile?tab=products')
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.product-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-card {
  margin-bottom: 20px;
}

.carousel-image {
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.carousel-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-image {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  color: #909399;
}

.thumbnails {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.thumbnail.active {
  border-color: #409eff;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 15px 0;
  line-height: 1.4;
  color: #303133;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.current-price {
  font-size: 28px;
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  font-size: 16px;
  color: #909399;
  text-decoration: line-through;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.seller-section {
  padding: 10px 0;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seller-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seller-name {
  font-weight: 600;
  color: #303133;
}

.seller-credit {
  display: flex;
  align-items: center;
}

.action-section {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-section .el-button {
  padding: 12px 24px;
}

.description-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.description-content {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}

.price-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.loading-container,
.error-container {
  padding: 40px;
}
</style>
