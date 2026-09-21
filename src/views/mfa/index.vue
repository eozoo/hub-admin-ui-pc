<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { mfaLogin } from '@/api/auth'
import { tokenStorage } from '@/utils/storage'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ code: '' })
const rules: FormRules = { code: [{ required: true, message: '请输入动态验证码', trigger: 'blur' }] }

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  const mfaToken = tokenStorage.getMfaToken()
  if (!mfaToken) return void ElMessage.warning('二次认证会话已失效，请重新登录')
  loading.value = true
  try {
    const { data } = await mfaLogin({ accessToken: mfaToken, code: form.code })
    tokenStorage.setTokens(data)
    tokenStorage.clearMfaToken()
    await router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } finally { loading.value = false }
}
</script>

<template>
  <main class="mfa-page"><el-card class="mfa-card"><h2>二次认证</h2><p>请输入身份验证器中的动态验证码</p><el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="submit"><el-form-item prop="code"><el-input v-model="form.code" maxlength="8" size="large" placeholder="动态验证码" /></el-form-item><el-button type="primary" size="large" :loading="loading" @click="submit">确认登录</el-button></el-form></el-card></main>
</template>

<style scoped>.mfa-page{min-height:100vh;display:grid;place-items:center;background:#eef4f8}.mfa-card{width:min(400px,calc(100vw - 40px));padding:18px}.mfa-card h2{color:#16304a}.mfa-card p{margin-bottom:26px;color:#8190a2}.el-button{width:100%}</style>
