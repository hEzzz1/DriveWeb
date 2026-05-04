import type {
  AlertActionLogsData,
  AlertActionType,
  AlertDetail,
  AlertListData,
  AlertListQuery,
} from '../types/alerts'
import { request, requestBlob } from './http'

export function getAlertList(params: AlertListQuery): Promise<AlertListData> {
  return request<AlertListData>({
    method: 'GET',
    url: '/org/alerts',
    params,
  })
}

export function getAlertDetail(id: number | string): Promise<AlertDetail> {
  return request<AlertDetail>({
    method: 'GET',
    url: `/org/alerts/${id}`,
  })
}

export function getAlertActionLogs(id: number | string): Promise<AlertActionLogsData> {
  return request<AlertActionLogsData>({
    method: 'GET',
    url: `/org/alerts/${id}/action-logs`,
  })
}

export function getAlertEvidenceBlob(id: number | string): Promise<Blob> {
  return requestBlob({
    method: 'GET',
    url: `/org/alerts/${id}/evidence`,
    silentError: true,
  })
}

export function disposeAlert(
  id: number | string,
  actionType: AlertActionType,
  remark?: string,
): Promise<AlertDetail> {
  const actionPathMap: Record<AlertActionType, string> = {
    CONFIRM: 'confirm',
    FALSE_POSITIVE: 'false-positive',
    CLOSE: 'close',
  }

  return request<AlertDetail>({
    method: 'POST',
    url: `/org/alerts/${id}/${actionPathMap[actionType]}`,
    data: {
      remark,
    },
  })
}
