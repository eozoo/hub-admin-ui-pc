<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Edit, Refresh, Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/modules/auth'
import { hasPermission } from '@/utils/permission'
import TableColumnSettings from '@/components/TableColumnSettings/index.vue'
import { useTableColumns } from '@/components/TableColumnSettings/useTableColumns'
import { deleteOAuthIdentity, getOAuthConfig, getOAuthUsers, saveOAuthConfig, updateOAuthIdentityStatus } from '@/api/auth/oauth'
import type { OAuthConfig, OAuthUser } from '@/api/auth/oauth'

const { t } = useI18n()
const authStore = useAuthStore()
const providers = ['gitlab', 'github', 'wechat', 'qq', 'bilibili'] as const
type OAuthProvider = typeof providers[number]
const providerCode = ref<OAuthProvider>('gitlab')
const configProvider = ref<OAuthProvider>('gitlab')
const configLoading = ref(false)
let loadSequence = 0
const canEdit = computed(() => hasPermission(authStore.permissions, ['oauth:provider:edit']))
const canEditIdentity = computed(() => hasPermission(authStore.permissions, ['oauth:provider:user:edit']))
const canDeleteIdentity = computed(() => hasPermission(authStore.permissions, ['oauth:provider:user:delete']))
const pendingIdentities = ref(new Set<number>())
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const rows = ref<OAuthUser[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const searchAccount = ref('')
const userAccount = ref('')
const centerCellStyle = { textAlign: 'center' as const }
const columns = [
  { key: 'userAvatar', label: 'common.oauth.avatar' },
  { key: 'userAccount', label: 'common.oauth.account' },
  { key: 'userName', label: 'common.oauth.name' },
  { key: 'userEmail', label: 'common.oauth.email' },
  { key: 'lastLoginTime', label: 'common.oauth.lastLoginTime' },
  { key: 'authStatus', label: 'common.oauth.identityStatus' },
  { key: 'actions', label: 'common.oauth.actions' }
]
const { visibleKeys, isVisible } = useTableColumns('hub-admin-ui-pc:columns:oauth-identity-actions', columns)

async function toggleIdentity(row: OAuthUser): Promise<boolean> {
  if (!canEditIdentity.value || pendingIdentities.value.has(row.id)) return false
  const provider = providerCode.value
  const status = row.authStatus === 1 ? 0 : 1
  pendingIdentities.value.add(row.id)
  try {
    await updateOAuthIdentityStatus(provider, row.id, status)
    ElMessage.success(t('common.oauth.statusSaved'))
    return true
  } catch {
    return false
  } finally {
    pendingIdentities.value.delete(row.id)
  }
}

async function removeIdentity(row: OAuthUser) {
  if (!canDeleteIdentity.value || pendingIdentities.value.has(row.id)) return
  const provider = providerCode.value
  try {
    await ElMessageBox.confirm(t('common.oauth.deleteConfirm', { account: row.userAccount }), t('common.oauth.delete'), { type: 'warning' })
  } catch { return }
  pendingIdentities.value.add(row.id)
  try {
    await deleteOAuthIdentity(provider, row.id)
    ElMessage.success(t('common.oauth.deleted'))
    if (providerCode.value === provider) {
      if (rows.value.length === 1 && pageIndex.value > 1) pageIndex.value--
      await load()
    }
  } finally {
    pendingIdentities.value.delete(row.id)
  }
}

function emptyConfig(provider: OAuthProvider): OAuthConfig {
  const scopes: Record<OAuthProvider, string> = {
    gitlab: 'read_user', github: 'read:user user:email', wechat: 'snsapi_login', qq: 'get_user_info', bilibili: ''
  }
  return { clientId: '', clientSecret: '', authUrl: '', redirectUrl: '', authScope: scopes[provider], status: 0 }
}

const form = reactive<OAuthConfig>(emptyConfig(providerCode.value))
const rules = computed<FormRules>(() => ({
  clientId: [{ required: true, message: t('common.oauth.required'), trigger: 'blur' }],
  clientSecret: [{ required: true, message: t('common.oauth.required'), trigger: 'blur' }],
  authUrl: [{ required: true, message: t('common.oauth.required'), trigger: 'blur' }],
  redirectUrl: [{ required: true, message: t('common.oauth.required'), trigger: 'blur' }]
}))

async function load() {
  const sequence = ++loadSequence
  loading.value = true
  try {
    const { data } = await getOAuthUsers(providerCode.value, userAccount.value, pageIndex.value, pageSize.value)
    if (sequence !== loadSequence) return
    rows.value = data.list ?? []
    total.value = data.total ?? 0
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

function changeProvider() {
  rows.value = []
  total.value = 0
  searchAccount.value = ''
  userAccount.value = ''
  pageIndex.value = 1
  void load()
}

function search() {
  userAccount.value = searchAccount.value.trim()
  pageIndex.value = 1
  void load()
}

function reset() {
  searchAccount.value = ''
  search()
}

async function openConfig() {
  configLoading.value = true
  configProvider.value = providerCode.value
  try {
    const { data } = await getOAuthConfig(configProvider.value)
    Object.assign(form, emptyConfig(configProvider.value), data ?? {})
    dialogVisible.value = true
    formRef.value?.clearValidate()
  } finally {
    configLoading.value = false
  }
}

async function saveConfig() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    await saveOAuthConfig(configProvider.value, { ...form })
    ElMessage.success(t('common.oauth.saveSuccess'))
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

onMounted(() => { void load() })
</script>

<template>
  <div class="oauth-page">
    <el-card shadow="never">
      <el-tabs v-model="providerCode" class="provider-tabs" @tab-change="changeProvider">
        <el-tab-pane v-for="provider in providers" :key="provider" :name="provider">
          <template #label><span class="provider-tab"><svg-icon :icon-class="provider" />{{ t(`common.binding.${provider}`) }}</span></template>
        </el-tab-pane>
      </el-tabs>
      <div class="toolbar">
        <el-input v-model="searchAccount" :placeholder="t('common.oauth.account')" clearable class="account-input" @keyup.enter="search" />
        <el-button type="primary" :icon="Search" @click="search">{{ t('common.oauth.search') }}</el-button>
        <el-button :icon="Refresh" @click="reset">{{ t('common.oauth.reset') }}</el-button>
        <span class="toolbar-spacer" />
        <el-button v-if="canEdit" :icon="Edit" :loading="configLoading" @click="openConfig">{{ t('common.oauth.configure') }}</el-button>
        <TableColumnSettings v-model="visibleKeys" :columns="columns" />
      </div>
      <el-table v-loading="loading" :data="rows" :cell-style="centerCellStyle" :header-cell-style="centerCellStyle" class="identity-table" style="width: 100%">
        <el-table-column type="index" :label="t('common.oauth.index')" width="60" :index="(i: number) => (pageIndex - 1) * pageSize + i + 1" />
        <el-table-column v-if="isVisible('userAvatar')" :label="t('common.oauth.avatar')">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.userAvatar || undefined" class="identity-avatar">{{ (row.userName || row.userAccount || '?').charAt(0) }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column v-if="isVisible('userAccount')" prop="userAccount" :label="t('common.oauth.account')" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userName')" prop="userName" :label="t('common.oauth.name')" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userEmail')" prop="userEmail" :label="t('common.oauth.email')" show-overflow-tooltip />
        <el-table-column v-if="isVisible('lastLoginTime')" prop="lastLoginTime" :label="t('common.oauth.lastLoginTime')" width="180" />
        <el-table-column v-if="isVisible('authStatus')" :label="t('common.oauth.identityStatus')" width="160" align="center" header-align="center">
          <template #default="{ row }"><el-switch v-model="row.authStatus" :active-value="1" :inactive-value="0" inline-prompt :active-text="t('common.oauth.statusEnabled')" :inactive-text="t('common.oauth.statusDisabled')" :disabled="!canEditIdentity" :loading="pendingIdentities.has(row.id)" :before-change="() => toggleIdentity(row)" /></template>
        </el-table-column>
        <el-table-column v-if="isVisible('actions')" :label="t('common.oauth.actions')" width="160" align="center" header-align="center">
          <template #default="{ row }"><el-button v-if="canDeleteIdentity" link type="danger" :icon="Delete" :loading="pendingIdentities.has(row.id)" @click="removeIdentity(row)">{{ t('common.oauth.delete') }}</el-button><span v-else>—</span></template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="total" v-model:current-page="pageIndex" v-model:page-size="pageSize"
        class="pagination" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="load" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="`${t(`common.binding.${configProvider}`)} · ${t('common.oauth.configure')}`" width="min(680px, 94vw)" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" class="config-form">
        <el-form-item :label="t('common.oauth.clientId')" prop="clientId"><el-input v-model="form.clientId" /></el-form-item>
        <el-form-item :label="t('common.oauth.clientSecret')" prop="clientSecret"><el-input v-model="form.clientSecret" type="password" show-password /></el-form-item>
        <el-form-item :label="t('common.oauth.authUrl')" prop="authUrl"><el-input v-model="form.authUrl" /></el-form-item>
        <el-form-item :label="t('common.oauth.redirectUrl')" prop="redirectUrl"><el-input v-model="form.redirectUrl" /></el-form-item>
        <el-form-item :label="t('common.oauth.authScope')"><el-input v-model="form.authScope" /></el-form-item>
        <el-form-item :label="t('common.oauth.enabled')"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="saveConfig">{{ t('common.oauth.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.oauth-page { width: 100%; }
.identity-avatar { vertical-align: middle; }
.identity-table :deep(.cell) { text-align: center; }
.provider-tabs { margin-bottom: 16px; }
.provider-tab { display: inline-flex; align-items: center; gap: 8px; }
.provider-tab .svg-icon { font-size: 18px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 18px; }
.toolbar-spacer { flex: 1; }
.account-input { width: 220px; flex: 0 0 220px; }
.pagination { justify-content: flex-end; margin-top: 18px; }
.config-form { padding-right: 12px; }
@media (max-width: 640px) {
  .account-input { width: 100%; flex: 1 1 100%; }
  .config-form { padding-right: 0; }
}
</style>
