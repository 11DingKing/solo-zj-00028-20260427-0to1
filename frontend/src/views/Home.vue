<template>
  <div class="home">
    <el-carousel :interval="4000" height="200px" class="banner">
      <el-carousel-item v-for="item in banners" :key="item.id">
        <div class="banner-item" :style="{ background: item.color }">
          <h2>{{ item.title }}</h2>
          <p>{{ item.desc }}</p>
        </div>
      </el-carousel-item>
    </el-carousel>

    <div class="section">
      <div class="section-header">
        <h3><el-icon><Fire /></el-icon> 热门商品</h3>
        <router-link to="/products" class="view-more">查看更多 ></router-link>
      </div>
      <div class="product-grid">
        <router-link
          v-for="product in hotProducts"
          :key="product._id"
          :to="`/products/${product._id}`"
        >
          <el-card class="product-card">
            <div class="product-image">
              <img
                :src="product.images[0] || defaultImage"
                :alt="product.title"
              />
              <div class="product-badge" v-if="product.status !== '在售'">
                {{ product.status }}
              </div>
            </div>
            <div class="product-info">
              <h4 class="product-title">{{ product.title }}</h4>
              <div class="product-price">
                <span class="current-price">¥{{ product.price }}</span>
                <span class="original-price" v-if="product.originalPrice > product.price">
                  ¥{{ product.originalPrice }}
                </span>
              </div>
              <div class="product-meta">
                <span class="category">{{ product.category }}</span>
                <span class="condition">{{ product.condition }}</span>
              </div>
            </div>
          </el-card>
        </router-link>
        <el-card v-if="hotProducts.length === 0 && loading" class="loading-card">
          <el-skeleton :rows="4" animated />
        </el-card>
        <div v-if="hotProducts.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无热门商品" />
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3><el-icon><Collection /></el-icon> 商品分类</h3>
      </div>
      <div class="category-grid">
        <router-link
          v-for="category in categories"
          :key="category.category"
          :to="`/products?category=${category.category}`"
        >
          <el-card class="category-card" :body-style="{ padding: '20px' }">
            <div class="category-icon">
              <el-icon :size="32">{{ getCategoryIcon(category.category) }}</el-icon>
            </div>
            <div class="category-name">{{ category.category }}</div>
            <div class="category-count">{{ category.count }} 件商品</div>
          </el-card>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productApi } from '@/api'
import type { Product } from '@/types'
import {
  ShoppingCart,
  Collection,
  Notebook,
  Monitor,
  HomeFilled,
  TShirt,
  Basketball,
  More,
  Fire,
} from '@element-plus/icons-vue'

const hotProducts = ref<Product[]>([])
const categories = ref<{ category: string; count: number }[]>([])
const loading = ref(true)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const banners = [
  { id: 1, title: '校园二手交易平台', desc: '闲置物品，变废为宝', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, title: '安全交易，放心买卖', desc: '实名认证，信用担保', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 3, title: '快速发布，轻松出手', desc: '简单几步，发布商品', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
]

function getCategoryIcon(category: string) {
  const iconMap: Record<string, any> = {
    '教材': Notebook,
    '电子产品': Monitor,
    '生活用品': HomeFilled,
    '服饰': TShirt,
    '运动器材': Basketball,
    '其他': More,
  }
  return iconMap[category] || More
}

async function fetchHotProducts() {
  try {
    const response = await productApi.getHot()
    hotProducts.value = response.data.slice(0, 8)
  } catch (error) {
    console.error('获取热门商品失败:', error)
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const response = await productApi.getCategories()
    categories.value = response.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

onMounted(() => {
  fetchHotProducts()
  fetchCategories()
})
</script>

<style scoped>
.banner {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
}

.banner-item {
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}

.banner-item h2 {
  font-size: 28px;
  margin-bottom: 10px;
}

.banner-item p {
  font-size: 16px;
  opacity: 0.9;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  color: #333;
}

.view-more {
  color: #409eff;
  font-size: 14px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.product-card {
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.product-image {
  position: relative;
  height: 180px;
  margin: -20px -20px 15px -20px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.product-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  height: 40px;
  line-height: 20px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.product-meta span {
  font-size: 12px;
  color: #666;
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 4px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.category-card {
  text-align: center;
  cursor: pointer;
}

.category-card:hover {
  border-color: #409eff;
}

.category-icon {
  margin-bottom: 12px;
  color: #409eff;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.category-count {
  font-size: 13px;
  color: #999;
}

.loading-card {
  height: 300px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
}
</style>
