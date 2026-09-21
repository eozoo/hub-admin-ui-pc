<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { createManager, grantManager, listManagers, managerCandidates, removeManager, type TenantManager, type TenantRow } from '@/api/rbac/tenant'

const props = defineProps<{ tenant: TenantRow }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const { t } = useI18n()
const rows = ref<TenantManager[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const saving = ref(false)
const adding = ref(false)
const mode = ref<'existing' | 'new'>('existing')
const candidates = ref<TenantManager[]>([])
const searching = ref(false)
let searchVersion = 0
const formRef = ref<FormInstance>()
const form = reactive({ userId: undefined as number | undefined, userAccount: '', userName: '', userPasswd: '' })
const rules = computed<FormRules>(() => ({
  userId: [{ required: true, message: t('common.tenant.required') }],
  userAccount: [{ required: true, message: t('common.tenant.required') }],
  userName: mode.value === 'new' ? [{ required: true, message: t('common.tenant.required') }] : [],
  userPasswd: mode.value === 'new' ? [{ required: true, message: t('common.tenant.required') },
    { min: 6, max: 72, message: t('common.tenant.passwordLength') }] : []
}))
async function load() {
  loading.value = true
  try {
    const { data } = await listManagers(props.tenant.tenantId, pageIndex.value, pageSize.value)
    rows.value = data.list ?? []
    total.value = data.total ?? 0
  } finally { loading.value = false }
}
async function searchUsers(keyword: string) {
  const version = ++searchVersion
  if (!keyword) { candidates.value = []; searching.value = false; return }
  searching.value = true
  try {
    const { data } = await managerCandidates(keyword)
    if (version === searchVersion) candidates.value = data
  } finally { if (version === searchVersion) searching.value = false }
}
function add() {
  Object.assign(form, { userId: undefined as number | undefined, userAccount: '', userName: '', userPasswd: '' })
  candidates.value = []
  mode.value = 'existing'
  adding.value = true
}
async function save() {
  if (!await formRef.value?.validate().catch(() => false)) return
  saving.value = true
  try {
    if (mode.value === 'new') await createManager(props.tenant.tenantId, form.userAccount, form.userName, form.userPasswd)
    else await grantManager(props.tenant.tenantId, form.userId!)
    Object.assign(form, { userId: undefined as number | undefined, userAccount: '', userName: '', userPasswd: '' })
    adding.value = false
    ElMessage.success(t('common.tenant.saved'))
    await load()
    emit('changed')
  } finally { saving.value = false }
}
async function remove(row: TenantManager) {
  try { await ElMessageBox.confirm(t('common.tenant.removeConfirm', { account: row.userAccount }), t('common.tenant.managers')) }
  catch { return }
  await removeManager(props.tenant.tenantId, [row.userId])
  if (rows.value.length === 1 && pageIndex.value > 1) pageIndex.value--
  ElMessage.success(t('common.tenant.saved'))
  await load()
  emit('changed')
}
watch(mode, () => { Object.assign(form, { userId: undefined as number | undefined, userAccount: '', userName: '', userPasswd: '' }); formRef.value?.clearValidate() })
watch(() => props.tenant.tenantId, () => { pageIndex.value = 1; void load() }, { immediate: true })
</script>

<template>
  <el-dialog :model-value="true" :title="`${t('common.tenant.managers')} · ${tenant.tenantName}`" width="760px" :close-on-click-modal="false" @close="emit('close')">
    <el-button v-has-permi="['sys:tenant:manager:create']" type="primary" plain @click="add">{{ t('common.tenant.addManager') }}</el-button>
    <el-table v-loading="loading" :data="rows" class="manager-table">
      <el-table-column prop="userAccount" :label="t('common.tenant.account')" />
      <el-table-column prop="userName" :label="t('common.tenant.userName')" />
      <el-table-column :label="t('common.tenant.accountStatus')"><template #default="{ row }">{{ t(row.userStatus === 1 ? 'common.tenant.enabled' : 'common.tenant.disabled') }}</template></el-table-column>
      <el-table-column :label="t('common.tenant.memberStatus')"><template #default="{ row }">{{ t(row.status === 1 ? 'common.tenant.enabled' : 'common.tenant.disabled') }}</template></el-table-column>
      <el-table-column :label="t('common.tenant.actions')"><template #default="{ row }"><el-button v-has-permi="['sys:tenant:manager:remove']" type="danger" link @click="remove(row)">{{ t('common.tenant.removeManager') }}</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-if="total" v-model:current-page="pageIndex" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    <el-dialog v-model="adding" :title="t('common.tenant.addManager')" width="520px" append-to-body destroy-on-close :close-on-click-modal="false" @closed="form.userPasswd = ''">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item :label="t('common.tenant.accountMode')"><el-radio-group v-model="mode"><el-radio value="existing">{{ t('common.tenant.existingAccount') }}</el-radio><el-radio value="new">{{ t('common.tenant.newAccount') }}</el-radio></el-radio-group></el-form-item>
        <el-form-item :label="t('common.tenant.account')"  :prop="mode === 'existing' ? 'userId' : 'userAccount'">
          <el-select v-if="mode === 'existing'" v-model="form.userId" filterable remote :remote-method="searchUsers" :loading="searching" :placeholder="t('common.tenant.searchAccount')" style="width: 100%"><el-option v-for="user in candidates" :key="user.userId" :value="user.userId" :label="`${user.userAccount} · ${user.userName}`" /></el-select>
          <el-input v-else v-model="form.userAccount" maxlength="64" autocomplete="off" />
        </el-form-item>
        <template v-if="mode === 'new'">
          <el-form-item :label="t('common.tenant.userName')" prop="userName"><el-input v-model="form.userName" maxlength="64" /></el-form-item>
          <el-form-item :label="t('common.tenant.password')" prop="userPasswd"><el-input v-model="form.userPasswd" type="password" show-password autocomplete="new-password" maxlength="72" /></el-form-item>
        </template>
      </el-form>
      <template #footer><el-button @click="adding = false">{{ t('common.action.cancel') }}</el-button><el-button type="primary" :loading="saving" @click="save">{{ t('common.action.confirm') }}</el-button></template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.manager-table { margin: 16px 0; }
</style>
