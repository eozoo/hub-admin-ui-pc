<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import defaultFavicon from '@/assets/icons/svg/sat.svg?url'
import { useAuthStore } from '@/stores/modules/auth'
import { useSettingsStore } from '@/stores/modules/settings'
import { useSocketStore } from '@/stores/modules/socket'

const route = useRoute()
const { locale, t, te } = useI18n()
const elementLocale = computed(() => (locale.value === 'en-US' ? en : zhCn))
const authStore = useAuthStore()
const socketStore = useSocketStore()
const settingsStore = useSettingsStore()
settingsStore.initialize()
onMounted(() => socketStore.openNotice())

function resolveText(value: string): string {
  return value && te(value) ? t(value) : value
}

function updateFavicon(href?: string): void {
  if (!href) return

  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }
  favicon.href = href
}

watchEffect(() => {
  const routeTitle = resolveText(String(route.meta.title ?? ''))
  const tenantTitle = resolveText(authStore.profile?.tenantTitle || t('common.appName'))
  document.title = `${routeTitle}${routeTitle ? ' - ' : ''}${tenantTitle}`
  updateFavicon(authStore.profile?.tenantFavicon || defaultFavicon)
})
</script>

<template>
  <el-config-provider :locale="elementLocale" :size="settingsStore.settings.componentSize">
    <router-view />
  </el-config-provider>
</template>
