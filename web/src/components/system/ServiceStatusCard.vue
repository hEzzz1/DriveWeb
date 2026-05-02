<script setup lang="ts">
import { serviceStatusLabelMap, type ServiceStatusItem } from '../../types/system'
import { formatDateTime } from '../../utils/time'

defineProps<{
  items: ServiceStatusItem[]
}>()
</script>

<template>
  <el-card class="status-card" shadow="never">
    <p class="card-label">服务状态</p>
    <el-empty v-if="!items.length" description="暂无服务状态" />
    <div v-else class="list-wrap">
      <div v-for="item in items" :key="item.service" class="list-item">
        <div>
          <strong>{{ item.service }}</strong>
          <p>{{ item.description || '无补充说明' }}</p>
        </div>
        <div class="status-meta">
          <el-tag effect="plain" :type="item.status === 'UP' ? 'success' : item.status === 'UNKNOWN' ? 'warning' : 'danger'">
            {{ serviceStatusLabelMap[item.status] || item.status }}
          </el-tag>
          <span>{{ formatDateTime(item.lastCheckedAt) }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.list-wrap {
  display: grid;
  gap: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fbfb;
}

.list-item p,
.status-meta span {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.status-meta {
  text-align: right;
}
</style>
