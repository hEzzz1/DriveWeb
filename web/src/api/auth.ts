import type { CurrentUserData, LoginData, LoginRequest } from '../types/api'
import { request } from './http'

export function login(payload: LoginRequest): Promise<LoginData> {
  return request<LoginData>({
    method: 'POST',
    url: '/auth/login',
    data: payload,
    silentError: true,
  })
}

export function getCurrentUser(): Promise<CurrentUserData> {
  return request<CurrentUserData>({
    method: 'GET',
    url: '/auth/me',
  })
}
