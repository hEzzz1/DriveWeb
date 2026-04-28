import type { PageQuery, PageResult } from './api'

export interface DriverListQuery extends PageQuery {
  enterpriseId?: number
  fleetId?: number
  keyword?: string
  enabled?: boolean
  status?: 0 | 1
}

export interface DriverSummary {
  id: number
  enterpriseId: number
  enterpriseName?: string
  fleetId: number
  fleetName?: string
  driverCode?: string
  name: string
  phone?: string
  licenseNo?: string
  enabled: boolean
  status: 0 | 1
  hasActiveSession?: boolean
  activeSessionId?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface DriverDetail extends DriverSummary {}

export type DriverListData = PageResult<DriverSummary>

export interface CreateDriverPayload {
  enterpriseId: number
  fleetId: number
  driverCode?: string
  name: string
  phone?: string
  licenseNo?: string
  remark?: string
}

export interface UpdateDriverPayload {
  driverCode?: string
  name: string
  phone?: string
  licenseNo?: string
  remark?: string
}

export interface UpdateDriverStatusPayload {
  status: 0 | 1
}

export interface ReassignDriverFleetPayload {
  fleetId: number
}

export interface ResetDriverPinPayload {
  pin: string
}

export interface DriverApiItem {
  id: number
  enterpriseId: number
  fleetId: number
  driverCode?: string | null
  name: string
  phone?: string | null
  licenseNo?: string | null
  status?: number | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DriverApiPageData {
  items: DriverApiItem[]
  total: number
  page: number
  size: number
}
