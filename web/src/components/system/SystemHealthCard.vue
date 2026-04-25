<script setup lang="ts">
import { healthLevelLabelMap, type SystemHealthSnapshot } from '../../types/system'

defineProps<{
  data?: SystemHealthSnapshot | null
}>()
</script>

<template>
  <el-card class="status-card" shadow="never">
    <p class="card-label">系统健康</p>
    <strong>{{ data ? healthLevelLabelMap[data.status] || data.status : '-' }}</strong>
    <p>{{ data ? '健康信息来自后端 Actuator 聚合结果。' : '暂无健康信息' }}</p>
    <span>组件数量：{{ data ? Object.keys(data.details || {}).length : 0 }}</span>
    <span>数据库状态：{{ String(data?.details?.db ?? '-') }}</span>
  </el-card>
</template>
