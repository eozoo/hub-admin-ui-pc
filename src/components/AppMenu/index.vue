<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MenuRoute } from '@/types/router'

defineOptions({ name: 'AppMenu' })

const props = withDefaults(
  defineProps<{
    menus: MenuRoute[]
    basePath?: string
  }>(),
  {
    basePath: ''
  }
)

const { t, te } = useI18n()

function resolvePath(path: string): string {
  if (/^(https?:|mailto:|tel:)/.test(path) || path.startsWith('/')) return path
  return `${props.basePath}/${path}`.replace(/\/+/g, '/')
}

function menuTitle(menu: MenuRoute): string {
  const title = menu.meta?.title ?? menu.name ?? ''
  return title && te(title) ? t(title) : title
}
</script>

<template>
  <template v-for="menu in menus" :key="menu.name || menu.path">
    <el-sub-menu v-if="!menu.hidden && menu.children?.length" :index="resolvePath(menu.path)">
      <template #title>
        <svg-icon v-if="menu.meta?.icon" :icon-class="menu.meta.icon" class="menu-icon" />
        <span v-else class="menu-icon-placeholder" aria-hidden="true" />
        <span>{{ menuTitle(menu) }}</span>
      </template>
      <AppMenu :menus="menu.children" :base-path="resolvePath(menu.path)" />
    </el-sub-menu>
    <el-menu-item v-else-if="!menu.hidden" :index="resolvePath(menu.path)">
      <svg-icon v-if="menu.meta?.icon" :icon-class="menu.meta.icon" class="menu-icon" />
      <span v-else class="menu-icon-placeholder" aria-hidden="true" />
      <template #title>{{ menuTitle(menu) }}</template>
    </el-menu-item>
  </template>
</template>

<style scoped>
.menu-icon,
.menu-icon-placeholder {
  display: inline-block;
  flex: 0 0 1em;
  width: 1em;
  height: 1em;
  margin-right: 8px;
  font-size: 17px;
}
</style>
