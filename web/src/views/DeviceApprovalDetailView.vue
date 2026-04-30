<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { approveDeviceApproval, getDeviceApprovalDetail, rejectDeviceApproval } from '../api/device-approvals'
import { getEnterpriseList } from '../api/enterprises'
import { fetchAllPages } from '../api/pagination'
import { getFleetList } from '../api/fleets'
import { getVehicleList } from '../api/vehicles'
import { useAuthStore } from '../stores/auth'
import type { DeviceApprovalDetail } from '../types/device-approvals'
import type { EnterpriseSummary } from '../types/enterprises'
import type { FleetSummary } from '../types/fleets'
import type { VehicleSummary } from '../types/vehicles'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const actionLoading = ref(false)
const detail = ref<DeviceApprovalDetail | null>(null)
const enterprises = ref<EnterpriseSummary[]>([])
const fleets = ref<FleetSummary[]>([])
const vehicles = ref<VehicleSummary[]>([])
const enterpriseMap = ref(new Map<number, EnterpriseSummary>())
const fleetMap = ref(new Map<number, FleetSummary>())
const vehicleMap = ref(new Map<number, VehicleSummary>())

const reviewForm = reactive({
  approveRemark: '',
  rejectReason: '',
})

const approvalId = computed(() => route.params.id as string)
const isPending = computed(() => detail.value?.status === 'PENDING')

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await fetchReferences()
  await fetchDetail()
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

async function fetchDetail(): Promise<void> {
  loading.value = true
  try {
    const result = await getDeviceApprovalDetail(approvalId.value)
    detail.value = enrichDetail(result)
  } finally {
    loading.value = false
  }
}

function enrichDetail(item: DeviceApprovalDetail): DeviceApprovalDetail {
  if (!item.device) {
    return item
  }

  return {
    ...item,
    enterpriseName: enterpriseMap.value.get(item.enterpriseId)?.name || item.enterpriseName,
    device: {
      ...item.device,
      enterpriseName: enterpriseMap.value.get(item.device.enterpriseId)?.name || item.device.enterpriseName,
      fleetName: fleetMap.value.get(item.device.fleetId)?.name || item.device.fleetName,
      vehiclePlateNumber: vehicleMap.value.get(item.device.vehicleId)?.plateNumber || item.device.vehiclePlateNumber,
    },
  }
}

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function historyActionText(action: DeviceApprovalDetail['history'][number]['action']): string {
  if (action === 'SUBMITTED') {
    return '发起申请'
  }

  if (action === 'APPROVED') {
    return '审批通过'
  }

  return '审批驳回'
}

async function handleApprove(): Promise<void> {
  if (!detail.value || !isPending.value) {
    return
  }

  actionLoading.value = true
  try {
    const result = await approveDeviceApproval(detail.value.id, {
      remark: reviewForm.approveRemark.trim() || undefined,
    })
    detail.value = enrichDetail(result)
    ElMessage.success('审批已通过，正在进入设备详情')
    if (detail.value.deviceId) {
      await router.push(`/devices/${detail.value.deviceId}`)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleReject(): Promise<void> {
  if (!detail.value || !isPending.value) {
    return
  }

  const reason = reviewForm.rejectReason.trim()
  if (!reason) {
    ElMessage.warning('驳回时必须填写原因')
    return
  }

  actionLoading.value = true
  try {
    const result = await rejectDeviceApproval(detail.value.id, { reason })
    detail.value = enrichDetail(result)
    ElMessage.success('审批已驳回')
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Approval Detail</p>
        <h1>审批详情</h1>
        <p class="subhead">展示设备申请背景、审批历史和处理动作；驳回原因必须明确可回传 Edge 端。</p>
      </div>
    </div>

    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <PageSectionCard title="设备信息" description="这里展示申请中的设备主信息，以及当前企业、车队、车辆归属。">
          <el-descriptions v-if="detail" :column="2" border>
            <el-descriptions-item label="设备码">{{ detail.deviceCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名">{{ detail.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="申请企业">{{ detail.enterpriseName || detail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDateTime(detail.appliedAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近在线">{{ formatDateTime(detail.lastOnlineAt) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="detail.status === 'PENDING' ? 'warning' : detail.status === 'APPROVED' ? 'success' : 'danger'">
                {{ detail.status === 'PENDING' ? '待审批' : detail.status === 'APPROVED' ? '已通过' : '已驳回' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前车队">{{ detail.device?.fleetName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前车辆">{{ detail.device?.vehiclePlateNumber || '-' }}</el-descriptions-item>
          </el-descriptions>
        </PageSectionCard>

        <PageSectionCard title="申请备注" description="用于还原设备在 Edge 端发起绑定申请时的说明信息。">
          <div class="note-card">{{ detail?.applyRemark || '-' }}</div>
        </PageSectionCard>

        <PageSectionCard title="历史审批记录" description="完整保留申请、通过、驳回动作及备注。">
          <el-timeline>
            <el-timeline-item
              v-for="record in detail?.history || []"
              :key="record.id"
              :timestamp="formatDateTime(record.createdAt)"
              placement="top"
            >
              <div class="history-title">{{ historyActionText(record.action) }}</div>
              <div class="history-meta">{{ record.operatorName || (record.operatorId ? `#${record.operatorId}` : '系统') }}</div>
              <div class="history-remark">{{ record.remark || '-' }}</div>
            </el-timeline-item>
          </el-timeline>
        </PageSectionCard>

        <PageSectionCard v-if="detail && isPending" title="审批动作" description="通过后将跳转到设备详情继续分配车队和车辆；驳回必须填写原因。">
          <div class="review-grid">
            <el-form label-position="top">
              <el-form-item label="通过备注">
                <el-input v-model="reviewForm.approveRemark" type="textarea" :rows="3" placeholder="可选，记录审批说明" />
              </el-form-item>
              <el-form-item label="驳回原因">
                <el-input v-model="reviewForm.rejectReason" type="textarea" :rows="3" placeholder="必填，Edge 端会展示此原因" />
              </el-form-item>
            </el-form>
            <div class="action-row">
              <el-button type="primary" :loading="actionLoading" @click="handleApprove">通过</el-button>
              <el-button type="danger" plain :loading="actionLoading" @click="handleReject">驳回</el-button>
            </div>
          </div>
        </PageSectionCard>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.note-card {
  min-height: 72px;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  white-space: pre-wrap;
}

.history-title {
  font-weight: 600;
  color: #0f172a;
}

.history-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.history-remark {
  margin-top: 8px;
  color: #334155;
  white-space: pre-wrap;
}

.review-grid {
  display: grid;
  gap: 12px;
}

.action-row {
  display: flex;
  gap: 10px;
}
</style>
