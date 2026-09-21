import axios from 'axios'
import type { ApiResponse } from '@/types/api'
import type { TokenPair } from '@/types/auth'
import { tokenStorage } from '@/utils/storage'
import { getLocale } from '@/utils/locale'
import { translate } from '@/locales'

const sessionClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
})

let refreshing: Promise<string> | null = null

export function refreshSession(failedAccessToken = ''): Promise<string> {
  if (!refreshing) {
    refreshing = refreshTokens(failedAccessToken)
      .finally(() => { refreshing = null })
  }
  return refreshing
}

/**
 * 刷新时比较本地版本，避免旧响应覆盖新登录。
 */
async function refreshTokens(failedAccessToken = ''): Promise<string> {
  const tokens = tokenStorage.getTokens()
  if (!tokens) throw new Error(translate('auth.login.stateChanged'))
  // 其他窗口已完成轮换时，直接使用它保存的最新Access。
  if (`Bearer ${tokens.accessToken}` !== failedAccessToken) return tokens.accessToken
  const version = tokens.refreshToken
  try {
    const { data } = await sessionClient.post<ApiResponse<TokenPair>>('/admin/api/v1/auth/public/refresh', {
      refreshToken: tokens.refreshToken
    }, { headers: { 'Accept-Language': getLocale() } })
    // 旧响应不能覆盖此后登录或退出形成的状态。
    if (tokenStorage.getRefreshToken() !== version) {
      const latestToken = tokenStorage.getAccessToken()
      if (latestToken) return latestToken
      throw new Error(translate('auth.login.stateChanged'))
    }
    tokenStorage.setTokens(data.data, 'refresh')
    return data.data.accessToken
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // 旧版本刷新失败时，优先使用此后保存的新登录，不清理或再次刷新新版本。
      const latestTokens = tokenStorage.getTokens()
      if (latestTokens && latestTokens.refreshToken !== version) return latestTokens.accessToken
      tokenStorage.clearTokens(version)
    }
    throw error
  }
}

function revokeSession(accessToken: string) {
  // 退出接口只接收Authorization，不提交Refresh或refreshId。
  return sessionClient.delete('/admin/api/v1/auth/logout', {
    headers: { Authorization: `Bearer ${accessToken}`, 'Accept-Language': getLocale() }
  })
}

export async function signOutSession(): Promise<boolean> {
  const tokens = tokenStorage.getTokens()
  if (!tokens) return true
  let logoutVersion = tokens.refreshToken
  let accessToken = tokens.accessToken
  try {
    try {
      await revokeSession(accessToken)
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 498) throw error
      // 本地版本已变化时，不继续用新版本重试旧退出请求。
      if (tokenStorage.getRefreshToken() !== logoutVersion) return false
      // Access失效时先轮换，再用新Access退出；只重试一次。
      accessToken = await refreshSession(`Bearer ${accessToken}`)
      const latestTokens = tokenStorage.getTokens()
      if (!latestTokens) throw new Error(translate('auth.login.stateChanged'))
      logoutVersion = latestTokens.refreshToken
      await revokeSession(accessToken)
    }
    return tokenStorage.clearTokens(logoutVersion)
  } catch (error) {
    // 已撤销或Refresh失效时静默清理；网络错误保留令牌，允许重新退出。
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (!tokenStorage.getRefreshToken()) return true
      return tokenStorage.clearTokens(logoutVersion)
    }
    throw error
  }
}
