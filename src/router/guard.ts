import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { pinia } from '@/stores'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { tokenStorage } from '@/utils/storage'

const routeRemovers: Array<() => void> = []

export function setupRouterGuard(router: Router): void {
  router.beforeEach(async to => {
    NProgress.start()
    document.title = `${String(to.meta.title ?? '')}${to.meta.title ? ' - ' : ''}${import.meta.env.VITE_APP_TITLE}`

    const accessToken = tokenStorage.getAccessToken()
    if (!accessToken) {
      if (to.meta.public) return true
      return { name: 'Login', query: { redirect: to.fullPath }, replace: true }
    }

    if (to.name === 'Login' || to.name === 'Mfa') return { name: 'Dashboard', replace: true }

    const userStore = useUserStore(pinia)
    const permissionStore = usePermissionStore(pinia)
    if (!userStore.loaded) {
      try {
        await userStore.loadProfile()
        const routes = await permissionStore.generateRoutes()
        routes.forEach(route => routeRemovers.push(router.addRoute(route)))
        return { ...to, replace: true }
      } catch {
        userStore.reset()
        permissionStore.reset()
        routeRemovers.splice(0).forEach(remove => remove())
        return { name: 'Login', query: { redirect: to.fullPath }, replace: true }
      }
    }
    return true
  })

  router.afterEach(() => NProgress.done())
  router.onError(() => NProgress.done())
}
