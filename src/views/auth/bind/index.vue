<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { bindExternalAccount } from '@/api/auth'
import { useAuthStore } from '@/stores/modules/auth'
import { externalAuthStorage } from '@/utils/storage'
import type { AccountBind } from '@/types/auth'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive<AccountBind>({ bindToken: '', bindType: 'oauth', userAccount: '', userName: '', passWord: '' })
const rules = computed<FormRules>(() => ({
  userAccount: [
    { required: true, message: t('auth.bind.accountRequired'), trigger: 'blur' },
    { pattern: /^[A-Za-z][A-Za-z0-9_]{2,19}$/, message: t('auth.bind.accountInvalid'), trigger: 'blur' }
  ],
  userName: [
    { required: true, message: t('auth.bind.nameRequired'), trigger: 'blur' },
    { max: 64, message: t('auth.bind.nameInvalid'), trigger: 'blur' }
  ],
  passWord: [
    { required: true, message: t('auth.bind.passwordRequired'), trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/, message: t('auth.bind.passwordInvalid'), trigger: 'blur' }
  ]
}))

onMounted(() => {
  const pending = externalAuthStorage.getPendingBind()
  if (!pending?.bindToken || !pending.bindType) return void router.replace({ name: 'Login' })
  Object.assign(form, {
    bindToken: pending.bindToken,
    bindType: pending.bindType,
    userAccount: pending.bindAccount,
    userName: pending.bindName
  })
})

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    const { data } = await bindExternalAccount(form)
    const result = authStore.acceptLogin(data)
    ElMessage.success(t('auth.bind.success'))
    if (result === 'mfa') await router.replace({ name: 'Mfa' })
    else await router.replace({ name: 'Dashboard' })
  } finally {
    loading.value = false
  }
}

function backToLogin() {
  externalAuthStorage.clearPendingBind()
  void router.replace({ name: 'Login' })
}
</script>

<template>
  <main class="bind-page">
    <el-card class="bind-card">
      <h2>{{ t('auth.bind.title') }}</h2>
      <p>{{ t('auth.bind.description') }}</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item :label="t('auth.bind.account')" prop="userAccount">
          <el-input v-model="form.userAccount" autocomplete="username" />
        </el-form-item>
        <el-form-item :label="t('auth.bind.name')" prop="userName">
          <el-input v-model="form.userName" autocomplete="name" />
        </el-form-item>
        <el-form-item :label="t('auth.bind.password')" prop="passWord">
          <el-input v-model="form.passWord" type="password" autocomplete="new-password" show-password @keyup.enter="submit" />
        </el-form-item>
        <el-button class="submit-button" type="primary" :loading="loading" @click="submit">{{ t('auth.bind.submit') }}</el-button>
      </el-form>
      <div class="bind-footer">
        <span>{{ t('auth.bind.hint') }}</span>
        <el-link type="primary" @click="backToLogin">{{ t('auth.oauth.backToLogin') }}</el-link>
      </div>
    </el-card>
  </main>
</template>

<style scoped>
.bind-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--el-bg-color-page); }
.bind-card { width: min(460px, 100%); }
.bind-card h2 { margin: 0 0 10px; font-size: 22px; }
.bind-card p { margin: 0 0 24px; color: var(--el-text-color-secondary); line-height: 1.6; }
.submit-button { width: 100%; margin-top: 8px; }
.bind-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; font-size: 12px; color: var(--el-text-color-secondary); }
</style>
