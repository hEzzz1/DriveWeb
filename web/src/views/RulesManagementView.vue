<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import RuleActionConfirmDialog from '../components/rules/RuleActionConfirmDialog.vue'
import RuleEditDialog from '../components/rules/RuleEditDialog.vue'
import RuleFilterBar from '../components/rules/RuleFilterBar.vue'
import RuleListTable from '../components/rules/RuleListTable.vue'
import RuleVersionDrawer from '../components/rules/RuleVersionDrawer.vue'
import {
  getRuleDetail,
  getRuleList,
  getRuleVersionHistory,
  publishRule,
  rollbackRule,
  saveRule,
  toggleRuleStatus,
} from '../api/rules'
import { useAuthStore } from '../stores/auth'
import type {
  RuleActionType,
  RuleDetail,
  RuleFormPayload,
  RuleListQuery,
  RuleSummary,
  RuleVersionSummary,
} from '../types/rules'

const authStore = useAuthStore()
const loading = ref(false)
const submitLoading = ref(false)
const versionLoading = ref(false)
const actionLoading = ref(false)
const errorText = ref('')
const items = ref<RuleSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const lastRefreshAt = ref('')
const editVisible = ref(false)
const versionVisible = ref(false)
const actionVisible = ref(false)
const activeRule = ref<RuleDetail | null>(null)
const versionList = ref<RuleVersionSummary[]>([])
const actionType = ref<RuleActionType>('PUBLISH')
const rollbackVersion = ref<RuleVersionSummary | null>(null)

const filters = reactive<RuleListQuery>({
  keyword: '',
  type: undefined,
  status: undefined,
  version: '',
  scopeType: undefined,
})

const summaryItems = computed(() => [
  {
    label: '规则总数',
    value: total.value,
  },
  {
    label: '启用中',
    value: items.value.filter((item) => item.status === 'ENABLED').length,
  },
  {
    label: '最近刷新',
    value: lastRefreshAt.value || '-',
  },
])

const actionDialogTitle = computed(() => {
  const titleMap: Record<RuleActionType, string> = {
    ENABLE: '确认启用规则',
    DISABLE: '确认停用规则',
    PUBLISH: '确认发布规则',
    ROLLBACK: '确认回滚规则',
  }

  return titleMap[actionType.value]
})

const actionDialogContent = computed(() => {
  if (!activeRule.value) {
    return ''
  }

  if (actionType.value === 'ROLLBACK' && rollbackVersion.value) {
    return `将规则「${activeRule.value.name}」回滚到版本 ${rollbackVersion.value.version}。`
  }

  const textMap: Record<Exclude<RuleActionType, 'ROLLBACK'>, string> = {
    ENABLE: '启用后将按最新已保存配置生效。',
    DISABLE: '停用后将停止该规则的触发与执行。',
    PUBLISH: '发布后将以当前配置作为线上生效版本。',
  }

  return `规则「${activeRule.value.name}」${textMap[actionType.value as Exclude<RuleActionType, 'ROLLBACK'>]}`
})
const canManageRules = computed(() => authStore.canManageRules())

onMounted(async () => {
  await fetchList()
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getRuleList({
      ...filters,
      page: currentPage.value,
      size: pageSize.value,
    })
    items.value = Array.isArray(data.items) ? data.items : []
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
    lastRefreshAt.value = new Date().toLocaleString()
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '规则列表加载失败'
  } finally {
    loading.value = false
  }
}

async function openCreateDialog(): Promise<void> {
  if (!canManageRules.value) {
    return
  }

  activeRule.value = null
  editVisible.value = true
}

async function openEditDialog(row: RuleSummary): Promise<void> {
  if (!canManageRules.value) {
    return
  }

  submitLoading.value = true

  try {
    activeRule.value = await getRuleDetail(row.id)
    editVisible.value = true
  } finally {
    submitLoading.value = false
  }
}

async function handleSaveRule(payload: RuleFormPayload): Promise<void> {
  submitLoading.value = true

  try {
    await saveRule(payload)
    ElMessage.success('规则已保存')
    editVisible.value = false
    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleOpenVersions(row: RuleSummary): Promise<void> {
  versionVisible.value = true
  versionLoading.value = true
  activeRule.value = await getRuleDetail(row.id)

  try {
    versionList.value = await getRuleVersionHistory(row.id)
  } finally {
    versionLoading.value = false
  }
}

function handleToggle(row: RuleSummary): void {
  if (!canManageRules.value) {
    return
  }

  activeRule.value = row as RuleDetail
  actionType.value = row.status === 'ENABLED' ? 'DISABLE' : 'ENABLE'
  rollbackVersion.value = null
  actionVisible.value = true
}

function handlePublish(row: RuleSummary): void {
  if (!canManageRules.value) {
    return
  }

  activeRule.value = row as RuleDetail
  actionType.value = 'PUBLISH'
  rollbackVersion.value = null
  actionVisible.value = true
}

function handleRollback(version: RuleVersionSummary): void {
  if (!canManageRules.value) {
    return
  }

  actionType.value = 'ROLLBACK'
  rollbackVersion.value = version
  actionVisible.value = true
}

async function handleConfirmAction(): Promise<void> {
  if (!activeRule.value) {
    return
  }

  actionLoading.value = true

  try {
    if (actionType.value === 'ENABLE' || actionType.value === 'DISABLE') {
      await toggleRuleStatus(activeRule.value.id, actionType.value === 'ENABLE')
    } else if (actionType.value === 'PUBLISH') {
      await publishRule(activeRule.value.id)
    } else if (rollbackVersion.value) {
      await rollbackRule(activeRule.value.id, {
        targetVersion: rollbackVersion.value.version,
      })
      versionVisible.value = false
    }

    ElMessage.success('操作已提交')
    actionVisible.value = false
    await fetchList()
  } finally {
    actionLoading.value = false
  }
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filters.keyword = ''
  filters.type = undefined
  filters.status = undefined
  filters.version = ''
  filters.scopeType = undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function handlePageChange(page: number): Promise<void> {
  currentPage.value = page
  await fetchList()
}

async function handleSizeChange(size: number): Promise<void> {
  pageSize.value = size
  currentPage.value = 1
  await fetchList()
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Rules</p>
        <h1>规则管理</h1>
        <p class="subhead">统一管理规则筛选、参数编辑、启停、发布与版本回滚。</p>
      </div>
    </div>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="规则筛选" description="按规则名称、类型、状态、版本和生效范围快速定位。">
      <RuleFilterBar
        v-model="filters"
        :can-manage="canManageRules"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
        @create="openCreateDialog"
      />
    </PageSectionCard>

    <PageSectionCard title="规则列表" description="支持编辑、启停、发布和查看版本历史。">
      <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />
      <RuleListTable
        :can-manage="canManageRules"
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        @edit="openEditDialog"
        @toggle="handleToggle"
        @publish="handlePublish"
        @versions="handleOpenVersions"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </PageSectionCard>

    <RuleEditDialog
      v-model:visible="editVisible"
      :loading="submitLoading"
      :detail="activeRule"
      @submit="handleSaveRule"
    />
    <RuleVersionDrawer
      v-model:visible="versionVisible"
      :can-rollback="canManageRules"
      :loading="versionLoading"
      :versions="versionList"
      :active-rule="activeRule"
      @rollback="handleRollback"
    />
    <RuleActionConfirmDialog
      v-model:visible="actionVisible"
      :loading="actionLoading"
      :title="actionDialogTitle"
      :content="actionDialogContent"
      @confirm="handleConfirmAction"
    />
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}
</style>
