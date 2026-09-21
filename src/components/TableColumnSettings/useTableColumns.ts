import { ref, watch } from 'vue'

export interface TableColumnOption {
  key: string
  label: string
}

export function useTableColumns(storageKey: string, options: TableColumnOption[]) {
  const allKeys = options.map(option => option.key)

  function readSaved(): string[] {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as unknown
      if (Array.isArray(saved)) {
        const valid = allKeys.filter(key => saved.includes(key))
        if (valid.length) return valid
      }
    } catch {
      // 存储不可用或内容损坏时使用默认列。
    }
    return [...allKeys]
  }

  const visibleKeys = ref<string[]>(readSaved())
  watch(visibleKeys, keys => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(keys))
    } catch {
      // 私密模式等场景下仍允许当前页面调整列。
    }
  })

  function isVisible(key: string): boolean {
    return visibleKeys.value.includes(key)
  }

  return { visibleKeys, isVisible }
}
