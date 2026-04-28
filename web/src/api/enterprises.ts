import { request } from './http'
import type {
  CreateEnterprisePayload,
  EnterpriseApiItem,
  EnterpriseApiPageData,
  EnterpriseDetail,
  EnterpriseListData,
  EnterpriseListQuery,
  UpdateEnterprisePayload,
  UpdateEnterpriseStatusPayload,
} from '../types/enterprises'

function normalizeEnterprise(item: EnterpriseApiItem): EnterpriseDetail {
  const status = item.status === 0 ? 0 : 1

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    enabled: status === 1,
    status,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

export function getEnterpriseList(params: EnterpriseListQuery): Promise<EnterpriseListData> {
  return request<EnterpriseApiPageData>({
    url: '/enterprises',
    method: 'GET',
    params: {
      ...params,
      status: params.status ?? (typeof params.enabled === 'boolean' ? (params.enabled ? 1 : 0) : undefined),
    },
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeEnterprise) : [],
  }))
}

export function getEnterpriseDetail(id: number | string): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: `/enterprises/${id}`,
    method: 'GET',
  }).then(normalizeEnterprise)
}

export function createEnterprise(payload: CreateEnterprisePayload): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: '/enterprises',
    method: 'POST',
    data: payload,
  }).then(normalizeEnterprise)
}

export function updateEnterprise(
  id: number | string,
  payload: UpdateEnterprisePayload,
): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: `/enterprises/${id}`,
    method: 'PUT',
    data: payload,
  }).then(normalizeEnterprise)
}

export function updateEnterpriseStatus(
  id: number | string,
  payload: UpdateEnterpriseStatusPayload,
): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: `/enterprises/${id}/status`,
    method: 'PUT',
    data: {
      status: payload.enabled ? 1 : 0,
    },
  }).then(normalizeEnterprise)
}
