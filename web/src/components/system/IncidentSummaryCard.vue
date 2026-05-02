<script setup lang="ts">
import type { SystemSummarySnapshot } from '../../types/system'
import { formatDateTime } from '../../utils/time'

defineProps<{
  summary?: SystemSummarySnapshot | null
}>()
</script>

<template>
  <el-card class="status-card" shadow="never">
    <p class="card-label">系统摘要</p>
    <el-empty v-if="!summary" description="暂无系统摘要" />
    <div v-else class="summary-list">
      <div class="summary-item">
        <strong>汇总时间</strong>
        <p>{{ formatDateTime(summary.generatedAt) }}</p>
      </div>
      <div class="summary-item">
        <strong>健康状态</strong>
        <p>{{ summary.health?.status || '-' }}</p>
      </div>
      <div class="summary-item">
        <strong>服务数量</strong>
        <p>{{ summary.services?.items?.length || 0 }}</p>
      </div>
      <div class="summary-item">
        <strong>24 小时告警</strong>
        <p>{{ summary.monitoring?.alertCount24h ?? 0 }}</p>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.summary-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fbfb;
}

.summary-item p {
  margin: 6px 0 0;
  color: var(--text-soft);
}
</style>
