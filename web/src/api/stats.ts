import type { RequestConfig } from './http'
import { request } from './http'
import type {
  RankingData,
  RankingQuery,
  RealtimeOverviewData,
  RealtimeOverviewQuery,
  TrendData,
  TrendQuery,
} from '../types/stats'

interface RequestOptions {
  silentError?: boolean
}

function toConfig(options?: RequestOptions): Pick<RequestConfig, 'silentError'> {
  return {
    silentError: options?.silentError,
  }
}

export function getRealtimeOverview(
  params: RealtimeOverviewQuery = {},
  options?: RequestOptions,
): Promise<RealtimeOverviewData> {
  return request<RealtimeOverviewData>({
    method: 'GET',
    url: '/org/overview',
    params,
    ...toConfig(options),
  })
}

export function getStatsTrend(params: TrendQuery, options?: RequestOptions): Promise<TrendData> {
  return request<TrendData>({
    method: 'GET',
    url: '/org/stats/trend',
    params,
    ...toConfig(options),
  })
}

export function getStatsRanking(params: RankingQuery, options?: RequestOptions): Promise<RankingData> {
  return request<RankingData>({
    method: 'GET',
    url: '/org/stats/ranking',
    params,
    ...toConfig(options),
  })
}
