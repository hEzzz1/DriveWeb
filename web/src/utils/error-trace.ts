import type { ApiError } from '../types/api'

export interface ErrorTraceRecord {
  id: string
  occurredAt: string
  message: string
  traceId: string
  method: string
  url: string
  status?: number
  code?: number
}

const STORAGE_KEY = 'driveweb.errorTraceRecords'
const MAX_RECORDS = 50

export function listErrorTraceRecords(): ErrorTraceRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearErrorTraceRecords(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function recordApiError(error: ApiError, method?: string, url?: string): void {
  const traceId = error.traceId?.trim()
  if (!traceId) {
    return
  }

  const records = listErrorTraceRecords()
  const nextRecord: ErrorTraceRecord = {
    id: `${traceId}-${Date.now()}`,
    occurredAt: new Date().toISOString(),
    message: error.message || '请求失败',
    traceId,
    method: (method || 'GET').toUpperCase(),
    url: url || '-',
    status: error.httpStatus,
    code: error.code,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([nextRecord, ...records].slice(0, MAX_RECORDS)))
}
