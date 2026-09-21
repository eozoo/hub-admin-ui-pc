import { request } from '@/utils/http'
import type { AuthUser, CaptchaInfo, LoginPayload, TokenPair } from '@/types/auth'
import type { MenuRoute } from '@/types/router'

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
    url: '/admin/api/v1/auth/public/captcha/email', method: 'GET', params: { email }, timeout: 5000, requireToken: false
  })
}

export function register(data: { userAccount: string; userName: string; userEmail: string; captcha: string }) {
  return request<string>({
    url: '/admin/api/v1/auth/public/register', method: 'POST', data, requireToken: false
  })
}

export function login(data: LoginPayload) {
  return request<TokenPair>({
    url: '/admin/api/v1/auth/public/login',
    method: 'POST',
    data,
    requireToken: false
  })
}

export function ldapLogin(data: Pick<LoginPayload, 'userAccount' | 'passWord'>) {
  return request<TokenPair>({
    url: '/admin/api/v1/auth/public/ldap',
    method: 'POST',
    data,
    requireToken: false
  })
}

export function mfaLogin(data: Record<string, unknown>) {
  return request<TokenPair>({
    url: '/admin/api/v1/auth/public/mfa',
    method: 'POST',
    data,
    requireToken: false
  })
}

export function logout() {
  return request<void>({ url: '/admin/api/v1/auth/logout', method: 'DELETE' })
}

export function getAuthInfo() {
  return request<AuthUser>({ url: '/admin/api/v1/auth/info', method: 'GET' })
}

export function getAuthMenus() {
  return request<MenuRoute[]>({ url: '/admin/api/v1/auth/menus', method: 'GET' })
}
