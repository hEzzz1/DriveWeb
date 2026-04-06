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
    hydrate,
    login,
    logout,
    hasRole,
  }
})

function isRole(value: string): value is UserRole {
  return value === 'ADMIN' || value === 'OPERATOR' || value === 'VIEWER'
}
