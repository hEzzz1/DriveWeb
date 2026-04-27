import { request } from './http'
import type {
  RoleOptionItem,
  UpdateUserRolesPayload,
  UpdateUserStatusPayload,
  UserDetail,
  UserListData,
  UserListQuery,
} from '../types/users'

export function getUserList(params: UserListQuery): Promise<UserListData> {
  return request<UserListData>({
    url: '/users',
    method: 'GET',
    params,
  })
}

export function getUserDetail(id: number | string): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}`,
    method: 'GET',
  })
}

export function updateUserRoles(
  id: number | string,
  payload: UpdateUserRolesPayload,
): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}/roles`,
    method: 'PUT',
    data: payload,
  })
}

export function updateUserStatus(
  id: number | string,
  payload: UpdateUserStatusPayload,
): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}/status`,
    method: 'PUT',
    data: payload,
  })
}

export function getRoleOptions(): Promise<RoleOptionItem[]> {
  return request<RoleOptionItem[]>({
    url: '/roles',
    method: 'GET',
  })
}
