import { request } from './http'
import type { DeviceApiItem, DeviceDetail } from '../types/devices'
import type {
  DeviceApprovalApiHistoryItem,
  DeviceApprovalApiItem,
  DeviceApprovalApiPageData,
  DeviceApprovalDetail,
  DeviceApprovalHistoryRecord,
  DeviceApprovalListData,
  DeviceApprovalListQuery,
  DeviceApprovalSummary,
  ReviewDeviceApprovalPayload,
} from '../types/device-approvals'

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

function normalizeHistory(item: DeviceApprovalApiHistoryItem): DeviceApprovalHistoryRecord {
  return {
    id: item.id,
    action: item.action,
    operatorId: item.operatorId || undefined,
    operatorName: item.operatorName || undefined,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
  }
}

function normalizeApproval(item: DeviceApprovalApiItem): DeviceApprovalSummary {
  return {
    id: item.id,
    deviceId: item.deviceId || undefined,
    deviceCode: item.deviceCode,
    deviceName: item.deviceName,
    activationCode: item.activationCode || item.device?.activationCode || undefined,
    enterpriseId: item.enterpriseId,
    enterpriseName: item.enterpriseName || undefined,
    applyRemark: item.applyRemark || undefined,
    appliedAt: item.appliedAt || undefined,
    status: item.status,
    reviewRemark: item.reviewRemark || undefined,
    lastOnlineAt: item.lastOnlineAt || undefined,
  }
}

function normalizeApprovalDetail(item: DeviceApprovalApiItem): DeviceApprovalDetail {
  return {
    ...normalizeApproval(item),
    device: item.device ? normalizeDevice(item.device) : undefined,
    history: Array.isArray(item.history) ? item.history.map(normalizeHistory) : [],
  }
}

export function getDeviceApprovalList(params: DeviceApprovalListQuery): Promise<DeviceApprovalListData> {
  return request<DeviceApprovalApiPageData>({
    url: '/admin/edge/bind-requests',
    method: 'GET',
    params,
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeApproval) : [],
  }))
}

export function getDeviceApprovalDetail(id: number | string): Promise<DeviceApprovalDetail> {
  return request<DeviceApprovalApiItem>({
    url: `/admin/edge/bind-requests/${id}`,
    method: 'GET',
  }).then(normalizeApprovalDetail)
}

export function approveDeviceApproval(
  id: number | string,
  payload?: ReviewDeviceApprovalPayload,
): Promise<DeviceApprovalDetail> {
  return request<DeviceApprovalApiItem>({
    url: `/admin/edge/bind-requests/${id}/approve`,
    method: 'POST',
    data: payload,
  }).then(normalizeApprovalDetail)
}

export function rejectDeviceApproval(
  id: number | string,
  payload: ReviewDeviceApprovalPayload,
): Promise<DeviceApprovalDetail> {
  return request<DeviceApprovalApiItem>({
    url: `/admin/edge/bind-requests/${id}/reject`,
    method: 'POST',
    data: payload,
  }).then(normalizeApprovalDetail)
}
