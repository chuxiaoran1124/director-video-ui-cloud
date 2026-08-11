<template>
  <div class="task-statistics-page">
    <div v-if="!isPlatformSuperAdmin" class="permission-empty">
      <el-empty description="仅平台管理员可以查看任务效率统计" />
    </div>

    <template v-else>
      <section class="page-hero">
        <div>
          <div class="eyebrow">平台管理 / 任务效率</div>
          <h1>任务效率</h1>
          <p>按逻辑执行队列分别查看每小时完成量、平均处理耗时和排队耗时。</p>
        </div>
        <div class="hero-meta">
          <span>统计时区：{{ timezone }}</span>
          <span v-if="generatedAt">数据更新：{{ formatTime(generatedAt) }}</span>
          <el-button circle :loading="loading" title="刷新" @click="loadStatistics()">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </section>

      <section class="filter-card">
        <div class="filter-grid">
          <div class="filter-item filter-item-wide">
            <label>时间范围</label>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              :clearable="false"
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <label>团队</label>
            <el-select v-model="tenantId" class="w-full" clearable placeholder="全部团队">
              <el-option label="全部团队" value="" />
              <el-option v-for="tenant in tenantList" :key="tenant.id" :label="tenant.tenantName" :value="tenant.id" />
            </el-select>
          </div>
          <div class="filter-item filter-item-queues">
            <label>执行队列</label>
            <el-select v-model="selectedQueueCodes" class="w-full" multiple collapse-tags :max-collapse-tags="3" placeholder="全部启用队列">
              <el-option v-for="queue in queueOptions" :key="queue.code" :label="queue.name" :value="queue.code" />
            </el-select>
          </div>
          <div class="filter-actions">
            <el-button @click="setLast24Hours">最近24小时</el-button>
            <el-button type="primary" :loading="loading" @click="loadStatistics()">查询</el-button>
          </div>
        </div>
        <div class="filter-help">平均每小时完成数包含查询范围内没有完成任务的小时；平均处理耗时不包含排队等待。</div>
      </section>

      <section class="metric-cards">
        <div class="metric-card">
          <span>查询范围完成总数</span>
          <strong>{{ totalCompleted }}</strong>
          <small>按成功执行尝试去重</small>
        </div>
        <div class="metric-card">
          <span>队列平均每小时完成</span>
          <strong>{{ formatCount(overallAveragePerHour) }}</strong>
          <small>各队列分别计算后展示</small>
        </div>
        <div class="metric-card">
          <span>平均单任务处理耗时</span>
          <strong>{{ formatSeconds(overallAverageDuration) }}</strong>
          <small>完成时间 - 任务开始时间</small>
        </div>
        <div class="metric-card warning-card">
          <span>查询范围失败数</span>
          <strong>{{ totalFailed }}</strong>
          <small>失败不计入完成耗时平均值</small>
        </div>
      </section>

      <section class="data-card">
        <div class="section-heading">
          <div><h2>按队列汇总</h2><span>每个逻辑执行队列独立统计，不混合不同阶段。</span></div>
          <el-tag type="info" effect="plain">{{ summaryRows.length }} 个队列</el-tag>
        </div>
        <el-table :data="summaryRows" fit style="width: 100%" :header-cell-style="tableHeaderStyle" v-loading="loading">
          <el-table-column label="执行队列" min-width="190">
            <template #default="{ row }">
              <div class="queue-name">{{ row.queueName }}</div>
              <div class="queue-code">{{ row.queueCode }}</div>
            </template>
          </el-table-column>
          <el-table-column label="完成总数" min-width="130" align="center" prop="completedCount" />
          <el-table-column label="平均每小时完成" min-width="155" align="center">
            <template #default="{ row }">{{ formatCount(row.averageCompletedPerHour) }}</template>
          </el-table-column>
          <el-table-column label="平均单任务耗时" min-width="155" align="center">
            <template #default="{ row }">{{ formatSeconds(row.averageTaskDurationSeconds) }}</template>
          </el-table-column>
          <el-table-column label="平均排队耗时" min-width="145" align="center">
            <template #default="{ row }">{{ formatSeconds(row.averageWaitSeconds) }}</template>
          </el-table-column>
          <el-table-column label="失败数" min-width="110" align="center">
            <template #default="{ row }"><span :class="{ 'danger-text': row.failedCount }">{{ row.failedCount }}</span></template>
          </el-table-column>
          <el-table-column label="异常时间记录" min-width="140" align="center">
            <template #default="{ row }">{{ row.invalidTimingCount }}</template>
          </el-table-column>
          <template #empty><el-empty description="当前筛选范围暂无统计数据" /></template>
        </el-table>
      </section>

      <section class="data-card hourly-card">
        <div class="section-heading">
          <div><h2>每小时效率明细</h2><span>完成时间落在哪个小时，就归入哪个小时桶；无完成小时显示 0。</span></div>
          <el-tag type="info" effect="plain">{{ hourlyRows.length }} 条</el-tag>
        </div>
        <el-table :data="hourlyRows" fit style="width: 100%" :header-cell-style="tableHeaderStyle" v-loading="loading">
          <el-table-column label="小时" min-width="180">
            <template #default="{ row }">{{ formatTime(row.hourStart) }}</template>
          </el-table-column>
          <el-table-column label="执行队列" min-width="190">
            <template #default="{ row }"><span class="queue-name">{{ row.queueName }}</span></template>
          </el-table-column>
          <el-table-column label="完成量" min-width="115" align="center">
            <template #default="{ row }"><strong>{{ row.completedCount }}</strong></template>
          </el-table-column>
          <el-table-column label="平均单任务耗时" min-width="155" align="center">
            <template #default="{ row }">{{ formatSeconds(row.averageTaskDurationSeconds) }}</template>
          </el-table-column>
          <el-table-column label="平均排队耗时" min-width="145" align="center">
            <template #default="{ row }">{{ formatSeconds(row.averageWaitSeconds) }}</template>
          </el-table-column>
          <el-table-column label="失败数" min-width="100" align="center">
            <template #default="{ row }"><span :class="{ 'danger-text': row.failedCount }">{{ row.failedCount }}</span></template>
          </el-table-column>
          <template #empty><el-empty description="当前筛选范围暂无小时数据" /></template>
        </el-table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getTaskQueueEfficiency } from '/@/api/system'
import { useLayoutStore } from '/@/store/modules/layout'

interface QueueOption { code: string; name: string }
interface EfficiencyRow {
  queueCode: string
  queueName: string
  completedCount: number
  averageCompletedPerHour: number
  averageTaskDurationSeconds: number | null
  averageWaitSeconds: number | null
  failedCount: number
  invalidTimingCount: number
  hourStart?: string
}

const layoutStore = useLayoutStore()
const isPlatformSuperAdmin = computed(() => Boolean(layoutStore.getUserInfo.isPlatformSuperAdmin))
const tenantList = computed(() => layoutStore.getTenantList)
const timezone = ref('Asia/Shanghai')
const generatedAt = ref('')
const loading = ref(false)
const tenantId = ref<number | string>('')
const queueOptions = ref<QueueOption[]>([
  { code: 'fast_audio_prepare', name: '音频预处理' },
  { code: 'decompose_quick', name: '快速训练编排' },
  { code: 'audio_clone', name: '声音克隆' },
  { code: 'avatar_clone', name: '数字人训练（含配音）' },
  { code: 'avatar_clone_not_voice', name: '数字人训练（无配音）' },
  { code: 'video_realtime', name: '单条视频生成' },
  { code: 'video_batch', name: '批量视频生成' },
  { code: 'video_post_process', name: '视频后处理' }
])
const selectedQueueCodes = ref<string[]>(queueOptions.value.map(item => item.code))
const summaryRows = ref<EfficiencyRow[]>([])
const hourlyRows = ref<EfficiencyRow[]>([])
const dateRange = ref<[string, string]>(['', ''])
let refreshTimer: number | null = null

const tableHeaderStyle = { background: '#f7f9fc', color: '#536174', fontWeight: '600' }

function pad(value: number): string { return String(value).padStart(2, '0') }

function toLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function setLast24Hours() {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  dateRange.value = [toLocalDateTime(start), toLocalDateTime(end)]
}

function toApiTime(value: string): string {
  return value ? `${value.replace(' ', 'T')}+08:00` : ''
}

function getNumber(value: any, fallback = 0): number {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

function getNullableNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

function queueName(code: string, supplied?: string): string {
  return supplied || queueOptions.value.find(item => item.code === code)?.name || code
}

function normalizeRow(item: any, codeHint = '', hourStart = ''): EfficiencyRow {
  const queueCode = String(item.queueCode || item.queue_code || codeHint)
  return {
    queueCode,
    queueName: queueName(queueCode, item.queueName || item.queue_name),
    completedCount: getNumber(item.completedCount ?? item.completed_count),
    averageCompletedPerHour: getNumber(item.averageCompletedPerHour ?? item.average_completed_per_hour),
    averageTaskDurationSeconds: getNullableNumber(item.averageTaskDurationSeconds ?? item.average_task_duration_seconds),
    averageWaitSeconds: getNullableNumber(item.averageWaitSeconds ?? item.average_wait_seconds),
    failedCount: getNumber(item.failedCount ?? item.failed_count),
    invalidTimingCount: getNumber(item.invalidTimingCount ?? item.invalid_timing_count),
    hourStart: item.hourStart || item.hour_start || hourStart
  }
}

function normalizeSummary(data: any): EfficiencyRow[] {
  if (Array.isArray(data)) return data.map(item => normalizeRow(item))
  return Object.entries(data || {}).map(([code, item]) => normalizeRow(item, code))
}

function normalizeHourly(data: any): EfficiencyRow[] {
  if (Array.isArray(data)) return data.map(item => normalizeRow(item))
  const rows: EfficiencyRow[] = []
  Object.entries(data || {}).forEach(([code, value]: [string, any]) => {
    if (Array.isArray(value)) value.forEach(item => rows.push(normalizeRow(item, code)))
    else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([hour, item]: [string, any]) => rows.push(normalizeRow(item, code, hour)))
    }
  })
  return rows
}

function formatTime(value?: string | null): string {
  if (!value) return '-'
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) return raw.replace('T', ' ').slice(0, 19)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
}

function formatSeconds(value: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  if (value < 60) return `${value.toFixed(value % 1 ? 1 : 0)} 秒`
  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value % 60)
  return `${minutes} 分 ${seconds} 秒`
}

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const totalCompleted = computed(() => summaryRows.value.reduce((sum, row) => sum + row.completedCount, 0))
const totalFailed = computed(() => summaryRows.value.reduce((sum, row) => sum + row.failedCount, 0))
const overallAveragePerHour = computed(() => {
  if (!summaryRows.value.length) return 0
  return summaryRows.value.reduce((sum, row) => sum + row.averageCompletedPerHour, 0) / summaryRows.value.length
})
const overallAverageDuration = computed(() => {
  const rows = summaryRows.value.filter(row => row.averageTaskDurationSeconds !== null && row.completedCount > 0)
  const count = rows.reduce((sum, row) => sum + row.completedCount, 0)
  if (!count) return null
  return rows.reduce((sum, row) => sum + (row.averageTaskDurationSeconds || 0) * row.completedCount, 0) / count
})

function responseData(response: any): any {
  return response?.data?.data ?? response?.data ?? {}
}

async function loadStatistics(silent = false) {
  if (!isPlatformSuperAdmin.value || loading.value) return
  if (!dateRange.value[0] || !dateRange.value[1]) setLast24Hours()
  loading.value = true
  try {
    const response = await getTaskQueueEfficiency({
      startTime: toApiTime(dateRange.value[0]),
      endTime: toApiTime(dateRange.value[1]),
      ...(tenantId.value ? { tenantId: tenantId.value } : {}),
      ...(selectedQueueCodes.value.length ? { queueCodes: selectedQueueCodes.value } : {})
    }, silent ? { hideLoading: true, silentError: true } : {})
    const data = responseData(response)
    timezone.value = data.timezone || 'Asia/Shanghai'
    generatedAt.value = data.generatedAt || data.generated_at || new Date().toISOString()
    summaryRows.value = normalizeSummary(data.summaryByQueue || data.summary_by_queue)
    hourlyRows.value = normalizeHourly(data.hourlySeries || data.hourly_series)
      .sort((a, b) => String(a.hourStart || '').localeCompare(String(b.hourStart || '')) || a.queueCode.localeCompare(b.queueCode))
  } catch (error: any) {
    if (!silent) ElMessage.error(error?.message || '任务效率统计加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  setLast24Hours()
  if (isPlatformSuperAdmin.value) {
    loadStatistics()
    refreshTimer = window.setInterval(() => loadStatistics(true), 60 * 1000)
  }
})

onUnmounted(() => {
  if (refreshTimer !== null) window.clearInterval(refreshTimer)
})
</script>

<style scoped>
.task-statistics-page { width: 100%; min-height: 100%; box-sizing: border-box; padding: clamp(16px, 2vw, 28px); background: #f5f7fb; }
.permission-empty { display: flex; min-height: 420px; align-items: center; justify-content: center; background: #fff; border: 1px solid #e8edf5; border-radius: 14px; }
.page-hero, .filter-card, .data-card { width: 100%; box-sizing: border-box; background: #fff; border: 1px solid #e8edf5; border-radius: 14px; box-shadow: 0 5px 18px rgba(38, 55, 88, 0.04); }
.page-hero { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: clamp(20px, 3vw, 32px); }
.eyebrow { color: #7b8aa1; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.page-hero h1 { margin: 7px 0 0; color: #1f2d43; font-size: clamp(20px, 2vw, 28px); font-weight: 700; }
.page-hero p { margin: 7px 0 0; color: #8c9ab0; font-size: 13px; }
.hero-meta { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 12px; color: #8796aa; font-size: 12px; }
.filter-card { margin-top: 16px; padding: 16px; }
.filter-grid { display: grid; grid-template-columns: minmax(230px, 1.5fr) minmax(150px, .8fr) minmax(200px, 1fr) auto; align-items: end; gap: 14px; }
.filter-item { min-width: 0; }
.filter-item label { display: block; margin-bottom: 7px; color: #536174; font-size: 12px; font-weight: 600; }
.filter-actions { display: flex; gap: 8px; }
.filter-help { margin-top: 12px; color: #93a0b2; font-size: 12px; }
.metric-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
.metric-card { min-width: 0; padding: 18px; border: 1px solid #e8edf5; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(38, 55, 88, .04); }
.metric-card span, .metric-card small { display: block; color: #8c9ab0; font-size: 12px; }
.metric-card strong { display: block; margin: 10px 0 7px; color: #2b527e; font-size: 25px; line-height: 1; }
.warning-card strong, .danger-text { color: #dd6671; }
.data-card { margin-top: 16px; overflow: hidden; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 17px; border-bottom: 1px solid #edf1f6; }
.section-heading h2 { margin: 0 0 5px; color: #33445b; font-size: 16px; }
.section-heading span { color: #93a0b2; font-size: 12px; }
.queue-name { color: #3b4b60; font-size: 13px; font-weight: 600; }
.queue-code { margin-top: 3px; color: #9aa7b8; font-size: 11px; }
.hourly-card { margin-bottom: 20px; }
:deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) { padding: 10px 8px; }
:deep(.el-table .cell) { min-width: 0; }

@media (max-width: 1100px) {
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-actions { justify-content: flex-end; }
  .metric-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 680px) {
  .task-statistics-page { padding: 12px; }
  .page-hero { align-items: flex-start; flex-direction: column; }
  .hero-meta { justify-content: flex-start; }
  .filter-grid, .metric-cards { grid-template-columns: 1fr; }
  .filter-actions { justify-content: flex-start; }
}
</style>
