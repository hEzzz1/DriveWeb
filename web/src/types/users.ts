import type { PageQuery, UserRole } from './api'

export interface UserListQuery extends PageQuery {
  keyword?: string
  enabled?: boolean
}

export interface UserSummary {
  id: number
  username: string
  nickname?: string
  enabled: boolean
  roles: UserRole[]
  createdAt?: string
  updatedAt?: string
}

export interface UserDetail extends UserSummary {}

export interface UserListData {
  total: number
  page: number
  size: number
  items: UserSummary[]
}

export interface RoleOptionItem {
  id: number
  roleCode: UserRole
  roleName: string
}

export interface UpdateUserRolesPayload {
  roles: UserRole[]
}

export interface UpdateUserStatusPayload {
  enabled: boolean
}

export const userRoleLabelMap: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  SYS_ADMIN: '系统管理员',
  RISK_ADMIN: '风控管理员',
  OPERATOR: '运营人员',
  ANALYST: '分析人员',
  VIEWER: '访客',
}
