<script setup lang="ts">
import { computed } from 'vue'
import type { AuditDetail } from '../../types/audit'
import { formatAuditModule, formatAuditResult, parseAuditDetailJson } from '../../utils/audit'

const props = defineProps<{
  visible: boolean
  detail?: AuditDetail | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const parsedDetail = computed(() => props.detail?.parsedDetail || parseAuditDetailJson(props.detail?.detailJson))

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toLocaleString()
}

function stringify(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>

<template>
  <el-drawer :model-value="visible" size="720px" title="审计详情" @close="emit('update:visible', false)">
    <el-skeleton :loading="loading" animated :rows="8">
      <template #default>
        <el-empty v-if="!detail" description="暂无详情" />
        <div v-else class="detail-wrap">
          <section class="detail-block">
            <h3>基础信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="审计 ID">{{ detail.id }}</el-descriptions-item>
              <el-descriptions-item label="Trace ID">{{ detail.traceId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="模块">{{ formatAuditModule(detail.module) }}</el-descriptions-item>
              <el-descriptions-item label="动作">{{ detail.actionType }}</el-descriptions-item>
              <el-descriptions-item label="操作人">{{ detail.operatorName }}</el-descriptions-item>
              <el-descriptions-item label="操作人 ID">{{ detail.operatorId }}</el-descriptions-item>
              <el-descriptions-item label="对象类型">{{ detail.actionTargetType }}</el-descriptions-item>
              <el-descriptions-item label="对象 ID">{{ detail.actionTargetId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="结果">{{ formatAuditResult(detail.actionResult) }}</el-descriptions-item>
              <el-descriptions-item label="说明">{{ detail.actionRemark || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发生时间">{{ formatDateTime(detail.actionTime) }}</el-descriptions-item>
              <el-descriptions-item label="入库时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="IP">{{ detail.ip || '-' }}</el-descriptions-item>
              <el-descriptions-item label="User-Agent">{{ detail.userAgent || '-' }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-block">
            <h3>解析明细</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="操作人角色">
                {{ stringify(parsedDetail && 'operatorRoles' in parsedDetail ? parsedDetail.operatorRoles : undefined) }}
              </el-descriptions-item>
              <el-descriptions-item label="操作人企业 ID">
                {{ stringify(parsedDetail && 'operatorEnterpriseId' in parsedDetail ? parsedDetail.operatorEnterpriseId : undefined) }}
              </el-descriptions-item>
              <el-descriptions-item label="变更前">
                <pre class="json-block">{{ stringify(parsedDetail && 'before' in parsedDetail ? parsedDetail.before : undefined) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item label="变更后">
                <pre class="json-block">{{ stringify(parsedDetail && 'after' in parsedDetail ? parsedDetail.after : undefined) }}</pre>
              </el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-block">
            <h3>原始明细</h3>
            <pre class="json-block">{{ stringify(detail.detailJson ? parsedDetail || detail.detailJson : undefined) }}</pre>
          </section>
        </div>
      </template>
    </el-skeleton>
  </el-drawer>
</template>

<style scoped>
.detail-wrap {
  display: grid;
  gap: 20px;
}

.detail-block h3 {
  margin: 0 0 10px;
}

.json-block {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-soft);
  font-size: 12px;
  line-height: 1.6;
}
</style>
