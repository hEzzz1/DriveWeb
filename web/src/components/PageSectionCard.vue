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
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-head h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-main);
}

.section-head p {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 13px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
