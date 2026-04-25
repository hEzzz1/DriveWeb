export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER'
export type SortOrder = 'ASC' | 'DESC'

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
  roles: UserRole[]
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
