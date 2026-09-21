<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()
</script>

<template>
  <nav class="profile-sections" :aria-label="t('common.header.personalCenter')">
    <router-link :to="{ name: 'Profile' }" :class="{ active: route.name === 'Profile' }">
      {{ t('common.profile.basic') }}
    </router-link>
    <router-link :to="{ name: 'AccessToken' }" :class="{ active: route.name === 'AccessToken' }">
      {{ t('common.apiToken.title') }}
    </router-link>
    <router-link :to="{ name: 'AccountBinding' }" :class="{ active: route.name === 'AccountBinding' }">
      {{ t('common.binding.title') }}
    </router-link>
  </nav>
</template>

<style scoped>
.profile-sections { display: flex; gap: 24px; width: 100%; margin-bottom: 20px; border-bottom: 1px solid var(--app-border); }
.profile-sections a { display: inline-flex; align-items: center; min-height: 42px; padding: 0 4px; border-bottom: 2px solid transparent; color: var(--app-text-secondary); font-size: 14px; text-decoration: none; transition: color .2s; }
.profile-sections a:hover { color: var(--app-primary); }
.profile-sections a.active { border-bottom-color: var(--app-primary); color: var(--app-primary); font-weight: 600; }
</style>
