<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="workspace-page-header">
    <div class="header-main">
      <div class="header-title-row">
        <h1>{{ title }}</h1>
        <slot name="meta" />
      </div>
    </div>

    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.workspace-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 86px;
  padding: 20px 24px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-bg);
  box-shadow: var(--shadow-panel);
}

.header-main {
  min-width: 0;
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
  color: var(--text-main);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .workspace-page-header {
    padding: 20px;
  }

  .header-title-row h1 {
    font-size: 22px;
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
