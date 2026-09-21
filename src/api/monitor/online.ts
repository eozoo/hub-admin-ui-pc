import { request } from '@/utils/http'
import type { PageResult } from '@/types/api'

export interface OnlineGrant {
  grantId: string
  deviceId: string
  tenantCode: string | null
  appId: string | null
  grantType: string
  grantApp: string | null
  grantTime: string | null
  grantIp: string | null
  revoked: number
}

export interface OnlineDevice {
  deviceId: string
  tenantCode: string
  refreshId: string
  authType: string
  loginSource: 'password' | 'ldap' | 'gitlab' | 'github' | 'wechat' | 'qq' | 'bilibili' | null
  userAccount: string
  userName: string
  cluster: string | null
  loginIp: string | null
  loginTime: string | null
  accessList: OnlineGrant[]
}

export interface OnlineQuery {
  userAccount?: string
  beginTime?: string
  endTime?: string
}

export const listOnline = (query: OnlineQuery, pageIndex: number, pageSize: number) =>
  request<PageResult<OnlineDevice>>({
    url: '/admin/api/v1/auth/online', method: 'POST',
    params: { pageIndex, pageSize }, data: query, noRepeat: false
  })

export const revokeDevice = (userAccount: string, deviceId: string) =>
  request<void>({
    url: '/admin/api/v1/auth/refresh', method: 'DELETE',
    params: { account: userAccount, deviceId }
  })

export const revokeGrant = (userAccount: string, deviceId: string, accessId: string) =>
  request<void>({
    url: '/admin/api/v1/auth/access', method: 'DELETE',
    params: { account: userAccount, deviceId, id: accessId }
  })
