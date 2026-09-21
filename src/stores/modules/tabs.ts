import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface PageTab {
  fullPath: string
  title: string
  key?: string
  affix?: boolean
}

const dashboard: PageTab = { fullPath: '/dashboard', title: 'common.route.dashboard', affix: true }

export const useTabsStore = defineStore('tabs', () => {
  const visited = ref<PageTab[]>([{ ...dashboard }])
  const refreshKey = ref(0)

  function add(tab: PageTab) {
    if (tab.fullPath === dashboard.fullPath) {
      pinHome()
      return
    }
    const existing = visited.value.find(item => tab.key ? item.key === tab.key : item.fullPath === tab.fullPath)
    if (existing) {
      if (tab.key) {
        existing.fullPath = tab.fullPath
        existing.title = tab.title
      }
      return
    }
    visited.value.push(tab)
  }

  function pinHome() {
    visited.value = [{ ...dashboard }, ...visited.value.filter(item => item.fullPath !== dashboard.fullPath)]
  }

  function close(fullPath: string) {
    visited.value = visited.value.filter(item => item.affix || item.fullPath !== fullPath)
  }

  function closeOthers(fullPath: string) {
    visited.value = visited.value.filter(item => item.affix || item.fullPath === fullPath)
  }

  function closeLeft(fullPath: string) {
    const index = visited.value.findIndex(item => item.fullPath === fullPath)
    if (index < 0) return
    visited.value = visited.value.filter((item, position) => item.affix || position >= index)
  }

  function closeRight(fullPath: string) {
    const index = visited.value.findIndex(item => item.fullPath === fullPath)
    if (index < 0) return
    visited.value = visited.value.filter((item, position) => item.affix || position <= index)
  }

  function closeAll() {
    visited.value = [{ ...dashboard }]
  }

  function refresh() {
    refreshKey.value += 1
  }

  function reset() {
    closeAll()
    refreshKey.value = 0
  }

  return { visited, refreshKey, add, pinHome, close, closeOthers, closeLeft, closeRight, closeAll, refresh, reset }
})
