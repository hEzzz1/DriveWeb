import type { AuditDetail, AuditJsonSnapshot, AuditModule, AuditResult, AuditSummary } from '../types/audit'

export function parseAuditDetailJson(detailJson?: string): AuditJsonSnapshot | null {
  if (!detailJson) {
    return null
  }

  try {
    return JSON.parse(detailJson) as AuditJsonSnapshot
  } catch {
    return null
  }
}

export function normalizeAuditDetail(detail: AuditDetail): AuditDetail {
  return {
    ...detail,
    parsedDetail: parseAuditDetailJson(detail.detailJson),
  }
}

export function formatAuditResult(result: AuditResult): string {
  if (result === 'SUCCESS') {
    return '成功'
  }

  if (result === 'PARTIAL_SUCCESS') {
    return '部分成功'
  }

  if (result === 'FAILED') {
    return '失败'
  }

  return result
}

export function getAuditResultTagType(result: AuditResult): 'success' | 'warning' | 'danger' | 'info' {
  if (result === 'SUCCESS') {
    return 'success'
  }

  if (result === 'PARTIAL_SUCCESS') {
    return 'warning'
  }

  if (result === 'FAILED') {
    return 'danger'
  }

  return 'info'
}

export function formatAuditModule(module: AuditModule): string {
  if (module === 'SYSTEM') {
    return '系统'
  }

  if (module === 'RULE') {
    return '规则'
  }

  if (module === 'USER') {
    return '用户'
  }

  if (module === 'ENTERPRISE') {
    return '企业'
  }

  return module
}

export function resolveAuditOperatorLabel(item: AuditSummary | AuditDetail): string {
  return item.operatorDisplayName || item.operatorName || item.actionByName || String(item.operatorId || item.actionBy || '-')
}

export function resolveAuditTargetLabel(item: AuditSummary | AuditDetail): string {
  return item.actionTargetName || item.targetName || item.actionTargetId || item.targetId || '-'
}

export function summarizeAuditChange(item: AuditSummary | AuditDetail): string {
  return item.actionRemark || item.actionType || '-'
}
