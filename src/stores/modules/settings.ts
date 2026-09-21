import { reactive } from 'vue'
import { defineStore } from 'pinia'
import {
  applyTheme,
  type ComponentSize,
  DEFAULT_THEME_SETTINGS,
  type NavigationMode,
  type SidebarTheme,
  type ThemeSettings
} from '@/utils/theme'

const STORAGE_KEY = 'layout_settings'
const THEME_MIGRATION_KEY = 'layout_settings_palette_v5'

function loadSettings(): ThemeSettings {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<ThemeSettings>
    // 仅迁移一次历史默认色，之后用户仍可从预设色中选回。
    if (!window.localStorage.getItem(THEME_MIGRATION_KEY)) {
      const previousDefault = ['#0c76e3', '#3b7188', '#287d9c', '#5b8ff9']
        .includes(stored.primaryColor?.toLowerCase() ?? '')
      if (previousDefault) {
        stored.primaryColor = DEFAULT_THEME_SETTINGS.primaryColor
      }
      if (previousDefault && stored.sidebarTheme === 'light') {
        stored.sidebarTheme = DEFAULT_THEME_SETTINGS.sidebarTheme
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      window.localStorage.setItem(THEME_MIGRATION_KEY, '1')
    }
    return { ...DEFAULT_THEME_SETTINGS, ...stored }
  } catch {
    return { ...DEFAULT_THEME_SETTINGS }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = reactive<ThemeSettings>(loadSettings())

  function save(): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    applyTheme(settings)
  }

  function initialize(): void {
    applyTheme(settings)
  }

  function setPrimaryColor(primaryColor: string | null): void {
    settings.primaryColor = primaryColor || DEFAULT_THEME_SETTINGS.primaryColor
    save()
  }

  function setNavigationMode(navigationMode: NavigationMode): void {
    settings.navigationMode = navigationMode
    save()
  }

  function setSidebarTheme(sidebarTheme: SidebarTheme): void {
    settings.sidebarTheme = sidebarTheme
    save()
  }

  function setComponentSize(componentSize: ComponentSize): void {
    settings.componentSize = componentSize
    save()
  }

  function setGreyMode(greyMode: boolean): void {
    settings.greyMode = greyMode
    if (greyMode) settings.weakMode = false
    save()
  }

  function setWeakMode(weakMode: boolean): void {
    settings.weakMode = weakMode
    if (weakMode) settings.greyMode = false
    save()
  }

  function reset(): void {
    Object.assign(settings, DEFAULT_THEME_SETTINGS)
    save()
  }

  return {
    settings,
    initialize,
    setNavigationMode,
    setPrimaryColor,
    setSidebarTheme,
    setComponentSize,
    setGreyMode,
    setWeakMode,
    reset
  }
})
