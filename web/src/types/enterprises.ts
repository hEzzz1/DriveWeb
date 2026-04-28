import type { PageQuery, PageResult } from './api'
import type { AuditListData } from './audit'
import type { UserSummary } from './users'

export interface EnterpriseListQuery extends PageQuery {
  keyword?: string
  enabled?: boolean
  status?: 0 | 1
}

export interface EnterpriseSummary {
  id: number
  code: string
  name: string
  enabled: boolean
  status: 0 | 1
  contactName?: string
  contactPhone?: string
  remark?: string
  userCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface EnterpriseDetail extends EnterpriseSummary {
  recentUsers?: UserSummary[]
}

export type EnterpriseListData = PageResult<EnterpriseSummary>

export interface CreateEnterprisePayload {
  code: string
  name: string
  contactName?: string
  contactPhone?: string
  remark?: string
}

export interface UpdateEnterprisePayload extends CreateEnterprisePayload {}

export interface UpdateEnterpriseStatusPayload {
  enabled: boolean
}

export type EnterpriseAuditListData = AuditListData

export interface EnterpriseApiItem {
  id: number
  code: string
  name: string
  status?: number | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface EnterpriseApiPageData {
  items: EnterpriseApiItem[]
  total: number
  page: number
  size: number
}
