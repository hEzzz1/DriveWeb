import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '../types/api'
import { ApiError } from '../types/api'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const proxyTarget = import.meta.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080'

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
})

let tokenGetter: (() => string) | null = null
let lastErrorToast = ''

export interface RequestConfig extends AxiosRequestConfig {
  silentError?: boolean
}

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
    const status = error.response?.status

    if (payload && typeof payload.code === 'number') {
      return new ApiError(
        payload.message || '请求失败',
        payload.code,
        payload.traceId,
        status,
      )
    }

    if (status === 401) {
      return new ApiError('登录状态失效，请重新登录', 40101, undefined, status)
    }

    if (status === 403) {
      return new ApiError('当前账号无权限执行该操作', 40301, undefined, status)
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('请求超时，请稍后重试')
    }

    if (!error.response) {
      const isRelativeApiBase = apiBaseURL.startsWith('/')
      const targetText = isRelativeApiBase ? `开发代理或后端服务（${proxyTarget}）` : `后端服务（${apiBaseURL}）`
      return new ApiError(`无法连接${targetText}，请确认服务已启动`)
    }

    return new ApiError('网络异常，请检查连接后重试')
  }

  return new ApiError(error instanceof Error ? error.message : '未知错误')
}

function showGlobalError(error: ApiError): void {
  const message = error.traceId
    ? `${error.message}（traceId: ${error.traceId}）`
    : error.message || '请求失败'

  // Avoid showing the same toast repeatedly when a request retries quickly.
  if (lastErrorToast === message) {
    return
  }

  lastErrorToast = message
  ElMessage.error(message)
  window.setTimeout(() => {
    if (lastErrorToast === message) {
      lastErrorToast = ''
    }
  }, 1800)
}

export async function request<T>(config: RequestConfig): Promise<T> {
  try {
    const response = await http.request<ApiResponse<T>>(config)
    return unwrapResponse(response.data, response.status)
  } catch (error) {
    const normalizedError = normalizeError(error)

    if (!config.silentError) {
      showGlobalError(normalizedError)
    }

    throw normalizedError
  }
}
