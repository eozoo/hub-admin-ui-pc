import { computed, onMounted } from 'vue'
import { useDictStore } from '@/stores/modules/dict'

export function useDict(...types: string[]) {
  const store = useDictStore()
  const dictionaries = Object.fromEntries(types.map((type) => [type, computed(() => store.cache[type] ?? [])]))

  onMounted(() => {
    void Promise.all(types.map((type) => store.load(type)))
  })

  return dictionaries
}
