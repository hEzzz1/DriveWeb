import type { PageQuery, PageResult } from './api'

export interface SessionListQuery extends PageQuery {
  enterpriseId?: number
  fleetId?: number
  keyword?: string
  status?: 1 | 2
}

export interface SessionSummary {
  id: number
  sessionNo: string
  enterpriseId: number
  enterpriseName?: string
  fleetId: number
  fleetName?: string
  vehicleId: number
  vehiclePlateNumber?: string
  driverId: number
  driverCode?: string
  driverName?: string
  deviceId: number
  deviceCode?: string
  signInTime?: string
  signOutTime?: string
  status: 1 | 2
  closedReason?: string
  remark?: string
  lastHeartbeatAt?: string
}

export interface SessionDetail extends SessionSummary {
  createdAt?: string
  updatedAt?: string
}

export type SessionListData = PageResult<SessionSummary>

export interface ForceSignOutSessionPayload {
  remark?: string
}

export interface SessionApiItem {
  id: number
  sessionNo: string
  enterpriseId: number
  enterpriseName?: string | null
  fleetId: number
  fleetName?: string | null
  vehicleId: number
  vehiclePlateNumber?: string | null
  driverId: number
  driverCode?: string | null
  driverName?: string | null
  deviceId: number
  deviceCode?: string | null
  signInTime?: string | null
  signOutTime?: string | null
  status: number
  closedReason?: string | null
  remark?: string | null
  lastHeartbeatAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface SessionApiPageData {
  items: SessionApiItem[]
  total: number
  page: number
  size: number
}
