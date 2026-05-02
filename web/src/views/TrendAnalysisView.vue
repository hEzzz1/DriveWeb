<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import EChartPanel from '../components/EChartPanel.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import { getFleetList } from '../api/fleets'
import { fetchAllPages } from '../api/pagination'
import { getStatsRanking, getStatsTrend } from '../api/stats'
import { riskLevelLabelMap, type AlertRiskLevel } from '../types/alerts'
import type {
  RankingData,
  RankingDimension,
  TrendBucket,
  TrendData,
  TrendQuery,
  StatsGroupBy,
} from '../types/stats'
import {
  buildRankingSortValue,
  describeTrendPeak,
  formatCompactDateTime,
  formatPercent,
  getDefaultStatsRange,
  parseDateRange,
  parseEnumQuery,
  parseOptionalRiskLevel,
  parseStringQuery,
  toFilterQuery,
  toIsoRange,
} from '../utils/stats'

interface FilterModel {
  fleetId: string
  riskLevel?: AlertRiskLevel
  groupBy: StatsGroupBy
  timeRange: [Date, Date] | []
}

const route = useRoute()
const router = useRouter()

const filterModel = reactive<FilterModel>({
  fleetId: '',
  riskLevel: undefined,
  groupBy: 'HOUR',
  timeRange: getDefaultStatsRange('HOUR'),
})

const trendLoading = ref(false)
const trendError = ref('')
const trendData = ref<TrendData | null>(null)
const rankingLoading = ref(false)
const rankingError = ref('')
const rankingData = ref<RankingData | null>(null)
const referenceLoading = ref(false)
const fleetOptions = ref<Array<{ value: string; label: string }>>([])

const riskOptions = [
  { label: riskLevelLabelMap[1], value: 1 as AlertRiskLevel },
  { label: riskLevelLabelMap[2], value: 2 as AlertRiskLevel },
  { label: riskLevelLabelMap[3], value: 3 as AlertRiskLevel },
]

const trendChartOption = computed<EChartsOption>(() => {
  const series: NonNullable<EChartsOption['series']> = [
    {
      name: '总告警趋势',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: (trendData.value?.items || []).map((item) => item.alertCount),
    },
    {
      name: '高风险趋势',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: (trendData.value?.items || []).map((item) => item.highRiskCount),
    },
  ]

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      top: 0,
    },
    grid: {
      left: 16,
      right: 16,
      top: 48,
      bottom: 20,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: (trendData.value?.items || []).map((item) => formatCompactDateTime(item.bucketTime)),
    },
    yAxis: {
      type: 'value',
    },
    color: ['#1f8b74', '#d85c51', '#4f83cc'],
    series,
  }
})

const trendEmpty = computed(() => !trendData.value?.items?.length)
const trendPanelError = computed(() => (!trendData.value ? trendError.value : ''))
const rankingPreviewItems = computed(() =>
  [...(rankingData.value?.items || [])]
    .sort(
      (left, right) =>
        buildRankingSortValue(right, 'HIGH_RISK_COUNT') - buildRankingSortValue(left, 'HIGH_RISK_COUNT'),
    )
    .slice(0, 5),
)
const summaryCards = computed(() => {
  const items = trendData.value?.items || []
  return [
    {
      label: '告警峰值时段',
      value: describeTrendPeak(items, 'alertCount'),
    },
    {
      label: '高风险峰值时段',
      value: describeTrendPeak(items, 'highRiskCount'),
    },
    {
      label: '平均风险分',
      value: formatPercent(calculateAverage(items, (item) => item.avgRiskScore)),
    },
  ]
})

onMounted(async () => {
  hydrateFromRoute()
  await Promise.all([fetchFleetOptions(), fetchAll(false)])
})

async function fetchFleetOptions(): Promise<void> {
  referenceLoading.value = true

  try {
    const items = await fetchAllPages(getFleetList, {})
    fleetOptions.value = items.map((item) => ({
      value: String(item.id),
      label: `${item.name} (#${item.id})`,
    }))
  } finally {
    referenceLoading.value = false
  }
}

async function fetchAll(syncRoute = true): Promise<void> {
  const trendQuery = buildTrendQuery()

  if (syncRoute) {
    syncRouteQuery(trendQuery)
  }

  trendLoading.value = true
  rankingLoading.value = true

  const [trendResult, rankingResult] = await Promise.allSettled([
    getStatsTrend(trendQuery, { silentError: true }),
    getStatsRanking(
      {
        ...trendQuery,
        dimension: getPreviewRankingDimension(),
        sortBy: 'HIGH_RISK_COUNT',
        limit: 5,
      },
      { silentError: true },
    ),
  ])

  if (trendResult.status === 'fulfilled') {
    trendData.value = trendResult.value
    trendError.value = ''
  } else {
    trendError.value = trendResult.reason instanceof Error ? trendResult.reason.message : '趋势数据加载失败'
  }

  if (rankingResult.status === 'fulfilled') {
    rankingData.value = rankingResult.value
    rankingError.value = ''
  } else {
    rankingError.value =
      rankingResult.reason instanceof Error ? rankingResult.reason.message : '排行预览加载失败'
  }

  trendLoading.value = false
  rankingLoading.value = false
}

async function handleSearch(): Promise<void> {
  await fetchAll(true)
}

async function handleReset(): Promise<void> {
  filterModel.fleetId = ''
  filterModel.riskLevel = undefined
  filterModel.groupBy = 'HOUR'
  filterModel.timeRange = getDefaultStatsRange('HOUR')
  await fetchAll(true)
}

function handleOpenRanking(): void {
  router.push({
    name: 'risk-ranking',
    query: {
      ...route.query,
      dimension: getPreviewRankingDimension(),
      sortBy: 'HIGH_RISK_COUNT',
    },
  })
}

function hydrateFromRoute(): void {
  filterModel.groupBy = parseEnumQuery(route.query.groupBy, ['HOUR', 'DAY'], 'HOUR')
  filterModel.fleetId = parseStringQuery(route.query.fleetId)
  filterModel.riskLevel = parseOptionalRiskLevel(route.query.riskLevel)
  filterModel.timeRange = parseDateRange(route.query, getDefaultStatsRange(filterModel.groupBy))
}

function buildTrendQuery(): TrendQuery {
  return {
    fleetId: filterModel.fleetId.trim() || undefined,
    riskLevel: filterModel.riskLevel,
    groupBy: filterModel.groupBy,
    ...toIsoRange(filterModel.timeRange),
  }
}

function syncRouteQuery(query: TrendQuery): void {
  router.replace({
    name: 'trend-analysis',
    query: toFilterQuery(query),
  })
}

function getPreviewRankingDimension(): RankingDimension {
  return 'VEHICLE_ID'
}

function calculateAverage(items: TrendBucket[], getter: (item: TrendBucket) => number): number | null {
  if (!items.length) {
    return null
  }

  const total = items.reduce((sum, item) => sum + getter(item), 0)
  return total / items.length
}
</script>

<template>
  <div class="trend-page">
    <WorkspacePageHeader
      eyebrow="Stats"
      title="趋势分析"
      subtitle="筛选结果会同步到 URL，刷新后可直接回放当前分析视图。"
    />

    <el-card class="panel-card" shadow="never">
      <el-form class="filter-grid" label-position="top">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterModel.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>

        <el-form-item label="车队">
          <el-select v-model="filterModel.fleetId" clearable filterable :loading="referenceLoading" placeholder="全部车队">
            <el-option
              v-for="option in fleetOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
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

        <el-form-item label="时间粒度">
          <el-radio-group v-model="filterModel.groupBy">
            <el-radio-button label="HOUR">按小时</el-radio-button>
            <el-radio-button label="DAY">按天</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div class="action-row">
        <el-button type="primary" :loading="trendLoading || rankingLoading" @click="handleSearch">
          应用筛选
        </el-button>
        <el-button @click="handleReset">重置条件</el-button>
      </div>
    </el-card>

    <section class="summary-grid">
      <el-card v-for="item in summaryCards" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <el-card class="panel-card" shadow="never">
      <template #header>
        <div class="card-head">
          <span class="card-title">核心趋势</span>
          <div class="head-tags">
            <el-tag effect="plain" type="info">
              {{ trendData?.groupBy === 'DAY' ? '按天聚合' : '按小时聚合' }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-alert
        v-if="trendError && trendData"
        class="inline-alert"
        :title="`刷新失败，已保留上一版成功数据：${trendError}`"
        type="warning"
        :closable="false"
        show-icon
      />

      <EChartPanel
        :option="trendChartOption"
        :loading="trendLoading"
        :error="trendPanelError"
        :empty="trendEmpty"
      />
    </el-card>

    <section class="compare-grid">
      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-head">
            <span class="card-title">排行预览</span>
            <el-button link type="primary" @click="handleOpenRanking">查看完整排行</el-button>
          </div>
        </template>

        <el-alert
          v-if="rankingError && rankingPreviewItems.length === 0"
          :title="rankingError"
          type="error"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else-if="rankingError"
          class="inline-alert"
          :title="`排行预览刷新失败，已保留上一版成功数据：${rankingError}`"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-table
          v-if="!rankingError || rankingPreviewItems.length > 0"
          :data="rankingPreviewItems"
          empty-text="无符合条件数据"
        >
          <el-table-column prop="rank" label="名次" width="80" />
          <el-table-column prop="dimensionValue" label="对象" min-width="120" />
          <el-table-column prop="alertCount" label="总告警" width="100" />
          <el-table-column prop="highRiskCount" label="高风险" width="100" />
        </el-table>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">对比摘要</div>
        </template>

        <div class="compare-list">
          <div class="compare-item">
            <span>平均疲劳分</span>
            <strong>{{ formatPercent(calculateAverage(trendData?.items || [], (item) => item.avgFatigueScore)) }}</strong>
          </div>
          <div class="compare-item">
            <span>平均分心分</span>
            <strong>{{ formatPercent(calculateAverage(trendData?.items || [], (item) => item.avgDistractionScore)) }}</strong>
          </div>
          <div class="compare-item">
            <span>过滤范围</span>
            <strong>{{ trendData?.startTime ? `${formatCompactDateTime(trendData.startTime)} - ${formatCompactDateTime(trendData.endTime)}` : '-' }}</strong>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.trend-page {
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
.compare-grid {
  display: grid;
  gap: 16px;
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.compare-grid {
  grid-template-columns: 1.1fr 0.9fr;
}

.metric-card strong,
.compare-item strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: #173d45;
}

.metric-label,
.card-title {
  margin: 0;
  font-weight: 700;
  color: #184148;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.head-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.compare-list {
  display: grid;
  gap: 12px;
}

.compare-item {
  padding: 14px;
  border: 1px solid #e1ece9;
  border-radius: 12px;
  background: #f8fbfb;
}

.compare-item span {
  color: #688388;
  font-size: 13px;
}

.inline-alert {
  margin-bottom: 14px;
}

@media (max-width: 1100px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-grid,
  .compare-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .trend-page {
    padding: 20px 16px 26px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
