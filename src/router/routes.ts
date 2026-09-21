import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login/index.vue'),
    meta: { public: true, title: 'auth.login.title' }
  },
  {
    path: '/mfa',
    name: 'Mfa',
    component: () => import('@/views/auth/mfa/index.vue'),
    meta: { public: true, title: 'auth.mfa.title' }
  },
  {
    path: '/oauth/:providerCode',
    name: 'OAuthCallback',
    component: () => import('@/views/auth/oauth/callback.vue'),
    meta: { public: true, title: 'auth.oauth.processing' }
  },
  {
    path: '/bind',
    name: 'BindExternal',
    component: () => import('@/views/auth/bind/index.vue'),
    meta: { public: true, title: 'auth.bind.title' }
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/home/dashboard/index.vue'),
        meta: { title: 'common.route.dashboard', icon: 'House' }
      },
      {
        path: '/meter/task',
        name: 'WorkbenchTask',
        component: () => import('@/views/flow/workbench/task/index.vue'),
        meta: { title: 'commons.menu.flow.owner.task', icon: 'task' }
      },
      {
        path: 'user/profile',
        name: 'Profile',
        component: () => import('@/views/auth/profile/index.vue'),
        meta: { title: 'common.profile.title' }
      },
      {
        path: 'user/profile/tokens',
        name: 'AccessToken',
        component: () => import('@/views/auth/token/index.vue'),
        meta: { title: 'common.apiToken.title' }
      },
      {
        path: 'user/profile/bindings',
        name: 'AccountBinding',
        component: () => import('@/views/auth/binding/index.vue'),
        meta: { title: 'common.binding.title' }
      },
      {
        path: 'user/token',
        redirect: { name: 'AccessToken' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true, title: 'common.route.notFound' }
  }
]
