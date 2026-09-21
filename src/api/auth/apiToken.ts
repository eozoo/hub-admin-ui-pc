import { request } from '@/utils/http'

export interface ApiPermitScope {
  scopeId: number
  scopeName: string
}

export interface ApiPermitNode {
  id: number
  pid: number
  label: string
  menuType: string
  menuPermit: string | null
  scopeId: number | null
  scopes: ApiPermitScope[]
  children?: ApiPermitNode[]
}

export interface ApiToken {
  tokenId: number
  tokenName: string
  tokenStatus: number
  expireTime: string | null
  ipRule: string | null
  createTime: string
  accessTime: string | null
  accessIp: string | null
  accessUrl: string | null
  permits: string[]
}

export interface ApiTokenCreate {
  tokenName: string
  expireTime: string | null
  ipRule: string | null
  menuScopes: Array<{ permit: string; scopeId: number | null }>
}

const base = '/admin/api/v1/profile/api'

export const getApiPermits = () => request<ApiPermitNode[]>({ url: `${base}/permits`, method: 'GET' })
export const listApiTokens = () => request<ApiToken[]>({ url: `${base}/token`, method: 'GET' })
export const createApiToken = (data: ApiTokenCreate) => request<string>({ url: `${base}/token`, method: 'POST', data })
export const deleteApiToken = (tokenId: number) => request<void>({ url: `${base}/token/${tokenId}`, method: 'DELETE' })
