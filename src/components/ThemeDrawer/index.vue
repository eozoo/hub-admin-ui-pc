<script setup lang="ts">
import { computed } from 'vue'
import { Check, RefreshLeft } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/modules/settings'
import { isMemorialDay, THEME_COLOR_PRESETS, type NavigationMode, type SidebarTheme } from '@/utils/theme'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const memorialMode = isMemorialDay()

function close(): void {
  emit('update:modelValue', false)
}

function setSidebarTheme(theme: SidebarTheme): void {
  settingsStore.setSidebarTheme(theme)
}

function setNavigationMode(mode: NavigationMode): void {
  settingsStore.setNavigationMode(mode)
}
</script>

<template>
  <el-drawer :model-value="modelValue" :title="t('common.theme.title')" size="320px" @close="close">
    <section class="setting-section">
      <h3>{{ t('common.theme.navigation') }}</h3>
      <div class="style-options">
        <button
          v-for="mode in ['side', 'top'] as NavigationMode[]"
          :key="mode"
          class="style-option"
          :class="{ active: settings.navigationMode === mode }"
          type="button"
          @click="setNavigationMode(mode)"
        >
          <span class="style-preview" :class="`navigation-preview--${mode}`">
            <i class="preview-sidebar" />
            <i class="preview-header" />
            <i class="preview-content" />
          </span>
          <span>{{ t(`common.theme.${mode}Navigation`) }}</span>
          <el-icon v-if="settings.navigationMode === mode"><Check /></el-icon>
        </button>
      </div>
    </section>

    <section class="setting-section">
      <h3>{{ t('common.theme.sidebarStyle') }}</h3>
      <div class="style-options">
        <button
          v-for="theme in ['light', 'dark'] as SidebarTheme[]"
          :key="theme"
          class="style-option"
          :class="{ active: settings.sidebarTheme === theme }"
          type="button"
          @click="setSidebarTheme(theme)"
        >
          <span class="style-preview" :class="`style-preview--${theme}`">
            <i class="preview-sidebar" />
            <i class="preview-header" />
            <i class="preview-content" />
          </span>
          <span>{{ t(`common.theme.${theme}Sidebar`) }}</span>
          <el-icon v-if="settings.sidebarTheme === theme"><Check /></el-icon>
        </button>
      </div>
    </section>

    <section class="setting-section">
      <h3>{{ t('common.theme.color') }}</h3>
      <div class="color-setting">
        <div class="color-presets">
          <button
            v-for="color in THEME_COLOR_PRESETS"
            :key="color"
            class="color-dot"
            :class="{ active: settings.primaryColor === color }"
            :style="{ backgroundColor: color }"
            type="button"
            :aria-label="color"
            @click="settingsStore.setPrimaryColor(color)"
          >
            <el-icon v-if="settings.primaryColor === color"><Check /></el-icon>
          </button>
        </div>
        <el-color-picker
          :model-value="settings.primaryColor"
          :predefine="THEME_COLOR_PRESETS"
          @change="settingsStore.setPrimaryColor"
        />
      </div>
    </section>

    <section class="setting-section">
      <h3>{{ t('common.theme.accessibility') }}</h3>
      <div class="switch-row">
        <span>{{ t('common.theme.greyMode') }}</span>
        <el-switch :model-value="settings.greyMode" @change="settingsStore.setGreyMode(Boolean($event))" />
      </div>
      <div class="switch-row">
        <span>{{ t('common.theme.weakMode') }}</span>
        <el-switch :model-value="settings.weakMode" @change="settingsStore.setWeakMode(Boolean($event))" />
      </div>
      <div class="switch-row memorial-row">
        <span>
          {{ t('common.theme.memorialMode') }}
          <small>{{ t('common.theme.memorialHint') }}</small>
        </span>
        <el-tag :type="memorialMode ? 'info' : 'success'" effect="plain">
          {{ memorialMode ? t('common.theme.active') : t('common.theme.auto') }}
        </el-tag>
      </div>
    </section>

    <button class="reset-button" type="button" @click="settingsStore.reset">
      <el-icon><RefreshLeft /></el-icon>
      {{ t('common.theme.reset') }}
    </button>
  </el-drawer>
</template>

<style scoped lang="scss">
.setting-section {
  padding: 4px 0 24px;
  border-bottom: 1px solid var(--app-border);
  margin-bottom: 24px;
}

.setting-section h3 {
  margin: 0 0 16px;
  color: var(--app-text);
  font-size: 14px;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.style-option {
  position: relative;
  padding: 8px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: #fff;
  color: var(--app-text-secondary);
  cursor: pointer;
  text-align: left;
}

.style-option.active {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 1px var(--app-primary);
  color: var(--app-primary);
}

.style-option > .el-icon {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.style-preview {
  position: relative;
  display: block;
  height: 68px;
  margin-bottom: 8px;
  overflow: hidden;
  border-radius: 5px;
  background: var(--app-bg);
}

.style-preview i {
  position: absolute;
  display: block;
}

.preview-sidebar {
  inset: 0 auto 0 0;
  width: 25%;
  background: #ffffff;
}

.style-preview--dark .preview-sidebar {
  background: #25324b;
}

.navigation-preview--top .preview-sidebar {
  display: none;
}

.navigation-preview--top .preview-header {
  inset: 0 0 auto;
  height: 20px;
  background: var(--app-primary);
}

.navigation-preview--top .preview-content {
  inset: 30px 10px 9px;
}

.preview-header {
  inset: 0 0 auto 25%;
  height: 19px;
  background: #fff;
  border-bottom: 1px solid var(--app-border);
}

.preview-content {
  inset: 28px 10px 9px calc(25% + 10px);
  border: 1px dashed var(--app-primary);
  border-radius: 3px;
  background: var(--el-color-primary-light-9);
}

.color-setting,
.switch-row,
.reset-button {
  display: flex;
  align-items: center;
}

.color-setting,
.switch-row {
  justify-content: space-between;
}

.color-presets {
  display: flex;
  gap: 8px;
}

.color-dot {
  display: grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px transparent;
  color: #fff;
  cursor: pointer;
}

.color-dot.active {
  box-shadow: 0 0 0 1px currentColor;
}

.switch-row {
  min-height: 42px;
  color: var(--app-text-secondary);
  font-size: 14px;
}

.memorial-row > span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.memorial-row small {
  color: var(--app-text-muted);
  font-size: 11px;
}

.reset-button {
  width: 100%;
  height: 40px;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: #fff;
  color: var(--app-text-secondary);
  cursor: pointer;
}

.reset-button:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}
</style>
