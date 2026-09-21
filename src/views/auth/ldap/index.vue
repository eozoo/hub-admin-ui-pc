<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Edit, Refresh, Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/modules/auth'
import { hasPermission } from '@/utils/permission'
import TableColumnSettings from '@/components/TableColumnSettings/index.vue'
import { useTableColumns } from '@/components/TableColumnSettings/useTableColumns'
import { deleteLdapIdentity, getLdapConfig, getLdapUsers, saveLdapConfig, updateLdapIdentityStatus, validLdapConfig } from '@/api/auth/ldap'
import type { LdapConfig, LdapUser } from '@/api/auth/ldap'

const { t } = useI18n()
const authStore = useAuthStore()
const canEdit = computed(() => hasPermission(authStore.permissions, ['sys:ldap:edit']))
const canDelete = computed(() => hasPermission(authStore.permissions, ['sys:ldap:delete']))
const pendingIdentities = ref(new Set<number>())
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const rows = ref<LdapUser[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const searchAccount = ref('')
const ldapAccount = ref('')
const centerCellStyle = { textAlign: 'center' as const }
const columns = [
  { key: 'userAccount', label: 'common.ldap.account' },
  { key: 'userName', label: 'common.ldap.name' },
  { key: 'userPhone', label: 'common.ldap.phone' },
  { key: 'userEmail', label: 'common.ldap.email' },
  { key: 'userDept', label: 'common.ldap.dept' },
  { key: 'userPost', label: 'common.ldap.post' },
  { key: 'userLeader', label: 'common.ldap.leader' },
  { key: 'lastLoginTime', label: 'common.ldap.lastLoginTime' },
  { key: 'authStatus', label: 'common.ldap.accountStatus' },
  { key: 'actions', label: 'common.ldap.actions' }
]
const { visibleKeys, isVisible } = useTableColumns('hub-admin-ui-pc:columns:ldap-identity-actions', columns)

async function toggleIdentity(row: LdapUser): Promise<boolean> {
  if (!canEdit.value || pendingIdentities.value.has(row.id)) return false
  const status = row.authStatus === 1 ? 0 : 1
  pendingIdentities.value.add(row.id)
  try {
    await updateLdapIdentityStatus(row.id, status)
    ElMessage.success(t('common.ldap.statusSaved'))
    return true
  } catch {
    return false
  } finally {
    pendingIdentities.value.delete(row.id)
  }
}

async function removeIdentity(row: LdapUser) {
  if (!canDelete.value || pendingIdentities.value.has(row.id)) return
  try {
    await ElMessageBox.confirm(t('common.ldap.deleteConfirm', { account: row.userAccount }), t('common.ldap.delete'), { type: 'warning' })
  } catch { return }
  pendingIdentities.value.add(row.id)
  try {
    await deleteLdapIdentity(row.id)
    ElMessage.success(t('common.ldap.deleted'))
    if (rows.value.length === 1 && pageIndex.value > 1) pageIndex.value--
    await load()
  } finally {
    pendingIdentities.value.delete(row.id)
  }
}

function emptyConfig(): LdapConfig {
  return {
    ldapStatus: 1, ldapUrl: '', ldapUser: '', ldapPasswd: '', baseDn: '', readonly: 0,
    userDn: '', userClass: 'person', accountProperty: 'sAMAccountName', subjectProperty: 'objectGUID',
    nameProperty: '', emailProperty: '', phoneProperty: '', postProperty: '', deptProperty: '',
    leaderProperty: '', infoProperty: '', environment: {}
  }
}

const form = reactive<LdapConfig>(emptyConfig())
const required = (key: string) => [{ required: true, message: t(key), trigger: 'blur' }]
const rules = computed<FormRules>(() => ({
  ldapUrl: required('common.ldap.requiredUrl'),
  ldapUser: required('common.ldap.requiredUser'),
  ldapPasswd: required('common.ldap.requiredPassword'),
  baseDn: required('common.ldap.requiredBaseDn'),
  userClass: required('common.ldap.requiredUserClass'),
  accountProperty: required('common.ldap.requiredAccountProperty'),
  subjectProperty: required('common.ldap.requiredSubjectProperty')
}))

async function load() {
  loading.value = true
  try {
    const { data } = await getLdapUsers(ldapAccount.value, pageIndex.value, pageSize.value)
    rows.value = data.list ?? []
    total.value = data.total ?? 0
  } finally {
    loading.value = false
  }
}

function search() {
  ldapAccount.value = searchAccount.value.trim()
  pageIndex.value = 1
  void load()
}

function reset() {
  searchAccount.value = ''
  search()
}

async function openConfig() {
  const { data } = await getLdapConfig()
  Object.assign(form, emptyConfig(), data ?? {})
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

async function testConfig() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  testing.value = true
  try {
    await validLdapConfig({ ...form })
    ElMessage.success(t('common.ldap.testSuccess'))
  } finally {
    testing.value = false
  }
}

async function saveConfig() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    await saveLdapConfig({ ...form })
    ElMessage.success(t('common.ldap.saveSuccess'))
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(() => { void load() })
</script>

<template>
  <div class="ldap-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="searchAccount" :placeholder="t('common.ldap.account')" clearable class="account-input" @keyup.enter="search" />
        <el-button type="primary" :icon="Search" @click="search">{{ t('common.ldap.search') }}</el-button>
        <el-button :icon="Refresh" @click="reset">{{ t('common.ldap.reset') }}</el-button>
        <span class="toolbar-spacer" />
        <el-button v-if="canEdit" class="config-button" :icon="Edit" @click="openConfig">{{ t('common.ldap.configure') }}</el-button>
        <TableColumnSettings v-model="visibleKeys" :columns="columns" />
      </div>
      <el-table v-loading="loading" :data="rows" :cell-style="centerCellStyle" :header-cell-style="centerCellStyle" style="width: 100%">
        <el-table-column type="index" :label="t('common.ldap.index')" width="72" :index="(i: number) => (pageIndex - 1) * pageSize + i + 1" />
        <el-table-column v-if="isVisible('userAccount')" prop="userAccount" :label="t('common.ldap.account')" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userName')" prop="userName" :label="t('common.ldap.name')" min-width="130" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userPhone')" prop="userPhone" :label="t('common.ldap.phone')" min-width="140" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userEmail')" prop="userEmail" :label="t('common.ldap.email')" min-width="190" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userDept')" prop="userDept" :label="t('common.ldap.dept')" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userPost')" prop="userPost" :label="t('common.ldap.post')" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userLeader')" prop="userLeader" :label="t('common.ldap.leader')" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="isVisible('lastLoginTime')" prop="lastLoginTime" :label="t('common.ldap.lastLoginTime')" width="180" />
        <el-table-column v-if="isVisible('authStatus')" :label="t('common.ldap.accountStatus')" width="110" align="center" header-align="center">
          <template #default="{ row }"><el-switch v-model="row.authStatus" :active-value="1" :inactive-value="0" inline-prompt :active-text="t('common.ldap.statusEnabled')" :inactive-text="t('common.ldap.statusDisabled')" :disabled="!canEdit" :loading="pendingIdentities.has(row.id)" :before-change="() => toggleIdentity(row)" /></template>
        </el-table-column>
        <el-table-column v-if="isVisible('actions')" :label="t('common.ldap.actions')" width="100" align="center" header-align="center">
          <template #default="{ row }"><el-button v-if="canDelete" link type="danger" :icon="Delete" :loading="pendingIdentities.has(row.id)" @click="removeIdentity(row)">{{ t('common.ldap.delete') }}</el-button><span v-else>—</span></template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="total" class="pagination" v-model:current-page="pageIndex" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="load" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="t('common.ldap.configure')" width="min(760px, 94vw)" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" class="config-form">
        <div class="section-title">{{ t('common.ldap.server') }}</div>
        <el-row :gutter="16">
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.bindUser')" prop="ldapUser"><el-input v-model="form.ldapUser" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.bindPassword')" prop="ldapPasswd"><el-input v-model="form.ldapPasswd" type="password" show-password /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="t('common.ldap.url')" prop="ldapUrl"><el-input v-model="form.ldapUrl" placeholder="ldap://example.com:389" /></el-form-item>
        <el-form-item :label="t('common.ldap.enabled')"><el-switch v-model="form.ldapStatus" :active-value="1" :inactive-value="0" /></el-form-item>
        <div class="section-title">{{ t('common.ldap.searchSettings') }}</div>
        <el-form-item :label="t('common.ldap.baseDn')" prop="baseDn"><el-input v-model="form.baseDn" placeholder="dc=example,dc=com" /></el-form-item>
        <el-form-item :label="t('common.ldap.userDn')"><el-input v-model="form.userDn" /></el-form-item>
        <el-form-item :label="t('common.ldap.readonly')"><el-switch v-model="form.readonly" :active-value="1" :inactive-value="0" /></el-form-item>
        <div class="section-title">{{ t('common.ldap.userMapping') }}</div>
        <el-row :gutter="16">
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.userClass')" prop="userClass"><el-input v-model="form.userClass" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.accountProperty')" prop="accountProperty"><el-input v-model="form.accountProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.subjectProperty')" prop="subjectProperty"><el-input v-model="form.subjectProperty" placeholder="objectGUID / entryUUID" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.nameProperty')"><el-input v-model="form.nameProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.emailProperty')"><el-input v-model="form.emailProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.phoneProperty')"><el-input v-model="form.phoneProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.deptProperty')"><el-input v-model="form.deptProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.postProperty')"><el-input v-model="form.postProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.leaderProperty')"><el-input v-model="form.leaderProperty" /></el-form-item></el-col>
          <el-col :sm="12" :xs="24"><el-form-item :label="t('common.ldap.infoProperty')"><el-input v-model="form.infoProperty" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button :loading="testing" @click="testConfig">{{ t('common.ldap.test') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveConfig">{{ t('common.ldap.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.ldap-page { width: 100%; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 18px; }
.toolbar-spacer { flex: 1; }
.account-input { width: 220px; flex: 0 0 220px; }
.pagination { justify-content: flex-end; margin-top: 18px; }
.config-form { padding-right: 12px; }
.section-title { margin: 6px 0 18px; padding-left: 10px; border-left: 3px solid var(--el-color-primary); color: var(--el-text-color-primary); font-weight: 600; }
@media (max-width: 640px) {
  .account-input { width: 100%; flex: 1 1 100%; }
  .config-form { padding-right: 0; }
}
</style>
