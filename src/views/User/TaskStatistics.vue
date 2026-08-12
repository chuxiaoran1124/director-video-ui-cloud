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
          <p>按团队和业务队列查看完成视频秒数及后端 TOS 出入流量。</p>
        </div>
        <div class="hero-meta">
          <span>统计时区：{{ timezone }}</span>
          <span v-if="generatedAt">数据更新：{{ formatTime(generatedAt) }}</span>
          <el-button circle :loading="loading" title="刷新" @click="loadStatistics()"><el-icon><Refresh /></el-icon></el-button>
        </div>
      </section>

      <section class="filter-card">
        <div class="preset-row">
          <span class="filter-label">时间范围</span>
          <el-radio-group v-model="rangePreset" size="small" @change="handlePresetChange">
            <el-radio-button label="1h">1小时</el-radio-button>
            <el-radio-button label="1d">1天</el-radio-button>
            <el-radio-button label="1w">1周</el-radio-button>
            <el-radio-button label="1m">1月</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-if="rangePreset === 'custom'"
            v-model="dateRange"
            class="custom-range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :clearable="false"
          />
        </div>
        <div class="filter-grid">
          <div class="filter-item">
            <label>团队</label>
            <el-select v-model="tenantId" class="w-full" clearable placeholder="全部团队">
              <el-option label="全部团队" value="" />
              <el-option v-for="tenant in tenantList" :key="tenant.id" :label="tenant.tenantName || tenant.name || tenant.label" :value="tenant.id" />
            </el-select>
          </div>
          <div class="filter-item filter-item-wide">
            <label>业务队列</label>
            <el-select v-model="selectedQueueCodes" class="w-full" multiple collapse-tags :max-collapse-tags="3" placeholder="全部业务队列">
              <el-option v-for="queue in queueOptions" :key="queue.code" :label="queue.name" :value="queue.code" />
            </el-select>
          </div>
          <div class="filter-actions">
            <el-button type="primary" :loading="loading" @click="loadStatistics()">查询</el-button>
          </div>
        </div>
        <div class="filter-help">当前分桶：{{ granularityLabel }}；1 小时按 5 分钟、1 天按小时、1 周/1 月按自然日；自定义范围不大于 1 天按小时，否则按自然日。父计划不计入完成秒数。</div>
      </section>

      <section class="metric-cards">
        <div class="metric-card"><span>完成视频秒数</span><strong>{{ formatSeconds(totalOutputSeconds) }}</strong><small>按任务执行区间重叠比例分摊</small></div>
        <div class="metric-card"><span>TOS 上传</span><strong>{{ formatBytes(totalUploadBytes) }}</strong><small>仅统计后端任务链</small></div>
        <div class="metric-card"><span>TOS 下载</span><strong>{{ formatBytes(totalDownloadBytes) }}</strong><small>不含前端预览/下载</small></div>
        <div class="metric-card warning-card"><span>完成 / 失败任务</span><strong>{{ totalCompleted }} / {{ totalFailed }}</strong><small>三个业务队列汇总</small></div>
      </section>

      <section class="chart-grid">
        <div class="data-card chart-card">
          <div class="section-heading"><div><h2>完成视频秒数</h2><span>每个业务队列独立折线，空桶补 0。</span></div><el-tag type="info" effect="plain">{{ granularityLabel }}</el-tag></div>
          <div class="chart-wrap"><div ref="outputChartRef" class="chart"></div><el-empty v-if="!bucketRows.length" class="chart-empty" description="当前筛选范围暂无统计数据" /></div>
        </div>
        <div class="data-card chart-card">
          <div class="section-heading"><div><h2>TOS 后端任务链流量</h2><span>按队列拆分上传/下载字节数，前端封面与预览不计入。</span></div><el-tag type="info" effect="plain">字节</el-tag></div>
          <div class="chart-wrap"><div ref="tosChartRef" class="chart"></div><el-empty v-if="!bucketRows.length" class="chart-empty" description="当前筛选范围暂无 TOS 流量" /></div>
        </div>
      </section>

      <section class="data-card summary-card">
        <div class="section-heading"><div><h2>辅助汇总</h2><span>不同业务队列单独计算；批量父计划不增加任务数。</span></div><el-tag type="info" effect="plain">{{ summaryRows.length }} 个队列</el-tag></div>
        <el-table :data="summaryRows" fit style="width: 100%" :header-cell-style="tableHeaderStyle" v-loading="loading">
          <el-table-column label="业务队列" min-width="190"><template #default="{ row }"><div class="queue-name">{{ row.queueName }}</div><div class="queue-code">{{ row.queueCode }}</div></template></el-table-column>
          <el-table-column label="完成视频秒数" min-width="150" align="center"><template #default="{ row }">{{ formatSeconds(row.completedOutputSeconds) }}</template></el-table-column>
          <el-table-column label="完成任务数" min-width="120" align="center" prop="completedCount" />
          <el-table-column label="失败任务数" min-width="120" align="center"><template #default="{ row }"><span :class="{ 'danger-text': row.failedCount }">{{ row.failedCount }}</span></template></el-table-column>
          <el-table-column label="平均执行耗时" min-width="150" align="center"><template #default="{ row }">{{ formatSeconds(row.averageTaskDurationSeconds) }}</template></el-table-column>
          <el-table-column label="平均排队耗时" min-width="150" align="center"><template #default="{ row }">{{ formatSeconds(row.averageWaitSeconds) }}</template></el-table-column>
          <el-table-column label="TOS 上传" min-width="145" align="center"><template #default="{ row }">{{ formatBytes(row.tosUploadBytes) }}</template></el-table-column>
          <el-table-column label="TOS 下载" min-width="145" align="center"><template #default="{ row }">{{ formatBytes(row.tosDownloadBytes) }}</template></el-table-column>
          <el-table-column label="无效记录" min-width="110" align="center" prop="invalidCount" />
          <template #empty><el-empty description="当前筛选范围暂无统计数据" /></template>
        </el-table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { echarts } from '/@/components/Echart'
import { getTaskQueueEfficiency } from '/@/api/system'
import { useLayoutStore } from '/@/store/modules/layout'

type RangePreset = '1h' | '1d' | '1w' | '1m' | 'custom'
type Granularity = '5m' | '1h' | '1d'

interface QueueOption { code: string; name: string }
interface MetricBucket {
  queueCode: string
  queueName: string
  bucketStart: string
  bucketEnd?: string
  completedOutputSeconds: number
  completedCount: number
  failedCount: number
  averageTaskDurationSeconds: number | null
  averageWaitSeconds: number | null
  tosUploadBytes: number
  tosDownloadBytes: number
  invalidCount: number
}

interface SummaryRow {
  queueCode: string
  queueName: string
  completedOutputSeconds: number
  completedCount: number
  failedCount: number
  averageTaskDurationSeconds: number | null
  averageWaitSeconds: number | null
  tosUploadBytes: number
  tosDownloadBytes: number
  invalidCount: number
}

const layoutStore = useLayoutStore()
const isPlatformSuperAdmin = computed(() => Boolean(layoutStore.getUserInfo.isPlatformSuperAdmin))
const tenantList = computed(() => layoutStore.getTenantList || [])
const timezone = ref('Asia/Shanghai')
const generatedAt = ref('')
const loading = ref(false)
const rangePreset = ref<RangePreset>('1h')
const tenantId = ref<number | string>('')
const dateRange = ref<[string, string]>(['', ''])
const queueOptions: QueueOption[] = [
  { code: 'training', name: '训练' },
  { code: 'digital_human_video', name: '数字人生成' },
  { code: 'batch_digital_human_video', name: '批量数字人生成' }
]
const selectedQueueCodes = ref<string[]>(queueOptions.map(item => item.code))
const bucketRows = ref<MetricBucket[]>([])
const summaryRows = ref<SummaryRow[]>([])
const outputChartRef = ref<HTMLElement | null>(null)
const tosChartRef = ref<HTMLElement | null>(null)
let outputChart: echarts.ECharts | null = null
let tosChart: echarts.ECharts | null = null
let refreshTimer: number | null = null

const tableHeaderStyle = { background: '#f7f9fc', color: '#536174', fontWeight: '600' }
const activeQueueCodes = computed(() => selectedQueueCodes.value.length ? selectedQueueCodes.value : queueOptions.map(item => item.code))
const granularity = computed<Granularity>(() => getGranularity(rangePreset.value, dateRange.value))
const granularityLabel = computed(() => ({ '5m': '5 分钟', '1h': '自然小时', '1d': '自然日' }[granularity.value]))
const totalOutputSeconds = computed(() => summaryRows.value.reduce((sum, row) => sum + row.completedOutputSeconds, 0))
const totalUploadBytes = computed(() => summaryRows.value.reduce((sum, row) => sum + row.tosUploadBytes, 0))
const totalDownloadBytes = computed(() => summaryRows.value.reduce((sum, row) => sum + row.tosDownloadBytes, 0))
const totalCompleted = computed(() => summaryRows.value.reduce((sum, row) => sum + row.completedCount, 0))
const totalFailed = computed(() => summaryRows.value.reduce((sum, row) => sum + row.failedCount, 0))

function pad(value: number): string { return String(value).padStart(2, '0') }
function toLocalDateTime(date: Date): string { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` }
function parseDate(value: string | number | Date): Date {
  if (value instanceof Date) return value
  const raw = String(value || '')
  const date = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}
function toApiTime(value: string): string { return value ? `${value.replace(' ', 'T')}+08:00` : '' }
function getNumber(value: any, fallback = 0): number { const number = Number(value); return Number.isFinite(number) ? number : fallback }
function getNullableNumber(value: any): number | null { if (value === null || value === undefined || value === '') return null; const number = Number(value); return Number.isFinite(number) ? number : null }
function queueName(code: string, supplied?: string): string { return supplied || queueOptions.find(item => item.code === code)?.name || code }

function getGranularity(preset: RangePreset, range: [string, string]): Granularity {
  if (preset === '1h') return '5m'
  if (preset === '1d') return '1h'
  if (preset === '1w' || preset === '1m') return '1d'
  const duration = parseDate(range[1]).getTime() - parseDate(range[0]).getTime()
  return duration <= 24 * 60 * 60 * 1000 ? '1h' : '1d'
}

function applyPreset(preset: RangePreset, shouldLoad = true) {
  rangePreset.value = preset
  if (preset === 'custom') return
  const end = new Date()
  const duration = ({ '1h': 60, '1d': 24 * 60, '1w': 7 * 24 * 60, '1m': 30 * 24 * 60 } as Record<string, number>)[preset]
  dateRange.value = [toLocalDateTime(new Date(end.getTime() - duration * 60 * 1000)), toLocalDateTime(end)]
  if (shouldLoad) loadStatistics()
}

function handlePresetChange() { if (rangePreset.value === 'custom') return; applyPreset(rangePreset.value) }

function responseData(response: any): any { return response?.data?.data ?? response?.data ?? {} }
function normalizeMetricRow(item: any, queueCodeHint: string, bucketHint = ''): MetricBucket {
  const queueCode = String(item.queueCode || item.queue_code || queueCodeHint)
  return {
    queueCode,
    queueName: queueName(queueCode, item.queueName || item.queue_name),
    bucketStart: String(item.bucketStart || item.bucket_start || item.hourStart || item.hour_start || item.dayStart || item.day_start || item.time || item.timestamp || bucketHint),
    bucketEnd: item.bucketEnd || item.bucket_end,
    completedOutputSeconds: getNumber(item.completedOutputSeconds ?? item.completed_output_seconds ?? item.outputSeconds ?? item.output_seconds),
    completedCount: getNumber(item.completedCount ?? item.completed_count),
    failedCount: getNumber(item.failedCount ?? item.failed_count),
    averageTaskDurationSeconds: getNullableNumber(item.averageTaskDurationSeconds ?? item.average_task_duration_seconds ?? item.avgDurationSeconds),
    averageWaitSeconds: getNullableNumber(item.averageWaitSeconds ?? item.average_wait_seconds ?? item.avgWaitSeconds),
    tosUploadBytes: getNumber(item.tosUploadBytes ?? item.tos_upload_bytes ?? item.uploadBytes ?? item.upload_bytes),
    tosDownloadBytes: getNumber(item.tosDownloadBytes ?? item.tos_download_bytes ?? item.downloadBytes ?? item.download_bytes),
    invalidCount: getNumber(item.invalidCount ?? item.invalid_count ?? item.invalidTimingCount ?? item.invalid_timing_count) + getNumber(item.invalidOutputDurationCount ?? item.invalid_output_duration_count)
  }
}

function flattenSeries(value: any, queueCodeHint = '', bucketHint = ''): MetricBucket[] {
  if (Array.isArray(value)) return value.flatMap(item => flattenSeries(item, queueCodeHint, bucketHint))
  if (!value || typeof value !== 'object') return []
  const directCode = String(value.queueCode || value.queue_code || queueCodeHint)
  const directBucket = String(value.bucketStart || value.bucket_start || value.hourStart || value.hour_start || value.dayStart || value.day_start || value.time || value.timestamp || bucketHint)
  const nested = value.queues || value.byQueue || value.by_queue || value.queueSeries || value.queue_series
  if (nested) return flattenSeries(nested, '', directBucket)
  const hasMetric = Object.keys(value).some(key => /completed|output|upload|download|failed|average|invalid/i.test(key))
  if (hasMetric && directCode) return [normalizeMetricRow(value, directCode, directBucket)]
  return Object.entries(value).flatMap(([key, child]) => flattenSeries(child, key, directBucket))
}

function alignBucketStart(value: string, gran: Granularity): string {
  const date = parseDate(value)
  if (gran === '5m') date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0)
  else if (gran === '1h') date.setMinutes(0, 0, 0)
  else date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function bucketStarts(start: string, end: string, gran: Granularity): string[] {
  const cursor = parseDate(start)
  const finish = parseDate(end)
  if (gran === '5m') cursor.setMinutes(Math.floor(cursor.getMinutes() / 5) * 5, 0, 0)
  else if (gran === '1h') cursor.setMinutes(0, 0, 0)
  else cursor.setHours(0, 0, 0, 0)
  const step = gran === '5m' ? 5 * 60 * 1000 : gran === '1h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const result: string[] = []
  for (let time = cursor.getTime(); time < finish.getTime(); time += step) result.push(new Date(time).toISOString())
  return result
}

function buildContinuousRows(data: any): MetricBucket[] {
  // 新接口的 series 是“每个时间桶里按队列映射”的图表结构；hourlySeries
  // 是兼容名称，实际会随 granularity 返回逐队列扁平行，更适合统一归一化。
  const raw = flattenSeries(data?.hourlySeries || data?.hourly_series || data?.series || data?.trend || data?.buckets || data?.data?.series || [])
  const starts = bucketStarts(dateRange.value[0], dateRange.value[1], granularity.value)
  const map = new Map<string, MetricBucket>()
  raw.forEach(row => {
    if (!row.bucketStart) return
    const key = `${row.queueCode}|${alignBucketStart(row.bucketStart, granularity.value)}`
    const old = map.get(key)
    if (old) {
      old.completedOutputSeconds += row.completedOutputSeconds
      old.completedCount += row.completedCount
      old.failedCount += row.failedCount
      old.tosUploadBytes += row.tosUploadBytes
      old.tosDownloadBytes += row.tosDownloadBytes
      old.invalidCount += row.invalidCount
    } else map.set(key, { ...row, bucketStart: alignBucketStart(row.bucketStart, granularity.value) })
  })
  return starts.flatMap(start => activeQueueCodes.value.map(code => map.get(`${code}|${start}`) || {
    queueCode: code,
    queueName: queueName(code),
    bucketStart: start,
    completedOutputSeconds: 0,
    completedCount: 0,
    failedCount: 0,
    averageTaskDurationSeconds: null,
    averageWaitSeconds: null,
    tosUploadBytes: 0,
    tosDownloadBytes: 0,
    invalidCount: 0
  }))
}

function buildSummary(rows: MetricBucket[]): SummaryRow[] {
  return activeQueueCodes.value.map(code => {
    const items = rows.filter(item => item.queueCode === code)
    const completed = items.reduce((sum, item) => sum + item.completedCount, 0)
    const durationItems = items.filter(item => item.averageTaskDurationSeconds !== null && item.completedCount > 0)
    const waitItems = items.filter(item => item.averageWaitSeconds !== null && item.completedCount > 0)
    const weighted = (field: 'averageTaskDurationSeconds' | 'averageWaitSeconds', source: MetricBucket[]) => {
      const total = source.reduce((sum, item) => sum + (item[field] || 0) * item.completedCount, 0)
      const count = source.reduce((sum, item) => sum + item.completedCount, 0)
      return count ? total / count : null
    }
    return {
      queueCode: code,
      queueName: queueName(code),
      completedOutputSeconds: items.reduce((sum, item) => sum + item.completedOutputSeconds, 0),
      completedCount: completed,
      failedCount: items.reduce((sum, item) => sum + item.failedCount, 0),
      averageTaskDurationSeconds: weighted('averageTaskDurationSeconds', durationItems),
      averageWaitSeconds: weighted('averageWaitSeconds', waitItems),
      tosUploadBytes: items.reduce((sum, item) => sum + item.tosUploadBytes, 0),
      tosDownloadBytes: items.reduce((sum, item) => sum + item.tosDownloadBytes, 0),
      invalidCount: items.reduce((sum, item) => sum + item.invalidCount, 0)
    }
  })
}

function formatTime(value?: string | null): string { if (!value) return '-'; const date = parseDate(value); return date.getTime() ? date.toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-') : String(value) }
function formatSeconds(value: number | null): string { if (value === null || value === undefined || !Number.isFinite(value)) return '-'; return `${value < 60 ? value.toFixed(value % 1 ? 1 : 0) : (value / 60).toFixed(1)} ${value < 60 ? '秒' : '分钟'}` }
function formatBytes(value: number): string { if (!value) return '0 B'; const units = ['B', 'KB', 'MB', 'GB', 'TB']; const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1); return `${(value / Math.pow(1024, index)).toFixed(index ? 2 : 0)} ${units[index]}` }
function chartLabel(value: string): string { const date = parseDate(value); return granularity.value === '1d' ? `${date.getMonth() + 1}/${date.getDate()}` : `${pad(date.getHours())}:${pad(date.getMinutes())}` }

function renderCharts() {
  nextTick(() => {
    const labels = bucketStarts(dateRange.value[0], dateRange.value[1], granularity.value)
    if (outputChartRef.value) {
      outputChart ||= echarts.init(outputChartRef.value)
      outputChart.setOption({ tooltip: { trigger: 'axis' }, legend: { bottom: 0, type: 'scroll' }, grid: { left: 54, right: 24, top: 28, bottom: 48 }, xAxis: { type: 'category', data: labels.map(chartLabel), boundaryGap: false }, yAxis: { type: 'value', name: '秒' }, series: activeQueueCodes.value.map(code => ({ name: queueName(code), type: 'line', smooth: true, showSymbol: false, data: labels.map(start => bucketRows.value.find(row => row.queueCode === code && row.bucketStart === start)?.completedOutputSeconds || 0) })) }, true)
    }
    if (tosChartRef.value) {
      tosChart ||= echarts.init(tosChartRef.value)
      tosChart.setOption({ tooltip: { trigger: 'axis', valueFormatter: (value: any) => formatBytes(getNumber(value)) }, legend: { bottom: 0, type: 'scroll' }, grid: { left: 64, right: 24, top: 28, bottom: 48 }, xAxis: { type: 'category', data: labels.map(chartLabel), boundaryGap: false }, yAxis: { type: 'value', name: '字节' }, series: activeQueueCodes.value.flatMap(code => [
        { name: `${queueName(code)} 上传`, type: 'line', smooth: true, showSymbol: false, data: labels.map(start => bucketRows.value.find(row => row.queueCode === code && row.bucketStart === start)?.tosUploadBytes || 0) },
        { name: `${queueName(code)} 下载`, type: 'line', smooth: true, showSymbol: false, data: labels.map(start => bucketRows.value.find(row => row.queueCode === code && row.bucketStart === start)?.tosDownloadBytes || 0) }
      ]) }, true)
    }
  })
}

async function loadStatistics(silent = false) {
  if (!isPlatformSuperAdmin.value || loading.value) return
  if (!dateRange.value[0] || !dateRange.value[1]) applyPreset(rangePreset.value, false)
  if (rangePreset.value === 'custom' && (!dateRange.value[0] || !dateRange.value[1])) return ElMessage.warning('请选择自定义时间范围')
  loading.value = true
  try {
    const response = await getTaskQueueEfficiency({ startTime: toApiTime(dateRange.value[0]), endTime: toApiTime(dateRange.value[1]), ...(tenantId.value ? { tenantId: tenantId.value } : {}), ...(selectedQueueCodes.value.length ? { queueCodes: selectedQueueCodes.value } : {}), granularity: granularity.value, preset: rangePreset.value }, silent ? { hideLoading: true, silentError: true } : {})
    const data = responseData(response)
    timezone.value = data.timezone || 'Asia/Shanghai'
    generatedAt.value = data.generatedAt || data.generated_at || new Date().toISOString()
    bucketRows.value = buildContinuousRows(data)
    summaryRows.value = buildSummary(bucketRows.value)
    renderCharts()
  } catch (error: any) {
    if (!silent) ElMessage.error(error?.message || '任务效率统计加载失败')
  } finally { loading.value = false }
}

function handleResize() { outputChart?.resize(); tosChart?.resize() }

onMounted(() => {
  applyPreset('1h', false)
  if (isPlatformSuperAdmin.value) {
    loadStatistics()
    refreshTimer = window.setInterval(() => loadStatistics(true), 60 * 1000)
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (refreshTimer !== null) window.clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  outputChart?.dispose(); tosChart?.dispose()
  outputChart = null; tosChart = null
})
</script>

<style scoped>
.task-statistics-page { width: 100%; min-height: 100%; box-sizing: border-box; padding: clamp(16px, 2vw, 28px); background: #f5f7fb; }
.permission-empty, .page-hero, .filter-card, .data-card { width: 100%; box-sizing: border-box; background: #fff; border: 1px solid #e8edf5; border-radius: 14px; box-shadow: 0 5px 18px rgba(38, 55, 88, .04); }
.permission-empty { display: flex; min-height: 420px; align-items: center; justify-content: center; }
.page-hero { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: clamp(20px, 3vw, 32px); }
.eyebrow { color: #7b8aa1; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.page-hero h1 { margin: 7px 0 0; color: #1f2d43; font-size: clamp(20px, 2vw, 28px); font-weight: 700; }
.page-hero p { margin: 7px 0 0; color: #8c9ab0; font-size: 13px; }
.hero-meta { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 12px; color: #8796aa; font-size: 12px; }
.filter-card { margin-top: 16px; padding: 16px; }
.preset-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.filter-label, .filter-item label { color: #536174; font-size: 12px; font-weight: 600; }
.custom-range { width: min(430px, 100%); }
.filter-grid { display: grid; grid-template-columns: minmax(180px, .8fr) minmax(260px, 1.4fr) auto; align-items: end; gap: 14px; margin-top: 16px; }
.filter-item { min-width: 0; }
.filter-item label { display: block; margin-bottom: 7px; }
.filter-actions { display: flex; gap: 8px; }
.filter-help { margin-top: 12px; color: #93a0b2; font-size: 12px; line-height: 1.6; }
.metric-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
.metric-card { min-width: 0; padding: 18px; border: 1px solid #e8edf5; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(38, 55, 88, .04); }
.metric-card span, .metric-card small { display: block; color: #8c9ab0; font-size: 12px; }
.metric-card strong { display: block; margin: 10px 0 7px; overflow: hidden; color: #2b527e; font-size: 23px; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
.warning-card strong, .danger-text { color: #dd6671; }
.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.chart-card, .summary-card { overflow: hidden; }
.chart-wrap { position: relative; width: 100%; min-height: 360px; }
.chart { width: 100%; height: 360px; }
.chart-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.summary-card { margin-top: 16px; margin-bottom: 20px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 17px; border-bottom: 1px solid #edf1f6; }
.section-heading h2 { margin: 0 0 5px; color: #33445b; font-size: 16px; }
.section-heading span { color: #93a0b2; font-size: 12px; }
.queue-name { color: #3b4b60; font-size: 13px; font-weight: 600; }
.queue-code { margin-top: 3px; color: #9aa7b8; font-size: 11px; }
:deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) { padding: 10px 8px; }
:deep(.el-table .cell) { min-width: 0; }
@media (max-width: 1100px) { .chart-grid { grid-template-columns: 1fr; } .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .filter-actions { justify-content: flex-end; } .metric-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .task-statistics-page { padding: 12px; } .page-hero { align-items: flex-start; flex-direction: column; } .hero-meta { justify-content: flex-start; } .filter-grid, .metric-cards { grid-template-columns: 1fr; } .filter-actions { justify-content: flex-start; } .chart-wrap, .chart { min-height: 300px; height: 300px; } }
</style>
