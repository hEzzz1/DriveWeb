import type {
  AlertActionRecord,
  AlertActionType,
  AlertDetail,
  AlertRealtimeEnvelope,
  AlertRealtimePayload,
  AlertRiskLevel,
  AlertStatus,
  AlertSummary,
  NormalizedAlertRealtimeEvent,
} from '../types/alerts'
import {
  formatDateTime as formatDateTimeInBeijing,
  parseTimestamp,
} from './time'

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
  return formatDateTimeInBeijing(value)
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

export function formatTimestampMs(value: number | string | null | undefined): string {
  return formatDateTimeInBeijing(value)
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
      .sort((a, b) => (parseTimestamp(b.actionTime) || 0) - (parseTimestamp(a.actionTime) || 0))

    if (normalized.length) {
      return normalized
    }
  }

  return []
}

export function getAvailableAlertActions(
  status: AlertStatus | number | null | undefined,
): AlertActionType[] {
  if (status === 0) {
    return ['CONFIRM', 'FALSE_POSITIVE', 'CLOSE']
  }

  if (status === 1) {
    return ['FALSE_POSITIVE', 'CLOSE']
  }

  return []
}

export function getAlertActionLabel(actionType: AlertActionType): string {
  if (actionType === 'CONFIRM') {
    return '确认告警'
  }

  if (actionType === 'FALSE_POSITIVE') {
    return '标记误报'
  }

  return '关闭告警'
}

export function normalizeAlertRealtimeEvent(
  value: unknown,
): NormalizedAlertRealtimeEvent | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const source = value as AlertRealtimeEnvelope
  const eventType = normalizeEventType(source.eventType || source.type)
  const payload = normalizeRealtimePayload(source.data || source.payload)

  if (!eventType || !payload) {
    return null
  }

  const eventAt = firstMeaningfulString([
    payload.latestActionTime,
    source.timestamp,
    payload.triggerTime,
  ])

  return {
    eventType,
    traceId: source.traceId,
    alertId: payload.alertId,
    eventAt,
    dedupeKey: buildRealtimeDedupeKey(eventType, payload.alertId, eventAt),
    payload,
  }
}

export function mergeAlertSummaryFromRealtime(
  current: AlertSummary,
  payload: AlertRealtimePayload,
): AlertSummary {
  return {
    ...current,
    alertNo: payload.alertNo || current.alertNo,
    fleetId: normalizeIdentityValue(payload.fleetId, current.fleetId),
    vehicleId: normalizeIdentityValue(payload.vehicleId, current.vehicleId),
    driverId: normalizeIdentityValue(payload.driverId, current.driverId),
    riskLevel: normalizeRiskLevel(payload.riskLevel) ?? current.riskLevel,
    fatigueScore: normalizeNumber(payload.fatigueScore) ?? current.fatigueScore,
    distractionScore:
      normalizeNumber(payload.distractionScore) ?? current.distractionScore,
    status: normalizeStatus(payload.status) ?? current.status,
    triggerTime: payload.triggerTime || current.triggerTime,
  }
}

export function toAlertSummaryFromRealtime(payload: AlertRealtimePayload): AlertSummary | null {
  const riskLevel = normalizeRiskLevel(payload.riskLevel)
  const status = normalizeStatus(payload.status)
  const alertNo = sanitizeText(payload.alertNo)
  const fleetId = normalizeIdentityValue(payload.fleetId)
  const vehicleId = normalizeIdentityValue(payload.vehicleId)
  const driverId = normalizeIdentityValue(payload.driverId)
  const triggerTime = sanitizeText(payload.triggerTime)

  if (!alertNo || !riskLevel || status === null || !triggerTime || !vehicleId || !driverId || !fleetId) {
    return null
  }

  return {
    id: payload.alertId,
    alertNo,
    fleetId,
    vehicleId,
    driverId,
    riskLevel,
    fatigueScore: normalizeNumber(payload.fatigueScore) ?? 0,
    distractionScore: normalizeNumber(payload.distractionScore) ?? 0,
    status,
    triggerTime,
  }
}

export function matchesAlertFilters(
  alert: Pick<
    AlertSummary,
    'fleetId' | 'vehicleId' | 'driverId' | 'riskLevel' | 'status' | 'triggerTime'
  >,
  filters: {
    fleetId?: string
    vehicleId?: string
    driverId?: string
    riskLevel?: AlertRiskLevel
    status?: AlertStatus
    startTime?: string
    endTime?: string
  },
): boolean {
  const fleetId = sanitizeText(filters.fleetId)
  const vehicleId = sanitizeText(filters.vehicleId)
  const driverId = sanitizeText(filters.driverId)

  if (fleetId && alert.fleetId !== fleetId) {
    return false
  }

  if (vehicleId && alert.vehicleId !== vehicleId) {
    return false
  }

  if (driverId && alert.driverId !== driverId) {
    return false
  }

  if (filters.riskLevel !== undefined && alert.riskLevel !== filters.riskLevel) {
    return false
  }

  if (filters.status !== undefined && alert.status !== filters.status) {
    return false
  }

  const triggerTime = parseTimestamp(alert.triggerTime)

  if (filters.startTime) {
    const start = parseTimestamp(filters.startTime)

    if (start !== null && triggerTime !== null && triggerTime < start) {
      return false
    }
  }

  if (filters.endTime) {
    const end = parseTimestamp(filters.endTime)

    if (end !== null && triggerTime !== null && triggerTime > end) {
      return false
    }
  }

  return true
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

function normalizeRealtimePayload(value: AlertRealtimePayload | undefined): AlertRealtimePayload | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const alertId = Number(value.alertId)

  if (!Number.isInteger(alertId) || alertId <= 0) {
    return null
  }

  return {
    ...value,
    alertId,
    status: normalizeStatus(value.status) ?? undefined,
    riskLevel: normalizeRiskLevel(value.riskLevel) ?? undefined,
    riskScore: normalizeNumber(value.riskScore),
    fatigueScore: normalizeNumber(value.fatigueScore),
    distractionScore: normalizeNumber(value.distractionScore),
    fleetId: normalizeNullableIdentityValue(value.fleetId),
    vehicleId: normalizeNullableIdentityValue(value.vehicleId),
    driverId: normalizeNullableIdentityValue(value.driverId),
    latestActionBy: value.latestActionBy ?? undefined,
    latestActionTime: sanitizeText(value.latestActionTime),
    triggerTime: sanitizeText(value.triggerTime),
    alertNo: sanitizeText(value.alertNo),
    actionType: sanitizeText(value.actionType),
    remark: sanitizeText(value.remark),
  }
}

function normalizeEventType(value: string | undefined): 'ALERT_CREATED' | 'ALERT_UPDATED' | null {
  return value === 'ALERT_CREATED' || value === 'ALERT_UPDATED' ? value : null
}

function buildRealtimeDedupeKey(
  eventType: string,
  alertId: number,
  eventAt?: string,
): string {
  return `${eventType}:${alertId}:${eventAt || 'na'}`
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

function normalizeRiskLevel(value: unknown): AlertRiskLevel | null {
  return value === 1 || value === 2 || value === 3 ? value : null
}

function normalizeStatus(value: unknown): AlertStatus | null {
  return value === 0 || value === 1 || value === 2 || value === 3 ? value : null
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

function normalizeIdentityValue(value: unknown, fallback = ''): string {
  const normalized = normalizeNullableIdentityValue(value)
  return normalized ?? fallback
}

function normalizeNullableIdentityValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value)
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return undefined
}

function firstMeaningfulString(values: unknown[]): string | undefined {
  for (const value of values) {
    const text = sanitizeText(value)

    if (text) {
      return text
    }
  }

  return undefined
}

function sanitizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
