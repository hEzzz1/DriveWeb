<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import DeviceEditDialog from '../components/devices/DeviceEditDialog.vue'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { getDeviceDetail, reassignDeviceVehicle, rotateDeviceToken, unassignDeviceVehicle, updateDevice, updateDeviceStatus } from '../api/devices'
import { getFleetList } from '../api/fleets'
import { fetchAllPages } from '../api/pagination'
import { getVehicleList } from '../api/vehicles'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { DeviceDetail, UpdateDevicePayload } from '../types/devices'
import type { FleetSummary } from '../types/fleets'
import type { VehicleSummary } from '../types/vehicles'
import {
  effectiveStageTagType,
  effectiveStageText,
  lifecycleStatusTagType,
  lifecycleStatusText,
  sessionStageTagType,
  sessionStageText,
  vehicleBindStatusTagType,
  vehicleBindStatusText,
} from '../utils/device-status'
import { formatDateTime } from '../utils/time'

const route = useRoute()
const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const saving = ref(false)
const unassigning = ref(false)
const editVisible = ref(false)
const editSaving = ref(false)
const statusSaving = ref(false)
const tokenRotating = ref(false)
const detail = ref<DeviceDetail | null>(null)
const fleets = ref<FleetSummary[]>([])
const vehicles = ref<VehicleSummary[]>([])
const fleetMap = ref(new Map<number, FleetSummary>())
const vehicleMap = ref(new Map<number, VehicleSummary>())

const assignForm = reactive({
  fleetId: undefined as number | undefined,
  vehicleId: undefined as number | undefined,
})

const deviceId = computed(() => route.params.id as string)
const canAssignVehicle = computed(() => {
  const stage = detail.value?.effectiveStage
  return stage === 'WAITING_VEHICLE' || stage === 'READY_SIGN_IN'
})
const canUnassignVehicle = computed(() => Boolean(detail.value?.vehicleId) && canAssignVehicle.value)
const fleetOptions = computed(() => {
  const enterpriseId = detail.value?.enterpriseId
  return fleets.value.filter((item) => !enterpriseId || item.enterpriseId === enterpriseId)
})
const vehicleOptions = computed(() => {
  const enterpriseId = detail.value?.enterpriseId
  return vehicles.value.filter((item) => {
    if (enterpriseId && item.enterpriseId !== enterpriseId) {
      return false
    }

    if (assignForm.fleetId && item.fleetId !== assignForm.fleetId) {
      return false
    }

    return true
  })
})

watch(
  () => assignForm.fleetId,
  () => {
    if (!vehicleOptions.value.some((item) => item.id === assignForm.vehicleId)) {
      assignForm.vehicleId = undefined
    }
  },
)

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await fetchDetail()
})

async function fetchDetail(): Promise<void> {
  loading.value = true
  try {
    detail.value = await getDeviceDetail(deviceId.value)
    syncAssignmentForm()
    await fetchReferences()
    if (detail.value) {
      detail.value = enrichDevice(detail.value)
      syncAssignmentForm()
    }
  } finally {
    loading.value = false
  }
}

async function fetchReferences(): Promise<void> {
  const enterpriseId = detail.value?.enterpriseId || Number(authStore.enterpriseId) || undefined
  if (!enterpriseId) {
    fleets.value = []
    vehicles.value = []
    fleetMap.value = new Map()
    vehicleMap.value = new Map()
    return
  }

  const [fleetItems, vehicleItems] = await Promise.all([
    fetchAllPages(getFleetList, { enterpriseId }),
    fetchAllPages(getVehicleList, { enterpriseId }),
  ])
  fleets.value = fleetItems
  vehicles.value = vehicleItems
  fleetMap.value = new Map(fleetItems.map((item) => [item.id, item]))
  vehicleMap.value = new Map(vehicleItems.map((item) => [item.id, item]))
}

function syncAssignmentForm(): void {
  assignForm.fleetId = detail.value?.fleetId || undefined
  assignForm.vehicleId = detail.value?.vehicleId || undefined
}

function enrichDevice(item: DeviceDetail): DeviceDetail {
  return {
    ...item,
    fleetName: item.fleetName || (item.fleetId ? fleetMap.value.get(item.fleetId)?.name : undefined),
    vehiclePlateNumber: item.vehiclePlateNumber || (item.vehicleId ? vehicleMap.value.get(item.vehicleId)?.plateNumber : undefined),
  }
}

function currentDriverText(): string {
  if (!detail.value?.currentDriver) {
    return '-'
  }

  const { name, code, id } = detail.value.currentDriver
  if (name && code) {
    return `${name} / ${code}`
  }

  return name || code || `#${id}`
}

function activeSessionText(): string {
  return detail.value?.activeSession?.id ? `#${detail.value.activeSession.id}` : '-'
}

function uploadQueueText(): string {
  const queued = detail.value?.uploadQueueSize ?? 0
  return queued > 0 ? `积压 ${queued} 条` : '无积压'
}

function uploadQueueTagType(): 'success' | 'warning' {
  return (detail.value?.uploadQueueSize ?? 0) > 0 ? 'warning' : 'success'
}

function statusActionText(): string {
  return detail.value?.lifecycleStatus === 'DISABLED' ? '启用' : '禁用'
}

function maskSecret(value?: string): string {
  if (!value) {
    return '-'
  }
  if (value.length <= 8) {
    return value
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function isVehicleDisabled(item: VehicleSummary): boolean {
  return Boolean(item.boundDeviceId && item.boundDeviceId !== detail.value?.id)
}

function vehicleOptionLabel(item: VehicleSummary): string {
  const occupiedByOtherDevice = item.boundDeviceId && item.boundDeviceId !== detail.value?.id
  if (occupiedByOtherDevice) {
    return `${item.plateNumber}（已绑定 ${item.boundDeviceCode || `#${item.boundDeviceId}`}）`
  }

  return `${item.plateNumber} / ${item.id}`
}

function openEditDialog(): void {
  if (!detail.value) {
    return
  }
  editVisible.value = true
}

async function handleEditDevice(payload: UpdateDevicePayload): Promise<void> {
  const current = detail.value
  if (!current) {
    return
  }

  editSaving.value = true
  try {
    detail.value = enrichDevice(await updateDevice(current.id, payload))
    editVisible.value = false
    ElMessage.success('设备已更新')
  } finally {
    editSaving.value = false
  }
}

async function handleToggleStatus(): Promise<void> {
  const current = detail.value
  if (!current) {
    return
  }

  const nextStatus = current.lifecycleStatus === 'DISABLED' ? 1 : 0
  const actionText = nextStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确认${actionText}设备「${current.deviceCode}」吗？`, `${actionText}设备`, {
      type: nextStatus === 1 ? 'info' : 'warning',
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true
  try {
    detail.value = enrichDevice(await updateDeviceStatus(current.id, { status: nextStatus as 0 | 1 }))
    syncAssignmentForm()
    ElMessage.success(`设备已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

async function handleRotateToken(): Promise<void> {
  const current = detail.value
  if (!current) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认轮换设备「${current.deviceCode}」的 token 吗？轮换后端侧需要重新保存新 token 才能继续上报。`,
      '轮换设备 token',
      {
        type: 'warning',
        confirmButtonText: '确认轮换',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  tokenRotating.value = true
  try {
    const result = await rotateDeviceToken(current.id)
    detail.value = enrichDevice(await getDeviceDetail(current.id))
    await ElMessageBox.alert(`新 token：\n${result.deviceToken}`, '设备 token 已轮换', {
      confirmButtonText: '我知道了',
    })
  } finally {
    tokenRotating.value = false
  }
}

async function submitAssignment(): Promise<void> {
  if (!detail.value || !assignForm.vehicleId) {
    ElMessage.warning('请先选择车辆')
    return
  }

  saving.value = true
  try {
    detail.value = enrichDevice(await reassignDeviceVehicle(detail.value.id, {
      vehicleId: assignForm.vehicleId,
    }))
    syncAssignmentForm()
    ElMessage.success('设备车辆分配已更新')
  } finally {
    saving.value = false
  }
}

async function handleUnassignVehicle(): Promise<void> {
  if (!detail.value || !canUnassignVehicle.value) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认取消设备「${detail.value.deviceCode}」的当前分车吗？`,
      '取消分车',
      {
        type: 'warning',
        confirmButtonText: '确认取消',
        cancelButtonText: '保留分车',
      },
    )
  } catch {
    return
  }

  unassigning.value = true
  try {
    detail.value = enrichDevice(await unassignDeviceVehicle(detail.value.id))
    syncAssignmentForm()
    ElMessage.success('设备已取消分车')
  } finally {
    unassigning.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="设备详情">
      <template #actions>
        <el-button :loading="loading" @click="fetchDetail">刷新</el-button>
        <el-button v-if="detail && access.canManageDevices" @click="openEditDialog">编辑</el-button>
        <el-button
          v-if="detail && access.canManageDevices"
          :type="detail.lifecycleStatus === 'DISABLED' ? 'success' : 'danger'"
          plain
          :loading="statusSaving"
          @click="handleToggleStatus"
        >
          {{ statusActionText() }}
        </el-button>
        <el-button v-if="detail && access.canManageDevices" plain :loading="tokenRotating" @click="handleRotateToken">轮换 token</el-button>
      </template>
    </WorkspacePageHeader>

    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <PageSectionCard title="设备信息" description="展示设备当前企业归属、车辆归属和服务端统一计算的运行状态。">
          <el-descriptions v-if="detail" :column="2" border>
            <el-descriptions-item label="设备码">{{ detail.deviceCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名">{{ detail.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="旧版激活码">{{ maskSecret(detail.activationCode) }}</el-descriptions-item>
            <el-descriptions-item label="token轮换">{{ formatDateTime(detail.tokenRotatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ detail.enterpriseName || detail.enterpriseId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="车队">{{ detail.fleetName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="车辆">{{ detail.vehiclePlateNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="生命周期">
              <el-tag effect="plain" :type="lifecycleStatusTagType(detail.lifecycleStatus)">
                {{ lifecycleStatusText(detail.lifecycleStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车辆绑定">
              <el-tag effect="plain" :type="vehicleBindStatusTagType(detail.vehicleBindStatus)">
                {{ vehicleBindStatusText(detail.vehicleBindStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前阶段">
              <el-tag effect="plain" :type="effectiveStageTagType(detail.effectiveStage)">
                {{ effectiveStageText(detail.effectiveStage) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="会话状态">
              <el-tag effect="plain" :type="sessionStageTagType(detail.sessionStage)">
                {{ sessionStageText(detail.sessionStage) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前司机">{{ currentDriverText() }}</el-descriptions-item>
            <el-descriptions-item label="活动会话">{{ activeSessionText() }}</el-descriptions-item>
            <el-descriptions-item label="最近激活">{{ formatDateTime(detail.lastActivatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近在线">{{ formatDateTime(detail.lastSeenAt) }}</el-descriptions-item>
            <el-descriptions-item label="上传队列">
              <el-tag effect="plain" :type="uploadQueueTagType()">{{ uploadQueueText() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最近成功上报">{{ formatDateTime(detail.uploadLastSuccessAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近失败上报">{{ formatDateTime(detail.uploadLastFailedAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近失败类型">{{ detail.uploadLastFailureClass || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最近错误信息" :span="2">{{ detail.uploadLastErrorMessage || '-' }}</el-descriptions-item>
            <el-descriptions-item label="遥测更新时间">{{ formatDateTime(detail.uploadLastReportAt) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </PageSectionCard>

        <PageSectionCard
          v-if="detail && canAssignVehicle"
          title="车辆分配"
          description="企业绑定完成后，管理端在这里完成分车和取消分车；已被其他设备占用的车辆会展示但禁选。"
        >
          <el-form label-position="top">
            <el-form-item label="按车队筛选">
              <el-select v-model="assignForm.fleetId" clearable filterable class="full-width" placeholder="全部车队">
                <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标车辆">
              <el-select v-model="assignForm.vehicleId" filterable class="full-width" placeholder="请选择车辆">
                <el-option
                  v-for="item in vehicleOptions"
                  :key="item.id"
                  :label="vehicleOptionLabel(item)"
                  :value="item.id"
                  :disabled="isVehicleDisabled(item)"
                />
              </el-select>
            </el-form-item>
            <p class="hint-text">仅可分配当前企业车辆；已绑定到其他设备的车辆会保留在列表中并置灰显示占用设备码。</p>
            <div class="action-row">
              <el-button type="primary" :loading="saving" @click="submitAssignment">保存车辆分配</el-button>
              <el-button v-if="canUnassignVehicle" plain :loading="unassigning" @click="handleUnassignVehicle">取消分车</el-button>
            </div>
          </el-form>
        </PageSectionCard>
      </template>
    </el-skeleton>

    <DeviceEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :device="detail"
      @save="handleEditDevice"
    />
  </div>
</template>

<style scoped>
.full-width {
  width: 100%;
}

.hint-text {
  margin: 0 0 16px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
