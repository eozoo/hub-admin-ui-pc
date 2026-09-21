import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { tokenStorage } from '@/utils/storage'
import type { AuthUser, LoginPayload } from '@/types/auth'

export const useUserStore = defineStore('user', () => {
  const profile = ref<AuthUser | null>(null)
  const loaded = computed(() => profile.value !== null)
  const roles = computed(() => profile.value?.roles ?? [])
  const permissions = computed(() => profile.value?.permissions ?? [])

  async function signIn(payload: LoginPayload) {
    const { data } = await authApi.login(payload)
    if (data.mfaRequired) {
      tokenStorage.setMfaToken(data.accessToken)
      return { mfaRequired: true }
    }
    tokenStorage.clearMfaToken()
    tokenStorage.setTokens(data)
    return { mfaRequired: false }
  }

  async function signInWithLdap(payload: Pick<LoginPayload, 'userAccount' | 'passWord'>) {
    const { data } = await authApi.ldapLogin(payload)
    tokenStorage.clearMfaToken()
    tokenStorage.setTokens(data)
  }

  async function loadProfile() {
    const { data } = await authApi.getAuthInfo()
    profile.value = data
    return data
  }

  async function signOut() {
    try {
      await authApi.logout()
    } finally {
      reset()
    }
  }

  function reset() {
    tokenStorage.clearTokens()
    tokenStorage.clearMfaToken()
    profile.value = null
  }

  return { profile, loaded, roles, permissions, signIn, signInWithLdap, loadProfile, signOut, reset }
})
