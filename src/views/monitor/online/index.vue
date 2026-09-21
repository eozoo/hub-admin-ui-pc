<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleClose, Delete, Key, Refresh, Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/modules/auth'
import { hasPermission } from '@/utils/permission'
import TableColumnSettings from '@/components/TableColumnSettings/index.vue'
import { useTableColumns } from '@/components/TableColumnSettings/useTableColumns'
import { listOnline, revokeGrant, revokeDevice } from '@/api/monitor/online'
import type { OnlineGrant, OnlineDevice } from '@/api/monitor/online'

const { t } = useI18n()
const authStore = useAuthStore()
const canForce = computed(() => hasPermission(authStore.permissions, ['monitor:online:force']))
const loading = ref(false)
const rows = ref<OnlineDevice[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const account = ref('')
const dateRange = ref<[string, string] | null>(null)
const detailVisible = ref(false)
const selected = ref<OnlineDevice | null>(null)
const grants = computed(() => selected.value?.accessList ?? [])
const filter = reactive({ userAccount: '' })
const centerCellStyle = { textAlign: 'center' as const }
const columns = [
  { key: 'authType', label: 'common.online.authType' },
  { key: 'loginSource', label: 'common.online.loginSource' },
  { key: 'userAccount', label: 'common.online.account' },
  { key: 'userName', label: 'common.online.name' },
  { key: 'deviceId', label: 'common.online.deviceId' },
  { key: 'cluster', label: 'common.online.cluster' },
  { key: 'loginTime', label: 'common.online.loginTime' },
  { key: 'loginIp', label: 'common.online.loginIp' }
]
const { visibleKeys, isVisible } = useTableColumns('hub-admin-ui-pc:columns:online:login-source', columns)

async function load() {
  loading.value = true
  try {
    const { data } = await listOnline({
      userAccount: filter.userAccount || undefined,
      beginTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1]
    }, pageIndex.value, pageSize.value)
    rows.value = data.list ?? []
    total.value = data.total ?? 0
    if (selected.value) selected.value = rows.value.find(row => row.deviceId === selected.value?.deviceId) ?? null
  } finally {
    loading.value = false
  }
}

function search() {
  filter.userAccount = account.value.trim()
  pageIndex.value = 1
  void load()
}

function reset() {
  account.value = ''
  dateRange.value = null
  search()
}

async function forceQuit(row: OnlineDevice) {
  try {
    await ElMessageBox.confirm(t('common.online.forceConfirm', { name: row.userName || row.userAccount }), t('common.online.force'), { type: 'warning' })
  } catch { return }
  await revokeDevice(row.userAccount, row.deviceId)
  ElMessage.success(t('common.online.revoked'))
  await load()
}

async function removeGrant(grant: OnlineGrant) {
  if (!selected.value || grant.appId || grant.revoked === 1) return
  try {
    await ElMessageBox.confirm(t('common.online.revokeConfirm'), t('common.online.revoke'), { type: 'warning' })
  } catch { return }
  await revokeGrant(selected.value.userAccount, selected.value.deviceId, grant.grantId)
  ElMessage.success(t('common.online.revoked'))
  await load()
}

onMounted(() => { void load() })
</script>

<template>
  <div class="online-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="account" :placeholder="t('common.online.account')" clearable class="account-input" @keyup.enter="search" />
        <div class="date-range">
          <el-date-picker v-model="dateRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss"
            :start-placeholder="t('common.online.startTime')" :end-placeholder="t('common.online.endTime')" />
        </div>
        <el-button type="primary" :icon="Search" @click="search">{{ t('common.online.search') }}</el-button>
        <el-button :icon="Refresh" @click="reset">{{ t('common.online.reset') }}</el-button>
        <span class="toolbar-spacer" />
        <TableColumnSettings v-model="visibleKeys" :columns="columns" />
      </div>
      <el-table v-loading="loading" :data="rows" :cell-style="centerCellStyle" :header-cell-style="centerCellStyle" style="width: 100%">
        <el-table-column type="index" :label="t('common.online.index')" width="72" :index="(i: number) => (pageIndex - 1) * pageSize + i + 1" />
        <el-table-column v-if="isVisible('authType')" prop="authType" :label="t('common.online.authType')" width="105" />
        <el-table-column v-if="isVisible('loginSource')" prop="loginSource" :label="t('common.online.loginSource')" width="120">
          <template #default="{ row }">{{ t(`common.online.sources.${row.loginSource || 'unknown'}`) }}</template>
        </el-table-column>
        <el-table-column v-if="isVisible('userAccount')" prop="userAccount" :label="t('common.online.account')" min-width="140" show-overflow-tooltip />
        <el-table-column v-if="isVisible('userName')" prop="userName" :label="t('common.online.name')" min-width="130" show-overflow-tooltip />
        <el-table-column v-if="isVisible('deviceId')" prop="deviceId" :label="t('common.online.deviceId')" min-width="180" show-overflow-tooltip />
        <el-table-column v-if="isVisible('cluster')" prop="cluster" :label="t('common.online.cluster')" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="isVisible('loginTime')" prop="loginTime" :label="t('common.online.loginTime')" min-width="170" />
        <el-table-column v-if="isVisible('loginIp')" prop="loginIp" :label="t('common.online.loginIp')" min-width="140" show-overflow-tooltip />
        <el-table-column :label="t('common.online.actions')" fixed="right" min-width="190">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Key" @click="selected = row; detailVisible = true">{{ t('common.online.grants') }} ({{ row.accessList?.length ?? 0 }})</el-button>
            <el-button v-if="canForce" link type="danger" :icon="CircleClose" @click="forceQuit(row)">{{ t('common.online.force') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="total" class="pagination" v-model:current-page="pageIndex" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="load" />
    </el-card>
    <el-dialog v-model="detailVisible" :title="t('common.online.grants')" width="min(900px, 90vw)">
      <el-table :data="grants" :cell-style="centerCellStyle" :header-cell-style="centerCellStyle" style="width: 100%">
        <el-table-column prop="grantId" :label="t('common.online.grantId')" min-width="190" show-overflow-tooltip />
        <el-table-column prop="grantApp" :label="t('common.online.grantApp')" min-width="140">
          <template #default="{ row }">{{ row.grantApp || t('common.online.user') }}</template>
        </el-table-column>
        <el-table-column prop="grantTime" :label="t('common.online.grantTime')" min-width="170" />
        <el-table-column prop="grantIp" :label="t('common.online.loginIp')" min-width="130" />
        <el-table-column :label="t('common.online.accessStatus')" width="110">
          <template #default="{ row }">
            <el-tag v-if="!row.appId" :type="row.revoked === 1 ? 'danger' : 'success'">
              {{ t(row.revoked === 1 ? 'common.online.accessRevoked' : 'common.online.accessActive') }}
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column v-if="canForce" :label="t('common.online.actions')" width="100">
          <template #default="{ row }"><el-button v-if="!row.appId && row.revoked !== 1 && row.tenantCode === selected?.tenantCode" link type="danger" :icon="Delete" @click="removeGrant(row)">{{ t('common.online.revoke') }}</el-button></template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.online-page { width: 100%; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 18px; }
.toolbar-spacer { flex: 1; }
.account-input { width: 200px; flex: 0 0 200px; }
.date-range { width: 440px; flex: 0 0 440px; }
.date-range :deep(.el-date-editor) { width: 100%; }
.pagination { justify-content: flex-end; margin-top: 18px; }
@media (max-width: 640px) {
  .account-input, .date-range { width: 100%; flex: 1 1 100%; }
}
</style>
