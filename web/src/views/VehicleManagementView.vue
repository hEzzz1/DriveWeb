<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { fetchAllPages } from '../api/pagination'
import { getEnterpriseList } from '../api/enterprises'
import { getFleetList } from '../api/fleets'
import { createVehicle, getVehicleDetail, getVehicleList, updateVehicle, updateVehicleStatus } from '../api/vehicles'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'
import type { UpdateVehiclePayload, VehicleDetail, VehicleSummary } from '../types/vehicles'
import { formatDateTime } from '../utils/time'

interface FilterModel {
  enterpriseId?: number
  fleetId?: number
  enabled?: boolean
}

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const detailLoading = ref(false)
const dialogSaving = ref(false)
const statusSaving = ref(false)
const errorText = ref('')

const items = ref<VehicleSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const fleets = ref<FleetSummary[]>([])
const fleetMap = ref(new Map<number, FleetSummary>())
const enterpriseMap = ref(new Map<number, EnterpriseSummary>())
const enterpriseOptions = ref<Array<{ value: number; label: string }>>([])

const detailVisible = ref(false)
const formVisible = ref(false)
const activeDetail = ref<VehicleDetail | null>(null)
const formMode = ref<'create' | 'edit'>('create')

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
  fleetId: undefined,
  enabled: undefined,
})

const form = reactive({
  id: undefined as number | undefined,
  enterpriseId: 0,
  fleetId: 0,
  plateNumber: '',
  vin: '',
  remark: '',
})

const fleetOptions = computed(() => {
  const enterpriseId = authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined
  return fleets.value.filter((item) => !enterpriseId || item.enterpriseId === enterpriseId)
})

const dialogFleetOptions = computed(() => fleets.value.filter((item) => item.enterpriseId === Number(form.enterpriseId)))

const summaryItems = computed(() => [
  { label: '车辆总数', value: total.value },
  { label: '启用车辆', value: items.value.filter((item) => item.enabled).length },
  { label: '企业范围', value: authStore.isSuperAdmin ? '跨企业' : authStore.enterpriseName || authStore.enterpriseId || '-' },
  { label: '绑定设备数', value: items.value.filter((item) => item.boundDeviceId).length },
])

watch(
  () => filters.enterpriseId,
  () => {
    if (!fleetOptions.value.some((item) => item.id === filters.fleetId)) {
      filters.fleetId = undefined
    }
  },
)

watch(
  () => form.enterpriseId,
  () => {
    if (!dialogFleetOptions.value.some((item) => item.id === form.fleetId)) {
      form.fleetId = 0
    }
  },
)

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await Promise.all([fetchEnterpriseOptions(), fetchFleetOptions()])
  await fetchList()
})

async function fetchEnterpriseOptions(): Promise<void> {
  if (!authStore.isSuperAdmin) {
    const currentId = Number(authStore.enterpriseId)
    if (currentId) {
      const currentEnterprise = { id: currentId, code: '', name: authStore.enterpriseName || `企业 ${currentId}`, enabled: true, status: 1 as const }
      enterpriseMap.value = new Map([[currentId, currentEnterprise]])
      enterpriseOptions.value = [{ value: currentId, label: `${currentEnterprise.name} (#${currentId})` }]
    }
    return
  }

  const items = await fetchAllPages(getEnterpriseList, {})
  enterpriseMap.value = new Map(items.map((item) => [item.id, item]))
  enterpriseOptions.value = items.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` }))
}

async function fetchFleetOptions(): Promise<void> {
  const items = await fetchAllPages(getFleetList, {
    enterpriseId: authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined,
  })
  fleets.value = items.map((item) => ({ ...item, enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName }))
  fleetMap.value = new Map(fleets.value.map((item) => [item.id, item]))
}

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getVehicleList({
      page: currentPage.value,
      size: pageSize.value,
      enterpriseId: authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
      fleetId: filters.fleetId,
      enabled: filters.enabled,
    })
    items.value = data.items.map(enrichVehicle)
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '车辆列表加载失败'
  } finally {
    loading.value = false
  }
}

function enrichVehicle(item: VehicleDetail): VehicleDetail {
  return {
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
    fleetName: fleetMap.value.get(item.fleetId)?.name || item.fleetName,
  }
}

function openCreate(): void {
  formMode.value = 'create'
  form.id = undefined
  form.enterpriseId = authStore.isSuperAdmin ? Number(filters.enterpriseId || enterpriseOptions.value[0]?.value || 0) : Number(authStore.enterpriseId) || 0
  form.fleetId = 0
  form.plateNumber = ''
  form.vin = ''
  form.remark = ''
  formVisible.value = true
}

async function openDetail(row: VehicleSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  try {
    activeDetail.value = enrichVehicle(await getVehicleDetail(row.id))
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function openEdit(row: VehicleSummary): Promise<void> {
  const detail = enrichVehicle(await getVehicleDetail(row.id))
  activeDetail.value = detail
  formMode.value = 'edit'
  form.id = detail.id
  form.enterpriseId = detail.enterpriseId
  form.fleetId = detail.fleetId
  form.plateNumber = detail.plateNumber
  form.vin = detail.vin || ''
  form.remark = detail.remark || ''
  formVisible.value = true
}

async function submitForm(): Promise<void> {
  if (!form.enterpriseId || !form.fleetId || !form.plateNumber.trim()) {
    ElMessage.warning('请完整填写企业、车队与车牌号')
    return
  }

  dialogSaving.value = true

  try {
    if (formMode.value === 'create') {
      await createVehicle({
        enterpriseId: Number(form.enterpriseId),
        fleetId: Number(form.fleetId),
        plateNumber: form.plateNumber.trim(),
        vin: form.vin.trim() || undefined,
        remark: form.remark.trim() || undefined,
      })
      ElMessage.success('车辆已创建')
    } else if (form.id) {
      const detail = enrichVehicle(await updateVehicle(form.id, {
        fleetId: Number(form.fleetId),
        plateNumber: form.plateNumber.trim(),
        vin: form.vin.trim() || undefined,
        remark: form.remark.trim() || undefined,
      } satisfies UpdateVehiclePayload))
      activeDetail.value = detail
      syncTableRow(detail)
      ElMessage.success('车辆资料已更新')
    }

    formVisible.value = false
    await fetchList()
  } finally {
    dialogSaving.value = false
  }
}

async function handleToggleStatus(row?: VehicleSummary): Promise<void> {
  const target = row ? enrichVehicle(await getVehicleDetail(row.id)) : activeDetail.value
  if (!target) {
    return
  }

  const nextStatus = target.enabled ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(`确认${actionText}车辆「${target.plateNumber}」吗？`, `${actionText}车辆`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true
  try {
    const detail = enrichVehicle(await updateVehicleStatus(target.id, { status: nextStatus as 0 | 1 }))
    if (activeDetail.value?.id === detail.id) {
      activeDetail.value = detail
    }
    syncTableRow(detail)
    ElMessage.success(`车辆已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: VehicleDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
}

function boundDeviceText(item: VehicleSummary): string {
  if (item.boundDeviceCode && item.boundDeviceName) {
    return `${item.boundDeviceCode} / ${item.boundDeviceName}`
  }

  return item.boundDeviceCode || item.boundDeviceName || '-'
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="车辆管理">
      <template #actions>
        <el-button v-if="access.canManageVehicles" type="primary" @click="openCreate">新增车辆</el-button>
      </template>
    </WorkspacePageHeader>

    <div class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </div>

    <PageSectionCard title="筛选条件" description="超级管理员可跨企业筛选，其他角色自动锁定所属企业。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="所属企业">
            <el-select v-model="filters.enterpriseId" clearable filterable placeholder="全部企业" style="width: 220px">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属车队">
            <el-select v-model="filters.fleetId" clearable filterable placeholder="全部车队" style="width: 220px">
              <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.enabled" clearable placeholder="全部状态" style="width: 140px">
              <el-option label="启用中" :value="true" />
              <el-option label="已停用" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="filters.enterpriseId = undefined; filters.fleetId = undefined; filters.enabled = undefined; currentPage = 1; fetchList()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="plateNumber" label="车牌号" min-width="150" />
          <el-table-column prop="id" label="车辆编号" width="110" />
          <el-table-column prop="enterpriseName" label="所属企业" min-width="160">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column prop="fleetName" label="所属车队" min-width="160">
            <template #default="{ row }">{{ row.fleetName || row.fleetId }}</template>
          </el-table-column>
          <el-table-column label="当前绑定设备" min-width="160">
            <template #default="{ row }">{{ boundDeviceText(row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag effect="plain" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用中' : '已停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="190" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button v-if="access.canManageVehicles" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="access.canManageVehicles" link :type="row.enabled ? 'warning' : 'success'" @click="handleToggleStatus(row)">
                {{ row.enabled ? '停用' : '启用' }}
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

    <el-drawer :model-value="detailVisible" size="720px" title="车辆详情" @close="detailVisible = false">
      <el-skeleton :loading="detailLoading" animated :rows="8">
        <template #default>
          <el-descriptions v-if="activeDetail" :column="2" border>
            <el-descriptions-item label="车牌号">{{ activeDetail.plateNumber }}</el-descriptions-item>
            <el-descriptions-item label="车辆编号">{{ activeDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ activeDetail.enterpriseName || activeDetail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="所属车队">{{ activeDetail.fleetName || activeDetail.fleetId }}</el-descriptions-item>
            <el-descriptions-item label="绑定设备">{{ boundDeviceText(activeDetail) }}</el-descriptions-item>
            <el-descriptions-item label="VIN">{{ activeDetail.vin || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="activeDetail.enabled ? 'success' : 'info'">{{ activeDetail.enabled ? '启用中' : '已停用' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(activeDetail.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ activeDetail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="activeDetail && access.canManageVehicles" class="action-row">
            <el-button @click="openEdit(activeDetail)">编辑资料</el-button>
            <el-button :loading="statusSaving" :type="activeDetail.enabled ? 'warning' : 'success'" plain @click="handleToggleStatus()">
              {{ activeDetail.enabled ? '停用车辆' : '启用车辆' }}
            </el-button>
          </div>
        </template>
      </el-skeleton>
    </el-drawer>

    <el-dialog :model-value="formVisible" :title="formMode === 'create' ? '新增车辆' : '编辑车辆'" width="560px" @close="formVisible = false">
      <el-form label-position="top">
        <el-form-item label="所属企业">
          <el-select v-if="authStore.isSuperAdmin && formMode === 'create'" v-model="form.enterpriseId" filterable class="full-width">
            <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input v-else :model-value="enterpriseMap.get(Number(form.enterpriseId))?.name || authStore.enterpriseName || '-'" disabled />
        </el-form-item>
        <el-form-item label="所属车队">
          <el-select v-model="form.fleetId" filterable class="full-width" placeholder="请选择车队">
            <el-option v-for="item in dialogFleetOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="form.plateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="VIN / 车辆编码">
          <el-input v-model="form.vin" placeholder="选填" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogSaving" @click="submitForm">{{ formMode === 'create' ? '创建车辆' : '保存资料' }}</el-button>
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

@media (max-width: 720px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
