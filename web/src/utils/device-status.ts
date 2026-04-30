import type {
  DeviceLifecycleStatus,
  EffectiveStage,
  SessionStage,
  VehicleBindStatus,
} from '../types/devices'

export type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

export function lifecycleStatusText(status: DeviceLifecycleStatus): string {
  switch (status) {
    case 'NEW':
      return '待绑定企业'
    case 'BOUND':
      return '已绑定企业'
    case 'DISABLED':
      return '已禁用'
  }
}

export function lifecycleStatusTagType(status: DeviceLifecycleStatus): TagType {
  switch (status) {
    case 'NEW':
      return 'warning'
    case 'BOUND':
      return 'success'
    case 'DISABLED':
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
    case 'CLAIM_ENTERPRISE':
      return '待输入企业激活码'
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
    case 'CLAIM_ENTERPRISE':
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

export function deviceBindLogActionText(action: string): string {
  switch (action) {
    case 'CLAIMED':
      return '首次认领'
    case 'REBOUND':
      return '重新绑定'
    case 'UNBOUND':
      return '解绑'
    case 'AUTO_RECOVERED':
      return '自动恢复'
    default:
      return action || '-'
  }
}

export function deviceBindLogActionTagType(action: string): TagType {
  switch (action) {
    case 'CLAIMED':
      return 'success'
    case 'REBOUND':
      return 'warning'
    case 'UNBOUND':
      return 'info'
    case 'AUTO_RECOVERED':
      return 'primary'
    default:
      return 'info'
  }
}

export function operatorTypeText(operatorType?: string): string {
  switch (operatorType) {
    case 'EDGE_DEVICE':
      return '边缘设备'
    case 'ADMIN_USER':
      return '管理端用户'
    case 'SYSTEM':
      return '系统'
    default:
      return operatorType || '-'
  }
}

export function enterpriseActivationCodeSourceText(source?: string): string {
  if (source === 'ENTERPRISE_ACTIVATION_CODE') {
    return '企业激活码'
  }

  return source || '-'
}

export function enterpriseActivationCodeStatusText(status: string): string {
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

export function enterpriseActivationCodeStatusTagType(status: string): TagType {
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
