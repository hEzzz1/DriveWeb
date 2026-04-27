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
  position: relative;
}

.section-head::before {
  content: '';
  position: absolute;
  left: 0;
  top: -4px;
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--brand), rgba(15, 95, 115, 0.65));
}

.section-head h3 {
  margin: 8px 0 0;
  font-size: 18px;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.section-head p {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 6px;
}
</style>
