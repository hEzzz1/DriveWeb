<script setup lang="ts">
import { computed } from 'vue'
import {
  ruleVersionStatusLabelMap,
  type RuleSummary,
  type RuleVersionSummary,
} from '../../types/rules'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  versions: RuleVersionSummary[]
  activeRule?: RuleSummary | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  rollback: [version: RuleVersionSummary]
}>()

const timelineItems = computed(() => [...props.versions])
</script>

<template>
  <el-drawer
    :model-value="visible"
    size="560px"
    title="版本历史"
    @close="emit('update:visible', false)"
  >
    <div class="drawer-head">
      <h3>{{ activeRule?.name || '规则版本' }}</h3>
      <p>当前版本：{{ activeRule?.currentVersion || '-' }}</p>
    </div>

    <el-skeleton :loading="loading" animated :rows="5">
      <template #default>
        <el-empty v-if="!timelineItems.length" description="暂无版本历史" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="item in timelineItems"
            :key="item.id"
            :timestamp="item.createdAt"
            placement="top"
          >
            <div class="version-card">
              <div class="version-row">
                <strong>{{ item.version }}</strong>
                <el-tag effect="plain">{{ ruleVersionStatusLabelMap[item.status] || item.status }}</el-tag>
              </div>
              <p>{{ item.changeSummary || '无变更摘要' }}</p>
              <p>创建人：{{ item.createdBy }}</p>
              <p v-if="item.publishedAt">发布时间：{{ item.publishedAt }}</p>
              <el-button link type="primary" @click="emit('rollback', item)">回滚到此版本</el-button>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-skeleton>
  </el-drawer>
</template>

<style scoped>
.drawer-head {
  margin-bottom: 16px;
}

.drawer-head h3,
.version-row strong {
  margin: 0;
}

.drawer-head p,
.version-card p {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.version-card {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #f9fcfb;
}

.version-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
