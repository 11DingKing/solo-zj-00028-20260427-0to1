import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from '@/types'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function initAuth() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  async function login(username: string, password: string) {
    const response = await authApi.login({ username, password })
    user.value = response.data.user
    token.value = response.data.token

    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }

  async function register(
    username: string,
    email: string,
    password: string,
    nickname: string
  ) {
    const response = await authApi.register({
      username,
      email,
      password,
      nickname,
    })
    user.value = response.data.user
    token.value = response.data.token

    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchCurrentUser() {
    if (!token.value) return

    try {
      const response = await authApi.getCurrentUser()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (error) {
      logout()
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    initAuth,
    login,
    register,
    logout,
    fetchCurrentUser,
  }
})
