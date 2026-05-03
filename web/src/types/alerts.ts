export type AlertRiskLevel = 1 | 2 | 3

export type AlertStatus = 0 | 1 | 2 | 3

export type AlertActionType = 'CONFIRM' | 'FALSE_POSITIVE' | 'CLOSE'

export interface AlertListQuery {
  page: number
  size: number
  fleetId?: string
  vehicleId?: string
  driverId?: string
  riskLevel?: AlertRiskLevel
  status?: AlertStatus
  startTime?: string
  endTime?: string
}

export interface AlertSummary {
  id: number
  alertNo: string
  fleetId: string
  vehicleId: string
  driverId: string
  riskLevel: AlertRiskLevel
  fatigueScore: number
  distractionScore: number
  status: AlertStatus
  triggerTime: string
}

export interface AlertListData {
  total: number
  page: number
  size: number
  items: AlertSummary[]
}

export interface AlertActionLog {
  id: number
  actionType: string
  actionBy?: number | string | null
  actionTime: string
  actionRemark?: string | null
}

export interface AlertActionLogsData {
  alertId: number
  items: AlertActionLog[]
}

export interface AlertDetail extends AlertSummary {
  ruleId?: number | null
  riskScore?: number | null
  latestActionBy?: number | string | null
  latestActionTime?: string | null
  remark?: string | null
  edgeRiskLevel?: string | null
  edgeDominantRiskType?: string | null
  edgeTriggerReasons?: string | null
  edgeWindowStartMs?: number | null
  edgeWindowEndMs?: number | null
  edgeCreatedAtMs?: number | null
}

export const riskLevelLabelMap: Record<AlertRiskLevel, string> = {
  1: '低风险',
  2: '中风险',
  3: '高风险',
}

export const statusLabelMap: Record<AlertStatus, string> = {
  0: '新建',
  1: '已确认',
  2: '误报',
  3: '已关闭',
}
