<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Calendar, Message, OfficeBuilding, Phone, User, UserFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/modules/auth'
import { disableMfa, enableMfa, getMfa, getUserProfile, resetPassword, updateUserProfile, uploadAvatar } from '@/api/auth/profile'
import type { MfaInfo, ProfileUpdate, UserProfile } from '@/api/auth/profile'
import MfaQrcode from './MfaQrcode.vue'
import ProfileSectionNav from './ProfileSectionNav.vue'

const { t, te } = useI18n()
const authStore = useAuthStore()
const profile = ref<UserProfile | null>(null)
const loading = ref(false)
const saving = ref(false)
const avatarUploading = ref(false)
const activeTab = ref('basic')
const profileForm = ref<FormInstance>()
const passwordForm = ref<FormInstance>()
const edit = reactive<ProfileUpdate>({ userName: '', userSex: null, userPhone: '', userEmail: '' })
const password = reactive({ oldPasswd: '', newPasswd: '', confirmPasswd: '' })
const mfa = reactive<MfaInfo & { mfaCode: string }>({ enabled: false, mfaUrl: null, mfaKey: null, mfaCode: '' })
const canEdit = computed(() => profile.value !== null)
const tenantName = computed(() => {
  const title = profile.value?.tenantName || authStore.profile?.tenantTitle || ''
  return title && te(title) ? t(title) : title
})
const rules: FormRules = {
  userName: [{ required: true, whitespace: true, message: t('common.profile.nameRequired'), trigger: 'blur' }],
  userEmail: [{ type: 'email', message: t('common.profile.emailInvalid'), trigger: 'blur' }],
  userPhone: [{ pattern: /^1[3-9]\d{9}$/, message: t('common.profile.phoneInvalid'), trigger: 'blur' }]
}
const passwordRules: FormRules = {
  oldPasswd: [{ required: true, message: t('common.profile.oldPasswordRequired'), trigger: 'blur' }],
  newPasswd: [{ required: true, min: 6, max: 20, message: t('common.profile.passwordLength'), trigger: 'blur' }],
  confirmPasswd: [{ validator: (_rule, value: string, callback: (error?: Error) => void) =>
    callback(value === password.newPasswd && value ? undefined : new Error(t('common.profile.passwordMismatch'))), trigger: 'blur' }]
}

async function loadProfile() {
  loading.value = true
  try {
    const { data } = await getUserProfile()
    profile.value = data
    Object.assign(edit, {
      userName: data.userName || '', userSex: data.userSex,
      userPhone: data.userPhone || '', userEmail: data.userEmail || ''
    })
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  if (!await profileForm.value?.validate()) return
  saving.value = true
  try {
    await updateUserProfile(edit)
    await loadProfile()
    await authStore.loadProfile()
    ElMessage.success(t('common.profile.saved'))
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!await passwordForm.value?.validate()) return
  saving.value = true
  try {
    await resetPassword({ oldPasswd: password.oldPasswd, newPasswd: password.newPasswd })
    passwordForm.value?.resetFields()
    ElMessage.success(t('common.profile.passwordChanged'))
  } finally {
    saving.value = false
  }
}

async function loadMfa() {
  const { data } = await getMfa()
  Object.assign(mfa, { mfaUrl: null, mfaKey: null }, data, { mfaCode: '' })
}

async function changeMfa() {
  if (!mfa.mfaCode.trim()) return void ElMessage.warning(t('common.profile.mfaCodeRequired'))
  saving.value = true
  try {
    if (!mfa.enabled) {
      if (!mfa.mfaKey) return
      await enableMfa({ mfaKey: mfa.mfaKey, mfaCode: mfa.mfaCode.trim() })
    } else {
      await disableMfa({ mfaCode: mfa.mfaCode.trim() })
    }
    await loadMfa()
    ElMessage.success(t('common.profile.saved'))
  } finally {
    saving.value = false
  }
}

function onTabChange(name: string | number) {
  if (name === 'mfa') void loadMfa()
}

const upload: UploadProps['httpRequest'] = async (options) => {
  if (!profile.value) return
  avatarUploading.value = true
  try {
    const data = new FormData()
    data.append('file', options.file)
    data.append('ownerId', profile.value.userAccount)
    data.append('ownerModule', 'module_user')
    data.append('attachType', 'avatar')
    data.append('isPublic', '1')
    const response = await uploadAvatar(data)
    profile.value.avatar = response.data.viewUrl
    await authStore.loadProfile()
    ElMessage.success(t('common.profile.saved'))
  } finally {
    avatarUploading.value = false
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.error(t('common.profile.imageOnly'))
  return false
}

onMounted(() => { void loadProfile() })
</script>

<template>
  <div class="profile-page" v-loading="loading">
    <ProfileSectionNav />
    <el-row :gutter="20">
      <el-col :span="9" :xs="24">
        <el-card class="profile-card" shadow="never">
          <template #header>{{ t('common.profile.title') }}</template>
          <div class="avatar-section">
            <div class="profile-avatar">
              <img v-if="profile?.avatar" :src="profile.avatar" :alt="profile.userName" />
              <el-icon v-else><User /></el-icon>
            </div>
            <el-upload v-if="canEdit" class="avatar-upload" :show-file-list="false" :http-request="upload" :before-upload="beforeUpload" accept="image/*">
              <el-button text type="primary" :loading="avatarUploading">{{ t('common.profile.changeAvatar') }}</el-button>
            </el-upload>
          </div>
          <ul class="profile-list">
            <li><span><el-icon><User /></el-icon>{{ t('common.profile.name') }}</span><strong>{{ profile?.userName || '-' }}</strong></li>
            <li><span><el-icon><UserFilled /></el-icon>{{ t('common.profile.account') }}</span><strong>{{ profile?.userAccount || '-' }}</strong></li>
            <li><span><el-icon><Phone /></el-icon>{{ t('common.profile.phone') }}</span><strong>{{ profile?.userPhone || '-' }}</strong></li>
            <li><span><el-icon><Message /></el-icon>{{ t('common.profile.email') }}</span><strong>{{ profile?.userEmail || '-' }}</strong></li>
            <li><span><el-icon><OfficeBuilding /></el-icon>{{ t('common.profile.tenant') }}</span><strong>{{ tenantName || '-' }}</strong></li>
            <li><span><el-icon><UserFilled /></el-icon>{{ t('common.profile.roles') }}</span><strong>{{ profile?.roles?.join('、') || '-' }}</strong></li>
            <li><span><el-icon><OfficeBuilding /></el-icon>{{ t('common.profile.depts') }}</span><strong>{{ profile?.depts?.join('、') || '-' }}</strong></li>
            <li><span><el-icon><User /></el-icon>{{ t('common.profile.parents') }}</span><strong>{{ profile?.parents?.join('、') || '-' }}</strong></li>
            <li><span><el-icon><Calendar /></el-icon>{{ t('common.profile.created') }}</span><strong>{{ profile?.createTime || '-' }}</strong></li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="15" :xs="24">
        <el-card shadow="never">
          <template #header>{{ t('common.profile.edit') }}</template>
          <el-tabs v-model="activeTab" @tab-change="onTabChange">
            <el-tab-pane :label="t('common.profile.basic')" name="basic">
              <el-form ref="profileForm" :model="edit" :rules="rules" label-width="100px" :disabled="!canEdit">
                <el-form-item :label="t('common.profile.name')" prop="userName"><el-input v-model="edit.userName" maxlength="30" /></el-form-item>
                <el-form-item :label="t('common.profile.phone')" prop="userPhone"><el-input v-model="edit.userPhone" maxlength="11" /></el-form-item>
                <el-form-item :label="t('common.profile.email')" prop="userEmail"><el-input v-model="edit.userEmail" maxlength="50" /></el-form-item>
                <el-form-item :label="t('common.profile.sex')"><el-radio-group v-model="edit.userSex"><el-radio :value="0">{{ t('common.profile.male') }}</el-radio><el-radio :value="1">{{ t('common.profile.female') }}</el-radio><el-radio :value="2">{{ t('common.profile.unknown') }}</el-radio></el-radio-group></el-form-item>
                <el-form-item v-if="canEdit"><el-button type="primary" :loading="saving" @click="saveProfile">{{ t('common.profile.save') }}</el-button></el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane v-if="canEdit" :label="t('common.profile.password')" name="password">
              <el-form ref="passwordForm" :model="password" :rules="passwordRules" label-width="130px">
                <el-form-item :label="t('common.profile.oldPassword')" prop="oldPasswd"><el-input v-model="password.oldPasswd" type="password" show-password /></el-form-item>
                <el-form-item :label="t('common.profile.newPassword')" prop="newPasswd"><el-input v-model="password.newPasswd" type="password" show-password /></el-form-item>
                <el-form-item :label="t('common.profile.confirmPassword')" prop="confirmPasswd"><el-input v-model="password.confirmPasswd" type="password" show-password /></el-form-item>
                <el-form-item><el-button type="primary" :loading="saving" @click="changePassword">{{ t('common.profile.save') }}</el-button></el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane v-if="canEdit" :label="t('common.profile.mfa')" name="mfa">
              <div class="mfa-content">
                <p class="mfa-help">{{ t(mfa.enabled ? 'common.profile.mfaEnabled' : 'common.profile.mfaSetup') }}</p>
                <div v-if="mfa.mfaUrl" class="mfa-setup">
                  <MfaQrcode :otp-auth-url="mfa.mfaUrl" />
                  <el-input :model-value="mfa.mfaKey" readonly class="mfa-key" />
                </div>
                <el-form class="mfa-form" label-position="top">
                  <el-form-item :label="t('common.profile.mfaCode')"><el-input v-model="mfa.mfaCode" maxlength="8" /></el-form-item>
                  <el-form-item class="mfa-action"><el-button :type="mfa.enabled ? 'danger' : 'primary'" :loading="saving" @click="changeMfa">{{ t(mfa.enabled ? 'common.profile.disableMfa' : 'common.profile.enableMfa') }}</el-button></el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.profile-page { width: 100%; }
.profile-page :deep(.el-card__header) { padding: 16px 20px; }
.profile-page :deep(.el-card__body) { padding: 20px; }
.profile-page :deep(.el-tabs__content) { padding-top: 12px; }
.profile-card { margin-bottom: 20px; }
.avatar-section { display: flex; align-items: center; flex-direction: column; margin-bottom: 12px; }
.profile-avatar { display: grid; width: 96px; height: 96px; margin: 4px auto 0; overflow: hidden; place-items: center; border-radius: 50%; background: var(--el-color-primary-light-9); color: var(--app-primary); font-size: 40px; }
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-upload { margin-top: 4px; text-align: center; }
.profile-list { margin: 0; padding: 0; list-style: none; }
.profile-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 43px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); font-size: 13px; }
.profile-list li > span { display: inline-flex; flex: none; align-items: center; gap: 7px; color: var(--app-text-secondary); }
.profile-list strong { min-width: 0; overflow-wrap: anywhere; text-align: right; font-weight: 500; }
.mfa-content { width: min(100%, 420px); padding: 0 12px; }
.mfa-help { margin: 10px 0 16px; color: var(--app-text-muted); }
.mfa-setup { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
.mfa-key { width: 100%; }
@media (max-width: 720px) { .profile-page :deep(.el-card__body) { padding: 16px; } }
</style>
