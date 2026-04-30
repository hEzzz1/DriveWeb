import { request } from './http'
import { normalizeDevice } from './devices'
import type {
  DeviceBindLogApiItem,
  DeviceBindLogApiPageData,
  DeviceBindLogDetail,
  DeviceBindLogListData,
  DeviceBindLogListQuery,
  DeviceBindLogSummary,
} from '../types/device-approvals'

function normalizeBindLog(item: DeviceBindLogApiItem): DeviceBindLogSummary {
  return {
    id: item.id,
    deviceId: item.deviceId ?? item.device?.id ?? undefined,
    deviceCode: item.deviceCode,
    deviceName: item.deviceName || item.device?.deviceName || undefined,
    enterpriseId: item.enterpriseId,
    enterpriseName: item.enterpriseName || undefined,
    activationCodeMasked: item.activationCodeMasked || undefined,
    action: item.action,
    operatorType: item.operatorType || undefined,
    operatorId: item.operatorId || undefined,
    operatorName: item.operatorName || undefined,
    remark: item.remark || undefined,
    createdAt: item.createdAt || undefined,
  }
}

function normalizeBindLogDetail(item: DeviceBindLogApiItem): DeviceBindLogDetail {
  return {
    ...normalizeBindLog(item),
    device: item.device ? normalizeDevice(item.device) : undefined,
  }
}

export function getDeviceBindLogList(
  enterpriseId: number | string,
  params: DeviceBindLogListQuery,
): Promise<DeviceBindLogListData> {
  return request<DeviceBindLogApiPageData>({
    url: `/enterprises/${enterpriseId}/device-bind-logs`,
    method: 'GET',
    params,
  }).then((data) => ({
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeBindLog) : [],
  }))
}

export function getDeviceBindLogDetail(
  enterpriseId: number | string,
  id: number | string,
): Promise<DeviceBindLogDetail> {
  return request<DeviceBindLogApiItem>({
    url: `/enterprises/${enterpriseId}/device-bind-logs/${id}`,
    method: 'GET',
  }).then(normalizeBindLogDetail)
}
