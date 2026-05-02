<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { getDeviceBindLogList } from '../api/device-approvals'
import { fetchAllPages } from '../api/pagination'
import { getEnterpriseList } from '../api/enterprises'
import { useAuthStore } from '../stores/auth'
import type { DeviceBindLogAction, DeviceBindLogSummary } from '../types/device-approvals'
import type { EnterpriseSummary } from '../types/enterprises'
import {
  deviceBindLogActionTagType,
  deviceBindLogActionText,
  operatorTypeText,
} from '../utils/device-status'
import { formatDateTime } from '../utils/time'

interface FilterModel {
  enterpriseId?: number
  action?: DeviceBindLogAction
  deviceCode?: string
}

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorText = ref('')
const items = ref<DeviceBindLogSummary[]>([])
const enterprises = ref<EnterpriseSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filters = reactive<FilterModel>({
  enterpriseId: undefined,
  action: undefined,
  deviceCode: '',
})

const enterpriseOptions = computed(() => enterprises.value.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` })))
const selectedEnterpriseId = computed(() =>
  authStore.isSuperAdmin ? filters.enterpriseId : Number(authStore.enterpriseId) || undefined,
)

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
  const enterpriseId = selectedEnterpriseId.value
  if (!enterpriseId) {
    items.value = []
    total.value = 0
    errorText.value = ''
    return
  }

  loading.value = true
  try {
    const data = await getDeviceBindLogList(enterpriseId, {
      page: currentPage.value,
      size: pageSize.value,
      action: filters.action,
      deviceCode: filters.deviceCode?.trim() || undefined,
    })
    items.value = data.items
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '绑定日志加载失败'
  } finally {
    loading.value = false
  }
}

function operatorText(row: DeviceBindLogSummary): string {
  const actor = row.operatorName || (row.operatorId ? `#${row.operatorId}` : '')
  if (actor) {
    return `${operatorTypeText(row.operatorType)} / ${actor}`
  }

  return operatorTypeText(row.operatorType)
}

function openDetail(row: DeviceBindLogSummary): void {
  sessionStorage.setItem(`device-bind-log:${row.id}`, JSON.stringify(row))
  router.push({
    path: `/device-bind-logs/${row.id}`,
    query: { enterpriseId: String(row.enterpriseId) },
  })
}

function resetFilters(): void {
  filters.enterpriseId = undefined
  filters.action = undefined
  filters.deviceCode = ''
  currentPage.value = 1
  void fetchList()
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Bind Logs</p>
        <h1>设备绑定日志</h1>
        <p class="subhead">原审批主流程已下线，当前页面展示设备被企业激活码认领后的绑定记录。</p>
      </div>
    </div>

    <PageSectionCard title="筛选条件" description="企业管理员默认查看本企业绑定日志；超级管理员需要先选择企业。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="所属企业">
            <el-select v-model="filters.enterpriseId" clearable filterable style="width: 220px">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备码">
            <el-input v-model="filters.deviceCode" clearable placeholder="请输入设备码" style="width: 220px" />
          </el-form-item>
          <el-form-item label="动作">
            <el-select v-model="filters.action" clearable style="width: 180px">
              <el-option label="首次认领" value="CLAIMED" />
              <el-option label="重新绑定" value="REBOUND" />
              <el-option label="解绑" value="UNBOUND" />
              <el-option label="自动恢复" value="AUTO_RECOVERED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert
        v-if="authStore.isSuperAdmin && !selectedEnterpriseId"
        title="请选择企业后再查看绑定日志"
        type="info"
        :closable="false"
      />
      <el-alert v-else-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="deviceCode" label="设备码" min-width="140" />
          <el-table-column prop="deviceName" label="设备名" min-width="160" />
          <el-table-column label="所属企业" min-width="180">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column label="动作" width="120">
            <template #default="{ row }">
              <el-tag effect="plain" :type="deviceBindLogActionTagType(row.action)">
                {{ deviceBindLogActionText(row.action) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="企业激活码" min-width="180">
            <template #default="{ row }">{{ row.activationCodeMasked || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作来源 / 操作人" min-width="220">
            <template #default="{ row }">{{ operatorText(row) }}</template>
          </el-table-column>
          <el-table-column label="备注" min-width="220">
            <template #default="{ row }">{{ row.remark || '-' }}</template>
          </el-table-column>
          <el-table-column label="记录时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
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
