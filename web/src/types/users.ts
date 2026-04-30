import type {
  DefaultScope,
  PageQuery,
  PageResult,
  PermissionCode,
  PlatformRole,
  ScopeMembership,
  UserRole,
} from './api'
import type { AuditListData } from './audit'

export interface UserListQuery extends PageQuery {
  keyword?: string
  enabled?: boolean
  enterpriseId?: number | string
}

export interface UserSummary {
  id: number
  username: string
  nickname?: string
  enterpriseId?: number | string
  enterpriseName?: string
  enabled: boolean
  roles: UserRole[]
  platformRoles?: PlatformRole[]
  memberships?: ScopeMembership[]
  permissions?: PermissionCode[]
  defaultScope?: DefaultScope | null
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface UserDetail extends UserSummary {}

export type UserListData = PageResult<UserSummary>

export interface RoleOptionItem {
  id: number
  roleCode: UserRole
  roleName: string
}

export interface CreateUserPayload {
  username: string
  password: string
  nickname?: string
  enterpriseId?: number | string | null
  enabled?: boolean
  roles: UserRole[]
}

export interface UpdateUserProfilePayload {
  username: string
  nickname?: string
  enterpriseId?: number | string | null
}

export interface UpdateUserRolesPayload {
  roles: UserRole[]
}

export interface UpdateUserStatusPayload {
  enabled: boolean
}

export interface ResetUserPasswordPayload {
  newPassword: string
}

export type UserAuditListData = AuditListData
