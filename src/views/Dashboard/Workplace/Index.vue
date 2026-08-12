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
        </div>
      </div>
    </section>
    <el-row :gutter="10" class="overview-grid">
      <el-col :xs="24" :lg="9" :xl="9">
        <section class="summary-panel">
          <div class="section-head summary-section-head">
            <div>
              <h2>任务状态概览</h2>
              <p>按任务类型查看完成、等待、进行中和失败数量</p>
            </div>

            <el-select
              v-model="taskCategory"
              class="summary-task-select"
              placeholder="请选择任务类型"
            >
              <el-option
                v-for="item in taskCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <el-row :gutter="10" class="summary-grid">
            <el-col
              v-for="card in summaryCards"
              :key="card.key"
              :xs="24"
              :sm="12"
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
        </section>
      </el-col>

      <el-col :xs="24" :lg="15" :xl="15">
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

          <div ref="stageChartRef" class="chart stage-chart"></div>

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

    <el-row :gutter="16" class="content-grid">
      <el-col :xs="24">
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
                <p>按任务类型统计每位使用人的完成、等待、失败和平均耗时</p>
              </div>

              <div class="rank-tools">
                <el-select
                  v-model="rankTaskCategory"
                  class="rank-task-select"
                  placeholder="请选择任务类型"
                >
                  <el-option
                    v-for="item in taskCategoryOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>

                <el-tag type="success" effect="light" round>
                  TOP {{ Math.min(3, userRanking.length) }}
                </el-tag>
              </div>
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
              <strong class="pill-value">{{ formatNumber(item.finishedCount) }}</strong>
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

                <el-table-column label="已完成任务" prop="finishedCount" width="120" align="center">
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatNumber(row.finishedCount) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="等待任务" prop="waitingCount" width="110" align="center">
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatNumber(row.waitingCount) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="进行中任务" prop="generatingCount" width="120" align="center">
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatNumber(row.generatingCount) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="失败任务" prop="failedCount" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag type="danger" effect="light" round>
                      {{ formatNumber(row.failedCount) }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column
                  v-if="rankTaskCategory === 'video'"
                  label="视频时长"
                  prop="durationMinutes"
                  width="120"
                  align="center"
                >
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatDuration(row.durationMinutes) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="平均等待时长" prop="avgWaitSeconds" width="140" align="center">
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatSecondsDuration(row.avgWaitSeconds) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="平均生成时长" prop="avgGenerateSeconds" width="140" align="center">
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatSecondsDuration(row.avgGenerateSeconds) }}</span>
                  </template>
                </el-table-column>

                <el-table-column label="平均任务时长" prop="avgTaskSeconds" width="140" align="center">
                  <template #default="{ row }">
                    <span class="metric-number">{{ formatSecondsDuration(row.avgTaskSeconds) }}</span>
                  </template>
                </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useLayoutStore } from '/@/store/modules/layout'
import { echarts, ECOption } from '/@/components/Echart'
import { decodeJwtPayload } from '/@/utils/tools'
import request from '/@/utils/request'
import {
  getVideoDurationStats,
  getBindingStats,
  getDigitalHumanStats,
  getVoiceStats,
  getDigitalHumanTaskStatusStats,
  getFastTaskStatusStats,
  getPlanVideoTaskStatusStats,
  getVideoTaskStatusStats
} from '/@/api/material'

type TaskType = 'generate' | 'human' | 'voice' | 'both'
type TaskResult = 'success' | 'failed'
type RangePresetKey = '7d' | '14d' | '30d' | 'custom'
type StatType = 'duration' | 'binding' | 'digitalHuman' | 'voice' 
const statType = ref<StatType>('duration')
const rankTaskCategory = ref('all')
const statTypeOptions = [
  { label: '视频时长', value: 'duration' },
  { label: '绑定关系', value: 'binding' },
  { label: '数字人', value: 'digitalHuman' },
  { label: '声音', value: 'voice' },
]

const taskCategory = ref('all')

const taskCategoryOptions = [
  {
    label: '全部任务',
    value: 'all'
  },
  {
    label: '同时训练形象加声音',
    value: 'fastTask'
  },
  {
    label: '形象训练',
    value: 'digitalHuman'
  },
  {
    label: '批量数字人生成',
    value: 'planVideo'
  },
  {
    label: '单条生成',
    value: 'video'
  }
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

const getResData = (res: any) => {
  return res?.data?.data || res?.data || {}
}

const sumTaskStats = (list: any[]) => {
  const totalFinished = list.reduce((sum, item) => sum + Number(item.finishedCount || 0), 0)

  return {
    finishedCount: totalFinished,
    waitingCount: list.reduce((sum, item) => sum + Number(item.waitingCount || 0), 0),
    generatingCount: list.reduce((sum, item) => sum + Number(item.generatingCount || 0), 0),
    failedCount: list.reduce((sum, item) => sum + Number(item.failedCount || 0), 0),
    totalCount: list.reduce((sum, item) => sum + Number(item.totalCount || 0), 0),

    avgGenerateSeconds: totalFinished
      ? Math.round(
          list.reduce((sum, item) => {
            return sum + Number(item.avgGenerateSeconds || 0) * Number(item.finishedCount || 0)
          }, 0) / totalFinished
        )
      : 0,

    avgWaitSeconds: totalFinished
      ? Math.round(
          list.reduce((sum, item) => {
            return sum + Number(item.avgWaitSeconds || 0) * Number(item.finishedCount || 0)
          }, 0) / totalFinished
        )
      : 0,

    avgTaskSeconds: totalFinished
      ? Math.round(
          list.reduce((sum, item) => {
            return sum + Number(item.avgTaskSeconds || 0) * Number(item.finishedCount || 0)
          }, 0) / totalFinished
        )
      : 0
  }
}


const backendStats = ref({
  finishedCount: 0,
  waitingCount: 0,
  generatingCount: 0,
  failedCount: 0,
  totalCount: 0,

  fastTaskCount: 0,
  digitalHumanTaskCount: 0,
  planVideoTaskCount: 0,
  videoTaskCount: 0,

  avgGenerateSeconds: 0,
  avgWaitSeconds: 0,
  avgTaskSeconds: 0
})

const taskStatsMap = ref<Record<string, any>>({
  fastTask: {},
  digitalHuman: {},
  planVideo: {},
  video: {}
})


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

const buildVideoDurationMap = (durationOption: any) => {
  const map = new Map<string, number>()

  ;(durationOption?.series || []).forEach((item: any) => {
    const userName = item.name || '未知用户'
    const durationSeconds = sumSeriesData(item)
    map.set(userName, Math.round(durationSeconds / 60))
  })

  return map
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
  user_id?: number
  user: string
  team: string

  finishedCount: number
  waitingCount: number
  generatingCount: number
  failedCount: number
  totalCount: number

  avgGenerateSeconds: number
  avgWaitSeconds: number
  avgTaskSeconds: number

  durationMinutes: number
}

const layoutStore = useLayoutStore()
const router = useRouter()
const currentUser = computed(() => layoutStore.getUserInfo.name || '管理员')
const tokenPayload = computed(() => decodeJwtPayload<any>(sessionStorage.getItem('token')))
const currentUserId = computed(() => {
  const payload = tokenPayload.value
  const userInfo = layoutStore.getUserInfo as any
  return payload?.user_id ?? payload?.userId ?? userInfo.user_id ?? userInfo.userid ?? userInfo.userId ?? userInfo.id
})

const redirectIfNoDashboardAccess = () => {
  const userId = Number(currentUserId.value)

  if (userId === 1) return false

  if (!Number.isFinite(userId)) return false

  if (router.hasRoute('MaterialManagement')) {
    router.replace({ name: 'MaterialManagement' })
  } else {
    router.replace('/PriorDisposal/MaterialManagement')
  }

  return true
}

const presetOptions: Array<{ key: RangePresetKey; label: string; days: number }> = [
  { key: '7d', label: '近 7 天', days: 7 },
  { key: '14d', label: '近 14 天', days: 14 },
  { key: '30d', label: '近 30 天', days: 30 }
]

const formatSecondsDuration = (seconds: number) => {
  if (!seconds) return '0秒'

  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  if (hours) {
    return remainSeconds
      ? `${hours}小时${pad(remainMinutes)}分${pad(remainSeconds)}秒`
      : `${hours}小时${pad(remainMinutes)}分`
  }

  if (minutes) {
    return remainSeconds
      ? `${minutes}分${pad(remainSeconds)}秒`
      : `${minutes}分`
  }

  return `${seconds}秒`
}

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

    const params = {
      start_date: rangeKeys.value.startKey,
      end_date: rangeKeys.value.endKey
    }

    const [
      durationRes,
      bindingRes,
      digitalHumanRes,
      voiceRes,

      digitalHumanTaskRes,
      fastTaskRes,
      planVideoTaskRes,
      videoTaskRes
    ] = await Promise.all([
      getVideoDurationStats({ xAxis, title: '视频时长统计' }),
      getBindingStats({ xAxis, title: '绑定关系统计' }),
      getDigitalHumanStats({ xAxis, title: '数字人统计' }),
      getVoiceStats({ xAxis, title: '声音统计' }),

      getDigitalHumanTaskStatusStats(params),
      getFastTaskStatusStats(params),
      getPlanVideoTaskStatusStats(params),
      getVideoTaskStatusStats(params)
    ])

    const durationOption = durationRes.data?.data || durationRes.data
    const bindingOption = bindingRes.data?.data || bindingRes.data
    const digitalHumanOption = digitalHumanRes.data?.data || digitalHumanRes.data
    const voiceOption = voiceRes.data?.data || voiceRes.data

    const digitalHumanStats = getResData(digitalHumanTaskRes)
    const fastTaskStats = getResData(fastTaskRes)
    const planVideoStats = getResData(planVideoTaskRes)
    const videoStats = getResData(videoTaskRes)

    const totalStats = sumTaskStats([
      digitalHumanStats,
      fastTaskStats,
      planVideoStats,
      videoStats
    ])

    backendStats.value = {
      ...totalStats,
      fastTaskCount: fastTaskStats.totalCount || 0,
      digitalHumanTaskCount: digitalHumanStats.totalCount || 0,
      planVideoTaskCount: planVideoStats.totalCount || 0,
      videoTaskCount: videoStats.totalCount || 0
    }

    const optionMap: Record<StatType, any> = {
      duration: durationOption,
      binding: bindingOption,
      digitalHuman: digitalHumanOption,
      voice: voiceOption
    }

    taskStatsMap.value = {
      fastTask: fastTaskStats,
      digitalHuman: digitalHumanStats,
      planVideo: planVideoStats,
      video: videoStats
    }

    const videoDurationMap = buildVideoDurationMap(durationOption)
    ;(taskStatsMap.value.video?.users || []).forEach((row: any) => {
      row.durationMinutes = videoDurationMap.get(row.user || '未知用户') || 0
    })



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



const finishedCount = computed(() => backendStats.value.finishedCount)
const waitingCount = computed(() => backendStats.value.waitingCount)
const generatingCount = computed(() => backendStats.value.generatingCount)
const failedCount = computed(() => backendStats.value.failedCount)
const totalTasks = computed(() => backendStats.value.totalCount)

const fastTaskCount = computed(() => backendStats.value.fastTaskCount)
const digitalHumanTaskCount = computed(() => backendStats.value.digitalHumanTaskCount)
const planVideoTaskCount = computed(() => backendStats.value.planVideoTaskCount)
const videoTaskCount = computed(() => backendStats.value.videoTaskCount)
const preprocessTotal = computed(() =>
  fastTaskCount.value + digitalHumanTaskCount.value
)

const avgDurationMinutes = computed(() =>
  Math.round((backendStats.value.avgTaskSeconds || 0) / 60)
)

const currentTaskStats = computed(() => {

  if (taskCategory.value === 'all') {
    return backendStats.value
  }

  return (
    taskStatsMap.value[
      taskCategory.value as keyof typeof taskStatsMap.value
    ] || {}
  )
})

const mergeUsersFromStats = (statsList: any[]) => {
  const userMap = new Map<string, UserSummary>()

  const ensureUser = (row: any) => {
    const key = String(row.user_id ?? row.user ?? 'unknown')

    if (!userMap.has(key)) {
      userMap.set(key, {
        user_id: row.user_id,
        user: row.user || '未知用户',
        team: '默认分组',

        finishedCount: 0,
        waitingCount: 0,
        generatingCount: 0,
        failedCount: 0,
        totalCount: 0,

        avgGenerateSeconds: 0,
        avgWaitSeconds: 0,
        avgTaskSeconds: 0,

        durationMinutes: 0
      })
    }

    return userMap.get(key)!
  }

  statsList.forEach(stats => {
    ;(stats?.users || []).forEach((row: any) => {
      const user = ensureUser(row)

      const oldFinished = user.finishedCount
      const addFinished = Number(row.finishedCount || 0)
      const newFinished = oldFinished + addFinished

      user.finishedCount += addFinished
      user.waitingCount += Number(row.waitingCount || 0)
      user.generatingCount += Number(row.generatingCount || 0)
      user.failedCount += Number(row.failedCount || 0)
      user.totalCount += Number(row.totalCount || 0)
      user.durationMinutes += Number(row.durationMinutes || 0)

      if (newFinished > 0) {
        user.avgGenerateSeconds = Math.round(
          (
            user.avgGenerateSeconds * oldFinished +
            Number(row.avgGenerateSeconds || 0) * addFinished
          ) / newFinished
        )

        user.avgWaitSeconds = Math.round(
          (
            user.avgWaitSeconds * oldFinished +
            Number(row.avgWaitSeconds || 0) * addFinished
          ) / newFinished
        )

        user.avgTaskSeconds = Math.round(
          (
            user.avgTaskSeconds * oldFinished +
            Number(row.avgTaskSeconds || 0) * addFinished
          ) / newFinished
        )
      }
    })
  })

  return Array.from(userMap.values()).sort((a, b) => {
    return (
      b.finishedCount - a.finishedCount ||
      b.totalCount - a.totalCount ||
      b.failedCount - a.failedCount
    )
  })
}

const summaryCards = computed(() => [
  {
    key: 'finished',
    label: '已完成任务',
    value: formatNumber(
      currentTaskStats.value.finishedCount || 0
    ),
    note: `单条生成 ${formatNumber(videoTaskCount.value)} · 批量数字人生成 ${formatNumber(planVideoTaskCount.value)}`,
    badge: '视频产出',
    tone: 'tone-blue'
  },
  {
    key: 'waiting',
    label: '等待中任务',
    value: formatNumber(
      currentTaskStats.value.waitingCount || 0
    ),
    note: `平均等待 ${formatSecondsDuration(backendStats.value.avgWaitSeconds)}`,
    badge: '等待中',
    tone: 'tone-cyan'
  },
  {
    key: 'generating',
    label: '进行中任务',
    value: formatNumber(
      currentTaskStats.value.generatingCount || 0
    ),
    note: `平均生成 ${formatSecondsDuration(backendStats.value.avgGenerateSeconds)}`,
    badge: '生成中',
    tone: 'tone-amber'
  },
  {
    key: 'failed',
    label: '失败任务',
     value: formatNumber(
      currentTaskStats.value.failedCount || 0
    ),
    note: `平均任务时长 ${formatSecondsDuration(backendStats.value.avgTaskSeconds)}`,
    badge: '风险指标',
    tone: 'tone-rose'
  }
])

const userRanking = computed<UserSummary[]>(() => {
  if (rankTaskCategory.value === 'all') {
    return mergeUsersFromStats([
      taskStatsMap.value.fastTask,
      taskStatsMap.value.digitalHuman,
      taskStatsMap.value.planVideo,
      taskStatsMap.value.video
    ])
  }

  return mergeUsersFromStats([
    taskStatsMap.value[rankTaskCategory.value as keyof typeof taskStatsMap.value]
  ])
})

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

const stageRows = computed(() => {
  const rows = [
    {
      key: 'fastTask',
      label: '同时训练形象加声音',
      desc: '形象与声音同时训练任务数',
      value: fastTaskCount.value,
      color: '#8b5cf6'
    },
    {
      key: 'digitalHuman',
      label: '形象训练',
      desc: '形象训练任务数',
      value: digitalHumanTaskCount.value,
      color: '#14b8a6'
    },
    {
      key: 'planVideo',
      label: '批量数字人生成',
      desc: '批量数字人生成任务数',
      value: planVideoTaskCount.value,
      color: '#f59e0b'
    },
    {
      key: 'video',
      label: '单条生成',
      desc: '单条生成任务数',
      value: videoTaskCount.value,
      color: '#2563eb'
    }
  ]

  const maxValue = Math.max(...rows.map(item => item.value), 1)

  return rows.map(item => ({
    ...item,
    percentage: Math.round((item.value / maxValue) * 100)
  }))
})

const trendChartRef = ref<HTMLDivElement | null>(null)
const stageChartRef = ref<HTMLDivElement | null>(null)
let trendChart: echarts.ECharts | null = null
let stageChart: echarts.ECharts | null = null

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



const createStageOption = (): ECOption => ({
  color: stageRows.value.map(item => item.color),
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: (params: any) => {
      const item = params?.[0]
      if (!item) return ''
      return `${item.name}<br/>任务数：${formatNumber(item.value)}`
    }
  },
  grid: {
    left: 8,
    right: 8,
    top: 16,
    bottom: 36,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: stageRows.value.map(item => item.label),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dbe3f0' } },
    axisLabel: {
      color: '#64748b',
      fontSize: 11,
      interval: 0,
      formatter: (value: string) => value.replace('同时训练', '同时\n训练').replace('批量数字人生成', '批量数字人\n生成').replace('单条生成', '单条\n生成')
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#64748b',
      fontSize: 11
    },
    splitLine: {
      lineStyle: { color: 'rgba(148, 163, 184, 0.18)' }
    }
  },
  series: [
    {
      name: '任务数',
      type: 'bar',
      barMaxWidth: 34,
      data: stageRows.value.map(item => ({
        value: item.value,
        itemStyle: {
          color: item.color,
          borderRadius: [8, 8, 0, 0]
        }
      }))
    }
  ]
})

const renderCharts = () => {
  if (stageChartRef.value) {
    if (!stageChart) {
      stageChart = echarts.init(stageChartRef.value)
    }
    stageChart.setOption(createStageOption(), true)
  }
}

const handleResize = () => {
  trendChart?.resize()
  stageChart?.resize()
}

watch([rangeKeys, statType], async () => {
  if (redirectIfNoDashboardAccess()) return
  await fetchDashboardData()
}, { deep: true, immediate: true })

watch(stageRows, async () => {
  await nextTick()
  renderCharts()
}, { deep: true })

onMounted(async () => {
  if (redirectIfNoDashboardAccess()) return
  await nextTick()
  renderCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  stageChart?.dispose()
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
  align-items: flex-start;
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

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
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
  align-items: flex-end;
  justify-content: flex-start;
  gap: 12px;
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

.overview-grid {
  align-items: stretch;
}

.overview-grid > .el-col {
  display: flex;
  align-items: stretch;
}

.summary-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding: 0;
}

.summary-task-select {
  width: 180px;
}

.summary-section-head {
  align-items: center;
  min-height: 46px;
  gap: 10px;
}

.summary-section-head h2 {
  font-size: 16px;
}

.summary-section-head p {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.35;
}

@media (max-width: 768px) {
  .summary-task-select {
    width: 100%;
  }
}

.summary-grid {
  flex: 1;
  align-content: stretch;
  margin-top: 8px;
  row-gap: 8px;
}

:deep(.summary-grid .el-col) {
  display: flex;
}

.summary-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 92px;
  padding: 10px 11px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.045);
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
  gap: 6px;
}

.summary-label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.summary-badge {
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.05;
  color: #0f172a;
}

.summary-note {
  min-height: 28px;
  font-size: 11px;
  line-height: 1.35;
  color: #64748b;
}

.content-grid {
  align-items: flex-start;
}

.content-grid {
  margin-top: 2px;
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

.stage-card {
  width: 100%;
  height: 100%;
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

.stage-chart {
  height: 230px;
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

.stage-foot {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.stage-foot > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 11px;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.8);
}

.stage-foot span {
  font-size: 12px;
  color: #64748b;
}

.stage-foot strong {
  font-size: 16px;
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
  .overview-grid {
    row-gap: 12px;
  }

  .summary-section-head {
    align-items: flex-start;
    flex-direction: column;
  }

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

  .stage-chart {
    height: 220px;
  }

  .stage-foot {
    grid-template-columns: 1fr;
  }

  .top-pill {
    width: 100%;
  }
}
.rank-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-task-select {
  width: 240px;
}

@media (max-width: 768px) {
  .rank-tools {
    width: 100%;
    align-items: stretch;
  }

  .rank-task-select {
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
