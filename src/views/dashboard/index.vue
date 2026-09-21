<script setup lang="ts">
import { useUserStore } from '@/stores/modules/user'
const userStore = useUserStore()
</script>

<template>
  <section><h1>你好，{{ userStore.profile?.userName }}</h1><p>欢迎进入 Hub 管理系统。业务模块将通过后端菜单动态加载。</p><el-card class="placeholder"><b>工程骨架已就绪</b><span>请求、认证、动态路由、字典与按钮权限能力均已接入。</span></el-card></section>
</template>

<style scoped>h1{margin:0 0 8px;color:#172b43;font-size:26px}p{margin:0 0 24px;color:#7c8998}.placeholder{max-width:680px}.placeholder b,.placeholder span{display:block}.placeholder span{margin-top:10px;color:#7c8998}</style>
