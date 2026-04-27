import type {
  AuditDetail,
  AuditExportData,
  AuditFilter,
  AuditListData,
} from '../types/audit'
import { request } from './http'

export function getAuditList(params: AuditFilter): Promise<AuditListData> {
  return request<AuditListData>({
    method: 'GET',
    url: '/audits',
    params,
  })
}

export function getAuditDetail(id: number | string): Promise<AuditDetail> {
  return request<AuditDetail>({
    method: 'GET',
    url: `/audits/${id}`,
  })
}

export function exportAuditLogs(payload: AuditFilter): Promise<AuditExportData> {
  return request<AuditExportData>({
    method: 'GET',
    url: '/audits/export',
    params: payload,
  })
}
