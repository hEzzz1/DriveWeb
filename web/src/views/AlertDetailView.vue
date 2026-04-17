<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlertDetail } from '../api/alerts'
import { riskLevelLabelMap, statusLabelMap, type AlertDetail } from '../types/alerts'
import {
  extractAlertTimeline,
  formatDateTime,
  formatNumber,
  formatScore,
  getRiskTagType,
  getStatusTagType,
} from '../utils/alerts'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref<AlertDetail | null>(null)

const alertId = computed(() => {
  const value = route.params.id

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return ''
})

const timeline = computed(() => {
  return detail.value ? extractAlertTimeline(detail.value) : []
})

onMounted(() => {
  void fetchDetail()
})

watch(
  () => alertId.value,
  () => {
    void fetchDetail()
  },
)

async function fetchDetail(): Promise<void> {
  if (!alertId.value) {
    detail.value = null
    return
  }

  loading.value = true

  try {
    detail.value = await getAlertDetail(alertId.value)
  } finally {
    loading.value = false
  }
}

function handleBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push({
    name: 'alerts-list',
    query: route.query,
  })
}

function showValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}
</script>

<template>
  <div class="detail-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Alert Detail</p>
        <h1>告警详情</h1>
        <p class="subhead">查看单条告警上下文、风险指标与处置轨迹。</p>
      </div>

      <div class="head-actions">
        <el-button @click="handleBack">返回列表</el-button>
        <el-button :loading="loading" @click="fetchDetail">刷新</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading && !detail" :rows="8" animated />

    <template v-else-if="detail">
      <section class="card-grid">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">基本信息</div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="告警ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="告警编号">{{ detail.alertNo }}</el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskTagType(detail.riskLevel)">
                {{ riskLevelLabelMap[detail.riskLevel] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusTagType(detail.status)">{{ statusLabelMap[detail.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="触发时间" :span="2">
              {{ formatDateTime(detail.triggerTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-title">风险指标</div>
          </template>

          <div class="metrics-grid">
            <div class="metric-item">
              <span>fatigueScore</span>
              <strong>{{ formatScore(detail.fatigueScore) }}</strong>
            </div>
            <div class="metric-item">
              <span>distractionScore</span>
              <strong>{{ formatScore(detail.distractionScore) }}</strong>
            </div>
            <div class="metric-item">
              <span>perclos</span>
              <strong>{{ formatScore(detail.perclos) }}</strong>
            </div>
            <div class="metric-item">
              <span>blinkRate</span>
              <strong>{{ formatNumber(detail.blinkRate) }}</strong>
            </div>
            <div class="metric-item">
              <span>yawnCount</span>
              <strong>{{ showValue(detail.yawnCount) }}</strong>
            </div>
          </div>
        </el-card>
      </section>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">事件上下文</div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="车队">{{ detail.fleetId }}</el-descriptions-item>
          <el-descriptions-item label="车辆">{{ detail.vehicleId }}</el-descriptions-item>
          <el-descriptions-item label="司机">{{ detail.driverId }}</el-descriptions-item>
          <el-descriptions-item label="算法版本">{{ showValue(detail.algorithmVer) }}</el-descriptions-item>
          <el-descriptions-item label="头姿态">{{ showValue(detail.headPose) }}</el-descriptions-item>
          <el-descriptions-item label="事件时间">{{ formatDateTime(detail.eventTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">处置记录时间轴</div>
        </template>

        <el-empty v-if="timeline.length === 0" description="暂无处置记录" />

        <el-timeline v-else>
          <el-timeline-item
            v-for="(item, index) in timeline"
            :key="item.actionTime + '-' + index"
            :timestamp="formatDateTime(item.actionTime)"
          >
            <p class="timeline-action">{{ item.action }}</p>
            <p class="timeline-meta">操作人：{{ item.operator || '-' }}</p>
            <p v-if="item.remark" class="timeline-meta">备注：{{ item.remark }}</p>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <el-empty v-else description="未获取到告警详情" />
  </div>
</template>

<style scoped>
.detail-page {
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 26px 24px 34px;
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
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
  margin: 8px 0 6px;
  font-size: 30px;
  line-height: 1.25;
  color: #12363f;
}

.subhead {
  margin: 0;
  color: #58737b;
}

.head-actions {
  display: flex;
  gap: 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel-card {
  border-radius: 16px;
  border: 1px solid #d7e5e2;
  background: rgba(255, 255, 255, 0.9);
}

.card-title {
  font-weight: 700;
  color: #184148;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-item {
  border: 1px solid #dfebe7;
  border-radius: 12px;
  padding: 12px;
  background: #f7fbfa;
  display: grid;
  gap: 4px;
}

.metric-item span {
  font-size: 12px;
  color: #647f86;
}

.metric-item strong {
  font-size: 20px;
  color: #13414a;
}

.timeline-action {
  margin: 0 0 4px;
  font-weight: 700;
  color: #19454d;
}

.timeline-meta {
  margin: 0;
  color: #57737a;
  line-height: 1.5;
}

@media (max-width: 1080px) {
  .detail-page {
    padding: 22px 16px 26px;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
