export const supportedLocales = ['zh-CN', 'en-US'] as const
export type AppLocale = (typeof supportedLocales)[number]

const LOCALE_KEY = 'app_locale'

function normalizeLocale(locale?: string | null): AppLocale {
  return locale?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN'
}

export function getLocale(): AppLocale {
  return normalizeLocale(window.localStorage.getItem(LOCALE_KEY) || window.navigator.language)
}

export function setLocale(locale: AppLocale): void {
  window.localStorage.setItem(LOCALE_KEY, locale)
  document.documentElement.lang = locale
}
