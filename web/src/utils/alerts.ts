import type { AlertActionRecord, AlertDetail, AlertRiskLevel, AlertStatus } from '../types/alerts'

export type UiTagType = '' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

export function getRiskTagType(level: AlertRiskLevel | number | null | undefined): UiTagType {
  if (level === 3) {
    return 'danger'
  }

  if (level === 2) {
    return 'warning'
  }

  return 'info'
}

export function getStatusTagType(status: AlertStatus | number | null | undefined): UiTagType {
  if (status === 1) {
    return 'success'
  }

  if (status === 2) {
    return 'warning'
  }

  if (status === 3) {
    return 'info'
  }

  return 'danger'
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-'
  }

  const ms = Date.parse(value)

  if (Number.isNaN(ms)) {
    return '-'
  }

  return new Date(ms).toLocaleString()
}

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }

  const base = value <= 1 ? value * 100 : value
  return `${base.toFixed(1)}%`
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }

  return value.toFixed(digits)
}

export function extractAlertTimeline(detail: AlertDetail): AlertActionRecord[] {
  const candidates: unknown[] = [
    detail.timeline,
    detail.logs,
    detail.history,
    detail.actionLogs,
    detail.disposeLogs,
    detail.records,
  ]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue
    }

    const normalized = candidate
      .map((item) => normalizeTimelineItem(item))
      .filter((item): item is AlertActionRecord => item !== null)
      .sort((a, b) => Date.parse(b.actionTime) - Date.parse(a.actionTime))

    if (normalized.length) {
      return normalized
    }
  }

  return []
}

function normalizeTimelineItem(value: unknown): AlertActionRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const source = value as Record<string, unknown>
  const actionTime = firstString(source, [
    'actionTime',
    'operateTime',
    'createdAt',
    'time',
    'timestamp',
  ])

  if (!actionTime) {
    return null
  }

  const action = firstString(source, ['action', 'type', 'statusText', 'status']) || '状态变更'
  const operator = firstString(source, ['operator', 'operatorName', 'username', 'user'])
  const remark = firstString(source, ['remark', 'comment', 'memo'])

  return {
    action,
    actionTime,
    operator,
    remark,
  }
}

function firstString(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return undefined
}
