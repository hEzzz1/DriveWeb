<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AlertActionDialog from '../components/AlertActionDialog.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { disposeAlert, getAlertDetail } from '../api/alerts'
import { getDriverDetail } from '../api/drivers'
import { getFleetDetail } from '../api/fleets'
import { getVehicleDetail } from '../api/vehicles'
import { useAuthStore } from '../stores/auth'
import { useRealtimeStore } from '../stores/realtime'
import {
  riskLevelLabelMap,
  statusLabelMap,
  type AlertActionType,
  type AlertDetail,
  type NormalizedAlertRealtimeEvent,
} from '../types/alerts'
import {
  extractAlertTimeline,
  formatDateTime,
  formatNumber,
  formatScore,
  formatTimestampMs,
  getAlertActionLabel,
  getAvailableAlertActions,
  getRiskTagType,
  getStatusTagType,
} from '../utils/alerts'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const realtimeStore = useRealtimeStore()

const loading = ref(false)
const detail = ref<AlertDetail | null>(null)
const dialogVisible = ref(false)
const activeAction = ref<AlertActionType>('CONFIRM')
const actionSubmitting = ref(false)
const pendingRealtimeRefresh = ref(false)
const latestRealtimeTraceId = ref('')
const localMutationAtMap = new Map<number, number>()
let unsubscribeRealtime: (() => void) | null = null

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

const timeline = computed(() => {
  return detail.value ? extractAlertTimeline(detail.value) : []
})

const canDispose = computed(() => authStore.canDisposeAlerts())
const canViewDebugInfo = computed(() => authStore.hasPermission('system.read'))
const fleetLabel = ref('-')
const vehicleLabel = ref('-')
const driverLabel = ref('-')

const availableActions = computed(() => getAvailableAlertActions(detail.value?.status))
const realtimeEventTypeText = computed(() => {
  if (!latestRealtimeTraceId.value) {
    return '-'
  }

  return pendingRealtimeRefresh.value ? '等待同步' : '已同步'
})
const observabilityRows = computed(() => {
  if (!detail.value) {
    return []
  }

  const rows = [
    { label: '规则ID', value: showValue(detail.value.ruleId) },
    { label: '综合风险分', value: formatScore(detail.value.riskScore) },
    { label: '最新操作人', value: showValue(detail.value.latestActionBy) },
    { label: '最新操作时间', value: formatDateTime(detail.value.latestActionTime) },
    { label: '备注', value: showValue(detail.value.remark), span: 2 },
    { label: '实时消息 traceId', value: showValue(latestRealtimeTraceId.value || detail.value.traceId || detail.value.serverTraceId) },
    { label: '实时同步状态', value: realtimeEventTypeText.value },
    { label: '事件ID', value: showValue(detail.value.eventId) },
    { label: '接入 traceId', value: showValue(detail.value.ingestTraceId) },
    { label: '设备 Token', value: showValue(detail.value.deviceToken) },
  ]

  return rows.filter((item) => item.value !== '-')
})
const edgeDebugRows = computed(() => {
  if (!detail.value) {
    return []
  }

  const reasonText = Array.isArray(detail.value.edgeTriggerReasons) && detail.value.edgeTriggerReasons.length
    ? detail.value.edgeTriggerReasons.join(' / ')
    : '-'

  const rows = [
    { label: '边缘风险等级', value: showValue(detail.value.edgeRiskLevel) },
    { label: '主导风险类型', value: showValue(detail.value.edgeDominantRiskType) },
    { label: '触发原因', value: reasonText, span: 2 },
    { label: '边缘窗口开始', value: formatTimestampMs(detail.value.edgeWindowStartMs) },
    { label: '边缘窗口结束', value: formatTimestampMs(detail.value.edgeWindowEndMs) },
    { label: '边缘创建时间', value: formatTimestampMs(detail.value.edgeCreatedAtMs) },
    { label: '算法版本', value: showValue(detail.value.algorithmVer) },
    { label: '头姿态', value: showValue(detail.value.headPose) },
    { label: '事件时间', value: formatDateTime(detail.value.eventTime) },
  ]

  return rows.filter((item) => item.value !== '-')
})

onMounted(() => {
  unsubscribeRealtime = realtimeStore.subscribe((event) => {
    void handleRealtimeEvent(event)
  })
  void fetchDetail()
})

onBeforeUnmount(() => {
  unsubscribeRealtime?.()
  unsubscribeRealtime = null
})

watch(
  () => alertId.value,
  () => {
    void fetchDetail()
  },
)

async function fetchDetail(): Promise<void> {
  if (!alertId.value) {
    detail.value = null
    return
  }

  loading.value = true

  try {
    const data = await getAlertDetail(alertId.value)
    detail.value = data
    pendingRealtimeRefresh.value = false
    await fetchContextLabels(data)
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
    localMutationAtMap.set(detail.value.id, Date.now())
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

async function fetchContextLabels(data: AlertDetail): Promise<void> {
  fleetLabel.value = showValue(data.fleetId)
  vehicleLabel.value = showValue(data.vehicleId)
  driverLabel.value = showValue(data.driverId)

  const [fleetResult, vehicleResult, driverResult] = await Promise.allSettled([
    getFleetDetail(data.fleetId),
    getVehicleDetail(data.vehicleId),
    getDriverDetail(data.driverId),
  ])

  if (fleetResult.status === 'fulfilled') {
    fleetLabel.value = fleetResult.value.name || showValue(data.fleetId)
  }

  if (vehicleResult.status === 'fulfilled') {
    vehicleLabel.value = vehicleResult.value.plateNumber || showValue(data.vehicleId)
  }

  if (driverResult.status === 'fulfilled') {
    driverLabel.value = driverResult.value.name || showValue(data.driverId)
  }
}

async function handleRealtimeEvent(event: NormalizedAlertRealtimeEvent): Promise<void> {
  if (!detail.value || detail.value.id !== event.alertId || shouldIgnoreRealtimeEvent(event)) {
    return
  }

  latestRealtimeTraceId.value = event.traceId || latestRealtimeTraceId.value

  if (dialogVisible.value || actionSubmitting.value) {
    pendingRealtimeRefresh.value = true
    return
  }

  await fetchDetail()
}

function shouldIgnoreRealtimeEvent(event: NormalizedAlertRealtimeEvent): boolean {
  const localMutationAt = localMutationAtMap.get(event.alertId)

  if (!localMutationAt || !event.eventAt) {
    return false
  }

  const eventAt = Date.parse(event.eventAt)
  return !Number.isNaN(eventAt) && eventAt < localMutationAt
}

watch(
  () => dialogVisible.value,
  (visible) => {
    if (!visible && pendingRealtimeRefresh.value) {
      pendingRealtimeRefresh.value = false
      void fetchDetail()
    }
  },
)
</script>

<template>
  <div class="detail-page">
    <WorkspacePageHeader
      eyebrow="Alert Detail"
      title="告警详情"
      subtitle="查看单条告警上下文、风险指标与处置轨迹。"
    >
      <template #actions>
        <el-button @click="handleBack">返回列表</el-button>
        <el-button :loading="loading" @click="fetchDetail">刷新</el-button>
      </template>
    </WorkspacePageHeader>

    <el-skeleton v-if="loading && !detail" :rows="8" animated />

    <template v-else-if="detail">
      <el-alert
        v-if="pendingRealtimeRefresh"
        title="告警数据已更新，完成当前输入后会自动同步"
        type="info"
        :closable="false"
        show-icon
      />

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

      <section v-if="canViewDebugInfo" class="card-grid">
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
              <span>fatigueScore</span>
              <strong>{{ formatScore(detail.fatigueScore) }}</strong>
            </div>
            <div class="metric-item">
              <span>distractionScore</span>
              <strong>{{ formatScore(detail.distractionScore) }}</strong>
            </div>
            <div class="metric-item">
              <span>perclos</span>
              <strong>{{ formatScore(detail.perclos) }}</strong>
            </div>
            <div class="metric-item">
              <span>blinkRate</span>
              <strong>{{ formatNumber(detail.blinkRate) }}</strong>
            </div>
            <div class="metric-item">
              <span>yawnCount</span>
              <strong>{{ showValue(detail.yawnCount) }}</strong>
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
          <el-descriptions-item label="算法版本">{{ showValue(detail.algorithmVer) }}</el-descriptions-item>
          <el-descriptions-item label="头姿态">{{ showValue(detail.headPose) }}</el-descriptions-item>
          <el-descriptions-item label="事件时间">{{ formatDateTime(detail.eventTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <section class="card-grid">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">联调与排查</div>
          </template>

          <el-empty v-if="observabilityRows.length === 0" description="暂无联调态字段" />

          <el-descriptions v-else :column="2" border>
            <el-descriptions-item
              v-for="item in observabilityRows"
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
            <div class="card-title">边缘透传字段</div>
          </template>

          <el-empty v-if="edgeDebugRows.length === 0" description="暂无边缘联调字段" />

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

        <el-empty v-if="timeline.length === 0" description="暂无处置记录" />

        <el-timeline v-else>
          <el-timeline-item
            v-for="(item, index) in timeline"
            :key="item.actionTime + '-' + index"
            :timestamp="formatDateTime(item.actionTime)"
          >
            <p class="timeline-action">{{ item.action }}</p>
            <p class="timeline-meta">操作人：{{ item.operator || '-' }}</p>
            <p v-if="item.remark" class="timeline-meta">备注：{{ item.remark }}</p>
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

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

h1 {
  color: var(--text-main);
}

.subhead {
  color: var(--text-faint);
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

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
