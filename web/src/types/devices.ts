import type { PageQuery, PageResult } from './api'

export type DeviceLifecycleStatus = 'NEW' | 'BOUND' | 'DISABLED'
export type VehicleBindStatus = 'UNASSIGNED' | 'ASSIGNED'
export type SessionStage = 'IDLE' | 'ACTIVE'
export type EffectiveStage =
  | 'CLAIM_ENTERPRISE'
  | 'WAITING_VEHICLE'
  | 'READY_SIGN_IN'
  | 'IN_SESSION'
  | 'DISABLED'

export interface DeviceListQuery extends PageQuery {
  enterpriseId?: number
  fleetId?: number
  vehicleId?: number
}

export interface DeviceCurrentDriver {
  id: number
  code?: string
  name?: string
}

export interface DeviceActiveSession {
  id: number
}

export interface DeviceSummary {
  id: number
  enterpriseId?: number
  enterpriseName?: string
  fleetId?: number
  fleetName?: string
  vehicleId?: number
  vehiclePlateNumber?: string
  deviceCode: string
  deviceName: string
  lifecycleStatus: DeviceLifecycleStatus
  vehicleBindStatus: VehicleBindStatus
  sessionStage: SessionStage
  effectiveStage: EffectiveStage
  lastSeenAt?: string
  currentDriver?: DeviceCurrentDriver
  activeSession?: DeviceActiveSession
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface DeviceDetail extends DeviceSummary {}

export type DeviceListData = PageResult<DeviceSummary>

export interface CreateDevicePayload {
  vehicleId?: number
  deviceCode: string
  deviceName: string
  remark?: string
}

export interface UpdateDevicePayload {
  deviceName: string
  remark?: string
}

export interface UpdateDeviceStatusPayload {
  status: 0 | 1
}

export interface ReassignDeviceVehiclePayload {
  vehicleId: number
}

export interface RotateDeviceTokenData {
  deviceId: number
  deviceCode: string
  deviceToken: string
  rotatedAt?: string
}

export interface DeviceApiPartyRef {
  id: number
  name?: string | null
}

export interface DeviceApiVehicleRef {
  id: number
  plateNumber?: string | null
}

export interface DeviceApiCurrentDriver {
  id: number
  code?: string | null
  name?: string | null
}

export interface DeviceApiActiveSession {
  id: number
}

export interface DeviceApiItem {
  id: number
  deviceCode: string
  deviceName: string
  enterpriseId?: number | null
  enterpriseName?: string | null
  fleetId?: number | null
  fleetName?: string | null
  vehicleId?: number | null
  vehiclePlateNumber?: string | null
  enterprise?: DeviceApiPartyRef | null
  fleet?: DeviceApiPartyRef | null
  vehicle?: DeviceApiVehicleRef | null
  lifecycleStatus: DeviceLifecycleStatus
  vehicleBindStatus: VehicleBindStatus
  sessionStage: SessionStage
  effectiveStage: EffectiveStage
  lastSeenAt?: string | null
  currentDriver?: DeviceApiCurrentDriver | null
  activeSession?: DeviceApiActiveSession | null
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
