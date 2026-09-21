import { request } from '@/utils/http'
import type { AccountBind, AuthUser, CaptchaInfo, LoginPayload, TokenPair } from '@/types/auth'
import type { RequestConfig } from '@/utils/http/types'
import { signOutSession } from '@/utils/auth-session'
import { tokenStorage } from '@/utils/storage'

const DEVICE_ID_KEY = 'hub_device_id'

async function loginRequest(config: RequestConfig) {
  const response = await request<TokenPair>(config)
  if (!response.data.mfaRequired && !response.data.bindRequired) tokenStorage.setTokens(response.data)
  return response
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    deviceId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function getCaptcha() {
  return request<CaptchaInfo>({
    url: '/admin/api/v1/auth/public/captcha',
    method: 'GET',
    timeout: 5000,
    requireToken: false
  })
}

export function getEmailCode(email: string) {
  return request<void>({
    url: '/admin/api/v1/auth/public/captcha/email',
    method: 'GET',
    params: { email },
    timeout: 5000,
    requireToken: false
  })
}

export function register(data: { userAccount: string; userName: string; userEmail: string; captcha: string }) {
  return request<string>({
    url: '/admin/api/v1/auth/public/register',
    method: 'POST',
    data,
    requireToken: false
  })
}

export function login(data: LoginPayload) {
  return loginRequest({
    url: '/admin/api/v1/auth/public/login',
    method: 'POST',
    data: { ...data, deviceId: data.deviceId || getDeviceId() },
    requireToken: false
  })
}

export function ldapLogin(data: Pick<LoginPayload, 'userAccount' | 'passWord'>) {
  return loginRequest({
    url: '/admin/api/v1/auth/public/ldap',
    method: 'POST',
    data: { ...data, deviceId: getDeviceId() },
    requireToken: false
  })
}

export function oauthCallback(providerCode: string, code: string, state: string) {
  return loginRequest({
    url: `/admin/api/v1/auth/public/${providerCode}`,
    method: 'GET',
    params: { code, state, deviceId: getDeviceId() },
    requireToken: false,
    skipAuthRefresh: true
  })
}

export function bindExternalAccount(data: AccountBind) {
  return loginRequest({
    url: '/admin/api/v1/auth/public/bind',
    method: 'POST',
    data: { ...data, deviceId: getDeviceId() },
    requireToken: false,
    skipAuthRefresh: true
  })
}

export function mfaLogin(data: Record<string, unknown>) {
  return loginRequest({
    url: '/admin/api/v1/auth/public/mfa',
    method: 'POST',
    data: { ...data, deviceId: getDeviceId() },
    requireToken: false
  })
}

export function logout() {
  return signOutSession()
}

export function getAuthInfo() {
  return request<AuthUser>({
    url: '/admin/api/v1/auth/info',
    method: 'GET'
  })
}
