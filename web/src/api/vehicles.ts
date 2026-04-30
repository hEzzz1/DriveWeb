import { request } from './http'
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  UpdateVehicleStatusPayload,
  VehicleApiItem,
  VehicleApiPageData,
  VehicleDetail,
  VehicleListData,
  VehicleListQuery,
} from '../types/vehicles'

function normalizeVehicle(item: VehicleApiItem): VehicleDetail {
  const status = item.status === 0 ? 0 : 1

  return {
    id: item.id,
    enterpriseId: item.enterpriseId,
    fleetId: item.fleetId,
    plateNumber: item.plateNumber,
    vin: item.vin || undefined,
    enabled: status === 1,
    status,
    boundDeviceId: item.boundDeviceId || undefined,
    boundDeviceCode: item.boundDeviceCode || undefined,
    boundDeviceName: item.boundDeviceName || undefined,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

export function getVehicleList(params: VehicleListQuery): Promise<VehicleListData> {
  return request<VehicleApiPageData>({
    url: '/org/vehicles',
    method: 'GET',
    params: {
      ...params,
      status: params.status ?? (typeof params.enabled === 'boolean' ? (params.enabled ? 1 : 0) : undefined),
    },
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeVehicle) : [],
  }))
}

export function getVehicleDetail(id: number | string): Promise<VehicleDetail> {
  return request<VehicleApiItem>({
    url: `/org/vehicles/${id}`,
    method: 'GET',
  }).then(normalizeVehicle)
}

export function createVehicle(payload: CreateVehiclePayload): Promise<VehicleDetail> {
  return request<VehicleApiItem>({
    url: '/org/vehicles',
    method: 'POST',
    data: payload,
  }).then(normalizeVehicle)
}

export function updateVehicle(id: number | string, payload: UpdateVehiclePayload): Promise<VehicleDetail> {
  return request<VehicleApiItem>({
    url: `/org/vehicles/${id}`,
    method: 'PUT',
    data: payload,
  }).then(normalizeVehicle)
}

export function updateVehicleStatus(
  id: number | string,
  payload: UpdateVehicleStatusPayload,
): Promise<VehicleDetail> {
  return request<VehicleApiItem>({
    url: `/org/vehicles/${id}/status`,
    method: 'PUT',
    data: payload,
  }).then(normalizeVehicle)
}
