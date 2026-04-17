<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlertList } from '../api/alerts'
import {
  riskLevelLabelMap,
  statusLabelMap,
  type AlertListQuery,
  type AlertRiskLevel,
  type AlertStatus,
  type AlertSummary,
} from '../types/alerts'
import { formatDateTime, formatScore, getRiskTagType, getStatusTagType } from '../utils/alerts'

interface FilterModel {
  fleetId: string
  vehicleId: string
  driverId: string
  riskLevel?: AlertRiskLevel
  status?: AlertStatus
  timeRange: [Date, Date] | []
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const tableData = ref<AlertSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const filterModel = reactive<FilterModel>({
  fleetId: '',
  vehicleId: '',
  driverId: '',
  riskLevel: undefined,
  status: undefined,
  timeRange: [],
})

const riskOptions = [
  { label: riskLevelLabelMap[1], value: 1 as AlertRiskLevel },
  { label: riskLevelLabelMap[2], value: 2 as AlertRiskLevel },
  { label: riskLevelLabelMap[3], value: 3 as AlertRiskLevel },
]

const statusOptions = [
  { label: statusLabelMap[0], value: 0 as AlertStatus },
  { label: statusLabelMap[1], value: 1 as AlertStatus },
  { label: statusLabelMap[2], value: 2 as AlertStatus },
  { label: statusLabelMap[3], value: 3 as AlertStatus },
]

const totalText = computed(() => `共 ${total.value} 条告警`)

onMounted(async () => {
  hydrateFromRoute()
  await fetchList(false)
})

async function fetchList(syncRoute = true): Promise<void> {
  loading.value = true

  try {
    const query = buildListQuery()

    if (syncRoute) {
      syncRouteQuery(query)
    }

    const data = await getAlertList(query)
    tableData.value = Array.isArray(data.items) ? data.items : []
    total.value = Number(data.total) || 0
    currentPage.value = Number(data.page) || query.page
    pageSize.value = Number(data.size) || query.size
  } finally {
    loading.value = false
  }
}

function hydrateFromRoute(): void {
  const query = route.query
  currentPage.value = parsePositiveInt(query.page, 1)
  pageSize.value = parsePositiveInt(query.size, 20)

  filterModel.fleetId = parseString(query.fleetId)
  filterModel.vehicleId = parseString(query.vehicleId)
  filterModel.driverId = parseString(query.driverId)
  filterModel.riskLevel = parseEnum<AlertRiskLevel>(query.riskLevel, [1, 2, 3])
  filterModel.status = parseEnum<AlertStatus>(query.status, [0, 1, 2, 3])

  const startTime = parseString(query.startTime)
  const endTime = parseString(query.endTime)
  const startDate = toValidDate(startTime)
  const endDate = toValidDate(endTime)

  if (startDate && endDate && startDate.getTime() <= endDate.getTime()) {
    filterModel.timeRange = [startDate, endDate]
    return
  }

  filterModel.timeRange = getDefaultRange()
}

function buildListQuery(): AlertListQuery {
  const query: AlertListQuery = {
    page: currentPage.value,
    size: pageSize.value,
  }

  const fleetId = filterModel.fleetId.trim()
  const vehicleId = filterModel.vehicleId.trim()
  const driverId = filterModel.driverId.trim()

  if (fleetId) {
    query.fleetId = fleetId
  }

  if (vehicleId) {
    query.vehicleId = vehicleId
  }

  if (driverId) {
    query.driverId = driverId
  }

  if (filterModel.riskLevel !== undefined) {
    query.riskLevel = filterModel.riskLevel
  }

  if (filterModel.status !== undefined) {
    query.status = filterModel.status
  }

  if (filterModel.timeRange.length === 2) {
    query.startTime = filterModel.timeRange[0].toISOString()
    query.endTime = filterModel.timeRange[1].toISOString()
  }

  return query
}

function syncRouteQuery(query: AlertListQuery): void {
  router.replace({
    name: 'alerts-list',
    query: {
      page: String(query.page),
      size: String(query.size),
      fleetId: query.fleetId,
      vehicleId: query.vehicleId,
      driverId: query.driverId,
      riskLevel: query.riskLevel !== undefined ? String(query.riskLevel) : undefined,
      status: query.status !== undefined ? String(query.status) : undefined,
      startTime: query.startTime,
      endTime: query.endTime,
    },
  })
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filterModel.fleetId = ''
  filterModel.vehicleId = ''
  filterModel.driverId = ''
  filterModel.riskLevel = undefined
  filterModel.status = undefined
  filterModel.timeRange = getDefaultRange()
  currentPage.value = 1
  pageSize.value = 20
  await fetchList()
}

async function handleCurrentChange(page: number): Promise<void> {
  currentPage.value = page
  await fetchList()
}

async function handleSizeChange(size: number): Promise<void> {
  pageSize.value = size
  currentPage.value = 1
  await fetchList()
}

function handleOpenDetail(row: AlertSummary): void {
  router.push({
    name: 'alert-detail',
    params: { id: String(row.id) },
    query: route.query,
  })
}

function getDefaultRange(): [Date, Date] {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return [start, end]
}

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return fallback
}

function parseString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function parseEnum<T extends number>(value: unknown, options: T[]): T | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return options.includes(parsed as T) ? (parsed as T) : undefined
}

function toValidDate(value: string): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getRiskLabel(level: number): string {
  return riskLevelLabelMap[level as AlertRiskLevel] || '-'
}

function getStatusLabel(status: number): string {
  return statusLabelMap[status as AlertStatus] || '-'
}
</script>

<template>
  <div class="alerts-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Alerts</p>
        <h1>告警中心</h1>
        <p class="subhead">支持按车队、车辆、司机、等级、状态与时间范围进行筛选查询。</p>
      </div>
    </div>

    <el-card class="panel-card" shadow="never">
      <el-form class="filter-grid" label-position="top">
        <el-form-item label="车队">
          <el-input v-model="filterModel.fleetId" placeholder="fleet_01" clearable />
        </el-form-item>

        <el-form-item label="车辆">
          <el-input v-model="filterModel.vehicleId" placeholder="veh_001" clearable />
        </el-form-item>

        <el-form-item label="司机">
          <el-input v-model="filterModel.driverId" placeholder="drv_001" clearable />
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

        <el-form-item label="告警状态">
          <el-select v-model="filterModel.status" placeholder="全部状态" clearable>
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="time-range" label="触发时间">
          <el-date-picker
            v-model="filterModel.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
      </el-form>

      <div class="action-row">
        <el-button type="primary" :loading="loading" @click="handleSearch">筛选查询</el-button>
        <el-button @click="handleReset">重置条件</el-button>
      </div>
    </el-card>

    <el-card class="panel-card" shadow="never">
      <template #header>
        <div class="table-head">
          <span>告警列表</span>
          <span class="count">{{ totalText }}</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        class="alert-table"
        :data="tableData"
        row-key="id"
        empty-text="暂无告警数据"
        @row-click="handleOpenDetail"
      >
        <el-table-column label="告警编号" min-width="170">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="handleOpenDetail(row)">{{ row.alertNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="vehicleId" label="车辆" min-width="120" />
        <el-table-column prop="driverId" label="司机" min-width="120" />
        <el-table-column label="风险级别" min-width="110">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.riskLevel)">{{ getRiskLabel(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="疲劳分" min-width="110">
          <template #default="{ row }">{{ formatScore(row.fatigueScore) }}</template>
        </el-table-column>
        <el-table-column label="分心分" min-width="110">
          <template #default="{ row }">{{ formatScore(row.distractionScore) }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.triggerTime) }}</template>
        </el-table-column>
      </el-table>

      <div class="pager-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.alerts-page {
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

.panel-card {
  border-radius: 16px;
  border: 1px solid #d7e5e2;
  background: rgba(255, 255, 255, 0.9);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 14px;
}

.time-range {
  grid-column: span 3;
}

.time-range :deep(.el-date-editor) {
  width: 100%;
}

.action-row {
  margin-top: 4px;
  display: flex;
  gap: 10px;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
  color: #184148;
}

.count {
  font-size: 13px;
  color: #648087;
  font-weight: 500;
}

.alert-table {
  width: 100%;
}

.alert-table :deep(.el-table__row) {
  cursor: pointer;
}

.pager-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1080px) {
  .alerts-page {
    padding: 22px 16px 26px;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .time-range {
    grid-column: span 2;
  }
}

@media (max-width: 760px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .time-range {
    grid-column: span 1;
  }

  .action-row,
  .pager-wrap {
    justify-content: flex-start;
  }
}
</style>
