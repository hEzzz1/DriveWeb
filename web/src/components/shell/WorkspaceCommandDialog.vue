<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { WorkspaceCommandItem } from '../../types/workspace'

interface GroupedCommandItems {
  key: string
  label: string
  items: Array<WorkspaceCommandItem & { flatIndex: number }>
}

const props = defineProps<{
  modelValue: boolean
  query: string
  items: WorkspaceCommandItem[]
  activeIndex: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:query': [value: string]
  select: [item: WorkspaceCommandItem]
}>()

const inputRef = ref<{ focus: () => void } | null>(null)

const groupedItems = computed<GroupedCommandItems[]>(() => {
  const groups = new Map<string, GroupedCommandItems>()

  props.items.forEach((item, index) => {
    const existing = groups.get(item.group)

    if (existing) {
      existing.items.push({ ...item, flatIndex: index })
      return
    }

    groups.set(item.group, {
      key: item.group,
      label: item.groupLabel,
      items: [{ ...item, flatIndex: index }],
    })
  })

  return [...groups.values()]
})

watch(
  () => props.modelValue,
  async (value) => {
    if (!value) {
      return
    }

    await nextTick()
    inputRef.value?.focus()
  },
)

function handleDialogVisibility(value: boolean): void {
  emit('update:modelValue', value)
}

function handleQueryChange(value: string | number): void {
  emit('update:query', String(value || ''))
}

function handleSelect(item: WorkspaceCommandItem): void {
  emit('select', item)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="720px"
    top="10vh"
    append-to-body
    destroy-on-close
    class="command-dialog"
    @update:model-value="handleDialogVisibility"
  >
    <template #header>
      <div class="dialog-head">
        <div>
          <strong>全局检索与命令</strong>
          <p>输入模块名、描述、告警编号，或直接执行常用动作。</p>
        </div>

        <span class="dialog-hint">⌘K / Ctrl+K</span>
      </div>
    </template>

    <div class="command-body">
      <el-input
        ref="inputRef"
        :model-value="query"
        placeholder="搜索页面、收藏、告警或命令"
        clearable
        size="large"
        @update:model-value="handleQueryChange"
      />

      <div v-if="groupedItems.length" class="command-groups">
        <section v-for="group in groupedItems" :key="group.key" class="command-group">
          <div class="group-label">{{ group.label }}</div>

          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="command-item"
            :class="{ active: item.flatIndex === activeIndex }"
            @click="handleSelect(item)"
          >
            <div class="command-copy">
              <div class="command-title">
                <strong>{{ item.label }}</strong>
                <span v-if="item.pinned" class="command-tag">已收藏</span>
              </div>
              <p>{{ item.description }}</p>
            </div>

            <div class="command-meta">
              <span v-if="item.badge" class="command-badge">{{ item.badge }}</span>
              <span v-if="item.hint" class="command-hint">{{ item.hint }}</span>
            </div>
          </button>
        </section>
      </div>

      <el-empty
        v-else
        description="没有匹配结果，可尝试输入页面名称、模块关键词或告警编号。"
      />
    </div>
  </el-dialog>
</template>

<style scoped>
.dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dialog-head strong {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.dialog-head p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.dialog-hint {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid #dbe3f0;
  border-radius: 999px;
  background: #f8fbff;
  color: #5b6475;
  font-size: 12px;
  font-weight: 600;
}

.command-body {
  display: grid;
  gap: 16px;
}

.command-groups {
  display: grid;
  gap: 16px;
  max-height: 60vh;
  overflow: auto;
  padding-right: 4px;
}

.command-group {
  display: grid;
  gap: 8px;
}

.group-label {
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.command-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e4e7ec;
  border-radius: 14px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.command-item:hover,
.command-item.active {
  border-color: #8cb8ff;
  background: #f7fbff;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.08);
  transform: translateY(-1px);
}

.command-copy {
  min-width: 0;
}

.command-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.command-title strong {
  color: #111827;
  font-size: 14px;
  font-weight: 600;
}

.command-copy p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.45;
}

.command-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.command-badge,
.command-tag,
.command-hint {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.command-badge {
  min-width: 28px;
  justify-content: center;
  padding: 5px 9px;
  background: #eef4ff;
  color: #2f5fc4;
}

.command-tag {
  padding: 4px 8px;
  background: #edfdf5;
  color: #027a48;
}

.command-hint {
  padding: 4px 8px;
  border: 1px solid #d0d5dd;
  color: #667085;
}

@media (max-width: 760px) {
  .dialog-head {
    flex-direction: column;
  }

  .command-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .command-meta {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
