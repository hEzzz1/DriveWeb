import type { PageQuery, PageResult } from './api'

export type AuditActionType = 'CREATE' | 'UPDATE' | 'ENABLE' | 'DISABLE' | 'PUBLISH' | 'ROLLBACK' | 'EXPORT'
export type AuditTargetType = 'RULE' | 'SYSTEM' | 'ALGORITHM' | 'USER'
export type AuditResult = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED'

export interface AuditFilter extends PageQuery {
  startTime?: string
  endTime?: string
  actionType?: AuditActionType
  operator?: string
  targetType?: AuditTargetType
  result?: AuditResult
}

export interface AuditSummary {
  id: number
  traceId: string
  actionType: AuditActionType
  operator: string
  targetType: AuditTargetType
  targetName: string
  result: AuditResult
  occurredAt: string
}

export interface AuditChangeSnapshot {
  before?: string
  after?: string
  summary?: string
}

export interface AuditLinkInfo {
  requestId?: string
  messageId?: string
  websocketSessionId?: string
  latencyMs?: number
  downstreamStatus?: string
}

export interface AuditRelatedObject {
  objectId: string
  objectType: AuditTargetType
  objectName: string
  version?: string
}

export interface AuditDetail extends AuditSummary {
  description?: string
  change: AuditChangeSnapshot
  linkInfo?: AuditLinkInfo
  relatedObjects: AuditRelatedObject[]
}

export type AuditListData = PageResult<AuditSummary>

export interface AuditExportParams {
  startTime?: string
  endTime?: string
  actionType?: AuditActionType
  operator?: string
  targetType?: AuditTargetType
  result?: AuditResult
  format?: 'CSV' | 'XLSX'
}

export const auditActionOptions: Array<{ label: string; value: AuditActionType }> = [
  { label: '创建', value: 'CREATE' },
  { label: '更新', value: 'UPDATE' },
  { label: '启用', value: 'ENABLE' },
  { label: '停用', value: 'DISABLE' },
  { label: '发布', value: 'PUBLISH' },
  { label: '回滚', value: 'ROLLBACK' },
  { label: '导出', value: 'EXPORT' },
]

export const auditTargetOptions: Array<{ label: string; value: AuditTargetType }> = [
  { label: '规则', value: 'RULE' },
  { label: '系统', value: 'SYSTEM' },
  { label: '算法', value: 'ALGORITHM' },
  { label: '用户', value: 'USER' },
]

export const auditResultOptions: Array<{ label: string; value: AuditResult }> = [
  { label: '成功', value: 'SUCCESS' },
  { label: '部分成功', value: 'PARTIAL_SUCCESS' },
  { label: '失败', value: 'FAILED' },
]
