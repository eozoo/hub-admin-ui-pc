<script setup lang="ts">
import { computed } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { TableColumnOption } from './useTableColumns'

const props = defineProps<{
  modelValue: string[]
  columns: TableColumnOption[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const { t } = useI18n()

const selected = computed({
  get: () => props.modelValue,
  set: (keys: string[]) => {
    if (keys.length) emit('update:modelValue', keys)
  }
})

function reset() {
  emit('update:modelValue', props.columns.map(column => column.key))
}
</script>

<template>
  <el-popover trigger="click" placement="bottom-end" :width="210">
    <template #reference>
      <el-button circle size="small" :icon="Setting" :title="t('common.table.columns')" :aria-label="t('common.table.columns')" />
    </template>
    <div class="column-settings">
      <div class="settings-header">
        <strong>{{ t('common.table.columns') }}</strong>
        <el-button link type="primary" @click="reset">{{ t('common.table.resetColumns') }}</el-button>
      </div>
      <el-checkbox-group v-model="selected" class="column-list">
        <el-checkbox v-for="column in columns" :key="column.key" :value="column.key"
          :disabled="selected.length === 1 && selected.includes(column.key)">
          {{ t(column.label) }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.settings-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.column-list { display: flex; max-height: 320px; flex-direction: column; overflow-y: auto; }
.column-list :deep(.el-checkbox) { height: 28px; margin-right: 0; }
</style>
