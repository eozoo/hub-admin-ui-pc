<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { oauthCallback } from '@/api/auth'
import { completeIdentityBinding } from '@/api/auth/binding'
import { useAuthStore } from '@/stores/modules/auth'
import { externalAuthStorage } from '@/utils/storage'
import { tokenStorage } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const error = ref('')
const isBinding = ref(false)

onMounted(async () => {
  const providerCode = String(route.params.providerCode)
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  const state = typeof route.query.state === 'string' ? route.query.state : ''
  const bindingState = externalAuthStorage.getAccountBindingState(providerCode)
  if (bindingState) {
    isBinding.value = true
    if (!code || !state || bindingState !== state) {
      externalAuthStorage.clearAccountBindingState(providerCode)
      error.value = t('auth.oauth.invalidState')
      return
    }
    try {
      await completeIdentityBinding(providerCode, code, state)
      externalAuthStorage.clearAccountBindingState(providerCode)
      await router.replace({ name: 'AccountBinding', query: { bound: providerCode } })
    } catch {
      externalAuthStorage.clearAccountBindingState(providerCode)
      error.value = t('common.binding.failed')
    }
    return
  }
  const expectedState = externalAuthStorage.consumeOAuthState(providerCode)
  if (!code || !state || !expectedState || state !== expectedState) {
    error.value = t('auth.oauth.invalidState')
    return
  }
  if (providerCode !== 'gitlab' && providerCode !== 'github' && providerCode !== 'wechat' && providerCode !== 'qq' && providerCode !== 'bilibili') {
    error.value = t('auth.oauth.unsupported')
    return
  }
  try {
    const { data } = await oauthCallback(providerCode, code, state)
    const result = authStore.acceptLogin(data)
    if (result === 'bind') await router.replace({ name: 'BindExternal' })
    else if (result === 'mfa') await router.replace({ name: 'Mfa' })
    else await router.replace({ name: 'Dashboard' })
  } catch {
    error.value = t('auth.oauth.failed')
  }
})
</script>

<template>
  <main class="callback-page">
    <el-card class="callback-card">
      <h2>{{ error || t('auth.oauth.processing') }}</h2>
      <el-button v-if="error" type="primary" @click="router.replace({ name: isBinding && tokenStorage.getAccessToken() ? 'AccountBinding' : 'Login' })">
        {{ isBinding && tokenStorage.getAccessToken() ? t('common.binding.back') : t('auth.oauth.backToLogin') }}
      </el-button>
    </el-card>
  </main>
</template>

<style scoped>
.callback-page { min-height: 100vh; display: grid; place-items: center; background: var(--el-bg-color-page); }
.callback-card { width: min(420px, calc(100vw - 40px)); text-align: center; }
.callback-card h2 { font-size: 18px; margin: 10px 0 20px; }
</style>
