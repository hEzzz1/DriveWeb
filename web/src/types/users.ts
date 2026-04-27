import type { PageQuery, PageResult, UserRole } from './api'
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

export const userRoleLabelMap: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  ENTERPRISE_ADMIN: '企业管理员',
  SYS_ADMIN: '系统管理员',
  RISK_ADMIN: '风控管理员',
  OPERATOR: '运营人员',
  ANALYST: '分析人员',
  VIEWER: '访客',
}
