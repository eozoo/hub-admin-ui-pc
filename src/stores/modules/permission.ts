import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { transformMenuRoutes } from '@/router/transform'
import type { MenuRoute } from '@/types/router'
import type { RouteRecordRaw } from 'vue-router'

export const usePermissionStore = defineStore('permission', () => {
  const menuRoutes = ref<MenuRoute[]>([])
  const accessRoutes = ref<RouteRecordRaw[]>([])
  const generated = ref(false)

  const systemMenu = computed(() => menuRoutes.value.find((menu) => menu.path.replace(/^\//, '') === 'system'))
  const normalMenuRoutes = computed(() => menuRoutes.value.filter((menu) =>
    !['system', 'dashboard'].includes(menu.path.replace(/^\//, ''))
  ))
  const systemMenuRoutes = computed(() => systemMenu.value?.children ?? [])
  const systemMenuBasePath = computed(() => {
    const path = systemMenu.value?.path ?? '/system'
    return path.startsWith('/') ? path : `/${path}`
  })

  function generateRoutes(menus: MenuRoute[]) {
    menuRoutes.value = menus
    accessRoutes.value = transformMenuRoutes(menus)
    generated.value = true
    return accessRoutes.value
  }

  function reset() {
    menuRoutes.value = []
    accessRoutes.value = []
    generated.value = false
  }

  return {
    menuRoutes,
    normalMenuRoutes,
    systemMenuRoutes,
    systemMenuBasePath,
    accessRoutes,
    generated,
    generateRoutes,
    reset
  }
})
