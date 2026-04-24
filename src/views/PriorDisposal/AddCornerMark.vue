<template>
  <div class="add-corner-mark p-6 bg-gray-50 min-h-full">
    <!-- 顶部标题 -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">视频添加角标</h2>
        <p class="text-xs text-gray-400 mt-1">为已有视频添加角标水印，支持从角标库中选择图片</p>
      </div>
      <el-button type="primary" size="large" @click="openDialog">
        <el-icon class="mr-2"><el-icon-plus /></el-icon>
        创建任务
      </el-button>
    </div>

    <!-- 任务列表 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <!-- 搜索和批量操作 -->
      <div class="mb-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索视频标题或ID..."
            clearable
            style="width: 320px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
        <div class="flex items-center gap-2">
          <el-button
            type="primary"
            :disabled="selectedRows.length === 0"
            :loading="batchDownloading"
            @click="handleBatchDownload"
          >
            批量下载视频 ({{ selectedRows.length }})
          </el-button>
        </div>
      </div>

      <el-table
        :data="filteredTaskList"
        border
        style="width: 100%"
        header-cell-class-name="bg-gray-50 font-bold text-gray-700"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <el-table-column label="角标图片" width="120" align="center">
          <template #default="scope">
            <el-image
              v-if="scope.row.sourcePhotoUrl"
              :src="scope.row.sourcePhotoUrl"
              class="w-20 h-12 object-contain rounded border border-gray-200 cursor-pointer"
              fit="contain"
              :preview-src-list="[scope.row.sourcePhotoUrl]"
              preview-teleported
              hide-on-click-modal
            >
              <template #error>
                <div class="w-20 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                  <i class="el-icon-picture text-xl"></i>
                </div>
              </template>
            </el-image>
            <div v-else class="w-20 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 mx-auto">
              <i class="el-icon-picture text-xl"></i>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="视频信息" min-width="220">
          <template #default="scope">
            <div class="flex items-center gap-3 py-1">
              <div>
                <div class="font-bold text-gray-800 line-clamp-1">{{ scope.row.title || ('任务 #' + scope.row.id) }}</div>
                <div class="text-xs text-gray-400">ID: {{ scope.row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="任务状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.taskStatus)" effect="light">
              {{ getStatusLabel(scope.row.taskStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180" align="center">
          <template #default="scope">
            <span class="text-sm">{{ formatTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="完成时间" width="180" align="center">
          <template #default="scope">
            <span v-if="scope.row.taskStatus === 3" class="text-sm">{{ formatTime(scope.row.updateTime) }}</span>
            <span v-else class="text-gray-400 text-sm">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              plain
              :disabled="scope.row.taskStatus !== 3 || !scope.row.outputVideoUrl"
              @click="previewResult(scope.row)"
            >查看</el-button>
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建任务 Dialog -->
    <el-dialog
      title="创建角标添加任务"
      v-model="dialogVisible"
      width="580px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      @closed="resetForm"
    >
      <el-form :model="form" label-position="top">
        <!-- 任务标题 -->
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

        <!-- 源视频文件 -->
        <el-form-item label="上传源视频" required>
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
              <div class="text-xs text-gray-400 mt-2">支持 mp4、avi、mov、mkv 格式</div>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 角标选择 -->
        <el-form-item label="角标图片" required>
          <div class="w-full flex items-center gap-3">
            <div class="flex-1 flex items-center gap-3 px-3 py-2 border border-gray-300 rounded bg-white min-h-[42px]">
              <template v-if="form.cornerMarkImageUrl">
                <el-image
                  :src="form.cornerMarkImageUrl"
                  class="w-8 h-8 object-contain flex-shrink-0"
                  fit="contain"
                />
                <span class="text-gray-700 text-sm truncate flex-1">{{ form.cornerMarkName || form.cornerMarkImageUrl }}</span>
              </template>
              <span v-else class="text-gray-400 text-sm">请从角标库中选择图片</span>
            </div>
            <el-button type="primary" @click="openCornerMarkSelector">选择角标</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="submitting">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="submitting || !form.file || !form.cornerMarkImageUrl || titleValidating || (form.title.trim() !== '' && titleState === 'invalid')"
          @click="handleSubmit"
        >
          开始添加角标
        </el-button>
      </template>
    </el-dialog>

    <!-- 角标选择器 Dialog -->
    <el-dialog title="选择角标" v-model="cornerMarkSelector.visible" width="900px" append-to-body>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <el-input
            v-model="cornerMarkSelector.search"
            placeholder="搜索角标名称..."
            size="small"
            style="width: 300px"
            clearable
          >
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
          <span v-if="cornerMarkSelector.loading" class="text-xs text-gray-400">加载中...</span>
        </div>
        <div class="grid grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[600px] overflow-y-auto">
          <div
            v-for="item in filteredCornerMarks"
            :key="item.id"
            class="relative cursor-pointer group text-center"
            @click="selectCornerMark(item)"
          >
            <div
              class="rounded-lg overflow-hidden border-2 transition-all shadow-sm p-2 bg-white h-[300px] flex items-center justify-center"
              :class="form.cornerMarkImageUrl === item.photoUrl
                ? 'border-blue-500 shadow-lg shadow-blue-300/50'
                : 'border-blue-300 group-hover:border-blue-400 group-hover:shadow-md'"
            >
              <img
                :src="item.photoUrl"
                class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                :alt="item.name"
              >
            </div>
            <div class="mt-2">
              <p class="text-sm text-gray-700 font-medium truncate">{{ item.name }}</p>
            </div>
            <div v-if="form.cornerMarkImageUrl === item.photoUrl" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
          <div v-if="filteredCornerMarks.length === 0" class="col-span-3 py-16 text-center text-gray-400 text-sm">
            暂无角标数据
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 结果预览 Dialog -->
    <el-dialog
      :title="'结果预览 - ' + (previewItem?.title || ('任务 #' + previewItem?.id))"
      v-model="previewVisible"
      width="480px"
      destroy-on-close
    >
      <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
        <video
          v-if="previewItem?.outputVideoUrl"
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import JSZip from 'jszip'
import { createCornerMarkTask, checkCornerMarkTaskTitle, getCornerMarkTaskList, deleteCornerMarkTask, getCornerMarkList } from '/@/api/material'

// --- Types ---
interface CornerMarkTask {
  id: number | string
  title?: string
  taskId?: string
  sourceVideoUrl: string
  sourcePhotoUrl: string
  outputVideoUrl?: string
  taskStatus: number   // 1=等待中, 2=进行中, 3=已完成
  createTime: string
  updateTime?: string
}

// --- State ---
const taskList = ref<CornerMarkTask[]>([])
const selectedRows = ref<CornerMarkTask[]>([])
const batchDownloading = ref(false)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const submitting = ref(false)
const previewItem = ref<CornerMarkTask | null>(null)
const searchKeyword = ref('')

const filteredTaskList = computed(() => taskList.value)

const handleSearch = () => {
  pagination.currentPage = 1
  loadTaskList()
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  title: '',
  file: null as File | null,
  cornerMarkImageUrl: '',
  cornerMarkName: ''
})

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
    const res = await checkCornerMarkTaskTitle(t)
    if (res.data?.code === 0 || res.data?.code === 200) {
      const d = res.data.data
      titleValidated.value = t
      // API 返回 isValid (camelCase)
      const isValid = d?.isValid ?? d?.is_valid ?? true
      titleState.value = isValid ? 'valid' : 'invalid'
      titleRecommended.value = d?.recommendedName || d?.recommended_name || ''
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

// --- Corner Mark Selector ---
const cornerMarkList = ref<any[]>([])
const cornerMarkSelector = reactive({ visible: false, search: '', loading: false })

const filteredCornerMarks = computed(() =>
  cornerMarkList.value.filter(i => !cornerMarkSelector.search || i.name.includes(cornerMarkSelector.search))
)

const loadCornerMarkList = async () => {
  cornerMarkSelector.loading = true
  try {
    const res = await getCornerMarkList()
    const data = res.data?.data || res.data || []
    cornerMarkList.value = data.map((item: any) => ({
      id: item.id,
      name: item.photoName || item.name || '',
      photoUrl: item.photoUrl || ''
    }))
  } catch (error) {
    console.error('加载角标列表失败:', error)
  } finally {
    cornerMarkSelector.loading = false
  }
}

const openCornerMarkSelector = () => {
  cornerMarkSelector.search = ''
  cornerMarkSelector.visible = true
  if (cornerMarkList.value.length === 0) loadCornerMarkList()
}

const selectCornerMark = (item: any) => {
  form.cornerMarkImageUrl = item.photoUrl
  form.cornerMarkName = item.name
  cornerMarkSelector.visible = false
}

// --- Pagination ---
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

// --- Lifecycle ---
onMounted(() => {
  loadTaskList()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  if (titleTimer) clearTimeout(titleTimer)
})

// --- Load ---
const loadTaskList = async () => {
  try {
    const keyword = searchKeyword.value.trim()
    const search = keyword ? { title: keyword } : undefined
    const res = await getCornerMarkTaskList(pagination.currentPage, pagination.pageSize, search)
    const code = res.data?.code
    if (code === 0 || code === 200) {
      const data = res.data.data
      const list = data?.records || data?.data || []
      pagination.total = data?.total || 0
      taskList.value = list.map((item: any) => ({
        id: item.id,
        title: item.title || `任务 #${item.id}`,
        taskId: item.taskId || '',
        sourceVideoUrl: item.sourceVideoUrl || '',
        sourcePhotoUrl: item.sourcePhotoUrl || '',
        outputVideoUrl: item.outputVideoUrl || '',
        taskStatus: Number(item.taskStatus ?? 1),
        createTime: item.createTime || '',
        updateTime: item.updateTime || ''
      }))
    }
  } catch (error) {
    console.error('加载角标任务失败:', error)
  }
}

// --- Polling ---
const startPolling = () => {
  if (pollingTimer) return
  pollingTimer = setInterval(() => {
    const hasPending = taskList.value.some(t => t.taskStatus === 1 || t.taskStatus === 2)
    if (hasPending) loadTaskList()
  }, 5000)
}

const stopPolling = () => {
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
}

// --- File Change ---
const handleFileChange = (file: any) => {
  form.file = file.raw || null
}

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// --- Submit ---
const handleSubmit = async () => {
  if (submitting.value) return
  if (!form.file) return ElMessage.warning('请上传源视频文件')
  if (!form.cornerMarkImageUrl) return ElMessage.warning('请选择角标图片')

  const t = form.title.trim()
  if (t) {
    if (titleValidating.value) return ElMessage.warning('标题校验中，请稍候')
    if (titleState.value === 'idle') await validateTitle(t)
    if (titleState.value === 'invalid') return ElMessage.warning('标题已存在，请更换标题或使用推荐名称')
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('file', form.file!)
    formData.append('sourcePhotoUrl', form.cornerMarkImageUrl)
    if (t) formData.append('title', t)

    const res = await createCornerMarkTask(formData)
    const code = res.data?.code
    if (code === 0 || code === 200) {
      ElMessage.success('任务已提交，正在处理中，请稍候查看结果')
      dialogVisible.value = false
      pagination.currentPage = 1
      await loadTaskList()
    } else {
      const msg = res.data?.msg || res.data?.message || '提交失败，请稍后重试'
      // 若是标题重名，后端会在 400 里返回 recommendedName
      const recommended = res.data?.data?.recommendedName
      if (recommended) {
        ElMessage.warning(`${msg}，推荐使用：${recommended}`)
      } else {
        ElMessage.error(msg)
      }
    }
  } catch (error: any) {
    console.error('创建角标任务失败:', error)
    ElMessage.error(error?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// --- Delete ---
const handleDelete = (row: CornerMarkTask) => {
  ElMessageBox.confirm('确定要删除该角标任务吗？', '操作提示', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteCornerMarkTask(row.id)
      const code = res.data?.code
      if (code === 0 || code === 200) {
        ElMessage.success('已删除')
        await loadTaskList()
      } else {
        ElMessage.error(res.data?.msg || '删除失败')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '删除失败，请稍后重试')
    }
  }).catch(() => {})
}

// --- Preview ---
const previewResult = (row: CornerMarkTask) => {
  previewItem.value = row
  previewVisible.value = true
}

const handleSelectionChange = (rows: CornerMarkTask[]) => {
  selectedRows.value = rows
}

// 将 TOS 外部地址转成代理路径，解决 CORS
const toProxyUrl = (url: string) => {
  if (url.includes('tos-cn-beijing.volces.com')) {
    return url.replace(/^https?:\/\/[^/]+/, '/tos-proxy')
  }
  return url
}

const handleBatchDownload = async () => {
  const downloadable = selectedRows.value.filter(r => r.taskStatus === 3 && r.outputVideoUrl)
  if (downloadable.length === 0) {
    return ElMessage.warning('所选任务中没有已完成的视频可下载')
  }

  batchDownloading.value = true
  ElMessage.info(`准备打包 ${downloadable.length} 个视频...`)

  try {
    const zip = new JSZip()
    let successCount = 0
    let failedCount = 0

    const downloadPromises = downloadable.map(row =>
      fetch(toProxyUrl(row.outputVideoUrl!))
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.blob()
        })
        .then(blob => {
          const fileName = `${row.title || 'corner-mark'}-${row.id}.mp4`
          zip.file(fileName, blob)
          successCount++
        })
        .catch(err => {
          console.error(`下载失败: ${row.title} | url: ${row.outputVideoUrl}`, err)
          failedCount++
        })
    )

    await Promise.all(downloadPromises)

    if (successCount === 0) {
      ElMessage.error('所有视频下载失败，请检查网络或视频地址')
      return
    }

    ElMessage.info('正在生成压缩包...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `corner-mark-videos-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    if (successCount > 0) ElMessage.success(`成功打包并下载 ${successCount} 个视频`)
    if (failedCount > 0) ElMessage.warning(`${failedCount} 个视频下载失败`)
  } catch (error) {
    console.error('ZIP打包失败:', error)
    ElMessage.error('打包文件失败，请重试')
  } finally {
    batchDownloading.value = false
  }
}

const downloadResult = (row: CornerMarkTask | null) => {
  if (!row?.outputVideoUrl) return
  const a = document.createElement('a')
  a.href = row.outputVideoUrl
  a.download = `corner-mark-${row.id}.mp4`
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// --- Pagination ---
const handleSizeChange = (val: number) => { pagination.pageSize = val; pagination.currentPage = 1; loadTaskList() }
const handleCurrentChange = (val: number) => { pagination.currentPage = val; loadTaskList() }

// --- Helpers ---
const openDialog = () => { resetForm(); dialogVisible.value = true }

const resetForm = () => {
  form.title = ''
  form.file = null
  form.cornerMarkImageUrl = ''
  form.cornerMarkName = ''
  resetTitleValidation()
  if (titleTimer) clearTimeout(titleTimer)
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusLabel = (status: number) => {
  const map: Record<number, string> = { 1: '等待中', 2: '进行中', 3: '已完成' }
  return map[status] ?? '未知'
}

const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | '' => {
  if (status === 3) return 'success'
  if (status === 2) return 'warning'
  if (status === 1) return 'info'
  return ''
}
</script>

<style scoped>
:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
}
</style>
