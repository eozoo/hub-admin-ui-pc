import { request } from '@/utils/http'

export interface UserProfile {
  userId: number
  userType: string
  userName: string
  userAccount: string
  userSex: number | null
  userPhone: string | null
  userEmail: string | null
  avatar: string | null
  tenantName: string
  roles: string[]
  depts: string[]
  parents: string[]
  createTime: string | null
}

export interface ProfileUpdate {
  userName: string
  userSex: number | null
  userPhone: string
  userEmail: string
}

export interface MfaInfo {
  enabled: boolean
  mfaUrl: string | null
  mfaKey: string | null
}

const base = '/admin/api/v1/profile'

export const getUserProfile = () => request<UserProfile>({ url: base, method: 'GET' })
export const updateUserProfile = (data: ProfileUpdate) => request<void>({ url: base, method: 'PATCH', data })
export const resetPassword = (data: { oldPasswd: string; newPasswd: string }) =>
  request<void>({ url: `${base}/passwd`, method: 'PATCH', data })
export const getMfa = () => request<MfaInfo>({ url: `${base}/mfa`, method: 'GET' })
export const enableMfa = (data: { mfaKey: string; mfaCode: string }) =>
  request<void>({ url: `${base}/mfa/enable`, method: 'PATCH', data })
export const disableMfa = (data: { mfaCode: string }) =>
  request<void>({ url: `${base}/mfa/disable`, method: 'PATCH', data })
export const uploadAvatar = (data: FormData) =>
  request<{ viewUrl: string }>({ url: '/admin/api/v1/attach', method: 'POST', data,
    headers: { 'Content-Type': 'multipart/form-data' } })
