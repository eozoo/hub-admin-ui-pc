export type SidebarTheme = 'light' | 'dark'
export type NavigationMode = 'side' | 'top'
export type ComponentSize = 'large' | 'default' | 'small'

export interface ThemeSettings {
  navigationMode: NavigationMode
  primaryColor: string
  sidebarTheme: SidebarTheme
  componentSize: ComponentSize
  greyMode: boolean
  weakMode: boolean
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  navigationMode: 'side',
  primaryColor: '#5a77a8',
  sidebarTheme: 'dark',
  componentSize: 'default',
  greyMode: false,
  weakMode: false
}

export const THEME_COLOR_PRESETS = ['#5a77a8', '#5b8ff9', '#8b9cf6', '#287d9c', '#3b7188', '#0c76e3', '#409eff', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6']

// 清明、汶川地震纪念日、九一八和南京大屠杀死难者国家公祭日。
const MEMORIAL_DATES = new Set(['04-04', '05-12', '09-18', '12-13'])

function mixColor(color: string, target: string, weight: number): string {
  const source = color.replace('#', '')
  const destination = target.replace('#', '')
  const channels = [0, 2, 4].map((index) => {
    const sourceChannel = Number.parseInt(source.slice(index, index + 2), 16)
    const targetChannel = Number.parseInt(destination.slice(index, index + 2), 16)
    return Math.round(sourceChannel + (targetChannel - sourceChannel) * weight)
      .toString(16)
      .padStart(2, '0')
  })
  return `#${channels.join('')}`
}

export function isMemorialDay(date = new Date()): boolean {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return MEMORIAL_DATES.has(`${month}-${day}`)
}

export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement
  root.style.setProperty('--app-primary', settings.primaryColor)
  root.style.setProperty('--app-primary-hover', settings.primaryColor.toLowerCase() === '#5a77a8'
    ? '#496794' : mixColor(settings.primaryColor, '#000000', 0.12))
  root.style.setProperty('--el-color-primary', settings.primaryColor)
  root.style.setProperty('--el-color-primary-dark-2', mixColor(settings.primaryColor, '#000000', 0.2))
  for (let level = 1; level <= 9; level += 1) {
    root.style.setProperty(`--el-color-primary-light-${level}`, mixColor(settings.primaryColor, '#ffffff', level / 10))
  }

  root.dataset.sidebarTheme = settings.sidebarTheme
  root.classList.toggle('app-grey', settings.greyMode)
  root.classList.toggle('app-weak', settings.weakMode)
  root.classList.toggle('app-memorial', isMemorialDay())
}
