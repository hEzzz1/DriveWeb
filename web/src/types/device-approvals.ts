import type { PageQuery, PageResult } from './api'
import type { DeviceApiItem, DeviceDetail } from './devices'

export type DeviceBindLogAction = 'CLAIMED' | 'REBOUND' | 'UNBOUND' | 'AUTO_RECOVERED'

export interface DeviceBindLogListQuery extends PageQuery {
  deviceCode?: string
  action?: DeviceBindLogAction
}

export interface DeviceBindLogSummary {
  id: number
  deviceId?: number
  deviceCode: string
  deviceName?: string
  enterpriseId: number
  enterpriseName?: string
  activationCodeMasked?: string
  action: DeviceBindLogAction
  operatorType?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createdAt?: string
}

export interface DeviceBindLogDetail extends DeviceBindLogSummary {
  device?: DeviceDetail
}

export type DeviceBindLogListData = PageResult<DeviceBindLogSummary>

export interface DeviceBindLogApiItem {
  id: number
  deviceId?: number | null
  deviceCode: string
  deviceName?: string | null
  enterpriseId: number
  enterpriseName?: string | null
  activationCodeMasked?: string | null
  action: DeviceBindLogAction
  operatorType?: string | null
  operatorId?: number | null
  operatorName?: string | null
  remark?: string | null
  createdAt?: string | null
  device?: DeviceApiItem | null
}

export interface DeviceBindLogApiPageData {
  items: DeviceBindLogApiItem[]
  total: number
  page: number
  size: number
}
