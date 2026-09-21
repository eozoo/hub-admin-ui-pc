import { request } from '@/utils/http'

export interface IdentityBinding {
  providerCode: string
  status: 0 | 1
  bound: boolean
  userAccount: string | null
  userName: string | null
  userAvatar: string | null
  userEmail: string | null
  createTime: string | null
}

export function getIdentityBindings() {
  return request<IdentityBinding[]>({ url: '/admin/api/v1/profile/identities', method: 'GET' })
}

export function authorizeIdentityBinding(providerCode: string) {
  return request<string>({ url: `/admin/api/v1/profile/identities/bind/${encodeURIComponent(providerCode)}`, method: 'POST' })
}

export function bindLdapIdentity(data: { userAccount: string; passWord: string }) {
  return request<IdentityBinding>({ url: '/admin/api/v1/profile/identities/bind/ldap', method: 'POST', data })
}

export function completeIdentityBinding(providerCode: string, code: string, state: string) {
  return request<IdentityBinding>({
    url: `/admin/api/v1/profile/identities/callback/${encodeURIComponent(providerCode)}`,
    method: 'GET', params: { code, state }
  })
}
