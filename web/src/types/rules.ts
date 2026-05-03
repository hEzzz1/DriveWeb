import type { PageQuery, PageResult } from './api'

export type RuleType = 'LOW' | 'MID' | 'HIGH'
export type RuleStatus = 'DRAFT' | 'ENABLED' | 'DISABLED'
export type RuleScopeType = 'GLOBAL' | 'FLEET' | 'VEHICLE'
export type RuleVersionStatus = RuleStatus
export type RuleActionType = 'ENABLE' | 'DISABLE' | 'PUBLISH' | 'ROLLBACK'

export interface RuleScope {
  type: RuleScopeType
  targetIds: string[]
}

export interface RuleSummary {
  id: number
  ruleCode: string
  name: string
  type: RuleType
  status: RuleStatus
  currentVersion: string
  threshold: number
  durationSeconds: number
  cooldownSeconds: number
  scope: RuleScope
  updatedBy: string
  updatedAt: string
  publishedAt?: string
  alertCount?: number
  falsePositiveCount?: number
  falsePositiveRate?: number
}

export interface RuleDetail extends RuleSummary {
  description?: string
  versionRemark?: string
}

export interface RuleVersionSummary {
  id: number
  versionNo: number
  version: string
  status: RuleVersionStatus
  changeSummary: string
  createdBy: string
  createdAt: string
  publishedAt?: string
  rollbackTargetVersion?: string
}

export interface RuleListQuery extends PageQuery {
  keyword?: string
  type?: RuleType
  status?: RuleStatus
  version?: string
  scopeType?: RuleScopeType
}

export type RuleListData = PageResult<RuleSummary>

export interface RuleFormPayload {
  id?: number
  ruleCode: string
  name: string
  type: RuleType
  description?: string
  threshold: number
  durationSeconds: number
  cooldownSeconds: number
  scope: RuleScope
  versionRemark?: string
}

export interface RuleActionPayload {
  remark?: string
  targetVersion?: string
  versionNo?: number
}

export const ruleTypeOptions: Array<{ label: string; value: RuleType }> = [
  { label: '低风险规则', value: 'LOW' },
  { label: '中风险规则', value: 'MID' },
  { label: '高风险规则', value: 'HIGH' },
]

export const ruleStatusOptions: Array<{ label: string; value: RuleStatus }> = [
  { label: '草稿', value: 'DRAFT' },
  { label: '启用中', value: 'ENABLED' },
  { label: '已停用', value: 'DISABLED' },
]

export const ruleScopeOptions: Array<{ label: string; value: RuleScopeType }> = [
  { label: '全局生效', value: 'GLOBAL' },
  { label: '车队生效', value: 'FLEET' },
  { label: '车辆生效', value: 'VEHICLE' },
]

export const ruleVersionStatusLabelMap: Record<RuleVersionStatus, string> = {
  DRAFT: '草稿',
  ENABLED: '启用中',
  DISABLED: '已停用',
}

export const ruleStatusLabelMap: Record<RuleStatus, string> = {
  DRAFT: '草稿',
  ENABLED: '启用中',
  DISABLED: '已停用',
}
