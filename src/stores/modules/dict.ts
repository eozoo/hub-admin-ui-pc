import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getDictByType, type DictItem } from '@/api/dict'

export const useDictStore = defineStore('dict', () => {
  const cache = ref<Record<string, DictItem[]>>({})
  const pending = new Map<string, Promise<DictItem[]>>()

  async function load(type: string, force = false): Promise<DictItem[]> {
    if (!force && cache.value[type]) return cache.value[type]
    if (!force && pending.has(type)) return pending.get(type)!

    const task = getDictByType(type)
      .then(({ data }) => {
        cache.value[type] = data
        return data
      })
      .finally(() => pending.delete(type))
    pending.set(type, task)
    return task
  }

  function clear(type?: string) {
    if (type) delete cache.value[type]
    else cache.value = {}
  }

  return { cache, load, clear }
})
