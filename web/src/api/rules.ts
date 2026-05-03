import type {
  RuleActionPayload,
  RuleDetail,
  RuleFormPayload,
  RuleListData,
  RuleListQuery,
  RuleStatus,
  RuleSummary,
  RuleType,
  RuleVersionSummary,
} from '../types/rules'
import { request } from './http'

interface RuleApiItem {
  id: number
  ruleCode: string
  ruleName: string
  riskLevel: RuleType | number | string
  riskThreshold: number | string
  durationSeconds: number
  cooldownSeconds: number
  enabled?: boolean | null
  status: RuleStatus
  version: number
  publishedAt?: string | null
  updatedAt?: string | null
  updatedBy?: number | string | null
  createdBy?: number | string | null
  alertCount?: number | null
  falsePositiveCount?: number | null
  falsePositiveRate?: number | string | null
}

interface RuleApiPageData {
  total: number
  page: number
  size: number
  items: RuleApiItem[]
}

interface RuleApiVersionItem {
  id: number
  versionNo: number
  status: RuleStatus
  changeSummary?: string | null
  createdBy?: number | string | null
  createdAt?: string | null
  publishedAt?: string | null
  rollbackTargetVersion?: string | null
}

interface RuleOperationData {
  id: number
}

function normalizeRiskLevel(value: RuleApiItem['riskLevel']): RuleType {
  if (value === 1 || value === '1' || value === 'LOW') {
    return 'LOW'
  }
  if (value === 3 || value === '3' || value === 'HIGH') {
    return 'HIGH'
  }
  return 'MID'
}

function toRiskLevelCode(value: RuleType): number {
  const map: Record<RuleType, number> = {
    LOW: 1,
    MID: 2,
    HIGH: 3,
  }
  return map[value]
}

function normalizeRate(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  return Number(value) || 0
}

function normalizeRule(item: RuleApiItem): RuleSummary {
  return {
    id: item.id,
    ruleCode: item.ruleCode,
    name: item.ruleName,
    type: normalizeRiskLevel(item.riskLevel),
    status: item.status,
    currentVersion: String(item.version ?? '-'),
    threshold: Number(item.riskThreshold) || 0,
    durationSeconds: Number(item.durationSeconds) || 0,
    cooldownSeconds: Number(item.cooldownSeconds) || 0,
    scope: {
      type: 'GLOBAL',
      targetIds: [],
    },
    updatedBy: item.updatedBy === null || item.updatedBy === undefined ? '-' : String(item.updatedBy),
    updatedAt: item.updatedAt || '',
    publishedAt: item.publishedAt || undefined,
    alertCount: Number(item.alertCount) || 0,
    falsePositiveCount: Number(item.falsePositiveCount) || 0,
    falsePositiveRate: normalizeRate(item.falsePositiveRate),
  }
}

function toUpsertPayload(payload: RuleFormPayload) {
  return {
    ruleCode: payload.ruleCode.trim(),
    ruleName: payload.name.trim(),
    riskLevel: toRiskLevelCode(payload.type),
    riskThreshold: payload.threshold,
    durationSeconds: payload.durationSeconds,
    cooldownSeconds: payload.cooldownSeconds,
    changeRemark: payload.versionRemark?.trim() || undefined,
  }
}

export function getRuleList(params: RuleListQuery): Promise<RuleListData> {
  return request<RuleApiPageData>({
    method: 'GET',
    url: '/platform/rules',
    params: {
      page: params.page,
      size: params.size,
      keyword: params.keyword,
      status: params.status,
      riskLevel: params.type ? toRiskLevelCode(params.type) : undefined,
    },
  }).then((data) => ({
    total: data.total,
    page: data.page,
    size: data.size,
    items: Array.isArray(data.items) ? data.items.map(normalizeRule) : [],
  }))
}

export function getRuleDetail(id: number | string): Promise<RuleDetail> {
  return request<RuleApiItem>({
    method: 'GET',
    url: `/platform/rules/${id}`,
  }).then((data) => normalizeRule(data) as RuleDetail)
}

export function saveRule(payload: RuleFormPayload): Promise<RuleDetail> {
  const hasId = Boolean(payload.id)

  return request<RuleOperationData>({
    method: hasId ? 'PUT' : 'POST',
    url: hasId ? `/platform/rules/${payload.id}` : '/platform/rules',
    data: toUpsertPayload(payload),
  }).then((data) => getRuleDetail(data.id))
}

export function publishRule(id: number | string, payload?: RuleActionPayload): Promise<RuleDetail> {
  return request<RuleOperationData>({
    method: 'POST',
    url: `/platform/rules/${id}/publish`,
    data: {
      changeRemark: payload?.remark,
    },
  }).then((data) => getRuleDetail(data.id))
}

export function toggleRuleStatus(
  id: number | string,
  enabled: boolean,
  payload?: RuleActionPayload,
): Promise<RuleDetail> {
  void enabled
  return request<RuleOperationData>({
    method: 'POST',
    url: `/platform/rules/${id}/toggle`,
    data: payload?.remark ? { changeRemark: payload.remark } : undefined,
  }).then((data) => getRuleDetail(data.id))
}

export function getRuleVersionHistory(id: number | string): Promise<RuleVersionSummary[]> {
  return request<RuleApiVersionItem[]>({
    method: 'GET',
    url: `/platform/rules/${id}/versions`,
  }).then((items) =>
    (Array.isArray(items) ? items : []).map((item) => ({
      id: item.id,
      versionNo: item.versionNo,
      version: String(item.versionNo),
      status: item.status,
      changeSummary: item.changeSummary || '',
      createdBy: item.createdBy === null || item.createdBy === undefined ? '-' : String(item.createdBy),
      createdAt: item.createdAt || '',
      publishedAt: item.publishedAt || undefined,
      rollbackTargetVersion: item.rollbackTargetVersion || undefined,
    })),
  )
}

export function rollbackRule(
  id: number | string,
  payload: RuleActionPayload,
): Promise<RuleDetail> {
  const versionNo = payload.versionNo || Number(payload.targetVersion)
  return request<RuleOperationData>({
    method: 'POST',
    url: `/platform/rules/${id}/rollback`,
    data: {
      versionNo,
      changeRemark: payload.remark,
    },
  }).then((data) => getRuleDetail(data.id))
}
