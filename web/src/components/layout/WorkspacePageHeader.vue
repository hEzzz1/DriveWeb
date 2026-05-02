<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="workspace-page-header">
    <div class="header-main">
      <p v-if="eyebrow" class="header-eyebrow">{{ eyebrow }}</p>
      <div class="header-title-row">
        <h1>{{ title }}</h1>
        <slot name="meta" />
      </div>
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.workspace-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border: 1px solid rgba(5, 5, 5, 0.06);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(22, 119, 255, 0.06), rgba(255, 255, 255, 0) 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 255, 0.94));
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.header-main {
  min-width: 0;
}

.header-eyebrow {
  margin: 0 0 10px;
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-title-row h1 {
  margin: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-subtitle {
  max-width: 960px;
  margin: 10px 0 0;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  min-height: 44px;
}

@media (max-width: 900px) {
  .workspace-page-header {
    padding: 20px;
  }

  .header-title-row h1 {
    font-size: 24px;
  }
}

@media (max-width: 720px) {
  .workspace-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-title-row h1 {
    white-space: normal;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
