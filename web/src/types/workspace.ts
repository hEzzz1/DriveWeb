import type {
  AlertRealtimeEventType,
  AlertRiskLevel,
  AlertStatus,
  RealtimeConnectionStatus,
} from './alerts'

export interface WorkspaceNavEntry {
  key: string
  badge: string
  section: string
  label: string
  subtitle: string
  path: string
}

export interface WorkspaceVisitedEntry {
  key: string
  label: string
  path: string
  subtitle?: string
}

export interface WorkspaceAlertFeedItem {
  id: number
  alertNo: string
  vehicleId: string
  driverId: string
  riskLevel: AlertRiskLevel | null
  status: AlertStatus | null
  triggerTime: string
  eventType: AlertRealtimeEventType
  eventAt: string
}

export type WorkspaceCommandAction =
  | 'navigate'
  | 'open-alert'
  | 'open-session'
  | 'reconnect'
  | 'logout'

export interface WorkspaceCommandItem {
  id: string
  group: 'favorites' | 'pages' | 'alerts' | 'actions'
  groupLabel: string
  label: string
  description: string
  action: WorkspaceCommandAction
  path?: string
  alertId?: number
  hint?: string
  badge?: string
  pinned?: boolean
  keywords?: string[]
}

export interface WorkspaceSessionSummary {
  username: string
  roleText: string
  scopeText: string
  expireAtText: string
  minutesLeft: number | null
  willExpireSoon: boolean
}

export interface WorkspaceRealtimeSummary {
  status: RealtimeConnectionStatus
  statusText: string
  hint: string
  canReconnect: boolean
}
