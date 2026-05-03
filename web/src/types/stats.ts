import type { AlertRiskLevel, AlertStatus } from './alerts'

export type StatsGroupBy = 'HOUR' | 'DAY'

export type RankingDimension = 'FLEET_ID' | 'VEHICLE_ID' | 'DRIVER_ID' | 'RULE_ID'

export type RankingSortBy =
  | 'ALERT_COUNT'
  | 'HIGH_RISK_COUNT'
  | 'AVG_RISK_SCORE'

export interface StatsFilterParams {
  fleetId?: string
  riskLevel?: AlertRiskLevel
  status?: AlertStatus
  startTime?: string
  endTime?: string
}

export interface RealtimeOverviewQuery extends Pick<StatsFilterParams, 'fleetId'> {}

export interface OverviewLatestAlertItem {
  id: number
  alertNo: string
  fleetId?: string | number | null
  fleetName?: string | null
  vehicleId?: string | number | null
  vehiclePlateNumber?: string | null
  driverId?: string | number | null
  driverName?: string | null
  driverCode?: string | null
  deviceId?: string | number | null
  deviceCode?: string | null
  ruleId?: string | number | null
  ruleName?: string | null
  riskLevel: AlertRiskLevel
  status: AlertStatus
  riskScore?: number | null
  triggerTime: string
}

export interface RiskDistributionItem {
  riskLevel: AlertRiskLevel
  count: number
}

export interface RealtimeOverviewData {
  fleetId?: string | number | null
  windowStartTime?: string
  windowEndTime?: string
  alertCountLast5Minutes?: number
  highRiskCountLast5Minutes?: number
  handledCountLast5Minutes?: number
  latestAlerts: OverviewLatestAlertItem[]
  riskDistribution: RiskDistributionItem[]
}

export interface TrendQuery extends StatsFilterParams {
  groupBy: StatsGroupBy
}

export interface TrendBucket {
  bucketTime: string
  alertCount: number
  highRiskCount: number
  avgRiskScore: number
  avgFatigueScore: number
  avgDistractionScore: number
}

export interface TrendData {
  groupBy: StatsGroupBy
  fleetId?: string | number | null
  riskLevel?: AlertRiskLevel | null
  status?: AlertStatus | null
  startTime: string
  endTime: string
  items: TrendBucket[]
}

export interface RankingQuery extends StatsFilterParams {
  dimension: RankingDimension
  sortBy: RankingSortBy
  limit: number
}

export interface RankingItem {
  rank: number
  dimensionValue: string | number
  dimensionName?: string | null
  alertCount: number
  highRiskCount: number
  avgRiskScore: number
  avgFatigueScore: number
  avgDistractionScore: number
}

export interface RankingData {
  dimension: RankingDimension
  sortBy: RankingSortBy
  limit: number
  fleetId?: string | number | null
  riskLevel?: AlertRiskLevel | null
  status?: AlertStatus | null
  startTime: string
  endTime: string
  totalDimensionCount: number
  items: RankingItem[]
}
