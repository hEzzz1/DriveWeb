import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/api'
import { ApiError } from '../types/api'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
})

let tokenGetter: (() => string) | null = null

export function setAuthTokenGetter(getter: () => string): void {
  tokenGetter = getter
}

http.interceptors.request.use((config) => {
  const token = tokenGetter?.()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

function unwrapResponse<T>(payload: ApiResponse<T>, status: number): T {
  if (!payload || typeof payload.code !== 'number') {
    throw new ApiError('响应结构异常', 50001, undefined, status)
  }

  if (payload.code !== 0) {
    throw new ApiError(payload.message || '请求失败', payload.code, payload.traceId, status)
  }

  return payload.data
}

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined

    if (payload && typeof payload.code === 'number') {
      return new ApiError(
        payload.message || '请求失败',
        payload.code,
        payload.traceId,
        error.response?.status,
      )
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('请求超时，请稍后重试')
    }

    return new ApiError('网络异常，请检查连接后重试')
  }

  return new ApiError(error instanceof Error ? error.message : '未知错误')
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request<ApiResponse<T>>(config)
    return unwrapResponse(response.data, response.status)
  } catch (error) {
    throw normalizeError(error)
  }
}
