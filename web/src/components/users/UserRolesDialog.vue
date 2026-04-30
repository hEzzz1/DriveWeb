<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserRole } from '../../types/api'
import { roleLabelMap } from '../../access/auth-model'
import RolePermissionGuide from './RolePermissionGuide.vue'
import type { RoleOptionItem } from '../../types/users'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  roleOptions: RoleOptionItem[]
  modelValue: UserRole[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [roles: UserRole[]]
}>()

const selectedRoles = ref<UserRole[]>([])

watch(
  () => [props.visible, props.modelValue] as const,
  ([visible, modelValue]) => {
    if (visible) {
      selectedRoles.value = [...modelValue]
    }
  },
  { immediate: true },
)
</script>

<template>
  <el-dialog :model-value="visible" width="760px" title="分配角色" @close="emit('update:visible', false)">
    <el-select
      v-model="selectedRoles"
      class="full-width"
      multiple
      filterable
      clearable
      collapse-tags
      collapse-tags-tooltip
      placeholder="请选择角色"
    >
      <el-option
        v-for="item in roleOptions"
        :key="item.roleCode"
        :label="item.roleName || roleLabelMap[item.roleCode]"
        :value="item.roleCode"
      >
        <div class="role-option">
          <span>{{ item.roleName || roleLabelMap[item.roleCode] }}</span>
          <span class="role-option-code">{{ item.roleCode }}</span>
        </div>
      </el-option>
    </el-select>
    <RolePermissionGuide :role-options="roleOptions" :selected-roles="selectedRoles" />
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="emit('save', selectedRoles)">保存角色</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.full-width {
  width: 100%;
}

.role-option {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.role-option-code {
  color: var(--text-soft);
  font-size: 12px;
}
</style>
