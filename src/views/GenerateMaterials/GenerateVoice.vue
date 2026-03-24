<template>
  <div class="generate-voice p-6 bg-gray-50 min-h-full">
    <!-- 列表页面 -->
    <div v-if="!showCreate" class="max-w-[1200px] mx-auto">
      <!-- 顶部标题 -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-800">音频生成</h2>
          <p class="text-xs text-gray-400 mt-1">快速配置并制作高质量音频素材</p>
        </div>
        <el-button type="primary" size="large" @click="handleCreateNew">
          <el-icon class="mr-2"><el-icon-plus /></el-icon>
          创建音频
        </el-button>
      </div>

      <!-- 任务列表 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <!-- 搜索和批量操作 -->
        <div class="mb-6 flex items-center justify-between gap-4">
          <div class="flex-1 max-w-md">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索音频标题或ID..." 
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="flex items-center gap-2">
            <el-button 
              type="primary" 
              :disabled="selectedAudios.length === 0"
              @click="batchDownloadAudios"
            >
              批量下载音频 ({{ selectedAudios.length }})
            </el-button>
          </div>
        </div>

        <el-table 
          :data="filteredAudioList" 
          border 
          style="width: 100%" 
          header-cell-class-name="bg-gray-50 font-bold text-gray-700"
          @selection-change="selectedAudios = $event"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="音频信息" min-width="250">
            <template #default="scope">
              <div class="flex items-center gap-3 py-1">
                <div>
                  <div class="font-bold text-gray-800 line-clamp-1">{{ scope.row.title || scope.row.script?.substring(0, 30) }}...</div>
                  <div class="text-xs text-gray-400">ID: {{ scope.row.id }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="任务状态" width="140" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.taskStatus)" :effect="scope.row.taskStatus === '2' ? 'light' : 'plain'">
                {{ getStatusLabel(scope.row.taskStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180" align="center">
            <template #default="scope">
              <span class="text-sm">{{ scope.row.createTime }}</span>
            </template>
          </el-table-column>
          <el-table-column label="完成时间" width="180" align="center">
            <template #default="scope">
              <span v-if="scope.row.taskStatus === '2'" class="text-sm">{{ scope.row.updateTime }}</span>
              <span v-else class="text-gray-400 text-sm">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" plain @click="handlePlayAudio(scope.row)">试听</el-button>
              <el-button type="danger" size="small" plain @click="handleDeleteAudio(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建/编辑页面 -->
    <div v-else class="max-w-[1400px] mx-auto">
      <!-- 顶部导航 -->
      <div class="mb-6">
        <el-button @click="showCreate = false" icon="el-icon-arrow-left">返回列表</el-button>
      </div>

      <!-- 顶部标题 -->
      <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-center relative border border-gray-100 mb-6">
        <div class="text-center">
          <h2 class="text-xl font-bold text-gray-800">音频生成</h2>
          <p class="text-xs text-gray-400 mt-1">快速配置并制作高质量音频素材</p>
        </div>
      </div>

      <div class="flex gap-6">
      <!-- 左侧制作区 -->
      <div class="flex-1 space-y-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
          <h3 class="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
             <i class="el-icon-setting text-blue-500"></i>制作配置
          </h3>

          <el-form :model="voiceForm" label-width="100px" label-position="top">
            <!-- 渠道 -->
            <el-row :gutter="40">
              <el-col :span="24">
                <el-form-item label="生成渠道" required>
                  <div class="flex gap-4 p-1 bg-gray-50 rounded-xl w-fit">
                    <div 
                      class="px-6 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-2 border-2 bg-white border-blue-500 shadow-sm text-blue-600"
                      @click="voiceForm.channel = 'A2E'"
                    >
                      <span class="font-bold">默认</span>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="40" class="mt-4">
              <el-col :span="12">
                <el-form-item required>
                  <template #label>
                    <div class="flex items-center gap-2">
                      <span>配音声音</span>
                      <span class="text-xs text-gray-400">{{ voiceOptions.length }} 个</span>
                    </div>
                  </template>
                  <!-- 配音选择器 -->
                  <div class="flex gap-2">
                    <el-input 
                      v-model="voiceForm.voice" 
                      placeholder="点击搜索选择配音"
                      readonly
                      style="cursor: pointer;"
                      clearable
                      @clear="voiceForm.voice = ''"
                      @click="openVoiceSelector"
                      class="flex-1"
                    >
                      <template #prepend>选择配音</template>
                      <template #append>
                        <el-button icon="el-icon-search" @click.stop="openVoiceSelector" />
                      </template>
                    </el-input>
                    <el-button v-if="voiceForm.voice" type="primary" plain icon="el-icon-headset" @click="playVoice(voiceForm.voice)">试听</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="语言设置" required>
                  <el-select v-model="voiceForm.language" placeholder="请选择语言种类" class="w-full">
                    <el-option label="自动识别" value="auto" />
                    <el-option label="中文" value="zh" />
                    <el-option label="英文" value="en" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 标题部分 -->
            <el-row :gutter="20" class="mt-8">
              <el-col :span="24">
                <el-form-item label="音频标题" required>
                  <el-input 
                    v-model="voiceForm.dubbing_name" 
                    placeholder="请输入音频标题（如：产品介绍、教程等）"
                    maxlength="100"
                    show-word-limit
                    clearable
                    @input="handleTitleChange"
                    class="w-full"
                  />
                </el-form-item>
                <!-- 检查状态指示 -->
                <div v-if="nameCheckState" class="flex items-center gap-2 px-4 py-2 rounded-lg mb-3 w-fit" :style="{
                  backgroundColor: nameCheckState === 'checking' ? '#f0f9ff' : nameCheckState === 'valid' ? '#f0fdf4' : '#fef2f2'
                }">
                  <i v-if="nameCheckState === 'checking'" class="el-icon-loading text-blue-500 animate-spin"></i>
                  <i v-else-if="nameCheckState === 'valid'" class="el-icon-check text-green-500"></i>
                  <i v-else class="el-icon-close text-red-500"></i>
                  <span class="text-sm" :class="{
                    'text-blue-600': nameCheckState === 'checking',
                    'text-green-600': nameCheckState === 'valid',
                    'text-red-600': nameCheckState === 'invalid'
                  }">
                    {{ nameCheckMessage }}
                  </span>
                </div>
                <!-- 推荐名称提示 -->
                <div v-if="recommendedName" class="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-3">
                  <i class="el-icon-info text-yellow-600 text-lg flex-shrink-0"></i>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-yellow-800">推荐使用：<span class="font-bold text-yellow-900">{{ recommendedName }}</span></p>
                  </div>
                  <el-button size="small" type="primary" plain @click="applyRecommendedName" class="flex-shrink-0">使用</el-button>
                </div>
              </el-col>
            </el-row>

            <!-- 文案部分 -->
            <div class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-600 text-sm font-bold flex items-center gap-1">
                  音频文案内容 <span class="text-red-500">*</span>
                </span>
                <div class="flex gap-2">
                  <el-button size="mini" plain @click="openScriptSelector('library')">文案库导入</el-button>
                  <el-button size="mini" plain @click="openScriptSelector('history')">历史文案</el-button>
                </div>
              </div>
              <el-input
                type="textarea"
                v-model="voiceForm.script"
                placeholder="请输入音频解说文案（建议300-500字以获得最佳生成效果）"
                :rows="12"
                class="script-input"
              />
              <div class="flex justify-between items-center mt-3">
                <div class="text-[11px] text-gray-400">
                   当前字数：<span class="text-blue-500 font-bold">{{ voiceForm.script.length }}</span> / 2000
                </div>
                <el-button size="mini" plain type="success" :disabled="!voiceForm.script" @click="openSaveScriptDialog" icon="el-icon-folder-add">
                  转存至文案库
                </el-button>
              </div>
            </div>

            <div class="mt-10 flex flex-col items-center border-t border-gray-50 pt-8 gap-4">
               <el-button 
                 type="primary" 
                 size="large" 
                 class="!w-48 !h-12 !font-bold rounded-xl shadow-lg shadow-blue-100"
                 :loading="isGenerating"
                 :disabled="isGenerating"
                 icon="el-icon-video-play"
                 @click="startGeneration"
               >
                 {{ isGenerating ? '正在生成音频...' : '立即生成音频' }}
               </el-button>
            </div>
          </el-form>
        </div>
      </div>

      <!-- 右侧预览与结果区 -->
      <div class="w-[320px] space-y-6">
        <!-- 任务状态与历史 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
           <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <el-icon class="text-green-500"><el-icon-clock /></el-icon>执行状态
          </h3>
          
          <div v-if="isGenerating" class="py-10 text-center animate-fade-in">
             <el-progress type="circle" :percentage="genProgress" status="success" :stroke-width="10"></el-progress>
             <p class="mt-4 text-sm font-bold text-gray-600">{{ genStage }}</p>
             <p class="text-xs text-gray-400 mt-2">文案上传 -> 音频合成 -> 最终处理</p>
          </div>

          <div v-else-if="resultAudio" class="animate-fade-in">
             <div class="bg-green-50 border border-green-100 rounded-xl p-5 mb-4">
                <div class="flex items-center gap-3 text-green-700">
                   <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                      <i class="el-icon-check"></i>
                   </div>
                   <div>
                      <h4 class="font-bold text-sm">音频生成成功</h4>
                      <p class="text-[10px] opacity-70">生成耗时：1分30秒</p>
                   </div>
                </div>
             </div>
             <div class="grid grid-cols-2 gap-3">
                <el-button type="primary" class="w-full !rounded-lg" icon="el-icon-headset" @click="previewResult">试听</el-button>
                <el-button type="success" plain class="w-full !rounded-lg" icon="el-icon-download" @click="downloadResult">保存到本地</el-button>
             </div>
          </div>

          <div v-else class="py-20 text-center text-gray-300">
             <i class="el-icon-magic-stick text-5xl opacity-30"></i>
             <p class="mt-4 text-xs">配置后点击下方生成的按钮开始制作</p>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 文案库/历史记录选择器 -->
    <el-dialog :title="scriptSelector.title" v-model="scriptSelector.visible" width="900px" append-to-body @open="onDialogOpen">
      <!-- 库模式 -->
      <div v-if="scriptSelector.mode === 'library'" class="space-y-4">
        <div class="mb-4 flex items-center gap-4">
          <el-input 
            placeholder="按标签搜索..." 
            v-model="scriptSelector.search" 
            size="small" 
            style="width: 320px"
            clearable
          >
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
          <div class="flex gap-2 flex-wrap">
            <el-tag 
              v-for="tag in allScriptTags" 
              :key="tag" 
              size="mini" 
              effect="plain" 
              class="cursor-pointer hover:bg-blue-50"
              @click="scriptSelector.search = tag"
            >{{ tag }}</el-tag>
          </div>
        </div>
        
        <el-table :data="currentScripts" height="400px" border :header-cell-style="{ background: '#f8fafc' }">
          <el-table-column prop="title" label="文案标题" width="180" />
          <el-table-column label="标签分类" width="200">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-1">
                <el-tag v-for="tag in row.tags" :key="tag" size="mini" effect="plain" type="info">{{ tag }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="文案内容" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="mini" text @click="selectScript(row)">选入文案</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 历史模式 -->
      <div v-else class="space-y-4">
        <div class="mb-4">
          <el-input 
            placeholder="按标题、内容或标签搜索..." 
            v-model="scriptSelector.search" 
            size="small" 
            style="width: 320px"
            clearable
          >
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div class="max-h-96 overflow-y-auto space-y-3">
          <div 
            v-for="script in currentScripts" 
            :key="script.id"
            class="p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
            @click="selectScript(script)"
          >
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-600 line-clamp-3 break-words">{{ script.content }}</div>
              </div>
              <el-button type="primary" size="small" plain class="flex-shrink-0">导入</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 保存到文案库弹窗 -->
    <el-dialog title="保存至文案库" v-model="saveScriptDialog.visible" width="450px" append-to-body>
      <el-form :model="saveScriptDialog.form" label-width="80px">
        <el-form-item label="文案标题" required>
          <el-input v-model="saveScriptDialog.form.title" placeholder="如：XX产品带货解说词" />
        </el-form-item>
        <el-form-item label="分类标签">
          <div class="flex flex-wrap gap-2 mb-2">
            <el-tag v-for="(tag, index) in saveScriptDialog.form.tags" :key="index" closable size="small" @close="saveScriptDialog.form.tags.splice(index, 1)">{{ tag }}</el-tag>
          </div>
          <el-input v-model="saveScriptDialog.form.newTag" placeholder="输入回车确认" size="small" @keyup.enter="addTag">
            <template #append><el-button @click="addTag">添加</el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item label="内容预览">
          <div class="text-[11px] text-gray-500 bg-gray-50 p-2 rounded max-h-24 overflow-y-auto italic">
            {{ voiceForm.script }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveScriptDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveScript">确认存入</el-button>
      </template>
    </el-dialog>

    <!-- 配音选择器 -->
    <el-dialog title="选择配音声音" v-model="voiceSelectorDialog.visible" width="800px" append-to-body>
      <div class="space-y-4">
        <div class="flex gap-2">
          <el-input placeholder="搜索配音..." v-model="voiceSelectorDialog.search" size="small" style="width: 300px;" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div 
          class="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[500px] overflow-y-auto"
          @scroll="handleVoiceScroll"
        >
          <div 
            v-for="item in voiceSelectorDialog.displayList" 
            :key="item.name"
            class="p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between"
            :class="voiceForm.voice === item.name 
              ? 'border-blue-500 bg-blue-100 shadow-md' 
              : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50'"
            @click="selectVoice(item)"
          >
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <i class="el-icon-headset text-blue-500"></i>
              <p class="text-xs text-gray-700 font-medium truncate">{{ item.name }}</p>
            </div>
            <el-button 
              type="text" 
              icon="el-icon-headset" 
              size="small" 
              class="!text-blue-500 flex-shrink-0"
              @click.stop="playVoice(item.name)"
            ></el-button>
            <i v-if="voiceForm.voice === item.name" class="el-icon-check text-blue-500 text-sm ml-1"></i>
          </div>
        </div>
        <div v-if="voiceSelectorDialog.loading" class="text-center py-4">
          <el-loading-icon></el-loading-icon> 加载中...
        </div>
      </div>
    </el-dialog>

    <!-- 音频播放弹窗 -->
    <el-dialog title="音频详情预览" v-model="audioPreview.visible" width="600px" append-to-body>
       <div class="space-y-6">
          <!-- 音频试听 -->
          <div v-if="audioPreview.url" class="space-y-3">
             <div class="flex items-center justify-between">
               <h4 class="font-bold text-gray-800 text-base flex items-center gap-2">
                 <span class="text-green-500">🎵</span>音频内容
               </h4>
               <el-button type="primary" size="small" @click="downloadAudio" :icon="ElIcon.Download">
                 下载音频
               </el-button>
             </div>
             <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-100">
               <audio :src="audioPreview.url" controls class="w-full h-10"></audio>
             </div>
          </div>
       </div>
       
       <!-- 对话框底部按钮 -->
       <template #footer>
         <div class="flex justify-end gap-2">
           <el-button @click="audioPreview.visible = false">关闭</el-button>
         </div>
       </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as ElIcon from '@element-plus/icons-vue'
import { Search } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import { createDubbingTask, getDubbingTaskList, deleteDubbingTask, checkDubbingName, getDubbingTaskDetail, getVoiceList, getScriptPaginateList, getScriptHistoryList, createScript } from '/@/api/material'

// --- 数据定义 ---

// 页面状态
const showCreate = ref(false)

// 任务列表
const audioTaskList = ref<any[]>([])
const searchKeyword = ref('')
const selectedAudios = ref<any[]>([])
const filteredAudioList = computed(() => {
  return audioTaskList.value
})

const voiceForm = reactive({
  dubbing_name: '',
  channel: 'A2E',
  voice: '',
  script: '',
  language: 'auto'
})

// 配音选项列表（从API获取）
const voiceOptions = ref<any[]>([])
const voiceSearch = ref('')  // 配音搜索框

let voiceSearchTimer: NodeJS.Timeout

// 标题检查相关
let nameCheckTimer: NodeJS.Timeout
const nameCheckState = ref<'checking' | 'valid' | 'invalid' | ''>('')  // 检查状态
const nameCheckMessage = ref('')  // 检查提示信息
const recommendedName = ref('')  // 推荐的名称

const scriptLibrary = ref<any[]>([])  // 脚本库数据
const scriptHistory = ref<any[]>([])  // 历史脚本数据
const audioTaskRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 获取脚本库数据
const fetchScriptLibrary = async () => {
  try {
    const res = await getScriptPaginateList(1, 100)
    if (res.data) {
      const data = res.data.data?.data || res.data.data || []
      scriptLibrary.value = data.map((item: any) => ({
        id: item.scriptId,
        title: item.scriptTitle,
        content: item.scriptContent,
        tags: Array.isArray(item.scriptTags) ? item.scriptTags : (item.scriptTags ? item.scriptTags.split('|').filter((t: string) => t) : [])
      }))
    }
  } catch (error) {
    console.error('获取脚本库失败:', error)
  }
}

// 获取历史脚本数据
const fetchScriptHistory = async () => {
  try {
    const res = await getScriptHistoryList(1, 100)
    if (res.data) {
      const data = res.data.data?.data || res.data.data || []
      // 直接过滤，去掉重复的 taskId
      const seen = new Set()
      const uniqueData = data.filter((item: any) => {
        if (seen.has(item.taskId)) {
          return false
        }
        seen.add(item.taskId)
        return true
      })
      
      scriptHistory.value = uniqueData.map((item: any) => ({
        id: item.taskId,
        title: item.taskContent.substring(0, 50),
        content: item.taskContent,
        tags: Array.isArray(item.taskTags) ? item.taskTags : []
      }))
    }
  } catch (error) {
    console.error('获取历史脚本失败:', error)
  }
}

// --- 状态控制 ---
const isPlaying = ref(false)
const isGenerating = ref(false)
const genProgress = ref(0)
const genStage = ref('准备就绪')
const resultAudio = ref('')

const scriptSelector = reactive({
  visible: false,
  title: '文案库选择',
  search: '',
  mode: 'library' // 'library' or 'history'
})

// 配音选择器状态
const voiceSelectorDialog = reactive({
  visible: false,
  search: '',
  allList: [] as any[],
  displayList: [] as any[],
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true
})

const saveScriptDialog = reactive({
  visible: false,
  form: { title: '', tags: [] as string[], newTag: '' }
})

const audioPreview = reactive({
  visible: false,
  url: '',
  title: ''
})

// --- 逻辑处理 ---

// 加载音频任务列表
const loadAudioTasks = async () => {
  try {
    const response = await getDubbingTaskList(1, 20)
    console.log('API返回数据:', response)
    
    let tasks = []
    if (response.data && response.data.data) {
      const data = response.data.data
      if (Array.isArray(data.data)) {
        tasks = data.data
      } else if (Array.isArray(data)) {
        tasks = data
      }
    }
    
    audioTaskList.value = tasks.map((task: any) => ({
      id: task.id,
      script: task.msg || task.dubbing_name || '',
      title: task.dubbing_name || '',
      voice: task.voice || '',
      voiceId: task.voiceId,
      createTime: task.create_time ? new Date(task.create_time).toLocaleString('zh-CN') : new Date().toLocaleString(),
      updateTime: task.update_time ? new Date(task.update_time).toLocaleString('zh-CN') : '',
      audioUrl: task.audioUrl || task.audio_url || '',
      taskStatus: task.task_status || '0',
      baseVoiceUrl: task.url || task.baseVoiceUrl || ''
    }))
    
    console.log('加载的任务列表:', audioTaskList.value)
  } catch (error) {
    console.error('加载音频任务列表失败:', error)
  }
}

const startAudioTaskAutoRefresh = () => {
  if (audioTaskRefreshTimer.value) return
  audioTaskRefreshTimer.value = setInterval(() => {
    if (!showCreate.value) {
      loadAudioTasks()
    }
  }, 30000)
}

const stopAudioTaskAutoRefresh = () => {
  if (audioTaskRefreshTimer.value) {
    clearInterval(audioTaskRefreshTimer.value)
    audioTaskRefreshTimer.value = null
  }
}

// 加载配音列表
const loadVoiceList = async (searchName?: string) => {
  try {
    const response = await getVoiceList(searchName)
    console.log('配音列表API返回:', response)
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      voiceOptions.value = response.data.data.map((voice: any) => ({
        name: voice.voiceName || voice.name,
        externalId: voice.externalId,
        url: voice.url
      }))
      console.log('加载的配音列表:', voiceOptions.value)
    }
  } catch (error) {
    console.error('加载配音列表失败:', error)
    voiceOptions.value = [
      { name: '甜美女声' },
      { name: '磁性男声' },
      { name: '活力少女' },
      { name: '成熟稳重' }
    ]
  }
}

// 配音搜索处理函数（防抖）
const handleVoiceSearch = () => {
  if (voiceSearchTimer) clearTimeout(voiceSearchTimer)
  voiceSearchTimer = setTimeout(() => {
    loadVoiceList(voiceSearch.value || undefined)
  }, 300)
}

// 组件挂载时加载任务列表、配音列表
onMounted(() => {
  loadAudioTasks()
  loadVoiceList()
  startAudioTaskAutoRefresh()
})

onUnmounted(() => {
  stopAudioTaskAutoRefresh()
})

watch(showCreate, (val) => {
  if (val) {
    stopAudioTaskAutoRefresh()
  } else {
    loadAudioTasks()
    startAudioTaskAutoRefresh()
  }
})

const handleCreateNew = () => {
  resetForm()
  showCreate.value = true
}

const handlePlayAudio = (audio: any) => {
  audioPreview.url = audio.baseVoiceUrl || audio.audioUrl
  audioPreview.title = audio.title
  audioPreview.visible = true
}

const handleDeleteAudio = async (id: any) => {
  try {
    await deleteDubbingTask(id)
    ElMessage.success('音频已删除')
    audioTaskList.value = audioTaskList.value.filter(a => a.id !== id)
  } catch (error) {
    ElMessage.error('删除音频失败')
    console.error('删除音频任务失败:', error)
  }
}

// 获取任务状态标签
const getStatusLabel = (status: string | number) => {
  const statusMap: { [key: string]: string } = {
    '0': '等待中',
    '1': '进行中',
    '2': '已完成',
    '-1': '失败'
  }
  return statusMap[String(status)] || '未知'
}

// 获取任务状态类型（用于tag颜色）
const getStatusType = (status: string | number): 'success' | 'danger' | 'warning' | 'info' => {
  const statusStr = String(status)
  if (statusStr === '2') return 'success'    // 已完成
  if (statusStr === '-1') return 'danger'   // 失败
  if (statusStr === '0') return 'info'      // 等待中
  if (statusStr === '1') return 'warning'   // 进行中
  return 'info'
}

const resetForm = () => {
  voiceForm.dubbing_name = ''
  voiceForm.channel = 'A2E'
  voiceForm.voice = ''
  voiceForm.script = ''
  voiceForm.language = 'auto'
  resultAudio.value = ''
  genProgress.value = 0
  nameCheckState.value = ''
  nameCheckMessage.value = ''
  recommendedName.value = ''
}

// 检查音频标题是否有效（防抖）
const handleTitleChange = (newTitle: string) => {
  if (!newTitle.trim()) {
    nameCheckState.value = ''
    nameCheckMessage.value = ''
    recommendedName.value = ''
    return
  }

  nameCheckState.value = 'checking'
  nameCheckMessage.value = '正在检查...'

  if (nameCheckTimer) clearTimeout(nameCheckTimer)
  nameCheckTimer = setTimeout(async () => {
    try {
      const res = await checkDubbingName(newTitle)
      if (res.data && res.data.data) {
        const { is_valid, recommended_name } = res.data.data
        if (is_valid) {
          nameCheckState.value = 'valid'
          nameCheckMessage.value = '✓ 该名称可用'
          recommendedName.value = ''
        } else {
          nameCheckState.value = 'invalid'
          nameCheckMessage.value = '✗ 该名称已存在'
          recommendedName.value = recommended_name || ''
        }
      }
    } catch (error) {
      nameCheckState.value = ''
      nameCheckMessage.value = '检查失败'
      console.error('检查标题失败:', error)
    }
  }, 500)
}

// 应用推荐的标题名称
const applyRecommendedName = () => {
  if (recommendedName.value) {
    voiceForm.dubbing_name = recommendedName.value
    handleTitleChange(recommendedName.value)
  }
}

const playVoice = (name: string) => {
  if (!name) return
  isPlaying.value = true
  ElMessage.success(`正在试听配音: ${name}`)
  setTimeout(() => isPlaying.value = false, 3000)
}

const openScriptSelector = (mode: string) => {
  scriptSelector.mode = mode
  scriptSelector.title = mode === 'library' ? '从文案库导入' : '从历史记录选择'
  scriptSelector.search = ''
  scriptSelector.visible = true
  
  if (mode === 'library') {
    fetchScriptLibrary()
  } else {
    fetchScriptHistory()
  }
}

// 对话框打开时处理
const onDialogOpen = () => {
  scriptSelector.search = ''
}

// 获取所有唯一的标签
const allScriptTags = computed(() => {
  const data = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  const tags = new Set<string>()
  data.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => tags.add(tag))
    }
  })
  return Array.from(tags)
})

// 当前模式下的脚本数据
const currentScripts = computed(() => {
  const s = scriptSelector.search.toLowerCase().trim()
  const sourceData = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  
  if (!s) {
    return sourceData
  }
  
  if (scriptSelector.mode === 'library') {
    return sourceData.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) return false
      return item.tags.some(t => String(t).toLowerCase().includes(s))
    })
  } else {
    return sourceData.filter(item => {
      const titleMatch = item.title && item.title.toLowerCase().includes(s)
      const contentMatch = item.content && item.content.toLowerCase().includes(s)
      const tagMatch = item.tags && Array.isArray(item.tags) && 
        item.tags.some(t => String(t).toLowerCase().includes(s))
      return titleMatch || contentMatch || tagMatch
    })
  }
})

const selectScript = (script: any) => {
  voiceForm.script = script.content
  scriptSelector.visible = false
  ElMessage.success('文案已成功导入')
}

const openSaveScriptDialog = () => {
  saveScriptDialog.form.title = ''
  saveScriptDialog.form.tags = []
  saveScriptDialog.form.newTag = ''
  saveScriptDialog.visible = true
  fetchScriptLibrary()
}

const addTag = () => {
  if (saveScriptDialog.form.newTag) {
    saveScriptDialog.form.tags.push(saveScriptDialog.form.newTag)
    saveScriptDialog.form.newTag = ''
  }
}

const confirmSaveScript = async () => {
  if (!saveScriptDialog.form.title) return ElMessage.warning('请输入文案标题')
  try {
    await createScript({
      script_title: saveScriptDialog.form.title,
      script_content: voiceForm.script,
      script_tags: saveScriptDialog.form.tags
    })
    ElMessage.success('已存入文案库')
    saveScriptDialog.visible = false
    await fetchScriptLibrary()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

// 音频生成流程
const startGeneration = async () => {
  if (isGenerating.value) {
    return
  }
  
  if (!voiceForm.dubbing_name || !voiceForm.voice || !voiceForm.script) {
    return ElMessage.warning('请先完整配置标题、配音及文案')
  }

  // 检查标题是否有效
  if (nameCheckState.value === 'invalid') {
    return ElMessage.warning('标题名称已存在，请修改或使用推荐的名称')
  }

  if (nameCheckState.value === 'checking') {
    return ElMessage.warning('标题正在检查中，请稍候')
  }

  isGenerating.value = true
  resultAudio.value = ''
  genProgress.value = 0
  genStage.value = '正在上传素材...'

  try {
    const selectedVoice = voiceOptions.value.find((voice: any) => voice.name === voiceForm.voice)
    const voiceId = selectedVoice?.externalId || voiceForm.voice
    
    const country = voiceForm.language === 'auto' ? 'zh' : voiceForm.language
    
    const payload = {
      dubbing_name: voiceForm.dubbing_name,
      msg: voiceForm.script,
      voice_external_id: voiceId,
      country: country,
      speechRate: 1.0
    }

    console.log('提交的请求数据：', payload)

    const response = await createDubbingTask(payload)
    console.log('创建任务响应:', response)
    
    if (response && response.data) {
      const taskId = response.data.id || response.data.data?.id
      console.log('任务ID:', taskId)
      
      const checkTaskProgress = async () => {
        try {
          // 使用任务ID查询单个任务的详细信息
          const res = await getDubbingTaskDetail(taskId)
          if (res.data && res.data.data) {
            const taskData = res.data.data
            const taskStatus = String(taskData.task_status || taskData.taskStatus)
            
            switch(taskStatus) {
              case '0':
                genProgress.value = 20
                genStage.value = '等待中...'
                break
              case '1':
                genProgress.value = 60
                genStage.value = '音频合成中...'
                break
              case '2':
                genProgress.value = 100
                genStage.value = '已完成'
                completeGeneration(taskId, taskData)
                return
              case '-1':
                throw new Error(taskData.errorMessage || '任务失败')
              default:
                genProgress.value = 20
                genStage.value = '处理中...'
            }
            
            if (taskStatus !== '2' && taskStatus !== '-1') {
              setTimeout(checkTaskProgress, 2000)
            }
          }
        } catch (err) {
          console.error('获取任务详情失败:', err)
          setTimeout(checkTaskProgress, 3000)
        }
      }
      
      setTimeout(checkTaskProgress, 1000)
    } else {
      throw new Error('任务创建失败')
    }
  } catch (error) {
    isGenerating.value = false
    console.error('音频生成失败:', error)
    ElMessage.error(`音频生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

const completeGeneration = async (taskId?: any, taskData?: any) => {
  isGenerating.value = false
  if (taskData && (taskData.url || taskData.baseVoiceUrl)) {
    resultAudio.value = taskData.url || taskData.baseVoiceUrl
  } else {
    resultAudio.value = 'https://www.w3schools.com/html/mov_bbb.mp4'
  }
  
  const newTask = {
    id: taskId || Date.now(),
    script: voiceForm.script,
    voice: voiceForm.voice,
    createTime: new Date().toLocaleString(),
    audioUrl: resultAudio.value
  }
  
  audioTaskList.value.unshift(newTask)
  ElMessage.success('音频生成成功！')
}

const previewResult = () => {
  audioPreview.url = resultAudio.value
  audioPreview.visible = true
}

// 下载音频
const downloadAudio = async () => {
  if (!audioPreview.url) {
    ElMessage.warning('音频URL不可用')
    return
  }
  
  try {
    ElMessage.loading('正在准备下载...')
    const response = await fetch(audioPreview.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio-${new Date().getTime()}.mp3`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    setTimeout(() => {
      ElMessage.success('下载已开始')
    }, 2000)
  } catch (error) {
    ElMessage.error('下载失败，请重试')
  }
}

const downloadResult = () => {
  downloadAudio()
}

// 搜索音频
const handleSearch = async () => {
  try {
    // 构建搜索条件
    const search = searchKeyword.value ? { dubbing_name: searchKeyword.value } : undefined
    
    const response = await getDubbingTaskList(1, 20, search)
    console.log('搜索API返回数据:', response)
    
    let tasks = []
    if (response.data && response.data.data) {
      const data = response.data.data
      if (Array.isArray(data.data)) {
        tasks = data.data
      } else if (Array.isArray(data)) {
        tasks = data
      }
    }
    
    audioTaskList.value = tasks.map((task: any) => ({
      id: task.id,
      script: task.msg || task.dubbing_name || '',
      title: task.dubbing_name || '',
      voice: task.voice || '',
      voiceId: task.voiceId,
      createTime: task.create_time ? new Date(task.create_time).toLocaleString('zh-CN') : new Date().toLocaleString(),
      updateTime: task.update_time ? new Date(task.update_time).toLocaleString('zh-CN') : '',
      audioUrl: task.audioUrl || task.audio_url || '',
      taskStatus: task.task_status || '0',
      baseVoiceUrl: task.url || task.baseVoiceUrl || ''
    }))
    
    console.log('搜索结果:', audioTaskList.value)
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请重试')
  }
}

// 批量下载音频
const batchDownloadAudios = async () => {
  if (selectedAudios.value.length === 0) {
    ElMessage.warning('请先选择要下载的音频')
    return
  }

  const validAudios = selectedAudios.value.filter(a => a.taskStatus === '2' && (a.baseVoiceUrl || a.audioUrl))
  const invalidCount = selectedAudios.value.length - validAudios.length

  if (validAudios.length === 0) {
    ElMessage.warning('没有可下载的音频（请检查音频是否已完成）')
    return
  }

  ElMessage.info(`准备打包 ${validAudios.length} 个音频...`)

  try {
    const zip = new JSZip()
    let successCount = 0
    let failedCount = 0

    const downloadPromises = validAudios.map(audio =>
      fetch(audio.baseVoiceUrl || audio.audioUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.blob()
        })
        .then(blob => {
          const fileName = `${audio.title || 'audio'}-${audio.id}.mp3`
          zip.file(fileName, blob)
          successCount++
        })
        .catch(error => {
          console.error(`下载音频失败: ${audio.title}`, error)
          failedCount++
        })
    )

    await Promise.all(downloadPromises)

    ElMessage.info('正在生成压缩包...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audios-${new Date().getTime()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    if (successCount > 0) {
      ElMessage.success(`成功打包并下载 ${successCount} 个音频`)
    }
    if (failedCount > 0) {
      ElMessage.warning(`${failedCount} 个音频下载失败`)
    }
    if (invalidCount > 0) {
      ElMessage.info(`${invalidCount} 个音频跳过（未完成或无URL）`)
    }
  } catch (error) {
    console.error('ZIP打包失败:', error)
    ElMessage.error('打包文件失败，请重试')
  }
}

// --- 配音选择器 ---
const openVoiceSelector = async () => {
  voiceSelectorDialog.visible = true
  voiceSelectorDialog.allList = []
  voiceSelectorDialog.displayList = []
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.search = ''
  voiceSelectorDialog.hasMore = true
  if (voiceSelectorDialog.displayList.length === 0) {
    await loadMoreVoices()
  }
}

const loadMoreVoices = async () => {
  voiceSelectorDialog.loading = true
  try {
    const allVoices = voiceOptions.value
    const start = (voiceSelectorDialog.page - 1) * voiceSelectorDialog.pageSize
    const end = start + voiceSelectorDialog.pageSize
    
    if (start >= allVoices.length) {
      voiceSelectorDialog.hasMore = false
      voiceSelectorDialog.loading = false
      return
    }
    
    const newItems = allVoices.slice(start, end)
    voiceSelectorDialog.allList.push(...newItems)
    voiceSelectorDialog.displayList = voiceSelectorDialog.allList.slice(0, voiceSelectorDialog.page * voiceSelectorDialog.pageSize)
    voiceSelectorDialog.page++
    
    if (end >= allVoices.length) {
      voiceSelectorDialog.hasMore = false
    }
  } catch (error) {
    console.error('加载配音失败:', error)
    ElMessage.error('加载配音失败')
  } finally {
    voiceSelectorDialog.loading = false
  }
}

const handleVoiceScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && voiceSelectorDialog.hasMore && !voiceSelectorDialog.loading) {
    loadMoreVoices()
  }
}

const selectVoice = (item: any) => {
  voiceForm.voice = item.name
  voiceSelectorDialog.visible = false
  ElMessage.success('已选择配音')
}

// 监听搜索框变化
watch(() => voiceSelectorDialog.search, (newVal) => {
  const filtered = voiceOptions.value.filter(item => 
    item.name.toLowerCase().includes(newVal.toLowerCase())
  )
  voiceSelectorDialog.allList = filtered
  voiceSelectorDialog.displayList = filtered.slice(0, voiceSelectorDialog.pageSize)
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = filtered.length > voiceSelectorDialog.pageSize
})

</script>

<style scoped>
.script-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  background-color: #fcfcfc;
  padding: 15px;
  line-height: 1.6;
  font-size: 14px;
  transition: all 0.3s;
}

.script-input :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
