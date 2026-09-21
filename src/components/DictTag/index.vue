<script setup lang="ts">
import { computed } from 'vue'
import type { DictItem } from '@/api/dict'

const props = defineProps<{
  options: DictItem[]
  value: string | number | Array<string | number>
}>()

const values = computed(() => (Array.isArray(props.value) ? props.value : [props.value]))
const selected = computed(() => props.options.filter(item => values.value.map(String).includes(String(item.dictValue))))
</script>

<template>
  <span class="dict-tag">
    <el-tag v-for="item in selected" :key="item.dictCode" :type="item.tagType" :class="item.css">
      {{ item.dictLabel }}
    </el-tag>
  </span>
</template>

<style scoped>
.dict-tag {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
