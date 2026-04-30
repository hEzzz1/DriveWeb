import { request } from './http'
import type {
  CreateFleetPayload,
  FleetApiItem,
  FleetApiPageData,
  FleetDetail,
  FleetListData,
  FleetListQuery,
  UpdateFleetPayload,
  UpdateFleetStatusPayload,
} from '../types/fleets'

function normalizeFleet(item: FleetApiItem): FleetDetail {
  const status = item.status === 0 ? 0 : 1

  return {
    id: item.id,
    enterpriseId: item.enterpriseId,
    name: item.name,
    enabled: status === 1,
    status,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

export function getFleetList(params: FleetListQuery): Promise<FleetListData> {
  return request<FleetApiPageData>({
    url: '/org/fleets',
    method: 'GET',
    params,
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeFleet) : [],
  }))
}

export function getFleetDetail(id: number | string): Promise<FleetDetail> {
  return request<FleetApiItem>({
    url: `/org/fleets/${id}`,
    method: 'GET',
  }).then(normalizeFleet)
}

export function createFleet(payload: CreateFleetPayload): Promise<FleetDetail> {
  return request<FleetApiItem>({
    url: '/org/fleets',
    method: 'POST',
    data: payload,
  }).then(normalizeFleet)
}

export function updateFleet(id: number | string, payload: UpdateFleetPayload): Promise<FleetDetail> {
  return request<FleetApiItem>({
    url: `/org/fleets/${id}`,
    method: 'PUT',
    data: payload,
  }).then(normalizeFleet)
}

export function updateFleetStatus(
  id: number | string,
  payload: UpdateFleetStatusPayload,
): Promise<FleetDetail> {
  return request<FleetApiItem>({
    url: `/org/fleets/${id}/status`,
    method: 'PUT',
    data: payload,
  }).then(normalizeFleet)
}
