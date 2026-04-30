import { request } from './http'
import type {
  CreateDevicePayload,
  DeviceActiveSession,
  DeviceApiActiveSession,
  DeviceApiCurrentDriver,
  DeviceApiItem,
  DeviceCurrentDriver,
  DeviceDetail,
  DeviceListData,
  DeviceListQuery,
  ReassignDeviceVehiclePayload,
  RotateDeviceTokenApiData,
  RotateDeviceTokenData,
  UpdateDevicePayload,
  UpdateDeviceStatusPayload,
} from '../types/devices'

function normalizeCurrentDriver(item?: DeviceApiCurrentDriver | null): DeviceCurrentDriver | undefined {
  if (!item) {
    return undefined
  }

  return {
    id: item.id,
    code: item.code || undefined,
    name: item.name || undefined,
  }
}

function normalizeActiveSession(item?: DeviceApiActiveSession | null): DeviceActiveSession | undefined {
  if (!item) {
    return undefined
  }

  return {
    id: item.id,
  }
}

export function normalizeDevice(item: DeviceApiItem): DeviceDetail {
  return {
    id: item.id,
    enterpriseId: item.enterprise?.id ?? item.enterpriseId ?? undefined,
    enterpriseName: item.enterprise?.name || item.enterpriseName || undefined,
    fleetId: item.fleet?.id ?? item.fleetId ?? undefined,
    fleetName: item.fleet?.name || item.fleetName || undefined,
    vehicleId: item.vehicle?.id ?? item.vehicleId ?? undefined,
    vehiclePlateNumber: item.vehicle?.plateNumber || item.vehiclePlateNumber || undefined,
    deviceCode: item.deviceCode,
    deviceName: item.deviceName,
    activationCode: item.activationCode || undefined,
    lifecycleStatus: item.lifecycleStatus,
    enterpriseBindStatus: item.enterpriseBindStatus,
    vehicleBindStatus: item.vehicleBindStatus,
    sessionStage: item.sessionStage,
    effectiveStage: item.effectiveStage,
    lastActivatedAt: item.lastActivatedAt || undefined,
    lastSeenAt: item.lastSeenAt || undefined,
    currentDriver: normalizeCurrentDriver(item.currentDriver),
    activeSession: normalizeActiveSession(item.activeSession),
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

export function getDeviceList(params: DeviceListQuery): Promise<DeviceListData> {
  return request<import('../types/devices').DeviceApiPageData>({
    url: '/devices',
    method: 'GET',
    params,
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeDevice) : [],
  }))
}

export function getDeviceDetail(id: number | string): Promise<DeviceDetail> {
  return request<DeviceApiItem>({
    url: `/devices/${id}`,
    method: 'GET',
  }).then(normalizeDevice)
}

export function createDevice(payload: CreateDevicePayload): Promise<DeviceDetail> {
  return request<DeviceApiItem>({
    url: '/devices',
    method: 'POST',
    data: payload,
  }).then(normalizeDevice)
}

export function updateDevice(id: number | string, payload: UpdateDevicePayload): Promise<DeviceDetail> {
  return request<DeviceApiItem>({
    url: `/devices/${id}`,
    method: 'PUT',
    data: payload,
  }).then(normalizeDevice)
}

export function updateDeviceStatus(
  id: number | string,
  payload: UpdateDeviceStatusPayload,
): Promise<DeviceDetail> {
  return request<DeviceApiItem>({
    url: `/devices/${id}/status`,
    method: 'PUT',
    data: payload,
  }).then(normalizeDevice)
}

export function reassignDeviceVehicle(
  id: number | string,
  payload: ReassignDeviceVehiclePayload,
): Promise<DeviceDetail> {
  return request<DeviceApiItem>({
    url: `/devices/${id}/vehicle`,
    method: 'PUT',
    data: payload,
  }).then(normalizeDevice)
}

export function rotateDeviceToken(id: number | string): Promise<RotateDeviceTokenData> {
  return request<RotateDeviceTokenApiData>({
    url: `/devices/${id}/rotate-token`,
    method: 'POST',
  }).then((item) => ({
    deviceId: item.deviceId,
    deviceCode: item.deviceCode,
    deviceToken: item.deviceToken,
    rotatedAt: item.tokenRotatedAt || undefined,
  }))
}
