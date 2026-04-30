import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CurrentUserData,
  DefaultScope,
  LoginRequest,
  PermissionCode,
  PlatformRole,
  ScopeMembership,
  UserRole,
} from '../types/api'
import { getCurrentUser, login as loginApi } from '../api/auth'
import {
  buildDisplayRoles,
  buildEffectiveRoles,
  deriveMemberships,
  derivePlatformRoles,
  formatRoleLabel,
  formatScopeLabel,
  normalizeDefaultScope,
  normalizePermissionList,
  normalizePlatformRoleList,
  normalizeScopeMembershipList,
  normalizeUserRoleList,
  resolveDefaultScope,
  resolvePermissionsFromRoles,
  resolveWorkspaceDomain,
  ROLE_PRIORITY,
} from '../access/auth-model'
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
  const nickname = ref('')
  const token = ref('')
  const expireAt = ref('')
  const roles = ref<UserRole[]>([])
  const platformRoles = ref<PlatformRole[]>([])
  const memberships = ref<ScopeMembership[]>([])
  const permissions = ref<PermissionCode[]>([])
  const defaultScope = ref<DefaultScope | null>(null)
  const userId = ref<number | string | null>(null)
  const enterpriseId = ref<number | string | null>(null)
  const enterpriseName = ref('')
  const subjectType = ref('')
  const enabled = ref(false)
  const hydrated = ref(false)

  setAuthTokenGetter(() => token.value)

  const isAuthenticated = computed(() => Boolean(token.value) && !isTokenExpired(expireAt.value))
  const effectiveRoles = computed(() =>
    buildEffectiveRoles(roles.value, platformRoles.value, memberships.value, enterpriseId.value),
  )
  const displayRoles = computed(() => buildDisplayRoles(roles.value, platformRoles.value, memberships.value))
  const roleText = computed(() =>
    displayRoles.value.length ? displayRoles.value.map((role) => formatRoleLabel(role)).join(' / ') : '-',
  )
  const scopeText = computed(() => formatScopeLabel(defaultScope.value))
  const expireAtText = computed(() => formatExpiryLocal(expireAt.value))
  const minutesLeft = computed(() => minutesUntilExpiry(expireAt.value))
  const willExpireSoon = computed(() => {
    const value = minutesLeft.value
    return value !== null && value >= 0 && value <= 30
  })
  const primaryRole = computed(() => ROLE_PRIORITY.find((role) => effectiveRoles.value.includes(role)) || null)
  const isSuperAdmin = computed(() => effectiveRoles.value.includes('PLATFORM_SUPER_ADMIN'))
  const isEnterpriseAdmin = computed(() => effectiveRoles.value.includes('ORG_ADMIN'))
  const isUserAdmin = computed(() => hasPermission('user.manage'))
  const workspaceDomain = computed(() =>
    resolveWorkspaceDomain(defaultScope.value, platformRoles.value, memberships.value, permissions.value),
  )

  function persist(): void {
    const payload: PersistedAuth = {
      username: username.value,
      nickname: nickname.value || undefined,
      token: token.value,
      expireAt: expireAt.value,
      roles: roles.value,
      platformRoles: platformRoles.value,
      memberships: memberships.value,
      permissions: permissions.value,
      defaultScope: defaultScope.value,
      userId: userId.value ?? undefined,
      enterpriseId: enterpriseId.value ?? undefined,
      enterpriseName: enterpriseName.value || undefined,
      subjectType: subjectType.value || undefined,
      enabled: enabled.value,
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
  }

  function clear(): void {
    username.value = ''
    nickname.value = ''
    token.value = ''
    expireAt.value = ''
    roles.value = []
    platformRoles.value = []
    memberships.value = []
    permissions.value = []
    defaultScope.value = null
    userId.value = null
    enterpriseId.value = null
    enterpriseName.value = ''
    subjectType.value = ''
    enabled.value = false
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
      nickname.value = parsed.nickname || ''
      token.value = parsed.token
      expireAt.value = parsed.expireAt
      roles.value = normalizeUserRoleList(parsed.roles)
      platformRoles.value = normalizePlatformRoleList(parsed.platformRoles)
      memberships.value = normalizeScopeMembershipList(parsed.memberships)
      permissions.value = normalizePermissionList(parsed.permissions)
      defaultScope.value = normalizeDefaultScope(parsed.defaultScope)
      userId.value = parsed.userId ?? null
      enterpriseId.value = parsed.enterpriseId ?? null
      enterpriseName.value = parsed.enterpriseName || ''
      subjectType.value = parsed.subjectType || ''
      enabled.value = Boolean(parsed.enabled)

      const resolvedPlatformRoles = platformRoles.value.length
        ? platformRoles.value
        : derivePlatformRoles(roles.value)
      const resolvedMemberships = memberships.value.length
        ? memberships.value
        : deriveMemberships(roles.value, enterpriseId.value)

      platformRoles.value = resolvedPlatformRoles
      memberships.value = resolvedMemberships
      permissions.value = permissions.value.length
        ? permissions.value
        : resolvePermissionsFromRoles(
            buildEffectiveRoles(roles.value, resolvedPlatformRoles, resolvedMemberships, enterpriseId.value),
          )
      defaultScope.value = resolveDefaultScope(
        defaultScope.value,
        resolvedPlatformRoles,
        resolvedMemberships,
        enterpriseId.value,
      )

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
    roles.value = normalizeUserRoleList(data.roles)
    permissions.value = normalizePermissionList(data.permissions)
    await syncCurrentUser()
    persist()
  }

  async function syncCurrentUser(): Promise<void> {
    if (!token.value) {
      return
    }

    const data = await getCurrentUser()
    applyCurrentUser(data)
    persist()
  }

  function applyCurrentUser(data: CurrentUserData): void {
    userId.value = data.userId
    username.value = data.username
    nickname.value = data.nickname || ''
    roles.value = normalizeUserRoleList(data.roles)
    const explicitPlatformRoles = normalizePlatformRoleList(data.platformRoles)
    const explicitMemberships = normalizeScopeMembershipList(data.memberships)
    const resolvedPlatformRoles = explicitPlatformRoles.length
      ? explicitPlatformRoles
      : derivePlatformRoles(roles.value)
    const resolvedMemberships = explicitMemberships.length
      ? explicitMemberships
      : deriveMemberships(roles.value, data.enterpriseId ?? null)
    const effectiveRoleSet = buildEffectiveRoles(
      roles.value,
      resolvedPlatformRoles,
      resolvedMemberships,
      data.enterpriseId ?? null,
    )
    const explicitPermissions = normalizePermissionList(data.permissions)
    const explicitDefaultScope = normalizeDefaultScope(data.defaultScope)

    platformRoles.value = resolvedPlatformRoles
    memberships.value = resolvedMemberships
    permissions.value = explicitPermissions.length
      ? explicitPermissions
      : resolvePermissionsFromRoles(effectiveRoleSet)
    defaultScope.value = resolveDefaultScope(
      explicitDefaultScope,
      resolvedPlatformRoles,
      resolvedMemberships,
      data.enterpriseId ?? null,
    )
    enterpriseId.value = data.enterpriseId ?? defaultScope.value?.enterpriseId ?? null
    enterpriseName.value = data.enterpriseName || ''
    subjectType.value = data.subjectType || ''
    enabled.value = Boolean(data.enabled)
  }

  function logout(): void {
    clear()
  }

  function hasRole(role: UserRole): boolean {
    return effectiveRoles.value.includes(role)
  }

  function hasAnyRole(targetRoles: UserRole[]): boolean {
    return targetRoles.some((role) => effectiveRoles.value.includes(role))
  }

  function hasPermission(permission: PermissionCode): boolean {
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(targetPermissions: PermissionCode[]): boolean {
    return targetPermissions.some((permission) => permissions.value.includes(permission))
  }

  function getDefaultRoute(): string {
    if (workspaceDomain.value === 'platform') {
      if (hasAnyPermission(['enterprise.read'])) {
        return '/platform/enterprises'
      }

      if (hasAnyPermission(['user.read'])) {
        return '/platform/enterprise-admins'
      }

      if (hasAnyPermission(['rule.read'])) {
        return '/platform/rules'
      }

      if (hasAnyPermission(['audit.read'])) {
        return '/platform/audit'
      }

      if (hasAnyPermission(['system.read'])) {
        return '/platform/system/health'
      }

      return '/account/session'
    }

    if (hasAnyPermission(['overview.read'])) {
      return '/org/overview'
    }

    if (hasAnyPermission(['alert.read'])) {
      return '/org/alerts'
    }

    if (hasAnyPermission(['stats.read'])) {
      return '/org/stats/trend'
    }

    if (hasAnyPermission(['user.read'])) {
      return '/org/users'
    }

    if (hasAnyPermission(['fleet.read'])) {
      return '/org/fleets'
    }

    if (hasAnyPermission(['driver.read'])) {
      return '/org/drivers'
    }

    if (hasAnyPermission(['vehicle.read'])) {
      return '/org/vehicles'
    }

    if (hasAnyPermission(['device.read'])) {
      return '/org/devices'
    }

    if (hasAnyPermission(['session.read'])) {
      return '/org/sessions'
    }

    if (hasAnyPermission(['enterprise.read'])) {
      return '/org/enterprise-profile'
    }

    if (hasAnyPermission(['audit.read'])) {
      return '/platform/audit'
    }

    if (hasAnyPermission(['rule.read'])) {
      return '/platform/rules'
    }

    if (hasAnyPermission(['system.read'])) {
      return '/platform/system/health'
    }

    return '/account/session'
  }

  function canDisposeAlerts(): boolean {
    return hasPermission('alert.handle')
  }

  function canManageRules(): boolean {
    return hasPermission('rule.manage')
  }

  function canExportAudit(): boolean {
    return hasPermission('audit.export')
  }

  function canManageSystem(): boolean {
    return hasPermission('system.read')
  }

  function canManageUsers(): boolean {
    return hasPermission('user.manage')
  }

  function canReadEnterprises(): boolean {
    return hasPermission('enterprise.read')
  }

  return {
    username,
    nickname,
    token,
    expireAt,
    roles,
    platformRoles,
    memberships,
    permissions,
    defaultScope,
    userId,
    enterpriseId,
    enterpriseName,
    subjectType,
    enabled,
    hydrated,
    isAuthenticated,
    effectiveRoles,
    displayRoles,
    roleText,
    scopeText,
    expireAtText,
    minutesLeft,
    willExpireSoon,
    primaryRole,
    isSuperAdmin,
    isEnterpriseAdmin,
    isUserAdmin,
    workspaceDomain,
    hydrate,
    login,
    syncCurrentUser,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    getDefaultRoute,
    canDisposeAlerts,
    canManageRules,
    canExportAudit,
    canManageSystem,
    canManageUsers,
    canReadEnterprises,
  }
})
