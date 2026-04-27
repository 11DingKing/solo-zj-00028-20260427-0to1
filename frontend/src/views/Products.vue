<template>
  <div class="products-page">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="分类">
          <el-select
            v-model="filterForm.category"
            placeholder="全部分类"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="cat in ProductCategories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input
            v-model="filterForm.minPrice"
            type="number"
            placeholder="最低价"
            style="width: 100px"
            @change="handleFilter"
          />
          <span style="margin: 0 8px">-</span>
          <el-input
            v-model="filterForm.maxPrice"
            type="number"
            placeholder="最高价"
            style="width: 100px"
            @change="handleFilter"
          />
        </el-form-item>
        <el-form-item label="成色">
          <el-select
            v-model="filterForm.condition"
            placeholder="全部成色"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="cond in ProductConditions"
              :key="cond"
              :label="cond"
              :value="cond"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="交易方式">
          <el-select
            v-model="filterForm.transactionMethod"
            placeholder="全部方式"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="method in TransactionMethods"
              :key="method"
              :label="method"
              :value="method"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="filterForm.sortBy" @change="handleFilter">
            <el-option label="最新发布" value="created_at" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="product-grid">
      <template v-if="!loading">
        <router-link
          v-for="product in products"
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
                <span
                  class="original-price"
                  v-if="product.originalPrice > product.price"
                >
                  ¥{{ product.originalPrice }}
                </span>
              </div>
              <div class="product-meta">
                <span class="category">{{ product.category }}</span>
                <span class="condition">{{ product.condition }}</span>
              </div>
              <div class="product-seller">
                <el-avatar :size="24">
                  {{ product.sellerId?.nickname?.charAt(0) || 'U' }}
                </el-avatar>
                <span>{{ product.sellerId?.nickname }}</span>
              </div>
            </div>
          </el-card>
        </router-link>
        <div v-if="products.length === 0" class="empty-state">
          <el-empty description="暂无商品" />
        </div>
      </template>
      <template v-else>
        <div v-for="i in 8" :key="i">
          <el-card class="product-card">
            <el-skeleton :rows="4" animated />
          </el-card>
        </div>
      </template>
    </div>

    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 40, 60, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '@/api'
import type { Product, ProductCategory, ProductCondition, TransactionMethod } from '@/types'
import {
  ProductCategories,
  ProductConditions,
  TransactionMethods,
} from '@/types'

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const defaultImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f5f7fa" width="200" height="200"/%3E%3Ctext x="100" y="110" text-anchor="middle" fill="%23c0c4cc" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'

const filterForm = reactive({
  category: undefined as ProductCategory | undefined,
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  condition: undefined as ProductCondition | undefined,
  transactionMethod: undefined as TransactionMethod | undefined,
  keyword: undefined as string | undefined,
  sortBy: 'created_at' as 'price_asc' | 'price_desc' | 'created_at',
})

async function fetchProducts() {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: filterForm.sortBy,
    }

    if (filterForm.category) params.category = filterForm.category
    if (filterForm.condition) params.condition = filterForm.condition
    if (filterForm.transactionMethod) params.transactionMethod = filterForm.transactionMethod
    if (filterForm.minPrice !== undefined) params.minPrice = filterForm.minPrice
    if (filterForm.maxPrice !== undefined) params.maxPrice = filterForm.maxPrice
    if (filterForm.keyword) params.keyword = filterForm.keyword

    const response = await productApi.getList(params)
    products.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  currentPage.value = 1
  fetchProducts()
}

function handleSizeChange(val: number) {
  pageSize.value = val
  fetchProducts()
}

function handleCurrentChange(val: number) {
  currentPage.value = val
  fetchProducts()
}

onMounted(() => {
  const keyword = route.query.keyword as string
  if (keyword) {
    filterForm.keyword = keyword
  }
  fetchProducts()
})
</script>

<style scoped>
.products-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  padding: 20px;
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
  margin-bottom: 10px;
}

.product-meta span {
  font-size: 12px;
  color: #666;
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 4px;
}

.product-seller {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
}
</style>
