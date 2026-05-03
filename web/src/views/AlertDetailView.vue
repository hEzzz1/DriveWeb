<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AlertActionDialog from '../components/AlertActionDialog.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { disposeAlert, getAlertActionLogs, getAlertDetail } from '../api/alerts'
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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const detail = ref<AlertDetail | null>(null)
const actionLogs = ref<AlertActionLog[]>([])
const dialogVisible = ref(false)
const activeAction = ref<AlertActionType>('CONFIRM')
const actionSubmitting = ref(false)

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
const operationRows = computed(() => {
  if (!detail.value) {
    return []
  }

  const rows = [
    { label: '规则ID', value: showValue(detail.value.ruleId) },
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

async function fetchDetail(): Promise<void> {
  if (!alertId.value) {
    detail.value = null
    actionLogs.value = []
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
