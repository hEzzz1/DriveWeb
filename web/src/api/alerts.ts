import type { AlertDetail, AlertListData, AlertListQuery } from '../types/alerts'
import { request } from './http'

export function getAlertList(params: AlertListQuery): Promise<AlertListData> {
  return request<AlertListData>({
    method: 'GET',
    url: '/alerts',
    params,
  })
}

export function getAlertDetail(id: number | string): Promise<AlertDetail> {
  return request<AlertDetail>({
    method: 'GET',
    url: `/alerts/${id}`,
  })
}
