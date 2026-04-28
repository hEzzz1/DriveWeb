import type { PageQuery, PageResult } from './api'

export interface FleetListQuery extends PageQuery {
  enterpriseId?: number
}

export interface FleetSummary {
  id: number
  enterpriseId: number
  enterpriseName?: string
  name: string
  enabled: boolean
  status: 0 | 1
  remark?: string
  driverCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface FleetDetail extends FleetSummary {}

export type FleetListData = PageResult<FleetSummary>

export interface CreateFleetPayload {
  enterpriseId: number
  name: string
  remark?: string
}

export interface UpdateFleetPayload {
  name: string
  remark?: string
}

export interface UpdateFleetStatusPayload {
  status: 0 | 1
}

export interface FleetApiItem {
  id: number
  enterpriseId: number
  name: string
  status?: number | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface FleetApiPageData {
  items: FleetApiItem[]
  total: number
  page: number
  size: number
}
