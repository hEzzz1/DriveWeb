<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { fetchAllPages } from '../api/pagination'
import { getDeviceList } from '../api/devices'
import { getEnterpriseList } from '../api/enterprises'
import { getFleetList } from '../api/fleets'
import { getVehicleList } from '../api/vehicles'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { DeviceDetail, DeviceSummary } from '../types/devices'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'
import type { VehicleSummary } from '../types/vehicles'

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

function enrichDevice(item: DeviceDetail): DeviceDetail {
  const enterprise = enterpriseMap.value.get(item.enterpriseId)
  const fleet = fleetMap.value.get(item.fleetId)
  const vehicle = vehicleMap.value.get(item.vehicleId)
  return {
    ...item,
    enterpriseName: enterprise?.name || item.enterpriseName,
    fleetName: fleet?.name || item.fleetName,
    vehiclePlateNumber: vehicle?.plateNumber || item.vehiclePlateNumber,
  }
}

function activationStatusText(row: DeviceSummary): string {
  return row.activationStatus === 'ACTIVATED' ? '已激活' : '待激活'
}

function onlineStatusText(row: DeviceSummary): string {
  if (row.onlineStatus === 'ONLINE') {
    return '在线'
  }

  if (row.onlineStatus === 'OFFLINE') {
    return '离线'
  }

  return '未知'
}

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function openDetail(row: DeviceSummary): void {
  router.push(`/devices/${row.id}`)
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Device Registry</p>
        <h1>设备管理</h1>
        <p class="subhead">平台管理员查看全部设备，企业管理员仅管理本企业设备，并继续完成审批后的车辆分配。</p>
      </div>
    </div>

    <PageSectionCard title="筛选条件" description="企业管理员自动锁定当前企业；设备台账按企业与车队维度查看。">
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
          <el-table-column prop="deviceName" label="设备名" min-width="160" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag effect="plain" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="企业" min-width="170">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column label="车队" min-width="150">
            <template #default="{ row }">{{ row.fleetName || '-' }}</template>
          </el-table-column>
          <el-table-column label="车辆" min-width="150">
            <template #default="{ row }">{{ row.vehiclePlateNumber || '-' }}</template>
          </el-table-column>
          <el-table-column label="最后在线" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.lastOnlineAt) }}</template>
          </el-table-column>
          <el-table-column label="最后激活" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.lastActivatedAt) }}</template>
          </el-table-column>
          <el-table-column label="激活状态" width="120">
            <template #default="{ row }">
              <el-tag effect="plain" :type="row.activationStatus === 'ACTIVATED' ? 'success' : 'warning'">{{ activationStatusText(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="在线状态" width="120">
            <template #default="{ row }">
              <el-tag effect="plain" :type="row.onlineStatus === 'ONLINE' ? 'success' : 'info'">{{ onlineStatusText(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="access.canManageDevices" label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
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
