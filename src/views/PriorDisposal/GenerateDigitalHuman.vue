<template>
  <div class="generate-digital-human p-6 bg-gray-50 min-h-full">
    <!-- Header Section -->
    <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between mb-4 border border-gray-100">
      <div>
        <h2 class="text-xl font-bold text-gray-800 tracking-tight">数字人视频生成</h2>
        <p class="text-xs text-gray-400 mt-1">通过单张照片与 AI 算法快速构建您的专属数字人角色</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="dialogVisible = true" class="shadow-sm">
        创建数字人
      </el-button>
    </div>

    <!-- Task List Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <el-table
        :data="taskList"
        style="width: 100%"
        :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column label="数字人信息" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <div class="flex items-center py-1">
              <el-image 
                :src="scope.row.basePhotoUrl" 
                class="w-10 h-10 rounded-lg mr-3 shadow-sm object-cover border border-gray-100 flex-shrink-0"
                fit="cover"
              >
                <template #error>
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <i class="el-icon-picture"></i>
                  </div>
                </template>
              </el-image>
              <div class="overflow-hidden">
                <div class="font-bold text-gray-700 leading-tight truncate text-sm">{{ scope.row.name }}</div>
                <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">ID: {{ scope.row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="性别" width="70" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.gender === '男' ? '' : 'danger'" size="mini" effect="plain" class="rounded">
              {{ scope.row.gender }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="生成进度" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="mini" effect="light" class="rounded">
              <i v-if="scope.row.status === '生成中' || scope.row.status === '已提交'" class="el-icon-loading mr-1"></i>
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="150" align="center">
          <template #default="scope">
            <span class="text-gray-500 text-xs">{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="完成时间" width="150" align="center">
          <template #default="scope">
            <span class="text-gray-400 text-xs">{{ scope.row.finishTime || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="190" align="center" fixed="right">
          <template #default="scope">
            <div class="flex items-center justify-center gap-2">
              <el-button 
                size="mini" 
                type="primary" 
                plain
                icon="el-icon-video-play"
                :disabled="scope.row.status !== '已完成'"
                @click="previewVideo(scope.row)"
              >
                预览视频
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

      <!-- Pagination -->
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

    <!-- Create Task Dialog -->
    <el-dialog
      title="创建数字人任务"
      v-model="dialogVisible"
      width="600px"
      custom-class="rounded-xl"
    >
      <el-form :model="form" label-width="100px" label-position="top">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="数字人名称" class="col-span-1">
            <el-input
              v-model="form.name"
              placeholder="请输入数字人名称"
              clearable
              @blur="handleNameBlur"
            ></el-input>
            <div class="mt-2 min-h-[20px] flex items-center justify-between gap-2">
              <span v-if="nameValidationLoading" class="text-xs text-gray-400">名称校验中...</span>
              <span v-else-if="nameValidationState === 'valid'" class="text-xs text-green-600">名称可用</span>
              <span v-else-if="nameValidationState === 'invalid'" class="text-xs text-amber-600">名称已存在，可使用推荐名称</span>
              <span v-else class="text-xs text-gray-400">输入名称后自动校验，避免重名</span>
              <el-button
                v-if="nameValidationState === 'invalid' && recommendedName"
                type="primary"
                link
                @click="applyRecommendedName"
              >
                使用推荐名：{{ recommendedName }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item label="性别" class="col-span-1">
            <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
              <el-option label="男" value="男"></el-option>
              <el-option label="女" value="女"></el-option>
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="形象图片上传" class="mt-2">
          <div class="mb-3" v-if="form.imageUrl">
            <div class="relative w-full h-[200px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50">
              <img :src="form.imageUrl" class="w-full h-full object-contain" />
              <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2">
                <span class="text-white text-sm font-medium">更换图片</span>
                <span class="text-white text-xs">点击下方上传</span>
              </div>
            </div>
          </div>
          <el-upload
            class="upload-demo w-full"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleImageChange"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          >
            <div class="flex flex-col items-center justify-center py-6">
              <i class="el-icon-picture text-5xl text-blue-400 mb-2"></i>
              <div class="el-upload__text text-sm text-gray-400">
                将形象照片拖到此处，或 <em class="text-blue-500 font-medium">点击上传</em>
              </div>
            </div>
            <template #tip>
              <div class="el-upload__tip text-gray-400 text-[11px] mt-2">
                建议上传正面、清晰、光线均匀的半身或全身照片。<span class="text-red-500">宽高比必须为 9:16</span>
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="正面提示词 (Positive Prompt)" class="mt-2">
          <el-input
            type="textarea"
            :rows="3"
            v-model="form.positivePrompt"
            placeholder="描述您希望生成的正面效果"
          ></el-input>
        </el-form-item>

        <el-form-item label="负面提示词 (Negative Prompt)" class="mt-2">
          <el-input
            type="textarea"
            :rows="3"
            v-model="form.negativePrompt"
            placeholder="描述您希望排除的负面效果"
          ></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelDialog" :disabled="submitting">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting || nameValidationLoading" :disabled="submitting || !canSubmitTask">
            开始训练生成
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Video Preview Dialog -->
    <el-dialog
      :title="'视频预览 - ' + currentItem.name"
      v-model="previewVisible"
      width="400px"
      custom-class="rounded-xl preview-dialog"
      destroy-on-close
    >
      <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[500px]">
        <video 
          v-if="currentItem.videoUrl"
          :src="currentItem.videoUrl" 
          controls 
          autoplay
          class="max-w-full max-h-[600px]"
        ></video>
        <div v-else class="text-gray-500 italic text-sm">
          暂无法加载视频素材
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTaskStore } from '/@/store/modules/task'
import { createDigitalHumanTask, getDigitalHumanTaskList, deleteDigitalHumanTask, validateDigitalHumanTaskName } from '/@/api/material'

// --- Types ---
interface DigitalHumanTask {
  id: string | number
  name: string
  gender: string
  status: '已完成' | '生成中' | '已提交' | '生成失败'
  basePhotoUrl: string
  videoUrl?: string
  createTime: string
  finishTime?: string
}

// --- Mock Data ---
const taskStore = useTaskStore()
const taskList = ref<DigitalHumanTask[]>([])

// --- State ---
const dialogVisible = ref(false)
const previewVisible = ref(false)
const submitting = ref(false)
const currentItem = ref<Partial<DigitalHumanTask>>({})
let nameValidateTimer: any = null

const form = reactive({
  name: '',
  gender: '女',
  imageUrl: '',
  rawFile: null as File | null,
  positivePrompt: '固定视角、静态背景、一个在说话的人物、牙齿清晰、自然的眨眼',
  negativePrompt: '移动的背景、六根手指、奇怪的手、低质量、糟糕的画质、移动的视角'
})

const nameValidationLoading = ref(false)
const nameValidationState = ref<'idle' | 'valid' | 'invalid'>('idle')
const recommendedName = ref('')
const validatedName = ref('')
const imageRatioValid = ref(false)
const canSubmitTask = computed(() => {
  const finalName = form.name.trim()
  return !!finalName
    && !nameValidationLoading.value
    && nameValidationState.value === 'valid'
    && validatedName.value === finalName
    && !!form.imageUrl
    && imageRatioValid.value
})

// --- Pagination ---
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// --- Lifecycle ---
onMounted(() => {
  loadDigitalHumanTaskList()
})

// --- Methods ---
const loadDigitalHumanTaskList = async () => {
  try {
    const res = await getDigitalHumanTaskList(pagination.currentPage, pagination.pageSize)
    if (res.data && res.data.code === 200) {
      const taskListData = res.data.data?.data || []
      taskList.value = taskListData.map((item: any) => {
        // 优先使用 videoUrl，如果没有才尝试解析 url
        let videoUrl = item.videoUrl || item.url || ''
        
        if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('[')) {
          // 如果看起来像JSON数组，尝试解析
          try {
            // 先处理单引号的情况
            if (videoUrl.includes("'")) {
              videoUrl = videoUrl.replace(/'/g, '"')
            }
            const urlArray = JSON.parse(videoUrl)
            videoUrl = urlArray[0] || ''
          } catch (e) {
            console.warn('Failed to parse URL as JSON, using raw value:', videoUrl)
          }
        }
        
        // 删除多余的引号
        if (videoUrl) {
          videoUrl = videoUrl.replace(/^["']|["']$/g, '')
        }
        console.debug('Video URL:', videoUrl)
        
        return {
          id: item.id,
          name: item.digitalHumanName || item.voiceName || item.name || item.humanName,
          gender: item.gender === 'male' ? '男' : '女',
          status: item.taskStatus === '2' ? '已完成' : (item.taskStatus === '1' ? '生成中' : (item.taskStatus === '0' ? '已提交' : '生成失败')),
          basePhotoUrl: item.basePhotoUrl || item.coverUrl || item.sourceImage || item.image || '',
          videoUrl: videoUrl,
          createTime: item.createTime,
          finishTime: item.updateTime || item.completeTime || item.finishTime
        }
      })
      pagination.total = res.data.data?.total || 0
    }
  } catch (error) {
    console.error('Failed to load digital human tasks:', error)
  }
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  loadDigitalHumanTaskList()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadDigitalHumanTaskList()
}

// --- Status Mapping ---
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    '已完成': 'success',
    '生成中': 'warning',
    '已提交': 'info',
    '生成失败': 'danger'
  }
  return map[status] || ''
}

const handleImageChange = (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  // 仅支持 jpg 和 png
  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('仅支持 JPG 和 PNG 格式的图片')
    return false
  }

  // 释放上一张图片的 Blob URL
  if (form.imageUrl) {
    URL.revokeObjectURL(form.imageUrl)
  }

  // 创建唯一 URL，img.src 和回显共用同一个对象
  const objectUrl = URL.createObjectURL(rawFile)

  const img = new Image()
  img.onload = () => {
    const aspectRatio = img.width / img.height
    const targetRatio = 9 / 16
    const tolerance = 0.05

    if (Math.abs(aspectRatio - targetRatio) > tolerance) {
      URL.revokeObjectURL(objectUrl)
      form.rawFile = null
      form.imageUrl = ''
      imageRatioValid.value = false
      ElMessage.error(`图片宽高比必须为 9:16（当前约为 ${img.width}:${img.height}），请重新上传`)
      return
    }

    // 校验通过：更新回显图片和文件数据
    form.rawFile = rawFile
    form.imageUrl = objectUrl
    imageRatioValid.value = true
  }

  img.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    form.rawFile = null
    form.imageUrl = ''
    imageRatioValid.value = false
    ElMessage.error('无法读取图片信息，请更换图片')
  }

  // 先清空旧数据，再异步加载新图
  form.rawFile = null
  form.imageUrl = ''
  imageRatioValid.value = false
  img.src = objectUrl
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
    const res = await validateDigitalHumanTaskName(finalName)
    const data = res.data?.data
    if (res.data?.code === 200 && data) {
      const isValid = !!data.is_valid
      validatedName.value = finalName
      nameValidationState.value = isValid ? 'valid' : 'invalid'
      recommendedName.value = data.recommended_name || ''
      if (!isValid && showError) {
        const tip = recommendedName.value ? `名称已存在，建议使用：${recommendedName.value}` : '名称已存在，请更换后重试'
        ElMessage.warning(tip)
      }
      return isValid
    }
    if (showError) ElMessage.error(res.data?.message || '名称校验失败，请稍后重试')
    nameValidationState.value = 'idle'
    return false
  } catch (error) {
    console.error('Failed to validate digital human name:', error)
    if (showError) ElMessage.error('名称校验失败，请稍后重试')
    nameValidationState.value = 'idle'
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
  if (form.imageUrl) URL.revokeObjectURL(form.imageUrl)
  form.imageUrl = ''
  form.rawFile = null
  imageRatioValid.value = false
  resetNameValidationState()
}

const handleSubmit = async () => {
  // 防止重复提交
  if (submitting.value) return
  
  if (!form.name.trim()) return ElMessage.warning('请输入数字人名称')
  if (!form.imageUrl) return ElMessage.warning('请上传一张形象照片')

  const finalName = form.name.trim()
  const nameValid = await validateName(finalName, true)
  if (!nameValid) return

  submitting.value = true
  
  try {
    // 构建 FormData
    const formData = new FormData()
    formData.append('file', form.rawFile!)
    formData.append('name', finalName)
    formData.append('gender', form.gender === '男' ? 'male' : 'female')
    formData.append('model', 'a2e')
    formData.append('language', 'zh')
    formData.append('positivePrompt', form.positivePrompt)
    formData.append('negativePrompt', form.negativePrompt)

    // 调用API提交任务
    const res = await createDigitalHumanTask(formData)
    
    if (res.data && res.data.code === 200) {
      // 同步到全局任务中心（暂未启用）
      // taskStore.addTask({
      //   taskType: 'DIGITAL_HUMAN_TASK',
      //   subTitle: `角色：${form.name} (${form.gender})`,
      //   status: 'running',
      //   image: form.imageUrl
      // })

      // 重新加载任务列表
      pagination.currentPage = 1
      await loadDigitalHumanTaskList()
      
      // 清空表单
      form.name = ''
      form.imageUrl = ''
      form.rawFile = null
      imageRatioValid.value = false
      resetNameValidationState()
      
      // 关闭对话框
      dialogVisible.value = false
      
      ElMessage.success('数字人训练任务已提交，预计生成时间 15-30 分钟')
      
      // 延迟 1 秒后刷新页面，清空缓存
      setTimeout(() => {
        location.reload()
      }, 1000)
    } else {
      ElMessage.error(res.data?.message || '提交失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('Failed to create digital human task:', error)
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
    nameValidateTimer = setTimeout(() => {
      validateName(finalName)
    }, 400)
  }
)

onUnmounted(() => {
  if (nameValidateTimer) clearTimeout(nameValidateTimer)
})

const previewVideo = (row: DigitalHumanTask) => {
  currentItem.value = row
  previewVisible.value = true
}

const handleDelete = (index: number) => {
  const task = taskList.value[index]
  if (!task.id) {
    ElMessage.warning('无法删除：任务ID不存在')
    return
  }

  ElMessageBox.confirm('确定要删除该数字人任务吗？生成的视频资产也将被移除。', '操作提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteDigitalHumanTask(task.id)
      if (res.data && res.data.code === 200) {
        taskList.value.splice(index, 1)
        ElMessage.success('已移除')
      } else {
        ElMessage.error(res.data?.message || '删除失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('Failed to delete digital human task:', error)
      ElMessage.error(error.message || '删除失败，请稍后重试')
    }
  }).catch(() => {
    // User cancelled
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
  border-radius: 12px;
}
.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #000;
}
.preview-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}
</style>
