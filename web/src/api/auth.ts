import type { LoginData, LoginRequest } from '../types/api'
import { request } from './http'

export function login(payload: LoginRequest): Promise<LoginData> {
  return request<LoginData>({
    method: 'POST',
    url: '/auth/login',
    data: payload,
  })
}
