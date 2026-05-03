import type {
  AlertActionType,
  AlertRiskLevel,
  AlertStatus,
} from '../types/alerts'
import { formatDateTime as formatDateTimeInBeijing } from './time'

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

export function formatTimestampMs(value: number | string | null | undefined): string {
  return formatDateTimeInBeijing(value)
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

export function getAlertTimelineActionLabel(actionType: string | null | undefined): string {
  if (actionType === 'CREATE') {
    return '创建告警'
  }

  if (actionType === 'CONFIRM') {
    return '确认告警'
  }

  if (actionType === 'FALSE_POSITIVE') {
    return '标记误报'
  }

  if (actionType === 'CLOSE') {
    return '关闭告警'
  }

  return actionType || '状态变更'
}
