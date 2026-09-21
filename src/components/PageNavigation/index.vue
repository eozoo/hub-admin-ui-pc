<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTabsStore, type PageTab } from '@/stores/modules/tabs'

const route = useRoute()
const router = useRouter()
const tabs = useTabsStore()
tabs.pinHome()
const { t, te } = useI18n()
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const selected = ref<PageTab | null>(null)
const menuWidth = 160
const menuHeight = 252
const selectedIndex = computed(() => tabs.visited.findIndex(item => item.fullPath === selected.value?.fullPath))
const canCloseLeft = computed(() => tabs.visited.some((item, index) => index < selectedIndex.value && !item.affix))
const canCloseRight = computed(() => tabs.visited.some((item, index) => index > selectedIndex.value && !item.affix))

function title(value: string): string {
  return te(value) ? t(value) : value
}

watch(() => route.fullPath, () => {
  if (route.meta.public || route.name === 'NotFound' || !route.name) return
  const isProfileSection = route.name === 'Profile' || route.name === 'AccessToken' || route.name === 'AccountBinding'
  tabs.add({
    fullPath: route.fullPath,
    title: isProfileSection ? 'common.profile.title' : String(route.meta.title || route.name),
    key: isProfileSection ? 'personal-center' : undefined,
    affix: route.path === '/dashboard'
  })
}, { immediate: true })

function closeMenu() { menuVisible.value = false }
onUnmounted(() => document.removeEventListener('click', closeMenu))

function openMenu(tab: PageTab, event: MouseEvent) {
  event.preventDefault()
  selected.value = tab
  menuX.value = Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8))
  menuY.value = Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8))
  menuVisible.value = true
  document.removeEventListener('click', closeMenu)
  document.addEventListener('click', closeMenu, { once: true })
}

async function goToRemaining() {
  if (tabs.visited.some(item => item.fullPath === route.fullPath)) return
  await router.push(tabs.visited.at(-1)?.fullPath || '/dashboard')
}

async function closeTab(tab: PageTab) {
  if (tab.affix) return
  tabs.close(tab.fullPath)
  await goToRemaining()
}

async function refreshTab(tab: PageTab) {
  if (route.fullPath !== tab.fullPath) await router.push(tab.fullPath)
  tabs.refresh()
}

async function perform(action: string) {
  const tab = selected.value
  closeMenu()
  if (!tab) return
  if (action === 'refresh') await refreshTab(tab)
  if (action === 'close') await closeTab(tab)
  if (action === 'others') {
    tabs.closeOthers(tab.fullPath)
    if (route.fullPath !== tab.fullPath) await router.push(tab.fullPath)
  }
  if (action === 'left') {
    tabs.closeLeft(tab.fullPath)
    await goToRemaining()
  }
  if (action === 'right') {
    tabs.closeRight(tab.fullPath)
    await goToRemaining()
  }
  if (action === 'all') {
    tabs.closeAll()
    await router.push('/dashboard')
  }
}

</script>

<template>
  <div class="page-navigation">
    <div class="tabs-scroll">
      <div class="tabs-list">
        <div v-for="tab in tabs.visited" :key="tab.fullPath" class="page-tab"
          :class="{ active: route.fullPath === tab.fullPath }" @contextmenu="openMenu(tab, $event)"
          @click="router.push(tab.fullPath)" @auxclick.middle="closeTab(tab)">
          <span class="tab-title">{{ title(tab.title) }}</span>
          <button v-if="!tab.affix" class="tab-close" type="button" :aria-label="t('common.tabs.close')" @click.stop="closeTab(tab)">×</button>
        </div>
      </div>
    </div>
    <div v-if="menuVisible" class="tab-context-menu" :style="{ left: `${menuX}px`, top: `${menuY}px` }" @click.stop>
      <button type="button" @click="perform('refresh')">{{ t('common.tabs.refresh') }}</button>
      <button v-if="!selected?.affix" type="button" @click="perform('close')">{{ t('common.tabs.close') }}</button>
      <button type="button" @click="perform('others')">{{ t('common.tabs.closeOthers') }}</button>
      <button type="button" @click="perform('all')">{{ t('common.tabs.closeAll') }}</button>
      <button v-if="canCloseLeft" type="button" @click="perform('left')">{{ t('common.tabs.closeLeft') }}</button>
      <button v-if="canCloseRight" type="button" @click="perform('right')">{{ t('common.tabs.closeRight') }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-navigation { flex: none; min-width: 0; background: var(--app-surface); border-bottom: 1px solid var(--app-border); }
.tabs-scroll { overflow-x: auto; scrollbar-width: thin; }
.tabs-list { display: flex; width: max-content; min-width: 100%; gap: 6px; padding: 4px 16px 7px; }
.page-tab { display: flex; align-items: center; gap: 7px; height: 27px; padding: 0 9px; border: 1px solid var(--app-border); border-radius: 4px; color: var(--app-text-secondary); font-size: 12px; white-space: nowrap; cursor: pointer; user-select: none; }
.page-tab.active { border-color: var(--app-primary); background: var(--app-primary); color: #fff; }
.tab-close { width: 16px; height: 16px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; line-height: 15px; cursor: pointer; }
.tab-close:hover { background: rgb(128 128 128 / 20%); }
.tab-context-menu { position: fixed; z-index: 3000; width: 160px; padding: 4px; border: 1px solid var(--app-border); border-radius: 6px; background: var(--app-surface); box-shadow: 0 8px 24px rgb(0 0 0 / 14%); }
.tab-context-menu button { width: 100%; padding: 7px 10px; border: 0; border-radius: 4px; background: transparent; color: var(--app-text); text-align: left; font-size: 12px; cursor: pointer; }
.tab-context-menu button:hover,
.tab-context-menu button:focus-visible { background: color-mix(in srgb, var(--app-primary) 10%, var(--app-surface)); color: var(--app-text); }
</style>
