<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import EChartPanel from '../components/EChartPanel.vue'
import { getStatsRanking } from '../api/stats'
import { riskLevelLabelMap, type AlertRiskLevel } from '../types/alerts'
import type {
  RankingData,
  RankingDimension,
  RankingItem,
  RankingQuery,
  RankingSortBy,
} from '../types/stats'
import {
  buildRankingSortValue,
  formatPercent,
  getDefaultStatsRange,
  parseDateRange,
  parseEnumQuery,
  parseOptionalRiskLevel,
  parsePositiveIntQuery,
  parseStringQuery,
  toFilterQuery,
  toIsoRange,
} from '../utils/stats'

interface FilterModel {
  fleetId: string
  riskLevel?: AlertRiskLevel
  dimension: RankingDimension
  sortBy: RankingSortBy
  limit: number
  timeRange: [Date, Date] | []
}

const route = useRoute()
const router = useRouter()

const filterModel = reactive<FilterModel>({
  fleetId: '',
  riskLevel: undefined,
  dimension: 'VEHICLE_ID',
  sortBy: 'ALERT_COUNT',
  limit: 10,
  timeRange: getDefaultStatsRange('DAY'),
})

const loading = ref(false)
const moduleError = ref('')
const rankingData = ref<RankingData | null>(null)

const riskOptions = [
  { label: riskLevelLabelMap[1], value: 1 as AlertRiskLevel },
  { label: riskLevelLabelMap[2], value: 2 as AlertRiskLevel },
  { label: riskLevelLabelMap[3], value: 3 as AlertRiskLevel },
]

const rankingItems = computed(() =>
  [...(rankingData.value?.items || [])].sort((left, right) => {
    const scoreGap = buildRankingSortValue(right, filterModel.sortBy) - buildRankingSortValue(left, filterModel.sortBy)

    if (scoreGap !== 0) {
      return scoreGap
    }

    return String(left.dimensionValue).localeCompare(String(right.dimensionValue))
  }),
)
const rankingEmpty = computed(() => rankingItems.value.length === 0)
const rankingPanelError = computed(() => (!rankingData.value ? moduleError.value : ''))
const barChartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: 16,
    right: 16,
    top: 16,
    bottom: 20,
    containLabel: true,
  },
  xAxis: {
    type: 'value',
  },
  yAxis: {
    type: 'category',
    data: rankingItems.value.map((item) => String(item.dimensionValue)),
  },
  color: ['#19856e'],
  series: [
    {
      type: 'bar',
      barMaxWidth: 22,
      data: rankingItems.value.map((item) => buildRankingSortValue(item, filterModel.sortBy)),
    },
  ],
}))
const summaryItems = computed(() => {
  const first = rankingItems.value[0]

  return [
    {
      label: 'Top 1 对象',
      value: first ? String(first.dimensionValue) : '-',
    },
    {
      label: 'Top 1 风险分',
      value: first ? formatPercent(first.avgRiskScore) : '-',
    },
    {
      label: '参与排行对象数',
      value: `${rankingData.value?.totalDimensionCount ?? 0}`,
    },
  ]
})

onMounted(async () => {
  hydrateFromRoute()
  await fetchRanking(false)
})

async function fetchRanking(syncRoute = true): Promise<void> {
  const query = buildRankingQuery()

  if (syncRoute) {
    syncRouteQuery(query)
  }

  loading.value = true

  try {
    if (query.sortBy === 'RECENT_ACTIVE_RISK_COUNT') {
      throw new Error('后端当前未提供最近活跃风险数排序能力')
    }

    rankingData.value = await getStatsRanking(query, { silentError: true })
    moduleError.value = ''
  } catch (error) {
    moduleError.value = error instanceof Error ? error.message : '排行数据加载失败'
  } finally {
    loading.value = false
  }
}

async function handleSearch(): Promise<void> {
  await fetchRanking(true)
}

async function handleReset(): Promise<void> {
  filterModel.fleetId = ''
  filterModel.riskLevel = undefined
  filterModel.dimension = 'VEHICLE_ID'
  filterModel.sortBy = 'ALERT_COUNT'
  filterModel.limit = 10
  filterModel.timeRange = getDefaultStatsRange('DAY')
  await fetchRanking(true)
}

function handleOpenAlerts(item: RankingItem): void {
  router.push({
    name: 'alerts-list',
    query: {
      fleetId: filterModel.fleetId || undefined,
      riskLevel: filterModel.riskLevel !== undefined ? String(filterModel.riskLevel) : undefined,
      vehicleId: filterModel.dimension === 'VEHICLE_ID' ? String(item.dimensionValue) : undefined,
      driverId: filterModel.dimension === 'DRIVER_ID' ? String(item.dimensionValue) : undefined,
      startTime: filterModel.timeRange.length === 2 ? filterModel.timeRange[0].toISOString() : undefined,
      endTime: filterModel.timeRange.length === 2 ? filterModel.timeRange[1].toISOString() : undefined,
      page: '1',
      size: '20',
    },
  })
}

function hydrateFromRoute(): void {
  filterModel.fleetId = parseStringQuery(route.query.fleetId)
  filterModel.riskLevel = parseOptionalRiskLevel(route.query.riskLevel)
  filterModel.dimension = parseEnumQuery(route.query.dimension, ['VEHICLE_ID', 'DRIVER_ID'], 'VEHICLE_ID')
  filterModel.sortBy = parseEnumQuery(
    route.query.sortBy,
    ['ALERT_COUNT', 'HIGH_RISK_COUNT', 'AVG_RISK_SCORE', 'RECENT_ACTIVE_RISK_COUNT'],
    'ALERT_COUNT',
  )
  filterModel.limit = parsePositiveIntQuery(route.query.limit, 10, 100)
  filterModel.timeRange = parseDateRange(route.query, getDefaultStatsRange('DAY'))
}

function buildRankingQuery(): RankingQuery {
  return {
    fleetId: filterModel.fleetId.trim() || undefined,
    riskLevel: filterModel.riskLevel,
    dimension: filterModel.dimension,
    sortBy: filterModel.sortBy,
    limit: filterModel.limit,
    ...toIsoRange(filterModel.timeRange),
  }
}

function syncRouteQuery(query: RankingQuery): void {
  router.replace({
    name: 'risk-ranking',
    query: toFilterQuery(query),
  })
}
</script>

<template>
  <div class="ranking-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Stats</p>
        <h1>风险排行</h1>
        <p class="subhead">支持车辆、司机两个维度排行，并可跳回告警列表形成闭环。</p>
      </div>
    </div>

    <el-card class="panel-card" shadow="never">
      <el-form class="filter-grid" label-position="top">
        <el-form-item label="统计范围">
          <el-date-picker
            v-model="filterModel.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>

        <el-form-item label="车队">
          <el-input v-model="filterModel.fleetId" placeholder="1001" clearable />
        </el-form-item>

        <el-form-item label="维度">
          <el-segmented
            v-model="filterModel.dimension"
            :options="[
              { label: '车辆排行', value: 'VEHICLE_ID' },
              { label: '司机排行', value: 'DRIVER_ID' },
            ]"
          />
        </el-form-item>

        <el-form-item label="排序方式">
          <el-select v-model="filterModel.sortBy">
            <el-option label="风险总数" value="ALERT_COUNT" />
            <el-option label="高风险数" value="HIGH_RISK_COUNT" />
            <el-option label="最近活跃风险数（待后端支持）" value="RECENT_ACTIVE_RISK_COUNT" />
          </el-select>
        </el-form-item>

        <el-form-item label="风险等级">
          <el-select v-model="filterModel.riskLevel" placeholder="全部等级" clearable>
            <el-option
              v-for="option in riskOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="展示条数">
          <el-select v-model="filterModel.limit">
            <el-option :value="10" label="Top 10" />
            <el-option :value="20" label="Top 20" />
            <el-option :value="50" label="Top 50" />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="action-row">
        <el-button type="primary" :loading="loading" @click="handleSearch">刷新排行</el-button>
        <el-button @click="handleReset">重置条件</el-button>
      </div>
    </el-card>

    <section class="summary-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <section class="content-grid">
      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">排行走势概览</div>
        </template>

        <EChartPanel
          :option="barChartOption"
          :loading="loading"
          :error="rankingPanelError"
          :empty="rankingEmpty"
          :height="380"
        />
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">排行列表</div>
        </template>

        <el-alert
          v-if="moduleError && rankingEmpty"
          :title="moduleError"
          type="error"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else-if="moduleError"
          class="inline-alert"
          :title="`刷新失败，已保留上一版成功数据：${moduleError}`"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-table v-if="!moduleError || !rankingEmpty" :data="rankingItems" empty-text="无符合条件数据">
          <el-table-column prop="rank" label="名次" width="72" />
          <el-table-column prop="dimensionValue" label="对象" min-width="130" />
          <el-table-column prop="alertCount" label="风险总数" width="100" />
          <el-table-column prop="highRiskCount" label="高风险数" width="100" />
          <el-table-column label="最近活跃风险数" width="130">
            <template #default="{ row }">
              {{ row.recentActiveRiskCount ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="平均风险分" width="120">
            <template #default="{ row }">{{ formatPercent(row.avgRiskScore) }}</template>
          </el-table-column>
          <el-table-column label="跳转" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleOpenAlerts(row)">查看告警</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.ranking-page {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 26px 24px 34px;
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

.panel-card,
.metric-card {
  border-radius: 16px;
  border: 1px solid #d7e5e2;
  background: rgba(255, 255, 255, 0.9);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 14px;
}

.filter-grid :deep(.el-date-editor) {
  width: 100%;
}

.action-row {
  margin-top: 6px;
  display: flex;
  gap: 10px;
}

.summary-grid,
.content-grid {
  display: grid;
  gap: 16px;
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.content-grid {
  grid-template-columns: 0.9fr 1.1fr;
}

.metric-label,
.card-title {
  margin: 0;
  font-weight: 700;
  color: #184148;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: #173d45;
}

.inline-alert {
  margin-bottom: 14px;
}

@media (max-width: 1100px) {
  .filter-grid,
  .summary-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .ranking-page {
    padding: 20px 16px 26px;
  }
}
</style>
