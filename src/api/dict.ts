import { request } from '@/utils/http'

export interface DictItem {
  dictCode: string
  dictLabel: string
  dictValue: string | number
  css?: string
  tagType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export function getDictByType(type: string) {
  return request<DictItem[]>({
    url: `/admin/api/v1/dict/type/${encodeURIComponent(type)}`,
    method: 'GET'
  })
}
