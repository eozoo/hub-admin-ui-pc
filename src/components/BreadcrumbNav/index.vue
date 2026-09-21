<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t, te } = useI18n()

const crumbs = computed(() => {
  return route.matched
    .filter(item => typeof item.meta.title === 'string' && item.meta.title)
    .map(item => ({ path: item.path, title: String(item.meta.title), redirect: item.redirect }))
})

function title(value: string): string {
  return te(value) ? t(value) : value
}

async function openCrumb(path: string, redirect: unknown) {
  if (redirect === 'noRedirect') return
  await router.push(typeof redirect === 'string' && redirect ? redirect : path)
}
</script>

<template>
  <el-breadcrumb separator="/" class="header-breadcrumb">
    <el-breadcrumb-item v-for="(crumb, index) in crumbs" :key="`${crumb.path}-${index}`">
      <span v-if="index === crumbs.length - 1 || crumb.redirect === 'noRedirect'" class="crumb-current">
        {{ title(crumb.title) }}
      </span>
      <a v-else href="#" @click.prevent="openCrumb(crumb.path, crumb.redirect)">
        {{ title(crumb.title) }}
      </a>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped lang="scss">
.header-breadcrumb { margin-left: 4px; white-space: nowrap; }
.crumb-current { color: var(--app-text-secondary); }
</style>
