import { request } from './http'
import type {
  CreateEnterprisePayload,
  EnterpriseDetail,
  EnterpriseListData,
  EnterpriseListQuery,
  UpdateEnterprisePayload,
  UpdateEnterpriseStatusPayload,
} from '../types/enterprises'

export function getEnterpriseList(params: EnterpriseListQuery): Promise<EnterpriseListData> {
  return request<EnterpriseListData>({
    url: '/enterprises',
    method: 'GET',
    params,
  })
}

export function getEnterpriseDetail(id: number | string): Promise<EnterpriseDetail> {
  return request<EnterpriseDetail>({
    url: `/enterprises/${id}`,
    method: 'GET',
  })
}

export function createEnterprise(payload: CreateEnterprisePayload): Promise<EnterpriseDetail> {
  return request<EnterpriseDetail>({
    url: '/enterprises',
    method: 'POST',
    data: payload,
  })
}

export function updateEnterprise(
  id: number | string,
  payload: UpdateEnterprisePayload,
): Promise<EnterpriseDetail> {
  return request<EnterpriseDetail>({
    url: `/enterprises/${id}`,
    method: 'PUT',
    data: payload,
  })
}

export function updateEnterpriseStatus(
  id: number | string,
  payload: UpdateEnterpriseStatusPayload,
): Promise<EnterpriseDetail> {
  return request<EnterpriseDetail>({
    url: `/enterprises/${id}/status`,
    method: 'PUT',
    data: payload,
  })
}
