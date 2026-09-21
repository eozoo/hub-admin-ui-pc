<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, User } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import ThemeDrawer from '@/components/ThemeDrawer/index.vue'
import AppMenu from '@/components/AppMenu/index.vue'
import HeaderActions from '@/components/HeaderActions/index.vue'
import PageNavigation from '@/components/PageNavigation/index.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav/index.vue'
import { useAuthStore } from '@/stores/modules/auth'
import { usePermissionStore } from '@/stores/modules/permission'
import { useSettingsStore } from '@/stores/modules/settings'
import { useTabsStore } from '@/stores/modules/tabs'
import type { MenuRoute } from '@/types/router'

const router = useRouter()
const { t, te } = useI18n()
const userStore = useAuthStore()
const permissionStore = usePermissionStore()
const settingsStore = useSettingsStore()
const tabsStore = useTabsStore()
const displayName = computed(() => userStore.profile?.userName || '管理员')
const navigationMode = computed(() => settingsStore.settings.navigationMode)
const systemMenuActive = ref(false)
const selectedTopMenu = ref<MenuRoute | null>(null)
const sideMenuRoutes = computed(() =>
  systemMenuActive.value ? permissionStore.systemMenuRoutes : permissionStore.normalMenuRoutes
)
const sidebarHomeMenu: MenuRoute = {
  path: '/dashboard',
  name: 'Dashboard',
  meta: { title: 'common.route.dashboard', icon: 'index' }
}
const sidebarMenuRoutes = computed(() => [sidebarHomeMenu, ...sideMenuRoutes.value])
const sideMenuBasePath = computed(() => (systemMenuActive.value ? permissionStore.systemMenuBasePath : ''))
const topMenuRoutes = computed(() => permissionStore.normalMenuRoutes)
const topSideMenuRoutes = computed(() => {
  if (systemMenuActive.value) return permissionStore.systemMenuRoutes
  return selectedTopMenu.value?.children ?? []
})
const topSideMenuBasePath = computed(() => {
  if (systemMenuActive.value) return permissionStore.systemMenuBasePath
  return selectedTopMenu.value ? resolveMenuPath(selectedTopMenu.value.path) : ''
})
const topActiveMenu = computed(() => {
  if (systemMenuActive.value) return ''
  if (router.currentRoute.value.path === '/dashboard') return '/dashboard'
  return selectedTopMenu.value ? resolveMenuPath(selectedTopMenu.value.path) : ''
})
const tenantLogo = computed(() => userStore.profile?.tenantLogo)
const tenantName = computed(() => {
  const title = userStore.profile?.tenantTitle || 'common.appName'
  return te(title) ? t(title) : title
})
const themeDrawerVisible = ref(false)
const fixedPopperOptions = { strategy: 'fixed' as const }

async function handleCommand(command: string) {
  if (command === 'profile') {
    await router.push({ name: 'Profile' })
    return
  }
  if (command === 'theme') {
    themeDrawerVisible.value = true
    return
  }
  if (command === 'logout') {
    if (!(await userStore.signOut())) return
    permissionStore.reset()
    await router.replace({ name: 'Login' })
  }
}

async function handleMenuSelect(index: string): Promise<void> {
  if (/^(https?:|mailto:|tel:)/.test(index)) {
    window.open(index, '_blank', 'noopener,noreferrer')
    return
  }
  const currentRoute = router.currentRoute.value
  if (currentRoute.path !== index) {
    await router.push(index)
  } else if (currentRoute.name === 'NotFound') {
    await router.replace(index)
  }
}

function resolveMenuPath(path: string, basePath = ''): string {
  if (/^(https?:|mailto:|tel:)/.test(path) || path.startsWith('/')) return path
  return `${basePath}/${path}`.replace(/\/+/g, '/')
}

function menuTitle(menu: MenuRoute): string {
  const title = menu.meta?.title ?? menu.name ?? ''
  return title && te(title) ? t(title) : title
}

function findFirstMenuPath(menus: MenuRoute[], basePath: string): string | undefined {
  for (const menu of menus) {
    if (menu.hidden) continue
    const path = resolveMenuPath(menu.path, basePath)
    if (menu.children?.length) {
      const childPath = findFirstMenuPath(menu.children, path)
      if (childPath) return childPath
    } else if (path && path !== '#') {
      return path
    }
  }
  return undefined
}

async function handleTopMenuSelect(index: string): Promise<void> {
  if (index === '/dashboard') return
  const menu = topMenuRoutes.value.find((item) => resolveMenuPath(item.path) === index)
  if (!menu) return

  systemMenuActive.value = false
  if (!menu.children?.length) {
    selectedTopMenu.value = null
    await handleMenuSelect(index)
    return
  }

  selectedTopMenu.value = menu
  const firstPath = findFirstMenuPath(menu.children, resolveMenuPath(menu.path))
  if (firstPath) await handleMenuSelect(firstPath)
}

async function openTopHome(): Promise<void> {
  systemMenuActive.value = false
  selectedTopMenu.value = null
  await goHome()
}

async function goHome(): Promise<void> {
  tabsStore.add({ fullPath: '/dashboard', title: 'common.route.dashboard' })
  if (router.currentRoute.value.path !== '/dashboard') {
    await router.push('/dashboard')
  }
}

async function toggleSystemMenu(): Promise<void> {
  const nextSystemMenuActive = !systemMenuActive.value
  systemMenuActive.value = nextSystemMenuActive

  if (nextSystemMenuActive) {
    const firstPath = findFirstMenuPath(permissionStore.systemMenuRoutes, permissionStore.systemMenuBasePath)
    if (firstPath) await handleMenuSelect(firstPath)
    return
  }

  if (navigationMode.value === 'top' && selectedTopMenu.value?.children?.length) {
    const firstPath = findFirstMenuPath(selectedTopMenu.value.children, resolveMenuPath(selectedTopMenu.value.path))
    if (firstPath) await handleMenuSelect(firstPath)
    return
  }

  await goHome()
}

watch(
  [() => router.currentRoute.value.path, () => permissionStore.normalMenuRoutes],
  ([path]) => {
    if (path === '/system' || path.startsWith('/system/')) {
      systemMenuActive.value = true
      return
    }

    systemMenuActive.value = false
    selectedTopMenu.value =
      permissionStore.normalMenuRoutes.find((menu) => {
        const menuPath = resolveMenuPath(menu.path)
        return !/^(https?:|mailto:|tel:)/.test(menuPath) && (path === menuPath || path.startsWith(`${menuPath}/`))
      }) ?? null
  },
  { immediate: true }
)
</script>

<template>
  <div class="app-shell" :class="`app-shell--${navigationMode}`">
    <aside v-if="navigationMode === 'side'" class="sidebar">
      <div class="sidebar-brand" role="button" tabindex="0" @click="goHome" @keydown.enter="goHome">
        <span class="brand-mark">
          <img v-if="tenantLogo" :src="tenantLogo" :alt="tenantName" />
          <svg-icon v-else icon-class="sat" />
        </span>
        <strong class="tenant-name">{{ tenantName }}</strong>
      </div>
      <el-menu :default-active="$route.path" class="sidebar-menu" @select="handleMenuSelect">
        <AppMenu :menus="sidebarMenuRoutes" :base-path="sideMenuBasePath" />
      </el-menu>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div class="topbar-main">
          <BreadcrumbNav v-if="navigationMode === 'side'" />
          <div
            v-if="navigationMode === 'top'"
            class="topbar-brand"
            :class="{ 'has-sidebar': topSideMenuRoutes.length > 0 }"
            role="button"
            tabindex="0"
            @click="goHome"
            @keydown.enter="goHome"
          >
            <span class="brand-mark">
              <img v-if="tenantLogo" :src="tenantLogo" :alt="tenantName" />
              <svg-icon v-else icon-class="sat" />
            </span>
            <strong class="tenant-name">{{ tenantName }}</strong>
          </div>
          <el-menu
            v-if="navigationMode === 'top'"
            mode="horizontal"
            :default-active="topActiveMenu"
            class="top-menu"
            @select="handleTopMenuSelect"
          >
            <el-menu-item index="/dashboard" @click="openTopHome">
              <svg-icon icon-class="index" class="top-menu-icon" />
              <template #title>{{ t('common.route.dashboard') }}</template>
            </el-menu-item>
            <el-menu-item
              v-for="menu in topMenuRoutes"
              v-show="!menu.hidden"
              :key="menu.name || menu.path"
              :index="resolveMenuPath(menu.path)"
            >
              <svg-icon v-if="menu.meta?.icon" :icon-class="menu.meta.icon" class="top-menu-icon" />
              <span v-else class="top-menu-icon" aria-hidden="true" />
              <template #title>{{ menuTitle(menu) }}</template>
            </el-menu-item>
          </el-menu>
        </div>
        <div class="topbar-actions">
          <HeaderActions :system-menu-active="systemMenuActive" @toggle-system-menu="toggleSystemMenu" />
          <el-dropdown :popper-options="fixedPopperOptions" @command="handleCommand">
            <button class="user-menu">
              <span class="avatar">
                <img v-if="userStore.profile?.avatar" :src="userStore.profile.avatar" :alt="displayName" />
                <el-icon v-else><User /></el-icon>
              </span>
              {{ displayName }}
              <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  {{ t('common.header.personalCenter') }}
                </el-dropdown-item>
                <el-dropdown-item command="theme">
                  {{ t('common.theme.preference') }}
                </el-dropdown-item>
                <el-dropdown-item command="logout">{{ t('common.action.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <div class="workspace-body">
        <aside v-if="navigationMode === 'top' && topSideMenuRoutes.length" class="sidebar top-side-menu">
          <el-menu :default-active="$route.path" class="sidebar-menu" @select="handleMenuSelect">
            <AppMenu :menus="topSideMenuRoutes" :base-path="topSideMenuBasePath" />
          </el-menu>
        </aside>
        <div class="content-column">
          <PageNavigation />
          <main class="content">
            <router-view v-slot="{ Component, route: viewRoute }">
              <component :is="Component" :key="`${viewRoute.fullPath}:${tabsStore.refreshKey}`" />
            </router-view>
          </main>
        </div>
      </div>
    </section>
    <ThemeDrawer v-model="themeDrawerVisible" />
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--app-bg);
}
.sidebar {
  flex: 0 0 216px;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--app-sidebar-border);
  background: var(--app-sidebar-bg);
  color: var(--app-sidebar-text);
  transition: background-color 0.2s ease;
}
.sidebar-brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  cursor: pointer;
}
.brand-mark {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: transparent;
  color: var(--app-primary);
  font-size: 28px;
}
.brand-mark img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}
.tenant-name {
  overflow: hidden;
  color: var(--app-sidebar-text);
  font-size: 15px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-menu {
  border: 0;
  background: var(--app-sidebar-bg);
  --el-menu-bg-color: var(--app-sidebar-bg);
  --el-menu-text-color: var(--app-sidebar-text);
  --el-menu-hover-bg-color: var(--app-sidebar-hover);
  --el-menu-active-color: var(--app-sidebar-active-text);
  --el-menu-base-level-padding: 18px;
  --el-menu-level-padding: 18px;
}
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 2px 0;
  border-radius: 0;
}
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--app-sidebar-active);
}
.workspace {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.app-shell--top {
  display: flex;
}
.topbar {
  flex: 0 0 60px;
  width: 100%;
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
}
.app-shell--top .topbar {
  padding-left: 18px;
}
.topbar-main,
.topbar-brand {
  display: flex;
  align-items: center;
}
.topbar-main {
  flex: 1;
  align-self: stretch;
  min-width: 0;
}
.topbar-brand {
  position: relative;
  flex: 0 0 216px;
  align-self: stretch;
  gap: 12px;
  margin-left: -18px;
  padding: 0 18px;
  background: var(--app-surface);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.topbar-brand:not(.has-sidebar) .tenant-name {
  color: var(--app-text);
}
.topbar-brand.has-sidebar {
  background: var(--app-sidebar-bg);
}
.topbar-brand.has-sidebar::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 1px;
  background: var(--app-sidebar-bg);
  content: '';
}
.top-menu {
  flex: 1;
  height: 100%;
  min-width: 0;
  border-bottom: 0;
  --el-menu-horizontal-height: 59px;
}
.top-menu :deep(.el-menu-item) {
  padding: 0 20px;
  border-bottom: 0;
}
.top-menu :deep(.el-menu-item.is-active) {
  border-bottom: 0;
}
.top-menu-icon {
  flex: 0 0 1em;
  width: 1em;
  height: 1em;
  margin-right: 8px;
  font-size: 17px;
}
.workspace-body {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.top-side-menu {
  flex: 0 0 216px;
  height: auto;
  min-height: 0;
}
.content-column {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.topbar-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
}
.user-menu {
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--app-text-secondary);
  cursor: pointer;
}
.avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex: none;
  overflow: hidden;
  color: #fff;
  border-radius: 50%;
  background: var(--app-primary);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 24px;
}
</style>
