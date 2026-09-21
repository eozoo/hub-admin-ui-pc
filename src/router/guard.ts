import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/modules/auth'
import { usePermissionStore } from '@/stores/modules/permission'
import { tokenStorage } from '@/utils/storage'
import { i18n } from '@/locales'

const routeRemovers: Array<() => void> = []

export function setupRouterGuard(router: Router): void {
  window.addEventListener('hub-auth-changed', (event) => {
    const kind = (event as CustomEvent<string>).detail
    if (kind === 'refresh') return
    routeRemovers.splice(0).forEach((remove) => remove())
    usePermissionStore(pinia).reset()
    if (kind === 'logout' && !router.currentRoute.value.meta.public) void router.replace({ name: 'Login' })
    if (kind === 'login' && !router.currentRoute.value.meta.public) void router.replace({ name: 'Login' })
  })
  router.beforeEach(async (to) => {
    NProgress.start()
    const title = String(to.meta.title ?? '')
    const localizedTitle = title && i18n.global.te(title) ? i18n.global.t(title) : title
    document.title = `${localizedTitle}${localizedTitle ? ' - ' : ''}${i18n.global.t('common.appName')}`

    if (to.name === 'OAuthCallback' || to.name === 'BindExternal') return true

    const accessToken = tokenStorage.getAccessToken()
    if (!accessToken) {
      if (to.meta.public) return true
      return { name: 'Login', query: { redirect: to.fullPath }, replace: true }
    }

    if (to.name === 'Login' || to.name === 'Mfa') return { name: 'Dashboard', replace: true }

    const userStore = useAuthStore(pinia)
    const permissionStore = usePermissionStore(pinia)
    if (!userStore.loaded) {
      try {
        const profile = await userStore.loadProfile()
        if (profile.needChangePasswd === 1) {
          ElMessage.warning(i18n.global.t('auth.login.changePasswordTip'))
        }
        const routes = permissionStore.generateRoutes(profile.menus)
        routes.forEach((route) => routeRemovers.push(router.addRoute(route)))
        return {
          path: to.path,
          query: to.query,
          hash: to.hash,
          replace: true
        }
      } catch (error) {
        if (tokenStorage.getRefreshToken()) {
          ElMessage.error(error instanceof Error ? error.message : i18n.global.t('auth.login.stateChanged'))
          return false
        }
        userStore.reset(null)
        permissionStore.reset()
        routeRemovers.splice(0).forEach((remove) => remove())
        return { name: 'Login', query: { redirect: to.fullPath }, replace: true }
      }
    }
    return true
  })

  router.afterEach(() => NProgress.done())
  router.onError(() => NProgress.done())
}
