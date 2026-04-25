import type {
  RuleActionPayload,
  RuleDetail,
  RuleFormPayload,
  RuleListData,
  RuleListQuery,
  RuleVersionSummary,
} from '../types/rules'
import { request } from './http'

export function getRuleList(params: RuleListQuery): Promise<RuleListData> {
  return request<RuleListData>({
    method: 'GET',
    url: '/rules',
    params,
  })
}

export function getRuleDetail(id: number | string): Promise<RuleDetail> {
  return request<RuleDetail>({
    method: 'GET',
    url: `/rules/${id}`,
  })
}

export function saveRule(payload: RuleFormPayload): Promise<RuleDetail> {
  const hasId = Boolean(payload.id)

  return request<RuleDetail>({
    method: hasId ? 'PUT' : 'POST',
    url: hasId ? `/rules/${payload.id}` : '/rules',
    data: payload,
  })
}

export function publishRule(id: number | string, payload?: RuleActionPayload): Promise<RuleDetail> {
  return request<RuleDetail>({
    method: 'POST',
    url: `/rules/${id}/publish`,
    data: payload,
  })
}

export function toggleRuleStatus(
  id: number | string,
  enabled: boolean,
  payload?: RuleActionPayload,
): Promise<RuleDetail> {
  return request<RuleDetail>({
    method: 'POST',
    url: `/rules/${id}/toggle`,
    data: {
      enabled,
      ...payload,
    },
  })
}

export function getRuleVersionHistory(id: number | string): Promise<RuleVersionSummary[]> {
  return request<RuleVersionSummary[]>({
    method: 'GET',
    url: `/rules/${id}/versions`,
  })
}

export function rollbackRule(
  id: number | string,
  payload: RuleActionPayload,
): Promise<RuleDetail> {
  return request<RuleDetail>({
    method: 'POST',
    url: `/rules/${id}/rollback`,
    data: payload,
  })
}
