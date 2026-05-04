<script setup lang="ts">
import { computed } from 'vue'
import type { PermissionCode, UserRole } from '../../types/api'
import {
  formatRoleLabel,
  getRolePermissions,
  getRoleScopeHint,
  getRoleTagType,
  getRoleTypeLabel,
  permissionLabelMap,
  requiresEnterpriseForRoles,
  roleDescriptionMap,
  resolvePermissionsFromRoles,
} from '../../access/auth-model'
import type { RoleOptionItem } from '../../types/users'

interface RoleGuideItem {
  code: UserRole
  label: string
  typeLabel: string
  description: string
  scopeHint: string
  permissions: PermissionCode[]
  selected: boolean
}

const props = defineProps<{
  roleOptions: RoleOptionItem[]
  selectedRoles: UserRole[]
}>()

const roleGuideItems = computed<RoleGuideItem[]>(() =>
  props.roleOptions.map((item) => ({
    code: item.roleCode,
    label: item.roleName || formatRoleLabel(item.roleCode),
    typeLabel: getRoleTypeLabel(item.roleCode),
    description: roleDescriptionMap[item.roleCode],
    scopeHint: getRoleScopeHint(item.roleCode),
    permissions: getRolePermissions(item.roleCode),
    selected: props.selectedRoles.includes(item.roleCode),
  })),
)

const selectedPermissions = computed(() => resolvePermissionsFromRoles(props.selectedRoles))
const selectionHint = computed(() => {
  if (!props.selectedRoles.length) {
    return '请选择角色后查看默认权限并集和作用域要求。'
  }

  if (requiresEnterpriseForRoles(props.selectedRoles)) {
    return `当前组合默认授予 ${selectedPermissions.value.length} 个权限点，且包含业务角色，需要企业或车队归属。`
  }

  return `当前组合默认授予 ${selectedPermissions.value.length} 个权限点，仅包含平台角色，可不绑定企业。`
})
</script>

<template>
  <div class="guide-wrap">
    <div class="guide-summary">
      <p class="guide-title">角色说明</p>
      <p class="guide-subtitle">
        角色的最终权限按并集计算，菜单和按钮按权限点控制，数据可见范围再由平台级/企业级/车队级作用域决定。
      </p>
      <el-alert class="guide-alert" :closable="false" type="info" :title="selectionHint" show-icon />
    </div>

    <div v-if="selectedPermissions.length" class="selected-permissions">
      <span class="section-label">已选角色权限点</span>
      <div class="permission-tags">
        <el-tag v-for="permission in selectedPermissions" :key="permission" effect="plain" type="info">
          {{ permissionLabelMap[permission] || permission }}
        </el-tag>
      </div>
    </div>

    <div class="role-grid">
      <article
        v-for="item in roleGuideItems"
        :key="item.code"
        class="role-card"
        :class="{ selected: item.selected }"
      >
        <div class="role-card-head">
          <div class="role-card-title">
            <strong>{{ item.label }}</strong>
            <el-tag size="small" effect="plain" :type="getRoleTagType(item.code)">
              {{ item.typeLabel }}
            </el-tag>
          </div>
          <el-tag v-if="item.selected" size="small" type="primary">已选择</el-tag>
        </div>

        <p class="scope-hint">{{ item.scopeHint }}</p>
        <p class="role-description">{{ item.description }}</p>

        <div class="permission-block">
          <span class="section-label">默认权限 {{ item.permissions.length }} 项</span>
          <div class="permission-tags">
            <el-tag v-for="permission in item.permissions" :key="permission" effect="plain">
              {{ permissionLabelMap[permission] || permission }}
            </el-tag>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.guide-wrap {
  display: grid;
  gap: 14px;
  margin-top: 12px;
}

.guide-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #17363d;
}

.guide-subtitle {
  margin: 6px 0 0;
  color: #607b83;
  font-size: 13px;
  line-height: 1.6;
}

.guide-alert {
  margin-top: 10px;
}

.selected-permissions,
.permission-block {
  display: grid;
  gap: 8px;
}

.section-label {
  color: #6b8389;
  font-size: 12px;
  font-weight: 600;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-grid {
  display: grid;
  gap: 12px;
}

.role-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel-bg-soft);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.role-card.selected {
  border-color: rgba(64, 158, 255, 0.55);
  box-shadow: 0 10px 22px rgba(64, 158, 255, 0.12);
  transform: translateY(-1px);
  background: #ffffff;
}

.role-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.role-card-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.role-card-title strong {
  color: #20424a;
}

.scope-hint {
  margin: 0;
  color: #527078;
  font-size: 13px;
  line-height: 1.6;
}

.role-description {
  margin: 0;
  color: #385961;
  font-size: 13px;
  line-height: 1.6;
}
</style>
