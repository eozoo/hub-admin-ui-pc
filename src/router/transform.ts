import { RouterView, type RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import type { MenuRoute } from '@/types/router'

const views = import.meta.glob('../views/**/*.vue')

const EXTERNAL_LINK_PATTERN = /^(https?:|mailto:|tel:)/

const legacyViewMapping: Record<string, string> = {
  'system/user': 'rbac/user',
  'system/role': 'rbac/role',
  'system/menu': 'rbac/menu',
  'system/dept': 'rbac/dept',
  'system/post': 'rbac/post',
  'system/scope': 'rbac/scope',
  'system/tenant': 'rbac/tenant',
  'system/dict': 'sys/dict',
  'system/config': 'sys/config',
  'system/attach': 'sys/attach',
  'system/feedback': 'sys/feedback',
  'system/ldap': 'auth/ldap',
  'system/oauth/gitlab': 'auth/oauth',
  'system/oauth/index': 'auth/oauth',
  'system/notice': 'notice'
}

function normalizeView(component: string): string {
  const normalized = component.replace(/^\//, '').replace(/\.vue$/, '')
  const mapping = Object.entries(legacyViewMapping).find(
    ([legacy]) => normalized === legacy || normalized.startsWith(`${legacy}/`)
  )
  return mapping ? normalized.replace(mapping[0], mapping[1]) : normalized
}

function resolveView(component: string) {
  const normalized = normalizeView(component)
  const candidates = [`../views/${normalized}.vue`, `../views/${normalized}/index.vue`]
  const match = candidates.find((path) => views[path])
  return match ? views[match] : () => import('@/views/error/404.vue')
}

function isExternalLink(path: string): boolean {
  return EXTERNAL_LINK_PATTERN.test(path)
}

function normalizeRoutePath(path: string, root: boolean): string {
  if (!root || path.startsWith('/')) return path
  return `/${path}`
}

export function transformMenuRoutes(menus: MenuRoute[], root = true): RouteRecordRaw[] {
  return menus.flatMap((menu) => {
    // 外部链接由菜单组件直接打开，不注册为 Vue Router 路由。
    if (isExternalLink(menu.path)) {
      return []
    }

    const route: RouteRecordRaw = {
      path: normalizeRoutePath(menu.path, root),
      name: menu.name,
      redirect: menu.redirect,
      meta: { ...menu.meta, hidden: menu.hidden, alwaysShow: menu.alwaysShow },
      component:
        menu.component === 'Layout'
          ? AppLayout
          : menu.component === 'ParentView'
            ? RouterView
            : menu.component
              ? resolveView(menu.component)
              : RouterView,
      children: menu.children?.length ? transformMenuRoutes(menu.children, false) : undefined
    } as RouteRecordRaw
    return [route]
  })
}
