<template>
  <div class="subtitle-remove p-6 bg-gray-50 min-h-full">
    <!-- Header -->
    <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between mb-4 border border-gray-100">
      <div>
        <h2 class="text-xl font-bold text-gray-800 tracking-tight">字幕消除</h2>
        <p class="text-xs text-gray-400 mt-1">上传视频文件，AI 自动识别并消除视频中的字幕内容</p>
      </div>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon class="mr-1"><el-icon-plus /></el-icon>
        创建任务
      </el-button>
    </div>

    <!-- Task List -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <el-table
        :data="taskList"
        style="width: 100%"
        :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column label="任务信息" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <div class="flex items-center py-1 gap-3">
              <div class="overflow-hidden">
                <div class="font-bold text-gray-700 leading-tight truncate text-sm">{{ scope.row.title || ('任务 #' + scope.row.id) }}</div>
                <div class="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">ID: {{ scope.row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="源视频" width="100" align="center">
          <template #default="scope">
            <el-button
              v-if="scope.row.sourceVideoUrl"
              size="small"
              plain
              @click="previewSource(scope.row)"
            >
              <i class="el-icon-video-play mr-1"></i>播放
            </el-button>
            <span v-else class="text-gray-400 text-xs">-</span>
          </template>
        </el-table-column>

        <el-table-column label="任务状态" width="110" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.taskStatus)" size="small" effect="light">
              <i v-if="scope.row.taskStatus === 1 || scope.row.taskStatus === 2" class="el-icon-loading mr-1"></i>
              {{ getStatusLabel(scope.row.taskStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160" align="center">
          <template #default="scope">
            <span class="text-gray-500 text-xs">{{ formatTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="完成时间" width="160" align="center">
          <template #default="scope">
            <span class="text-gray-400 text-xs">{{ scope.row.taskStatus === 5 ? formatTime(scope.row.updateTime) : '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <div class="flex items-center justify-center gap-2">
              <el-button
                size="small"
                type="primary"
                plain
                :disabled="scope.row.taskStatus !== 5 || !scope.row.outputVideoUrl"
                @click="previewResult(scope.row)"
              >
                预览结果
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="p-4 flex justify-end bg-white border-t border-gray-50">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog
      title="创建字幕消除任务"
      v-model="dialogVisible"
      width="560px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      @closed="resetForm"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="任务标题（可选）">
          <el-input
            v-model="form.title"
            placeholder="请输入任务标题，方便后续识别"
            maxlength="50"
            show-word-limit
            clearable
          />
          <div class="mt-1.5 min-h-[18px] flex items-center justify-between gap-2">
            <span v-if="titleValidating" class="text-xs text-gray-400">标题校验中...</span>
            <span v-else-if="titleState === 'valid'" class="text-xs text-green-600">✔ 标题可用</span>
            <span v-else-if="titleState === 'invalid'" class="text-xs text-amber-600">✖ 标题已存在，可使用推荐名称</span>
            <span v-else class="text-xs text-gray-400">输入标题后自动校验重名</span>
            <el-button
              v-if="titleState === 'invalid' && titleRecommended"
              type="primary"
              link
              size="small"
              @click="form.title = titleRecommended"
            >使用推荐：{{ titleRecommended }}</el-button>
          </div>
        </el-form-item>

        <el-form-item label="上传视频文件" required>
          <div v-if="form.file" class="w-full mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
            <i class="el-icon-video-camera text-blue-500 text-xl flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-700 truncate">{{ form.file.name }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ formatFileSize(form.file.size) }}</div>
            </div>
            <el-button type="danger" link size="small" @click="form.file = null">移除</el-button>
          </div>
          <el-upload
            class="w-full"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept="video/*,.mp4,.avi,.mov,.mkv"
            :show-file-list="false"
          >
            <div class="flex flex-col items-center justify-center py-8">
              <i class="el-icon-upload text-5xl text-blue-400 mb-3"></i>
              <div class="text-sm text-gray-500">
                将视频文件拖到此处，或 <em class="text-blue-500 font-medium not-italic">点击上传</em>
              </div>
              <div class="text-xs text-gray-400 mt-2">支持 mp4、avi、mov、mkv 格式，建议不超过 2GB</div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="submitting">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="submitting || !form.file || titleValidating || (form.title.trim() !== '' && titleState === 'invalid')"
          @click="handleSubmit"
        >
          开始消除字幕
        </el-button>
      </template>
    </el-dialog>

    <!-- Source Video Dialog -->
    <el-dialog
      :title="'源视频 - ' + (sourcePreview.title || ('任务 #' + sourcePreview.id))"
      v-model="sourcePreview.visible"
      width="480px"
      destroy-on-close
      @closed="handleSourcePreviewClosed"
    >
      <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
        <video
          v-if="sourcePreview.url"
          ref="sourcePreviewVideoRef"
          :src="sourcePreview.url"
          controls
          autoplay
          class="max-w-full max-h-[560px]"
        ></video>
        <div v-else class="text-gray-500 text-sm italic">暂无法加载视频</div>
      </div>
      <template #footer>
        <el-button @click="sourcePreview.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog
      :title="'结果预览 - ' + (previewItem?.title || ('任务 #' + previewItem?.id))"
      v-model="previewVisible"
      width="480px"
      destroy-on-close
      @closed="handleResultPreviewClosed"
    >
      <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
        <video
          v-if="previewItem?.outputVideoUrl"
          ref="resultPreviewVideoRef"
          :src="previewItem.outputVideoUrl"
          controls
          autoplay
          class="max-w-full max-h-[560px]"
        ></video>
        <div v-else class="text-gray-500 text-sm italic">暂无法加载视频</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="downloadResult(previewItem)">下载视频</el-button>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createSubtitleRemoveTask, getSubtitleRemoveTaskList, deleteSubtitleRemoveTask, checkSubtitleRemoveTitle } from '/@/api/material'

// --- Types ---
interface SubtitleRemoveTask {
  id: number | string
  title?: string
  taskId?: string
  sourceVideoUrl: string
  outputVideoUrl?: string
  taskStatus: number   // 0=待处理, 1=处理中, 2=轮询中, 5=已完成, -1=失败
  createTime: string
  updateTime?: string
}

// --- State ---
const taskList = ref<SubtitleRemoveTask[]>([])
const dialogVisible = ref(false)
const previewVisible = ref(false)
const submitting = ref(false)
const previewItem = ref<SubtitleRemoveTask | null>(null)
const sourcePreview = reactive({ visible: false, url: '', id: '', title: '' })
const sourcePreviewVideoRef = ref<HTMLVideoElement | null>(null)
const resultPreviewVideoRef = ref<HTMLVideoElement | null>(null)

let pollingTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  title: '',
  file: null as File | null
})

const stopMedia = (mediaEl: HTMLMediaElement | null) => {
  if (!mediaEl) return
  mediaEl.pause()
  mediaEl.currentTime = 0
}

const handleSourcePreviewClosed = () => {
  stopMedia(sourcePreviewVideoRef.value)
}

const handleResultPreviewClosed = () => {
  stopMedia(resultPreviewVideoRef.value)
}

// --- Title validation ---
const titleValidating = ref(false)
const titleState = ref<'idle' | 'valid' | 'invalid'>('idle')
const titleRecommended = ref('')
const titleValidated = ref('')
let titleTimer: ReturnType<typeof setTimeout> | null = null

const resetTitleValidation = () => {
  titleValidating.value = false
  titleState.value = 'idle'
  titleRecommended.value = ''
  titleValidated.value = ''
}

const validateTitle = async (title: string) => {
  const t = title.trim()
  if (!t) { resetTitleValidation(); return }
  if (t === titleValidated.value && titleState.value === 'valid') return
  titleValidating.value = true
  try {
    const res = await checkSubtitleRemoveTitle(t)
    if (res.data?.code === 200) {
      const d = res.data.data
      titleValidated.value = t
      titleState.value = d.is_valid ? 'valid' : 'invalid'
      titleRecommended.value = d.recommended_name || ''
    }
  } catch {}
  finally { titleValidating.value = false }
}

watch(() => form.title, (val) => {
  if (titleTimer) clearTimeout(titleTimer)
  const t = val.trim()
  if (!t) { resetTitleValidation(); return }
  if (t === titleValidated.value && titleState.value === 'valid') return
  titleState.value = 'idle'
  titleRecommended.value = ''
  titleTimer = setTimeout(() => validateTitle(t), 400)
})

// --- Pagination ---
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// --- Lifecycle ---
onMounted(() => {
  loadTaskList()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// --- Load ---
const loadTaskList = async () => {
  try {
    const res = await getSubtitleRemoveTaskList(pagination.currentPage, pagination.pageSize)
    if (res.data?.code === 200) {
      const data = res.data.data
      const list = data?.data || []
      pagination.total = data?.total || 0
      taskList.value = list.map((item: any) => ({
        id: item.id,
        title: item.title || `任务 #${item.id}`,
        taskId: item.taskId || '',
        sourceVideoUrl: item.sourceVideoUrl || '',
        outputVideoUrl: item.outputVideoUrl || '',
        taskStatus: Number(item.taskStatus ?? 0),
        createTime: item.createTime || '',
        updateTime: item.updateTime || ''
      }))
    }
  } catch (error) {
    console.error('加载字幕消除任务失败:', error)
  }
}

// --- Polling ---
const startPolling = () => {
  if (pollingTimer) return
  pollingTimer = setInterval(() => {
    const hasPending = taskList.value.some(t => t.taskStatus === 1 || t.taskStatus === 2 || t.taskStatus === 0)
    if (hasPending) loadTaskList()
  }, 5000)
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// --- File Change ---
const handleFileChange = (file: any) => {
  form.file = file.raw || null
}

// --- Submit ---
const handleSubmit = async () => {
  if (submitting.value) return
  if (!form.file) return ElMessage.warning('请上传视频文件')

  // 如果填了标题，必须通过校验
  const t = form.title.trim()
  if (t) {
    if (titleValidating.value) return ElMessage.warning('标题校验中，请稍候')
    if (titleState.value === 'idle') await validateTitle(t)
    if (titleState.value === 'invalid') return ElMessage.warning('标题已存在，请更换标题或使用推荐名称')
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('file', form.file)
    if (form.title.trim()) formData.append('title', form.title.trim())

    const res = await createSubtitleRemoveTask(formData)
    if (res.data?.code === 200) {
      ElMessage.success('任务已提交，AI 正在处理中，请稍候查看结果')
      dialogVisible.value = false
      pagination.currentPage = 1
      await loadTaskList()
    } else {
      ElMessage.error(res.data?.message || '提交失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('创建字幕消除任务失败:', error)
    ElMessage.error(error?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// --- Delete ---
const handleDelete = (row: SubtitleRemoveTask) => {
  ElMessageBox.confirm('确定要删除该字幕消除任务吗？', '操作提示', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteSubtitleRemoveTask(row.id)
      if (res.data?.code === 200) {
        ElMessage.success('已删除')
        await loadTaskList()
      } else {
        ElMessage.error(res.data?.message || '删除失败')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '删除失败，请稍后重试')
    }
  }).catch(() => {})
}

// --- Preview & Download ---
const previewResult = (row: SubtitleRemoveTask) => {
  previewItem.value = row
  previewVisible.value = true
}

const previewSource = (row: SubtitleRemoveTask) => {
  sourcePreview.url = row.sourceVideoUrl
  sourcePreview.id = String(row.id)
  sourcePreview.title = row.title || ''
  sourcePreview.visible = true
}

const downloadResult = (row: SubtitleRemoveTask | null) => {
  if (!row?.outputVideoUrl) return
  const a = document.createElement('a')
  a.href = row.outputVideoUrl
  a.download = `subtitle-removed-${row.id}.mp4`
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// --- Pagination ---
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  loadTaskList()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadTaskList()
}

// --- Helpers ---
const resetForm = () => {
  form.title = ''
  form.file = null
  resetTitleValidation()
  if (titleTimer) clearTimeout(titleTimer)
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const getStatusLabel = (status: number) => {
  const map: Record<number, string> = { 0: '待处理', 1: '处理中', 2: '处理中', 5: '已完成', [-1]: '失败' }
  return map[status] ?? '未知'
}

const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | '' => {
  if (status === 5) return 'success'
  if (status === 1 || status === 2) return 'warning'
  if (status === 0) return 'info'
  if (status === -1) return 'danger'
  return ''
}
</script>

<style scoped>
:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
}
:deep(.el-upload) {
  width: 100%;
}
:deep(.el-upload-dragger) {
  width: 100% !important;
  border-radius: 12px;
}
</style>
