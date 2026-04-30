import type { PageQuery, PageResult } from './api'

export interface DeviceListQuery extends PageQuery {
  enterpriseId?: number
  fleetId?: number
  vehicleId?: number
}

export interface DeviceSummary {
  id: number
  enterpriseId: number
  enterpriseName?: string
  fleetId: number
  fleetName?: string
  vehicleId: number
  vehiclePlateNumber?: string
  deviceCode: string
  deviceName: string
  activationCode?: string
  enabled: boolean
  status: 0 | 1
  activationStatus?: 'ACTIVATED' | 'PENDING'
  onlineStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  lastActivatedAt?: string
  lastOnlineAt?: string
  tokenRotatedAt?: string
  currentDriverId?: number
  currentDriverCode?: string
  currentDriverName?: string
  currentSessionId?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface DeviceDetail extends DeviceSummary {}

export type DeviceListData = PageResult<DeviceSummary>

export interface CreateDevicePayload {
  vehicleId: number
  deviceCode: string
  deviceName: string
  activationCode?: string
  remark?: string
}

export interface UpdateDevicePayload {
  deviceName: string
  activationCode?: string
  remark?: string
}

export interface UpdateDeviceStatusPayload {
  status: 0 | 1
}

export interface ReassignDeviceVehiclePayload {
  fleetId?: number
  vehicleId: number
}

export interface RotateDeviceTokenData {
  deviceId: number
  deviceCode: string
  deviceToken: string
  rotatedAt?: string
}

export interface DeviceApiItem {
  id: number
  enterpriseId: number
  fleetId: number
  vehicleId: number
  deviceCode: string
  deviceName: string
  activationCode?: string | null
  status?: number | null
  activationStatus?: 'ACTIVATED' | 'PENDING' | null
  onlineStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | null
  lastActivatedAt?: string | null
  lastOnlineAt?: string | null
  tokenRotatedAt?: string | null
  currentDriverId?: number | null
  currentDriverCode?: string | null
  currentDriverName?: string | null
  currentSessionId?: number | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DeviceApiPageData {
  items: DeviceApiItem[]
  total: number
  page: number
  size: number
}

export interface RotateDeviceTokenApiData {
  deviceId: number
  deviceCode: string
  deviceToken: string
  tokenRotatedAt?: string | null
}
