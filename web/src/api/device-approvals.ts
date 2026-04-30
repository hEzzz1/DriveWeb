import { request } from './http'
import { normalizeDevice } from './devices'
import type {
  ApproveDeviceApprovalPayload,
  DeviceApprovalApiHistoryItem,
  DeviceApprovalApiItem,
  DeviceApprovalApiPageData,
  DeviceApprovalDetail,
  DeviceApprovalHistoryRecord,
  DeviceApprovalListData,
  DeviceApprovalListQuery,
  DeviceApprovalSummary,
  RejectDeviceApprovalPayload,
} from '../types/device-approvals'

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
    deviceId: item.deviceId ?? item.device?.id ?? undefined,
    deviceCode: item.deviceCode,
    deviceName: item.deviceName,
    activationCode: item.activationCode || item.device?.activationCode || undefined,
    enterpriseId: item.enterpriseId,
    enterpriseName: item.enterpriseName || undefined,
    bindCodeMasked: item.bindCodeMasked || undefined,
    bindSource: item.bindSource || undefined,
    status: item.status,
    applyRemark: item.applyRemark || undefined,
    approveRemark: item.approveRemark || undefined,
    rejectReason: item.rejectReason || undefined,
    submittedAt: item.submittedAt || undefined,
    reviewedAt: item.reviewedAt || undefined,
    reviewedBy: item.reviewedBy || undefined,
    expiresAt: item.expiresAt || undefined,
    lastSeenAt: item.lastSeenAt || undefined,
    effectiveStage: item.effectiveStage || undefined,
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
  payload?: ApproveDeviceApprovalPayload,
): Promise<DeviceApprovalDetail> {
  return request<DeviceApprovalApiItem>({
    url: `/admin/edge/bind-requests/${id}/approve`,
    method: 'POST',
    data: payload,
  }).then(normalizeApprovalDetail)
}

export function rejectDeviceApproval(
  id: number | string,
  payload: RejectDeviceApprovalPayload,
): Promise<DeviceApprovalDetail> {
  return request<DeviceApprovalApiItem>({
    url: `/admin/edge/bind-requests/${id}/reject`,
    method: 'POST',
    data: payload,
  }).then(normalizeApprovalDetail)
}
