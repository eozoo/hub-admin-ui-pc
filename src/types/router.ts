import type { RouteRecordRaw } from 'vue-router'

export interface MenuRoute {
  path: string
  name?: string
  component?: string
  redirect?: string
  hidden?: boolean
  alwaysShow?: boolean
  meta?: {
    title?: string
    icon?: string
    noCache?: boolean
    activeMenu?: string
    permissions?: string[]
    roles?: string[]
  }
  children?: MenuRoute[]
}

export type AppRouteRecord = RouteRecordRaw & {
  hidden?: boolean
  alwaysShow?: boolean
}
