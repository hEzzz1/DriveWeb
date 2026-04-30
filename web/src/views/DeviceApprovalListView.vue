<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { getDeviceApprovalList } from '../api/device-approvals'
import { fetchAllPages } from '../api/pagination'
import { getEnterpriseList } from '../api/enterprises'
import { useAuthStore } from '../stores/auth'
import type { DeviceApprovalStatus, DeviceApprovalSummary } from '../types/device-approvals'
import type { EnterpriseSummary } from '../types/enterprises'
import { formatClaimCode } from '../utils/device-claim'
import {
  approvalStatusTagType,
  approvalStatusText,
  bindSourceText,
  effectiveStageTagType,
  effectiveStageText,
} from '../utils/device-status'

interface FilterModel {
  enterpriseId?: number
  status?: DeviceApprovalStatus
  deviceCode?: string
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
  deviceCode: '',
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
      deviceCode: filters.deviceCode?.trim() || undefined,
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

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function reviewFeedback(row: DeviceApprovalSummary): string {
  return row.rejectReason || row.approveRemark || '-'
}

function openDetail(row: DeviceApprovalSummary): void {
  router.push(`/device-approvals/${row.id}`)
}

function resetFilters(): void {
  filters.enterpriseId = undefined
  filters.status = undefined
  filters.deviceCode = ''
  currentPage.value = 1
  void fetchList()
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Approval Desk</p>
        <h1>设备绑定审批</h1>
        <p class="subhead">审批列表只展示服务端返回的申请状态、审批反馈和设备阶段，避免前端自行推断。</p>
      </div>
    </div>

    <PageSectionCard title="筛选条件" description="支持按企业、设备码和审批状态筛选，`EXPIRED` 申请会单独展示。">
      <div class="filter-bar">
        <el-form inline>
          <el-form-item v-if="authStore.isSuperAdmin" label="申请企业">
            <el-select v-model="filters.enterpriseId" clearable filterable style="width: 220px">
              <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备码">
            <el-input v-model="filters.deviceCode" clearable placeholder="请输入设备码" style="width: 220px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" clearable style="width: 180px">
              <el-option label="待审批" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
              <el-option label="已过期" value="EXPIRED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="currentPage = 1; fetchList()">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="deviceCode" label="设备码" min-width="140" />
          <el-table-column prop="deviceName" label="设备名" min-width="160" />
          <el-table-column label="激活码 / 认领码" min-width="220">
            <template #default="{ row }">
              <div class="activation-cell">
                <span class="activation-code">{{ row.activationCode || '-' }}</span>
                <span v-if="row.activationCode" class="claim-code">{{ formatClaimCode(row.activationCode) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="申请企业" min-width="180">
            <template #default="{ row }">{{ row.enterpriseName || row.enterpriseId }}</template>
          </el-table-column>
          <el-table-column label="绑定来源" min-width="220">
            <template #default="{ row }">
              <div class="bind-code-cell">
                <span>{{ bindSourceText(row.bindSource) }}</span>
                <span class="bind-code-mask">{{ row.bindCodeMasked || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="申请时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.submittedAt) }}</template>
          </el-table-column>
          <el-table-column label="审批时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.reviewedAt) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag effect="plain" :type="approvalStatusTagType(row.status)">{{ approvalStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设备阶段" min-width="170">
            <template #default="{ row }">
              <el-tag v-if="row.effectiveStage" effect="plain" :type="effectiveStageTagType(row.effectiveStage)">
                {{ effectiveStageText(row.effectiveStage) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="申请备注" min-width="220">
            <template #default="{ row }">{{ row.applyRemark || '-' }}</template>
          </el-table-column>
          <el-table-column label="审批反馈" min-width="240">
            <template #default="{ row }">{{ reviewFeedback(row) }}</template>
          </el-table-column>
          <el-table-column label="最近在线时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.lastSeenAt) }}</template>
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

.activation-cell {
  display: grid;
  gap: 6px;
}

.activation-code {
  font-family:
    'SFMono-Regular', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
  font-size: 13px;
  color: #0f172a;
  word-break: break-all;
}

.claim-code {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-family:
    'SFMono-Regular', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  word-break: break-all;
}

.bind-code-cell {
  display: grid;
  gap: 6px;
}

.bind-code-mask {
  color: #64748b;
  font-family:
    'SFMono-Regular', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
  font-size: 12px;
}

@media (max-width: 720px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
