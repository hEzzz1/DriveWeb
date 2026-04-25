<script setup lang="ts">
defineProps<{
  visible: boolean
  loading?: boolean
  title: string
  content: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <el-dialog :model-value="visible" width="460px" :title="title" @close="emit('update:visible', false)">
    <p class="confirm-text">{{ content }}</p>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="emit('confirm')">确认</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.confirm-text {
  margin: 0;
  line-height: 1.7;
  color: var(--text-main);
}
</style>
