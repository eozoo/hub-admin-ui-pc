import type { MenuRoute } from './router'

export interface LoginForm {
  username: string
  password: string
  code: string
  uuid: string
}

export interface LoginPayload {
  userAccount: string
  passWord: string
  deviceId?: string
  captcha?: string
  captchaId?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken?: string
  mfaRequired: boolean
  bindRequired?: boolean
  bindToken?: string
  bindType?: 'ldap' | 'oauth'
  bindAccount?: string
  bindName?: string
}

export interface AccountBind {
  bindToken: string
  bindType: 'ldap' | 'oauth'
  userAccount: string
  userName: string
  passWord: string
}

export interface CaptchaInfo {
  img: string
  uuid: string
  captchaOnOff: boolean
  registerOnOff: boolean
  oauthUrls: Record<string, string>
}

export interface AuthUser {
  tenantId: number
  tenantCode: string
  tenantTitle: string
  tenantLogo?: string | null
  tenantWebsite?: string | null
  tenantFavicon?: string | null
  userId: number
  userName: string
  avatar?: string
  needChangePasswd?: number
  roles: string[]
  permissions: string[]
  menus: MenuRoute[]
}
