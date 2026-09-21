import { createI18n } from 'vue-i18n'
import commonZhCN from './zh-CN/common'
import authZhCN from './zh-CN/auth'
import navigationZhCN from './zh-CN/navigation'
import commonEnUS from './en-US/common'
import authEnUS from './en-US/auth'
import navigationEnUS from './en-US/navigation'
import { getLocale, setLocale, type AppLocale } from '@/utils/locale'

const locale = getLocale()
setLocale(locale)

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': { common: commonZhCN, auth: authZhCN, ...navigationZhCN },
    'en-US': { common: commonEnUS, auth: authEnUS, ...navigationEnUS }
  }
})

export function changeLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  setLocale(locale)
}

export function translate(key: string): string {
  return i18n.global.t(key)
}
