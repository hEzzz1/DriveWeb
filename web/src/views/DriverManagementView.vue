<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { fetchAllPages } from '../api/pagination'
import DriverCreateDialog from '../components/drivers/DriverCreateDialog.vue'
import DriverDetailDrawer from '../components/drivers/DriverDetailDrawer.vue'
import DriverEditDialog from '../components/drivers/DriverEditDialog.vue'
import DriverListTable from '../components/drivers/DriverListTable.vue'
import DriverReassignFleetDialog from '../components/drivers/DriverReassignFleetDialog.vue'
import { getEnterpriseList } from '../api/enterprises'
import { createDriver, getDriverDetail, getDriverList, reassignDriverFleet, resetDriverPin, unassignDriverFleet, updateDriver, updateDriverStatus } from '../api/drivers'
import { getFleetList } from '../api/fleets'
import { getSessionList } from '../api/sessions'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { DriverDetail, DriverListQuery, DriverSummary } from '../types/drivers'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'

interface FilterModel {
  keyword: string
  enterpriseId?: number
  fleetId?: number
  enabled?: boolean
}

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const detailLoading = ref(false)
const createSaving = ref(false)
const editSaving = ref(false)
const statusSaving = ref(false)
const reassignSaving = ref(false)
const unassignSaving = ref(false)
const errorText = ref('')

const items = ref<DriverSummary[]>([])
const fleets = ref<FleetSummary[]>([])
const activeSessions = ref<Array<{ sessionId: number; driverId: number }>>([])
const enterpriseOptions = ref<Array<{ value: number; label: string }>>([])
const enterpriseMap = ref(new Map<number, EnterpriseSummary>())
const fleetMap = ref(new Map<number, FleetSummary>())

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const detailVisible = ref(false)
const createVisible = ref(false)
const editVisible = ref(false)
const reassignVisible = ref(false)
const activeDetail = ref<DriverDetail | null>(null)

const filters = reactive<FilterModel>({
  keyword: '',
  enterpriseId: undefined,
  fleetId: undefined,
  enabled: undefined,
})

const enabledOptions = [
  { label: '启用中', value: true },
  { label: '已禁用', value: false },
]

const filteredFleetOptions = computed(() => {
  const targetEnterpriseId = authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined
  return fleets.value.filter((item) => !targetEnterpriseId || item.enterpriseId === targetEnterpriseId)
})

const summaryItems = computed(() => [
  { label: '驾驶员总数', value: total.value },
  { label: '启用驾驶员', value: items.value.filter((item) => item.enabled).length },
  { label: '当前企业范围', value: authStore.isSuperAdmin ? '跨企业' : authStore.enterpriseName || authStore.enterpriseId || '-' },
  { label: '车队来源', value: `${fleets.value.length} 个真实车队` },
])

watch(
  () => filters.enterpriseId,
  () => {
    if (!authStore.isSuperAdmin) {
      return
    }

    if (!filteredFleetOptions.value.some((item) => item.id === filters.fleetId)) {
      filters.fleetId = undefined
    }
  },
)

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await Promise.all([fetchEnterpriseOptions(), fetchFleetOptions()])
  await fetchActiveSessions()
  await fetchList()
})

async function fetchEnterpriseOptions(): Promise<void> {
  if (!authStore.isSuperAdmin) {
    const currentId = Number(authStore.enterpriseId)
    if (currentId) {
      const currentEnterprise = {
        id: currentId,
        code: '',
        name: authStore.enterpriseName || `企业 ${currentId}`,
        enabled: true,
        status: 1 as const,
      }
      enterpriseMap.value = new Map([[currentId, currentEnterprise]])
      enterpriseOptions.value = [{ value: currentId, label: `${currentEnterprise.name} (#${currentId})` }]
    }
    return
  }

  const items = await fetchAllPages(getEnterpriseList, {})
  enterpriseMap.value = new Map(items.map((item) => [item.id, item]))
  enterpriseOptions.value = items.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id})`,
  }))
}

async function fetchFleetOptions(): Promise<void> {
  const items = await fetchAllPages(getFleetList, {
    enterpriseId: authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined,
  })

  fleets.value = items.map((item) => ({
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
  }))
  fleetMap.value = new Map(fleets.value.map((item) => [item.id, item]))
}

async function fetchActiveSessions(): Promise<void> {
  const items = await fetchAllPages(getSessionList, {
    enterpriseId: authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined,
    status: 1,
  })
  activeSessions.value = items.map((item) => ({ sessionId: item.id, driverId: item.driverId }))
}

function buildQuery(): DriverListQuery {
  return {
    page: currentPage.value,
    size: pageSize.value,
    keyword: filters.keyword.trim() || undefined,
    enterpriseId: authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
    fleetId: filters.fleetId,
    enabled: filters.enabled,
  }
}

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getDriverList(buildQuery())
    items.value = data.items.map(enrichDriver)
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '驾驶员列表加载失败'
  } finally {
    loading.value = false
  }
}

function enrichDriver(item: DriverDetail): DriverDetail {
  const activeSession = activeSessions.value.find((entry) => entry.driverId === item.id)
  return {
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
    fleetName: item.fleetId ? fleetMap.value.get(item.fleetId)?.name || item.fleetName : '未分配',
    hasActiveSession: Boolean(activeSession),
    activeSessionId: activeSession?.sessionId,
  }
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filters.keyword = ''
  filters.enterpriseId = authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined
  filters.fleetId = undefined
  filters.enabled = undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function openDetail(row: DriverSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true

  try {
    activeDetail.value = enrichDriver(await getDriverDetail(row.id))
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleCreateDriver(payload: Parameters<typeof createDriver>[0]): Promise<void> {
  createSaving.value = true

  try {
    await createDriver(payload)
    createVisible.value = false
    await Promise.all([fetchFleetOptions(), fetchActiveSessions(), fetchList()])
    ElMessage.success('驾驶员已创建')
  } finally {
    createSaving.value = false
  }
}

async function handleEditDriver(payload: Parameters<typeof updateDriver>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  editSaving.value = true

  try {
    const detail = enrichDriver(await updateDriver(activeDetail.value.id, payload))
    activeDetail.value = detail
    syncTableRow(detail)
    editVisible.value = false
    ElMessage.success('驾驶员资料已更新')
  } finally {
    editSaving.value = false
  }
}

async function handleToggleStatus(row?: DriverSummary): Promise<void> {
  const target = row ? enrichDriver(await getDriverDetail(row.id)) : activeDetail.value
  if (!target) {
    return
  }

  const nextStatus = target.enabled ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}驾驶员「${target.name}」吗？`, `${actionText}驾驶员`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true

  try {
    const detail = enrichDriver(await updateDriverStatus(target.id, { status: nextStatus as 0 | 1 }))
    activeDetail.value = activeDetail.value?.id === detail.id ? detail : activeDetail.value
    syncTableRow(detail)
    ElMessage.success(`驾驶员已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

async function handleReassignFleet(payload: Parameters<typeof reassignDriverFleet>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  reassignSaving.value = true

  try {
    const detail = enrichDriver(await reassignDriverFleet(activeDetail.value.id, payload))
    activeDetail.value = detail
    syncTableRow(detail)
    reassignVisible.value = false
    await fetchActiveSessions()
    ElMessage.success('所属车队已更新')
  } finally {
    reassignSaving.value = false
  }
}

async function handleUnassignFleet(row?: DriverSummary): Promise<void> {
  const target = row ? enrichDriver(await getDriverDetail(row.id)) : activeDetail.value
  if (!target || !target.fleetId) {
    return
  }

  try {
    await ElMessageBox.confirm(`确认将驾驶员「${target.name}」移出当前车队吗？移出后不能在边缘端签到。`, '移出车队', {
      type: 'warning',
      confirmButtonText: '确认移出',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  unassignSaving.value = true

  try {
    const detail = enrichDriver(await unassignDriverFleet(target.id))
    activeDetail.value = activeDetail.value?.id === detail.id ? detail : activeDetail.value
    syncTableRow(detail)
    await fetchActiveSessions()
    ElMessage.success('驾驶员已移出车队')
  } finally {
    unassignSaving.value = false
  }
}

async function handleResetPin(row?: DriverSummary): Promise<void> {
  const target = row ? enrichDriver(await getDriverDetail(row.id)) : activeDetail.value
  if (!target) {
    return
  }

  let pin = ''
  try {
    const result = await ElMessageBox.prompt('请输入新的 4-6 位签到码', '重置驾驶员签到码', {
      inputPlaceholder: '例如 1234',
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      inputPattern: /^[0-9]{4,6}$/,
      inputErrorMessage: '签到码仅支持 4-6 位数字',
    })
    pin = result.value
  } catch {
    return
  }

  await resetDriverPin(target.id, { pin })
  ElMessage.success('驾驶员签到码已重置')
}

function syncTableRow(detail: DriverDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="驾驶员管理">
      <template #actions>
        <el-button v-if="access.canManageDrivers" type="primary" @click="createVisible = true">新增驾驶员</el-button>
      </template>
    </WorkspacePageHeader>

    <div class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </div>

    <PageSectionCard title="筛选条件" description="车队下拉仅使用真实车队接口返回，不允许前端自由猜测或手填。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="所属企业">
            <el-select v-model="filters.enterpriseId" clearable filterable placeholder="全部企业">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属车队">
            <el-select v-model="filters.fleetId" clearable filterable placeholder="全部车队">
              <el-option v-for="item in filteredFleetOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键字">
            <el-input v-model="filters.keyword" clearable placeholder="姓名 / 手机号 / 驾驶证号" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.enabled" clearable placeholder="全部状态">
              <el-option v-for="item in enabledOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </PageSectionCard>

    <PageSectionCard title="驾驶员列表" :description="errorText || '详情侧栏可执行编辑、启停和调整所属车队。'">
      <DriverListTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        :can-manage="access.canManageDrivers"
        @detail="openDetail"
        @edit="(row) => { openDetail(row); editVisible = true }"
        @reassign="(row) => { openDetail(row); reassignVisible = true }"
        @unassign="handleUnassignFleet"
        @reset-pin="handleResetPin"
        @toggle-status="handleToggleStatus"
        @page-change="(page) => { currentPage = page; fetchList() }"
        @size-change="(size) => { pageSize = size; currentPage = 1; fetchList() }"
      />
    </PageSectionCard>

    <DriverCreateDialog
      v-model:visible="createVisible"
      :loading="createSaving"
      :fleets="fleets"
      :enterprise-options="enterpriseOptions"
      :default-enterprise-id="Number(authStore.enterpriseId) || undefined"
      :lock-enterprise="!authStore.isSuperAdmin"
      @save="handleCreateDriver"
    />

    <DriverEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :driver="activeDetail"
      @save="handleEditDriver"
    />

    <DriverReassignFleetDialog
      v-model:visible="reassignVisible"
      :loading="reassignSaving"
      :driver="activeDetail"
      :fleets="fleets"
      @save="handleReassignFleet"
    />

    <DriverDetailDrawer
      v-model:visible="detailVisible"
      :detail="activeDetail"
      :loading="detailLoading || statusSaving || unassignSaving"
      :can-manage="access.canManageDrivers"
      @edit="editVisible = true"
      @reassign="reassignVisible = true"
      @unassign="handleUnassignFleet()"
      @reset-pin="handleResetPin()"
      @toggle-status="handleToggleStatus()"
    />
  </div>
</template>
