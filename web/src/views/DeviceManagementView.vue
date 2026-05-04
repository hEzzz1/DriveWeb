<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import DeviceCreateDialog from '../components/devices/DeviceCreateDialog.vue'
import DeviceEditDialog from '../components/devices/DeviceEditDialog.vue'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { fetchAllPages } from '../api/pagination'
import { createDevice, getDeviceDetail, getDeviceList, updateDevice, updateDeviceStatus } from '../api/devices'
import { getEnterpriseList } from '../api/enterprises'
import { getFleetList } from '../api/fleets'
import { getVehicleList } from '../api/vehicles'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { CreateDevicePayload, DeviceDetail, DeviceSummary, UpdateDevicePayload } from '../types/devices'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'
import type { VehicleSummary } from '../types/vehicles'
import {
  effectiveStageTagType,
  effectiveStageText,
  lifecycleStatusTagType,
  lifecycleStatusText,
  vehicleBindStatusTagType,
  vehicleBindStatusText,
} from '../utils/device-status'
import { formatDateTime } from '../utils/time'

interface FilterModel {
  enterpriseId?: number
  fleetId?: number
}

const router = useRouter()
const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const errorText = ref('')
const items = ref<DeviceSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const createVisible = ref(false)
const createSaving = ref(false)
const editVisible = ref(false)
const editSaving = ref(false)
const activeEditDevice = ref<DeviceDetail | null>(null)
const statusChangingId = ref<number | null>(null)

const enterprises = ref<EnterpriseSummary[]>([])
const fleets = ref<FleetSummary[]>([])
const vehicles = ref<VehicleSummary[]>([])
const enterpriseMap = ref(new Map<number, EnterpriseSummary>())
const fleetMap = ref(new Map<number, FleetSummary>())
const vehicleMap = ref(new Map<number, VehicleSummary>())

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
  fleetId: undefined,
})

const enterpriseOptions = computed(() => enterprises.value.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` })))
const fleetOptions = computed(() => {
  const enterpriseId = authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined
  return fleets.value.filter((item) => !enterpriseId || item.enterpriseId === enterpriseId)
})
const currentEnterpriseId = computed(() => Number(authStore.enterpriseId) || undefined)

watch(
  () => filters.enterpriseId,
  () => {
    if (!fleetOptions.value.some((item) => item.id === filters.fleetId)) {
      filters.fleetId = undefined
    }
  },
)

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await fetchReferences()
  await fetchList()
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

async function fetchList(): Promise<void> {
  loading.value = true
  try {
    const data = await getDeviceList({
      page: currentPage.value,
      size: pageSize.value,
      enterpriseId: authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
      fleetId: filters.fleetId,
    })
    items.value = data.items.map(enrichDevice)
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '设备列表加载失败'
  } finally {
    loading.value = false
  }
}

function enrichDevice(item: DeviceSummary): DeviceSummary {
  return {
    ...item,
    enterpriseName: item.enterpriseName || (item.enterpriseId ? enterpriseMap.value.get(item.enterpriseId)?.name : undefined),
    fleetName: item.fleetName || (item.fleetId ? fleetMap.value.get(item.fleetId)?.name : undefined),
    vehiclePlateNumber: item.vehiclePlateNumber || (item.vehicleId ? vehicleMap.value.get(item.vehicleId)?.plateNumber : undefined),
  }
}

function vehicleText(row: DeviceSummary): string {
  if (row.vehiclePlateNumber && row.fleetName) {
    return `${row.vehiclePlateNumber} / ${row.fleetName}`
  }

  return row.vehiclePlateNumber || row.fleetName || '-'
}

function statusActionText(row: DeviceSummary): string {
  return row.lifecycleStatus === 'DISABLED' ? '启用' : '禁用'
}

function openDetail(row: DeviceSummary): void {
  router.push(`/devices/${row.id}`)
}

async function openEditDialog(row: DeviceSummary): Promise<void> {
  try {
    activeEditDevice.value = enrichDevice(await getDeviceDetail(row.id)) as DeviceDetail
    editVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '设备详情加载失败')
  }
}

async function handleCreateDevice(payload: CreateDevicePayload): Promise<void> {
  createSaving.value = true
  try {
    await createDevice(payload)
    createVisible.value = false
    ElMessage.success('设备已创建')
    await fetchList()
  } finally {
    createSaving.value = false
  }
}

async function handleEditDevice(payload: UpdateDevicePayload): Promise<void> {
  if (!activeEditDevice.value) {
    return
  }

  editSaving.value = true
  try {
    await updateDevice(activeEditDevice.value.id, payload)
    editVisible.value = false
    activeEditDevice.value = null
    ElMessage.success('设备已更新')
    await fetchList()
  } finally {
    editSaving.value = false
  }
}

async function handleToggleStatus(row: DeviceSummary): Promise<void> {
  const nextStatus = row.lifecycleStatus === 'DISABLED' ? 1 : 0
  const actionText = nextStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}设备「${row.deviceCode}」吗？`, `${actionText}设备`, {
      type: nextStatus === 1 ? 'info' : 'warning',
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusChangingId.value = row.id
  try {
    await updateDeviceStatus(row.id, { status: nextStatus as 0 | 1 })
    ElMessage.success(`设备已${actionText}`)
    await fetchList()
  } finally {
    statusChangingId.value = null
  }
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="设备管理">
      <template #actions>
        <el-button @click="fetchList">刷新</el-button>
        <el-button v-if="access.canManageDevices" type="primary" @click="createVisible = true">新建设备</el-button>
      </template>
    </WorkspacePageHeader>

    <PageSectionCard title="筛选条件" description="企业管理员自动锁定当前企业；设备列表按企业和车队维度查看。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="所属企业">
            <el-select v-model="filters.enterpriseId" clearable filterable style="width: 220px">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="车队">
            <el-select v-model="filters.fleetId" clearable filterable style="width: 220px">
              <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="filters.enterpriseId = undefined; filters.fleetId = undefined; currentPage = 1; fetchList()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="deviceCode" label="设备码" min-width="140" />
          <el-table-column prop="deviceName" label="设备名" min-width="180" />
          <el-table-column label="生命周期" width="130">
            <template #default="{ row }">
              <el-tag effect="plain" :type="lifecycleStatusTagType(row.lifecycleStatus)">
                {{ lifecycleStatusText(row.lifecycleStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属企业" min-width="180">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId || '-' }}</template>
          </el-table-column>
          <el-table-column label="车辆 / 车队" min-width="180">
            <template #default="{ row }">{{ vehicleText(row) }}</template>
          </el-table-column>
          <el-table-column label="车辆绑定" min-width="130">
            <template #default="{ row }">
              <el-tag effect="plain" :type="vehicleBindStatusTagType(row.vehicleBindStatus)">
                {{ vehicleBindStatusText(row.vehicleBindStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="当前阶段" min-width="170">
            <template #default="{ row }">
              <el-tag effect="plain" :type="effectiveStageTagType(row.effectiveStage)">
                {{ effectiveStageText(row.effectiveStage) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近在线" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.lastSeenAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button v-if="access.canManageDevices" link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button
                v-if="access.canManageDevices"
                link
                :type="row.lifecycleStatus === 'DISABLED' ? 'success' : 'danger'"
                :loading="statusChangingId === row.id"
                @click="handleToggleStatus(row)"
              >
                {{ statusActionText(row) }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <span>共 {{ total }} 条</span>
          <el-pagination
            background
            layout="sizes, prev, pager, next"
            :total="total"
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            @current-change="currentPage = $event; fetchList()"
            @size-change="pageSize = $event; currentPage = 1; fetchList()"
          />
        </div>
      </div>
    </PageSectionCard>

    <DeviceCreateDialog
      v-model:visible="createVisible"
      :loading="createSaving"
      :fleets="fleets"
      :vehicles="vehicles"
      :enterprise-options="enterpriseOptions"
      :default-enterprise-id="currentEnterpriseId"
      :lock-enterprise="!authStore.isSuperAdmin"
      @save="handleCreateDevice"
    />

    <DeviceEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :device="activeEditDevice"
      @save="handleEditDevice"
    />
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 720px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
