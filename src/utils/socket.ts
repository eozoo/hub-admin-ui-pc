import { io, type Socket } from 'socket.io-client'
import { tokenStorage } from '@/utils/storage'

const sockets = new Map<string, Socket>()

function url(namespace: string): string {
  const base = import.meta.env.VITE_SOCKET_BASE || window.location.origin
  return `${base}${namespace}`
}

export function connect(namespace: string): Socket | null {
  const token = tokenStorage.getAccessToken()
  if (!token) return null
  const current = sockets.get(namespace)
  if (current) return current
  const socket = io(url(namespace), {
    autoConnect: true,
    path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.25,
    timeout: 10000
  })
  sockets.set(namespace, socket)
  socket.on('connect', () => {
    console.info(`[socket:${namespace}] connected`, socket.id)
  })
  socket.on('connect_error', (error) => console.warn(`[socket:${namespace}]`, error.message))
  socket.on('disconnect', (reason) => {
    console.info(`[socket:${namespace}] disconnected`, reason)
  })
  return socket
}

export function request<T>(namespace: string, event: string, payload?: unknown, timeout = 10000): Promise<T> {
  const socket = connect(namespace)
  if (!socket) return Promise.reject(new Error('登录状态已失效'))
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Socket 请求超时')), timeout)
    socket.emit(event, payload, (response: T) => {
      window.clearTimeout(timer)
      resolve(response)
    })
  })
}

export function refresh(): void {
  const token = tokenStorage.getAccessToken()
  sockets.forEach((socket) => {
    socket.auth = { token }
    socket.disconnect().connect()
  })
}

export function disconnect(namespace?: string): void {
  if (namespace) {
    sockets.get(namespace)?.disconnect()
    sockets.delete(namespace)
    return
  }
  sockets.forEach((socket) => socket.disconnect())
  sockets.clear()
}

export function poll<T>(namespace: string, event: string, payload: unknown, handler: (data: T) => void, interval = 30000): () => void {
  let stopped = false
  let timer: number | undefined
  const execute = () => {
    if (stopped) return
    request<T>(namespace, event, payload)
      .then(handler)
      .catch(() => undefined)
      .finally(() => {
        if (!stopped) timer = window.setTimeout(execute, interval)
      })
  }
  execute()
  return () => {
    stopped = true
    if (timer) window.clearTimeout(timer)
  }
}
