import type { TokenPair } from '@/types/auth'
import { translate } from '@/locales'

export interface PendingBind {
  bindToken: string
  bindType: 'ldap' | 'oauth'
  bindAccount: string
  bindName: string
}

export const externalAuthStorage = {
  setOAuthState(providerCode: string, state: string) {
    window.sessionStorage.setItem(`oauth_state:${providerCode}`, state)
  },
  consumeOAuthState(providerCode: string) {
    const key = `oauth_state:${providerCode}`
    const state = window.sessionStorage.getItem(key)
    window.sessionStorage.removeItem(key)
    return state
  },
  setAccountBindingState(providerCode: string, state: string) {
    window.sessionStorage.setItem(`account_binding_state:${providerCode}`, state)
  },
  getAccountBindingState(providerCode: string) {
    return window.sessionStorage.getItem(`account_binding_state:${providerCode}`)
  },
  clearAccountBindingState(providerCode: string) {
    window.sessionStorage.removeItem(`account_binding_state:${providerCode}`)
  },
  setPendingBind(value: PendingBind) {
    window.sessionStorage.setItem('external_bind', JSON.stringify(value))
  },
  getPendingBind(): PendingBind | null {
    const value = window.sessionStorage.getItem('external_bind')
    if (!value) return null
    try {
      return JSON.parse(value) as PendingBind
    } catch {
      return null
    }
  },
  clearPendingBind() {
    window.sessionStorage.removeItem('external_bind')
  }
}

const KEYS = {
  mfaToken: 'mfa_token',
  rememberedAccount: 'remembered_account'
} as const

function get(key: string): string | null {
  return window.localStorage.getItem(key)
}

function set(key: string, value: string | number): void {
  window.localStorage.setItem(key, String(value))
}

function remove(key: string): void {
  window.localStorage.removeItem(key)
}

export type AuthChange = 'login' | 'refresh' | 'logout'

const AUTH_TOKENS_KEY = 'hub_auth_tokens'

interface StoredTokens {
  accessToken: string
  refreshToken: string
  kind: 'login' | 'refresh'
}

// 清理旧版分开保存的记录；新版令牌对只写入一个localStorage条目。
remove('access_token')
remove('refresh_token')
remove('hub_auth_version')

function readTokens(value: string | null = get(AUTH_TOKENS_KEY)): StoredTokens | null {
  if (!value) return null
  try {
    const tokens = JSON.parse(value) as StoredTokens
    if (!tokens || typeof tokens.accessToken !== 'string' || !tokens.accessToken
        || typeof tokens.refreshToken !== 'string' || !tokens.refreshToken
        || !['login', 'refresh'].includes(tokens.kind)) return null
    return tokens
  } catch {
    return null
  }
}

function notifyAuthChange(kind: AuthChange): void {
  window.dispatchEvent(new CustomEvent<AuthChange>('hub-auth-changed', { detail: kind }))
}

window.addEventListener('storage', (event) => {
  if (event.storageArea !== window.localStorage || event.key !== AUTH_TOKENS_KEY) return
  // 忽略已被后续登录或刷新覆盖的旧事件，直接读取当前完整令牌对。
  if (event.newValue !== get(AUTH_TOKENS_KEY)) return
  const tokens = readTokens(event.newValue)
  notifyAuthChange(tokens?.kind ?? 'logout')
})

export const tokenStorage = {
  getTokens: () => readTokens(),
  getAccessToken: () => readTokens()?.accessToken ?? null,
  getRefreshToken: () => readTokens()?.refreshToken ?? null,
  getMfaToken: () => get(KEYS.mfaToken),
  setMfaToken: (token: string) => set(KEYS.mfaToken, token),
  clearMfaToken: () => remove(KEYS.mfaToken),
  setTokens(tokens: TokenPair, kind: 'login' | 'refresh' = 'login') {
    if (!tokens.accessToken || !tokens.refreshToken) throw new Error(translate('auth.login.stateChanged'))
    set(AUTH_TOKENS_KEY, JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      kind
    } satisfies StoredTokens))
    notifyAuthChange(kind)
  },
  clearTokens(expectedRefreshToken: string | null = readTokens()?.refreshToken ?? null): boolean {
    // Refresh令牌本身作为版本快照，旧请求不能清理后续登录或刷新保存的新令牌对。
    if ((readTokens()?.refreshToken ?? null) !== expectedRefreshToken) return false
    remove(AUTH_TOKENS_KEY)
    remove(KEYS.mfaToken)
    notifyAuthChange('logout')
    return true
  }
}

export const preferenceStorage = {
  getRememberedAccount: () => get(KEYS.rememberedAccount) ?? '',
  setRememberedAccount: (account: string) => set(KEYS.rememberedAccount, account),
  clearRememberedAccount: () => remove(KEYS.rememberedAccount)
}
