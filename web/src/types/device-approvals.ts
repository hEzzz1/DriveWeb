import type { PageQuery, PageResult } from './api'
import type { DeviceDetail, DeviceApiItem, EffectiveStage } from './devices'

export type DeviceApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type DeviceApprovalHistoryAction =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'RESUBMITTED'
  | 'CANCELED'

export interface DeviceApprovalListQuery extends PageQuery {
  enterpriseId?: number
  status?: DeviceApprovalStatus
  deviceCode?: string
}

export interface DeviceApprovalHistoryRecord {
  id: number
  action: DeviceApprovalHistoryAction
  operatorId?: number
  operatorName?: string
  remark?: string
  createdAt?: string
}

export interface DeviceApprovalSummary {
  id: number
  deviceId?: number
  deviceCode: string
  deviceName: string
  activationCode?: string
  enterpriseId: number
  enterpriseName?: string
  bindCodeMasked?: string
  bindSource?: string
  status: DeviceApprovalStatus
  applyRemark?: string
  approveRemark?: string
  rejectReason?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  expiresAt?: string
  lastSeenAt?: string
  effectiveStage?: EffectiveStage
}

export interface DeviceApprovalDetail extends DeviceApprovalSummary {
  device?: DeviceDetail
  history: DeviceApprovalHistoryRecord[]
}

export type DeviceApprovalListData = PageResult<DeviceApprovalSummary>

export interface ApproveDeviceApprovalPayload {
  remark?: string
}

export interface RejectDeviceApprovalPayload {
  reason: string
}

export interface DeviceApprovalApiHistoryItem {
  id: number
  action: DeviceApprovalHistoryAction
  operatorId?: number | null
  operatorName?: string | null
  remark?: string | null
  createdAt?: string | null
}

export interface DeviceApprovalApiItem {
  id: number
  deviceId?: number | null
  deviceCode: string
  deviceName: string
  activationCode?: string | null
  enterpriseId: number
  enterpriseName?: string | null
  bindCodeMasked?: string | null
  bindSource?: string | null
  status: DeviceApprovalStatus
  applyRemark?: string | null
  approveRemark?: string | null
  rejectReason?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  reviewedBy?: string | null
  expiresAt?: string | null
  lastSeenAt?: string | null
  effectiveStage?: EffectiveStage | null
  device?: DeviceApiItem | null
  history?: DeviceApprovalApiHistoryItem[] | null
}

export interface DeviceApprovalApiPageData {
  items: DeviceApprovalApiItem[]
  total: number
  page: number
  size: number
}
