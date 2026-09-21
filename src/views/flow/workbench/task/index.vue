<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

const titleKey = 'commons.menu.flow.owner.task'
</script>

<template>
  <section class="task-page">
    <el-card shadow="never" class="task-card">
      <template #header>
        <span>{{ te(titleKey) ? t(titleKey) : '工作台' }}</span>
      </template>
      <el-empty description="暂无待办任务" />
    </el-card>
  </section>
</template>

<style scoped>
.task-page,
.task-card {
  width: 100%;
  min-height: 100%;
}

.task-card {
  border: 0;
}
</style>
