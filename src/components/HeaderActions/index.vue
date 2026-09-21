<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bell, Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { changeLocale } from '@/locales'
import { usePermissionStore } from '@/stores/modules/permission'
import { useSettingsStore } from '@/stores/modules/settings'
import type { MenuRoute } from '@/types/router'
import type { AppLocale } from '@/utils/locale'
import type { ComponentSize } from '@/utils/theme'

interface SearchOption {
  path: string
  title: string
}

const GITHUB_URL = 'https://github.com/cowave5/hub'
const EXTERNAL_LINK_PATTERN = /^(https?:|mailto:|tel:)/
const fixedPopperOptions = { strategy: 'fixed' as const }

const props = withDefaults(
  defineProps<{
    systemMenuActive?: boolean
  }>(),
  {
    systemMenuActive: false
  }
)

const emit = defineEmits<{
  toggleSystemMenu: []
}>()

const router = useRouter()
const { t, te, locale } = useI18n()
const permissionStore = usePermissionStore()
const settingsStore = useSettingsStore()
const fullscreen = ref(Boolean(document.fullscreenElement))
const searchVisible = ref(false)
const searchValue = ref('')
const searchSelect = ref()
const feedbackVisible = ref(false)

function resolvePath(basePath: string, path: string): string {
  if (EXTERNAL_LINK_PATTERN.test(path) || path.startsWith('/')) return path
  return `${basePath}/${path}`.replace(/\/+/g, '/')
}

function resolveTitle(title: string): string {
  return te(title) ? t(title) : title
}

function buildSearchOptions(menus: MenuRoute[], basePath = '', parents: string[] = []): SearchOption[] {
  return menus.flatMap((menu) => {
    if (menu.hidden) return []

    const path = resolvePath(basePath, menu.path)
    const title = menu.meta?.title ?? menu.name ?? ''
    const titles = title ? [...parents, resolveTitle(title)] : parents
    const children = menu.children?.length ? buildSearchOptions(menu.children, path, titles) : []
    const current = title && (!menu.children?.length || menu.redirect) ? [{ path, title: titles.join(' / ') }] : []

    return [...current, ...children]
  })
}

const searchOptions = computed(() => buildSearchOptions(permissionStore.menuRoutes))

function changeLanguage(nextLocale: AppLocale): void {
  changeLocale(nextLocale)
}

function changeComponentSize(size: ComponentSize): void {
  settingsStore.setComponentSize(size)
}

async function toggleSearch(): Promise<void> {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) {
    await nextTick()
    searchSelect.value?.focus()
  } else {
    searchValue.value = ''
  }
}

async function selectSearchResult(path: string): Promise<void> {
  searchValue.value = ''
  searchVisible.value = false
  if (EXTERNAL_LINK_PATTERN.test(path)) {
    window.open(path, '_blank', 'noopener,noreferrer')
    return
  }
  await router.push(path)
}

async function toggleFullscreen(): Promise<void> {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  } else {
    await document.documentElement.requestFullscreen()
  }
}

function openSourceCode(): void {
  window.open(GITHUB_URL, '_blank', 'noopener,noreferrer')
}

function syncFullscreen(): void {
  fullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<template>
  <div class="header-actions">
    <div class="header-search">
      <el-tooltip :content="t('common.header.searchMenu')" placement="bottom" :popper-options="fixedPopperOptions">
        <button class="header-action" type="button" @click.stop="toggleSearch">
          <svg-icon icon-class="search" />
        </button>
      </el-tooltip>
      <el-select
        v-if="searchVisible"
        ref="searchSelect"
        v-model="searchValue"
        class="search-select"
        filterable
        :placeholder="t('common.header.searchPlaceholder')"
        @change="selectSearchResult"
      >
        <el-option v-for="option in searchOptions" :key="option.path" :label="option.title" :value="option.path" />
      </el-select>
    </div>

    <el-dropdown trigger="click" :popper-options="fixedPopperOptions" @command="changeComponentSize">
      <button class="header-action" type="button" :title="t('common.header.componentSize')">
        <svg-icon icon-class="size" />
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="large" :disabled="settingsStore.settings.componentSize === 'large'">
            {{ t('common.header.sizeLarge') }}
          </el-dropdown-item>
          <el-dropdown-item command="default" :disabled="settingsStore.settings.componentSize === 'default'">
            {{ t('common.header.sizeDefault') }}
          </el-dropdown-item>
          <el-dropdown-item command="small" :disabled="settingsStore.settings.componentSize === 'small'">
            {{ t('common.header.sizeSmall') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-tooltip
      :content="fullscreen ? t('common.header.exitFullscreen') : t('common.header.fullscreen')"
      placement="bottom"
      :popper-options="fixedPopperOptions"
    >
      <button class="header-action" type="button" @click="toggleFullscreen">
        <svg-icon :icon-class="fullscreen ? 'exit-fullscreen' : 'fullscreen'" />
      </button>
    </el-tooltip>

    <el-tooltip :content="t('common.header.sourceCode')" placement="bottom" :popper-options="fixedPopperOptions">
      <button class="header-action" type="button" @click="openSourceCode">
        <svg-icon icon-class="github" />
      </button>
    </el-tooltip>

    <el-dropdown trigger="click" :popper-options="fixedPopperOptions" @command="changeLanguage">
      <button class="header-action" type="button" :title="t('common.language')">
        <svg-icon icon-class="language" />
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="zh-CN">
            简体中文
            <el-icon v-if="locale === 'zh-CN'"><Check /></el-icon>
          </el-dropdown-item>
          <el-dropdown-item command="en-US">
            English
            <el-icon v-if="locale === 'en-US'"><Check /></el-icon>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-tooltip :content="t('common.header.feedback')" placement="bottom" :popper-options="fixedPopperOptions">
      <button class="header-action" type="button" @click="feedbackVisible = true">
        <svg-icon icon-class="star" />
      </button>
    </el-tooltip>

    <el-popover placement="bottom-end" :width="300" trigger="click" :popper-options="fixedPopperOptions">
      <template #reference>
        <button class="header-action" type="button" :aria-label="t('common.header.notifications')">
          <svg-icon icon-class="notification" />
        </button>
      </template>
      <div class="notification-panel">
        <div class="notification-header">
          <strong>{{ t('common.header.notifications') }}</strong>
          <span>{{ t('common.header.notificationPlaceholder') }}</span>
        </div>
        <div class="notification-empty">
          <span class="notification-icon">
            <el-icon><Bell /></el-icon>
          </span>
          <strong>{{ t('common.header.noNotifications') }}</strong>
          <span>{{ t('common.header.notificationHint') }}</span>
        </div>
      </div>
    </el-popover>

    <el-tooltip
      :content="t(props.systemMenuActive ? 'common.header.businessMenu' : 'common.header.systemManagement')"
      placement="bottom"
      :popper-options="fixedPopperOptions"
    >
      <button
        class="header-action"
        :class="{ 'is-active': props.systemMenuActive }"
        type="button"
        @click="emit('toggleSystemMenu')"
      >
        <svg-icon icon-class="system" />
      </button>
    </el-tooltip>
  </div>

  <el-dialog v-model="feedbackVisible" :title="t('common.header.feedback')" width="440px" append-to-body align-center>
    <div class="placeholder-dialog">
      <span class="placeholder-icon"><svg-icon icon-class="star" /></span>
      <strong>{{ t('common.header.feedbackPlaceholder') }}</strong>
      <span>{{ t('common.header.feedbackHint') }}</span>
    </div>
    <template #footer>
      <el-button type="primary" @click="feedbackVisible = false">{{ t('common.action.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.header-action {
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-secondary);
  cursor: pointer;
  font-size: 18px;
}

.header-action:hover {
  background: var(--el-color-primary-light-9);
  color: var(--app-primary);
}

.header-action.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--app-primary);
}

.header-search {
  display: flex;
  align-items: center;
}

.search-select {
  width: 220px;
  margin-right: 6px;
}

.search-select :deep(.el-select__wrapper) {
  border-radius: 0;
  box-shadow: 0 1px 0 var(--app-border);
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-border);
}

.notification-header strong {
  color: var(--app-text);
  font-size: 14px;
}

.notification-header span,
.notification-empty > span:last-child,
.placeholder-dialog > span:last-child {
  color: var(--app-text-muted);
  font-size: 11px;
}

.notification-empty,
.placeholder-dialog {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.notification-empty strong,
.placeholder-dialog strong {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.notification-icon,
.placeholder-icon {
  display: grid;
  width: 44px;
  height: 44px;
  margin-bottom: 4px;
  place-items: center;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--app-primary);
  font-size: 20px;
}
</style>
