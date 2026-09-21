<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Check, Link } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import ProfileSectionNav from '@/views/auth/profile/ProfileSectionNav.vue'
import { authorizeIdentityBinding, bindLdapIdentity, getIdentityBindings, type IdentityBinding } from '@/api/auth/binding'
import { externalAuthStorage } from '@/utils/storage'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const selected = ref('gitlab')
const loading = ref(true)
const loadFailed = ref(false)
const authorizing = ref(false)
const bindings = ref<IdentityBinding[]>([])
const current = computed(() => bindings.value.find(binding => binding.providerCode === selected.value))
const canBind = computed(() => providers.includes(selected.value as typeof providers[number]) && current.value?.status === 1)
const providers = ['gitlab', 'github', 'wechat', 'qq', 'bilibili', 'ldap'] as const
const currentName = computed(() => t(`common.binding.${selected.value}`))
const ldapVisible = ref(false)
const ldapForm = ref<FormInstance>()
const ldapCredentials = reactive({ userAccount: '', passWord: '' })
const ldapRules: FormRules = {
  userAccount: [{ required: true, whitespace: true, message: t('common.binding.accountRequired'), trigger: 'blur' }],
  passWord: [{ required: true, message: t('common.binding.passwordRequired'), trigger: 'blur' }]
}

async function submitLdap() {
  if (!await ldapForm.value?.validate()) return
  if (authorizing.value || !canBind.value) return
  authorizing.value = true
  try {
    await bindLdapIdentity({ ...ldapCredentials })
    ldapVisible.value = false
    await load()
    ElMessage.success(t('common.binding.success'))
  } finally {
    ldapCredentials.passWord = ''
    authorizing.value = false
  }
}

function resetLdapForm() {
  ldapCredentials.userAccount = ''
  ldapCredentials.passWord = ''
  ldapForm.value?.clearValidate()
}

async function load() {
  loading.value = true
  loadFailed.value = false
  try {
    const { data } = await getIdentityBindings()
    bindings.value = data ?? []
  } catch {
    bindings.value = []
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

async function bindIdentity() {
  if (!canBind.value || loading.value || loadFailed.value) return
  if (selected.value === 'ldap') {
    resetLdapForm()
    ldapVisible.value = true
    return
  }
  authorizing.value = true
  try {
    const { data: url } = await authorizeIdentityBinding(selected.value)
    const target = new URL(url)
    const state = target.searchParams.get('state')
    if (!state || !/^https?:$/.test(target.protocol)) throw new Error('Invalid OAuth authorization URL')
    externalAuthStorage.setAccountBindingState(selected.value, state)
    window.location.assign(target.href)
  } catch {
    ElMessage.error(t('common.binding.startFailed'))
    authorizing.value = false
  }
}

onMounted(async () => {
  await load()
  if (!loadFailed.value && providers.includes(route.query.bound as typeof providers[number])) {
    selected.value = String(route.query.bound)
    ElMessage.success(t('common.binding.success'))
    await router.replace({ name: 'AccountBinding' })
  }
})
</script>

<template>
  <div class="binding-page">
    <ProfileSectionNav />
    <el-card class="binding-card" shadow="never" v-loading="loading">
      <div class="binding-layout">
        <nav class="provider-nav" :aria-label="t('common.binding.title')">
          <button v-for="provider in providers" :key="provider" type="button"
            class="provider-item" :class="{ active: selected === provider }" @click="selected = provider">
            <span class="provider-name">
              <svg-icon class="provider-nav-icon" :icon-class="provider" />
              {{ t(`common.binding.${provider}`) }}
            </span>
            <span v-if="!loading && !loadFailed && bindings.some(binding => binding.providerCode === provider && binding.bound)" class="binding-badge">
              <el-icon><Check /></el-icon>
              {{ t('common.binding.bound') }}
            </span>
            <span v-else-if="!loading && !loadFailed" class="binding-badge binding-badge-unbound">
              {{ t('common.binding.unbound') }}
            </span>
          </button>
        </nav>
        <section class="binding-content">
          <div class="content-heading">
            <div class="provider-icon"><svg-icon :icon-class="selected" /></div>
            <div>
              <h2>{{ currentName }}</h2>
              <el-tag v-if="!loading && !loadFailed && current?.status !== 1" size="small" type="info" class="status-tag">{{ t('common.binding.disabled') }}</el-tag>
            </div>
          </div>
          <div v-if="loadFailed" class="empty-state">
            <p>{{ t('common.binding.loadFailed') }}</p>
            <el-button @click="load">{{ t('common.action.refresh') }}</el-button>
          </div>
          <template v-else-if="!loading && current?.bound">
            <div class="identity-summary">
              <el-avatar :size="48" :src="current.userAvatar || undefined">{{ (current.userName || current.userAccount || 'G').charAt(0) }}</el-avatar>
              <div><strong>{{ current.userName || current.userAccount }}</strong><span>@{{ current.userAccount }}</span></div>
            </div>
            <el-descriptions :column="1" class="identity-details" label-width="110px">
              <el-descriptions-item :label="t('common.binding.externalAccount')">{{ current.userAccount || '—' }}</el-descriptions-item>
              <el-descriptions-item :label="t('common.binding.name')">{{ current.userName || '—' }}</el-descriptions-item>
              <el-descriptions-item :label="t('common.binding.email')">{{ current.userEmail || '—' }}</el-descriptions-item>
              <el-descriptions-item :label="t('common.binding.boundAt')">{{ current.createTime || '—' }}</el-descriptions-item>
            </el-descriptions>
            <el-button class="rebind-button" :loading="authorizing" :disabled="!canBind" @click="bindIdentity">{{ t('common.binding.rebind') }}</el-button>
          </template>
          <div v-else-if="!loading" class="empty-state">
            <el-icon class="empty-icon"><Link /></el-icon>
            <p>{{ t('common.binding.gitlabUnbound', { provider: currentName }) }}</p>
            <el-button type="primary" :loading="authorizing" :disabled="!canBind" @click="bindIdentity">{{ t('common.binding.bindNow') }}</el-button>
          </div>
        </section>
      </div>
    </el-card>
    <el-dialog v-model="ldapVisible" :title="t('common.binding.ldapTitle')" width="420px" :close-on-click-modal="false" :close-on-press-escape="!authorizing" :show-close="!authorizing" @closed="resetLdapForm">
      <p class="ldap-help">{{ t('common.binding.ldapHelp') }}</p>
      <el-form ref="ldapForm" :model="ldapCredentials" :rules="ldapRules" label-position="top" @submit.prevent="submitLdap">
        <el-form-item :label="t('common.binding.externalAccount')" prop="userAccount"><el-input v-model="ldapCredentials.userAccount" autocomplete="username" :disabled="authorizing" /></el-form-item>
        <el-form-item :label="t('common.binding.password')" prop="passWord"><el-input v-model="ldapCredentials.passWord" type="password" show-password autocomplete="current-password" :disabled="authorizing" @keyup.enter="submitLdap" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="authorizing" @click="ldapVisible = false">{{ t('common.binding.cancel') }}</el-button>
        <el-button type="primary" :loading="authorizing" @click="submitLdap">{{ t('common.binding.bindNow') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.binding-page { width: 100%; }
.binding-card { min-height: 390px; }
.binding-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); min-height: 340px; }
.provider-nav { display: flex; flex-direction: column; gap: 4px; padding: 8px 14px 8px 0; border-right: 1px solid var(--app-border); }
.provider-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 0 12px; border: 0; border-radius: 6px; background: transparent; color: var(--app-text-secondary); cursor: pointer; text-align: left; font-size: 14px; }
.provider-item:hover { background: var(--el-fill-color-light); color: var(--app-text); }
.provider-item.active { background: var(--el-color-primary-light-9); color: var(--app-primary); font-weight: 600; }
.provider-name { display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; }
.provider-nav-icon { flex-shrink: 0; font-size: 20px; }
.binding-content { min-width: 0; padding: 10px 28px 24px; }
.content-heading { display: flex; align-items: center; gap: 12px; padding-bottom: 22px; border-bottom: 1px solid var(--app-border); }
.provider-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 10px; background: var(--el-color-primary-light-9); color: var(--app-primary); font-size: 22px; }
.content-heading h2 { margin: 0 0 3px; font-size: 17px; font-weight: 600; }
.identity-summary span { color: var(--app-text-secondary); font-size: 13px; }
.binding-badge { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; padding: 3px 8px; border-radius: 999px; background: var(--el-color-success-light-9); color: var(--el-color-success); font-size: 11px; font-weight: 500; line-height: 16px; }
.binding-badge .el-icon { font-size: 12px; }
.binding-badge-unbound { background: var(--el-fill-color-light); color: var(--app-text-secondary); }
.ldap-help { margin: 0 0 18px; color: var(--app-text-secondary); font-size: 13px; line-height: 1.6; }
.status-tag { margin-top: 4px; }
.identity-summary { display: flex; align-items: center; gap: 12px; margin: 22px 0 20px; }
.identity-summary div { display: flex; flex-direction: column; gap: 4px; }
.identity-summary strong { font-size: 15px; }
.identity-details { max-width: 560px; }
.rebind-button { margin-top: 16px; }
.empty-state { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; min-height: 230px; gap: 16px; color: var(--app-text-secondary); }
.empty-state p { margin: 0; }
.empty-icon { color: var(--app-primary); font-size: 28px; }
@media (max-width: 680px) { .binding-layout { grid-template-columns: 1fr; } .provider-nav { flex-direction: row; flex-wrap: wrap; border-right: 0; border-bottom: 1px solid var(--app-border); padding: 0 0 12px; } .provider-item { min-width: 140px; } .binding-content { padding: 22px 4px; } }
</style>
