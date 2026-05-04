<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { fetchAllPages } from '../api/pagination'
import { getEnterpriseList } from '../api/enterprises'
import { getFleetList } from '../api/fleets'
import { forceSignOutSession, getSessionDetail, getSessionList } from '../api/sessions'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'
import type { SessionDetail, SessionSummary } from '../types/sessions'
import { formatDateTime } from '../utils/time'

interface FilterModel {
  enterpriseId?: number
  fleetId?: number
  status?: 1 | 2
  keyword: string
}

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const detailLoading = ref(false)
const forceSaving = ref(false)
const errorText = ref('')

const items = ref<SessionSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const enterprises = ref<EnterpriseSummary[]>([])
const fleets = ref<FleetSummary[]>([])
const activeDetail = ref<SessionDetail | null>(null)
const detailVisible = ref(false)

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
  fleetId: undefined,
  status: undefined,
  keyword: '',
})

const enterpriseOptions = computed(() => enterprises.value.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` })))
const fleetOptions = computed(() => {
  const enterpriseId = authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined
  return fleets.value.filter((item) => !enterpriseId || item.enterpriseId === enterpriseId)
})
const summaryItems = computed(() => [
  { label: '会话总数', value: total.value },
  { label: '活跃会话', value: items.value.filter((item) => item.status === 1).length },
  { label: '已结束会话', value: items.value.filter((item) => item.status === 2).length },
  { label: '当前企业范围', value: authStore.isSuperAdmin ? '跨企业' : authStore.enterpriseName || authStore.enterpriseId || '-' },
])

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await fetchReferences()
  await fetchList()
})

async function fetchReferences(): Promise<void> {
  if (authStore.isSuperAdmin) {
    enterprises.value = await fetchAllPages(getEnterpriseList, {})
  } else {
    const currentId = Number(authStore.enterpriseId)
    if (currentId) {
      enterprises.value = [{ id: currentId, code: '', name: authStore.enterpriseName || `企业 ${currentId}`, enabled: true, status: 1 as const }]
    }
  }

  fleets.value = await fetchAllPages(getFleetList, {
    enterpriseId: authStore.isSuperAdmin ? undefined : Number(authStore.enterpriseId) || undefined,
  })
}

async function fetchList(): Promise<void> {
  loading.value = true
  try {
    const data = await getSessionList({
      page: currentPage.value,
      size: pageSize.value,
      enterpriseId: authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
      fleetId: filters.fleetId,
      status: filters.status,
      keyword: filters.keyword.trim() || undefined,
    })
    items.value = data.items
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '会话列表加载失败'
  } finally {
    loading.value = false
  }
}

async function openDetail(row: SessionSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  try {
    activeDetail.value = await getSessionDetail(row.id)
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleForceSignOut(row?: SessionSummary): Promise<void> {
  const target = row || activeDetail.value
  if (!target || target.status !== 1) {
    return
  }

  let remark = ''
  try {
    const result = await ElMessageBox.prompt('请输入强制签退备注', '强制签退', {
      confirmButtonText: '确认签退',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：后台运营干预',
    })
    remark = result.value || ''
  } catch {
    return
  }

  forceSaving.value = true
  try {
    const detail = await forceSignOutSession(target.id, { remark: remark.trim() || undefined })
    activeDetail.value = activeDetail.value?.id === detail.id ? detail : activeDetail.value
    items.value = items.value.map((item) => (item.id === detail.id ? detail : item))
    ElMessage.success('会话已强制签退')
    await fetchList()
  } finally {
    forceSaving.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="驾驶会话管理" />

    <div class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </div>

    <PageSectionCard title="筛选条件" description="企业管理员自动锁定本企业，只展示授权范围内的驾驶会话。">
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
          <el-form-item label="状态">
            <el-select v-model="filters.status" clearable style="width: 160px">
              <el-option label="活跃中" :value="1" />
              <el-option label="已结束" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="会话编号">
            <el-input v-model="filters.keyword" clearable placeholder="支持按会话编号查询" style="width: 220px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="filters.enterpriseId = undefined; filters.fleetId = undefined; filters.status = undefined; filters.keyword = ''; currentPage = 1; fetchList()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="sessionNo" label="会话编号" min-width="190" />
          <el-table-column label="设备" min-width="120">
            <template #default="{ row }">{{ row.deviceCode || row.deviceId }}</template>
          </el-table-column>
          <el-table-column label="车辆" min-width="120">
            <template #default="{ row }">{{ row.vehiclePlateNumber || row.vehicleId }}</template>
          </el-table-column>
          <el-table-column label="驾驶员" min-width="140">
            <template #default="{ row }">{{ row.driverName || row.driverCode || row.driverId }}</template>
          </el-table-column>
          <el-table-column label="企业" min-width="140">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column label="车队" min-width="140">
            <template #default="{ row }">{{ row.fleetName || row.fleetId }}</template>
          </el-table-column>
          <el-table-column label="开始时间" min-width="170">
            <template #default="{ row }">{{ formatDateTime(row.signInTime) }}</template>
          </el-table-column>
          <el-table-column label="结束时间" min-width="170">
            <template #default="{ row }">{{ formatDateTime(row.signOutTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><el-tag effect="plain" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '活跃中' : '已结束' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="最近心跳" min-width="170">
            <template #default="{ row }">{{ formatDateTime(row.lastHeartbeatAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button v-if="access.canManageSessions && row.status === 1" link type="danger" @click="handleForceSignOut(row)">强制签退</el-button>
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

    <el-drawer :model-value="detailVisible" size="760px" title="驾驶会话详情" @close="detailVisible = false">
      <el-skeleton :loading="detailLoading" animated :rows="10">
        <template #default>
          <el-descriptions v-if="activeDetail" :column="2" border>
            <el-descriptions-item label="会话编号">{{ activeDetail.sessionNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="activeDetail.status === 1 ? 'success' : 'info'">{{ activeDetail.status === 1 ? '活跃中' : '已结束' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="设备">{{ activeDetail.deviceCode || activeDetail.deviceId }}</el-descriptions-item>
            <el-descriptions-item label="车辆">{{ activeDetail.vehiclePlateNumber || activeDetail.vehicleId }}</el-descriptions-item>
            <el-descriptions-item label="驾驶员">{{ activeDetail.driverName || activeDetail.driverCode || activeDetail.driverId }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ activeDetail.enterpriseName || activeDetail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="车队">{{ activeDetail.fleetName || activeDetail.fleetId }}</el-descriptions-item>
            <el-descriptions-item label="最近心跳">{{ formatDateTime(activeDetail.lastHeartbeatAt) }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDateTime(activeDetail.signInTime) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDateTime(activeDetail.signOutTime) }}</el-descriptions-item>
            <el-descriptions-item label="关闭原因">{{ activeDetail.closedReason || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ activeDetail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="activeDetail?.status === 1 && access.canManageSessions" class="action-row">
            <el-button type="danger" plain :loading="forceSaving" @click="handleForceSignOut()">强制签退</el-button>
          </div>
        </template>
      </el-skeleton>
    </el-drawer>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

@media (max-width: 720px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
