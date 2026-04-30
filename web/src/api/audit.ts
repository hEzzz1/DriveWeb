import type {
  AuditDetail,
  AuditExportData,
  AuditFilter,
  AuditListData,
} from '../types/audit'
import { request } from './http'

export function getPlatformAuditList(params: AuditFilter): Promise<AuditListData> {
  return request<AuditListData>({
    method: 'GET',
    url: '/platform/audit',
    params,
  })
}

export function getPlatformAuditDetail(id: number | string): Promise<AuditDetail> {
  return request<AuditDetail>({
    method: 'GET',
    url: `/platform/audit/${id}`,
  })
}

export function exportPlatformAuditLogs(payload: AuditFilter): Promise<AuditExportData> {
  return request<AuditExportData>({
    method: 'GET',
    url: '/platform/audit/export',
    params: payload,
  })
}

export function getOrgAuditList(params: AuditFilter): Promise<AuditListData> {
  return request<AuditListData>({
    method: 'GET',
    url: '/org/audit',
    params,
  })
}

export function getOrgAuditDetail(id: number | string): Promise<AuditDetail> {
  return request<AuditDetail>({
    method: 'GET',
    url: `/org/audit/${id}`,
  })
}

export function exportOrgAuditLogs(payload: AuditFilter): Promise<AuditExportData> {
  return request<AuditExportData>({
    method: 'GET',
    url: '/org/audit/export',
    params: payload,
  })
}
