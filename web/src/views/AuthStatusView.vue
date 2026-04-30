<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { formatRoleLabel, formatScopeLabel, permissionLabelMap, roleDescriptionMap } from '../access/auth-model'

const authStore = useAuthStore()
authStore.hydrate()

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const roles = computed(() => authStore.displayRoles)
const platformRoles = computed(() => authStore.platformRoles)
const memberships = computed(() => authStore.memberships)
const permissions = computed(() => [...authStore.permissions].sort((left, right) => left.localeCompare(right)))
const maskedToken = computed(() => {
  const source = authStore.token

  if (!source) {
    return '-'
  }

  if (source.length <= 24) {
    return source
  }

  return `${source.slice(0, 12)}...${source.slice(-12)}`
})

const expireInfo = computed(() => {
  if (authStore.minutesLeft === null) {
    return '过期时间不可用'
  }

  if ((authStore.minutesLeft ?? -1) < 0) {
    return 'Token 已过期，请重新登录'
  }

  return `剩余 ${(authStore.minutesLeft ?? 0).toString()} 分钟`
})
</script>

<template>
  <div class="status-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Authentication</p>
        <h1>登录会话与鉴权状态</h1>
        <p class="subhead">展示风控运营管理台当前登录会话、令牌状态与角色权限映射。</p>
      </div>
    </div>

    <el-alert
      v-if="authStore.willExpireSoon"
      class="expire-alert"
      type="warning"
      :closable="false"
      title="Token 即将过期，请尽快重新登录续期"
      :description="expireInfo"
    />

    <section class="cards">
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">会话信息</div>
        </template>
        <p><span>当前用户</span>{{ authStore.username || '-' }}</p>
        <p><span>昵称</span>{{ authStore.nickname || '-' }}</p>
        <p><span>用户 ID</span>{{ authStore.userId ?? '-' }}</p>
        <p><span>角色</span>{{ authStore.roleText }}</p>
        <p><span>平台角色</span>{{ platformRoles.length ? platformRoles.map((role) => formatRoleLabel(role)).join(' / ') : '-' }}</p>
        <p><span>所属企业</span>{{ authStore.enterpriseName || authStore.enterpriseId || '-' }}</p>
        <p><span>默认范围</span>{{ authStore.scopeText }}</p>
        <p><span>主体类型</span>{{ authStore.subjectType || '-' }}</p>
        <p><span>账号状态</span>{{ authStore.enabled ? '启用中' : '已禁用' }}</p>
        <p><span>过期时间</span>{{ authStore.expireAtText }}</p>
        <p><span>剩余时长</span>{{ expireInfo }}</p>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">鉴权请求头</div>
        </template>
        <p class="mono">Base URL: {{ apiBaseURL }}</p>
        <p class="mono">Authorization: Bearer {{ maskedToken }}</p>
      </el-card>
    </section>

    <el-card class="role-card" shadow="never">
      <template #header>
        <div class="card-title">角色模板</div>
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
          <div v-for="item in memberships" :key="`${item.role}-${item.scopeType}-${item.enterpriseId ?? 'na'}-${item.fleetId ?? 'na'}`" class="membership-item">
            <el-tag effect="plain">{{ formatRoleLabel(item.role) }}</el-tag>
            <span>{{ formatScopeLabel(item) }}</span>
          </div>
        </div>

        <p v-else class="empty-text">未返回业务归属，当前账号可能仅配置了平台级角色。</p>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-title">权限点</div>
        </template>

        <div class="permission-list">
          <el-tag v-for="permission in permissions" :key="permission" effect="plain" type="info">
            {{ permissionLabelMap[permission] || permission }}
          </el-tag>
        </div>

        <p v-if="!permissions.length" class="empty-text">未获取到权限点列表。</p>
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

.mono {
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13px;
  word-break: break-all;
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
  }

  h1 {
    font-size: 26px;
  }

  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
