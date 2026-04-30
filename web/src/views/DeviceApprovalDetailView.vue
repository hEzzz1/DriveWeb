<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import DeviceActivationPanel from '../components/devices/DeviceActivationPanel.vue'
import PageSectionCard from '../components/PageSectionCard.vue'
import { approveDeviceApproval, getDeviceApprovalDetail, rejectDeviceApproval } from '../api/device-approvals'
import type { DeviceApprovalDetail } from '../types/device-approvals'
import {
  approvalStatusTagType,
  approvalStatusText,
  bindSourceText,
  effectiveStageTagType,
  effectiveStageText,
  lifecycleStatusTagType,
  lifecycleStatusText,
} from '../utils/device-status'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const detail = ref<DeviceApprovalDetail | null>(null)

const reviewForm = reactive({
  approveRemark: '',
  rejectReason: '',
})

const approvalId = computed(() => route.params.id as string)
const isPending = computed(() => detail.value?.status === 'PENDING')

onMounted(async () => {
  await fetchDetail()
})

async function fetchDetail(): Promise<void> {
  loading.value = true
  try {
    detail.value = await getDeviceApprovalDetail(approvalId.value)
  } finally {
    loading.value = false
  }
}

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function historyActionText(action: DeviceApprovalDetail['history'][number]['action']): string {
  switch (action) {
    case 'SUBMITTED':
      return '发起申请'
    case 'APPROVED':
      return '审批通过'
    case 'REJECTED':
      return '审批驳回'
    case 'EXPIRED':
      return '申请过期'
    case 'RESUBMITTED':
      return '重新提交'
    case 'CANCELED':
      return '申请取消'
  }
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
    detail.value = result
    ElMessage.success('审批已通过，正在进入设备详情')
    const targetDeviceId = result.deviceId || result.device?.id
    if (targetDeviceId) {
      await router.push(`/devices/${targetDeviceId}`)
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
    detail.value = await rejectDeviceApproval(detail.value.id, { reason })
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
        <p class="subhead">审批详情完全依赖服务端返回的申请单、设备状态和历史记录，驳回原因会直接回传 Edge。</p>
      </div>
    </div>

    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <PageSectionCard title="申请单信息" description="展示当前审批单的标准字段，包括申请时间、审批时间、过期时间和服务端计算的设备阶段。">
          <el-descriptions v-if="detail" :column="2" border>
            <el-descriptions-item label="设备码">{{ detail.deviceCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名">{{ detail.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="申请企业">{{ detail.enterpriseName || detail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="企业绑定码">{{ detail.bindCodeMasked || '-' }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDateTime(detail.submittedAt) }}</el-descriptions-item>
            <el-descriptions-item label="绑定来源">{{ bindSourceText(detail.bindSource) }}</el-descriptions-item>
            <el-descriptions-item label="审批时间">{{ formatDateTime(detail.reviewedAt) }}</el-descriptions-item>
            <el-descriptions-item label="过期时间">{{ formatDateTime(detail.expiresAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近在线">{{ formatDateTime(detail.lastSeenAt) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="approvalStatusTagType(detail.status)">
                {{ approvalStatusText(detail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="设备阶段">
              <el-tag v-if="detail.effectiveStage" effect="plain" :type="effectiveStageTagType(detail.effectiveStage)">
                {{ effectiveStageText(detail.effectiveStage) }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="审批人">{{ detail.reviewedBy || '-' }}</el-descriptions-item>
          </el-descriptions>
        </PageSectionCard>

        <PageSectionCard title="设备当前状态" description="审批页仅读取审批详情接口携带的设备快照，不再额外拼装兼容字段。">
          <el-descriptions v-if="detail?.device" :column="2" border>
            <el-descriptions-item label="当前企业">{{ detail.device.enterpriseName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前车队">{{ detail.device.fleetName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前车辆">{{ detail.device.vehiclePlateNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="生命周期">
              <el-tag effect="plain" :type="lifecycleStatusTagType(detail.device.lifecycleStatus)">
                {{ lifecycleStatusText(detail.device.lifecycleStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后激活">{{ formatDateTime(detail.device.lastActivatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近在线">{{ formatDateTime(detail.device.lastSeenAt) }}</el-descriptions-item>
          </el-descriptions>
          <div v-else class="note-card">当前审批单未返回设备快照。</div>
        </PageSectionCard>

        <PageSectionCard title="申请备注与审批反馈" description="申请备注、通过备注和驳回原因分字段展示，避免继续混用 `remark` / `reason`。">
          <div class="note-grid">
            <div class="note-box">
              <span class="note-label">申请备注</span>
              <div class="note-card">{{ detail?.applyRemark || '-' }}</div>
            </div>
            <div class="note-box">
              <span class="note-label">通过备注</span>
              <div class="note-card">{{ detail?.approveRemark || '-' }}</div>
            </div>
            <div class="note-box">
              <span class="note-label">驳回原因</span>
              <div class="note-card">{{ detail?.rejectReason || '-' }}</div>
            </div>
          </div>
        </PageSectionCard>

        <PageSectionCard title="设备激活码" description="这里展示设备级 activationCode、认领码和二维码；企业绑定码在上方申请单信息中单独展示。">
          <DeviceActivationPanel
            :device-code="detail?.deviceCode"
            :device-name="detail?.deviceName"
            :activation-code="detail?.activationCode || detail?.device?.activationCode"
          />
        </PageSectionCard>

        <PageSectionCard title="历史审批记录" description="时间线完全使用审批详情接口返回的 `history` 数据。">
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

        <PageSectionCard v-if="detail && isPending" title="审批动作" description="通过只发送 `{ remark }`，驳回只发送 `{ reason }`。">
          <div class="review-grid">
            <el-form label-position="top">
              <el-form-item label="通过备注">
                <el-input v-model="reviewForm.approveRemark" type="textarea" :rows="3" placeholder="可选，记录审批说明" />
              </el-form-item>
              <el-form-item label="驳回原因">
                <el-input v-model="reviewForm.rejectReason" type="textarea" :rows="3" placeholder="必填，Edge 端会直接展示此原因" />
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
.note-grid {
  display: grid;
  gap: 16px;
}

.note-box {
  display: grid;
  gap: 8px;
}

.note-label {
  font-size: 13px;
  color: #64748b;
}

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
