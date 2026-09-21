import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import type { MenuRoute } from '@/types/router'

const views = import.meta.glob('../views/**/*.vue')

function resolveView(component: string) {
  const normalized = component.replace(/^\//, '').replace(/\.vue$/, '')
  const candidates = [`../views/${normalized}.vue`, `../views/${normalized}/index.vue`]
  const match = candidates.find(path => views[path])
  return match ? views[match] : () => import('@/views/error/404.vue')
}

export function transformMenuRoutes(menus: MenuRoute[]): RouteRecordRaw[] {
  return menus.map(menu => {
    const route: RouteRecordRaw = {
      path: menu.path,
      name: menu.name,
      redirect: menu.redirect,
      meta: { ...menu.meta, hidden: menu.hidden, alwaysShow: menu.alwaysShow },
      component:
        menu.component === 'Layout'
          ? AppLayout
          : menu.component === 'ParentView'
            ? { template: '<router-view />' }
            : menu.component
              ? resolveView(menu.component)
              : { template: '<router-view />' },
      children: menu.children?.length ? transformMenuRoutes(menu.children) : undefined
    } as RouteRecordRaw
    return route
  })
}
