import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginRequest, UserRole } from '../types/api'
import { login as loginApi } from '../api/auth'
import {
  AUTH_STORAGE_KEY,
  formatExpiryLocal,
  isTokenExpired,
  minutesUntilExpiry,
  type PersistedAuth,
} from '../utils/auth'
import { setAuthTokenGetter } from '../api/http'

const ROLE_PRIORITY: UserRole[] = [
  'SUPER_ADMIN',
  'SYS_ADMIN',
  'RISK_ADMIN',
  'OPERATOR',
  'ANALYST',
  'VIEWER',
]

export const useAuthStore = defineStore('auth', () => {
  const username = ref('')
  const token = ref('')
  const expireAt = ref('')
  const roles = ref<UserRole[]>([])
  const hydrated = ref(false)

  setAuthTokenGetter(() => token.value)

  const isAuthenticated = computed(() => Boolean(token.value) && !isTokenExpired(expireAt.value))
  const roleText = computed(() => (roles.value.length ? roles.value.join(' / ') : '-'))
  const expireAtText = computed(() => formatExpiryLocal(expireAt.value))
  const minutesLeft = computed(() => minutesUntilExpiry(expireAt.value))
  const willExpireSoon = computed(() => {
    const value = minutesLeft.value
    return value !== null && value >= 0 && value <= 30
  })
  const primaryRole = computed(() => ROLE_PRIORITY.find((role) => roles.value.includes(role)) || null)
  const isSuperAdmin = computed(() => roles.value.includes('SUPER_ADMIN'))

  function persist(): void {
    const payload: PersistedAuth = {
      username: username.value,
      token: token.value,
      expireAt: expireAt.value,
      roles: roles.value,
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
  }

  function clear(): void {
    username.value = ''
    token.value = ''
    expireAt.value = ''
    roles.value = []
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  function hydrate(): void {
    if (hydrated.value) {
      return
    }

    hydrated.value = true

    const raw = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as PersistedAuth
      username.value = parsed.username
      token.value = parsed.token
      expireAt.value = parsed.expireAt
      roles.value = (parsed.roles || []).filter(isRole) as UserRole[]

      if (!isAuthenticated.value) {
        clear()
      }
    } catch {
      clear()
    }
  }

  async function login(payload: LoginRequest): Promise<void> {
    const data = await loginApi(payload)
    username.value = payload.username
    token.value = data.token
    expireAt.value = data.expireAt
    roles.value = (data.roles || []).filter(isRole) as UserRole[]
    persist()
  }

  function logout(): void {
    clear()
  }

  function hasRole(role: UserRole): boolean {
    return roles.value.includes(role)
  }

  function hasAnyRole(targetRoles: UserRole[]): boolean {
    return isSuperAdmin.value || targetRoles.some((role) => roles.value.includes(role))
  }

  function getDefaultRoute(): string {
    if (isSuperAdmin.value) {
      return '/'
    }

    if (hasAnyRole(['SYS_ADMIN'])) {
      return '/audit'
    }

    if (hasAnyRole(['RISK_ADMIN'])) {
      return '/rules'
    }

    if (hasAnyRole(['OPERATOR', 'ANALYST', 'VIEWER'])) {
      return '/'
    }

    return '/login'
  }

  function canDisposeAlerts(): boolean {
    return hasAnyRole(['OPERATOR'])
  }

  function canManageRules(): boolean {
    return hasAnyRole(['RISK_ADMIN'])
  }

  function canExportAudit(): boolean {
    return hasAnyRole(['SYS_ADMIN'])
  }

  function canManageSystem(): boolean {
    return hasAnyRole(['SYS_ADMIN'])
  }

  function canManageUsers(): boolean {
    return hasAnyRole(['SUPER_ADMIN'])
  }

  return {
    username,
    token,
    expireAt,
    roles,
    hydrated,
    isAuthenticated,
    roleText,
    expireAtText,
    minutesLeft,
    willExpireSoon,
    primaryRole,
    isSuperAdmin,
    hydrate,
    login,
    logout,
    hasRole,
    hasAnyRole,
    getDefaultRoute,
    canDisposeAlerts,
    canManageRules,
    canExportAudit,
    canManageSystem,
    canManageUsers,
  }
})

function isRole(value: string): value is UserRole {
  return ROLE_PRIORITY.includes(value as UserRole)
}
