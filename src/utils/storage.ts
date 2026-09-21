import type { TokenPair } from '@/types/auth'

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  mfaToken: 'mfa_token',
  tenantIndex: 'tenant_index',
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

export const tokenStorage = {
  getAccessToken: () => get(KEYS.accessToken),
  getRefreshToken: () => get(KEYS.refreshToken),
  getMfaToken: () => get(KEYS.mfaToken),
  setMfaToken: (token: string) => set(KEYS.mfaToken, token),
  clearMfaToken: () => remove(KEYS.mfaToken),
  setTokens(tokens: TokenPair) {
    set(KEYS.accessToken, tokens.accessToken)
    set(KEYS.refreshToken, tokens.refreshToken)
    if (tokens.tenantIndex != null) set(KEYS.tenantIndex, tokens.tenantIndex)
  },
  clearTokens() {
    remove(KEYS.accessToken)
    remove(KEYS.refreshToken)
    remove(KEYS.tenantIndex)
  }
}

export const preferenceStorage = {
  getRememberedAccount: () => get(KEYS.rememberedAccount) ?? '',
  setRememberedAccount: (account: string) => set(KEYS.rememberedAccount, account),
  clearRememberedAccount: () => remove(KEYS.rememberedAccount)
}
