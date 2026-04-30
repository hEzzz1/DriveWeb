export type PlatformRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'PLATFORM_SYS_ADMIN'
  | 'PLATFORM_RISK_ADMIN'
export type BusinessRole =
  | 'ORG_ADMIN'
  | 'ORG_OPERATOR'
  | 'ORG_ANALYST'
  | 'ORG_VIEWER'
export type UserRole = PlatformRole | BusinessRole
export type ScopeType = 'PLATFORM' | 'ENTERPRISE' | 'FLEET'
export type PermissionCode =
  | 'overview.read'
  | 'alert.read'
  | 'alert.handle'
  | 'stats.read'
  | 'rule.read'
  | 'rule.manage'
  | 'audit.read'
  | 'audit.export'
  | 'system.read'
  | 'user.read'
  | 'user.manage'
  | 'enterprise.read'
  | 'enterprise.manage'
  | 'activation_code.read'
  | 'activation_code.manage'
  | 'fleet.read'
  | 'fleet.manage'
  | 'driver.read'
  | 'driver.manage'
  | 'vehicle.read'
  | 'vehicle.manage'
  | 'device.read'
  | 'device.manage'
  | 'session.read'
  | 'session.force_sign_out'
export type SortOrder = 'ASC' | 'DESC'

export interface ScopeMembership {
  role: UserRole
  scopeType: ScopeType
  enterpriseId?: number | string | null
  fleetId?: number | string | null
}

export interface DefaultScope {
  scopeType: ScopeType
  enterpriseId?: number | string | null
  fleetId?: number | string | null
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginData {
  token: string
  expireAt: string
  roles?: UserRole[]
  permissions?: PermissionCode[]
}

export interface CurrentUserData {
  userId: number | string
  username: string
  nickname?: string
  roles?: UserRole[]
  platformRoles?: PlatformRole[]
  memberships?: ScopeMembership[]
  permissions?: PermissionCode[]
  defaultScope?: DefaultScope | null
  enterpriseId?: number | string | null
  enterpriseName?: string | null
  subjectType?: string
  enabled: boolean
}

export interface PageQuery {
  page?: number
  size?: number
  sortBy?: string
  sortOrder?: SortOrder
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  size: number
 }

export class ApiError extends Error {
  code: number
  traceId?: string
  httpStatus?: number

  constructor(message: string, code = -1, traceId?: string, httpStatus?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.traceId = traceId
    this.httpStatus = httpStatus
  }
}
