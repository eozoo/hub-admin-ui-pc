import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { externalAuthStorage, tokenStorage } from '@/utils/storage'
import type { AuthUser, LoginPayload, TokenPair } from '@/types/auth'
import { useSocketStore } from '@/stores/modules/socket'
import { useTabsStore } from '@/stores/modules/tabs'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<AuthUser | null>(null)
  const loaded = computed(() => profile.value !== null)
  const roles = computed(() => profile.value?.roles ?? [])
  const permissions = computed(() => profile.value?.permissions ?? [])

  function acceptLogin(data: TokenPair): 'bind' | 'mfa' | 'complete' {
    if (data.bindRequired) {
      if (!data.bindToken || !data.bindType) throw new Error('绑定凭证缺失')
      externalAuthStorage.setPendingBind({
        bindToken: data.bindToken,
        bindType: data.bindType,
        bindAccount: data.bindAccount ?? '',
        bindName: data.bindName ?? ''
      })
      return 'bind'
    }
    externalAuthStorage.clearPendingBind()
    if (data.mfaRequired) {
      tokenStorage.setMfaToken(data.accessToken)
      return 'mfa'
    }
    tokenStorage.clearMfaToken()
    useSocketStore().openNotice()
    return 'complete'
  }

  async function signIn(payload: LoginPayload) {
    const { data } = await authApi.login(payload)
    return { mfaRequired: acceptLogin(data) === 'mfa' }
  }

  async function signInWithLdap(payload: Pick<LoginPayload, 'userAccount' | 'passWord'>) {
    const { data } = await authApi.ldapLogin(payload)
    return acceptLogin(data)
  }

  async function loadProfile(): Promise<AuthUser> {
    const version = tokenStorage.getRefreshToken()
    const { data } = await authApi.getAuthInfo()
    if (tokenStorage.getRefreshToken() !== version) return loadProfile()
    profile.value = data
    return data
  }

  async function signOut() {
    return authApi.logout()
  }

  window.addEventListener('hub-auth-changed', (event) => {
    const kind = (event as CustomEvent<string>).detail
    if (kind === 'refresh') {
      useSocketStore().refreshToken()
    } else {
      profile.value = null
      useSocketStore().close()
      useTabsStore().reset()
    }
  })

  function reset(expectedVersion: string | null = tokenStorage.getRefreshToken()) {
    if (!tokenStorage.clearTokens(expectedVersion)) return
    useSocketStore().close()
    useTabsStore().reset()
    tokenStorage.clearMfaToken()
    profile.value = null
  }

  return { profile, loaded, roles, permissions, acceptLogin, signIn, signInWithLdap, loadProfile, signOut, reset }
})
