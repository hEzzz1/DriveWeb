import type { PageQuery, PageResult } from './api'

export type RuleType = 'FATIGUE' | 'DISTRACTION' | 'OFF_CAMERA' | 'CUSTOM'
export type RuleStatus = 'ENABLED' | 'DISABLED'
export type RuleScopeType = 'GLOBAL' | 'FLEET' | 'VEHICLE'
export type RuleVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ROLLED_BACK'
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
}

export interface RuleDetail extends RuleSummary {
  description?: string
  versionRemark?: string
}

export interface RuleVersionSummary {
  id: number
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
}

export const ruleTypeOptions: Array<{ label: string; value: RuleType }> = [
  { label: '疲劳驾驶', value: 'FATIGUE' },
  { label: '分心驾驶', value: 'DISTRACTION' },
  { label: '脱离视线', value: 'OFF_CAMERA' },
  { label: '自定义规则', value: 'CUSTOM' },
]

export const ruleStatusOptions: Array<{ label: string; value: RuleStatus }> = [
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
  PUBLISHED: '已发布',
  ROLLED_BACK: '已回滚',
}
