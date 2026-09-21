<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { mfaLogin } from '@/api/auth'
import { tokenStorage } from '@/utils/storage'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ code: '' })
const rules = computed<FormRules>(() => ({
  code: [{ required: true, message: t('auth.validation.mfaCodeRequired'), trigger: 'blur' }]
}))

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  const mfaToken = tokenStorage.getMfaToken()
  if (!mfaToken) return void ElMessage.warning(t('auth.mfa.expired'))
  loading.value = true
  try {
    await mfaLogin({
      mfaToken,
      mfaCode: form.code
    })
    tokenStorage.clearMfaToken()
    await router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mfa-page">
    <el-card class="mfa-card">
      <h2>{{ t('auth.mfa.title') }}</h2>
      <p>{{ t('auth.mfa.description') }}</p>
      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="submit">
        <el-form-item prop="code">
          <el-input v-model="form.code" maxlength="8" size="large" :placeholder="t('auth.mfa.code')" />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" @click="submit">{{ t('auth.mfa.submit') }}</el-button>
      </el-form>
    </el-card>
  </main>
</template>

<style scoped>
.mfa-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #eef4f8;
}
.mfa-card {
  width: min(400px, calc(100vw - 40px));
  padding: 18px;
}
.mfa-card h2 {
  color: #16304a;
}
.mfa-card p {
  margin-bottom: 26px;
  color: #8190a2;
}
.el-button {
  width: 100%;
}
</style>
