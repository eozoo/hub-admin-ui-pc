import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import router from '@/router'
import { tokenStorage } from '@/utils/storage'
import type { ApiResponse } from '@/types/api'
import type { TokenPair } from '@/types/auth'
import type { RequestConfig } from './types'

type RetryConfig = InternalAxiosRequestConfig & RequestConfig & { _retry?: boolean; _pendingKey?: string }

const pendingRequests = new Set<string>()
let refreshing: Promise<string> | null = null

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

function pendingKey(config: InternalAxiosRequestConfig): string {
  return `${config.method ?? 'get'}:${config.url ?? ''}`
}

function releasePending(config?: RetryConfig): void {
  if (config?._pendingKey) pendingRequests.delete(config._pendingKey)
}

service.interceptors.request.use(config => {
  const requestConfig = config as RetryConfig
  if (requestConfig.requireToken !== false) {
    const token = tokenStorage.getAccessToken()
    if (token) requestConfig.headers.Authorization = `Bearer ${token}`
  }
  requestConfig.headers['Accept-Language'] = 'zh-CN'

  const method = requestConfig.method?.toLowerCase()
  if (requestConfig.noRepeat !== false && ['post', 'put', 'patch', 'delete'].includes(method ?? '')) {
    const key = pendingKey(requestConfig)
    if (pendingRequests.has(key)) return Promise.reject(new Error('请求正在处理，请勿重复提交'))
    pendingRequests.add(key)
    requestConfig._pendingKey = key
  }
  return requestConfig
})

async function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) throw new Error('登录状态已失效')

    refreshing = axios
      .get<ApiResponse<TokenPair>>('/admin/api/v1/auth/public/refresh', {
        baseURL: import.meta.env.VITE_API_BASE,
        params: { refreshToken },
        timeout: 10_000
      })
      .then(({ data }) => {
        tokenStorage.setTokens(data.data)
        return data.data.accessToken
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

service.interceptors.response.use(
  response => {
    releasePending(response.config as RetryConfig)
    return response.data
  },
  async (error: AxiosError<{ msg?: string }>) => {
    const config = error.config as RetryConfig | undefined
    releasePending(config)
    const status = error.response?.status

    if (status === 498 && config && !config._retry && !config.skipAuthRefresh) {
      config._retry = true
      try {
        const accessToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${accessToken}`
        return service(config)
      } catch {
        tokenStorage.clearTokens()
        await router.replace({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
        return Promise.reject(error)
      }
    }

    const message = error.response?.data?.msg || error.message || '服务请求失败'
    if (status === 401) {
      tokenStorage.clearTokens()
      if (router.currentRoute.value.name !== 'Login') {
        await ElMessageBox.alert(message, '登录提示', { type: 'warning' })
        await router.replace({ name: 'Login' })
      } else {
        ElNotification.error({ title: '认证失败', message })
      }
    } else if (!config?.noNotify) {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  }
)

export function request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
  return service.request<never, ApiResponse<T>>(config)
}

export default service
