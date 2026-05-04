import type {
  SystemServicesResponse,
  SystemErrorTraceItem,
  SystemErrorTracePage,
  SystemHealthSnapshot,
  SystemMonitoringSnapshot,
  SystemSummarySnapshot,
  VersionInfoItem,
} from '../types/system'
import { request } from './http'

export function getSystemHealth(): Promise<SystemHealthSnapshot> {
  return request<SystemHealthSnapshot>({
    method: 'GET',
    url: '/platform/system/health',
  })
}

export function getServiceStatus(): Promise<SystemServicesResponse> {
  return request<SystemServicesResponse>({
    method: 'GET',
    url: '/platform/system/services',
  })
}

export function getSystemMonitoring(): Promise<SystemMonitoringSnapshot> {
  return request<SystemMonitoringSnapshot>({
    method: 'GET',
    url: '/platform/system/monitoring',
  })
}

export function getVersionInfo(): Promise<VersionInfoItem> {
  return request<VersionInfoItem>({
    method: 'GET',
    url: '/platform/system/version',
  })
}

export function getSystemSummary(): Promise<SystemSummarySnapshot> {
  return request<SystemSummarySnapshot>({
    method: 'GET',
    url: '/platform/system/summary',
  })
}

export function getSystemErrorTraces(params?: {
  traceId?: string
  page?: number
  size?: number
}): Promise<SystemErrorTracePage> {
  return request<SystemErrorTracePage>({
    method: 'GET',
    url: '/platform/system/diagnostics/errors',
    params,
  })
}

export function getSystemErrorTrace(traceId: string): Promise<SystemErrorTraceItem> {
  return request<SystemErrorTraceItem>({
    method: 'GET',
    url: `/platform/system/diagnostics/errors/${encodeURIComponent(traceId)}`,
  })
}
