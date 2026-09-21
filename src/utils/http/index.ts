import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import router from '@/router'
import { tokenStorage } from '@/utils/storage'
import type { ApiResponse } from '@/types/api'
import type { RequestConfig } from './types'
import { getLocale } from '@/utils/locale'
import { refreshSession } from '@/utils/auth-session'

type RetryConfig = InternalAxiosRequestConfig & RequestConfig & {
  _retry?: boolean
  _pendingKey?: string
  _authVersion?: string | null
}

const pendingRequests = new Set<string>()

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

service.interceptors.request.use(async (config) => {
  const requestConfig = config as RetryConfig
  if (requestConfig.requireToken !== false) {
    let tokens = tokenStorage.getTokens()
    if (!tokens) {
      await refreshSession()
      tokens = tokenStorage.getTokens()
    }
    if (tokens) requestConfig.headers.Authorization = `Bearer ${tokens.accessToken}`
    // 从同一份令牌对记录捕获Refresh快照，供旧请求响应的版本比较使用。
    requestConfig._authVersion = tokens?.refreshToken ?? null
  }
  requestConfig.headers['Accept-Language'] = getLocale()

  const method = requestConfig.method?.toLowerCase()
  if (requestConfig.noRepeat !== false && ['post', 'put', 'patch', 'delete'].includes(method ?? '')) {
    const key = pendingKey(requestConfig)
    if (pendingRequests.has(key)) return Promise.reject(new Error('请求正在处理，请勿重复提交'))
    pendingRequests.add(key)
    requestConfig._pendingKey = key
  }
  return requestConfig
})

service.interceptors.response.use(
  (response) => {
    releasePending(response.config as RetryConfig)
    return response.data
  },
  async (error: AxiosError<{ msg?: string }>) => {
    const config = error.config as RetryConfig | undefined
    releasePending(config)
    const status = error.response?.status

    const versionChanged = config?._authVersion !== tokenStorage.getRefreshToken()
    if ((status === 498 || (status === 401 && versionChanged)) && config
        && config.requireToken !== false && !config._retry && !config.skipAuthRefresh) {
      config._retry = true
      try {
        const accessToken = await refreshSession(String(config.headers.Authorization ?? ''))
        config.headers.Authorization = `Bearer ${accessToken}`
        return service(config)
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401
            && !tokenStorage.getRefreshToken()) {
          await router.replace({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
        }
        if (!config.noNotify && !(axios.isAxiosError(refreshError) && refreshError.response?.status === 401)) {
          ElMessage.error(refreshError instanceof Error ? refreshError.message : '服务请求失败')
        }
        return Promise.reject(refreshError)
      }
    }

    const message = error.response?.data?.msg || error.message || '服务请求失败'
    if (status === 401 && config?.requireToken !== false && !versionChanged) {
      tokenStorage.clearTokens(config?._authVersion ?? null)
      if (config?.noNotify) return Promise.reject(error)
      if (router.currentRoute.value.name !== 'Login') {
        await ElMessageBox.alert(message, '登录提示', { type: 'warning' })
        await router.replace({ name: 'Login' })
      } else {
        ElNotification.error({ title: '认证失败', message })
      }
    } else if (status === 401 && !config?.noNotify) {
      ElNotification.error({ title: '认证失败', message })
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
