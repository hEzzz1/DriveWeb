import type { PageQuery, PageResult } from './api'
import type { DeviceDetail } from './devices'

export interface DeviceApprovalListQuery extends PageQuery {
  enterpriseId?: number
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface DeviceApprovalHistoryRecord {
  id: number
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
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
  enterpriseId: number
  enterpriseName?: string
  applyRemark?: string
  appliedAt?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewRemark?: string
  lastOnlineAt?: string
}

export interface DeviceApprovalDetail extends DeviceApprovalSummary {
  device?: DeviceDetail
  history: DeviceApprovalHistoryRecord[]
}

export type DeviceApprovalListData = PageResult<DeviceApprovalSummary>

export interface ReviewDeviceApprovalPayload {
  remark?: string
  reason?: string
}

export interface DeviceApprovalApiHistoryItem {
  id: number
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
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
  enterpriseId: number
  enterpriseName?: string | null
  applyRemark?: string | null
  appliedAt?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewRemark?: string | null
  lastOnlineAt?: string | null
  device?: import('./devices').DeviceApiItem | null
  history?: DeviceApprovalApiHistoryItem[] | null
}

export interface DeviceApprovalApiPageData {
  items: DeviceApprovalApiItem[]
  total: number
  page: number
  size: number
}
