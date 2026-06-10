<template>
  <div class="generate-audio p-6 bg-gray-50 min-h-full">
    <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between mb-4 border border-gray-100">
      <div>
        <h2 class="text-xl font-bold text-gray-800 tracking-tight">音频克隆与管理</h2>
        <p class="text-xs text-gray-400 mt-1">上传样本音频进行声音训练，或管理已生成的 AI 配音资产</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="queue-hint">
          <div class="text-xs text-gray-400">今日排队</div>
          <div v-if="voiceWaitingInfo.waitingTotal > 0" class="text-sm font-semibold text-gray-700">
            当前还有 <span class="text-amber-600">{{ voiceWaitingInfo.waitingTotal }}</span> 个等待任务
          </div>
          <div v-else class="text-sm font-semibold text-gray-700">当前没有等待任务</div>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="dialogVisible = true" class="shadow-sm">
          创建克隆任务
        </el-button>
      </div>
    </div>

    <el-alert
      title="录音规范：请确保上传的录音文件时长在 10-60 秒之间，推荐使用 WAV，并保持环境安静以提升效果。"
      type="info"
      show-icon
      :closable="false"
      class="mb-4 !rounded-xl border border-blue-50"
    />

    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <el-table
        :data="voiceTasks"
        style="width: 100%"
        :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column label="名称" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                <i class="el-icon-microphone text-blue-500"></i>
              </div>
              <span class="font-bold text-gray-700">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="渠道" width="100" align="center">
          <template #default="scope">
            <el-tag type="info" size="mini" effect="plain">{{ scope.row.channel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="性别" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.gender === '男' ? '' : 'danger'" size="mini" effect="plain">
              {{ scope.row.gender }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="常用语言" width="100" align="center">
          <template #default="scope">
            <span class="text-gray-600 text-xs">{{ scope.row.language }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="mini" effect="light">
              <i v-if="scope.row.status === '进行中' || scope.row.status === '已提交'" class="el-icon-loading mr-1"></i>
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="150" align="center">
          <template #default="scope">
            <span class="text-gray-400 text-xs">{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="完成时间" width="150" align="center">
          <template #default="scope">
            <span class="text-gray-400 text-xs">{{ scope.row.isCompleted ? (scope.row.updateTime || '-') : '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <div class="flex items-center justify-center gap-2">
              <el-button
                size="mini"
                type="primary"
                plain
                icon="el-icon-video-play"
                :disabled="scope.row.status !== '训练完成'"
                :loading="previewingId === scope.row.id"
                @click="handlePreview(scope.row)"
              >
                {{ previewingId === scope.row.id ? '正在下载' : '试听' }}
              </el-button>
              <el-button
                size="mini"
                type="danger"
                plain
                @click="handleDelete(scope.$index)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-4 flex justify-end bg-white border-t border-gray-50">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="!font-normal"
        />
      </div>
    </div>

    <el-dialog
      title="新建声音克隆任务"
      v-model="dialogVisible"
      width="500px"
      custom-class="rounded-xl overflow-hidden"
    >
      <el-form :model="form" label-width="80px" label-position="top">
        <el-form-item label="声音名称">
          <el-input
            v-model="form.name"
            placeholder="例如：我的专属解说音色"
            clearable
            @blur="handleNameBlur"
          ></el-input>
          <div class="mt-2 min-h-[20px] flex items-center justify-between gap-2">
            <span v-if="nameValidationLoading" class="text-xs text-gray-400">名称校验中...</span>
            <span v-else-if="nameValidationState === 'valid'" class="text-xs text-green-600">名称可用</span>
            <span v-else-if="nameValidationState === 'invalid'" class="text-xs text-amber-600">名称已存在，可使用推荐名称</span>
            <span v-else-if="nameValidationState === 'error'" class="text-xs text-red-500">名称校验失败，请检查网络或重试</span>
            <span v-else class="text-xs text-gray-400">输入名称后自动校验，避免重名</span>
            <el-button
              v-if="nameValidationState === 'invalid' && recommendedName"
              type="primary"
              link
              @click="applyRecommendedName"
            >
              使用推荐名称：{{ recommendedName }}
            </el-button>
          </div>
        </el-form-item>

        <div class="grid grid-cols-2 gap-x-4 gap-y-0">
          <el-form-item label="渠道源">
            <el-select v-model="form.channel" placeholder="请选择渠道" style="width: 100%" disabled>
              <el-option label="默认" value="default"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="性别">
            <el-select v-model="form.gender" placeholder="请选择" style="width: 100%">
              <el-option v-for="item in genderOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="核心语言" class="col-span-2">
            <el-radio-group v-model="form.language">
              <el-radio :label="'zh'" size="large">中文</el-radio>
              <el-radio :label="'th'" size="large">泰语</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item label="训练音频 (10s - 60s)" class="mt-2 text-center">
          <el-upload
            class="upload-demo w-full"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".mp3,.wav,.m4a,.mp4"
          >
            <div class="flex flex-col items-center justify-center py-4">
              <i class="el-icon-upload text-5xl text-blue-400 mb-4"></i>
              <div class="el-upload__text text-sm">
                将文件拖到此处，或<em class="text-blue-500 font-medium">点击上传</em>
              </div>
            </div>
            <template #tip>
              <div class="el-upload__tip text-gray-400 text-[11px] leading-relaxed mt-2 text-left">
                支持 mp3, wav, m4a, mp4 格式。时长必须在 10s-60s 之间。<br/>
                推荐使用高质量录音设备，并在安静环境录制。
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelDialog" :disabled="submitting">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting || nameValidationLoading" :disabled="submitting || !canSubmitTask">
            提交训练
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="音频试听" v-model="previewDialogVisible" width="560px" @closed="handlePreviewDialogClosed">
      <div class="space-y-4">
        <div class="text-sm text-gray-600">{{ previewTitle || '未命名音频' }}</div>
        <video
          v-if="isVideoPreview"
          ref="previewMediaRef"
          :src="previewMediaSrc"
          controls
          class="w-full rounded"
          @pause="handlePauseStop"
        ></video>
        <audio
          v-else
          ref="previewMediaRef"
          :src="previewMediaSrc"
          controls
          class="w-full"
          @pause="handlePauseStop"
        ></audio>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="previewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createVoiceTask, getVoiceTaskList, getVoiceTaskWaiting, deleteVoiceTask, validateVoiceTaskName } from '/@/api/material'

interface VoiceTask {
  id?: number
  name: string
  gender: string
  language: string
  channel: string
  status: '进行中' | '训练完成' | '训练失败' | '已提交'
  duration: number
  createTime: string
  updateTime?: string
  isCompleted?: boolean
  url?: string
}

const voiceTasks = ref<VoiceTask[]>([])
const genderOptions = ref<Array<{ label: string; value: string }>>([{ label: '男', value: 'male' }, { label: '女', value: 'female' }])

const dialogVisible = ref(false)
const submitting = ref(false)
const previewingId = ref<number | null>(null)
const previewDialogVisible = ref(false)
const previewTitle = ref('')
const previewMediaRef = ref<HTMLMediaElement | null>(null)
let previewMediaSrc = ''
const isVideoPreview = ref(false)
let nameValidateTimer: number | null = null

const form = reactive({
  name: '',
  channel: 'default',
  gender: 'male',
  language: 'zh',
  audioFile: null as File | null,
  duration: 0
})

const nameValidationLoading = ref(false)
const nameValidationState = ref<'idle' | 'valid' | 'invalid' | 'error'>('idle')
const recommendedName = ref('')
const validatedName = ref('')
const canSubmitTask = computed(() => {
  const finalName = form.name.trim()
  return !!finalName && !nameValidationLoading.value && nameValidationState.value === 'valid' && validatedName.value === finalName
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})
const voiceWaitingInfo = reactive({
  waitingTotal: 0,
  waitingBefore: 0
})

const normalizeTaskUrl = (raw: unknown): string => {
  if (!raw) return ''
  if (Array.isArray(raw)) return String(raw[0] || '').trim()
  let s = String(raw).trim()
  if (!s) return ''

  // Strip one-level wrapping quotes first: "\"['https://...']\"" -> "['https://...']"
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }

  // JSON array string or python-like array string: ["..."] / ['...']
  if (s.startsWith('[') && s.endsWith(']')) {
    const normalized = s.replace(/'/g, '"')
    try {
      const arr = JSON.parse(normalized)
      if (Array.isArray(arr) && arr.length > 0) return String(arr[0] || '').trim()
    } catch {
      const match = s.match(/https?:\/\/[^'",\]\s]+/i)
      if (match) return match[0]
    }
  }

  return s.replace(/^["']|["']$/g, '').trim()
}

onMounted(() => {
  loadVoiceTaskList()
  loadVoiceWaitingInfo()
})

const loadVoiceTaskList = async () => {
  try {
    const res = await getVoiceTaskList(pagination.currentPage, pagination.pageSize)
    if (res.data && res.data.code === 200) {
      const taskList = res.data.data?.data || []
      voiceTasks.value = taskList.map((item: any) => {
        const audioUrl = normalizeTaskUrl(item.url)

        return {
          id: item.id,
          name: item.voiceName,
          gender: item.gender === 'male' ? '男' : '女',
          language: item.language === 'zh' ? '中文' : '英文',
          channel: item.model === 'a2e' ? 'default' : (item.model || 'default'),
          status: item.taskStatus === '2' ? '训练完成' : (item.taskStatus === '1' ? '进行中' : (item.taskStatus === '0' ? '已提交' : '训练失败')),
          duration: 0,
          createTime: item.createTime,
          updateTime: item.updateTime,
          isCompleted: item.taskStatus === '2',
          url: audioUrl
        } as VoiceTask
      })
      pagination.total = res.data.data?.total || 0
    }
  } catch (error) {
    console.error('Failed to load voice tasks:', error)
  }
}

const loadVoiceWaitingInfo = async () => {
  try {
    const res = await getVoiceTaskWaiting()
    if (res.data?.code === 200 && res.data?.data) {
      const data = res.data.data
      voiceWaitingInfo.waitingTotal = Number(data.waitingTotal || data.waiting_total || 0)
      voiceWaitingInfo.waitingBefore = Number(data.waitingBefore || data.waiting_before || 0)
    }
  } catch (error) {
    console.error('Failed to load voice waiting info:', error)
  }
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  loadVoiceTaskList()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadVoiceTaskList()
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    '训练完成': 'success',
    '进行中': 'warning',
    '已提交': 'info',
    '训练失败': 'danger'
  }
  return map[status] || ''
}

const stopPreviewAudio = () => {
  if (previewMediaRef.value) {
    previewMediaRef.value.pause()
    previewMediaRef.value.currentTime = 0
  }
  if (previewMediaSrc && previewMediaSrc.startsWith('blob:')) {
    URL.revokeObjectURL(previewMediaSrc)
  }
  previewMediaSrc = ''
}

const handlePauseStop = () => {
  if (!previewMediaRef.value) return
  previewMediaRef.value.pause()
  previewMediaRef.value.currentTime = 0
}

const handlePreviewDialogClosed = () => {
  handlePauseStop()
  stopPreviewAudio()
  previewTitle.value = ''
  isVideoPreview.value = false
}

const handlePreview = async (task: VoiceTask) => {
  const finalUrl = normalizeTaskUrl(task.url)
  if (!task.id || !finalUrl) {
    ElMessage.warning('音频URL不存在')
    return
  }

  stopPreviewAudio()
  previewingId.value = task.id

  try {
    console.log('[AudioPreview] raw url:', task.url, '| parsed url:', finalUrl)
    const lowerUrl = finalUrl.toLowerCase()
    isVideoPreview.value = lowerUrl.includes('.mp4')
    previewMediaSrc = finalUrl
    previewTitle.value = task.name || ''
    previewDialogVisible.value = true
    setTimeout(() => {
      previewMediaRef.value?.play().catch((error) => {
        console.error('Failed to play media:', error)
      })
    }, 0)
  } catch (error) {
    console.error('Audio load error:', error)
    ElMessage.error('下载失败，请检查音频格式或网络连接')
  } finally {
    previewingId.value = null
  }
}

const handleFileChange = (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  const extMatch = rawFile.name.match(/\.(mp3|wav|m4a|mp4)$/i)
  if (!extMatch) {
    ElMessage.error('不支持的格式，请重新上传')
    return false
  }

  const audio = new Audio()
  audio.src = URL.createObjectURL(rawFile)
  audio.onloadedmetadata = () => {
    const duration = Math.floor(audio.duration)
    if (duration < 10 || duration > 60) {
      ElMessage.error(`时长不符：当前时长 ${duration}s，要求 10s-60s`)
      form.audioFile = null
      form.duration = 0
    } else {
      form.audioFile = rawFile
      form.duration = duration
      ElMessage.success('素材校验通过')
    }
  }
}

const resetNameValidationState = () => {
  nameValidationLoading.value = false
  nameValidationState.value = 'idle'
  recommendedName.value = ''
  validatedName.value = ''
}

const validateName = async (name: string, showError = false) => {
  const finalName = name.trim()
  if (!finalName) {
    resetNameValidationState()
    return false
  }

  if (finalName === validatedName.value && nameValidationState.value === 'valid') {
    return true
  }

  nameValidationLoading.value = true
  try {
    const res = await validateVoiceTaskName(finalName)
    const data = res.data?.data
    if (res.data?.code === 200 && data) {
      const rawValid = data.is_valid ?? data.isValid
      const isValid = rawValid === true || rawValid === 'true' || rawValid === 1 || rawValid === '1'
      validatedName.value = finalName
      nameValidationState.value = isValid ? 'valid' : 'invalid'
      recommendedName.value = data.recommended_name || data.recommendedName || ''
      if (!isValid && showError) {
        const tip = recommendedName.value ? `名称已存在，建议使用：${recommendedName.value}` : '名称已存在，请更换后重试'
        ElMessage.warning(tip)
      }
      return isValid
    }

    if (showError) ElMessage.error(res.data?.message || '名称校验失败，请稍后重试')
    nameValidationState.value = 'error'
    return false
  } catch (error) {
    console.error('Failed to validate voice name:', error)
    if (showError) ElMessage.error('名称校验失败，请稍后重试')
    nameValidationState.value = 'error'
    return false
  } finally {
    nameValidationLoading.value = false
  }
}

const handleNameBlur = async () => {
  await validateName(form.name)
}

const applyRecommendedName = async () => {
  if (!recommendedName.value) return
  form.name = recommendedName.value
  const ok = await validateName(form.name)
  if (ok) {
    ElMessage.success('已应用推荐名称')
  }
}

const handleCancelDialog = () => {
  dialogVisible.value = false
  resetNameValidationState()
}

const handleSubmit = async () => {
  if (submitting.value) return

  if (!form.name.trim()) return ElMessage.warning('请输入名称')
  if (!form.audioFile) return ElMessage.warning('音频素材校验未通过或未上传')

  const finalName = form.name.trim()
  const nameValid = await validateName(finalName, true)
  if (!nameValid) return

  submitting.value = true

  try {
    const formData = new FormData()
    formData.append('file', form.audioFile)
    formData.append('name', finalName)
    formData.append('gender', form.gender)
    formData.append('language', form.language)
    // 根据语言设置模型：中文用 a2e，泰语用 minimax
    formData.append('model', form.language === 'zh' ? 'a2e' : 'minimax')
    formData.append('source', 'default')

    const res = await createVoiceTask(formData)

    if (res.data && res.data.code === 200) {
      form.name = ''
      form.audioFile = null
      form.duration = 0
      resetNameValidationState()

      dialogVisible.value = false
      pagination.currentPage = 1
      await loadVoiceTaskList()
      await loadVoiceWaitingInfo()

      ElMessage.success('已加入训练队列，预计耗时 5-10 分钟')
    } else {
      ElMessage.error(res.data?.message || '提交失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('Failed to create voice task:', error)
    ElMessage.error(error.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

watch(
  () => form.name,
  (value) => {
    if (nameValidateTimer) clearTimeout(nameValidateTimer)

    const finalName = value.trim()
    if (!finalName) {
      resetNameValidationState()
      return
    }

    if (finalName === validatedName.value && nameValidationState.value === 'valid') {
      return
    }

    nameValidationState.value = 'idle'
    recommendedName.value = ''
    nameValidateTimer = window.setTimeout(() => {
      validateName(finalName)
    }, 400)
  }
)

onUnmounted(() => {
  if (nameValidateTimer) clearTimeout(nameValidateTimer)
  stopPreviewAudio()
})

const handleDelete = (index: number) => {
  const task = voiceTasks.value[index]
  if (!task.id) {
    ElMessage.warning('无法删除：任务ID不存在')
    return
  }

  ElMessageBox.confirm('数据删除后不可恢复，确定要移除吗？', '系统提醒', {
    confirmButtonText: '立即删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteVoiceTask(task.id!)
      if (res.data && res.data.code === 200) {
        voiceTasks.value.splice(index, 1)
        await loadVoiceWaitingInfo()
        ElMessage.success('已从库中移除')
      } else {
        ElMessage.error(res.data?.message || '删除失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('Failed to delete voice task:', error)
      ElMessage.error(error.message || '删除失败，请稍后重试')
    }
  }).catch(() => {
    // cancelled
  })
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  border-radius: 8px;
}
.generate-audio :deep(.el-dialog) {
  border-radius: 12px;
}

.queue-hint {
  min-width: 188px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  line-height: 1.4;
}
</style>
