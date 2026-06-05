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
            placeholder="搜索视频标题或 ID..."
            clearable
            style="width: 320px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
        <div class="flex items-center gap-2">
          <el-radio-group v-model="listViewMode" @change="handleListModeChange">
            <el-radio-button label="single">单任务列表</el-radio-button>
            <el-radio-button label="batch">批量任务列表</el-radio-button>
          </el-radio-group>
          <el-button
            v-if="listViewMode === 'single'"
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
        v-if="listViewMode === 'single'"
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

        <el-table-column label="操作" width="210" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              plain
              :disabled="scope.row.taskStatus !== 3 || !scope.row.outputVideoUrl"
              @click="previewResult(scope.row)"
            >查看</el-button>
            <el-button
              type="success"
              size="small"
              plain
              :disabled="scope.row.taskStatus !== 3 || !scope.row.outputVideoUrl"
              @click="downloadResult(scope.row)"
            >下载</el-button>
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-else
        :data="batchTaskList"
        border
        style="width: 100%"
        header-cell-class-name="bg-gray-50 font-bold text-gray-700"
        row-key="id"
        @expand-change="handleBatchExpand"
      >
        <el-table-column type="expand" width="55">
          <template #default="scope">
            <el-table :data="scope.row.items || []" size="small" border>
              <el-table-column label="子任务ID" prop="id" width="100" />
              <el-table-column label="视频" min-width="220">
                <template #default="child">
                  <div class="text-sm">{{ child.row.title || ('子任务 #' + child.row.id) }}</div>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="child">
                  <el-tag :type="getBatchItemStatusType(child.row.taskStatus)" effect="light">
                    {{ getBatchItemStatusLabel(child.row.taskStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="完成时间" width="180" align="center">
                <template #default="child">
                  <span v-if="child.row.taskStatus === 2" class="text-sm">{{ formatTime(child.row.updateTime) }}</span>
                  <span v-else class="text-gray-400 text-sm">-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center" fixed="right">
                <template #default="child">
                  <el-button
                    type="primary"
                    size="small"
                    plain
                    :disabled="child.row.taskStatus !== 2 || !child.row.outputVideoUrl"
                    @click="previewResult(child.row)"
                  >查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="批次ID" prop="id" width="100" />
        <el-table-column label="批次名称" min-width="220">
          <template #default="scope">
            <div class="font-bold text-gray-800 line-clamp-1">{{ scope.row.title || ('批次 #' + scope.row.id) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="180">
          <template #default="scope">
            <div class="text-sm">
              {{ scope.row.successCount || 0 }}/{{ scope.row.totalCount || 0 }}
              <span class="text-gray-400 ml-2">失败 {{ scope.row.failedCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
                <template #default="scope">
            <el-tag :type="getBatchStatusType(scope.row.taskStatus)" effect="light">
              {{ getBatchStatusLabel(scope.row.taskStatus) }}
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
            <span v-if="scope.row.taskStatus === 2" class="text-sm">{{ formatTime(scope.row.completeTime || scope.row.updateTime) }}</span>
            <span v-else class="text-gray-400 text-sm">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" plain @click="openBatchDetail(scope.row)">查看子任务</el-button>
            <el-button type="success" size="small" plain @click="downloadBatchZip(scope.row)">打包下载</el-button>
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

    <!-- 创建任务弹窗 -->
    <el-dialog
      title="创建角标添加任务"
      v-model="dialogVisible"
      width="580px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      @closed="resetForm"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="上传模式">
          <el-radio-group v-model="form.mode">
            <el-radio label="single">单文件</el-radio>
            <el-radio label="folder">文件夹批量</el-radio>
          </el-radio-group>
        </el-form-item>
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
            <span v-else-if="titleState === 'valid'" class="text-xs text-green-600">标题可用</span>
            <span v-else-if="titleState === 'invalid'" class="text-xs text-amber-600">标题已存在，可使用推荐名称</span>
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

        <!-- 视频上传 -->
        <el-form-item :label="form.mode === 'single' ? '上传视频' : '上传视频文件夹'" required>
          <div v-if="form.mode === 'single' && form.file" class="w-full mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
            <i class="el-icon-video-camera text-blue-500 text-xl flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-700 truncate">{{ form.file.name }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ formatFileSize(form.file.size) }}</div>
            </div>
            <el-button type="danger" link size="small" @click="form.file = null">移除</el-button>
          </div>
          <div v-if="form.mode === 'folder' && form.files.length > 0" class="w-full mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-sm font-medium text-gray-700">已选择 {{ form.files.length }} 个视频文件</div>
            <div class="text-xs text-gray-400 mt-1 truncate">{{ form.files.slice(0, 5).map(f => f.name).join('、') }}<span v-if="form.files.length > 5"> ...</span></div>
            <el-button type="danger" link size="small" class="mt-1" @click="clearFolderFiles">清空</el-button>
          </div>
          <el-upload
            v-if="form.mode === 'single'"
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
              <div class="text-sm text-gray-500">将文件拖到此处，或<em class="text-blue-500 font-medium not-italic">点击上传</em></div>
              <div class="text-xs text-gray-400 mt-2">支持 mp4、avi、mov、mkv 格式</div>
            </div>
          </el-upload>
          <div v-else class="w-full border border-dashed border-blue-300 rounded-lg bg-blue-50/40 p-6 text-center">
            <i class="el-icon-folder-opened text-5xl text-blue-400 mb-3"></i>
            <div class="text-sm text-gray-600">请选择一个文件夹，系统会自动读取其中视频文件</div>
            <div class="text-xs text-gray-400 mt-2">支持 mp4、avi、mov、mkv 格式</div>
            <el-button class="mt-3" type="primary" @click="triggerFolderPick">选择文件夹</el-button>
            <input ref="folderInputRef" type="file" webkitdirectory directory multiple class="hidden" @change="handleFolderChange" />
          </div>
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

        <!-- 批量上传进度 -->
        <div
          v-if="uploadProgress.visible"
          class="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-medium text-gray-700">
              正在上传视频到 MinIO
            </div>
            <div class="text-xs text-gray-500">
              {{ uploadProgress.done }}/{{ uploadProgress.total }}
            </div>
          </div>

          <el-progress
            :percentage="uploadProgress.percent"
            :stroke-width="18"
            :status="uploadProgress.failed > 0 ? 'warning' : undefined"
          />

          <div class="mt-2 text-xs text-gray-500">
            已上传 {{ uploadProgress.success }} 个，
            失败 {{ uploadProgress.failed }} 个，
            剩余 {{ uploadProgress.remaining }} 个
          </div>

          <div v-if="uploadProgress.currentFileName" class="mt-1 text-xs text-gray-400 truncate">
            当前文件：{{ uploadProgress.currentFileName }}
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            开始添加角标
          </el-button>
      </template>
    </el-dialog>

    <!-- 角标选择弹窗 -->
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

    <!-- 结果预览弹窗 -->
    <el-dialog
      :title="'结果预览 - ' + (previewItem?.title || ('任务 #' + previewItem?.id))"
      v-model="previewVisible"
      width="480px"
      destroy-on-close
      @closed="handlePreviewClosed"
    >
      <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
        <video
          v-if="previewItem?.outputVideoUrl"
          ref="previewVideoRef"
          :src="previewItem.outputVideoUrl"
          controls
          autoplay
          class="max-w-full max-h-[560px]"
        ></video>
        <div v-else class="text-gray-500 text-sm italic">暂无可预览视频</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="downloadResult(previewItem)">下载视频</el-button>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchDetailVisible"
      :title="'批次子任务 - ' + (currentBatch?.title || ('批次 #' + currentBatch?.id))"
      width="1000px"
      destroy-on-close
    >
      <el-table :data="batchDetailItems" border v-loading="batchDetailLoading">
        <el-table-column label="子任务ID" prop="id" width="100" />
        <el-table-column label="标题" min-width="180">
          <template #default="scope">
            {{ scope.row.title || ('子任务 #' + scope.row.id) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getBatchItemStatusType(scope.row.taskStatus)" effect="light">
              {{ getBatchItemStatusLabel(scope.row.taskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" min-width="180">
          <template #default="scope">
            <span class="text-gray-500">{{ scope.row.errorMsg || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="180" align="center">
          <template #default="scope">
            <span>{{ formatTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              plain
              :disabled="!scope.row.outputVideoUrl"
              @click="previewResult(scope.row)"
            >预览</el-button>
            <el-button
              type="success"
              size="small"
              plain
              :disabled="!scope.row.outputVideoUrl"
              @click="downloadResult(scope.row)"
            >下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="batchDetailPagination.currentPage"
          v-model:page-size="batchDetailPagination.pageSize"
          :total="batchDetailPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadBatchDetail"
          @current-change="loadBatchDetail"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import JSZip from 'jszip'
import {
  createCornerMarkTaskDirectSingle,
  createCornerMarkDirectBatch,
  confirmCornerMarkUpload,
  checkCornerMarkTaskTitle,
  getCornerMarkTaskList,
  getCornerMarkBatchTaskList,
  getCornerMarkBatchTaskDetail,
  deleteCornerMarkTask,
  getCornerMarkList
} from '/@/api/material'

// --- Types ---
interface CornerMarkTask {
  id: number | string
  title?: string
  taskId?: string
  sourceVideoUrl: string
  sourcePhotoUrl: string
  outputVideoUrl?: string
  errorMsg?: string
  taskStatus: number   // 1=等待中 2=进行中 3=已完成
  createTime: string
  completeTime?: string
  updateTime?: string
}

interface CornerMarkBatchTask {
  id: number | string
  title?: string
  taskStatus: number
  totalCount: number
  successCount: number
  failedCount: number
  createTime: string
  completeTime?: string
  updateTime?: string
  items?: CornerMarkTask[]
}

// --- State ---
const taskList = ref<CornerMarkTask[]>([])
const batchTaskList = ref<CornerMarkBatchTask[]>([])
const selectedRows = ref<CornerMarkTask[]>([])
const batchDownloading = ref(false)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const submitting = ref(false)
const previewItem = ref<CornerMarkTask | null>(null)
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const searchKeyword = ref('')
const listViewMode = ref<'single' | 'batch'>('single')
const batchDetailVisible = ref(false)
const batchDetailLoading = ref(false)
const currentBatch = ref<CornerMarkBatchTask | null>(null)
const batchDetailItems = ref<CornerMarkTask[]>([])
const batchDetailPagination = reactive({ currentPage: 1, pageSize: 10, total: 0 })

const filteredTaskList = computed(() => taskList.value)

const handleSearch = () => {
  pagination.currentPage = 1
  loadCurrentList()
}

const handleListModeChange = () => {
  selectedRows.value = []
  pagination.currentPage = 1
  loadCurrentList()
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  mode: 'single' as 'single' | 'folder',
  title: '',
  file: null as File | null,
  files: [] as File[],
  cornerMarkImageUrl: '',
  cornerMarkName: ''
})

const uploadProgress = reactive({
  visible: false,
  total: 0,
  success: 0,
  failed: 0,
  done: 0,
  percent: 0,
  currentFileName: '',
  remaining: 0
})

const resetUploadProgress = () => {
  uploadProgress.visible = false
  uploadProgress.total = 0
  uploadProgress.success = 0
  uploadProgress.failed = 0
  uploadProgress.done = 0
  uploadProgress.percent = 0
  uploadProgress.currentFileName = ''
  uploadProgress.remaining = 0
}

const updateUploadProgress = () => {
  uploadProgress.done = uploadProgress.success + uploadProgress.failed
  uploadProgress.remaining = Math.max(uploadProgress.total - uploadProgress.done, 0)
  uploadProgress.percent = uploadProgress.total
    ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
    : 0
}

const folderInputRef = ref<HTMLInputElement | null>(null)
const hasUploadPayload = computed(() => form.mode === 'single' ? !!form.file : form.files.length > 0)

// --- Title validation ---
const titleValidating = ref(false)
const titleState = ref<'idle' | 'valid' | 'invalid'>('idle')
const titleRecommended = ref('')
const titleValidated = ref('')
let titleTimer: ReturnType<typeof setTimeout> | null = null

const handlePreviewClosed = () => {
  if (!previewVideoRef.value) return
  previewVideoRef.value.pause()
  previewVideoRef.value.currentTime = 0
}

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
  loadCurrentList()
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
          taskStatus: Number(item.taskStatus ?? item.status ?? 1),
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
    const hasPending = listViewMode.value === 'single'
      ? taskList.value.some(t => t.taskStatus === 1 || t.taskStatus === 2)
      : batchTaskList.value.some(t => t.taskStatus === 1 || t.taskStatus === 2)
    if (hasPending) loadCurrentList()
  }, 5000)
}

const stopPolling = () => {
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
}

// --- File Change ---
const handleFileChange = (file: any) => {
  form.file = file.raw || null
}

const triggerFolderPick = () => {
  folderInputRef.value?.click()
}

const clearFolderFiles = () => {
  form.files = []
  if (folderInputRef.value) folderInputRef.value.value = ''
}

const handleFolderChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const fileList = Array.from(input.files || [])
  const allowed = ['.mp4', '.avi', '.mov', '.mkv']
  form.files = fileList.filter((f) => {
    const name = f.name.toLowerCase()
    return allowed.some(ext => name.endsWith(ext))
  })
  if (form.files.length === 0) {
    ElMessage.warning('文件夹中未找到可用视频文件')
  }
}

const loadBatchTaskList = async () => {
  try {
    const keyword = searchKeyword.value.trim()
    const search = keyword ? { title: keyword } : undefined
    const res = await getCornerMarkBatchTaskList(pagination.currentPage, pagination.pageSize, search)
    const code = res.data?.code
    if (code === 0 || code === 200) {
      const data = res.data.data
      const list = data?.records || data?.data || []
      pagination.total = data?.total || 0
      batchTaskList.value = list.map((item: any) => ({
        id: item.id,
        title: item.title || `批次 #${item.id}`,
        taskStatus: Number(item.status ?? item.taskStatus ?? 0),
        totalCount: Number(item.totalCount ?? item.total_count ?? 0),
        successCount: Number(item.successCount ?? item.success_count ?? 0),
        failedCount: Number(item.failedCount ?? item.failed_count ?? 0),
        createTime: item.createTime || '',
        completeTime: item.completeTime || '',
        updateTime: item.updateTime || '',
        items: []
      }))
    }
  } catch (error) {
    console.error('加载角标批量任务失败:', error)
  }
}

const loadCurrentList = () => {
  if (listViewMode.value === 'single') return loadTaskList()
  return loadBatchTaskList()
}

const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const uploadToMinio = async (file: File, uploadUrl: string): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    }
  })

  if (!response.ok) {
    throw new Error(`MinIO 上传失败，HTTP ${response.status}`)
  }
}

// ===== 新增上传函数：带进度监听 =====
const uploadToMinioWithProgress = (file: File, uploadUrl: string, onProgress: (loaded: number, total: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    // 上传进度
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded, event.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`MinIO 上传失败，HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('MinIO 上传请求出错'))
    xhr.onabort = () => reject(new Error('MinIO 上传被取消'))
    xhr.send(file)
  })
}

// --- Submit ---
const handleSubmit = async () => {
  if (submitting.value) return
  if (!hasUploadPayload.value) return ElMessage.warning('请先上传视频文件')
  if (!form.cornerMarkImageUrl) return ElMessage.warning('请选择角标图片')

  const t = form.title.trim()

  if (t) {
    if (titleValidating.value) return ElMessage.warning('标题校验中，请稍候')
    if (titleState.value === 'idle') await validateTitle(t)
    if (titleState.value === 'invalid') {
      return ElMessage.warning('标题已存在，请更换标题或使用推荐名称')
    }
  }

  submitting.value = true

  try {
    if (form.mode === 'folder') {
      const filesPayload = form.files.map((file) => ({
        name: file.name,
        size: file.size,
        content_type: file.type || 'application/octet-stream',
        relative_path: (file as any).webkitRelativePath || file.name
      }))

      const createRes = await createCornerMarkDirectBatch({
        files: filesPayload,
        sourcePhotoUrl: form.cornerMarkImageUrl,
        ...(t && { title: t })
      })

      const createCode = createRes.data?.code

      if (createCode !== 0 && createCode !== 200) {
        throw new Error(createRes.data?.msg || createRes.data?.message || '创建批量上传任务失败')
      }

      const taskList = createRes.data?.data?.tasks || []

      if (!taskList.length) {
        throw new Error('后端未返回上传任务列表')
      }

      const taskMap = new Map<
        string,
        {
          file_id: string | number
          object_name: string
          upload_url: string
        }
      >()

      taskList.forEach((item: any) => {
        const key = item.relative_path || item.file_name
        taskMap.set(key, {
          file_id: item.file_id,
          object_name: item.object_name,
          upload_url: item.upload_url
        })
      })

      const uploadedFiles: {
        file_id: string | number
        object_name: string
        file_size: number
      }[] = []

      const uploadErrors: string[] = []

      uploadProgress.visible = true
      uploadProgress.total = form.files.length
      uploadProgress.success = 0
      uploadProgress.failed = 0
      uploadProgress.done = 0
      uploadProgress.percent = 0
      uploadProgress.remaining = form.files.length
      uploadProgress.currentFileName = ''

      for (const file of form.files) {
        const key = (file as any).webkitRelativePath || file.name
        const info = taskMap.get(key)

        uploadProgress.currentFileName = file.name

        if (!info) {
          uploadErrors.push(`${file.name}: 未找到上传凭证`)
          uploadProgress.failed++
          updateUploadProgress()
          continue
        }

        try {
          await uploadToMinioWithProgress(file, info.upload_url, (loaded, total) => {
            uploadProgress.currentFileName = file.name
          })

          uploadedFiles.push({
            file_id: info.file_id,
            object_name: info.object_name,
            file_size: file.size
          })

          uploadProgress.success++
          updateUploadProgress()
        } catch (error: any) {
          uploadErrors.push(`${file.name}: ${error?.message || '上传失败'}`)
          uploadProgress.failed++
          updateUploadProgress()
        }
      }

      uploadProgress.currentFileName = ''

      if (!uploadedFiles.length) {
        throw new Error(`所有文件上传失败：${uploadErrors.join('；')}`)
      }

      const confirmRes = await confirmCornerMarkUpload({
        files: uploadedFiles
      })

      const confirmCode = confirmRes.data?.code

      if (confirmCode !== 0 && confirmCode !== 200) {
        throw new Error(confirmRes.data?.msg || confirmRes.data?.message || '确认上传失败')
      }

      const msgParts = [`成功上传 ${uploadedFiles.length} 个视频`]

      if (uploadErrors.length > 0) {
        msgParts.push(`${uploadErrors.length} 个失败`)
      }

      ElMessage.success(msgParts.join('，') + '，正在处理中')

      dialogVisible.value = false
      listViewMode.value = 'batch'
      pagination.currentPage = 1
      await loadCurrentList()
      return
    }

    const file = form.file as File

    const createRes = await createCornerMarkTaskDirectSingle({
      file_name: file.name,
      file_size: file.size,
      content_type: file.type || 'application/octet-stream',
      sourcePhotoUrl: form.cornerMarkImageUrl,
      ...(t && { title: t })
    })

    const createCode = createRes.data?.code

    if (createCode !== 0 && createCode !== 200) {
      throw new Error(createRes.data?.msg || createRes.data?.message || '创建上传任务失败')
    }

    const createData = createRes.data?.data || {}
    const { file_id, object_name, upload_url } = createData

    if (!file_id || !object_name || !upload_url) {
      throw new Error('后端返回上传参数不完整')
    }

    await uploadToMinioWithProgress(file, upload_url, (loaded, total) => {
      uploadProgress.visible = true
      uploadProgress.total = 1
      uploadProgress.currentFileName = file.name
      uploadProgress.percent = Math.round((loaded / total) * 100)
    })

    const confirmRes = await confirmCornerMarkUpload({
      files: [
        {
          file_id,
          object_name,
          file_size: file.size
        }
      ]
    })

    const confirmCode = confirmRes.data?.code

    if (confirmCode !== 0 && confirmCode !== 200) {
      throw new Error(confirmRes.data?.msg || confirmRes.data?.message || '确认上传失败')
    }

    ElMessage.success('视频已上传，正在处理中')
    dialogVisible.value = false
    pagination.currentPage = 1
    await loadCurrentList()
  } catch (error: any) {
    console.error('创建角标任务失败:', error)
    ElMessage.error(error?.message || '提交失败，请稍后重试')
  } finally {
      submitting.value = false
      if (!dialogVisible.value) {
        resetUploadProgress()
      }
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
          await loadCurrentList()
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

const handleBatchExpand = async (row: CornerMarkBatchTask, expandedRows: CornerMarkBatchTask[]) => {
  const isExpanded = expandedRows.some((r) => r.id === row.id)
  if (!isExpanded || (row.items && row.items.length > 0)) return
  try {
    const res = await getCornerMarkBatchTaskDetail(row.id, 1, 50)
    const code = res.data?.code
    if (code !== 0 && code !== 200) return
    const data = res.data?.data || {}
    const list = data?.items?.data || data?.items || data?.records || data?.data || []
    row.items = list.map((item: any) => ({
      id: item.id,
      title: item.title || `子任务 #${item.id}`,
      taskId: item.taskId || '',
      sourceVideoUrl: item.sourceVideoUrl || '',
      sourcePhotoUrl: item.sourcePhotoUrl || '',
      outputVideoUrl: item.outputVideoUrl || '',
      errorMsg: item.errorMsg || item.error_msg || '',
      taskStatus: Number(item.status ?? item.taskStatus ?? 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || ''
    }))
  } catch (error) {
    console.error('加载批次子任务失败:', error)
  }
}

const openBatchDetail = async (row: CornerMarkBatchTask) => {
  currentBatch.value = row
  batchDetailPagination.currentPage = 1
  batchDetailVisible.value = true
  await loadBatchDetail()
}

const loadBatchDetail = async () => {
  if (!currentBatch.value) return
  batchDetailLoading.value = true
  try {
    const res = await getCornerMarkBatchTaskDetail(
      currentBatch.value.id,
      batchDetailPagination.currentPage,
      batchDetailPagination.pageSize
    )
    const code = res.data?.code
    if (code !== 0 && code !== 200) return
    const data = res.data?.data || {}
    const items = data?.items?.data || []
    batchDetailPagination.total = data?.items?.total || items.length
    batchDetailItems.value = items.map((item: any) => ({
      id: item.id,
      title: item.title || `子任务 #${item.id}`,
      taskId: item.taskId || '',
      sourceVideoUrl: item.sourceVideoUrl || '',
      sourcePhotoUrl: item.sourcePhotoUrl || '',
      outputVideoUrl: item.outputVideoUrl || '',
      errorMsg: item.errorMsg || item.error_msg || '',
      taskStatus: Number(item.status ?? item.taskStatus ?? 0),
      createTime: item.createTime || '',
      updateTime: item.updateTime || ''
    }))
  } catch (error) {
    console.error('加载批次详情失败:', error)
  } finally {
    batchDetailLoading.value = false
  }
}

const downloadBatchZip = async (row: CornerMarkBatchTask) => {
  batchDownloading.value = true
  ElMessage.info('正在收集批次视频并打包，请稍候...')
  try {
    let page = 1
    const pageSize = 100
    let total = 0
    const allItems: any[] = []

    do {
      const res = await getCornerMarkBatchTaskDetail(row.id, page, pageSize)
      const code = res.data?.code
      if (code !== 0 && code !== 200) break
      const data = res.data?.data || {}
      const itemsWrap = data?.items || {}
      const list = itemsWrap.data || []
      total = Number(itemsWrap.total || list.length || 0)
      allItems.push(...list)
      page += 1
      if (list.length === 0) break
    } while (allItems.length < total)

    const downloadable = allItems.filter((item: any) => !!item.outputVideoUrl)
    if (downloadable.length === 0) {
      ElMessage.warning('该批次暂无可下载视频')
      return
    }

    const zip = new JSZip()
    let successCount = 0
    let failedCount = 0

    const downloadPromises = downloadable.map((item: any) =>
      fetch(toProxyUrl(item.outputVideoUrl))
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.blob()
        })
        .then((blob) => {
          const fileName = `${item.title || `item-${item.id}`}.mp4`
          zip.file(fileName, blob)
          successCount++
        })
        .catch(() => {
          failedCount++
        })
    )

    await Promise.all(downloadPromises)
    if (successCount === 0) {
      ElMessage.error('批次视频下载失败，请稍后重试')
      return
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.title || `batch-${row.id}`}-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    ElMessage.success(`打包完成，成功 ${successCount} 个视频`)
    if (failedCount > 0) ElMessage.warning(`${failedCount} 个视频下载失败`)
  } catch (error) {
    console.error('批次打包下载失败:', error)
    ElMessage.error('批次打包下载失败，请稍后重试')
  } finally {
    batchDownloading.value = false
  }
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
    return ElMessage.warning('所选任务中没有可下载视频')
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
    console.error('ZIP 打包失败:', error)
    ElMessage.error('打包文件失败，请重试')
  } finally {
    batchDownloading.value = false
  }
}

const downloadResult = (row: CornerMarkTask | null) => {
  if (!row?.outputVideoUrl) return
  fetch(toProxyUrl(row.outputVideoUrl))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `corner-mark-${row.id}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    })
    .catch((error) => {
      console.error('下载失败:', error)
      ElMessage.error('下载失败，请稍后重试')
    })
}

// --- Pagination ---
const handleSizeChange = (val: number) => { pagination.pageSize = val; pagination.currentPage = 1; loadCurrentList() }
const handleCurrentChange = (val: number) => { pagination.currentPage = val; loadCurrentList() }

// --- Helpers ---
const openDialog = () => { resetForm(); resetUploadProgress();dialogVisible.value = true }

const resetForm = () => {
  form.mode = 'single'
  form.title = ''
  form.file = null
  form.files = []
  form.cornerMarkImageUrl = ''
  form.cornerMarkName = ''
  if (folderInputRef.value) folderInputRef.value.value = ''
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

const getBatchStatusLabel = (status: number) => {
  const map: Record<number, string> = { '-1': '全部失败', 0: '初始', 1: '处理中', 2: '已完成' }
  return map[status] ?? '未知'
}

const getBatchStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | '' => {
  if (status === 2) return 'success'
  if (status === 1) return 'warning'
  if (status === 0) return 'info'
  if (status === -1) return 'danger'
  return ''
}

const getBatchItemStatusLabel = (status: number) => {
  const map: Record<number, string> = { '-1': '任务失败', 0: '等待中', 1: '进行中', 2: '已完成' }
  return map[status] ?? '未知'
}

const getBatchItemStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | '' => {
  if (status === 2) return 'success'
  if (status === 1) return 'warning'
  if (status === 0) return 'info'
  if (status === -1) return 'danger'
  return ''
}
</script>

<style scoped>
:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
}
</style>

