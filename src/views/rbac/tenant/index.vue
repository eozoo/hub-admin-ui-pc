<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createTenant, editTenant, getTenant, listTenants, updateTenantStatus, type TenantForm, type TenantRow } from '@/api/rbac/tenant'
import TenantManagers from './TenantManagers.vue'
import TableColumnSettings from '@/components/TableColumnSettings/index.vue'
import { useTableColumns } from '@/components/TableColumnSettings/useTableColumns'
import { useAuthStore } from '@/stores/modules/auth'
import { hasPermission } from '@/utils/permission'

const { t } = useI18n()
const loading = ref(false)
const rows = ref<TenantRow[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const filter = reactive({ tenantCode: '', tenantName: '', tenantType: '', status: '' })
const center = { textAlign: 'center' as const }
const auth = useAuthStore()
const canChangeStatus = computed(() => hasPermission(auth.permissions, ['sys:tenant:status']))
const columns = [
  { key: 'index', label: 'common.tenant.index' },
  { key: 'tenantName', label: 'common.tenant.name' },
  { key: 'logo', label: 'common.tenant.logo' },
  { key: 'tenantCode', label: 'common.tenant.code' },
  { key: 'tenantType', label: 'common.tenant.type' },
  { key: 'users', label: 'common.tenant.users' },
  { key: 'status', label: 'common.tenant.status' },
  { key: 'expireTime', label: 'common.tenant.expireTime' },
  { key: 'actions', label: 'common.tenant.actions' }
]
const { visibleKeys, isVisible } = useTableColumns('hub-admin-ui-pc:columns:tenants', columns)

async function load() {
  loading.value = true
  try {
    const { data } = await listTenants({
      tenantCode: filter.tenantCode || undefined,
      tenantName: filter.tenantName || undefined,
      tenantType: (filter.tenantType || undefined) as TenantRow['tenantType'] | undefined,
      status: filter.status === '' ? undefined : Number(filter.status) as 0 | 1
    }, pageIndex.value, pageSize.value)
    rows.value = data.list ?? []
    total.value = data.total ?? 0
  } finally { loading.value = false }
}

function search() { pageIndex.value = 1; void load() }
function reset() { filter.tenantCode = ''; filter.tenantName = ''; filter.tenantType = ''; filter.status = ''; search() }
const open = ref(false)
const editing = ref(false)
const editingTenantId = ref(0)
const saving = ref(false)
const formRef = ref<FormInstance>()
const managerTenant = ref<TenantRow>()
const statusBusy = ref<string[]>([])
function emptyForm(): TenantForm {
  return { tenantCode: '', tenantName: '', tenantType: 'normal', title: '', userLimit: 1000,
    expireTime: null, tenantDomain: '', tenantUser: '', tenantAddr: '', tenantPhone: '', tenantEmail: '', remark: '' }
}
const form = reactive<TenantForm>(emptyForm())
const rules = computed<FormRules>(() => ({
  tenantCode: [{ required: true, message: t('common.tenant.required') },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: t('common.tenant.codeInvalid') }],
  tenantName: [{ required: true, message: t('common.tenant.required') }],
  title: [{ required: true, message: t('common.tenant.required') }],
  tenantEmail: [{ type: 'email', message: t('common.tenant.emailInvalid') }]
}))
function add() {
  editing.value = false
  editingTenantId.value = 0
  Object.assign(form, emptyForm())
  open.value = true
}
async function edit(row: TenantRow) {
  const { data } = await getTenant(row.tenantId)
  editing.value = true
  editingTenantId.value = data.tenantId
  Object.assign(form, emptyForm(), {
    tenantCode: data.tenantCode, tenantName: data.tenantName, tenantType: data.tenantType,
    title: data.title ?? '', userLimit: data.userLimit ?? 1000, expireTime: data.expireTime,
    tenantDomain: data.tenantDomain ?? '', tenantUser: data.tenantUser ?? '', tenantAddr: data.tenantAddr ?? '',
    tenantPhone: data.tenantPhone ?? '', tenantEmail: data.tenantEmail ?? '', remark: data.remark ?? ''
  })
  open.value = true
}
async function save() {
  if (!await formRef.value?.validate().catch(() => false)) return
  saving.value = true
  try {
    await (editing.value ? editTenant({ ...form, tenantId: editingTenantId.value }) : createTenant({ ...form }))
    ElMessage.success(t('common.tenant.saved'))
    open.value = false
    await load()
  } finally { saving.value = false }
}
async function changeStatus(row: TenantRow, next: 0 | 1) {
  if (statusBusy.value.includes(row.tenantCode)) return
  statusBusy.value.push(row.tenantCode)
  try {
    try {
      await ElMessageBox.confirm(t('common.tenant.statusConfirm', {
        name: row.tenantName, status: t(next === 1 ? 'common.tenant.enabled' : 'common.tenant.disabled')
      }), t('common.tenant.status'))
    } catch { return }
    await updateTenantStatus(row.tenantId, next)
    row.status = next
    ElMessage.success(t('common.tenant.saved'))
    await load()
  } finally { statusBusy.value = statusBusy.value.filter(code => code !== row.tenantCode) }
}
onMounted(() => { void load() })
</script>

<template>
  <div class="tenant-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="filter.tenantCode" clearable class="filter-input" :placeholder="t('common.tenant.code')" @keyup.enter="search" />
        <el-input v-model="filter.tenantName" clearable class="filter-input" :placeholder="t('common.tenant.name')" @keyup.enter="search" />
        <el-select v-model="filter.tenantType" clearable class="filter-select" :placeholder="t('common.tenant.type')">
          <el-option value="system" :label="t('common.tenant.types.system')" />
          <el-option value="normal" :label="t('common.tenant.types.normal')" />
          <el-option value="trial" :label="t('common.tenant.types.trial')" />
          <el-option value="public" :label="t('common.tenant.types.public')" />
        </el-select>
        <el-select v-model="filter.status" clearable class="filter-select" :placeholder="t('common.tenant.status')">
          <el-option value="1" :label="t('common.tenant.enabled')" />
          <el-option value="0" :label="t('common.tenant.disabled')" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="search">{{ t('common.online.search') }}</el-button>
        <el-button :icon="Refresh" @click="reset">{{ t('common.online.reset') }}</el-button>
      </div>
      <div class="actions">
        <el-button v-has-permi="['sys:tenant:create']" type="primary" plain :icon="Plus" @click="add">{{ t('common.tenant.create') }}</el-button>
        <TableColumnSettings v-model="visibleKeys" :columns="columns" />
      </div>
      <el-table v-loading="loading" :data="rows" :cell-style="center" :header-cell-style="center">
        <el-table-column v-if="isVisible('index')" type="index" :label="t('common.tenant.index')" width="72" :index="(i: number) => (pageIndex - 1) * pageSize + i + 1" />
        <el-table-column v-if="isVisible('tenantName')" prop="tenantName" :label="t('common.tenant.name')" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="isVisible('logo')" :label="t('common.tenant.logo')" width="110">
          <template #default="{ row }">
            <el-image v-if="row.logo" :src="row.logo" :alt="row.tenantName" fit="contain" class="tenant-logo" :preview-src-list="[row.logo]" preview-teleported>
              <template #error><span>-</span></template>
            </el-image>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="isVisible('tenantCode')" prop="tenantCode" :label="t('common.tenant.code')" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="isVisible('tenantType')" prop="tenantType" :label="t('common.tenant.type')">
          <template #default="{ row }">{{ t(`common.tenant.types.${row.tenantType}`) }}</template>
        </el-table-column>
        <el-table-column v-if="isVisible('users')" :label="t('common.tenant.users')" width="120">
          <template #default="{ row }">{{ row.userCount ?? 0 }} / {{ row.userLimit ?? '-' }}</template>
        </el-table-column>
        <el-table-column v-if="isVisible('status')" prop="status" :label="t('common.tenant.status')">
          <template #default="{ row }">
            <el-switch :model-value="row.status" :active-value="1" :inactive-value="0" inline-prompt
              :active-text="t('common.tenant.enabled')" :inactive-text="t('common.tenant.disabled')"
              :aria-label="`${row.tenantName} · ${t('common.tenant.status')}`"
              :loading="statusBusy.includes(row.tenantCode)"
              :disabled="!canChangeStatus || ['system', 'public'].includes(row.tenantType)"
              :before-change="() => changeStatus(row, row.status === 1 ? 0 : 1).then(() => false, () => false)" />
          </template>
        </el-table-column>
        <el-table-column v-if="isVisible('expireTime')" prop="expireTime" :label="t('common.tenant.expireTime')">
          <template #default="{ row }">{{ row.expireTime || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="isVisible('actions')" :label="t('common.tenant.actions')" fixed="right">
          <template #default="{ row }">
            <el-button v-has-permi="['sys:tenant:edit']" link type="primary" :disabled="row.tenantType === 'system'" @click="edit(row)">{{ t('common.tenant.edit') }}</el-button>
            <el-button v-has-permi="['sys:tenant:manager:query']" link type="primary" :disabled="row.tenantType === 'system'" @click="managerTenant = row">{{ t('common.tenant.managers') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="total" class="pagination" v-model:current-page="pageIndex" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="load" />
    </el-card>
    <el-dialog v-model="open" :title="t(editing ? 'common.tenant.editTitle' : 'common.tenant.create')" width="760px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="t('common.tenant.code')" prop="tenantCode"><el-input v-model="form.tenantCode" :disabled="editing" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.name')" prop="tenantName"><el-input v-model="form.tenantName" maxlength="128" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.title')" prop="title"><el-input v-model="form.title" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.type')"><el-select v-model="form.tenantType" :disabled="editing"><el-option v-for="type in (editing ? [form.tenantType] : ['normal', 'trial'])" :key="type" :value="type" :label="t(`common.tenant.types.${type}`)" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.userLimit')"><el-input-number v-model="form.userLimit" :min="1" :max="2147483647" :precision="0" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.expireTime')"><el-date-picker v-model="form.expireTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" :disabled="form.tenantType === 'public'" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.domain')"><el-input v-model="form.tenantDomain" maxlength="255" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.contact')"><el-input v-model="form.tenantUser" maxlength="128" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.phone')"><el-input v-model="form.tenantPhone" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="t('common.tenant.email')" prop="tenantEmail"><el-input v-model="form.tenantEmail" maxlength="128" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('common.tenant.address')"><el-input v-model="form.tenantAddr" maxlength="256" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('common.tenant.remark')"><el-input v-model="form.remark" type="textarea" maxlength="200" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="open = false">{{ t('common.action.cancel') }}</el-button><el-button type="primary" :loading="saving" @click="save">{{ t('common.action.confirm') }}</el-button></template>
    </el-dialog>
    <TenantManagers v-if="managerTenant" :tenant="managerTenant" @close="managerTenant = undefined" @changed="load" />
  </div>
</template>

<style scoped lang="scss">
.tenant-page { width: 100%; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 18px; }
.actions { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.tenant-logo { width: 48px; height: 48px; vertical-align: middle; }
.filter-input { width: 180px; }
.filter-select { width: 140px; }
.pagination { justify-content: flex-end; margin-top: 18px; }
</style>
