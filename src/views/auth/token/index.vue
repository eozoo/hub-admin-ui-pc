<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, ElTree, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Key, Refresh, View } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import TableColumnSettings from '@/components/TableColumnSettings/index.vue'
import { useTableColumns } from '@/components/TableColumnSettings/useTableColumns'
import { createApiToken, deleteApiToken, getApiPermits, listApiTokens } from '@/api/auth/apiToken'
import type { ApiPermitNode, ApiToken, ApiTokenCreate } from '@/api/auth/apiToken'
import ProfileSectionNav from '@/views/auth/profile/ProfileSectionNav.vue'

const { t } = useI18n()
const loading = ref(false)
const creating = ref(false)
const rows = ref<ApiToken[]>([])
const permits = ref<ApiPermitNode[]>([])
const permitById = new Map<number, ApiPermitNode>()
const permitByCode = new Map<string, ApiPermitNode>()
const selectedScopes = reactive<Record<number, number | null>>({})
const permitTree = ref<InstanceType<typeof ElTree>>()
const viewPermitTree = ref<InstanceType<typeof ElTree>>()
const formRef = ref<FormInstance>()
const selectedCount = ref(0)
const tokenVisible = ref(false)
const tokenValue = ref('')
const permitVisible = ref(false)
const viewingToken = ref<ApiToken | null>(null)
const viewPermitsTree = ref<ApiPermitNode[]>([])
const treeExpanded = ref(true)
const viewTreeExpanded = ref(true)
const centerCellStyle = { textAlign: 'center' as const }

const form = reactive<ApiTokenCreate>({ tokenName: '', expireTime: null, ipRule: null, menuScopes: [] })
const rules = computed<FormRules>(() => ({
  tokenName: [{ required: true, whitespace: true, message: t('common.apiToken.nameRequired'), trigger: 'blur' }]
}))
const columns = [
  { key: 'tokenName', label: 'common.apiToken.tokenName' },
  { key: 'createTime', label: 'common.apiToken.created' },
  { key: 'expireTime', label: 'common.apiToken.expireTime' },
  { key: 'ipRule', label: 'common.apiToken.ipRule' },
  { key: 'accessTime', label: 'common.apiToken.lastAccess' },
  { key: 'accessIp', label: 'common.apiToken.lastIp' }
]
const { visibleKeys, isVisible } = useTableColumns('hub-admin-ui-pc:columns:api-tokens', columns)
const viewPermits = computed(() => (viewingToken.value?.permits ?? []).map(code => ({
  code,
  label: permitByCode.get(code)?.label ?? code
})))

function clonePermitTree(nodes: ApiPermitNode[], allowed: Set<string>): ApiPermitNode[] {
  return nodes.map(node => ({ ...node, children: node.children ? clonePermitTree(node.children, allowed) : undefined }))
    .filter(node => allowed.has(node.menuPermit ?? '') || Boolean(node.children?.length))
}

function setTreeExpanded(tree: InstanceType<typeof ElTree> | undefined, expanded: boolean) {
  if (!tree) return
  Object.values(tree.store.nodesMap).forEach(node => { node.expanded = expanded })
}

function onTreeExpandChange(value: boolean, view = false) {
  setTreeExpanded(view ? viewPermitTree.value : permitTree.value, value)
}

function indexPermits(nodes: ApiPermitNode[]) {
  for (const node of nodes) {
    permitById.set(node.id, node)
    if (node.menuPermit) permitByCode.set(node.menuPermit, node)
    selectedScopes[node.id] = null
    if (node.children?.length) indexPermits(node.children)
  }
}

async function load() {
  loading.value = true
  try {
    const [permitResponse, tokenResponse] = await Promise.all([getApiPermits(), listApiTokens()])
    permits.value = permitResponse.data ?? []
    rows.value = tokenResponse.data ?? []
    permitById.clear()
    permitByCode.clear()
    indexPermits(permits.value)
  } finally {
    loading.value = false
  }
}

async function refreshTokens() {
  const { data } = await listApiTokens()
  rows.value = data ?? []
}

function onTreeCheck() {
  selectedCount.value = permitTree.value?.getCheckedKeys().length ?? 0
}

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  const checked = (permitTree.value?.getCheckedKeys() ?? []).map(id => permitById.get(Number(id)))
  const menuScopes = checked.filter((node): node is ApiPermitNode => Boolean(node?.menuPermit))
    .map(node => ({ permit: node.menuPermit as string, scopeId: selectedScopes[node.id] || null }))
  if (!menuScopes.length) {
    ElMessage.warning(t('common.apiToken.selectPermission'))
    return
  }
  if (form.expireTime && new Date(form.expireTime.replace(' ', 'T')).getTime() <= Date.now()) {
    ElMessage.warning(t('common.apiToken.expireFuture'))
    return
  }

  creating.value = true
  try {
    const { data } = await createApiToken({
      tokenName: form.tokenName.trim(),
      expireTime: form.expireTime || null,
      ipRule: form.ipRule?.trim() || null,
      menuScopes
    })
    tokenValue.value = data
    tokenVisible.value = true
    formRef.value?.resetFields()
    Object.assign(form, { tokenName: '', expireTime: null, ipRule: null, menuScopes: [] })
    permitTree.value?.setCheckedKeys([])
    selectedCount.value = 0
    ElMessage.success(t('common.apiToken.createdSuccess'))
    void refreshTokens().catch(() => undefined)
  } finally {
    creating.value = false
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(tokenValue.value)
    ElMessage.success(t('common.apiToken.copied'))
  } catch {
    ElMessage.warning(t('common.apiToken.copyFailed'))
  }
}

function closeToken() {
  tokenVisible.value = false
  tokenValue.value = ''
}

async function removeToken(row: ApiToken) {
  try {
    await ElMessageBox.confirm(t('common.apiToken.deleteConfirm', { name: row.tokenName }), t('common.apiToken.delete'), {
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteApiToken(row.tokenId)
  ElMessage.success(t('common.apiToken.deleted'))
  await refreshTokens()
}

onMounted(() => { void load() })
onBeforeUnmount(() => { tokenValue.value = '' })
</script>

<template>
  <div class="api-token-page" v-loading="loading">
    <ProfileSectionNav />
    <el-row :gutter="20">
      <el-col :lg="9" :md="10" :sm="24" :xs="24">
        <el-card class="token-card" shadow="never">
          <template #header>
            <div class="card-heading"><span>{{ t('common.apiToken.create') }}</span></div>
          </template>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item :label="t('common.apiToken.tokenName')" prop="tokenName">
              <el-input v-model="form.tokenName" maxlength="50" show-word-limit clearable />
            </el-form-item>
            <el-form-item :label="t('common.apiToken.ipRule')" prop="ipRule">
              <el-input v-model="form.ipRule" :placeholder="t('common.apiToken.ipPlaceholder')" maxlength="512" clearable />
            </el-form-item>
            <el-form-item :label="t('common.apiToken.expireTime')" prop="expireTime">
              <el-date-picker v-model="form.expireTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                :placeholder="t('common.apiToken.neverExpire')" class="full-width" />
            </el-form-item>
            <el-form-item :label="t('common.apiToken.permissions')">
              <div class="permissions-toolbar">
                <span>{{ t('common.apiToken.selected', { count: selectedCount }) }}</span>
                <el-checkbox v-model="treeExpanded" @change="onTreeExpandChange($event)">
                  {{ t('common.button.expand') }}/{{ t('common.button.collapse') }}
                </el-checkbox>
              </div>
              <div class="permissions-box">
                <el-tree ref="permitTree" :data="permits" node-key="id" show-checkbox check-strictly
                  :props="{ label: 'label', children: 'children', disabled: (node: Record<string, unknown>) => node.menuType !== 'B' || !node.menuPermit }"
                  :default-expanded-keys="permits.map(node => node.id)" @check="onTreeCheck">
                  <template #default="{ data }">
                    <span class="permit-node">
                      <span>{{ t(data.label) }}</span>
                      <el-select v-if="data.menuType === 'B' && data.menuPermit" v-model="selectedScopes[data.id]"
                        size="small" class="scope-select" clearable
                        :placeholder="t('common.apiToken.allData')" :aria-label="t('common.apiToken.scope')" @click.stop>
                        <el-option :label="t('common.apiToken.allData')" :value="0" />
                        <el-option v-for="scope in data.scopes" :key="scope.scopeId" :label="scope.scopeName" :value="scope.scopeId" />
                      </el-select>
                    </span>
                  </template>
                </el-tree>
              </div>
            </el-form-item>
            <div class="form-actions">
              <el-button type="primary" :icon="Key" :loading="creating" @click="submit">{{ t('common.apiToken.create') }}</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <el-col :lg="15" :md="14" :sm="24" :xs="24">
        <el-card class="token-card" shadow="never">
          <template #header>
            <div class="card-heading">
              <span>{{ t('common.apiToken.tokenList') }}</span>
              <div class="heading-actions">
                <el-button circle size="small" :icon="Refresh" :aria-label="t('common.action.refresh')" @click="refreshTokens" />
                <TableColumnSettings v-model="visibleKeys" :columns="columns" />
              </div>
            </div>
          </template>
          <el-table :data="rows" :empty-text="t('common.apiToken.empty')" :cell-style="centerCellStyle"
            :header-cell-style="centerCellStyle" class="token-table">
            <el-table-column v-if="isVisible('tokenName')" prop="tokenName" :label="t('common.apiToken.tokenName')" min-width="150" show-overflow-tooltip />
            <el-table-column v-if="isVisible('createTime')" prop="createTime" :label="t('common.apiToken.created')" min-width="170" />
            <el-table-column v-if="isVisible('expireTime')" :label="t('common.apiToken.expireTime')" min-width="170">
              <template #default="{ row }">{{ row.expireTime || t('common.apiToken.neverExpire') }}</template>
            </el-table-column>
            <el-table-column v-if="isVisible('ipRule')" :label="t('common.apiToken.ipRule')" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.ipRule || t('common.apiToken.unlimited') }}</template>
            </el-table-column>
            <el-table-column v-if="isVisible('accessTime')" :label="t('common.apiToken.lastAccess')" min-width="170">
              <template #default="{ row }">{{ row.accessTime || t('common.apiToken.neverUsed') }}</template>
            </el-table-column>
            <el-table-column v-if="isVisible('accessIp')" prop="accessIp" :label="t('common.apiToken.lastIp')" min-width="140" show-overflow-tooltip />
            <el-table-column :label="t('common.apiToken.actions')" fixed="right" min-width="160">
              <template #default="{ row }">
                <el-button link type="primary" :icon="View" @click="viewingToken = row; viewPermitsTree = clonePermitTree(permits, new Set(row.permits || [])); permitVisible = true">{{ t('common.apiToken.viewPermissions') }}</el-button>
                <el-button link type="danger" :icon="Delete" @click="removeToken(row)">{{ t('common.apiToken.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="tokenVisible" :title="t('common.apiToken.createdSuccess')" width="min(680px, 94vw)"
      :close-on-click-modal="false" :close-on-press-escape="false" @closed="closeToken">
      <el-alert type="warning" :closable="false" show-icon :title="t('common.apiToken.onceHint')" class="token-warning" />
      <el-input :model-value="tokenValue" type="textarea" :rows="7" readonly />
      <template #footer>
        <el-button @click="closeToken">{{ t('common.apiToken.close') }}</el-button>
        <el-button type="primary" @click="copyToken">{{ t('common.apiToken.copy') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permitVisible" :title="t('common.apiToken.permissions')" width="min(680px, 94vw)">
      <el-checkbox v-model="viewTreeExpanded" @change="onTreeExpandChange($event, true)">
        {{ t('common.button.expand') }}/{{ t('common.button.collapse') }}
      </el-checkbox>
      <el-tree v-if="viewPermitsTree.length" ref="viewPermitTree" :data="viewPermitsTree" node-key="id"
        show-checkbox check-strictly default-expand-all :props="{ label: 'label', children: 'children', disabled: () => true }">
        <template #default="{ data }"><span>{{ t(data.label) }}</span></template>
      </el-tree>
      <el-empty v-else :description="t('common.apiToken.selectPermission')" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.api-token-page { width: 100%; }
.token-card { margin-bottom: 20px; }
.token-card :deep(.el-card__header) { padding: 16px 20px; }
.token-card :deep(.el-card__body) { padding: 20px; }
.card-heading, .heading-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.card-heading { min-height: 24px; font-weight: 600; }
.full-width { width: 100%; }
.permissions-box { box-sizing: border-box; width: 100%; height: clamp(160px, 28vh, 240px); overflow: auto; border: 1px solid var(--el-border-color-light); border-radius: 0 0 6px 6px; }
.permissions-toolbar { display: flex; align-items: center; justify-content: flex-end; box-sizing: border-box; width: 100%; padding: 8px 12px; border: 1px solid var(--el-border-color-light); border-bottom: 0; border-radius: 6px 6px 0 0; background: var(--el-bg-color); color: var(--el-text-color-secondary); font-size: 12px; }
.permissions-toolbar > span { margin-right: auto; min-width: 0; }
.permissions-toolbar :deep(.el-checkbox) { flex: 0 0 auto; margin: 0; white-space: nowrap; }
.permissions-box :deep(.el-tree) { padding: 8px; }
.permissions-box :deep(.el-tree-node__content) { height: 34px; }
.permissions-box :deep(.el-tree-node__label) { flex: 1; min-width: 0; }
.permit-node { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; width: 100%; padding-right: 8px; }
.permit-node > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.scope-select { width: 125px; flex: 0 0 125px; }
.form-actions { display: flex; justify-content: flex-end; padding-top: 8px; }
.token-table { width: 100%; }
.token-warning { margin-bottom: 16px; }
.permit-list { display: flex; flex-direction: column; gap: 8px; max-height: 440px; overflow: auto; }
.permit-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; }
.permit-item code { color: var(--el-text-color-secondary); font-size: 12px; }
@media (max-width: 991px) { .token-card { margin-bottom: 20px; } }
</style>
