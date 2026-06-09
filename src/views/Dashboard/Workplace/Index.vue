<template>
  <div class="workplace-dashboard">
    <section class="hero-shell">
      <div class="hero-orb hero-orb-a"></div>
      <div class="hero-orb hero-orb-b"></div>

      <div class="hero-content">
        <div class="hero-copy">
          <p class="hero-kicker">Dashboard / Workplace</p>
          <div class="hero-greeting">{{ currentUser }}，今天先看整体产出。</div>
          <h1>内容生成看板</h1>
          <p class="hero-description">
            这页专注展示前期处理和生成环节的核心产出，按所选时间范围统计每位使用人的生成视频个数、总时长、失败数，以及形象训练、音频训练和联合训练的分布。
          </p>

          <div class="hero-meta">
            <div class="hero-meta-item">
              <span>当前范围</span>
              <strong>{{ rangeLabel }}</strong>
            </div>
            <div class="hero-meta-item">
              <span>覆盖使用人</span>
              <strong>{{ userRanking.length }} 位</strong>
            </div>
            <div class="hero-meta-item">
              <span>任务记录</span>
              <strong>{{ formatNumber(totalTasks) }} 条</strong>
            </div>
          </div>
        </div>

        <div class="hero-filters">
          <div class="preset-row">
            <el-button
              v-for="preset in presetOptions"
              :key="preset.key"
              :type="activePreset === preset.key ? 'primary' : 'default'"
              round
              @click="applyPreset(preset.key)"
            >
              {{ preset.label }}
            </el-button>
          </div>

          
          <el-date-picker
            v-model="selectedRange"
            class="range-picker"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            @change="handleCustomRangeChange"
          />
        </div>
      </div>
    </section>

    <el-row :gutter="16" class="summary-grid">
      <el-col
        v-for="card in summaryCards"
        :key="card.key"
        :xs="24"
        :sm="12"
        :xl="6"
      >
        <div class="summary-card" :class="card.tone">
          <div class="summary-head">
            <span class="summary-label">{{ card.label }}</span>
            <span class="summary-badge">{{ card.badge }}</span>
          </div>
          <div class="summary-value">{{ card.value }}</div>
          <div class="summary-note">{{ card.note }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-grid">
      <el-col :xs="24" :xl="16">
        <el-card class="glass-card trend-card" shadow="never">

          <template #header>
            <div class="section-head trend-section-head">
              <div>
                <h2>产出趋势</h2>
                <p>按天观察不同统计类型的人员趋势</p>
              </div>

              <div class="trend-tools">
                <el-select
                  v-model="statType"
                  class="trend-stat-select"
                  placeholder="请选择统计类型"
                >
                  <el-option
                    v-for="item in statTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>

                <el-tag effect="light" round>近 {{ rangeDays }} 天</el-tag>
              </div>
            </div>
          </template>

          <div ref="trendChartRef" class="chart chart-large"></div>
        </el-card>

        <el-card class="glass-card rank-card" shadow="never">
          <template #header>
            <div class="section-head">
              <div>
                <h2>使用人排行</h2>
                <p>按生成视频数排序，统计每位使用人的视频时长、形象训练、音频训练和联合训练</p>
              </div>
              <el-tag type="success" effect="light" round>TOP {{ Math.min(3, userRanking.length) }}</el-tag>
            </div>
          </template>

          <div class="top-pills">
            <div
              v-for="(item, index) in userRanking.slice(0, 3)"
              :key="item.user"
              class="top-pill"
            >
              <span class="pill-index">#{{ index + 1 }}</span>
              <div class="pill-body">
                <div class="pill-name">{{ item.user }}</div>
                <div class="pill-meta">{{ item.team }}</div>
              </div>
              <strong class="pill-value">{{ formatNumber(item.generatedCount) }}</strong>
            </div>
          </div>

          <div class="table-shell">
            <el-table
              :data="userRanking"
              stripe
              height="520"
              class="rank-table"
            >
              <el-table-column label="使用人" min-width="180">
                <template #default="{ row }">
                  <div class="user-cell">
                    <div class="user-avatar">{{ row.user.slice(0, 1) }}</div>
                    <div>
                      <div class="user-name">{{ row.user }}</div>
                      <div class="user-team">{{ row.team }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="生成视频" prop="generatedCount" width="110" align="center">
                <template #default="{ row }">
                  <span class="metric-number">{{ formatNumber(row.generatedCount) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="视频时长" prop="durationMinutes" width="120" align="center">
                <template #default="{ row }">
                  <span class="metric-number">{{ formatDuration(row.durationMinutes) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="失败数" prop="failedCount" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="danger" effect="light" round>
                    {{ formatNumber(row.failedCount) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="前期处理" min-width="240">
                <template #default="{ row }">
                  <div class="process-tags">
                    <el-tag effect="light" round class="process-tag tag-human">
                      形象 {{ formatNumber(row.humanCount) }}
                    </el-tag>
                    <el-tag effect="light" round class="process-tag tag-voice">
                      音频 {{ formatNumber(row.voiceCount) }}
                    </el-tag>
                    <el-tag effect="light" round class="process-tag tag-both">
                      联合 {{ formatNumber(row.bothCount) }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="成功率" width="140" align="center">
                <template #default="{ row }">
                  <div class="rate-cell">
                    <el-progress
                      :percentage="row.successRate"
                      :show-text="false"
                      :stroke-width="8"
                      :color="row.successRate >= 90 ? '#14b8a6' : row.successRate >= 75 ? '#f59e0b' : '#ef4444'"
                    />
                    <span>{{ row.successRate }}%</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="8">
        <el-card class="glass-card pie-card" shadow="never">
          <template #header>
            <div class="section-head">
              <div>
                <h2>任务构成</h2>
                <p>生成与训练类任务在当前区间内的占比</p>
              </div>
              <el-tag type="warning" effect="light" round>合计 {{ formatNumber(typeTotal) }}</el-tag>
            </div>
          </template>

          <div ref="pieChartRef" class="chart chart-medium"></div>
        </el-card>

        <el-card class="glass-card stage-card" shadow="never">
          <template #header>
            <div class="section-head">
              <div>
                <h2>阶段透视</h2>
                <p>把关键环节拆开看，便于快速判断瓶颈</p>
              </div>
              <el-tag effect="light" round>归一化展示</el-tag>
            </div>
          </template>

          <div class="stage-list">
            <div
              v-for="item in stageRows"
              :key="item.key"
              class="stage-row"
            >
              <div class="stage-row-head">
                <div>
                  <div class="stage-name">{{ item.label }}</div>
                  <div class="stage-desc">{{ item.desc }}</div>
                </div>
                <strong class="stage-value">{{ formatNumber(item.value) }}</strong>
              </div>
              <el-progress
                :percentage="item.percentage"
                :show-text="false"
                :stroke-width="10"
                :color="item.color"
              />
            </div>
          </div>

          <div class="stage-foot">
            <div>
              <span>前期处理总数</span>
              <strong>{{ formatNumber(preprocessTotal) }}</strong>
            </div>
            <div>
              <span>失败任务</span>
              <strong>{{ formatNumber(failedCount) }}</strong>
            </div>
            <div>
              <span>平均时长</span>
              <strong>{{ formatDuration(avgDurationMinutes) }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useLayoutStore } from '/@/store/modules/layout'
import { echarts, ECOption } from '/@/components/Echart'
import request from '/@/utils/request'
import {
  getVideoDurationStats,
  getBindingStats,
  getDigitalHumanStats,
  getVoiceStats,
  getFailedTaskStats
} from '/@/api/material'

type TaskType = 'generate' | 'human' | 'voice' | 'both'
type TaskResult = 'success' | 'failed'
type RangePresetKey = '7d' | '14d' | '30d' | 'custom'
type StatType = 'duration' | 'binding' | 'digitalHuman' | 'voice' | 'failed'
const statType = ref<StatType>('duration')

const statTypeOptions = [
  { label: '视频时长', value: 'duration' },
  { label: '绑定关系', value: 'binding' },
  { label: '数字人', value: 'digitalHuman' },
  { label: '声音', value: 'voice' },
  { label: '失败任务', value: 'failed' }
]

const apiMap = {
  duration: getVideoDurationStats,
  binding: getBindingStats,
  digitalHuman: getDigitalHumanStats,
  voice: getVoiceStats
}

const titleMap = {
  duration: '视频时长统计',
  binding: '绑定关系统计',
  digitalHuman: '数字人统计',
  voice: '声音统计'
}


const backendStats = ref({
  videoDuration: 0,
  videoCount: 0,
  bindingCount: 0,
  digitalHumanCount: 0,
  voiceCount: 0,
  failedCount: 0
})
const backendUserRanking = ref<UserSummary[]>([])

const sumOptionSeries = (option: any) => {
  const series = option?.series || []
  return series.reduce((total: number, item: any) => {
    const data = item?.data || []
    return total + data.reduce((sum: number, value: any) => {
      return sum + Number(value || 0)
    }, 0)
  }, 0)
}

const sumSeriesData = (seriesItem: any) => {
  return (seriesItem?.data || []).reduce((sum: number, value: any) => {
    return sum + Number(value || 0)
  }, 0)
}

const countSeriesPositiveDays = (seriesItem: any) => {
  return (seriesItem?.data || []).filter((value: any) => Number(value || 0) > 0).length
}

const buildUserRankingFromOptions = (
  durationOption: any,
  bindingOption: any,
  digitalHumanOption: any,
  voiceOption: any,
  failedOption: any
) => {
  const userMap = new Map<string, UserSummary>()

  const ensureUser = (name: string) => {
    if (!userMap.has(name)) {
      userMap.set(name, {
        user: name,
        team: '默认分组',
        generatedCount: 0,
        durationMinutes: 0,
        failedCount: 0,
        humanCount: 0,
        voiceCount: 0,
        bothCount: 0,
        totalCount: 0,
        successRate: 100
      })
    }

    return userMap.get(name)!
  }

  ;(durationOption?.series || []).forEach((item: any) => {
    const user = ensureUser(item.name || '未知用户')

    const durationSeconds = sumSeriesData(item)

    // 生成视频数量：目前先按“有视频时长的日期数量”算
    // 如果后端以后能返回真实视频 count，这里再换成真实 count
    user.generatedCount += countSeriesPositiveDays(item)

    // 后端 video_duration 如果是秒，这里转分钟
    user.durationMinutes += Math.round(durationSeconds / 60)
  })

  ;(digitalHumanOption?.series || []).forEach((item: any) => {
    const user = ensureUser(item.name || '未知用户')
    user.humanCount += sumSeriesData(item)
  })

  ;(voiceOption?.series || []).forEach((item: any) => {
    const user = ensureUser(item.name || '未知用户')
    user.voiceCount += sumSeriesData(item)
  })

  ;(bindingOption?.series || []).forEach((item: any) => {
    const user = ensureUser(item.name || '未知用户')
    user.bothCount += sumSeriesData(item)
  })

  ;(failedOption?.series || []).forEach((item: any) => {
  const user = ensureUser(item.name || '未知用户')
  user.failedCount += sumSeriesData(item)
  })

const rows = Array.from(userMap.values()).map(item => {
  const successRate =
    item.generatedCount > 0
      ? Math.max(
          0,
          Math.round(
            ((item.generatedCount - item.failedCount) / item.generatedCount) * 100
          )
        )
      : 100

  return {
    ...item,
    totalCount:
      item.generatedCount +
      item.humanCount +
      item.voiceCount +
      item.bothCount,
    successRate
  }
})

  return rows.sort((left, right) => {
    return (
      right.generatedCount - left.generatedCount ||
      right.durationMinutes - left.durationMinutes ||
      right.totalCount - left.totalCount
    )
  })
}

const beautifyTrendOption = (option: any) => {
  return {
    ...option,

    // 不用后端 title，避免和 legend 挤一起
    title: {
      show: false
    },

    legend: {
      type: 'scroll',
      top: 4,
      left: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      pageIconColor: '#2563eb',
      pageTextStyle: {
        color: '#64748b'
      },
      textStyle: {
        color: '#475569',
        fontSize: 12
      }
    },

    grid: {
      left: '3%',
      right: '4%',
      bottom: 42,
      top: 82,
      containLabel: true
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },

    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        type: 'slider',
        height: 18,
        bottom: 8,
        start: 0,
        end: 100
      }
    ],

    series: (option?.series || []).map((item: any) => ({
      ...item,
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: {
        width: 2
      }
    }))
  }
}

interface DashboardRecord {
  dateKey: string
  user: string
  team: string
  taskType: TaskType
  result: TaskResult
  taskCount: number
  generatedVideos: number
  durationMinutes: number
}

interface UserSummary {
  user: string
  team: string
  generatedCount: number
  durationMinutes: number
  failedCount: number
  humanCount: number
  voiceCount: number
  bothCount: number
  totalCount: number
  successRate: number
}

const layoutStore = useLayoutStore()
const currentUser = computed(() => layoutStore.getUserInfo.name || '管理员')

const presetOptions: Array<{ key: RangePresetKey; label: string; days: number }> = [
  { key: '7d', label: '近 7 天', days: 7 },
  { key: '14d', label: '近 14 天', days: 14 },
  { key: '30d', label: '近 30 天', days: 30 }
]

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const cloneDate = (date: Date) => new Date(date.getTime())
const shiftDays = (date: Date, days: number) => {
  const next = cloneDate(date)
  next.setDate(next.getDate() + days)
  return startOfDay(next)
}
const pad = (value: number) => String(value).padStart(2, '0')
const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const formatDisplayDate = (dateKey: string) => dateKey.replace(/-/g, '.')
const formatShortDate = (dateKey: string) => dateKey.slice(5).replace('-', '/')
const parseDateKey = (dateKey: string) => new Date(`${dateKey}T00:00:00`)
const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)

const formatDuration = (minutes: number) => {
  if (!minutes) return '0分'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder}分`
  return remainder ? `${hours}小时${pad(remainder)}分` : `${hours}小时`
}

const formatRate = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}

const enumerateDateKeys = (startKey: string, endKey: string) => {
  const dates: string[] = []
  let cursor = parseDateKey(startKey)
  const end = parseDateKey(endKey)

  while (cursor.getTime() <= end.getTime()) {
    dates.push(formatDateKey(cursor))
    cursor = shiftDays(cursor, 1)
  }

  return dates
}

const today = startOfDay(new Date())
const selectedRange = ref<[Date, Date]>([shiftDays(today, -13), cloneDate(today)])
const activePreset = ref<RangePresetKey>('14d')
const loading = ref(false)

const allRecords = ref<DashboardRecord[]>([])

const applyPreset = (key: RangePresetKey) => {
  activePreset.value = key
  const preset = presetOptions.find(item => item.key === key)
  if (!preset) return
  selectedRange.value = [shiftDays(today, -(preset.days - 1)), cloneDate(today)]
}

const handleCustomRangeChange = (value: [Date, Date] | null) => {
  if (!value || value.length < 2) return
  selectedRange.value = [startOfDay(value[0]), startOfDay(value[1])]
  activePreset.value = 'custom'
}

const rangeKeys = computed(() => {
  const startKey = formatDateKey(selectedRange.value[0])
  const endKey = formatDateKey(selectedRange.value[1])
  return { startKey, endKey }
})

const rangeLabel = computed(() => `${formatDisplayDate(rangeKeys.value.startKey)} - ${formatDisplayDate(rangeKeys.value.endKey)}`)
const rangeDays = computed(() => enumerateDateKeys(rangeKeys.value.startKey, rangeKeys.value.endKey).length)

const fetchDashboardData = async () => {
  try {
    loading.value = true

    const xAxis = enumerateDateKeys(
      rangeKeys.value.startKey,
      rangeKeys.value.endKey
    )

  const [durationRes, bindingRes, digitalHumanRes, voiceRes, failedRes] = await Promise.all([
    getVideoDurationStats({ xAxis, title: '视频时长统计' }),
    getBindingStats({ xAxis, title: '绑定关系统计' }),
    getDigitalHumanStats({ xAxis, title: '数字人统计' }),
    getVoiceStats({ xAxis, title: '声音统计' }),
    getFailedTaskStats({ xAxis, title: '失败任务统计' })
  ])

    const durationOption = durationRes.data?.data || durationRes.data
    const bindingOption = bindingRes.data?.data || bindingRes.data
    const digitalHumanOption = digitalHumanRes.data?.data || digitalHumanRes.data
    const voiceOption = voiceRes.data?.data || voiceRes.data
    const failedOption = failedRes.data?.data || failedRes.data
    const durationSeconds = sumOptionSeries(durationOption)

   backendStats.value = {
      videoCount: (durationOption?.series || []).reduce((total: number, item: any) => {
        return total + (item?.data || []).filter((value: any) => Number(value || 0) > 0).length
      }, 0),

      videoDuration: Math.round(durationSeconds / 60),

      bindingCount: sumOptionSeries(bindingOption),
      digitalHumanCount: sumOptionSeries(digitalHumanOption),
      voiceCount: sumOptionSeries(voiceOption),
      failedCount: failedOption?.totalCount || sumOptionSeries(failedOption)
   }

    backendUserRanking.value = buildUserRankingFromOptions(
      durationOption,
      bindingOption,
      digitalHumanOption,
      voiceOption,
      failedOption
    )

    const optionMap: Record<StatType, any> = {
      duration: durationOption,
      binding: bindingOption,
      digitalHuman: digitalHumanOption,
      voice: voiceOption,
      failed: failedOption
    }

    await nextTick()

    if (trendChartRef.value) {
      if (!trendChart) {
        trendChart = echarts.init(trendChartRef.value)
      }

      trendChart.setOption(
        beautifyTrendOption(optionMap[statType.value]),
        true
      )
    }
  } catch (error) {
    console.error('看板统计数据获取失败：', error)
    ElMessage.error('获取看板数据失败')
  } finally {
    loading.value = false
  }
}

const filteredRecords = computed(() =>
  allRecords.value.filter(item => item.dateKey >= rangeKeys.value.startKey && item.dateKey <= rangeKeys.value.endKey)
)

const totalGeneratedVideos = computed(() => backendStats.value.videoCount)
const totalDurationMinutes = computed(() => backendStats.value.videoDuration)
const humanCount = computed(() => backendStats.value.digitalHumanCount)
const voiceCount = computed(() => backendStats.value.voiceCount)
const bothCount = computed(() => backendStats.value.bindingCount)
const preprocessTotal = computed(() =>
  humanCount.value + voiceCount.value + bothCount.value
)
const totalTasks = computed(() =>
  totalGeneratedVideos.value + preprocessTotal.value
)
const failedCount = computed(() => backendStats.value.failedCount)
const avgDurationMinutes = computed(() => totalGeneratedVideos.value ? Math.round(totalDurationMinutes.value / totalGeneratedVideos.value) : 0)
const failureRate = computed(() =>
  formatRate(failedCount.value, totalGeneratedVideos.value)
)
const successRate = computed(() =>
  totalGeneratedVideos.value
    ? Math.max(0, 100 - failureRate.value)
    : 100
)
const typeTotal = computed(() => totalGeneratedVideos.value + humanCount.value + voiceCount.value + bothCount.value)

const summaryCards = computed(() => [
  {
    key: 'videos',
    label: '生成视频',
    value: formatNumber(totalGeneratedVideos.value),
    note: `成功率 ${successRate.value}% · 最近 ${rangeDays.value} 天`,
    badge: '视频产出',
    tone: 'tone-blue'
  },
  {
    key: 'duration',
    label: '总时长',
    value: formatDuration(totalDurationMinutes.value),
    note: `平均 ${formatDuration(avgDurationMinutes.value)} / 条`,
    badge: '时长累计',
    tone: 'tone-cyan'
  },
  {
    key: 'failure',
    label: '失败任务',
    value: formatNumber(failedCount.value),
    note: `失败率 ${failureRate.value}% · 需重点回看`,
    badge: '风险指标',
    tone: 'tone-rose'
  },
  {
    key: 'preprocess',
    label: '前期处理',
    value: formatNumber(preprocessTotal.value),
    note: `形象 ${formatNumber(humanCount.value)} · 音频 ${formatNumber(voiceCount.value)} · 联合 ${formatNumber(bothCount.value)}`,
    badge: '预处理',
    tone: 'tone-amber'
  }
])

const userRanking = computed<UserSummary[]>(() => backendUserRanking.value)
const trendRows = computed(() => {
  const dateKeys = enumerateDateKeys(rangeKeys.value.startKey, rangeKeys.value.endKey)
  const bucket = new Map<string, { generated: number; duration: number; failed: number }>()

  dateKeys.forEach(key => {
    bucket.set(key, { generated: 0, duration: 0, failed: 0 })
  })

  filteredRecords.value.forEach(item => {
    const current = bucket.get(item.dateKey)
    if (!current) return

    current.generated += item.generatedVideos
    current.duration += item.durationMinutes
    if (item.result === 'failed') current.failed += 1
  })

  return dateKeys.map(key => ({
    dateKey: key,
    label: formatShortDate(key),
    generated: bucket.get(key)?.generated || 0,
    duration: bucket.get(key)?.duration || 0,
    failed: bucket.get(key)?.failed || 0
  }))
})

const typeBreakdown = computed(() => [
  { key: 'generate', label: '生成视频', value: totalGeneratedVideos.value, color: '#2563eb' },
  { key: 'human', label: '形象训练', value: humanCount.value, color: '#14b8a6' },
  { key: 'voice', label: '音频训练', value: voiceCount.value, color: '#f59e0b' },
  { key: 'both', label: '联合训练', value: bothCount.value, color: '#8b5cf6' }
])

const stageRows = computed(() => {
  const rows = [
    { key: 'generate', label: '生成视频', desc: '成功生成的视频个数', value: totalGeneratedVideos.value, color: '#2563eb' },
    { key: 'human', label: '形象训练', desc: '形象训练任务数', value: humanCount.value, color: '#14b8a6' },
    { key: 'voice', label: '音频训练', desc: '音频训练任务数', value: voiceCount.value, color: '#f59e0b' },
    { key: 'both', label: '联合训练', desc: '形象与音频同时训练', value: bothCount.value, color: '#8b5cf6' },
    { key: 'failed', label: '失败任务', desc: '失败的总任务数', value: failedCount.value, color: '#ef4444' }
  ]

  const maxValue = Math.max(...rows.map(item => item.value), 1)

  return rows.map(item => ({
    ...item,
    percentage: Math.round((item.value / maxValue) * 100)
  }))
})

const trendChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const createTrendOption = (): ECOption => {
  const gradient = new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
    { offset: 1, color: 'rgba(37, 99, 235, 0)' }
  ])

  return {
    color: ['#ef4444', '#2563eb', '#14b8a6'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      top: 4,
      right: 4,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#64748b' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendRows.value.map(item => item.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#dbe3f0' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 12
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '视频数',
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } }
      },
      {
        type: 'value',
        name: '分钟',
        axisLabel: { color: '#64748b' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '失败数',
        type: 'bar',
        barWidth: 10,
        data: trendRows.value.map(item => item.failed),
        itemStyle: {
          color: 'rgba(239, 68, 68, 0.35)',
          borderRadius: [8, 8, 0, 0]
        }
      },
      {
        name: '成功视频数',
        type: 'line',
        smooth: true,
        data: trendRows.value.map(item => item.generated),
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#2563eb'
        },
        areaStyle: { color: gradient },
        itemStyle: { color: '#2563eb' }
      },
      {
        name: '视频时长',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trendRows.value.map(item => item.duration),
        symbolSize: 8,
        lineStyle: {
          width: 3,
          type: 'dashed',
          color: '#14b8a6'
        },
        itemStyle: { color: '#14b8a6' }
      }
    ]
  }
}

const createPieOption = (): ECOption => ({
  tooltip: { trigger: 'item' },
  legend: {
    bottom: 0,
    left: 'center',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: '#64748b' }
  },
  series: [
    {
      name: '任务构成',
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: false,
      label: {
        color: '#475569',
        formatter: '{b}\n{d}%'
      },
      labelLine: {
        length: 12,
        length2: 10
      },
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 3
      },
      data: typeBreakdown.value.map(item => ({
        name: item.label,
        value: item.value,
        itemStyle: { color: item.color }
      }))
    }
  ]
})

const renderCharts = () => {
  if (pieChartRef.value) {
    if (!pieChart) {
      pieChart = echarts.init(pieChartRef.value)
    }
    pieChart.setOption(createPieOption(), true)
  }
}

const handleResize = () => {
  trendChart?.resize()
  pieChart?.resize()
}

watch([rangeKeys, statType], async () => {
  await fetchDashboardData()
}, { deep: true, immediate: true })

watch([trendRows, typeBreakdown], async () => {
  await nextTick()
  renderCharts()
}, { deep: true })

onMounted(async () => {
  await nextTick()
  renderCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
})
</script>
<style scoped>
.workplace-dashboard {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 48px);
  padding-bottom: 8px;
}

.hero-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(243, 248, 255, 0.96) 58%, rgba(236, 253, 245, 0.94) 100%);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
}

.hero-copy {
  flex: 1 1 60%;
  min-width: 0;
}

.hero-kicker {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #2563eb;
  text-transform: uppercase;
}

.hero-greeting {
  display: inline-flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
}

.hero-copy h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  color: #0f172a;
}

.hero-description {
  max-width: 840px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.hero-meta-item {
  min-width: 156px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(18px);
}

.hero-meta-item span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}

.hero-meta-item strong {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.hero-filters {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  min-width: 0;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.range-picker {
  width: 100%;
}

.summary-grid {
  margin-top: 2px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 18px 18px 20px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
}

.summary-card.tone-blue {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.96));
}

.summary-card.tone-cyan {
  background: linear-gradient(180deg, rgba(236, 254, 255, 0.96), rgba(255, 255, 255, 0.96));
}

.summary-card.tone-rose {
  background: linear-gradient(180deg, rgba(255, 241, 242, 0.96), rgba(255, 255, 255, 0.96));
}

.summary-card.tone-amber {
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.96), rgba(255, 255, 255, 0.96));
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.summary-badge {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
}

.summary-value {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.05;
  color: #0f172a;
}

.summary-note {
  min-height: 36px;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.content-grid {
  align-items: flex-start;
}

.glass-card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.glass-card + .glass-card {
  margin-top: 16px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.section-head p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.chart {
  width: 100%;
}

.chart-large {
  height: 360px;
}

.chart-medium {
  height: 320px;
}

.top-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.top-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.pill-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
}

.pill-body {
  flex: 1;
  min-width: 0;
}

.pill-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.pill-meta {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.pill-value {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.table-shell {
  overflow: hidden;
  border-radius: 18px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(20, 184, 166, 0.18));
  color: #0f172a;
  font-weight: 800;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.user-team {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.metric-number {
  font-weight: 700;
  color: #0f172a;
}

.process-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.process-tag {
  border: 0;
}

.tag-human {
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
}

.tag-voice {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.tag-both {
  background: rgba(139, 92, 246, 0.12);
  color: #6d28d9;
}

.rate-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rate-cell span {
  font-size: 12px;
  color: #475569;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stage-row {
  padding: 14px 14px 15px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.stage-row-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.stage-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.stage-desc {
  margin-top: 3px;
  font-size: 12px;
  color: #64748b;
}

.stage-value {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.stage-foot {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.stage-foot > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 14px 13px;
  border-radius: 16px;
  background: rgba(241, 245, 249, 0.8);
}

.stage-foot span {
  font-size: 12px;
  color: #64748b;
}

.stage-foot strong {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.hero-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(8px);
  pointer-events: none;
}

.hero-orb-a {
  top: -30px;
  right: -20px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0) 70%);
}

.hero-orb-b {
  left: -40px;
  bottom: -60px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.16) 0%, rgba(20, 184, 166, 0) 68%);
}

:deep(.el-card__header) {
  padding: 18px 20px 10px;
  border-bottom: 0;
}

:deep(.el-card__body) {
  padding: 0 20px 20px;
}

:deep(.rank-card .el-card__body),
:deep(.pie-card .el-card__body),
:deep(.stage-card .el-card__body),
:deep(.trend-card .el-card__body) {
  padding-top: 0;
}

:deep(.el-table) {
  --el-table-border-color: rgba(148, 163, 184, 0.14);
  --el-table-header-bg-color: rgba(248, 250, 252, 0.96);
  --el-table-row-hover-bg-color: rgba(239, 246, 255, 0.7);
  color: #334155;
}

:deep(.el-table thead th) {
  font-weight: 700;
  color: #475569;
}

:deep(.el-progress-bar__outer) {
  background: rgba(148, 163, 184, 0.14);
}

@media (max-width: 1200px) {
  .hero-content {
    flex-direction: column;
  }

  .hero-filters {
    flex: 1 1 auto;
  }

  .preset-row {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .hero-content,
  .summary-card,
  .glass-card {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .hero-meta {
    flex-direction: column;
  }

  .hero-meta-item {
    width: 100%;
  }

  .chart-large {
    height: 300px;
  }

  .chart-medium {
    height: 280px;
  }

  .stage-foot {
    grid-template-columns: 1fr;
  }

  .top-pill {
    width: 100%;
  }
}

.trend-section-head {
  align-items: center;
}

.trend-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trend-stat-select {
  width: 180px;
}

:deep(.trend-card .el-card__body) {
  padding-top: 8px;
}

@media (max-width: 768px) {
  .trend-section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .trend-tools {
    width: 100%;
    align-items: stretch;
  }

  .trend-stat-select {
    width: 100%;
  }
}
</style>
