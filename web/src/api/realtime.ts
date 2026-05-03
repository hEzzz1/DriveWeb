import type { AlertSummary } from '../types/alerts'

export interface RealtimeAlertMessage {
  eventType: 'ALERT_CREATED' | 'ALERT_UPDATED'
  eventTime: string
  alert: AlertSummary
}

export function buildAlertSocketUrl(token: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const wsPath = '/ws/alerts'

  if (!base || base.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${wsPath}?token=${encodeURIComponent(token)}`
  }

  const url = new URL(base, window.location.origin)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${url.host}${wsPath}?token=${encodeURIComponent(token)}`
}
