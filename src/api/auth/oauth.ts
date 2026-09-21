import { request } from '@/utils/http'
import type { PageResult } from '@/types/api'

export interface OAuthConfig {
  providerId?: number
  clientId: string
  clientSecret: string
  authUrl: string
  redirectUrl: string
  authScope: string
  status: number
}

export interface OAuthUser {
  id: number
  userId: number
  externalSubject: string
  userAvatar: string | null
  userAccount: string
  userName: string | null
  userEmail: string | null
  authStatus: 0 | 1
  lastLoginTime: string | null
  lastSyncTime: string | null
  createTime: string | null
  updateTime: string | null
}

const base = '/admin/api/v1/oauth'

export const getOAuthConfig = (providerCode: string) =>
  request<OAuthConfig | null>({ url: `${base}/config/${encodeURIComponent(providerCode)}`, method: 'GET' })
export const saveOAuthConfig = (providerCode: string, data: OAuthConfig) =>
  request<void>({ url: `${base}/config/${encodeURIComponent(providerCode)}`, method: 'PATCH', data })
export const getOAuthUsers = (providerCode: string, userAccount: string, pageIndex: number, pageSize: number) =>
  request<PageResult<OAuthUser>>({ url: `${base}/user/${encodeURIComponent(providerCode)}`, method: 'GET', params: { userAccount, pageIndex, pageSize } })

export const updateOAuthIdentityStatus = (providerCode: string, id: number, authStatus: 0 | 1) =>
  request<void>({ url: `${base}/user/${encodeURIComponent(providerCode)}/${id}/status`, method: 'PATCH', data: { authStatus } })

export const deleteOAuthIdentity = (providerCode: string, id: number) =>
  request<void>({ url: `${base}/user/${encodeURIComponent(providerCode)}/${id}`, method: 'DELETE' })
