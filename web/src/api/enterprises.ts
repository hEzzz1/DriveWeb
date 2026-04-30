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
    contactName: item.contactName || undefined,
    contactPhone: item.contactPhone || undefined,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
    updatedAt: item.updatedAt || undefined,
  }
}

function normalizeEnterprisePage(data: EnterpriseApiPageData): EnterpriseListData {
  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeEnterprise) : [],
  }
}

const buildPlatformEnterpriseParams = (params: EnterpriseListQuery) => ({
  ...params,
  status: params.status ?? (typeof params.enabled === 'boolean' ? (params.enabled ? 1 : 0) : undefined),
})

export function getEnterpriseList(params: EnterpriseListQuery): Promise<EnterpriseListData> {
  return request<EnterpriseApiPageData>({
    url: '/enterprises',
    method: 'GET',
    params: buildPlatformEnterpriseParams(params),
  }).then(normalizeEnterprisePage)
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

export function getPlatformEnterpriseList(params: EnterpriseListQuery): Promise<EnterpriseListData> {
  return request<EnterpriseApiPageData>({
    url: '/platform/enterprises',
    method: 'GET',
    params: buildPlatformEnterpriseParams(params),
  }).then(normalizeEnterprisePage)
}

export function getPlatformEnterpriseDetail(id: number | string): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: `/platform/enterprises/${id}`,
    method: 'GET',
  }).then(normalizeEnterprise)
}

export function createPlatformEnterprise(payload: CreateEnterprisePayload): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: '/platform/enterprises',
    method: 'POST',
    data: payload,
  }).then(normalizeEnterprise)
}

export function updatePlatformEnterprise(
  id: number | string,
  payload: UpdateEnterprisePayload,
): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: `/platform/enterprises/${id}`,
    method: 'PUT',
    data: payload,
  }).then(normalizeEnterprise)
}

export function updatePlatformEnterpriseStatus(
  id: number | string,
  payload: UpdateEnterpriseStatusPayload,
): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: `/platform/enterprises/${id}/status`,
    method: 'PUT',
    data: {
      status: payload.enabled ? 1 : 0,
    },
  }).then(normalizeEnterprise)
}

export function getOrgEnterpriseProfile(): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: '/org/enterprise-profile',
    method: 'GET',
  }).then(normalizeEnterprise)
}

export function updateOrgEnterpriseProfile(payload: UpdateEnterprisePayload): Promise<EnterpriseDetail> {
  return request<EnterpriseApiItem>({
    url: '/org/enterprise-profile',
    method: 'PUT',
    data: payload,
  }).then(normalizeEnterprise)
}
