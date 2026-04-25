<script setup lang="ts">
import type { AuditDetail } from '../../types/audit'

defineProps<{
  visible: boolean
  detail?: AuditDetail | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<template>
  <el-drawer :model-value="visible" size="620px" title="审计详情" @close="emit('update:visible', false)">
    <el-skeleton :loading="loading" animated :rows="8">
      <template #default>
        <el-empty v-if="!detail" description="暂无详情" />
        <div v-else class="detail-wrap">
          <section class="detail-block">
            <h3>基础信息</h3>
            <p>Trace ID：{{ detail.traceId }}</p>
            <p>操作类型：{{ detail.actionType }}</p>
            <p>操作人：{{ detail.operator }}</p>
            <p>对象：{{ detail.targetType }} / {{ detail.targetName }}</p>
            <p>结果：{{ detail.result }}</p>
            <p>时间：{{ detail.occurredAt }}</p>
            <p v-if="detail.description">说明：{{ detail.description }}</p>
          </section>

          <section class="detail-block">
            <h3>变更摘要</h3>
            <p>{{ detail.change.summary || '无摘要' }}</p>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="变更前">{{ detail.change.before || '-' }}</el-descriptions-item>
              <el-descriptions-item label="变更后">{{ detail.change.after || '-' }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-block">
            <h3>链路信息</h3>
            <p>请求 ID：{{ detail.linkInfo?.requestId || '-' }}</p>
            <p>消息 ID：{{ detail.linkInfo?.messageId || '-' }}</p>
            <p>WebSocket Session：{{ detail.linkInfo?.websocketSessionId || '-' }}</p>
            <p>链路延迟：{{ detail.linkInfo?.latencyMs ?? '-' }} ms</p>
            <p>下游状态：{{ detail.linkInfo?.downstreamStatus || '-' }}</p>
          </section>

          <section class="detail-block">
            <h3>关联对象</h3>
            <el-empty v-if="!detail.relatedObjects.length" description="暂无关联对象" />
            <el-tag
              v-for="item in detail.relatedObjects"
              :key="`${item.objectType}-${item.objectId}`"
              effect="plain"
              class="object-tag"
            >
              {{ item.objectType }} / {{ item.objectName }} / {{ item.version || '-' }}
            </el-tag>
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

.detail-block p {
  margin: 0 0 8px;
  color: var(--text-soft);
}

.object-tag {
  margin: 0 8px 8px 0;
}
</style>
