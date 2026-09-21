import { request } from '@/utils/http'
import type { PageResult } from '@/types/api'

export interface LdapConfig {
  ldapId?: number | null
  ldapStatus: number
  ldapUrl: string
  ldapUser: string
  ldapPasswd: string
  baseDn: string
  readonly: number
  userDn: string
  userClass: string
  accountProperty: string
  subjectProperty: string
  nameProperty: string
  emailProperty: string
  phoneProperty: string
  postProperty: string
  deptProperty: string
  leaderProperty: string
  infoProperty: string
  environment?: Record<string, unknown>
}

export interface LdapUser {
  id: number
  authStatus: 0 | 1
  lastLoginTime: string | null
  userAccount: string
  userName: string | null
  userPhone: string | null
  userEmail: string | null
  userDept: string | null
  userPost: string | null
  userLeader: string | null
  createTime: string | null
  updateTime: string | null
}

const base = '/admin/api/v1/ldap'

export const getLdapConfig = () => request<LdapConfig | null>({ url: base, method: 'GET' })
export const saveLdapConfig = (data: LdapConfig) => request<void>({ url: base, method: 'PATCH', data })
export const validLdapConfig = (data: LdapConfig) => request<void>({ url: `${base}/valid`, method: 'POST', data })
export const getLdapUsers = (ldapAccount: string, pageIndex: number, pageSize: number) =>
  request<PageResult<LdapUser>>({ url: `${base}/user`, method: 'GET', params: { ldapAccount, pageIndex, pageSize } })

export const updateLdapIdentityStatus = (id: number, authStatus: 0 | 1) =>
  request<void>({ url: `${base}/user/${id}/status`, method: 'PATCH', data: { authStatus } })

export const deleteLdapIdentity = (id: number) =>
  request<void>({ url: `${base}/user/${id}`, method: 'DELETE' })
