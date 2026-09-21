import { defineStore } from 'pinia'
import { ref } from 'vue'
import { connect, disconnect, refresh, request } from '@/utils/socket'

export const useSocketStore = defineStore('socket', () => {
  const noticeCount = ref(0)
  const connected = ref(false)
  const namespace = '/notice'
  let listenersRegistered = false

  function openNotice(): void {
    const socket = connect(namespace)
    if (!socket) return
    if (listenersRegistered) return
    listenersRegistered = true
    connected.value = socket.connected
    socket.once('connect', () => {
      connected.value = true
      void queryNoticeCount()
    })
    socket.once('disconnect', () => { connected.value = false })
    socket.on('noticeCount', (count: number) => { noticeCount.value = count })
    socket.on('newNotice', () => { void queryNoticeCount() })
    socket.on('flow_notice', () => { void queryNoticeCount() })
  }

  function queryNoticeCount(): Promise<number> {
    return request<number>(namespace, 'getNoticeCount', undefined).then((count) => {
      noticeCount.value = count
      return count
    })
  }

  function refreshToken(): void { refresh() }
  function close(): void {
    disconnect()
    listenersRegistered = false
    connected.value = false
  }

  return { noticeCount, connected, openNotice, queryNoticeCount, refreshToken, close }
})
