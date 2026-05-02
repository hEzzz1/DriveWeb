<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import EnterpriseActivationCodePanel from '../components/enterprises/EnterpriseActivationCodePanel.vue'
import {
  disableOrgEnterpriseActivationCode,
  getOrgEnterpriseActivationCode,
  rotateOrgEnterpriseActivationCode,
} from '../api/enterprise-activation-codes'
import { getOrgEnterpriseProfile } from '../api/enterprises'
import { useAccess } from '../composables/useAccess'
import type { EnterpriseActivationCodeSummary } from '../types/enterprise-activation-codes'
import type { EnterpriseDetail } from '../types/enterprises'

const access = useAccess()

const loading = ref(false)
const activationCodeLoading = ref(false)
const errorText = ref('')
const profile = ref<EnterpriseDetail | null>(null)
const activationCode = ref<EnterpriseActivationCodeSummary | null>(null)

const summaryItems = computed(() => [
  { label: '企业 ID', value: profile.value?.id ?? '-' },
  { label: '企业编码', value: profile.value?.code ?? '-' },
  { label: '企业名称', value: profile.value?.name ?? '-' },
  { label: '当前状态', value: profile.value ? (profile.value.enabled ? '启用中' : '已禁用') : '-' },
])

onMounted(async () => {
  await fetchProfile()
  await fetchActivationCode()
})

async function fetchProfile(): Promise<void> {
  loading.value = true

  try {
    profile.value = await getOrgEnterpriseProfile()
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '企业资料加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchActivationCode(): Promise<void> {
  if (!access.value.canViewEnterpriseActivationCodes) {
    activationCode.value = null
    return
  }

  activationCodeLoading.value = true

  try {
    activationCode.value = await getOrgEnterpriseActivationCode({ silentError: true })
  } catch {
    activationCode.value = null
  } finally {
    activationCodeLoading.value = false
  }
}

async function handleRotateActivationCode(): Promise<void> {
  if (!access.value.canManageEnterpriseActivationCodes) {
    return
  }

  try {
    await ElMessageBox.confirm('确认轮换当前企业激活码吗？旧码轮换后将失效。', '轮换企业激活码', {
      type: 'warning',
      confirmButtonText: '确认轮换',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  activationCodeLoading.value = true

  try {
    activationCode.value = await rotateOrgEnterpriseActivationCode()
    ElMessage.success('企业激活码已轮换')
  } finally {
    activationCodeLoading.value = false
  }
}

async function handleDisableActivationCode(): Promise<void> {
  if (!access.value.canManageEnterpriseActivationCodes) {
    return
  }

  try {
    await ElMessageBox.confirm('确认停用当前企业激活码吗？停用后设备将无法继续使用该码完成绑定。', '停用企业激活码', {
      type: 'warning',
      confirmButtonText: '确认停用',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  activationCodeLoading.value = true

  try {
    activationCode.value = await disableOrgEnterpriseActivationCode()
    ElMessage.success('企业激活码已停用')
  } finally {
    activationCodeLoading.value = false
  }
}

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toLocaleString()
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader
      eyebrow="Organization"
      title="我的企业"
      subtitle="企业域仅查看本企业资料，激活码也收口到本页，不再复用平台企业列表入口。"
    >
      <template #actions>
        <el-button :loading="loading" @click="fetchProfile">刷新资料</el-button>
      </template>
    </WorkspacePageHeader>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />

    <PageSectionCard title="企业资料" description="展示当前登录企业的基础资料，不包含其他企业信息。">
      <el-skeleton :loading="loading" animated :rows="6">
        <template #default>
          <el-empty v-if="!profile" description="未获取到企业资料" />
          <el-descriptions v-else :column="2" border>
            <el-descriptions-item label="企业 ID">{{ profile.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="profile.enabled ? 'success' : 'info'">
                {{ profile.enabled ? '启用中' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="企业编码">{{ profile.code }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ profile.name }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ profile.contactName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系方式">{{ profile.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(profile.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(profile.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ profile.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-skeleton>
    </PageSectionCard>

    <PageSectionCard
      v-if="access.canViewEnterpriseActivationCodes"
      title="企业激活码"
      description="企业业务侧激活码仅在本企业资料页查看和维护。"
    >
      <EnterpriseActivationCodePanel
        :loading="activationCodeLoading"
        :data="activationCode"
        :can-manage="access.canManageEnterpriseActivationCodes"
        @rotate="handleRotateActivationCode"
        @disable="handleDisableActivationCode"
      />
    </PageSectionCard>
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.head-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 900px) {
  .head-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
