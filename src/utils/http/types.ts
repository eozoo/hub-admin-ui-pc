import type { AxiosRequestConfig } from 'axios'

export interface RequestConfig extends AxiosRequestConfig {
  requireToken?: boolean
  noRepeat?: boolean
  noNotify?: boolean
  skipAuthRefresh?: boolean
}
