<script setup lang="ts">
import type { VersionInfoItem } from '../../types/system'
import { formatDateTime } from '../../utils/time'

defineProps<{
  item?: VersionInfoItem | null
}>()
</script>

<template>
  <el-card class="status-card" shadow="never">
    <p class="card-label">版本信息</p>
    <el-empty v-if="!item" description="暂无版本信息" />
    <div v-else class="list-wrap">
      <div class="list-item">
        <div>
          <strong>{{ item.applicationName || '检测服务' }}</strong>
          <p>Git Commit：{{ item.gitCommit || '-' }}</p>
        </div>
        <div class="status-meta">
          <span>{{ item.version || '-' }}</span>
          <p>{{ formatDateTime(item.buildTime) }}</p>
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
  background: var(--panel-bg-soft);
}

.list-item p,
.status-meta p {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.status-meta {
  text-align: right;
}
</style>
