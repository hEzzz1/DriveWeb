<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, Picture, RefreshRight, VideoPlay } from '@element-plus/icons-vue'
import AlertActionDialog from '../components/AlertActionDialog.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { disposeAlert, getAlertActionLogs, getAlertDetail, getAlertEvidenceBlob } from '../api/alerts'
import { getDriverDetail } from '../api/drivers'
import { getFleetDetail } from '../api/fleets'
import { getVehicleDetail } from '../api/vehicles'
import { useAuthStore } from '../stores/auth'
import {
  riskLevelLabelMap,
  statusLabelMap,
  type AlertActionType,
  type AlertActionLog,
  type AlertDetail,
} from '../types/alerts'
import {
  formatDateTime,
  formatScore,
  formatTimestampMs,
  getAlertActionLabel,
  getAlertTimelineActionLabel,
  getAvailableAlertActions,
  getRiskTagType,
  getStatusTagType,
} from '../utils/alerts'

type EvidenceFramePreview = {
  name: string
  url: string
  capturedAtMs?: number
}

type EvidencePreviewMode = 'video' | 'image' | 'frames' | 'file'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const detail = ref<AlertDetail | null>(null)
const actionLogs = ref<AlertActionLog[]>([])
const dialogVisible = ref(false)
const activeAction = ref<AlertActionType>('CONFIRM')
const actionSubmitting = ref(false)
const evidenceObjectUrl = ref('')
const evidenceObjectMimeType = ref('')
const evidenceBlob = ref<Blob | null>(null)
const evidenceLoading = ref(false)
const evidenceDownloadLoading = ref(false)
const evidenceLoadError = ref('')
const evidenceArchivePreviewError = ref('')
const evidenceFramePreviews = ref<EvidenceFramePreview[]>([])
const evidenceStillImageUrl = ref('')
const evidenceStillLoading = ref(false)
const evidenceStillError = ref('')
const evidencePreviewMode = ref<EvidencePreviewMode>('file')

const alertId = computed(() => {
  const value = route.params.id

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return ''
})

const canDispose = computed(() => authStore.canDisposeAlerts())
const fleetLabel = ref('-')
const vehicleLabel = ref('-')
const driverLabel = ref('-')

const availableActions = computed(() => getAvailableAlertActions(detail.value?.status))
const hasEvidence = computed(() => Boolean(detail.value?.evidenceUrl))
const evidenceUrl = computed(() => detail.value?.evidenceUrl || '')
const evidenceSourceUrl = computed(() => evidenceObjectUrl.value || evidenceUrl.value)
const evidenceSourceMimeType = computed(() => evidenceObjectMimeType.value || detail.value?.evidenceMimeType || '')
const evidenceIsImage = computed(() => isImageSource(evidenceSourceUrl.value, evidenceSourceMimeType.value))
const evidenceIsVideo = computed(() => isVideoSource(evidenceSourceUrl.value, evidenceSourceMimeType.value))
const evidenceIsFrameArchive = computed(() => {
  return detail.value?.evidenceType === 'FRAME_SEQUENCE'
    || isFrameArchiveSource(evidenceSourceUrl.value, evidenceSourceMimeType.value)
})
const closestEvidenceFramePreview = computed(() => {
  const frames = evidenceFramePreviews.value
  if (!frames.length) {
    return null
  }

  const capturedAtMs = detail.value?.evidenceCapturedAtMs
  if (capturedAtMs === null || capturedAtMs === undefined || !Number.isFinite(capturedAtMs)) {
    return frames[0]
  }

  return frames.reduce((closest, frame) => {
    if (frame.capturedAtMs === undefined) {
      return closest
    }
    if (closest.capturedAtMs === undefined) {
      return frame
    }
    return Math.abs(frame.capturedAtMs - capturedAtMs) < Math.abs(closest.capturedAtMs - capturedAtMs)
      ? frame
      : closest
  }, frames[0])
})
const evidenceImagePreviewUrl = computed(() => {
  if (evidenceStillImageUrl.value) {
    return evidenceStillImageUrl.value
  }

  if (evidenceIsImage.value) {
    return evidenceSourceUrl.value
  }

  return closestEvidenceFramePreview.value?.url || ''
})
const evidencePreviewModes = computed(() => {
  const modes: Array<{ label: string; value: EvidencePreviewMode }> = []

  if (evidenceIsVideo.value) {
    modes.push({ label: '告警图片', value: 'image' })
    modes.push({ label: '视频', value: 'video' })
  } else if (evidenceIsImage.value) {
    modes.push({ label: '图片', value: 'image' })
  } else if (evidenceIsFrameArchive.value) {
    modes.push({ label: '告警图片', value: 'image' })
    modes.push({ label: '图片序列', value: 'frames' })
  }

  modes.push({ label: '原文件', value: 'file' })
  return modes
})
const evidenceRows = computed(() => {
  if (!detail.value) {
    return []
  }

  const rows = [
    { label: '证据类型', value: showValue(detail.value.evidenceType) },
    { label: 'MIME', value: showValue(detail.value.evidenceMimeType) },
    { label: '捕获时间', value: formatTimestampMs(detail.value.evidenceCapturedAtMs) },
    { label: '保留至', value: formatDateTime(detail.value.evidenceRetentionUntil) },
  ]

  return rows.filter((item) => item.value !== '-')
})
const operationRows = computed(() => {
  if (!detail.value) {
    return []
  }

  const rows = [
    { label: '规则', value: detail.value.ruleName || showValue(detail.value.ruleId) },
    { label: '综合风险分', value: formatScore(detail.value.riskScore) },
    { label: '最新操作人', value: showValue(detail.value.latestActionBy) },
    { label: '最新操作时间', value: formatDateTime(detail.value.latestActionTime) },
    { label: '备注', value: showValue(detail.value.remark), span: 2 },
  ]

  return rows.filter((item) => item.value !== '-')
})
const edgeDebugRows = computed(() => {
  if (!detail.value) {
    return []
  }

  const rows = [
    { label: '边缘风险等级', value: showValue(detail.value.edgeRiskLevel) },
    { label: '主导风险类型', value: showValue(detail.value.edgeDominantRiskType) },
    { label: '触发原因', value: showValue(detail.value.edgeTriggerReasons), span: 2 },
    { label: '边缘窗口开始', value: formatTimestampMs(detail.value.edgeWindowStartMs) },
    { label: '边缘窗口结束', value: formatTimestampMs(detail.value.edgeWindowEndMs) },
    { label: '边缘创建时间', value: formatTimestampMs(detail.value.edgeCreatedAtMs) },
  ]

  return rows.filter((item) => item.value !== '-')
})

onMounted(() => {
  void fetchDetail()
})

watch(
  () => alertId.value,
  () => {
    void fetchDetail()
  },
)

watch(evidencePreviewModes, (modes) => {
  if (!modes.some((mode) => mode.value === evidencePreviewMode.value)) {
    evidencePreviewMode.value = modes[0]?.value || 'file'
  }
})

onBeforeUnmount(() => {
  revokeEvidenceObjectUrl()
})

async function fetchDetail(): Promise<void> {
  if (!alertId.value) {
    detail.value = null
    actionLogs.value = []
    revokeEvidenceObjectUrl()
    return
  }

  loading.value = true

  try {
    const [data, logs] = await Promise.all([
      getAlertDetail(alertId.value),
      getAlertActionLogs(alertId.value),
    ])
    detail.value = data
    actionLogs.value = Array.isArray(logs.items) ? logs.items : []
    await Promise.all([fetchContextLabels(data), loadEvidencePreview(data)])
  } finally {
    loading.value = false
  }
}

function handleOpenAction(actionType: AlertActionType): void {
  activeAction.value = actionType
  dialogVisible.value = true
}

async function handleSubmitAction(payload: { remark: string }): Promise<void> {
  if (!detail.value || actionSubmitting.value) {
    return
  }

  actionSubmitting.value = true

  try {
    await disposeAlert(detail.value.id, activeAction.value, payload.remark || undefined)
    dialogVisible.value = false
    ElMessage.success(`${getAlertActionLabel(activeAction.value)}成功`)
    await fetchDetail()
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (message.includes('状态')) {
      ElMessage.warning('状态已更新，请刷新后重试')
      await fetchDetail()
    }
  } finally {
    actionSubmitting.value = false
  }
}

function handleBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push({
    name: 'alerts-list',
    query: route.query,
  })
}

function showValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function revokeEvidenceObjectUrl(): void {
  if (evidenceObjectUrl.value) {
    window.URL.revokeObjectURL(evidenceObjectUrl.value)
    evidenceObjectUrl.value = ''
  }
  revokeEvidenceFramePreviews()
  revokeEvidenceStillImage()
  evidenceObjectMimeType.value = ''
  evidenceBlob.value = null
  evidenceLoading.value = false
  evidenceDownloadLoading.value = false
  evidenceLoadError.value = ''
  evidenceArchivePreviewError.value = ''
}

function revokeEvidenceFramePreviews(): void {
  evidenceFramePreviews.value.forEach((frame) => window.URL.revokeObjectURL(frame.url))
  evidenceFramePreviews.value = []
}

async function loadEvidencePreview(data: AlertDetail): Promise<void> {
  revokeEvidenceObjectUrl()

  if (!data.evidenceUrl || !isInternalEvidenceUrl(data.evidenceUrl)) {
    evidencePreviewMode.value = resolvePreferredEvidencePreviewMode(data)
    return
  }

  evidenceLoading.value = true

  try {
    const blob = await getAlertEvidenceBlob(data.id)
    evidenceBlob.value = blob
    evidenceObjectUrl.value = window.URL.createObjectURL(blob)
    evidenceObjectMimeType.value = blob.type || data.evidenceMimeType || ''
    evidencePreviewMode.value = resolvePreferredEvidencePreviewMode(data)

    if (isVideoSource(evidenceObjectUrl.value, evidenceObjectMimeType.value)) {
      void buildVideoStillImage(evidenceObjectUrl.value, data)
    }

    if (data.evidenceType === 'FRAME_SEQUENCE' || isFrameArchiveSource(data.evidenceUrl, evidenceObjectMimeType.value)) {
      try {
        evidenceFramePreviews.value = await parseStoredZipFramePreviews(blob)
      } catch (error) {
        evidenceArchivePreviewError.value = error instanceof Error ? error.message : '证据包预览失败'
      }
    }
  } catch (error) {
    evidenceLoadError.value = error instanceof Error ? error.message : '证据加载失败'
    evidencePreviewMode.value = 'file'
  } finally {
    evidenceLoading.value = false
  }
}

async function retryLoadEvidence(): Promise<void> {
  if (!detail.value || evidenceLoading.value) {
    return
  }

  await loadEvidencePreview(detail.value)
}

async function downloadEvidence(): Promise<void> {
  const current = detail.value
  if (!current || !current.evidenceUrl || evidenceDownloadLoading.value) {
    return
  }

  evidenceDownloadLoading.value = true

  try {
    const blob = evidenceBlob.value
      || (isInternalEvidenceUrl(current.evidenceUrl) ? await getAlertEvidenceBlob(current.id) : null)

    if (blob) {
      saveBlob(blob, evidenceDownloadFilename(blob))
    } else {
      downloadUrl(evidenceSourceUrl.value || current.evidenceUrl, evidenceDownloadFilename())
    }

    ElMessage.success('证据下载已开始')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '证据下载失败，请稍后重试')
  } finally {
    evidenceDownloadLoading.value = false
  }
}

async function fetchContextLabels(data: AlertDetail): Promise<void> {
  fleetLabel.value = data.fleetName || showValue(data.fleetId)
  vehicleLabel.value = data.vehiclePlateNumber || showValue(data.vehicleId)
  driverLabel.value = formatDriverLabel(data) || showValue(data.driverId)

  const [fleetResult, vehicleResult, driverResult] = await Promise.allSettled([
    data.fleetName || data.fleetId === null || data.fleetId === undefined ? Promise.resolve(null) : getFleetDetail(data.fleetId),
    data.vehiclePlateNumber || data.vehicleId === null || data.vehicleId === undefined ? Promise.resolve(null) : getVehicleDetail(data.vehicleId),
    data.driverName || data.driverId === null || data.driverId === undefined ? Promise.resolve(null) : getDriverDetail(data.driverId),
  ])

  if (fleetResult.status === 'fulfilled' && fleetResult.value) {
    fleetLabel.value = fleetResult.value.name || showValue(data.fleetId)
  }

  if (vehicleResult.status === 'fulfilled' && vehicleResult.value) {
    vehicleLabel.value = vehicleResult.value.plateNumber || showValue(data.vehicleId)
  }

  if (driverResult.status === 'fulfilled' && driverResult.value) {
    driverLabel.value = driverResult.value.name || showValue(data.driverId)
  }
}

function formatDriverLabel(data: AlertDetail): string {
  if (data.driverName && data.driverCode) {
    return `${data.driverName} / ${data.driverCode}`
  }
  return data.driverName || data.driverCode || ''
}

function isInternalEvidenceUrl(url: string): boolean {
  return url.startsWith('/api/v1/org/alerts/') && url.endsWith('/evidence')
}

function resolvePreferredEvidencePreviewMode(data: AlertDetail): EvidencePreviewMode {
  const sourceUrl = evidenceObjectUrl.value || data.evidenceUrl || ''
  const mimeType = evidenceObjectMimeType.value || data.evidenceMimeType || ''

  if (isVideoSource(sourceUrl, mimeType)) {
    return 'image'
  }

  if (isImageSource(sourceUrl, mimeType)) {
    return 'image'
  }

  if (data.evidenceType === 'FRAME_SEQUENCE' || isFrameArchiveSource(sourceUrl, mimeType)) {
    return 'image'
  }

  return 'file'
}

function isImageSource(url: string, mimeType: string): boolean {
  const normalizedUrl = url.toLowerCase()
  const normalizedMimeType = mimeType.toLowerCase()
  return normalizedUrl.startsWith('data:image/')
    || normalizedMimeType.startsWith('image/')
    || /\.(png|jpe?g|webp)(\?|#|$)/i.test(url)
}

function isVideoSource(url: string, mimeType: string): boolean {
  const normalizedUrl = url.toLowerCase()
  const normalizedMimeType = mimeType.toLowerCase()
  return normalizedUrl.startsWith('data:video/')
    || normalizedMimeType.startsWith('video/')
    || /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

function isFrameArchiveSource(url: string, mimeType: string): boolean {
  const normalizedMimeType = mimeType.toLowerCase()
  return normalizedMimeType === 'application/zip'
    || normalizedMimeType === 'application/x-zip-compressed'
    || /\.zip(\?|#|$)/i.test(url)
}

async function parseStoredZipFramePreviews(blob: Blob): Promise<EvidenceFramePreview[]> {
  const buffer = await blob.arrayBuffer()
  const view = new DataView(buffer)
  const decoder = new TextDecoder()
  const previews: EvidenceFramePreview[] = []
  let offset = 0

  while (offset + 30 <= view.byteLength && previews.length < 36) {
    const signature = view.getUint32(offset, true)

    if (signature !== 0x04034b50) {
      break
    }

    const flags = view.getUint16(offset + 6, true)
    const method = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const uncompressedSize = view.getUint32(offset + 22, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLength + extraLength
    const dataEnd = dataStart + compressedSize

    if ((flags & 0x0008) !== 0 || dataStart > view.byteLength || dataEnd > view.byteLength) {
      break
    }

    const name = decoder.decode(new Uint8Array(buffer, nameStart, nameLength))

    if (method === 0 && compressedSize === uncompressedSize && isArchiveFrameEntry(name)) {
      const frameBytes = new Uint8Array(buffer.slice(dataStart, dataEnd))
      const frameBlob = new Blob([frameBytes], { type: frameMimeType(name) })
      previews.push({
        name,
        url: window.URL.createObjectURL(frameBlob),
        capturedAtMs: archiveFrameCapturedAtMs(name),
      })
    }

    offset = dataEnd
  }

  return previews
}

function isArchiveFrameEntry(name: string): boolean {
  return /^frames\/[^/]+\.(jpe?g|png|webp)$/i.test(name)
}

function frameMimeType(name: string): string {
  if (/\.png$/i.test(name)) {
    return 'image/png'
  }
  if (/\.webp$/i.test(name)) {
    return 'image/webp'
  }
  return 'image/jpeg'
}

function archiveFrameCapturedAtMs(name: string): number | undefined {
  const match = name.match(/_(\d{10,})_/)
  if (!match) {
    return undefined
  }
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function revokeEvidenceStillImage(): void {
  if (evidenceStillImageUrl.value) {
    window.URL.revokeObjectURL(evidenceStillImageUrl.value)
    evidenceStillImageUrl.value = ''
  }

  evidenceStillLoading.value = false
  evidenceStillError.value = ''
}

async function buildVideoStillImage(sourceUrl: string, data: AlertDetail): Promise<void> {
  evidenceStillLoading.value = true
  evidenceStillError.value = ''

  try {
    const previewUrl = await captureVideoFrame(sourceUrl, resolveVideoStillTimeSeconds(data))
    if (evidenceObjectUrl.value === sourceUrl) {
      evidenceStillImageUrl.value = previewUrl
    } else {
      window.URL.revokeObjectURL(previewUrl)
    }
  } catch (error) {
    if (evidenceObjectUrl.value === sourceUrl) {
      evidenceStillError.value = error instanceof Error ? error.message : '图片预览生成失败'
    }
  } finally {
    if (evidenceObjectUrl.value === sourceUrl) {
      evidenceStillLoading.value = false
    }
  }
}

function resolveVideoStillTimeSeconds(data: AlertDetail): number | undefined {
  const capturedAtMs = data.evidenceCapturedAtMs
  const windowStartMs = data.edgeWindowStartMs
  if (
    capturedAtMs === null
    || capturedAtMs === undefined
    || windowStartMs === null
    || windowStartMs === undefined
    || !Number.isFinite(capturedAtMs)
    || !Number.isFinite(windowStartMs)
    || capturedAtMs < windowStartMs
  ) {
    return undefined
  }

  return (capturedAtMs - windowStartMs) / 1000
}

function captureVideoFrame(sourceUrl: string, targetTimeSeconds?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    let settled = false

    const finish = (error?: Error, previewUrl?: string) => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeout)
      video.removeAttribute('src')
      video.load()

      if (error) {
        reject(error)
      } else if (previewUrl) {
        resolve(previewUrl)
      } else {
        reject(new Error('图片预览生成失败'))
      }
    }

    const drawFrame = () => {
      const width = video.videoWidth
      const height = video.videoHeight

      if (width <= 0 || height <= 0) {
        finish(new Error('图片预览生成失败'))
        return
      }

      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')

      if (!context) {
        finish(new Error('图片预览生成失败'))
        return
      }

      context.drawImage(video, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) {
          finish(new Error('图片预览生成失败'))
          return
        }

        finish(undefined, window.URL.createObjectURL(blob))
      }, 'image/jpeg', 0.82)
    }

    const timeout = window.setTimeout(() => finish(new Error('图片预览生成超时')), 4_000)

    video.muted = true
    video.preload = 'metadata'
    video.playsInline = true
    video.addEventListener('error', () => finish(new Error('图片预览生成失败')), { once: true })
    video.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(video.duration) && video.duration > 0.2) {
        try {
          const targetTime = targetTimeSeconds === undefined
            ? Math.min(1, video.duration / 2)
            : Math.min(Math.max(0.05, targetTimeSeconds), Math.max(0.05, video.duration - 0.05))
          video.currentTime = targetTime
        } catch {
          drawFrame()
        }
      } else {
        drawFrame()
      }
    }, { once: true })
    video.addEventListener('seeked', drawFrame, { once: true })
    video.src = sourceUrl
    video.load()
  })
}

function evidenceDownloadFilename(blob?: Blob): string {
  const current = detail.value
  const alertPart = sanitizeFilename(current?.alertNo || `alert_${current?.id || 'unknown'}`)
  const mimeType = blob?.type || evidenceSourceMimeType.value || current?.evidenceMimeType || ''
  const extension = evidenceExtension(mimeType, current?.evidenceType || '', current?.evidenceUrl || '')
  return `${alertPart}_evidence.${extension}`
}

function evidenceExtension(mimeType: string, evidenceType: string, sourceUrl: string): string {
  const normalizedMimeType = mimeType.toLowerCase()
  const urlMatch = sourceUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i)

  if (normalizedMimeType === 'image/jpeg') {
    return 'jpg'
  }
  if (normalizedMimeType === 'image/png') {
    return 'png'
  }
  if (normalizedMimeType === 'image/webp') {
    return 'webp'
  }
  if (normalizedMimeType === 'video/mp4') {
    return 'mp4'
  }
  if (normalizedMimeType === 'video/webm') {
    return 'webm'
  }
  if (normalizedMimeType === 'video/quicktime') {
    return 'mov'
  }
  if (normalizedMimeType === 'application/zip' || normalizedMimeType === 'application/x-zip-compressed') {
    return 'zip'
  }
  if (urlMatch) {
    return urlMatch[1].toLowerCase()
  }
  if (evidenceType === 'FRAME_SEQUENCE') {
    return 'zip'
  }
  if (evidenceType === 'VIDEO_CLIP') {
    return 'mp4'
  }
  if (evidenceType === 'KEY_FRAME') {
    return 'jpg'
  }

  return 'bin'
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'alert_evidence'
}

function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = window.URL.createObjectURL(blob)
  downloadUrl(objectUrl, filename)
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1_000)
}

function downloadUrl(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="detail-page">
    <WorkspacePageHeader title="告警详情">
      <template #actions>
        <el-button @click="handleBack">返回列表</el-button>
        <el-button :loading="loading" @click="fetchDetail">刷新</el-button>
      </template>
    </WorkspacePageHeader>

    <el-skeleton v-if="loading && !detail" :rows="8" animated />

    <template v-else-if="detail">
      <el-card v-if="canDispose" class="panel-card action-card" shadow="never">
        <template #header>
          <div class="card-title">处置操作</div>
        </template>

        <div class="action-panel">
          <p class="action-hint">
            当前状态为“{{ statusLabelMap[detail.status] }}”，可执行的处置动作如下。
          </p>

          <div v-if="availableActions.length" class="action-buttons">
            <el-button
              v-for="action in availableActions"
              :key="action"
              :type="action === 'CONFIRM' ? 'primary' : action === 'FALSE_POSITIVE' ? 'warning' : 'info'"
              plain
              @click="handleOpenAction(action)"
            >
              {{ getAlertActionLabel(action) }}
            </el-button>
          </div>

          <el-empty v-else description="当前状态不可继续处置" :image-size="88" />
        </div>
      </el-card>

      <section class="card-grid">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">基本信息</div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="告警ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="告警编号">{{ detail.alertNo }}</el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskTagType(detail.riskLevel)">
                {{ riskLevelLabelMap[detail.riskLevel] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusTagType(detail.status)">{{ statusLabelMap[detail.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="触发时间" :span="2">
              {{ formatDateTime(detail.triggerTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">风险指标</div>
          </template>

          <div class="metrics-grid">
            <div class="metric-item">
              <span>riskScore</span>
              <strong>{{ formatScore(detail.riskScore) }}</strong>
            </div>
            <div class="metric-item">
              <span>fatigueScore</span>
              <strong>{{ formatScore(detail.fatigueScore) }}</strong>
            </div>
            <div class="metric-item">
              <span>distractionScore</span>
              <strong>{{ formatScore(detail.distractionScore) }}</strong>
            </div>
          </div>
        </el-card>
      </section>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">事件上下文</div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="车队">{{ fleetLabel }}</el-descriptions-item>
          <el-descriptions-item label="车辆">{{ vehicleLabel }}</el-descriptions-item>
          <el-descriptions-item label="司机">{{ driverLabel }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card v-if="hasEvidence" class="panel-card" shadow="never">
        <template #header>
          <div class="evidence-card-header">
            <div class="card-title">告警证据</div>
            <div class="evidence-actions">
              <el-segmented
                v-if="evidencePreviewModes.length > 1"
                v-model="evidencePreviewMode"
                :options="evidencePreviewModes"
                size="small"
              />
              <el-button
                size="small"
                plain
                :icon="RefreshRight"
                :loading="evidenceLoading"
                @click="retryLoadEvidence"
              >
                重试
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :icon="Download"
                :loading="evidenceDownloadLoading"
                @click="downloadEvidence"
              >
                下载
              </el-button>
            </div>
          </div>
        </template>

        <div class="evidence-grid">
          <div class="evidence-preview">
            <div v-if="evidenceLoading" class="evidence-placeholder">证据加载中</div>
            <div v-else-if="evidenceLoadError" class="evidence-placeholder evidence-error">
              <p>{{ evidenceLoadError }}</p>
              <div class="evidence-placeholder-actions">
                <el-button size="small" type="primary" plain :icon="RefreshRight" @click="retryLoadEvidence">
                  重试加载
                </el-button>
                <el-button size="small" plain :icon="Download" :loading="evidenceDownloadLoading" @click="downloadEvidence">
                  下载原文件
                </el-button>
              </div>
            </div>
            <video
              v-else-if="evidencePreviewMode === 'video' && evidenceIsVideo"
              :src="evidenceSourceUrl"
              controls
              playsinline
              preload="metadata"
            />
            <figure
              v-else-if="evidencePreviewMode === 'image' && evidenceImagePreviewUrl"
              class="evidence-primary-frame"
            >
              <img :src="evidenceImagePreviewUrl" alt="evidence" />
              <figcaption v-if="closestEvidenceFramePreview?.capturedAtMs">
                告警时刻：{{ formatTimestampMs(closestEvidenceFramePreview.capturedAtMs) }}
              </figcaption>
            </figure>
            <div v-else-if="evidencePreviewMode === 'image'" class="evidence-placeholder">
              <el-icon size="24"><Picture /></el-icon>
              <p v-if="evidenceStillLoading">图片预览生成中</p>
              <p v-else>{{ evidenceStillError || '当前证据暂无图片预览' }}</p>
            </div>
            <div v-else-if="evidencePreviewMode === 'frames' && evidenceIsFrameArchive" class="evidence-archive">
              <div v-if="evidenceFramePreviews.length" class="evidence-archive-grid">
                <figure
                  v-for="frame in evidenceFramePreviews"
                  :key="frame.name"
                  class="evidence-archive-frame"
                >
                  <img :src="frame.url" :alt="frame.name" />
                  <figcaption>
                    {{ frame.capturedAtMs ? formatTimestampMs(frame.capturedAtMs) : frame.name }}
                  </figcaption>
                </figure>
              </div>
              <div v-else class="evidence-placeholder">
                <p v-if="evidenceArchivePreviewError">{{ evidenceArchivePreviewError }}</p>
                <a :href="evidenceSourceUrl" target="_blank" rel="noreferrer">打开证据包</a>
              </div>
            </div>
            <div v-else class="evidence-placeholder evidence-file-preview">
              <el-icon size="24"><VideoPlay v-if="evidenceIsVideo" /><Picture v-else /></el-icon>
              <p>原始证据文件</p>
              <div class="evidence-placeholder-actions">
                <a v-if="evidenceSourceUrl" :href="evidenceSourceUrl" target="_blank" rel="noreferrer">打开</a>
                <el-button size="small" type="primary" plain :icon="Download" :loading="evidenceDownloadLoading" @click="downloadEvidence">
                  下载
                </el-button>
              </div>
            </div>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item
              v-for="item in evidenceRows"
              :key="item.label"
              :label="item.label"
            >
              <span class="mono-text">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <section class="card-grid">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">处置摘要</div>
          </template>

          <el-empty v-if="operationRows.length === 0" description="暂无处置摘要" />

          <el-descriptions v-else :column="2" border>
            <el-descriptions-item
              v-for="item in operationRows"
              :key="item.label"
              :label="item.label"
              :span="item.span || 1"
            >
              <span class="mono-text">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">边缘风险摘要</div>
          </template>

          <el-empty v-if="edgeDebugRows.length === 0" description="暂无边缘风险字段" />

          <el-descriptions v-else :column="2" border>
            <el-descriptions-item
              v-for="item in edgeDebugRows"
              :key="item.label"
              :label="item.label"
              :span="item.span || 1"
            >
              <span class="mono-text">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </section>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">处置记录时间轴</div>
        </template>

        <el-empty v-if="actionLogs.length === 0" description="暂无处置记录" />

        <el-timeline v-else>
          <el-timeline-item
            v-for="item in actionLogs"
            :key="item.id"
            :timestamp="formatDateTime(item.actionTime)"
          >
            <p class="timeline-action">{{ getAlertTimelineActionLabel(item.actionType) }}</p>
            <p class="timeline-meta">操作人：{{ item.actionBy || '-' }}</p>
            <p v-if="item.actionRemark" class="timeline-meta">备注：{{ item.actionRemark }}</p>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <el-empty v-else description="未获取到告警详情" />

    <AlertActionDialog
      v-model="dialogVisible"
      :action-type="activeAction"
      :submitting="actionSubmitting"
      @submit="handleSubmitAction"
    />
  </div>
</template>

<style scoped>
.detail-page {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 0;
  display: grid;
  gap: 16px;
}

.head-actions {
  display: flex;
  gap: 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel-card {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--panel-bg);
}

.action-card {
  overflow: hidden;
}

.card-title {
  font-weight: 700;
  color: var(--text-main);
}

.evidence-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.evidence-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.action-panel {
  display: grid;
  gap: 14px;
}

.action-hint {
  margin: 0;
  color: var(--text-faint);
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.evidence-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
  align-items: start;
}

.evidence-preview {
  min-height: 220px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #0f172a;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.evidence-preview img {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: contain;
}

.evidence-primary-frame {
  width: 100%;
  height: 100%;
  margin: 0;
  display: grid;
  place-items: center;
}

.evidence-primary-frame figcaption {
  width: 100%;
  padding: 8px 10px;
  color: #ffffff;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  background: rgba(15, 23, 42, 0.86);
}

.evidence-preview video {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: contain;
  background: #000;
}

.evidence-archive {
  width: 100%;
  max-height: 420px;
  overflow: auto;
  padding: 10px;
}

.evidence-archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.evidence-archive-frame {
  margin: 0;
  display: grid;
  gap: 6px;
}

.evidence-archive-frame img {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 6px;
  background: #000;
}

.evidence-archive-frame figcaption {
  min-height: 18px;
  color: #ffffff;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: anywhere;
}

.evidence-placeholder {
  color: #ffffff;
  font-weight: 600;
  padding: 16px;
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 10px;
  line-height: 1.5;
}

.evidence-placeholder p {
  margin: 0;
}

.evidence-placeholder-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.evidence-error {
  max-width: 360px;
}

.evidence-file-preview {
  max-width: 320px;
}

.evidence-preview a {
  color: #ffffff;
  font-weight: 700;
}

.metric-item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fafcff;
  display: grid;
  gap: 4px;
}

.metric-item span {
  font-size: 12px;
  color: var(--text-faint);
}

.metric-item strong {
  font-size: 20px;
  color: var(--text-main);
}

.timeline-action {
  margin: 0 0 4px;
  font-weight: 700;
  color: var(--text-main);
}

.timeline-meta {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.5;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  word-break: break-all;
}

@media (max-width: 1080px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .evidence-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .action-buttons {
    flex-direction: column;
  }

  .evidence-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .evidence-actions {
    justify-content: flex-start;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
