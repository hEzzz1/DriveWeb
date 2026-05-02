<script setup lang="ts">
import type { SystemMonitoringSnapshot } from '../../types/system'
import { formatDateTime } from '../../utils/time'

defineProps<{
  data?: SystemMonitoringSnapshot | null
}>()
</script>

<template>
  <el-card class="status-card" shadow="never">
    <p class="card-label">监控摘要</p>
    <strong>{{ data?.openAlertCount ?? 0 }}</strong>
    <p>当前打开告警数</p>
    <span>24 小时告警：{{ data?.alertCount24h ?? 0 }}</span>
    <span>24 小时审计：{{ data?.auditCount24h ?? 0 }}</span>
    <span>启用规则：{{ data?.enabledRuleCount ?? 0 }}</span>
    <span>平均风险分：{{ data?.averageRiskScore24h ?? '-' }}</span>
    <span>统计时间：{{ formatDateTime(data?.snapshotAt) }}</span>
  </el-card>
</template>
