<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import { getDeviceBindLogDetail } from '../api/device-approvals'
import { useAuthStore } from '../stores/auth'
import type { DeviceBindLogDetail } from '../types/device-approvals'
import {
  deviceBindLogActionTagType,
  deviceBindLogActionText,
  effectiveStageTagType,
  effectiveStageText,
  lifecycleStatusTagType,
  lifecycleStatusText,
  operatorTypeText,
  sessionStageTagType,
  sessionStageText,
  vehicleBindStatusTagType,
  vehicleBindStatusText,
} from '../utils/device-status'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorText = ref('')
const detail = ref<DeviceBindLogDetail | null>(null)

const logId = computed(() => route.params.id as string)
const enterpriseId = computed(() => {
  const queryEnterpriseId = Number(route.query.enterpriseId)
  if (queryEnterpriseId) {
    return queryEnterpriseId
  }

  const currentEnterpriseId = Number(authStore.enterpriseId)
  return currentEnterpriseId || undefined
})

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  hydrateCachedDetail()
  await fetchDetail()
})

function hydrateCachedDetail(): void {
  const raw = sessionStorage.getItem(`device-bind-log:${logId.value}`)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw) as DeviceBindLogDetail
    detail.value = parsed
  } catch {
    // Ignore cache parse failures and fall back to network only.
  }
}

async function fetchDetail(): Promise<void> {
  if (!enterpriseId.value) {
    errorText.value = '缺少企业信息，请从绑定日志列表进入'
    return
  }

  loading.value = true
  try {
    detail.value = await getDeviceBindLogDetail(enterpriseId.value, logId.value)
    errorText.value = ''
  } catch (error) {
    if (!detail.value) {
      errorText.value = error instanceof Error ? error.message : '绑定日志详情加载失败'
    }
  } finally {
    loading.value = false
  }
}

function formatDateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

function operatorText(): string {
  if (!detail.value) {
    return '-'
  }

  const actor = detail.value.operatorName || (detail.value.operatorId ? `#${detail.value.operatorId}` : '')
  if (actor) {
    return `${operatorTypeText(detail.value.operatorType)} / ${actor}`
  }

  return operatorTypeText(detail.value.operatorType)
}

function openDeviceDetail(): void {
  if (detail.value?.deviceId) {
    router.push(`/devices/${detail.value.deviceId}`)
  }
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Bind Log Detail</p>
        <h1>设备绑定记录详情</h1>
        <p class="subhead">该页面只展示设备被企业激活码认领后的日志记录和当前设备快照，不再承载审批动作。</p>
      </div>
    </div>

    <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />

    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <PageSectionCard title="绑定记录" description="记录设备是何时被哪个企业激活码认领的，以及操作来源和备注。">
          <el-descriptions v-if="detail" :column="2" border>
            <el-descriptions-item label="设备码">{{ detail.deviceCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名">{{ detail.deviceName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ detail.enterpriseName || detail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="企业激活码">{{ detail.activationCodeMasked || '-' }}</el-descriptions-item>
            <el-descriptions-item label="动作">
              <el-tag effect="plain" :type="deviceBindLogActionTagType(detail.action)">
                {{ deviceBindLogActionText(detail.action) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="操作来源 / 操作人">{{ operatorText() }}</el-descriptions-item>
            <el-descriptions-item label="记录时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </PageSectionCard>

        <PageSectionCard title="当前设备状态" description="这里显示的是设备当前归属和当前运行态，不是历史审批状态。">
          <el-descriptions v-if="detail?.device" :column="2" border>
            <el-descriptions-item label="当前企业">{{ detail.device.enterpriseName || detail.device.enterpriseId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前车队">{{ detail.device.fleetName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前车辆">{{ detail.device.vehiclePlateNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="生命周期">
              <el-tag effect="plain" :type="lifecycleStatusTagType(detail.device.lifecycleStatus)">
                {{ lifecycleStatusText(detail.device.lifecycleStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车辆绑定">
              <el-tag effect="plain" :type="vehicleBindStatusTagType(detail.device.vehicleBindStatus)">
                {{ vehicleBindStatusText(detail.device.vehicleBindStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前阶段">
              <el-tag effect="plain" :type="effectiveStageTagType(detail.device.effectiveStage)">
                {{ effectiveStageText(detail.device.effectiveStage) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="会话状态">
              <el-tag effect="plain" :type="sessionStageTagType(detail.device.sessionStage)">
                {{ sessionStageText(detail.device.sessionStage) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最近在线">{{ formatDateTime(detail.device.lastSeenAt) }}</el-descriptions-item>
          </el-descriptions>
          <div v-else class="empty-state">当前记录未返回设备快照。</div>

          <div v-if="detail?.deviceId" class="action-row">
            <el-button type="primary" plain @click="openDeviceDetail">查看设备详情</el-button>
          </div>
        </PageSectionCard>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
}

.action-row {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}
</style>
