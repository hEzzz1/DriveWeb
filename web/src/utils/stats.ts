import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type {
  RankingDimension,
  RankingItem,
  RankingSortBy,
  StatsFilterParams,
  StatsGroupBy,
  TrendBucket,
} from '../types/stats'
import type { AlertRiskLevel } from '../types/alerts'

export function getDefaultStatsRange(groupBy: StatsGroupBy): [Date, Date] {
  const end = new Date()
  const days = groupBy === 'DAY' ? 7 : 1
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return [start, end]
}

export function parseStringQuery(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function parseEnumQuery<T extends string>(value: unknown, options: T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback
}

export function parseOptionalRiskLevel(value: unknown): AlertRiskLevel | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return [1, 2, 3].includes(parsed) ? (parsed as AlertRiskLevel) : undefined
}

export function parsePositiveIntQuery(value: unknown, fallback: number, max?: number): number {
  if (typeof value !== 'string') {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  if (max !== undefined) {
    return Math.min(parsed, max)
  }

  return parsed
}

export function parseDateRange(query: LocationQuery, fallback: [Date, Date]): [Date, Date] {
  const startTime = parseStringQuery(query.startTime)
  const endTime = parseStringQuery(query.endTime)
  const startDate = toValidDate(startTime)
  const endDate = toValidDate(endTime)

  if (!startDate || !endDate || startDate.getTime() > endDate.getTime()) {
    return fallback
  }

  return [startDate, endDate]
}

export function toFilterQuery(
  params: StatsFilterParams & {
    groupBy?: StatsGroupBy
    dimension?: RankingDimension
    sortBy?: RankingSortBy
    limit?: number
  },
): LocationQueryRaw {
  return {
    fleetId: params.fleetId || undefined,
    vehicleId: params.vehicleId || undefined,
    driverId: params.driverId || undefined,
    riskType: params.riskType || undefined,
    riskLevel: params.riskLevel !== undefined ? String(params.riskLevel) : undefined,
    versionInfo: params.versionInfo || undefined,
    groupBy: params.groupBy,
    dimension: params.dimension,
    sortBy: params.sortBy,
    limit: params.limit !== undefined ? String(params.limit) : undefined,
    startTime: params.startTime,
    endTime: params.endTime,
  }
}

export function toIsoRange(timeRange: [Date, Date] | []): Pick<StatsFilterParams, 'startTime' | 'endTime'> {
  if (timeRange.length !== 2) {
    return {}
  }

  return {
    startTime: timeRange[0].toISOString(),
    endTime: timeRange[1].toISOString(),
  }
}

export function formatCompactDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatMetric(value?: number | null, digits = 0): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return value.toFixed(digits)
}

export function formatPercent(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return `${(value * 100).toFixed(1)}%`
}

export function describeTrendPeak(items: TrendBucket[], field: keyof TrendBucket): string {
  if (!items.length) {
    return '-'
  }

  const peak = [...items].sort(
    (left, right) => Number(right[field] || 0) - Number(left[field] || 0),
  )[0]

  return `${formatCompactDateTime(peak.bucketTime)} / ${formatMetric(Number(peak[field] || 0))}`
}

export function buildRankingSortValue(item: RankingItem, sortBy: RankingSortBy): number {
  if (sortBy === 'HIGH_RISK_COUNT') {
    return item.highRiskCount
  }

  if (sortBy === 'AVG_RISK_SCORE') {
    return item.avgRiskScore
  }

  if (sortBy === 'RECENT_ACTIVE_RISK_COUNT') {
    return item.recentActiveRiskCount ?? item.highRiskCount ?? item.alertCount
  }

  return item.alertCount
}

function toValidDate(value: string): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
