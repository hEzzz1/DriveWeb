import type { DeviceApprovalStatus } from '../types/device-approvals'
import type {
  DeviceLifecycleStatus,
  EffectiveStage,
  EnterpriseBindStatus,
  SessionStage,
  VehicleBindStatus,
} from '../types/devices'

export type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

export function approvalStatusText(status: DeviceApprovalStatus): string {
  switch (status) {
    case 'PENDING':
      return '待审批'
    case 'APPROVED':
      return '已通过'
    case 'REJECTED':
      return '已驳回'
    case 'EXPIRED':
      return '已过期'
  }
}

export function approvalStatusTagType(status: DeviceApprovalStatus): TagType {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'EXPIRED':
      return 'info'
  }
}

export function lifecycleStatusText(status: DeviceLifecycleStatus): string {
  switch (status) {
    case 'NEW':
      return '未激活'
    case 'ACTIVATED':
      return '已激活'
    case 'DISABLED':
      return '已禁用'
  }
}

export function lifecycleStatusTagType(status: DeviceLifecycleStatus): TagType {
  switch (status) {
    case 'NEW':
      return 'warning'
    case 'ACTIVATED':
      return 'success'
    case 'DISABLED':
      return 'info'
  }
}

export function enterpriseBindStatusText(status: EnterpriseBindStatus): string {
  switch (status) {
    case 'UNBOUND':
      return '未绑定企业'
    case 'PENDING':
      return '绑定申请审核中'
    case 'APPROVED':
      return '企业已绑定'
    case 'REJECTED':
      return '申请已驳回'
    case 'EXPIRED':
      return '申请已过期，请重新申请'
  }
}

export function enterpriseBindStatusTagType(status: EnterpriseBindStatus): TagType {
  switch (status) {
    case 'UNBOUND':
      return 'info'
    case 'PENDING':
      return 'warning'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'EXPIRED':
      return 'info'
  }
}

export function vehicleBindStatusText(status: VehicleBindStatus): string {
  switch (status) {
    case 'UNASSIGNED':
      return '待分配车辆'
    case 'ASSIGNED':
      return '已分配车辆'
  }
}

export function vehicleBindStatusTagType(status: VehicleBindStatus): TagType {
  switch (status) {
    case 'UNASSIGNED':
      return 'warning'
    case 'ASSIGNED':
      return 'success'
  }
}

export function sessionStageText(status: SessionStage): string {
  switch (status) {
    case 'IDLE':
      return '空闲中'
    case 'ACTIVE':
      return '采集中'
  }
}

export function sessionStageTagType(status: SessionStage): TagType {
  switch (status) {
    case 'IDLE':
      return 'info'
    case 'ACTIVE':
      return 'primary'
  }
}

export function effectiveStageText(stage: EffectiveStage): string {
  switch (stage) {
    case 'APPLY_BIND':
      return '待申请企业绑定'
    case 'PENDING_APPROVAL':
      return '待审批'
    case 'WAITING_VEHICLE':
      return '待分配车辆'
    case 'READY_SIGN_IN':
      return '设备可签到'
    case 'IN_SESSION':
      return '采集中'
    case 'DISABLED':
      return '已禁用'
  }
}

export function effectiveStageTagType(stage: EffectiveStage): TagType {
  switch (stage) {
    case 'APPLY_BIND':
      return 'info'
    case 'PENDING_APPROVAL':
      return 'warning'
    case 'WAITING_VEHICLE':
      return 'warning'
    case 'READY_SIGN_IN':
      return 'success'
    case 'IN_SESSION':
      return 'primary'
    case 'DISABLED':
      return 'info'
  }
}

export function bindSourceText(source?: string): string {
  if (source === 'ENTERPRISE_BIND_CODE') {
    return '企业绑定码'
  }

  return source || '-'
}

export function enterpriseBindCodeStatusText(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return '生效中'
    case 'DISABLED':
      return '已停用'
    case 'EXPIRED':
      return '已过期'
    default:
      return status || '-'
  }
}

export function enterpriseBindCodeStatusTagType(status: string): TagType {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'DISABLED':
      return 'info'
    case 'EXPIRED':
      return 'warning'
    default:
      return 'info'
  }
}
