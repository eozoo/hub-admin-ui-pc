export interface LoginForm {
  username: string
  password: string
  code: string
  uuid: string
}

export interface LoginPayload {
  userAccount: string
  passWord: string
  captcha?: string
  captchaId?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  tenantIndex?: number
  mfaRequired?: boolean
}

export interface CaptchaInfo {
  img: string
  uuid: string
  captchaOnOff: boolean
  registerOnOff: boolean
  oauthGitlabUrl?: string
}

export interface AuthUser {
  tenantId: number
  tenantTitle: string
  userId: number
  userName: string
  avatar?: string
  roles: string[]
  permissions: string[]
}
