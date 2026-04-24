export type AlertRiskLevel = 1 | 2 | 3

export type AlertStatus = 0 | 1 | 2 | 3

export type AlertActionType = 'CONFIRM' | 'FALSE_POSITIVE' | 'CLOSE'

export type AlertRealtimeEventType = 'ALERT_CREATED' | 'ALERT_UPDATED'

export type RealtimeConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

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

export interface AlertRealtimePayload {
  alertId: number
  alertNo?: string
  status?: AlertStatus
  riskLevel?: AlertRiskLevel
  riskScore?: number | null
  fatigueScore?: number | null
  distractionScore?: number | null
  triggerTime?: string | null
  fleetId?: string | number | null
  vehicleId?: string | number | null
  driverId?: string | number | null
  latestActionBy?: number | string | null
  latestActionTime?: string | null
  actionType?: string | null
  remark?: string | null
  ruleId?: number | null
  edgeRiskLevel?: string | null
  edgeDominantRiskType?: string | null
  edgeTriggerReasons?: string[] | null
  edgeWindowStartMs?: number | null
  edgeWindowEndMs?: number | null
  edgeCreatedAtMs?: number | null
}

export interface AlertRealtimeEnvelope {
  eventType?: string
  traceId?: string
  data?: AlertRealtimePayload
  type?: string
  timestamp?: string
  payload?: AlertRealtimePayload
}

export interface NormalizedAlertRealtimeEvent {
  eventType: AlertRealtimeEventType
  traceId?: string
  alertId: number
  eventAt?: string
  dedupeKey: string
  payload: AlertRealtimePayload
}

export interface AlertDetail extends AlertSummary {
  ruleId?: number | null
  riskScore?: number | null
  perclos?: number | null
  blinkRate?: number | null
  yawnCount?: number | null
  headPose?: string | null
  algorithmVer?: string | null
  eventTime?: string | null
  latestActionBy?: number | string | null
  latestActionTime?: string | null
  remark?: string | null
  edgeRiskLevel?: string | null
  edgeDominantRiskType?: string | null
  edgeTriggerReasons?: string[] | null
  edgeWindowStartMs?: number | null
  edgeWindowEndMs?: number | null
  edgeCreatedAtMs?: number | null
  eventId?: string | null
  traceId?: string | null
  serverTraceId?: string | null
  deviceToken?: string | null
  ingestTraceId?: string | null
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
