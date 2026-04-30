import { request } from './http'
import type {
  CreateDevicePayload,
  DeviceApiItem,
  DeviceApiPageData,
  DeviceDetail,
  DeviceListData,
  DeviceListQuery,
  ReassignDeviceVehiclePayload,
  RotateDeviceTokenApiData,
  RotateDeviceTokenData,
  UpdateDevicePayload,
  UpdateDeviceStatusPayload,
} from '../types/devices'

function normalizeDevice(item: DeviceApiItem): DeviceDetail {
  const status = item.status === 0 ? 0 : 1
  const activationStatus = item.activationStatus || (item.lastActivatedAt ? 'ACTIVATED' : 'PENDING')
  const onlineStatus = item.onlineStatus || (item.lastOnlineAt ? 'ONLINE' : 'UNKNOWN')

  return {
    id: item.id,
    enterpriseId: item.enterpriseId,
    fleetId: item.fleetId,
    vehicleId: item.vehicleId,
    deviceCode: item.deviceCode,
    deviceName: item.deviceName,
    activationCode: item.activationCode || undefined,
    enabled: status === 1,
    status,
    activationStatus,
    onlineStatus,
    lastActivatedAt: item.lastActivatedAt || undefined,
    lastOnlineAt: item.lastOnlineAt || undefined,
    tokenRotatedAt: item.tokenRotatedAt || undefined,
    currentDriverId: item.currentDriverId || undefined,
    currentDriverCode: item.currentDriverCode || undefined,
    currentDriverName: item.currentDriverName || undefined,
    currentSessionId: item.currentSessionId || undefined,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

export function getDeviceList(params: DeviceListQuery): Promise<DeviceListData> {
  return request<DeviceApiPageData>({
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
