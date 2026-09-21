import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getAuthMenus } from '@/api/auth'
import { transformMenuRoutes } from '@/router/transform'
import type { MenuRoute } from '@/types/router'
import type { RouteRecordRaw } from 'vue-router'

export const usePermissionStore = defineStore('permission', () => {
  const menuRoutes = ref<MenuRoute[]>([])
  const accessRoutes = ref<RouteRecordRaw[]>([])
  const generated = ref(false)

  async function generateRoutes() {
    const { data } = await getAuthMenus()
    menuRoutes.value = data
    accessRoutes.value = transformMenuRoutes(data)
    generated.value = true
    return accessRoutes.value
  }

  function reset() {
    menuRoutes.value = []
    accessRoutes.value = []
    generated.value = false
  }

  return { menuRoutes, accessRoutes, generated, generateRoutes, reset }
})
