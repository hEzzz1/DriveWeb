<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import { fetchAllPages } from '../api/pagination'
import { createDevice, getDeviceDetail, getDeviceList, reassignDeviceVehicle, rotateDeviceToken, updateDevice, updateDeviceStatus } from '../api/devices'
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
  vehicleId?: number
}

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const detailLoading = ref(false)
const dialogSaving = ref(false)
const statusSaving = ref(false)
const bindSaving = ref(false)
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

const detailVisible = ref(false)
const formVisible = ref(false)
const bindVisible = ref(false)
const activeDetail = ref<DeviceDetail | null>(null)
const formMode = ref<'create' | 'edit'>('create')
const rotatedToken = ref('')

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
  fleetId: undefined,
  vehicleId: undefined,
})

const form = reactive({
  id: 0,
  vehicleId: 0,
  deviceCode: '',
  deviceName: '',
  activationCode: '',
  remark: '',
})

const bindForm = reactive({
  vehicleId: 0,
})

const enterpriseOptions = computed(() => enterprises.value.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` })))
const fleetOptions = computed(() => {
  const enterpriseId = authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined
  return fleets.value.filter((item) => !enterpriseId || item.enterpriseId === enterpriseId)
})
const vehicleOptions = computed(() => {
  const targetFleetId = filters.fleetId
  return vehicles.value.filter((item) => !targetFleetId || item.fleetId === targetFleetId)
})
const dialogVehicleOptions = computed(() => {
  if (formMode.value === 'create') {
    return vehicles.value.filter((item) => !items.value.some((device) => device.vehicleId === item.id))
  }
  return vehicles.value
})
const bindVehicleOptions = computed(() => {
  const detail = activeDetail.value
  if (!detail) {
    return []
  }
  return vehicles.value.filter((item) => item.enterpriseId === detail.enterpriseId)
})

watch(
  () => filters.enterpriseId,
  () => {
    if (!fleetOptions.value.some((item) => item.id === filters.fleetId)) {
      filters.fleetId = undefined
    }
  },
)

watch(
  () => filters.fleetId,
  () => {
    if (!vehicleOptions.value.some((item) => item.id === filters.vehicleId)) {
      filters.vehicleId = undefined
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
      vehicleId: filters.vehicleId,
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
  const fleet = fleetMap.value.get(item.fleetId)
  const vehicle = vehicleMap.value.get(item.vehicleId)
  return {
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
    fleetName: fleet?.name || item.fleetName,
    vehiclePlateNumber: vehicle?.plateNumber || item.vehiclePlateNumber,
  }
}

function openCreate(): void {
  formMode.value = 'create'
  form.id = 0
  form.vehicleId = 0
  form.deviceCode = ''
  form.deviceName = ''
  form.activationCode = ''
  form.remark = ''
  rotatedToken.value = ''
  formVisible.value = true
}

async function openDetail(row: DeviceSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  try {
    activeDetail.value = enrichDevice(await getDeviceDetail(row.id))
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function openEdit(row: DeviceSummary): Promise<void> {
  const detail = enrichDevice(await getDeviceDetail(row.id))
  activeDetail.value = detail
  formMode.value = 'edit'
  form.id = detail.id
  form.vehicleId = detail.vehicleId
  form.deviceCode = detail.deviceCode
  form.deviceName = detail.deviceName
  form.activationCode = detail.activationCode || ''
  form.remark = detail.remark || ''
  formVisible.value = true
}

async function submitForm(): Promise<void> {
  if (!form.vehicleId || !form.deviceName.trim() || (formMode.value === 'create' && !form.deviceCode.trim())) {
    ElMessage.warning('请完整填写设备信息与绑定车辆')
    return
  }

  dialogSaving.value = true
  try {
    if (formMode.value === 'create') {
      await createDevice({
        vehicleId: Number(form.vehicleId),
        deviceCode: form.deviceCode.trim(),
        deviceName: form.deviceName.trim(),
        activationCode: form.activationCode.trim() || undefined,
        remark: form.remark.trim() || undefined,
      })
      ElMessage.success('设备已创建')
    } else {
      const detail = enrichDevice(await updateDevice(form.id, {
        deviceName: form.deviceName.trim(),
        activationCode: form.activationCode.trim() || undefined,
        remark: form.remark.trim() || undefined,
      }))
      activeDetail.value = detail
      syncTableRow(detail)
      ElMessage.success('设备资料已更新')
    }

    formVisible.value = false
    await Promise.all([fetchReferences(), fetchList()])
  } finally {
    dialogSaving.value = false
  }
}

async function handleToggleStatus(row?: DeviceSummary): Promise<void> {
  const target = row ? enrichDevice(await getDeviceDetail(row.id)) : activeDetail.value
  if (!target) {
    return
  }

  const nextStatus = target.enabled ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(`确认${actionText}设备「${target.deviceCode}」吗？`, `${actionText}设备`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true
  try {
    const detail = enrichDevice(await updateDeviceStatus(target.id, { status: nextStatus as 0 | 1 }))
    if (activeDetail.value?.id === detail.id) {
      activeDetail.value = detail
    }
    syncTableRow(detail)
    ElMessage.success(`设备已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function openBindVehicle(): void {
  if (!activeDetail.value) {
    return
  }
  bindForm.vehicleId = activeDetail.value.vehicleId
  bindVisible.value = true
}

async function submitBindVehicle(): Promise<void> {
  if (!activeDetail.value || !bindForm.vehicleId) {
    return
  }
  bindSaving.value = true
  try {
    const detail = enrichDevice(await reassignDeviceVehicle(activeDetail.value.id, { vehicleId: Number(bindForm.vehicleId) }))
    activeDetail.value = detail
    syncTableRow(detail)
    bindVisible.value = false
    await fetchReferences()
    ElMessage.success('设备绑定车辆已更新')
  } finally {
    bindSaving.value = false
  }
}

async function handleRotateToken(row?: DeviceSummary): Promise<void> {
  const target = row ? row.id : activeDetail.value?.id
  if (!target) {
    return
  }
  const result = await rotateDeviceToken(target)
  rotatedToken.value = result.deviceToken
  ElMessage.success('Token 已轮换')
}

function syncTableRow(detail: DeviceDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Devices</p>
        <h1>设备管理</h1>
        <p class="subhead">车辆绑定必须来自真实车辆下拉，展示最近在线时间、当前司机和 Token 轮换能力。</p>
      </div>
      <div class="head-actions">
        <el-button v-if="access.canManageDevices" type="primary" @click="openCreate">新增设备</el-button>
      </div>
    </div>

    <PageSectionCard title="筛选条件" description="企业管理员自动锁定本企业，设备绑定车辆不允许自由输入 ID。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="所属企业">
            <el-select v-model="filters.enterpriseId" clearable filterable style="width: 220px">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属车队">
            <el-select v-model="filters.fleetId" clearable filterable style="width: 220px">
              <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="绑定车辆">
            <el-select v-model="filters.vehicleId" clearable filterable style="width: 220px">
              <el-option v-for="item in vehicleOptions" :key="item.id" :label="item.plateNumber" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="filters.enterpriseId = undefined; filters.fleetId = undefined; filters.vehicleId = undefined; currentPage = 1; fetchList()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="deviceCode" label="设备编号" min-width="140" />
          <el-table-column prop="deviceName" label="设备名称" min-width="160" />
          <el-table-column prop="enterpriseName" label="所属企业" min-width="160">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column prop="fleetName" label="所属车队" min-width="150">
            <template #default="{ row }">{{ row.fleetName || row.fleetId }}</template>
          </el-table-column>
          <el-table-column label="绑定车辆" min-width="140">
            <template #default="{ row }">{{ row.vehiclePlateNumber || row.vehicleId }}</template>
          </el-table-column>
          <el-table-column label="最近在线时间" min-width="180">
            <template #default="{ row }">{{ row.lastOnlineAt ? new Date(row.lastOnlineAt).toLocaleString() : '-' }}</template>
          </el-table-column>
          <el-table-column label="当前司机" min-width="160">
            <template #default="{ row }">{{ row.currentDriverName || row.currentDriverCode || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><el-tag effect="plain" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用中' : '已停用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" min-width="240" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button v-if="access.canManageDevices" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="access.canManageDevices" link @click="handleRotateToken(row)">轮换 Token</el-button>
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

    <el-drawer :model-value="detailVisible" size="760px" title="设备详情" @close="detailVisible = false">
      <el-skeleton :loading="detailLoading" animated :rows="9">
        <template #default>
          <el-descriptions v-if="activeDetail" :column="2" border>
            <el-descriptions-item label="设备编号">{{ activeDetail.deviceCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ activeDetail.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ activeDetail.enterpriseName || activeDetail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="所属车队">{{ activeDetail.fleetName || activeDetail.fleetId }}</el-descriptions-item>
            <el-descriptions-item label="绑定车辆">{{ activeDetail.vehiclePlateNumber || activeDetail.vehicleId }}</el-descriptions-item>
            <el-descriptions-item label="当前司机">{{ activeDetail.currentDriverName || activeDetail.currentDriverCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最近在线">{{ activeDetail.lastOnlineAt ? new Date(activeDetail.lastOnlineAt).toLocaleString() : '-' }}</el-descriptions-item>
            <el-descriptions-item label="Token 最近轮换">{{ activeDetail.tokenRotatedAt ? new Date(activeDetail.tokenRotatedAt).toLocaleString() : '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="activeDetail.enabled ? 'success' : 'info'">{{ activeDetail.enabled ? '启用中' : '已停用' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="激活码">{{ activeDetail.activationCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ activeDetail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-alert v-if="rotatedToken" class="token-alert" type="success" :closable="false" title="最新 Token">
            <template #default><span class="mono">{{ rotatedToken }}</span></template>
          </el-alert>
          <div v-if="activeDetail && access.canManageDevices" class="action-row">
            <el-button @click="openEdit(activeDetail)">编辑资料</el-button>
            <el-button type="primary" plain @click="openBindVehicle">绑定车辆</el-button>
            <el-button plain @click="handleRotateToken()">轮换 Token</el-button>
            <el-button :loading="statusSaving" :type="activeDetail.enabled ? 'warning' : 'success'" plain @click="handleToggleStatus()">
              {{ activeDetail.enabled ? '停用设备' : '启用设备' }}
            </el-button>
          </div>
        </template>
      </el-skeleton>
    </el-drawer>

    <el-dialog :model-value="formVisible" :title="formMode === 'create' ? '新增设备' : '编辑设备'" width="560px" @close="formVisible = false">
      <el-form label-position="top">
        <el-form-item label="绑定车辆">
          <el-select v-model="form.vehicleId" filterable class="full-width">
            <el-option v-for="item in dialogVehicleOptions" :key="item.id" :label="`${item.plateNumber} / ${item.id}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备编号">
          <el-input v-model="form.deviceCode" :disabled="formMode === 'edit'" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="form.deviceName" />
        </el-form-item>
        <el-form-item label="激活码">
          <el-input v-model="form.activationCode" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogSaving" @click="submitForm">{{ formMode === 'create' ? '创建设备' : '保存资料' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog :model-value="bindVisible" title="调整绑定车辆" width="520px" @close="bindVisible = false">
      <el-form label-position="top">
        <el-form-item label="目标车辆">
          <el-select v-model="bindForm.vehicleId" filterable class="full-width">
            <el-option v-for="item in bindVehicleOptions" :key="item.id" :label="`${item.plateNumber} / ${item.id}`" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" :loading="bindSaving" @click="submitBindVehicle">保存绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.full-width {
  width: 100%;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.token-alert {
  margin-top: 16px;
}

.mono {
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  word-break: break-all;
}

@media (max-width: 720px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
