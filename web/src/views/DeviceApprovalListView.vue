<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { getDeviceApprovalList } from '../api/device-approvals'
import { fetchAllPages } from '../api/pagination'
import { getEnterpriseList } from '../api/enterprises'
import { useAuthStore } from '../stores/auth'
import type { DeviceApprovalSummary } from '../types/device-approvals'
import type { EnterpriseSummary } from '../types/enterprises'

interface FilterModel {
  enterpriseId?: number
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorText = ref('')
const items = ref<DeviceApprovalSummary[]>([])
const enterprises = ref<EnterpriseSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
  status: undefined,
})

const enterpriseOptions = computed(() => enterprises.value.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` })))

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await fetchReferences()
  await fetchList()
})

async function fetchReferences(): Promise<void> {
  if (!authStore.isSuperAdmin) {
    return
  }

  enterprises.value = await fetchAllPages(getEnterpriseList, {})
}

async function fetchList(): Promise<void> {
  loading.value = true
  try {
    const data = await getDeviceApprovalList({
      page: currentPage.value,
      size: pageSize.value,
      enterpriseId: authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
      status: filters.status,
    })
    items.value = data.items
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '审批列表加载失败'
  } finally {
    loading.value = false
  }
}

function statusText(status: DeviceApprovalSummary['status']): string {
  if (status === 'PENDING') {
    return '待审批'
  }

  if (status === 'APPROVED') {
    return '已通过'
  }

  return '已驳回'
}

function statusTagType(status: DeviceApprovalSummary['status']): 'warning' | 'success' | 'danger' {
  if (status === 'PENDING') {
    return 'warning'
  }

  if (status === 'APPROVED') {
    return 'success'
  }

  return 'danger'
}

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function openDetail(row: DeviceApprovalSummary): void {
  router.push(`/device-approvals/${row.id}`)
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Approval Desk</p>
        <h1>设备绑定审批</h1>
        <p class="subhead">企业管理员审批本企业设备申请，平台管理员可查看和处理全部审批单。</p>
      </div>
    </div>

    <PageSectionCard title="筛选条件" description="驳回原因会同步给 Edge 端，因此审批台必须保留清晰备注与状态。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="申请企业">
            <el-select v-model="filters.enterpriseId" clearable filterable style="width: 220px">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" clearable style="width: 180px">
              <el-option label="待审批" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="filters.enterpriseId = undefined; filters.status = undefined; currentPage = 1; fetchList()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="deviceCode" label="设备码" min-width="140" />
          <el-table-column prop="deviceName" label="设备名" min-width="160" />
          <el-table-column label="申请企业" min-width="180">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column label="申请时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.appliedAt) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag effect="plain" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="220">
            <template #default="{ row }">{{ row.reviewRemark || row.applyRemark || '-' }}</template>
          </el-table-column>
          <el-table-column label="最近在线时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.lastOnlineAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
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
