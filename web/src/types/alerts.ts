export type AlertRiskLevel = 1 | 2 | 3

export type AlertStatus = 0 | 1 | 2 | 3

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

export interface AlertActionRecord {
  action: string
  actionTime: string
  operator?: string
  remark?: string
}

export interface AlertDetail extends AlertSummary {
  perclos?: number | null
  blinkRate?: number | null
  yawnCount?: number | null
  headPose?: string | null
  algorithmVer?: string | null
  eventTime?: string | null
  remark?: string | null
  timeline?: AlertActionRecord[]
  logs?: AlertActionRecord[]
  history?: AlertActionRecord[]
  [key: string]: unknown
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
