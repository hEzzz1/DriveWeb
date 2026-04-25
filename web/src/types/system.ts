export type HealthLevel = 'UP' | 'DOWN' | 'UNKNOWN'
export type ServiceStatus = 'UP' | 'DOWN' | 'UNKNOWN'

export interface SystemHealthSnapshot {
  status: HealthLevel | string
  details: Record<string, unknown>
}

export interface ServiceStatusItem {
  service: string
  status: ServiceStatus | string
  description: string
  lastCheckedAt: string
}

export interface SystemServicesResponse {
  items: ServiceStatusItem[]
}

export interface SystemMonitoringSnapshot {
  snapshotAt: string
  openAlertCount: number
  alertCount24h: number
  auditCount24h: number
  enabledRuleCount: number
  averageRiskScore24h: number | null
}

export interface VersionInfoItem {
  applicationName: string
  version: string
  buildTime: string
  gitCommit: string
}

export interface SystemSummarySnapshot {
  generatedAt: string
  health: SystemHealthSnapshot
  services: SystemServicesResponse
  version: VersionInfoItem
  monitoring: SystemMonitoringSnapshot
}

export const healthLevelLabelMap: Record<string, string> = {
  UP: '正常',
  DOWN: '异常',
  UNKNOWN: '未知',
}

export const serviceStatusLabelMap: Record<string, string> = {
  UP: '正常',
  DOWN: '不可用',
  UNKNOWN: '未知',
}
