<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getCaptcha, getEmailCode, register } from '@/api/auth'
import { changeLocale } from '@/locales'
import { useAuthStore } from '@/stores/modules/auth'
import { externalAuthStorage, preferenceStorage } from '@/utils/storage'

type Mode = 'login' | 'register' | 'ldap'
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const userStore = useAuthStore()
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const ldapFormRef = ref<FormInstance>()
const mode = ref<Mode>('login')
const loading = ref(false)
const registerLoading = ref(false)
const ldapLoading = ref(false)
const codeUrl = ref('')
const captchaOnOff = ref(true)
const registerOnOff = ref(true)
const oauthUrls = ref<Record<string, string>>({})
const pwdShow = ref(false)
const ldapPwdShow = ref(false)
const cooldown = ref(0)
let cooldownTimer: number | undefined
const version = import.meta.env.VITE_APP_VERSION
const year = new Date().getFullYear()

const redirect = computed(() => (typeof route.query.redirect === 'string' ? route.query.redirect : '/'))
const loginForm = reactive({
  username: preferenceStorage.getRememberedAccount(),
  password: '',
  rememberMe: Boolean(preferenceStorage.getRememberedAccount()),
  code: '',
  uuid: ''
})
const registerForm = reactive({ userAccount: '', userName: '', userEmail: '', captcha: '' })
const ldapForm = reactive({ username: '', password: '' })
const loginRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('auth.validation.accountRequired'), trigger: 'submit' }],
  password: [{ required: true, message: t('auth.validation.passwordRequired'), trigger: 'submit' }],
  code: [{ required: true, message: t('auth.validation.captchaRequired'), trigger: 'submit' }]
}))
const registerRules = computed<FormRules>(() => ({
  userAccount: [
    { required: true, message: t('auth.validation.accountRequired'), trigger: 'submit' },
    { min: 3, max: 20, message: t('auth.validation.accountLength'), trigger: 'submit' }
  ],
  userName: [{ required: true, message: t('auth.validation.nicknameRequired'), trigger: 'submit' }],
  userEmail: [
    { required: true, message: t('auth.validation.emailRequired'), trigger: 'submit' },
    { type: 'email', message: t('auth.validation.emailInvalid'), trigger: 'submit' }
  ],
  captcha: [{ required: true, message: t('auth.validation.captchaRequired'), trigger: 'submit' }]
}))
const ldapRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('auth.validation.ldapAccountRequired'), trigger: 'submit' }],
  password: [{ required: true, message: t('auth.validation.passwordRequired'), trigger: 'submit' }]
}))

function toggleLocale() {
  changeLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

async function loadCaptcha() {
  try {
    const { data } = await getCaptcha()
    codeUrl.value = data.img ? `data:image/jpeg;base64,${data.img}` : ''
    loginForm.uuid = data.uuid
    captchaOnOff.value = data.captchaOnOff
    registerOnOff.value = data.registerOnOff
    oauthUrls.value = data.oauthUrls ?? {}
  } catch {
    codeUrl.value = ''
  }
}

function showMode(nextMode: Mode) {
  mode.value = nextMode
  void nextTick(() => {
    loginFormRef.value?.clearValidate()
    registerFormRef.value?.clearValidate()
    ldapFormRef.value?.clearValidate()
  })
}

async function handleLogin() {
  if (!(await loginFormRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    if (loginForm.rememberMe) preferenceStorage.setRememberedAccount(loginForm.username)
    else preferenceStorage.clearRememberedAccount()
    const result = await userStore.signIn({
      userAccount: loginForm.username.trim(),
      passWord: loginForm.password,
      captcha: captchaOnOff.value ? loginForm.code : undefined,
      captchaId: captchaOnOff.value ? loginForm.uuid : undefined
    })
    if (result.mfaRequired) await router.push({ name: 'Mfa', query: { redirect: redirect.value } })
    else await router.push(redirect.value)
  } catch {
    loginForm.code = ''
    if (captchaOnOff.value) await loadCaptcha()
  } finally {
    loading.value = false
  }
}

async function handleLdap() {
  if (!(await ldapFormRef.value?.validate().catch(() => false))) return
  ldapLoading.value = true
  try {
    const result = await userStore.signInWithLdap({ userAccount: ldapForm.username.trim(), passWord: ldapForm.password })
    if (result === 'bind') await router.push({ name: 'BindExternal' })
    else if (result === 'mfa') await router.push({ name: 'Mfa', query: { redirect: redirect.value } })
    else await router.push(redirect.value)
  } finally {
    ldapLoading.value = false
  }
}

async function sendEmailCode() {
  const valid = await registerFormRef.value
    ?.validateField('userEmail')
    .then(() => true)
    .catch(() => false)
  if (!valid || cooldown.value > 0) return
  await getEmailCode(registerForm.userEmail)
  ElMessage.success(t('auth.register.codeSent'))
  cooldown.value = 30
  cooldownTimer = window.setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && cooldownTimer) window.clearInterval(cooldownTimer)
  }, 1000)
}

async function handleRegister() {
  if (!(await registerFormRef.value?.validate().catch(() => false))) return
  registerLoading.value = true
  try {
    const { data } = await register(registerForm)
    ElMessage.success(t('auth.register.success', { password: data }))
    loginForm.username = registerForm.userAccount
    window.setTimeout(() => showMode('login'), 1200)
  } finally {
    registerLoading.value = false
  }
}

function redirectOauth(providerCode: string) {
  const oauthUrl = oauthUrls.value[providerCode]
  if (!oauthUrl) return void ElMessage.info(t('auth.login.oauthUnavailable'))
  const state = new URL(oauthUrl).searchParams.get('state')
  if (!state) return void ElMessage.error(t('auth.oauth.invalidState'))
  externalAuthStorage.setOAuthState(providerCode, state)
  window.location.assign(oauthUrl)
}

onMounted(loadCaptcha)
onBeforeUnmount(() => cooldownTimer && window.clearInterval(cooldownTimer))
</script>

<template>
  <div class="register">
    <button
      class="locale-switch"
      :class="{ 'is-en': locale === 'en-US' }"
      type="button"
      :aria-label="t('common.language')"
      @click="toggleLocale"
    >
      <span class="locale-switch__track"><span class="locale-switch__thumb" /></span>
      <span class="locale-switch__text">{{ locale === 'zh-CN' ? 'EN' : '中' }}</span>
    </button>
    <div class="flip-scene">
      <div class="flip-card" :class="{ 'is-flipped': mode !== 'login' }">
        <div class="flip-face flip-front register-form">
          <div class="brand">
            <div class="brand-logo"><svg-icon icon-class="link" /></div>
            <h3 class="title">{{ t('common.appName') }}</h3>
          </div>
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" :validate-on-rule-change="false" @keyup.enter="handleLogin">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" autocomplete="username" :placeholder="t('auth.login.account')">
                <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                :type="pwdShow ? 'text' : 'password'"
                autocomplete="current-password"
                :placeholder="t('auth.login.password')"
              >
                <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
                <template #suffix>
                  <svg-icon
                    :icon-class="pwdShow ? 'eye-open' : 'eye-close'"
                    class="pwd-toggle"
                    @click="pwdShow = !pwdShow"
                  />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="captchaOnOff" prop="code">
              <div class="code-row">
                <el-input v-model="loginForm.code" autocomplete="off" :placeholder="t('auth.login.captcha')">
                  <template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template>
                </el-input>
                <button class="login-code" type="button" @click="loadCaptcha">
                  <img v-if="codeUrl" :src="codeUrl" :alt="t('auth.login.captcha')" />
                </button>
              </div>
            </el-form-item>
            <div class="row-between">
              <el-checkbox v-model="loginForm.rememberMe">{{ t('auth.login.remember') }}</el-checkbox>
              <a class="link-type forget" @click="ElMessage.info(t('auth.login.forgotTip'))">
                {{ t('auth.login.forgot') }}
              </a>
            </div>
            <el-button :loading="loading" type="primary" class="primary-button" @click="handleLogin">
              {{ loading ? t('auth.login.submitting') : t('auth.login.submit') }}
            </el-button>
            <div class="other-login">
              <div class="other-login-divider">
                <span>{{ t('auth.login.otherMethods') }}</span>
              </div>
              <div class="other-login-icons">
                <span class="oauth-icon" @click="redirectOauth('gitlab')"><svg-icon icon-class="gitlab" /></span>
                <span class="oauth-icon" @click="redirectOauth('github')">
                  <svg-icon icon-class="github" />
                </span>
                <span class="oauth-icon" title="QQ" @click="redirectOauth('qq')">
                  <svg-icon icon-class="qq" />
                </span>
                <span class="oauth-icon" @click="redirectOauth('wechat')">
                  <svg-icon icon-class="wechat" />
                </span>
                <span class="oauth-icon" title="Bilibili" @click="redirectOauth('bilibili')">
                  <svg-icon icon-class="bilibili" />
                </span>
              </div>
            </div>
            <div class="link-row">
              <a v-if="registerOnOff" class="link-type" @click="showMode('register')">
                {{ t('auth.login.registerLink') }}
              </a>
              <a class="link-type" @click="showMode('ldap')">{{ t('auth.login.ldapLink') }}</a>
            </div>
          </el-form>
        </div>

        <div class="flip-face flip-back register-form">
          <el-form v-if="mode === 'register'" ref="registerFormRef" :model="registerForm" :rules="registerRules" :validate-on-rule-change="false">
            <div class="face-title">{{ t('auth.register.title') }}</div>
            <el-form-item prop="userAccount">
              <el-input v-model="registerForm.userAccount" :placeholder="t('auth.login.account')">
                <template #prefix><svg-icon icon-class="guide" class="input-icon" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="userName">
              <el-input v-model="registerForm.userName" :placeholder="t('auth.register.nickname')">
                <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="userEmail">
              <el-input v-model="registerForm.userEmail" :placeholder="t('auth.register.email')">
                <template #prefix><svg-icon icon-class="email" class="input-icon" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="captcha">
              <div class="code-row">
                <el-input v-model="registerForm.captcha" :placeholder="t('auth.login.captcha')">
                  <template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template>
                </el-input>
                <el-button class="email-code" :disabled="cooldown > 0" @click="sendEmailCode">
                  {{ cooldown > 0 ? `${cooldown}s` : t('auth.register.sendCode') }}
                </el-button>
              </div>
            </el-form-item>
            <el-button :loading="registerLoading" type="primary" class="primary-button" @click="handleRegister">
              {{ registerLoading ? t('auth.register.submitting') : t('auth.register.submit') }}
            </el-button>
            <div class="link-row">
              <a class="link-type" @click="showMode('login')">{{ t('auth.login.systemLink') }}</a>
            </div>
          </el-form>
          <el-form v-else ref="ldapFormRef" :model="ldapForm" :rules="ldapRules" :validate-on-rule-change="false" @keyup.enter="handleLdap">
            <div class="face-title">{{ t('auth.ldap.title') }}</div>
            <el-form-item prop="username">
              <el-input v-model="ldapForm.username" :placeholder="t('auth.ldap.account')">
                <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="ldapForm.password"
                :type="ldapPwdShow ? 'text' : 'password'"
                :placeholder="t('auth.login.password')"
              >
                <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
                <template #suffix>
                  <svg-icon
                    :icon-class="ldapPwdShow ? 'eye-open' : 'eye-close'"
                    class="pwd-toggle"
                    @click="ldapPwdShow = !ldapPwdShow"
                  />
                </template>
              </el-input>
            </el-form-item>
            <el-button :loading="ldapLoading" type="primary" class="primary-button" @click="handleLdap">
              {{ ldapLoading ? t('auth.login.submitting') : t('auth.login.submit') }}
            </el-button>
            <div class="link-row">
              <a class="link-type" @click="showMode('login')">{{ t('auth.login.systemLink') }}</a>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    <div class="el-register-footer">{{ version }} Copyright ©2017-{{ year }} Cowave All Rights Reserved.</div>
  </div>
</template>

<style scoped lang="scss">
.register {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('@/assets/images/login-open.jpg') center/cover no-repeat;
}
.locale-switch {
  position: fixed;
  top: 24px;
  right: 28px;
  z-index: 2;
  width: 70px;
  height: 24px;
  padding: 0 7px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: rgba(20, 45, 72, 0.32);
  cursor: pointer;
}
.locale-switch__track {
  position: relative;
  flex: none;
  width: 40px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
}
.locale-switch__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.25s;
}
.locale-switch.is-en .locale-switch__thumb {
  transform: translateX(16px);
}
.locale-switch__text {
  width: 18px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
}
.flip-scene {
  perspective: 1200px;
  width: 420px;
}
.flip-card {
  display: grid;
  width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.flip-card.is-flipped {
  transform: rotateY(180deg);
}
.flip-face {
  grid-area: 1/1;
  backface-visibility: hidden;
}
.flip-back {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.register-form {
  width: 100%;
  min-height: 510px;
  padding: 36px 36px 20px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 48px rgba(21, 42, 66, 0.18);
}
.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
}
.brand-logo {
  flex: none;
  width: 56px;
  height: 56px;
  margin-left: -72px;
  margin-right: 16px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 28px;
  background: linear-gradient(135deg, #4c90e0, #317ad5);
  box-shadow: 0 8px 20px rgba(49, 122, 213, 0.35);
}
.title {
  margin: 0;
  color: #1e3a5f;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}
.face-title {
  margin: 8px 0 30px;
  text-align: center;
  color: #1e3a5f;
  font-size: 22px;
  font-weight: 600;
}
:deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 8px;
  background: #f5f8fc;
  box-shadow: 0 0 0 1px #dde6f0 inset;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #4c90e0 inset;
}
.input-icon {
  width: 16px;
  height: 16px;
  margin-left: 2px;
  color: #7d93ac;
}
.pwd-toggle {
  width: 16px;
  height: 16px;
  color: #7d93ac;
  cursor: pointer;
}
.code-row {
  display: grid;
  grid-template-columns: 1fr 112px;
  gap: 10px;
  width: 100%;
}
.login-code {
  height: 42px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: #edf3f9;
  cursor: pointer;
}
.login-code img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.email-code {
  height: 42px;
  white-space: nowrap;
  padding: 0 10px;
  font-size: 13px;
}
.row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 18px;
}
.primary-button {
  width: 100%;
  white-space: nowrap;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(90deg, #4c90e0, #317ad5);
  box-shadow: 0 8px 18px rgba(49, 122, 213, 0.35);
}
.other-login {
  margin-top: 6px;
}
.other-login-divider {
  position: relative;
  margin: 16px 0;
  text-align: center;
  color: #9fb0c3;
  font-size: 12px;
}
.other-login-divider span {
  position: relative;
  z-index: 1;
  padding: 0 12px;
  white-space: nowrap;
  background: #fff;
}
.other-login-divider:before,
.other-login-divider:after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e4eaf2;
}
.other-login-divider:before {
  left: 0;
}
.other-login-divider:after {
  right: 0;
}
.other-login-icons {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}
.oauth-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #7d93ac;
  font-size: 22px;
  background: #f5f8fc;
  cursor: pointer;
  transition: 0.3s;
}
.oauth-icon:hover {
  color: #4c90e0;
  background: #eaf2fb;
  box-shadow: 0 4px 12px rgba(49, 122, 213, 0.25);
}
.link-row {
  margin: 18px 0 6px;
  text-align: center;
  white-space: nowrap;
}
.link-type {
  margin: 0 10px;
  color: #4c90e0;
  font-size: 13px;
  cursor: pointer;
}
.link-type:hover {
  color: #317ad5;
}
.forget {
  font-size: 14px;
  font-weight: 500;
}
.el-register-footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  text-align: center;
  color: #fff;
  font: 12px Arial;
  letter-spacing: 1px;
}
@media (max-width: 520px) {
  .register {
    padding: 20px;
  }
  .flip-scene {
    width: 100%;
    max-width: 380px;
  }
  .register-form {
    padding: 30px 24px 18px;
  }
  .brand-logo {
    margin-left: 0;
  }
}
</style>
