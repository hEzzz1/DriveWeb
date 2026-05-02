import type { NormalizedAlertRealtimeEvent } from '../types/alerts'
import type {
  WorkspaceAlertFeedItem,
  WorkspaceVisitedEntry,
} from '../types/workspace'

const STORAGE_KEY = 'driveweb:workspace-shell'
const DEFAULT_MAX_ALERTS = 6

export interface WorkspaceShellPreferences {
  sidebarCollapsed: boolean
  pinnedPaths: string[]
  visitedTags: WorkspaceVisitedEntry[]
}

export function loadWorkspaceShellPreferences(): WorkspaceShellPreferences {
  if (typeof window === 'undefined') {
    return createDefaultPreferences()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createDefaultPreferences()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceShellPreferences>

    return {
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
      pinnedPaths: sanitizePathList(parsed.pinnedPaths),
      visitedTags: sanitizeVisitedTags(parsed.visitedTags),
    }
  } catch {
    return createDefaultPreferences()
  }
}

export function saveWorkspaceShellPreferences(value: WorkspaceShellPreferences): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      sidebarCollapsed: Boolean(value.sidebarCollapsed),
      pinnedPaths: sanitizePathList(value.pinnedPaths),
      visitedTags: sanitizeVisitedTags(value.visitedTags),
    }),
  )
}

export function buildWorkspaceAlertFeedItem(
  event: NormalizedAlertRealtimeEvent,
): WorkspaceAlertFeedItem {
  const payload = event.payload

  return {
    id: event.alertId,
    alertNo: sanitizeText(payload.alertNo) || `告警 #${event.alertId}`,
    vehicleId: sanitizeText(payload.vehicleId) || '-',
    driverId: sanitizeText(payload.driverId) || '-',
    riskLevel: normalizeRiskLevel(payload.riskLevel),
    status: normalizeStatus(payload.status),
    triggerTime: sanitizeText(payload.triggerTime) || event.eventAt || new Date().toISOString(),
    eventType: event.eventType,
    eventAt: event.eventAt || sanitizeText(payload.triggerTime) || new Date().toISOString(),
  }
}

export function appendWorkspaceAlertFeed(
  current: WorkspaceAlertFeedItem[],
  nextItem: WorkspaceAlertFeedItem,
  max = DEFAULT_MAX_ALERTS,
): WorkspaceAlertFeedItem[] {
  const merged = new Map<number, WorkspaceAlertFeedItem>()

  for (const item of [...current, nextItem]) {
    merged.set(item.id, item)
  }

  return [...merged.values()]
    .sort((left, right) => Date.parse(right.eventAt) - Date.parse(left.eventAt))
    .slice(0, max)
}

function createDefaultPreferences(): WorkspaceShellPreferences {
  return {
    sidebarCollapsed: false,
    pinnedPaths: [],
    visitedTags: [],
  }
}

function sanitizePathList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.map((item) => sanitizeText(item)).filter(Boolean))]
}

function sanitizeVisitedTags(value: unknown): WorkspaceVisitedEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized: WorkspaceVisitedEntry[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const source = item as Partial<WorkspaceVisitedEntry>
    const path = sanitizeText(source.path)
    const label = sanitizeText(source.label)
    const key = sanitizeText(source.key) || path
    const subtitle = sanitizeText(source.subtitle)

    if (!path || !label || seen.has(path)) {
      continue
    }

    seen.add(path)
    normalized.push({ key, label, path, subtitle: subtitle || undefined })
  }

  return normalized
}

function sanitizeText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function normalizeRiskLevel(value: unknown): 1 | 2 | 3 | null {
  return value === 1 || value === 2 || value === 3 ? value : null
}

function normalizeStatus(value: unknown): 0 | 1 | 2 | 3 | null {
  return value === 0 || value === 1 || value === 2 || value === 3 ? value : null
}
