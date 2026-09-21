<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Grid, Key, User } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/modules/auth'

const { t, te, locale } = useI18n()
const userStore = useAuthStore()
const tenantTitle = computed(() => {
  const title = userStore.profile?.tenantTitle || ''
  return title && te(title) ? t(title) : title
})
const now = new Date()
const dateText = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(now)
)
const greeting = computed(() => {
  const hour = now.getHours()
  if (hour < 12) return t('common.dashboard.morning')
  if (hour < 18) return t('common.dashboard.afternoon')
  return t('common.dashboard.evening')
})
</script>

<template>
  <div class="dashboard">
    <section class="welcome-card">
      <div class="welcome-copy">
        <p>{{ dateText }}</p>
        <h1>{{ greeting }}，{{ userStore.profile?.userName }}</h1>
        <span>{{ t('common.dashboard.description') }}</span>
      </div>
      <div class="welcome-meta">
        <div>
          <el-icon><Grid /></el-icon>
          <span>{{ t('common.dashboard.currentTenant') }}</span>
          <strong>{{ tenantTitle }}</strong>
        </div>
        <div>
          <el-icon><User /></el-icon>
          <span>{{ t('common.dashboard.roles') }}</span>
          <strong>{{ userStore.roles.length }}</strong>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <article>
        <span class="summary-icon">
          <el-icon><Key /></el-icon>
        </span>
        <div>
          <strong>{{ userStore.permissions.length }}</strong>
          <span>{{ t('common.dashboard.permissions') }}</span>
        </div>
      </article>
      <article>
        <span class="summary-icon summary-icon--green">
          <el-icon><Calendar /></el-icon>
        </span>
        <div>
          <strong>{{ t('common.dashboard.ready') }}</strong>
          <span>{{ t('common.dashboard.systemStatus') }}</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  width: 100%;
  min-height: calc(100vh - 108px);
}

.welcome-card {
  display: flex;
  min-height: 210px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: #f3f6fd;
  box-shadow: 0 4px 16px rgba(42, 74, 110, 0.04);
  color: var(--app-text);
}

.welcome-copy {
  position: relative;
  flex: 1;
  padding: 38px 42px;
}

.welcome-copy::after {
  position: absolute;
  right: 38px;
  bottom: -110px;
  width: 220px;
  height: 220px;
  border: 1px solid rgba(91, 143, 249, 0.08);
  content: '';
  transform: rotate(45deg);
}

.welcome-copy p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  letter-spacing: 0.6px;
}

.welcome-copy h1 {
  margin: 18px 0 10px;
  font-size: 30px;
  font-weight: 650;
  color: var(--app-text);
}

.welcome-copy > span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.welcome-meta {
  display: grid;
  width: 380px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  padding: 32px;
  border-left: 1px solid var(--app-border);
  background: rgba(255, 255, 255, 0.45);
}

.welcome-meta > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 9px;
  padding: 10px 22px;
  border-left: 1px solid var(--app-border);
}

.welcome-meta > div:first-child {
  border-left: 0;
}

.welcome-meta .el-icon {
  font-size: 22px;
  color: var(--app-primary);
}

.welcome-meta span {
  color: var(--app-text-muted);
  font-size: 12px;
}

.welcome-meta strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;
}

.summary-grid article {
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 98px;
  padding: 20px 24px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  box-shadow: 0 4px 16px rgba(42, 74, 110, 0.04);
}

.summary-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 7px;
  background: var(--el-color-primary-light-9);
  color: var(--app-primary);
  font-size: 20px;
}

.summary-icon--green {
  background: var(--el-color-success-light-9);
  color: #2d9b70;
}

.summary-grid article > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-grid strong {
  color: var(--app-text);
  font-size: 20px;
}

.summary-grid article div span {
  color: var(--app-text-muted);
  font-size: 12px;
}

@media (max-width: 900px) {
  .welcome-card {
    flex-direction: column;
  }

  .welcome-meta {
    width: 100%;
    border-top: 1px solid var(--app-border);
    border-left: 0;
  }
}

@media (max-width: 640px) {
  .welcome-copy {
    padding: 30px 26px;
  }

  .welcome-copy h1 {
    font-size: 24px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
