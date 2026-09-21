import { request } from '@/utils/http'
import type { PageResult } from '@/types/api'

export type EnableStatus = 0 | 1
export type TenantType = 'system' | 'normal' | 'trial' | 'public'

export interface TenantRow {
  tenantId: number
  tenantCode: string
  tenantName: string
  logo?: string | null
  tenantType: TenantType
  userLimit: number | null
  userCount: number | null
  status: EnableStatus
  expireTime: string | null
  title: string | null
  tenantDomain: string | null
  tenantUser: string | null
  tenantAddr: string | null
  tenantPhone: string | null
  tenantEmail: string | null
  remark: string | null
  createTime: string | null
}

export interface TenantQuery {
  tenantCode?: string
  tenantName?: string
  tenantType?: TenantType
  status?: EnableStatus
}

export const listTenants = (query: TenantQuery, pageIndex: number, pageSize: number) =>
  request<PageResult<TenantRow>>({
    url: '/admin/api/v1/tenant', method: 'GET', params: { ...query, pageIndex, pageSize }, noRepeat: false
  })

export interface TenantForm {
  tenantCode: string
  tenantName: string
  tenantType: TenantType
  title: string
  userLimit: number
  expireTime: string | null
  tenantDomain: string
  tenantUser: string
  tenantAddr: string
  tenantPhone: string
  tenantEmail: string
  remark: string
}

export interface TenantUpdate extends TenantForm {
  tenantId: number
}

export interface TenantManager {
  userId: number
  userAccount: string
  userName: string
  userStatus: EnableStatus
  status: EnableStatus | null
}

const base = '/admin/api/v1/tenant'
export const getTenant = (tenantId: number) => request<TenantRow>({ url: `${base}/${tenantId}`, method: 'GET' })
export const createTenant = (data: TenantForm) => request<void>({ url: base, method: 'POST', data })
export const editTenant = (data: TenantUpdate) => request<void>({ url: base, method: 'PATCH', data })
export const updateTenantStatus = (tenantId: number, status: EnableStatus) =>
  request<void>({ url: `${base}/status`, method: 'PATCH', data: { tenantId, status } })
export const listManagers = (tenantId: number, pageIndex: number, pageSize: number) =>
  request<PageResult<TenantManager>>({ url: `${base}/manager/${tenantId}`, method: 'GET', params: { pageIndex, pageSize }, noRepeat: false })
export const managerCandidates = (keyword: string) =>
  request<TenantManager[]>({ url: `${base}/manager/users/options`, method: 'GET', params: { keyword }, noRepeat: false })
export const createManager = (tenantId: number, userAccount: string, userName: string, userPasswd: string) =>
  request<void>({ url: `${base}/manager`, method: 'POST', data: { tenantId, userAccount, userName, userPasswd } })
export const grantManager = (tenantId: number, userId: number) =>
  request<void>({ url: `${base}/manager/grant`, method: 'POST', data: { tenantId, userId } })
export const removeManager = (tenantId: number, userIds: number[]) =>
  request<void>({ url: `${base}/manager/remove`, method: 'PATCH', data: { tenantId, userIds } })
