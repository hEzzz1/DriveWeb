<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import FleetCreateDialog from '../components/fleets/FleetCreateDialog.vue'
import FleetDetailDrawer from '../components/fleets/FleetDetailDrawer.vue'
import FleetEditDialog from '../components/fleets/FleetEditDialog.vue'
import FleetListTable from '../components/fleets/FleetListTable.vue'
import { getEnterpriseList } from '../api/enterprises'
import { createFleet, getFleetDetail, getFleetList, updateFleet, updateFleetStatus } from '../api/fleets'
import { getDriverList } from '../api/drivers'
import { getVehicleList } from '../api/vehicles'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetDetail, FleetListQuery, FleetSummary } from '../types/fleets'

interface FilterModel {
  enterpriseId?: number
}

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const detailLoading = ref(false)
const createSaving = ref(false)
const editSaving = ref(false)
const statusSaving = ref(false)
const errorText = ref('')

const items = ref<FleetSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const createVisible = ref(false)
const editVisible = ref(false)
const detailVisible = ref(false)
const activeDetail = ref<FleetDetail | null>(null)

const enterpriseOptions = ref<Array<{ value: number; label: string }>>([])
const enterpriseMap = ref(new Map<number, EnterpriseSummary>())

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
})

const summaryItems = computed(() => [
  { label: '车队总数', value: total.value },
  { label: '启用车队', value: items.value.filter((item) => item.enabled).length },
  { label: '企业范围', value: authStore.isSuperAdmin ? '跨企业' : authStore.enterpriseName || authStore.enterpriseId || '-' },
  { label: '操作模式', value: access.value.canManageFleets ? '读写' : '只读' },
])

const pageSubhead = computed(() =>
  authStore.isSuperAdmin
    ? '支持按企业筛选、创建、编辑和启停车队，驾驶员数量由真实驾驶员接口聚合。'
    : '当前以企业管理员或业务只读角色视角进入，企业范围已自动锁定到当前企业。',
)

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await fetchEnterpriseOptions()
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

  const data = await getEnterpriseList({ page: 1, size: 100 })
  enterpriseMap.value = new Map(data.items.map((item) => [item.id, item]))
  enterpriseOptions.value = data.items.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id})`,
  }))
}

function buildQuery(): FleetListQuery {
  return {
    page: currentPage.value,
    size: pageSize.value,
    enterpriseId: authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
  }
}

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getFleetList(buildQuery())
    items.value = await hydrateFleetItems(data.items)
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '车队列表加载失败'
  } finally {
    loading.value = false
  }
}

async function hydrateFleetItems(source: FleetSummary[]): Promise<FleetSummary[]> {
  const [driverCounts, vehicleCounts] = await Promise.all([
    Promise.all(
      source.map(async (item) => {
        const data = await getDriverList({ page: 1, size: 1, fleetId: item.id })
        return [item.id, data.total] as const
      }),
    ),
    Promise.all(
      source.map(async (item) => {
        const data = await getVehicleList({ page: 1, size: 1, fleetId: item.id })
        return [item.id, data.total] as const
      }),
    ),
  ])

  const countMap = new Map<number, number>(driverCounts)
  const vehicleCountMap = new Map<number, number>(vehicleCounts)

  return source.map((item) => ({
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
    driverCount: countMap.get(item.id) ?? 0,
    vehicleCount: vehicleCountMap.get(item.id) ?? 0,
  }))
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filters.enterpriseId = authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function openDetail(row: FleetSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true

  try {
    const detail = await getFleetDetail(row.id)
    activeDetail.value = enrichFleet(detail)
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function enrichFleet(item: FleetDetail): FleetDetail {
  const matched = items.value.find((source) => source.id === item.id)
  return {
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || matched?.enterpriseName,
    driverCount: matched?.driverCount,
  }
}

async function handleCreateFleet(payload: Parameters<typeof createFleet>[0]): Promise<void> {
  createSaving.value = true

  try {
    await createFleet(payload)
    createVisible.value = false
    await fetchList()
    ElMessage.success('车队已创建')
  } finally {
    createSaving.value = false
  }
}

async function handleEditFleet(payload: Parameters<typeof updateFleet>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  editSaving.value = true

  try {
    const detail = enrichFleet(await updateFleet(activeDetail.value.id, payload))
    activeDetail.value = detail
    syncTableRow(detail)
    editVisible.value = false
    ElMessage.success('车队信息已更新')
  } finally {
    editSaving.value = false
  }
}

async function handleToggleStatus(row?: FleetSummary): Promise<void> {
  const target = row ? enrichFleet(await getFleetDetail(row.id)) : activeDetail.value
  if (!target) {
    return
  }

  const nextStatus = target.enabled ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(`确认${actionText}车队「${target.name}」吗？`, `${actionText}车队`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true

  try {
    const detail = enrichFleet(await updateFleetStatus(target.id, { status: nextStatus as 0 | 1 }))
    activeDetail.value = activeDetail.value?.id === detail.id ? detail : activeDetail.value
    syncTableRow(detail)
    ElMessage.success(`车队已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: FleetDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader eyebrow="Fleets" title="车队管理" :subtitle="pageSubhead">
      <template #actions>
        <el-button v-if="access.canManageFleets" type="primary" @click="createVisible = true">新建车队</el-button>
      </template>
    </WorkspacePageHeader>

    <div class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </div>

    <PageSectionCard title="筛选条件" description="企业管理员固定当前企业，超级管理员可按企业查看和管理。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="所属企业">
            <el-select v-model="filters.enterpriseId" clearable filterable placeholder="全部企业">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </PageSectionCard>

    <PageSectionCard title="车队列表" :description="errorText || '展示车队基础信息，并支持从详情侧栏执行编辑和状态切换。'">
      <FleetListTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        :can-manage="access.canManageFleets"
        @detail="openDetail"
        @edit="(row) => { openDetail(row); editVisible = true }"
        @toggle-status="handleToggleStatus"
        @page-change="(page) => { currentPage = page; fetchList() }"
        @size-change="(size) => { pageSize = size; currentPage = 1; fetchList() }"
      />
    </PageSectionCard>

    <FleetCreateDialog
      v-model:visible="createVisible"
      :loading="createSaving"
      :enterprise-options="enterpriseOptions"
      :default-enterprise-id="Number(authStore.enterpriseId) || undefined"
      :lock-enterprise="!authStore.isSuperAdmin"
      @save="handleCreateFleet"
    />

    <FleetEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :fleet="activeDetail"
      @save="handleEditFleet"
    />

    <FleetDetailDrawer
      v-model:visible="detailVisible"
      :detail="activeDetail"
      :loading="detailLoading || statusSaving"
      :can-manage="access.canManageFleets"
      @edit="editVisible = true"
      @toggle-status="handleToggleStatus()"
    />
  </div>
</template>
