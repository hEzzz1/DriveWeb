import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  NormalizedAlertRealtimeEvent,
  RealtimeConnectionStatus,
} from '../types/alerts'
import { normalizeAlertRealtimeEvent } from '../utils/alerts'
import { useAuthStore } from './auth'

type RealtimeListener = (event: NormalizedAlertRealtimeEvent) => void

const WS_PATH = '/ws/alerts'
const TOPIC_DESTINATION = '/topic/alerts'
const CONNECT_HEARTBEAT_MS = 10000
const MAX_DEDUPE_KEYS = 200
const MAX_RECONNECT_DELAY_MS = 15000

export const useRealtimeStore = defineStore('realtime', () => {
  const status = ref<RealtimeConnectionStatus>('disconnected')
  const lastConnectedAt = ref('')
  const lastMessageAt = ref('')
  const lastError = ref('')
  const reconnectAttempt = ref(0)

  const authStore = useAuthStore()
  const listeners = new Set<RealtimeListener>()
  const seenKeys: string[] = []
  let socket: WebSocket | null = null
  let reconnectTimer: number | null = null
  let heartbeatTimer: number | null = null
  let subscriptionId = 0
  let manuallyClosed = false
  let frameBuffer = ''

  const statusText = computed(() => {
    if (status.value === 'connected') {
      return '实时更新已连接'
    }

    if (status.value === 'connecting') {
      return '实时更新连接中'
    }

    if (status.value === 'reconnecting') {
      return '实时更新重连中'
    }

    return '实时更新已断开'
  })

  const statusTagType = computed(() => {
    if (status.value === 'connected') {
      return 'success'
    }

    if (status.value === 'connecting' || status.value === 'reconnecting') {
      return 'warning'
    }

    return 'info'
  })

  function ensureConnected(): void {
    if (!authStore.isAuthenticated || !authStore.token || authStore.workspaceDomain !== 'org') {
      disconnect()
      return
    }

    if (status.value === 'connecting' || status.value === 'connected' || status.value === 'reconnecting') {
      return
    }

    manuallyClosed = false
    openSocket(false)
  }

  function reconnect(): void {
    if (authStore.workspaceDomain !== 'org') {
      disconnect()
      return
    }

    disconnect(false)
    manuallyClosed = false
    openSocket(true)
  }

  function disconnect(manual = true): void {
    manuallyClosed = manual
    clearReconnectTimer()
    stopHeartbeat()

    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null
      socket.close()
      socket = null
    }

    frameBuffer = ''
    status.value = 'disconnected'
  }

  function subscribe(listener: RealtimeListener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function openSocket(isReconnect: boolean): void {
    if (!authStore.token || authStore.workspaceDomain !== 'org') {
      status.value = 'disconnected'
      return
    }

    clearReconnectTimer()
    stopHeartbeat()
    frameBuffer = ''
    status.value = isReconnect ? 'reconnecting' : 'connecting'

    try {
      socket = new WebSocket(buildWebSocketUrl(authStore.token))
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'WebSocket 初始化失败'
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      sendFrame('CONNECT', {
        'accept-version': '1.2,1.1',
        'heart-beat': `${CONNECT_HEARTBEAT_MS},${CONNECT_HEARTBEAT_MS}`,
      })
    }

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      frameBuffer += event.data
      flushFrames()
    }

    socket.onerror = () => {
      lastError.value = '实时连接异常'
    }

    socket.onclose = () => {
      stopHeartbeat()
      socket = null

      if (manuallyClosed || !authStore.isAuthenticated || authStore.workspaceDomain !== 'org') {
        status.value = 'disconnected'
        return
      }

      scheduleReconnect()
    }
  }

  function flushFrames(): void {
    while (frameBuffer.includes('\0')) {
      const frameEnd = frameBuffer.indexOf('\0')
      const rawFrame = frameBuffer.slice(0, frameEnd)
      frameBuffer = frameBuffer.slice(frameEnd + 1)

      if (!rawFrame.trim()) {
        continue
      }

      handleFrame(rawFrame)
    }
  }

  function handleFrame(frame: string): void {
    const normalizedFrame = frame.replace(/\r/g, '')
    const separatorIndex = normalizedFrame.indexOf('\n\n')
    const head = separatorIndex >= 0 ? normalizedFrame.slice(0, separatorIndex) : normalizedFrame
    const body = separatorIndex >= 0 ? normalizedFrame.slice(separatorIndex + 2) : ''
    const lines = head
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const command = lines.shift()

    if (!command) {
      return
    }

    if (command === 'CONNECTED') {
      reconnectAttempt.value = 0
      status.value = 'connected'
      lastConnectedAt.value = new Date().toISOString()
      lastError.value = ''
      startHeartbeat()
      subscribeAlerts()
      return
    }

    if (command === 'MESSAGE') {
      lastMessageAt.value = new Date().toISOString()

      try {
        const payload = JSON.parse(body)
        const event = normalizeAlertRealtimeEvent(payload)

        if (!event || hasSeenEvent(event.dedupeKey)) {
          return
        }

        rememberEvent(event.dedupeKey)
        listeners.forEach((listener) => listener(event))
      } catch {
        lastError.value = '实时消息解析失败'
      }

      return
    }

    if (command === 'ERROR') {
      lastError.value = body || '实时连接失败'
      socket?.close()
    }
  }

  function subscribeAlerts(): void {
    subscriptionId += 1
    sendFrame('SUBSCRIBE', {
      id: `alerts-sub-${subscriptionId}`,
      destination: TOPIC_DESTINATION,
      ack: 'auto',
    })
  }

  function scheduleReconnect(): void {
    clearReconnectTimer()
    reconnectAttempt.value += 1
    status.value = 'reconnecting'
    const delay = Math.min(1000 * 2 ** Math.max(reconnectAttempt.value - 1, 0), MAX_RECONNECT_DELAY_MS)

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      openSocket(true)
    }, delay)
  }

  function startHeartbeat(): void {
    stopHeartbeat()

    heartbeatTimer = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send('\n')
      }
    }, CONNECT_HEARTBEAT_MS)
  }

  function stopHeartbeat(): void {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function sendFrame(command: string, headers: Record<string, string>, body = ''): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${escapeHeaderValue(value)}`)
    const frame = `${command}\n${headerLines.join('\n')}\n\n${body}\0`
    socket.send(frame)
  }

  function hasSeenEvent(key: string): boolean {
    return seenKeys.includes(key)
  }

  function rememberEvent(key: string): void {
    seenKeys.push(key)

    if (seenKeys.length > MAX_DEDUPE_KEYS) {
      seenKeys.splice(0, seenKeys.length - MAX_DEDUPE_KEYS)
    }
  }

  return {
    status,
    statusText,
    statusTagType,
    lastConnectedAt,
    lastMessageAt,
    lastError,
    reconnectAttempt,
    ensureConnected,
    reconnect,
    disconnect,
    subscribe,
  }
})

function buildWebSocketUrl(token: string): string {
  const base = import.meta.env.VITE_WS_BASE_URL || `${window.location.origin}${WS_PATH}`
  const url = new URL(base, window.location.origin)

  if (!url.pathname.endsWith(WS_PATH)) {
    url.pathname = WS_PATH
  }

  if (url.protocol === 'http:') {
    url.protocol = 'ws:'
  } else if (url.protocol === 'https:') {
    url.protocol = 'wss:'
  }

  url.searchParams.set('token', token)
  return url.toString()
}

function escapeHeaderValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/:/g, '\\c')
}
