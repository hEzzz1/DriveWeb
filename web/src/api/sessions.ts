import { request } from './http'
import type {
  ForceSignOutSessionPayload,
  SessionApiItem,
  SessionApiPageData,
  SessionDetail,
  SessionListData,
  SessionListQuery,
  SessionSummary,
} from '../types/sessions'

function normalizeSession(item: SessionApiItem): SessionDetail {
  return {
    id: item.id,
    sessionNo: item.sessionNo,
    enterpriseId: item.enterpriseId,
    enterpriseName: item.enterpriseName || undefined,
    fleetId: item.fleetId,
    fleetName: item.fleetName || undefined,
    vehicleId: item.vehicleId,
    vehiclePlateNumber: item.vehiclePlateNumber || undefined,
    driverId: item.driverId,
    driverCode: item.driverCode || undefined,
    driverName: item.driverName || undefined,
    deviceId: item.deviceId,
    deviceCode: item.deviceCode || undefined,
    signInTime: item.signInTime || undefined,
    signOutTime: item.signOutTime || undefined,
    status: item.status === 2 ? 2 : 1,
    closedReason: item.closedReason || undefined,
    remark: item.remark || undefined,
    lastHeartbeatAt: item.lastHeartbeatAt || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

function stripSessionDetail(item: SessionDetail): SessionSummary {
  return { ...item }
}

export function getSessionList(params: SessionListQuery): Promise<SessionListData> {
  return request<SessionApiPageData>({
    url: '/sessions',
    method: 'GET',
    params,
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeSession).map(stripSessionDetail) : [],
  }))
}

export function getSessionDetail(id: number | string): Promise<SessionDetail> {
  return request<SessionApiItem>({
    url: `/sessions/${id}`,
    method: 'GET',
  }).then(normalizeSession)
}

export function forceSignOutSession(
  id: number | string,
  payload: ForceSignOutSessionPayload,
): Promise<SessionDetail> {
  return request<SessionApiItem>({
    url: `/sessions/${id}/force-sign-out`,
    method: 'PUT',
    data: payload,
  }).then(normalizeSession)
}
