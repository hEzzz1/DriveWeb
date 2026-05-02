<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { formatRoleLabel, formatScopeLabel, roleDescriptionMap } from '../access/auth-model'

const authStore = useAuthStore()
authStore.hydrate()

const roles = computed(() => authStore.displayRoles)
const platformRoles = computed(() => authStore.platformRoles)
const memberships = computed(() => authStore.memberships)

const expireInfo = computed(() => {
  if (authStore.minutesLeft === null) {
    return '过期时间不可用'
  }

  if ((authStore.minutesLeft ?? -1) < 0) {
    return '登录会话已过期，请重新登录'
  }

  return `剩余 ${(authStore.minutesLeft ?? 0).toString()} 分钟`
})

const workspaceLabel = computed(() => {
  if (authStore.workspaceDomain === 'platform') {
    return '平台域'
  }

  if (authStore.workspaceDomain === 'org') {
    return '企业域'
  }

  return '未识别'
})

const sessionStatusText = computed(() => {
  if (!authStore.isAuthenticated) {
    return '未登录'
  }

  if (authStore.willExpireSoon) {
    return '待续期'
  }

  return '正常'
})

const capabilityTags = computed(() => {
  const permissions = new Set(authStore.permissions)
  const tags: string[] = []

  if (permissions.has('overview.read') || permissions.has('alert.read')) {
    tags.push('总览与告警查看')
  }

  if (permissions.has('alert.handle')) {
    tags.push('告警处置')
  }

  if (permissions.has('stats.read')) {
    tags.push('统计分析')
  }

  if (permissions.has('user.read') || permissions.has('user.manage')) {
    tags.push('用户与组织管理')
  }

  if (
    permissions.has('enterprise.read') ||
    permissions.has('enterprise.manage') ||
    permissions.has('activation_code.read') ||
    permissions.has('activation_code.manage')
  ) {
    tags.push('企业资料与激活码')
  }

  if (
    permissions.has('fleet.read') ||
    permissions.has('fleet.manage') ||
    permissions.has('driver.read') ||
    permissions.has('driver.manage') ||
    permissions.has('vehicle.read') ||
    permissions.has('vehicle.manage') ||
    permissions.has('device.read') ||
    permissions.has('device.manage')
  ) {
    tags.push('车辆与设备资源')
  }

  if (permissions.has('session.read') || permissions.has('session.force_sign_out')) {
    tags.push('会话巡检')
  }

  if (permissions.has('rule.read') || permissions.has('rule.manage')) {
    tags.push('规则治理')
  }

  if (permissions.has('audit.read') || permissions.has('audit.export')) {
    tags.push('审计与导出')
  }

  if (permissions.has('system.read')) {
    tags.push('系统运维')
  }

  return tags
})

const overviewItems = computed(() => [
  { label: '当前工作域', value: workspaceLabel.value },
  { label: '平台角色数', value: String(platformRoles.value.length) },
  { label: '业务归属数', value: String(memberships.value.length) },
  { label: '能力分类数', value: String(capabilityTags.value.length) },
])
</script>

<template>
  <div class="status-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Account</p>
        <h1>账号与安全</h1>
        <p class="subhead">查看当前登录状态、访问范围和能力概览，不展示令牌、请求头或内部接口信息。</p>
      </div>
    </div>

    <el-alert
      v-if="authStore.willExpireSoon"
      class="expire-alert"
      type="warning"
      :closable="false"
      title="登录会话即将过期，请尽快重新登录续期"
      :description="expireInfo"
    />

    <section class="cards">
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">会话信息</div>
        </template>
        <p><span>当前用户</span>{{ authStore.username || '-' }}</p>
        <p><span>昵称</span>{{ authStore.nickname || '-' }}</p>
        <p><span>角色</span>{{ authStore.roleText }}</p>
        <p><span>所属企业</span>{{ authStore.enterpriseName || '-' }}</p>
        <p><span>默认范围</span>{{ authStore.scopeText }}</p>
        <p><span>账号状态</span>{{ authStore.enabled ? '启用中' : '已禁用' }}</p>
        <p><span>会话状态</span>{{ sessionStatusText }}</p>
        <p><span>过期时间</span>{{ authStore.expireAtText }}</p>
        <p><span>剩余时长</span>{{ expireInfo }}</p>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">访问概览</div>
        </template>

        <div class="overview-grid">
          <article v-for="item in overviewItems" :key="item.label" class="overview-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>

        <p class="safety-note">
          成熟后台默认隐藏 Bearer Token、接口地址、原始权限码和其他仅用于调试的技术细节。
        </p>
      </el-card>
    </section>

    <el-card class="role-card" shadow="never">
      <template #header>
        <div class="card-title">角色职责</div>
      </template>

      <div class="role-list">
        <div v-for="role in roles" :key="role" class="role-item">
          <el-tag effect="dark" type="success">{{ formatRoleLabel(role) }}</el-tag>
          <p>{{ roleDescriptionMap[role] }}</p>
        </div>

        <p v-if="roles.length === 0" class="empty-text">未获取到角色信息。</p>
      </div>
    </el-card>

    <section class="cards secondary">
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">业务归属</div>
        </template>

        <div v-if="memberships.length" class="membership-list">
          <div
            v-for="item in memberships"
            :key="`${item.role}-${item.scopeType}-${item.enterpriseId ?? 'na'}-${item.fleetId ?? 'na'}`"
            class="membership-item"
          >
            <el-tag effect="plain">{{ formatRoleLabel(item.role) }}</el-tag>
            <span>{{ formatScopeLabel(item) }}</span>
          </div>
        </div>

        <p v-else class="empty-text">未返回业务归属，当前账号可能仅配置了平台级角色。</p>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">能力概览</div>
        </template>

        <div class="permission-list">
          <el-tag v-for="tag in capabilityTags" :key="tag" effect="plain" type="info">
            {{ tag }}
          </el-tag>
        </div>

        <p v-if="!capabilityTags.length" class="empty-text">当前账号未获取到明确的业务能力分类。</p>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.status-page {
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 36px 28px 42px;
  animation: reveal 0.45s ease-out;
}

.page-head {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 700;
  font-size: 12px;
  color: #0f755f;
}

h1 {
  margin: 10px 0 8px;
  font-size: 30px;
  line-height: 1.25;
  color: #12363f;
}

.subhead {
  margin: 0;
  color: #58737b;
}

.expire-alert {
  margin-bottom: 20px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.cards.secondary {
  margin-top: 16px;
}

.info-card,
.role-card {
  border-radius: 16px;
  border: 1px solid #d7e5e2;
  background: rgba(255, 255, 255, 0.88);
}

.card-title {
  font-weight: 700;
  color: #184148;
}

.info-card p {
  margin: 0 0 10px;
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: baseline;
  gap: 8px;
  color: #2c5058;
}

.info-card p span {
  color: #6a858c;
  font-size: 13px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.overview-item {
  padding: 12px;
  border: 1px solid #e2ecea;
  border-radius: 12px;
  background: #f7fbfa;
}

.overview-item span {
  display: block;
  color: #6a858c;
  font-size: 12px;
}

.overview-item strong {
  display: block;
  margin-top: 6px;
  color: #184148;
  font-size: 18px;
  font-weight: 700;
}

.safety-note {
  margin-top: 14px;
  color: #58737b;
  line-height: 1.6;
}

.role-list {
  display: grid;
  gap: 12px;
}

.role-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e2ecea;
  border-radius: 10px;
  background: #f7fbfa;
}

.role-item p {
  margin: 0;
  color: #355a61;
}

.empty-text {
  margin: 0;
  color: #5f7b82;
}

.membership-list,
.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.membership-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f7fbfa;
  color: #355a61;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 880px) {
  .status-page {
    padding: 24px 18px 28px;
  }

  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
