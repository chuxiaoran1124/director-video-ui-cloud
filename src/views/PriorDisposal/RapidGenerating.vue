<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <!-- 顶部状态切换与标题 -->
    <div class="mb-6 flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">快速克隆生成</h1>
        <p class="text-slate-500 text-sm mt-1">一键克隆数字人及声音资产，支持批量任务追踪。</p>
      </div>
      <div v-if="!isCreating">
        <el-button type="primary" size="large" @click="handleCreateNew">
          <el-icon class="mr-1"><el-icon-plus /></el-icon>
          新建克隆任务
        </el-button>
      </div>
      <div v-else>
        <el-button @click="isCreating = false" icon="el-icon-back">返回任务列表</el-button>
      </div>
    </div>

    <!-- 1. 任务列表页面 -->
    <div v-if="!isCreating" class="animate-fade-in">
      <!-- 搜索与筛选工具栏 -->
      <div class="bg-white p-4 rounded-xl shadow-sm mb-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索资产名称..." 
            class="!w-64"
            clearable
          >
            <template #prefix>
              <el-icon class="el-input__icon"><el-icon-search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="任务状态" clearable class="!w-40">
            <el-option label="全部状态" value="" />
            <el-option label="克隆中" value="processing" />
            <el-option label="已成功" value="success" />
            <el-option label="已失败" value="failed" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
           <el-button icon="el-icon-refresh" circle @click="refreshList"></el-button>
        </div>
      </div>

      <!-- 数据概览统计 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
         <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-slate-400 text-xs mb-1">当日总任务</div>
          <div class="text-2xl font-bold text-slate-800">{{ taskStats.total }}</div>
         </div>
         <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div class="text-blue-400 text-xs mb-1">正在处理中</div>
          <div class="text-2xl font-bold text-blue-600">{{ taskStats.processing }}</div>
         </div>
         <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-amber-400 text-xs mb-1">等待中</div>
          <div class="text-2xl font-bold text-amber-600">{{ taskStats.waiting }}</div>
         </div>
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="text-green-400 text-xs mb-1">已处理</div>
          <div class="text-2xl font-bold text-green-600">{{ taskStats.completed }}</div>
         </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <el-table :data="paginatedTaskList" border style="width: 100%" header-cell-class-name="bg-slate-50 font-bold text-slate-700">
          <el-table-column label="资产信息" min-width="220">
            <template #default="scope">
              <div class="flex items-center gap-3 py-1">
                <div>
                  <div class="font-bold text-slate-800">{{ scope.row.name }}</div>
                  <div class="text-xs text-slate-400 font-mono">ID: {{ scope.row.id }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="任务类型" width="120" align="center">
            <template #default>
              <el-tag type="info" size="small" effect="light" class="rounded-full px-4">快速克隆</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="scope">
              <div class="flex items-center justify-center">
                 <span class="w-2 h-2 rounded-full mr-2" :class="getStatusDotClass(scope.row)"></span>
                 <span class="text-sm" :class="getStatusTextClass(scope.row)">{{ getStatusLabel(scope.row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="任务进度" min-width="250">
            <template #default="scope">
              <div v-if="scope.row.taskStatus === 0 || scope.row.taskStatus === 1 || scope.row.taskStatus === 2" class="px-2">
                <div class="flex justify-between text-[10px] text-slate-400 mb-1 leading-none">
                  <span>{{ getProgressText(scope.row.taskStatus) }}</span>
                  <span>{{ scope.row.progress }}%</span>
                </div>
                <el-progress :percentage="scope.row.progress" :stroke-width="8" striped striped-flow :show-text="false" />
              </div>
              <div v-else-if="scope.row.taskStatus === 3" class="text-green-500 text-sm flex items-center gap-1">
                <el-icon><el-icon-circle-check /></el-icon> 已完成
              </div>
              <div v-else-if="scope.row.taskStatus === -1" class="text-red-500 text-sm flex items-center gap-1">
                <el-icon><el-icon-warning /></el-icon> 任务失败
              </div>
              <span v-else class="text-slate-400 text-sm italic">等待中</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="time" width="180" align="center" sortable />
          <el-table-column label="完成时间" width="180" align="center">
            <template #default="scope">
              <span v-if="scope.row.status === 'success'" class="text-sm">{{ scope.row.updateTime }}</span>
              <span v-else class="text-gray-400 text-sm">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="scope">
              <div class="flex justify-center">
                <el-button v-if="scope.row.status === 'success'" type="primary" plain @click="handleViewAsset(scope.row)">
                  <el-icon class="mr-1"><el-icon-view /></el-icon>查看资产
                </el-button>
                <el-button v-else type="danger" plain @click="handleCancelTask(scope.row)">
                  <el-icon class="mr-1"><el-icon-delete /></el-icon>删除任务
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="p-4 flex items-center justify-between bg-slate-50/50">
          <span class="text-xs text-slate-400 italic">共计 {{ totalCount }} 个克隆资产任务</span>
          <el-pagination 
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
            layout="prev, pager, next"
            background
            small
          />
        </div>
      </div>
    </div>

    <!-- 2. 克隆向导页面 (包装在原有的流中) -->
    <div v-else class="animate-fade-in">
      <!-- 步骤条 -->
      <div class="bg-white p-6 rounded-2xl shadow-sm mb-6 max-w-4xl mx-auto border border-slate-100">
        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step title="上传素材" />
          <el-step title="同步克隆" />
          <el-step title="预览预览" />
        </el-steps>
      </div>

      <!-- 内容区域 -->
      <div class="max-w-4xl mx-auto">
        <!-- 第1步与第2步保持原有逻辑，此处略作包装 -->
        <div v-if="activeStep === 0" class="animate-fade-in">
          <!-- ...原有上传HTML... -->
          <div class="bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
             <!-- 内容略，见下方完整替换 -->
             <div class="flex flex-col items-center mb-10 text-center">
                <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-4xl mb-4 shadow-inner">
                  <el-icon><el-icon-video-camera /></el-icon>
                </div>
                <h3 class="text-2xl font-bold text-slate-800">上传克隆视频</h3>
                <p class="text-slate-400 mt-2 max-w-sm">系统将从该视频中同时提取形象与音色</p>
             </div>
             <div class="w-2/3 mx-auto">
               <el-upload ref="videoUploadRef" class="!w-full" drag action="#" :auto-upload="false" :on-change="handleFileChange" :on-exceed="handleVideoExceed" :limit="1" accept="video/mp4,.mov">
                  <el-icon class="el-icon--upload"><el-icon-upload-filled /></el-icon>
                  <div class="el-upload__text">拖拽视频到此处，或 <em>点击上传</em></div>
                  <template #tip>
                    <div class="text-slate-400 text-xs mt-2">仅支持 MP4、MOV 格式，文件大小不超过 500MB。<span class="text-red-500">视频宽高比必须为 9:16</span></div>
                  </template>
               </el-upload>
             </div>
             <div class="mt-8 pb-4 border-b border-slate-50 flex items-center gap-3">
               <span class="text-sm text-slate-600 font-medium">视频是否含有字幕</span>
               <el-switch
                 v-model="form.isSubtitle"
                 active-text="有字幕"
                 inactive-text="无字幕"
               />
               <span class="text-xs text-slate-400">将影响字幕消除预处理步骤</span>
             </div>
             <div class="mt-4 pt-2 flex gap-4 items-start">
                <div class="flex-1">
                  <el-input
                    v-model="form.humanName"
                    placeholder="例如：金牌主播-安妮"
                    size="large"
                    clearable
                    @blur="handleNameBlur"
                  />
                  <div class="mt-2 min-h-[24px] flex items-center justify-between gap-2">
                    <div class="text-xs">
                      <span v-if="nameValidationLoading" class="text-slate-400">名称校验中...</span>
                      <span v-else-if="nameValidationState === 'valid'" class="text-green-600">名称可用</span>
                      <span v-else-if="nameValidationState === 'invalid'" class="text-amber-600">名称已存在，请使用推荐名称</span>
                      <span v-else class="text-slate-400">输入名称后自动校验，避免重名</span>
                    </div>
                    <el-button
                      v-if="nameValidationState === 'invalid' && recommendedName"
                      type="primary"
                      link
                      @click="applyRecommendedName"
                    >
                      使用推荐名：{{ recommendedName }}
                    </el-button>
                  </div>
                </div>
                <el-select v-model="form.gender" size="large" class="!w-40">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                </el-select>
                 <el-button type="primary" size="large" class="px-8" :loading="nameValidationLoading" :disabled="!canStartProcessing" @click="startProcessing">开始任务</el-button>
             </div>
          </div>
        </div>

        <div v-else-if="activeStep === 1" class="animate-fade-in section-container">
          <!-- 处理进度显示 -->
          <div class="space-y-6">
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h4 class="font-bold mb-4">数字人形象建模</h4>
              <el-progress :percentage="imageProgress" status="success" striped striped-flow />
            </div>
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h4 class="font-bold mb-4">音色轨迹模拟</h4>
              <el-progress :percentage="voiceProgress" color="#f97316" striped striped-flow />
            </div>
          </div>
        </div>

        <!-- 第三步：深度预览与绑定 -->
        <div v-else class="animate-fade-in section-container">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div class="grid grid-cols-2">
                <!-- 形象预览 -->
                <div class="p-8 border-r border-slate-50 flex flex-col items-center bg-slate-950">
                   <span class="text-slate-400 text-xs mb-4 uppercase tracking-widest">Digital Human Preview</span>
                   <div class="w-full aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden relative group">
                      <!-- 实际视频播放 -->
                      <video 
                        v-if="currentAsset?.videoUrl"
                        :src="currentAsset.videoUrl"
                        controls
                        class="w-full h-full object-contain"
                        controlsList="nodownload"
                      ></video>
                      <div v-else class="absolute inset-0 flex items-center justify-center">
                         <el-icon size="60" class="text-white/20"><el-icon-video-play /></el-icon>
                      </div>
                   </div>
                   <p class="text-white/60 text-sm mt-4 italic">形象动作与面部表情已就绪</p>
                </div>

                <!-- 声音预览 -->
                <div class="p-8 flex flex-col items-center justify-center">
                   <span class="text-slate-400 text-xs mb-8 uppercase tracking-widest">Voice Clone Preview</span>
                   <!-- 音频播放器 -->
                   <div class="w-full bg-blue-50 rounded-2xl p-6 mb-6">
                      <audio 
                        v-if="currentAsset?.voiceUrl"
                        :src="parseVoiceUrl(currentAsset.voiceUrl)"
                        controls
                        class="w-full mb-6"
                        controlsList="nodownload"
                      ></audio>
                      <div v-else class="text-slate-400 text-sm mb-6">暂无音频</div>
                   </div>
                   <div class="text-center">
                      <h4 class="font-bold text-slate-800">{{ form.humanName }} - 克隆音色</h4>
                      <p class="text-slate-400 text-xs mt-1 italic">神经网络模型已生成（准确率 98.2%）</p>
                   </div>
                </div>
             </div>

             <!-- 底部确认 -->
             <div class="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2 text-slate-500 text-sm">
                   <el-icon class="text-green-500"><el-icon-circle-check /></el-icon>
                   检测到声像同步率极高，建议立即绑定
                </div>
                <div class="flex gap-3">
                   <el-button @click="activeStep = 0">重新调整</el-button>
                   <el-button type="primary" class="px-10" @click="handleComplete">确认并绑定资产</el-button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 资产预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="'资产预览: ' + currentAsset?.name"
      width="900px"
      destroy-on-close
      class="rounded-2xl overflow-hidden"
    >
      <div v-if="currentAsset" class="grid grid-cols-2 gap-6">
        <!-- 视频形象预览 -->
        <div class="bg-slate-950 rounded-xl p-4 flex flex-col items-center">
          <span class="text-slate-500 text-[10px] uppercase mb-3">形象模型预览</span>
          <div class="w-full aspect-[9/16] bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5">
            <video 
              v-if="currentAsset.videoUrl"
              :src="currentAsset.videoUrl" 
              controls 
              class="w-full h-full object-contain"
              controlsList="nodownload"
            ></video>
            <div v-else class="flex flex-col items-center justify-center text-white/40">
              <el-icon size="48" class="mb-2"><el-icon-video-play /></el-icon>
              <span class="text-xs">暂无视频</span>
            </div>
          </div>
          <p class="text-white/40 text-xs mt-3 italic text-center">高清 4K 数字人建模已就绪</p>
        </div>
        <!-- 声音预览 -->
        <div class="flex flex-col">
          <div class="bg-blue-50 rounded-xl p-6 flex-1 flex flex-col items-center justify-center">
            <span class="text-blue-400 text-[10px] uppercase mb-6">音色克隆模型</span>
            <!-- 音频播放器 -->
            <audio 
              v-if="currentAsset.voiceUrl"
              :src="parseVoiceUrl(currentAsset.voiceUrl)"
              controls
              class="w-full mb-6"
              controlsList="nodownload"
            ></audio>
            <div v-else class="text-slate-400 text-sm mb-6">暂无音频</div>
            <div class="mt-6 text-center">
              <div class="font-bold text-slate-700">模型准确度 99.1%</div>
              <p class="text-slate-400 text-xs mt-1">支持文本转语音同步播报</p>
            </div>
          </div>
          <!-- 详细信息 -->
          <div class="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div class="grid grid-cols-2 gap-y-2 text-xs">
              <span class="text-slate-400">资产 ID:</span>
              <span class="text-slate-700 font-mono">{{ currentAsset.id }}</span>
              <span class="text-slate-400">克隆时间:</span>
              <span class="text-slate-700">{{ currentAsset.time }}</span>
              <span class="text-slate-400">性别:</span>
              <span class="text-slate-700">{{ currentAsset.gender }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="previewVisible = false">关闭预览</el-button>
          <el-button type="primary">导出资产包</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTaskStore } from '/@/store/modules/task'
import { createFastTask, getFastTaskList, deleteFastTask, getFastTaskDetail, validateDigitalHumanTaskName, getDigitalHumanTaskStatistics } from '/@/api/material'

// --- 状态控制 ---
const isCreating = ref(false)
const activeStep = ref(0)
const imageProgress = ref(0)
const voiceProgress = ref(0)
const isPlaying = ref(false)
let timer: any = null
let pollTimer: any = null  // 轮询定时器
let nameValidateTimer: any = null

const taskStore = useTaskStore()
const previewVisible = ref(false)
const currentAsset = ref<any>(null)

const form = reactive({
  humanName: '',
  gender: 'male',  // male or female
  isSubtitle: false,
  hasFile: false,
  rawFile: null as File | null,
  currentTaskId: null as number | null  // 当前正在轮询的任务ID
})

const nameValidationLoading = ref(false)
const nameValidationState = ref<'idle' | 'valid' | 'invalid'>('idle')
const recommendedName = ref('')
const validatedName = ref('')
const videoUploadRef = ref()
const videoRatioValid = ref(false)
const canStartProcessing = computed(() => {
  const finalName = form.humanName.trim()
  return !!finalName
    && !nameValidationLoading.value
    && nameValidationState.value === 'valid'
    && validatedName.value === finalName
    && form.hasFile
    && videoRatioValid.value
})

// --- 任务列表数据 ---
const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)  // API返回的总数
const taskStats = reactive({
  total: 0,
  processing: 0,
  waiting: 0,
  completed: 0
})

const taskList = ref<any[]>([])

// --- Lifecycle ---
onMounted(() => {
  loadTaskList()
  loadTaskStatistics()
  
  // 监听分页改变，重新加载数据
  watch([currentPage, pageSize], () => {
    loadTaskList()
  })
})

// --- Methods ---
const loadTaskList = async () => {
  try {
    const res = await getFastTaskList(currentPage.value, pageSize.value)
    if (res.data && res.data.code === 200) {
      const responseData = res.data.data
      const taskListData = responseData?.data || []
      totalCount.value = responseData?.total || 0  // 保存API返回的总数
      
      taskList.value = taskListData.map((item: any) => {
        const taskStatus = Number(item.taskStatus)
        let statusType = 'processing'  // 用于UI样式
        let progress = 50
        
        // 0=等待中, 1=音频克隆中, 2=数字人克隆中, 3=完成, -1=失败
        if (taskStatus === 0) {
          statusType = 'processing'
          progress = 5
        } else if (taskStatus === 1) {
          statusType = 'processing'
          progress = 45
        } else if (taskStatus === 2) {
          statusType = 'processing'
          progress = 75
        } else if (taskStatus === 3) {
          statusType = 'success'
          progress = 100
        } else if (taskStatus === -1) {
          statusType = 'failed'
          progress = 0
        }
        
        return {
          id: item.id,
          name: item.digitalHumanName || item.name || '',
          type: 'cloning',
          status: statusType,
          taskStatus,  // 保存原始状态值
          progress,
          time: item.createTime,
          updateTime: item.updateTime,
          videoUrl: item.videoUrl,
          voiceUrl: item.voiceUrl,
          gender: item.gender === 'male' ? '男' : '女'
        }
      })
    }
  } catch (error) {
    console.error('Failed to load fast tasks:', error)
  }
}

const loadTaskStatistics = async () => {
  try {
    const res = await getDigitalHumanTaskStatistics()
    if (res.data?.code === 200 && res.data?.data) {
      const data = res.data.data
      taskStats.total = Number(data.total || 0)
      taskStats.processing = Number(data.processing || 0)
      taskStats.waiting = Number(data.waiting || 0)
      taskStats.completed = Number(data.completed || 0)
    }
  } catch (error) {
    console.error('Failed to load task statistics:', error)
  }
}

// 过滤后的任务列表（前端过滤用）
const filteredTaskList = computed(() => {
  return taskList.value.filter(item => {
    const matchSearch = !searchQuery.value || item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

// 分页后的列表（由于API已经返回分页数据，这里直接返回当前页的数据进行前端过滤）
const paginatedTaskList = computed(() => {
  return filteredTaskList.value
})

const getStatusType = (status: string) => {
  const map: any = { success: 'success', processing: 'primary', failed: 'danger' }
  return map[status] || 'info'
}

const getStatusLabel = (row: any) => {
  const taskStatus = row.taskStatus ?? row.status
  
  // 如果是数字状态码
  if (typeof taskStatus === 'number') {
    const map: any = { 0: '等待中', 1: '音频克隆中', 2: '数字人克隆中', 3: '已完成', '-1': '任务失败' }
    return map[taskStatus] || '未知状态'
  }
  
  // 如果是字符串状态
  const map: any = { success: '已完成', processing: '处理中', failed: '克隆失败' }
  return map[taskStatus] || taskStatus
}

const getStatusDotClass = (row: any) => {
  const taskStatus = row.taskStatus ?? row.status
  
  // 根据任务状态显示不同颜色
  if (typeof taskStatus === 'number') {
    const map: any = { 0: 'bg-slate-400', 1: 'bg-blue-500 animate-pulse', 2: 'bg-orange-500 animate-pulse', 3: 'bg-green-500', '-1': 'bg-red-500' }
    return map[taskStatus] || 'bg-slate-300'
  }
  
  // 根据字符串状态
  const map: any = { success: 'bg-green-500', processing: 'bg-blue-500 animate-pulse', failed: 'bg-red-500' }
  return map[taskStatus] || 'bg-slate-300'
}

const getStatusTextClass = (row: any) => {
  const status = row.status || row.taskStatus
  const map: any = { success: 'text-green-600', processing: 'text-blue-600', 0: 'text-slate-600', 1: 'text-blue-600', 2: 'text-orange-600', 3: 'text-green-600', '-1': 'text-red-600', failed: 'text-red-600' }
  return map[status] || 'text-slate-500'
}

const getProgressText = (taskStatus: number) => {
  const map: Record<number, string> = {
    0: '等待中',
    1: '音频克隆中',
    2: '数字人克隆中',
    3: '已完成',
    [-1]: '任务失败'
  }
  return map[taskStatus] || '处理中'
}

const refreshList = async () => {
  try {
    await Promise.all([loadTaskList(), loadTaskStatistics()])
    ElMessage.success('列表已刷新')
  } catch (error: any) {
    console.error('Failed to refresh list:', error)
    ElMessage.error('刷新失败，请稍后重试')
  }
}

const resetNameValidationState = () => {
  nameValidationState.value = 'idle'
  nameValidationLoading.value = false
  recommendedName.value = ''
  validatedName.value = ''
}

const validateName = async (name: string, showError = false) => {
  const trimmedName = name.trim()
  if (!trimmedName) {
    resetNameValidationState()
    return false
  }

  if (trimmedName === validatedName.value && nameValidationState.value === 'valid') {
    return true
  }

  nameValidationLoading.value = true
  try {
    const res = await validateDigitalHumanTaskName(trimmedName)
    const data = res.data?.data
    if (res.data?.code === 200 && data) {
      const isValid = !!data.is_valid
      validatedName.value = trimmedName
      nameValidationState.value = isValid ? 'valid' : 'invalid'
      recommendedName.value = data.recommended_name || ''

      if (!isValid && showError) {
        const tipText = recommendedName.value ? `名称已存在，建议使用：${recommendedName.value}` : '名称已存在，请更换后重试'
        ElMessage.warning(tipText)
      }
      return isValid
    }
    if (showError) ElMessage.error(res.data?.message || '名称校验失败，请稍后重试')
    nameValidationState.value = 'idle'
    return false
  } catch (error) {
    console.error('Failed to validate name:', error)
    if (showError) ElMessage.error('名称校验失败，请稍后重试')
    nameValidationState.value = 'idle'
    return false
  } finally {
    nameValidationLoading.value = false
  }
}

const handleNameBlur = async () => {
  await validateName(form.humanName, false)
}

const applyRecommendedName = async () => {
  if (!recommendedName.value) return
  form.humanName = recommendedName.value
  const ok = await validateName(form.humanName, false)
  if (ok) {
    ElMessage.success('已应用推荐名称，可直接开始任务')
  }
}

const handleCreateNew = () => {
  isCreating.value = true
  activeStep.value = 0
  form.hasFile = false
  form.rawFile = null
  form.isSubtitle = false
  videoRatioValid.value = false
  resetNameValidationState()
}

const parseVoiceUrl = (voiceUrl: string) => {
  if (!voiceUrl) return ''
  // 处理格式: "['https://...']" 或 JSON数组格式
  try {
    if (voiceUrl.startsWith("['") && voiceUrl.endsWith("']")) {
      // 单引号格式：['https://...']
      const url = voiceUrl.slice(2, -2)
      return url
    } else if (voiceUrl.startsWith('[') && voiceUrl.endsWith(']')) {
      // JSON数组格式：['https://...']
      const parsed = JSON.parse(voiceUrl)
      return Array.isArray(parsed) ? parsed[0] : voiceUrl
    }
    return voiceUrl
  } catch (error) {
    console.error('Failed to parse voice URL:', error)
    return voiceUrl
  }
}

const handleViewAsset = (row: any) => {
  console.log('Viewing asset:', row)
  currentAsset.value = row
  previewVisible.value = true
}

const handleCancelTask = (row: any) => {
  ElMessageBox.confirm('确定要删除该任务吗？', '操作提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteFastTask(row.id)
      if (res.data && res.data.code === 200) {
        const index = taskList.value.findIndex(item => item.id === row.id)
        if (index !== -1) {
          taskList.value.splice(index, 1)
        }
        await Promise.all([loadTaskList(), loadTaskStatistics()])
        ElMessage.success('任务已删除')
      }
    } catch (error: any) {
      ElMessage.error('删除失败，请稍后重试')
    }
  }).catch(() => {
    // User cancelled
  })
}

const handleFileChange = (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  // 验证文件格式
  const allowedTypes = ['video/mp4', 'video/quicktime']
  const fileName = rawFile.name.toLowerCase()
  const isValidType = allowedTypes.includes(rawFile.type) || fileName.endsWith('.mp4') || fileName.endsWith('.mov')

  if (!isValidType) {
    ElMessage.error('只支持 MP4 和 MOV 格式的视频文件')
    form.rawFile = null
    form.hasFile = false
    videoRatioValid.value = false
    return
  }

  // 先清空旧数据
  form.rawFile = null
  form.hasFile = false
  videoRatioValid.value = false

  // 异步校验视频宽高比
  const objectUrl = URL.createObjectURL(rawFile)
  const videoEl = document.createElement('video')

  videoEl.onloadedmetadata = () => {
    URL.revokeObjectURL(objectUrl)
    const aspectRatio = videoEl.videoWidth / videoEl.videoHeight
    const targetRatio = 9 / 16
    const tolerance = 0.05

    if (Math.abs(aspectRatio - targetRatio) > tolerance) {
      videoUploadRef.value?.clearFiles()
      form.rawFile = null
      form.hasFile = false
      videoRatioValid.value = false
      ElMessage.error(`视频宽高比必须为 9:16（当前为 ${videoEl.videoWidth}×${videoEl.videoHeight}），请重新上传`)
      return
    }

    form.rawFile = rawFile
    form.hasFile = true
    videoRatioValid.value = true
  }

  videoEl.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    videoUploadRef.value?.clearFiles()
    form.rawFile = null
    form.hasFile = false
    videoRatioValid.value = false
    ElMessage.error('无法读取视频信息，请更换文件')
  }

  videoEl.src = objectUrl
}

const handleVideoExceed = (files: any[]) => {
  // 超出限制时，清空旧文件并处理新文件
  videoUploadRef.value?.clearFiles()
  handleFileChange({ raw: files[0] })
}

const startProcessing = async () => {
  if (!form.hasFile) return ElMessage.warning('请先上传视频素材')
  if (!form.humanName.trim()) return ElMessage.warning('请输入资产名称')

  const finalName = form.humanName.trim()

  const nameValid = await validateName(finalName, true)
  if (!nameValid) return
  
  try {
    // 构建 FormData
    const formData = new FormData()
    formData.append('file', form.rawFile!)
    formData.append('name', finalName)
    formData.append('gender', form.gender)
    formData.append('is_subtitle', form.isSubtitle ? 'true' : 'false')

    // 调用API提交任务
    const res = await createFastTask(formData)
    
    if (res.data && res.data.code === 200) {
      // 获取任务ID
      const taskId = res.data.data?.id
      if (!taskId) {
        ElMessage.error('任务创建成功但未返回任务ID，请尝试刷新列表')
        return
      }
      
      form.currentTaskId = taskId
      
      // 同步到全局任务中心（暂未启用）
      // taskStore.addTask({
      //   taskType: 'VIDEO_TASK',
      //   subTitle: `资产：${form.humanName}`,
      //   status: 'running'
      // })

      activeStep.value = 1
      ElMessage.success('任务已提交，正在处理中...')
      
      // 启动轮询
      pollTaskProgress()
    } else {
      ElMessage.error(res.data?.message || '提交失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('Failed to create fast task:', error)
    ElMessage.error(error.message || '提交失败，请稍后重试')
  }
}

const pollTaskProgress = async () => {
  if (!form.currentTaskId) return
  
  // 清除之前的轮询定时器
  if (pollTimer) clearInterval(pollTimer)
  
  // 创建轮询逻辑，每2秒检查一次
  pollTimer = setInterval(async () => {
    try {
      const res = await getFastTaskDetail(form.currentTaskId!)
      
      if (res.data && res.data.code === 200) {
        const taskData = res.data.data
        const taskStatus = taskData.taskStatus
        
        // 根据任务状态更新进度条
        // 0=等待中, 1=音频克隆中, 2=视频克隆中, 3=完成
        if (taskStatus === 0) {
          // 等待中
          imageProgress.value = 10
          voiceProgress.value = 10
        } else if (taskStatus === 1) {
          // 音频克隆中
          imageProgress.value = 30
          voiceProgress.value = Math.min(voiceProgress.value + 10, 80)
        } else if (taskStatus === 2) {
          // 视频克隆中
          imageProgress.value = Math.min(imageProgress.value + 10, 80)
          voiceProgress.value = 100
        } else if (taskStatus === 3) {
          // 任务完成，停止轮询，加载预览数据
          imageProgress.value = 100
          voiceProgress.value = 100
          
          if (pollTimer) clearInterval(pollTimer)
          
          // 加载任务详情作为预览数据
          currentAsset.value = {
            id: taskData.id,
            name: taskData.digitalHumanName || taskData.name,
            videoUrl: taskData.videoUrl,
            voiceUrl: taskData.voiceUrl,
            time: taskData.updateTime || taskData.createTime,
            gender: taskData.gender === 'male' ? '男' : '女',
            status: 'success'
          }
          
          // 在1秒后自动跳转到第三步
          setTimeout(() => {
            activeStep.value = 2
            ElMessage.success('任务完成，资产已加载！')
          }, 1000)
        } else if (taskStatus === -1) {
          // 任务失败
          if (pollTimer) clearInterval(pollTimer)
          ElMessage.error('任务处理失败，请重试')
          activeStep.value = 0
        }
      }
    } catch (error) {
      console.error('Failed to poll task progress:', error)
    }
  }, 2000)  // 每2秒轮询一次
}

const handleComplete = async () => {
  try {
    // 清理轮询定时器
    if (pollTimer) clearInterval(pollTimer)
    if (timer) clearInterval(timer)
    
    // 重新加载任务列表获取最新数据
    await Promise.all([loadTaskList(), loadTaskStatistics()])
    
    ElMessage.success('数字化资产已成功绑定并完成训练任务！')
    isCreating.value = false

    // 重置状态
    activeStep.value = 0
    imageProgress.value = 0
    voiceProgress.value = 0
    form.humanName = ''
    form.gender = 'male'
    form.hasFile = false
    form.rawFile = null
    form.currentTaskId = null
    videoRatioValid.value = false
    resetNameValidationState()

    // 延迟 1 秒后刷新页面，清空缓存
    setTimeout(() => {
      location.reload()
    }, 1000)
  } catch (error: any) {
    console.error('Failed to complete task:', error)
    ElMessage.error('刷新失败，请手动刷新列表')
  }
}

watch(
  () => form.humanName,
  (value) => {
    if (nameValidateTimer) clearTimeout(nameValidateTimer)

    const trimmedName = value.trim()
    if (!trimmedName) {
      resetNameValidationState()
      return
    }

    if (trimmedName === validatedName.value && nameValidationState.value === 'valid') {
      return
    }

    nameValidationState.value = 'idle'
    recommendedName.value = ''
    nameValidateTimer = setTimeout(() => {
      validateName(trimmedName, false)
    }, 400)
  }
)

onUnmounted(() => { 
  if (timer) clearInterval(timer)
  if (pollTimer) clearInterval(pollTimer)
  if (nameValidateTimer) clearTimeout(nameValidateTimer)
})
</script>

<style scoped>
.animate-fade-in {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-container {
  min-height: 500px;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  border-radius: 20px;
  background-color: #f8fafc;
  border-width: 2px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger:hover) {
  background-color: #f0f9ff;
  border-color: #3b82f6;
}

.el-step__title {
  font-weight: bold;
}
</style>
