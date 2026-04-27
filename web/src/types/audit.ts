import type { PageQuery, PageResult } from './api'

export type AuditModule = 'SYSTEM' | 'RULE' | 'USER' | 'ENTERPRISE' | string
export type AuditTargetType = 'RULE' | 'SYSTEM' | 'AUDIT' | 'USER' | 'ENTERPRISE' | string
export type AuditResult = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | string

export interface AuditFilter extends PageQuery {
  module?: AuditModule
  actionType?: string
  targetType?: AuditTargetType
  targetId?: string
  actionBy?: number
  startTime?: string
  endTime?: string
}

export interface AuditSummary {
  id: number
  operatorId: number
  operatorName: string
  module: AuditModule
  action: string
  targetId?: string
  actionType: string
  actionBy: number
  actionTime: string
  actionTargetType: AuditTargetType
  actionTargetId?: string
  actionResult: AuditResult
  actionRemark?: string
  traceId?: string
  ip?: string
  userAgent?: string
}

export interface AuditJsonSnapshot {
  [key: string]: unknown
}

export interface UserChangeAuditItem {
  operatorUserId?: number
  operatorRoles?: string[]
  operatorEnterpriseId?: number | null
  targetType?: 'USER'
  targetId?: number | string
  targetEnterpriseId?: number | null
  before?: AuditJsonSnapshot
  after?: AuditJsonSnapshot
}

export interface EnterpriseChangeAuditItem {
  operatorUserId?: number
  operatorRoles?: string[]
  operatorEnterpriseId?: number | null
  targetType?: 'ENTERPRISE'
  targetId?: number | string
  targetEnterpriseId?: number | null
  before?: AuditJsonSnapshot
  after?: AuditJsonSnapshot
}

export interface AuditDetail extends AuditSummary {
  detailJson?: string
  createdAt?: string
  parsedDetail?: AuditJsonSnapshot | UserChangeAuditItem | EnterpriseChangeAuditItem | null
}

export type AuditListData = PageResult<AuditSummary>

export interface AuditExportData {
  exportedAt: string
  total: number
  items: AuditSummary[]
}

export const auditModuleOptions: Array<{ label: string; value: AuditModule }> = [
  { label: '系统', value: 'SYSTEM' },
  { label: '规则', value: 'RULE' },
  { label: '用户', value: 'USER' },
  { label: '企业', value: 'ENTERPRISE' },
]

export const auditTargetOptions: Array<{ label: string; value: AuditTargetType }> = [
  { label: '规则', value: 'RULE' },
  { label: '系统', value: 'SYSTEM' },
  { label: '审计', value: 'AUDIT' },
  { label: '用户', value: 'USER' },
  { label: '企业', value: 'ENTERPRISE' },
]

export const auditResultOptions: Array<{ label: string; value: AuditResult }> = [
  { label: '成功', value: 'SUCCESS' },
  { label: '部分成功', value: 'PARTIAL_SUCCESS' },
  { label: '失败', value: 'FAILED' },
]
