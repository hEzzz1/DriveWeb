import { request } from './http'
import type {
  CreateDriverPayload,
  DriverApiItem,
  DriverApiPageData,
  DriverDetail,
  DriverListData,
  DriverListQuery,
  ReassignDriverFleetPayload,
  ResetDriverPinPayload,
  UpdateDriverPayload,
  UpdateDriverStatusPayload,
} from '../types/drivers'

function normalizeDriver(item: DriverApiItem): DriverDetail {
  const status = item.status === 0 ? 0 : 1

  return {
    id: item.id,
    enterpriseId: item.enterpriseId,
    fleetId: item.fleetId,
    driverCode: item.driverCode || undefined,
    name: item.name,
    phone: item.phone || undefined,
    licenseNo: item.licenseNo || undefined,
    enabled: status === 1,
    status,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

export function getDriverList(params: DriverListQuery): Promise<DriverListData> {
  return request<DriverApiPageData>({
    url: '/drivers',
    method: 'GET',
    params: {
      ...params,
      status: params.status ?? (typeof params.enabled === 'boolean' ? (params.enabled ? 1 : 0) : undefined),
    },
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeDriver) : [],
  }))
}

export function getDriverDetail(id: number | string): Promise<DriverDetail> {
  return request<DriverApiItem>({
    url: `/drivers/${id}`,
    method: 'GET',
  }).then(normalizeDriver)
}

export function createDriver(payload: CreateDriverPayload): Promise<DriverDetail> {
  return request<DriverApiItem>({
    url: '/drivers',
    method: 'POST',
    data: payload,
  }).then(normalizeDriver)
}

export function updateDriver(id: number | string, payload: UpdateDriverPayload): Promise<DriverDetail> {
  return request<DriverApiItem>({
    url: `/drivers/${id}`,
    method: 'PUT',
    data: payload,
  }).then(normalizeDriver)
}

export function updateDriverStatus(
  id: number | string,
  payload: UpdateDriverStatusPayload,
): Promise<DriverDetail> {
  return request<DriverApiItem>({
    url: `/drivers/${id}/status`,
    method: 'PUT',
    data: payload,
  }).then(normalizeDriver)
}

export function reassignDriverFleet(
  id: number | string,
  payload: ReassignDriverFleetPayload,
): Promise<DriverDetail> {
  return request<DriverApiItem>({
    url: `/drivers/${id}/fleet`,
    method: 'PUT',
    data: payload,
  }).then(normalizeDriver)
}

export function resetDriverPin(
  id: number | string,
  payload: ResetDriverPinPayload,
): Promise<DriverDetail> {
  return request<DriverApiItem>({
    url: `/drivers/${id}/reset-pin`,
    method: 'POST',
    data: payload,
  }).then(normalizeDriver)
}
