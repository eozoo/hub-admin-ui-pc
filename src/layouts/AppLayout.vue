<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Grid, House, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const displayName = computed(() => userStore.profile?.userName || '管理员')

async function handleCommand(command: string) {
  if (command === 'logout') {
    await userStore.signOut()
    permissionStore.reset()
    await router.replace({ name: 'Login' })
  }
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-brand"><span class="brand-mark"><el-icon><Grid /></el-icon></span><b>HUB</b></div>
      <el-menu router default-active="/dashboard" class="sidebar-menu">
        <el-menu-item index="/dashboard"><el-icon><House /></el-icon><span>工作台</span></el-menu-item>
      </el-menu>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div><strong>{{ userStore.profile?.tenantTitle || 'Cowave' }}</strong><span class="topbar-subtitle">管理控制台</span></div>
        <el-dropdown @command="handleCommand">
          <button class="user-menu"><span class="avatar"><el-icon><User /></el-icon></span>{{ displayName }}<el-icon><ArrowDown /></el-icon></button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </header>
      <main class="content"><router-view /></main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.app-shell { display: flex; min-height: 100vh; background: #f4f7fb; }
.sidebar { width: 228px; background: #0f1f38; color: white; }
.sidebar-brand { height: 68px; display: flex; align-items: center; gap: 12px; padding: 0 24px; letter-spacing: 3px; font-size: 18px; }
.brand-mark { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(135deg, #16a6c9, #3675ef); }
.sidebar-menu { border: 0; background: transparent; --el-menu-text-color: #a9b6ca; --el-menu-hover-bg-color: #182c4d; --el-menu-active-color: #fff; }
.workspace { flex: 1; min-width: 0; }
.topbar { height: 68px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; background: white; border-bottom: 1px solid #e7ecf3; }
.topbar-subtitle { margin-left: 12px; color: #8b98aa; font-size: 13px; }
.user-menu { border: 0; background: transparent; display: flex; align-items: center; gap: 9px; color: #334155; cursor: pointer; }
.avatar { width: 32px; height: 32px; display: grid; place-items: center; color: #fff; border-radius: 50%; background: #3278eb; }
.content { padding: 24px; }
</style>
