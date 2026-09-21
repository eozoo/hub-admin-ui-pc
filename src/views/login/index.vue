<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getCaptcha, getEmailCode, register } from '@/api/auth'
import { useUserStore } from '@/stores/modules/user'
import { preferenceStorage } from '@/utils/storage'

type Mode = 'login' | 'register' | 'ldap'
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
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
const gitlabUrl = ref('')
const pwdShow = ref(false)
const ldapPwdShow = ref(false)
const cooldown = ref(0)
let cooldownTimer: number | undefined
const version = import.meta.env.VITE_APP_VERSION
const year = new Date().getFullYear()

const redirect = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : '/')
const loginForm = reactive({ username: preferenceStorage.getRememberedAccount(), password: '', rememberMe: Boolean(preferenceStorage.getRememberedAccount()), code: '', uuid: '' })
const registerForm = reactive({ userAccount: '', userName: '', userEmail: '', captcha: '' })
const ldapForm = reactive({ username: '', password: '' })
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const registerRules: FormRules = {
  userAccount: [{ required: true, message: '请输入账号', trigger: 'blur' }, { min: 3, max: 20, message: '账号长度必须介于 3 和 20 之间', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  userEmail: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const ldapRules: FormRules = {
  username: [{ required: true, message: '请输入域账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function loadCaptcha() {
  try {
    const { data } = await getCaptcha()
    codeUrl.value = data.img ? `data:image/jpeg;base64,${data.img}` : ''
    loginForm.uuid = data.uuid
    captchaOnOff.value = data.captchaOnOff
    registerOnOff.value = data.registerOnOff
    gitlabUrl.value = data.oauthGitlabUrl ?? ''
  } catch { codeUrl.value = '' }
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
    const result = await userStore.signIn({ userAccount: loginForm.username.trim(), passWord: loginForm.password, captcha: captchaOnOff.value ? loginForm.code : undefined, captchaId: captchaOnOff.value ? loginForm.uuid : undefined })
    if (result.mfaRequired) await router.push({ name: 'Mfa', query: { redirect: redirect.value } })
    else await router.push(redirect.value)
  } catch {
    loginForm.code = ''
    if (captchaOnOff.value) await loadCaptcha()
  } finally { loading.value = false }
}

async function handleLdap() {
  if (!(await ldapFormRef.value?.validate().catch(() => false))) return
  ldapLoading.value = true
  try {
    await userStore.signInWithLdap({ userAccount: ldapForm.username.trim(), passWord: ldapForm.password })
    await router.push(redirect.value)
  } finally { ldapLoading.value = false }
}

async function sendEmailCode() {
  const valid = await registerFormRef.value?.validateField('userEmail').then(() => true).catch(() => false)
  if (!valid || cooldown.value > 0) return
  await getEmailCode(registerForm.userEmail)
  ElMessage.success('验证码已发送至邮箱')
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
    ElMessage.success(`注册成功，初始密码为：${data}`)
    loginForm.username = registerForm.userAccount
    window.setTimeout(() => showMode('login'), 1200)
  } finally { registerLoading.value = false }
}

function redirectGitlab() {
  if (gitlabUrl.value) window.location.assign(gitlabUrl.value)
  else ElMessage.info('当前环境未配置 GitLab 登录')
}

onMounted(loadCaptcha)
onBeforeUnmount(() => cooldownTimer && window.clearInterval(cooldownTimer))
</script>

<template>
  <div class="register">
    <div class="flip-scene">
      <div class="flip-card" :class="{ 'is-flipped': mode !== 'login' }">
        <div class="flip-face flip-front register-form">
          <div class="brand">
            <div class="brand-logo"><svg-icon icon-class="link" /></div>
            <h3 class="title">Hub 管理系统</h3>
          </div>
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @keyup.enter="handleLogin">
            <el-form-item prop="username"><el-input v-model="loginForm.username" autocomplete="username" placeholder="账号"><template #prefix><svg-icon icon-class="user" class="input-icon" /></template></el-input></el-form-item>
            <el-form-item prop="password"><el-input v-model="loginForm.password" :type="pwdShow ? 'text' : 'password'" autocomplete="current-password" placeholder="密码"><template #prefix><svg-icon icon-class="password" class="input-icon" /></template><template #suffix><svg-icon :icon-class="pwdShow ? 'eye-open' : 'eye-close'" class="pwd-toggle" @click="pwdShow = !pwdShow" /></template></el-input></el-form-item>
            <el-form-item v-if="captchaOnOff" prop="code"><div class="code-row"><el-input v-model="loginForm.code" autocomplete="off" placeholder="验证码"><template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template></el-input><button class="login-code" type="button" @click="loadCaptcha"><img v-if="codeUrl" :src="codeUrl" alt="验证码" /></button></div></el-form-item>
            <div class="row-between"><el-checkbox v-model="loginForm.rememberMe">记住账号</el-checkbox><a class="link-type forget" @click="ElMessage.info('暂未开放')">忘记密码？</a></div>
            <el-button :loading="loading" type="primary" class="primary-button" @click="handleLogin">{{ loading ? '登 录 中...' : '登 录' }}</el-button>
            <div class="other-login"><div class="other-login-divider"><span>其它方式登录</span></div><div class="other-login-icons"><span class="oauth-icon" @click="redirectGitlab"><svg-icon icon-class="gitlab" /></span><span class="oauth-icon" @click="ElMessage.info('暂未开放')"><svg-icon icon-class="github" /></span><span class="oauth-icon" @click="ElMessage.info('暂未开放')"><svg-icon icon-class="dingding" /></span><span class="oauth-icon" @click="ElMessage.info('暂未开放')"><svg-icon icon-class="wechat" /></span></div></div>
            <div class="link-row"><a v-if="registerOnOff" class="link-type" @click="showMode('register')">注册账号</a><a class="link-type" @click="showMode('ldap')">域账号登录</a></div>
          </el-form>
        </div>

        <div class="flip-face flip-back register-form">
          <el-form v-if="mode === 'register'" ref="registerFormRef" :model="registerForm" :rules="registerRules">
            <div class="face-title">注册账号</div>
            <el-form-item prop="userAccount"><el-input v-model="registerForm.userAccount" placeholder="账号"><template #prefix><svg-icon icon-class="guide" class="input-icon" /></template></el-input></el-form-item>
            <el-form-item prop="userName"><el-input v-model="registerForm.userName" placeholder="昵称"><template #prefix><svg-icon icon-class="user" class="input-icon" /></template></el-input></el-form-item>
            <el-form-item prop="userEmail"><el-input v-model="registerForm.userEmail" placeholder="邮箱"><template #prefix><svg-icon icon-class="email" class="input-icon" /></template></el-input></el-form-item>
            <el-form-item prop="captcha"><div class="code-row"><el-input v-model="registerForm.captcha" placeholder="验证码"><template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template></el-input><el-button class="email-code" :disabled="cooldown > 0" @click="sendEmailCode">{{ cooldown > 0 ? `${cooldown}s` : '获取验证码' }}</el-button></div></el-form-item>
            <el-button :loading="registerLoading" type="primary" class="primary-button" @click="handleRegister">{{ registerLoading ? '注 册 中...' : '注 册' }}</el-button>
            <div class="link-row"><a class="link-type" @click="showMode('login')">系统账号登录</a></div>
          </el-form>
          <el-form v-else ref="ldapFormRef" :model="ldapForm" :rules="ldapRules" @keyup.enter="handleLdap">
            <div class="face-title">域账号登录</div>
            <el-form-item prop="username"><el-input v-model="ldapForm.username" placeholder="域账号"><template #prefix><svg-icon icon-class="user" class="input-icon" /></template></el-input></el-form-item>
            <el-form-item prop="password"><el-input v-model="ldapForm.password" :type="ldapPwdShow ? 'text' : 'password'" placeholder="密码"><template #prefix><svg-icon icon-class="password" class="input-icon" /></template><template #suffix><svg-icon :icon-class="ldapPwdShow ? 'eye-open' : 'eye-close'" class="pwd-toggle" @click="ldapPwdShow = !ldapPwdShow" /></template></el-input></el-form-item>
            <el-button :loading="ldapLoading" type="primary" class="primary-button" @click="handleLdap">{{ ldapLoading ? '登 录 中...' : '登 录' }}</el-button>
            <div class="link-row"><a class="link-type" @click="showMode('login')">系统账号登录</a></div>
          </el-form>
        </div>
      </div>
    </div>
    <div class="el-register-footer">{{ version }} Copyright ©2017-{{ year }} Cowave All Rights Reserved.</div>
  </div>
</template>

<style scoped lang="scss">
.register{display:flex;justify-content:center;align-items:center;min-height:100vh;background:url('@/assets/images/login-open.jpg') center/cover no-repeat}.flip-scene{perspective:1200px;width:380px}.flip-card{display:grid;width:100%;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,.2,.2,1)}.flip-card.is-flipped{transform:rotateY(180deg)}.flip-face{grid-area:1/1;backface-visibility:hidden}.flip-back{transform:rotateY(180deg);display:flex;flex-direction:column;justify-content:center}.register-form{width:100%;min-height:510px;padding:36px 36px 20px;border-radius:16px;background:#fff;box-shadow:0 16px 48px rgba(21,42,66,.18)}.brand{display:flex;align-items:center;justify-content:center;margin-bottom:30px}.brand-logo{flex:none;width:56px;height:56px;margin-left:-72px;margin-right:16px;display:grid;place-items:center;border-radius:50%;color:#fff;font-size:28px;background:linear-gradient(135deg,#4c90e0,#317ad5);box-shadow:0 8px 20px rgba(49,122,213,.35)}.title{margin:0;color:#1e3a5f;font-size:24px;font-weight:600;letter-spacing:1px}.face-title{margin:8px 0 30px;text-align:center;color:#1e3a5f;font-size:22px;font-weight:600}:deep(.el-input__wrapper){min-height:42px;border-radius:8px;background:#f5f8fc;box-shadow:0 0 0 1px #dde6f0 inset}:deep(.el-input__wrapper.is-focus){box-shadow:0 0 0 1px #4c90e0 inset}.input-icon{width:16px;height:16px;margin-left:2px;color:#7d93ac}.pwd-toggle{width:16px;height:16px;color:#7d93ac;cursor:pointer}.code-row{display:grid;grid-template-columns:1fr 112px;gap:10px;width:100%}.login-code{height:42px;padding:0;overflow:hidden;border:0;border-radius:8px;background:#edf3f9;cursor:pointer}.login-code img{display:block;width:100%;height:100%;object-fit:cover}.email-code{height:42px;padding:0 10px;font-size:13px}.row-between{display:flex;justify-content:space-between;align-items:center;margin:0 0 18px}.primary-button{width:100%;height:42px;border:0;border-radius:8px;background:linear-gradient(90deg,#4c90e0,#317ad5);box-shadow:0 8px 18px rgba(49,122,213,.35)}.other-login{margin-top:6px}.other-login-divider{position:relative;margin:16px 0;text-align:center;color:#9fb0c3;font-size:12px}.other-login-divider:before,.other-login-divider:after{content:'';position:absolute;top:50%;width:40%;height:1px;background:#e4eaf2}.other-login-divider:before{left:0}.other-login-divider:after{right:0}.other-login-icons{display:flex;justify-content:center;gap:24px;margin-bottom:16px}.oauth-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;color:#7d93ac;font-size:22px;background:#f5f8fc;cursor:pointer;transition:.3s}.oauth-icon:hover{color:#4c90e0;background:#eaf2fb;box-shadow:0 4px 12px rgba(49,122,213,.25)}.link-row{margin:18px 0 6px;text-align:center}.link-type{margin:0 10px;color:#4c90e0;font-size:13px;cursor:pointer}.link-type:hover{color:#317ad5}.forget{font-size:14px;font-weight:500}.el-register-footer{position:fixed;bottom:0;width:100%;height:40px;line-height:40px;text-align:center;color:#fff;font:12px Arial;letter-spacing:1px}@media(max-width:520px){.register{padding:20px}.flip-scene{width:100%;max-width:380px}.register-form{padding:30px 24px 18px}.brand-logo{margin-left:0}}
</style>
