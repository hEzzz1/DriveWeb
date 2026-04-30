<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { getDeviceDetail, reassignDeviceVehicle } from '../api/devices'
import { getEnterpriseList } from '../api/enterprises'
import { getFleetList } from '../api/fleets'
import { fetchAllPages } from '../api/pagination'
import { getVehicleList } from '../api/vehicles'
import { useAuthStore } from '../stores/auth'
import type { DeviceDetail } from '../types/devices'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'
import type { VehicleSummary } from '../types/vehicles'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const detail = ref<DeviceDetail | null>(null)
const enterprises = ref<EnterpriseSummary[]>([])
const fleets = ref<FleetSummary[]>([])
const vehicles = ref<VehicleSummary[]>([])
const enterpriseMap = ref(new Map<number, EnterpriseSummary>())
const fleetMap = ref(new Map<number, FleetSummary>())
const vehicleMap = ref(new Map<number, VehicleSummary>())

const assignForm = reactive({
  fleetId: undefined as number | undefined,
  vehicleId: undefined as number | undefined,
})

const deviceId = computed(() => route.params.id as string)
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
  await fetchReferences()
  await fetchDetail()
})

async function fetchReferences(): Promise<void> {
  if (authStore.isSuperAdmin) {
    const enterpriseItems = await fetchAllPages(getEnterpriseList, {})
    enterprises.value = enterpriseItems
    enterpriseMap.value = new Map(enterpriseItems.map((item) => [item.id, item]))
  } else {
    const currentId = Number(authStore.enterpriseId)
    if (currentId) {
      const current = { id: currentId, code: '', name: authStore.enterpriseName || `企业 ${currentId}`, enabled: true, status: 1 as const }
      enterprises.value = [current]
      enterpriseMap.value = new Map([[currentId, current]])
    }
  }

  const enterpriseId = authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined
  const [fleetItems, vehicleItems] = await Promise.all([
    fetchAllPages(getFleetList, { enterpriseId }),
    fetchAllPages(getVehicleList, { enterpriseId }),
  ])
  fleets.value = fleetItems
  vehicles.value = vehicleItems
  fleetMap.value = new Map(fleetItems.map((item) => [item.id, item]))
  vehicleMap.value = new Map(vehicleItems.map((item) => [item.id, item]))
}

async function fetchDetail(): Promise<void> {
  loading.value = true
  try {
    detail.value = enrichDevice(await getDeviceDetail(deviceId.value))
    assignForm.fleetId = detail.value.fleetId || undefined
    assignForm.vehicleId = detail.value.vehicleId || undefined
  } finally {
    loading.value = false
  }
}

function enrichDevice(item: DeviceDetail): DeviceDetail {
  return {
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
    fleetName: fleetMap.value.get(item.fleetId)?.name || item.fleetName,
    vehiclePlateNumber: vehicleMap.value.get(item.vehicleId)?.plateNumber || item.vehiclePlateNumber,
  }
}

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function activationStatusText(): string {
  return detail.value?.activationStatus === 'ACTIVATED' ? '已激活' : '待激活'
}

function onlineStatusText(): string {
  if (detail.value?.onlineStatus === 'ONLINE') {
    return '在线'
  }

  if (detail.value?.onlineStatus === 'OFFLINE') {
    return '离线'
  }

  return '未知'
}

async function submitAssignment(): Promise<void> {
  if (!detail.value || !assignForm.vehicleId) {
    ElMessage.warning('请先选择车队和车辆')
    return
  }

  saving.value = true
  try {
    detail.value = enrichDevice(await reassignDeviceVehicle(detail.value.id, {
      fleetId: assignForm.fleetId,
      vehicleId: assignForm.vehicleId,
    }))
    ElMessage.success('设备分配已更新')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Device Detail</p>
        <h1>设备详情</h1>
        <p class="subhead">审批通过后进入这里，查看设备状态，并继续分配所属车队和车辆。</p>
      </div>
    </div>

    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <PageSectionCard title="设备信息" description="展示企业归属、车队车辆关联和最新在线、同步、激活状态。">
          <el-descriptions v-if="detail" :column="2" border>
            <el-descriptions-item label="设备码">{{ detail.deviceCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名">{{ detail.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ detail.enterpriseName || detail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="车队">{{ detail.fleetName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="车辆">{{ detail.vehiclePlateNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="激活状态">
              <el-tag effect="plain" :type="detail.activationStatus === 'ACTIVATED' ? 'success' : 'warning'">{{ activationStatusText() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="在线状态">
              <el-tag effect="plain" :type="detail.onlineStatus === 'ONLINE' ? 'success' : 'info'">{{ onlineStatusText() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后同步时间">{{ formatDateTime(detail.lastOnlineAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </PageSectionCard>

        <PageSectionCard title="设备分配车辆" description="审批通过后，企业管理员可继续为设备指定车队和车辆。">
          <el-form label-position="top">
            <el-form-item label="车队">
              <el-select v-model="assignForm.fleetId" filterable class="full-width" placeholder="请选择车队">
                <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="车辆">
              <el-select v-model="assignForm.vehicleId" filterable class="full-width" placeholder="请选择车辆">
                <el-option v-for="item in vehicleOptions" :key="item.id" :label="`${item.plateNumber} / ${item.id}`" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-button type="primary" :loading="saving" @click="submitAssignment">保存分配</el-button>
          </el-form>
        </PageSectionCard>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.full-width {
  width: 100%;
}
</style>
