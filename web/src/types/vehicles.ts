import type { PageQuery, PageResult } from './api'

export interface VehicleListQuery extends PageQuery {
  enterpriseId?: number
  fleetId?: number
  enabled?: boolean
  status?: 0 | 1
}

export interface VehicleSummary {
  id: number
  enterpriseId: number
  enterpriseName?: string
  fleetId: number
  fleetName?: string
  plateNumber: string
  vin?: string
  enabled: boolean
  status: 0 | 1
  boundDeviceId?: number
  boundDeviceCode?: string
  boundDeviceName?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface VehicleDetail extends VehicleSummary {}

export type VehicleListData = PageResult<VehicleSummary>

export interface CreateVehiclePayload {
  enterpriseId: number
  fleetId: number
  plateNumber: string
  vin?: string
  remark?: string
}

export interface UpdateVehiclePayload {
  fleetId: number
  plateNumber: string
  vin?: string
  remark?: string
}

export interface UpdateVehicleStatusPayload {
  status: 0 | 1
}

export interface VehicleApiItem {
  id: number
  enterpriseId: number
  fleetId: number
  plateNumber: string
  vin?: string | null
  status?: number | null
  boundDeviceId?: number | null
  boundDeviceCode?: string | null
  boundDeviceName?: string | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface VehicleApiPageData {
  items: VehicleApiItem[]
  total: number
  page: number
  size: number
}
