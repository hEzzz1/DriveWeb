import { request } from './http'
import type { EnterpriseBindCodeApiItem, EnterpriseBindCodeSummary } from '../types/enterprise-bind-codes'

function normalizeEnterpriseBindCode(item: EnterpriseBindCodeApiItem): EnterpriseBindCodeSummary {
  return {
    enterpriseId: item.enterpriseId,
    enterpriseName: item.enterpriseName || undefined,
    bindCode: item.bindCode,
    bindCodeMasked: item.bindCodeMasked || undefined,
    status: item.status,
    rotatedAt: item.rotatedAt || undefined,
    expiresAt: item.expiresAt || undefined,
  }
}

export function getEnterpriseBindCode(
  enterpriseId: number | string,
  options?: { silentError?: boolean },
): Promise<EnterpriseBindCodeSummary> {
  return request<EnterpriseBindCodeApiItem>({
    url: `/enterprises/${enterpriseId}/bind-code`,
    method: 'GET',
    silentError: options?.silentError,
  }).then(normalizeEnterpriseBindCode)
}

export function rotateEnterpriseBindCode(enterpriseId: number | string): Promise<EnterpriseBindCodeSummary> {
  return request<EnterpriseBindCodeApiItem>({
    url: `/enterprises/${enterpriseId}/bind-code/rotate`,
    method: 'POST',
  }).then(normalizeEnterpriseBindCode)
}

export function disableEnterpriseBindCode(enterpriseId: number | string): Promise<EnterpriseBindCodeSummary> {
  return request<EnterpriseBindCodeApiItem>({
    url: `/enterprises/${enterpriseId}/bind-code/disable`,
    method: 'POST',
  }).then(normalizeEnterpriseBindCode)
}
