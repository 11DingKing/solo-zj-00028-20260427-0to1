<template>
  <header class="nav-header">
    <div class="nav-container">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <el-icon :size="28" color="#409eff"><ShoppingCart /></el-icon>
          <span class="logo-text">校园二手交易平台</span>
        </router-link>
      </div>

      <div class="nav-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品..."
          prefix-icon="Search"
          style="width: 300px"
          @keyup.enter="handleSearch"
          @change="handleSearch"
        >
        </el-input>
      </div>

      <div class="nav-right">
        <router-link to="/products" class="nav-item">
          <el-icon><Goods /></el-icon>
          <span>商品列表</span>
        </router-link>

        <template v-if="authStore.isLoggedIn">
          <router-link to="/publish" class="nav-item publish-btn">
            <el-icon><Plus /></el-icon>
            <span>发布商品</span>
          </router-link>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="notification-icon" @click="toggleNotifications">
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="item">
                <el-icon :size="20"><Bell /></el-icon>
              </el-badge>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="notification-dropdown">
                  <div class="notification-header">
                    <span>通知</span>
                    <el-button type="text" size="small" @click.stop="markAllAsRead">
                      全部已读
                    </el-button>
                  </div>
                  <el-divider style="margin: 0" />
                  <div class="notification-list" v-if="notifications.length > 0">
                    <el-dropdown-item
                      v-for="item in notifications"
                      :key="item._id"
                      :class="{ unread: !item.read }"
                      @click="goToNotification(item)"
                    >
                      <div class="notification-item">
                        <div class="notification-title">{{ item.title }}</div>
                        <div class="notification-content">{{ item.content }}</div>
                        <div class="notification-time">
                          {{ formatTime(item.createdAt) }}
                        </div>
                      </div>
                    </el-dropdown-item>
                  </div>
                  <div v-else class="empty-notifications">
                    暂无通知
                  </div>
                  <el-divider style="margin: 0" />
                  <router-link to="/profile?tab=notifications" class="view-all">
                    查看全部
                  </router-link>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32">
                {{ authStore.user?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ authStore.user?.nickname }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/orders">
                    <el-icon><Document /></el-icon>
                    我的订单
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/negotiations">
                    <el-icon><ChatDotRound /></el-icon>
                    议价管理
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <router-link to="/login" class="nav-item">
            <el-icon><User /></el-icon>
            <span>登录</span>
          </router-link>
          <router-link to="/register" class="nav-item register-btn">
            <span>注册</span>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { notificationApi } from '@/api'
import type { Notification } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const searchKeyword = ref('')
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
let pollTimer: number | null = null

async function fetchNotifications() {
  try {
    const response = await notificationApi.getList({ limit: 5 })
    notifications.value = response.data.items
    unreadCount.value = response.data.unreadCount
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

async function fetchUnreadCount() {
  try {
    const response = await notificationApi.getUnreadCount()
    unreadCount.value = response.data.count
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

function startPolling() {
  pollTimer = window.setInterval(() => {
    if (authStore.isLoggedIn) {
      fetchUnreadCount()
    }
  }, 30000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({
      name: 'Products',
      query: { keyword: searchKeyword.value.trim() },
    })
  }
}

async function markAllAsRead() {
  try {
    await notificationApi.markAllAsRead()
    unreadCount.value = 0
    notifications.value.forEach((n) => (n.read = true))
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

function toggleNotifications() {
  if (authStore.isLoggedIn) {
    fetchNotifications()
  }
}

function goToNotification(item: Notification) {
  if (!item.read) {
    notificationApi.markAsRead(item._id).then(() => {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    })
  }
  if (item.relatedType === 'Order') {
    router.push(`/orders/${item.relatedId}`)
  } else if (item.relatedType === 'Negotiation') {
    router.push(`/negotiations/${item.relatedId}`)
  }
}

function handleCommand(command: string) {
  if (command === 'logout') {
    handleLogout()
  }
}

function handleLogout() {
  authStore.logout()
  stopPolling()
  router.push('/')
}

function formatTime(time: string) {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchUnreadCount()
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.nav-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left .logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: #666;
  transition: all 0.3s;
  border-radius: 4px;
}

.nav-item:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.publish-btn {
  background: #409eff;
  color: #fff;
  border-radius: 4px;
}

.publish-btn:hover {
  background: #66b1ff;
  color: #fff;
}

.register-btn {
  background: #f56c6c;
  color: #fff;
  border-radius: 4px;
}

.register-btn:hover {
  background: #f78989;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(64, 158, 255, 0.1);
}

.username {
  font-size: 14px;
  color: #333;
}

.notification-icon {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.notification-icon:hover {
  background: rgba(64, 158, 255, 0.1);
}

.notification-dropdown {
  width: 350px;
  max-height: 500px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
}

.notification-list {
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  padding: 8px 0;
}

.notification-item .notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.notification-item .notification-content {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.notification-item .notification-time {
  font-size: 12px;
  color: #999;
}

.empty-notifications {
  padding: 40px 0;
  text-align: center;
  color: #999;
}

.unread {
  background: rgba(64, 158, 255, 0.05);
}

.view-all {
  display: block;
  text-align: center;
  padding: 10px;
  color: #409eff;
  font-size: 14px;
}

.view-all:hover {
  background: #f5f7fa;
}
</style>
