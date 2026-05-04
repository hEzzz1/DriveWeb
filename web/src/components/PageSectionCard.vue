<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <el-card class="page-section-card" shadow="never">
    <template #header>
      <div class="section-head">
        <div>
          <h3>{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>
        <div v-if="$slots.actions" class="section-actions">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <slot />
  </el-card>
</template>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-main);
  font-weight: 700;
  line-height: 1.3;
}

.section-head p {
  margin: 8px 0 0;
  color: var(--text-faint);
  font-size: 13px;
  line-height: 1.6;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
