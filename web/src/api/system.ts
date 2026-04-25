import type {
  SystemServicesResponse,
  SystemHealthSnapshot,
  SystemMonitoringSnapshot,
  SystemSummarySnapshot,
  VersionInfoItem,
} from '../types/system'
import { request } from './http'

export function getSystemHealth(): Promise<SystemHealthSnapshot> {
  return request<SystemHealthSnapshot>({
    method: 'GET',
    url: '/system/health',
  })
}

export function getServiceStatus(): Promise<SystemServicesResponse> {
  return request<SystemServicesResponse>({
    method: 'GET',
    url: '/system/services',
  })
}

export function getSystemMonitoring(): Promise<SystemMonitoringSnapshot> {
  return request<SystemMonitoringSnapshot>({
    method: 'GET',
    url: '/system/monitoring',
  })
}

export function getVersionInfo(): Promise<VersionInfoItem> {
  return request<VersionInfoItem>({
    method: 'GET',
    url: '/system/version',
  })
}

export function getSystemSummary(): Promise<SystemSummarySnapshot> {
  return request<SystemSummarySnapshot>({
    method: 'GET',
    url: '/system/summary',
  })
}
