import type { DefaultScope, PermissionCode, PlatformRole, ScopeMembership } from '../types/api'

export const AUTH_STORAGE_KEY = 'driveweb.auth'

export interface PersistedAuth {
  username: string
  nickname?: string
  token: string
  expireAt: string
  roles: string[]
  platformRoles?: PlatformRole[]
  memberships?: ScopeMembership[]
  permissions?: PermissionCode[]
  defaultScope?: DefaultScope | null
  userId?: number | string
  enterpriseId?: number | string
  enterpriseName?: string
  subjectType?: string
  enabled?: boolean
}

export function isTokenExpired(expireAt: string): boolean {
  const expireMs = Date.parse(expireAt)

  if (Number.isNaN(expireMs)) {
    return true
  }

  return Date.now() >= expireMs
}

export function minutesUntilExpiry(expireAt: string): number | null {
  const expireMs = Date.parse(expireAt)

  if (Number.isNaN(expireMs)) {
    return null
  }

  return Math.floor((expireMs - Date.now()) / 60000)
}

export function formatExpiryLocal(expireAt: string): string {
  const expireMs = Date.parse(expireAt)

  if (Number.isNaN(expireMs)) {
    return '-'
  }

  return new Date(expireMs).toLocaleString()
}
