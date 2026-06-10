<template>
  <div class="generate-digital-human p-6 bg-gray-50 min-h-full">
    <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between mb-4 border border-gray-100">
      <div>
        <h2 class="text-xl font-bold text-gray-800 tracking-tight">数字人视频生成</h2>
        <p class="text-xs text-gray-400 mt-1">通过单张图片和提示词快速创建数字人训练任务</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="queue-hint">
          <div class="text-xs text-gray-400">今日排队</div>
          <div v-if="digitalHumanWaitingInfo.waitingTotal > 0" class="text-sm font-semibold text-gray-700">
            当前还有 <span class="text-amber-600">{{ digitalHumanWaitingInfo.waitingTotal }}</span> 个等待任务
          </div>
          <div v-else class="text-sm font-semibold text-gray-700">当前没有等待任务</div>
        </div>
        <el-button type="primary" @click="dialogVisible = true" class="shadow-sm">创建数字人</el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <el-table
        :data="taskList"
        style="width: 100%"
        :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column label="数字人信息" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center py-1">
              <el-image
                :src="row.basePhotoUrl"
                class="w-10 h-10 rounded-lg mr-3 shadow-sm object-cover border border-gray-100 flex-shrink-0"
                fit="cover"
              >
                <template #error>
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">图</div>
                </template>
              </el-image>
              <div class="overflow-hidden">
                <div class="font-bold text-gray-700 leading-tight truncate text-sm">{{ row.name }}</div>
                <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="性别" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.gender === '男' ? '' : 'danger'" size="mini" effect="plain" class="rounded">
              {{ row.gender }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="生成进度" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="mini" effect="light" class="rounded">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="text-gray-500 text-xs">{{ row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="完成时间" width="170" align="center">
          <template #default="{ row }">
            <span class="text-gray-400 text-xs">{{ row.status === '已完成' ? (row.finishTime || '-') : '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="190" align="center" fixed="right">
          <template #default="{ $index, row }">
            <div class="flex items-center justify-center gap-2">
              <el-button size="mini" type="primary" plain :disabled="row.status !== '已完成'" @click="previewVideo(row)">
                预览视频
              </el-button>
              <el-button size="mini" type="danger" plain @click="handleDelete($index)">删除</el-button>
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
        />
      </div>
    </div>

    <el-dialog title="创建数字人任务" v-model="dialogVisible" width="1100px" destroy-on-close>
      <div class="flex gap-5 items-start">
        <div class="flex-1 min-w-0">
          <el-form :model="form" label-width="100px" label-position="top">
            <div class="grid grid-cols-2 gap-4">
              <el-form-item label="数字人名称">
                <el-input v-model="form.name" placeholder="请输入数字人名称" clearable @blur="handleNameBlur" />
                <div class="mt-2 min-h-[20px] flex items-center justify-between gap-2">
                  <span v-if="nameValidationLoading" class="text-xs text-gray-400">名称校验中...</span>
                  <span v-else-if="nameValidationState === 'valid'" class="text-xs text-green-600">名称可用</span>
                  <span v-else-if="nameValidationState === 'invalid'" class="text-xs text-amber-600">名称已存在，可使用推荐名称</span>
                  <span v-else class="text-xs text-gray-400">输入名称后会自动校验，避免重名</span>
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

              <el-form-item label="性别">
                <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </div>

            <el-form-item label="视频方向" class="mt-2">
              <el-radio-group v-model="orientation">
                <el-radio-button label="portrait">竖屏 9:16</el-radio-button>
                <el-radio-button label="landscape">横屏 16:9</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="形象图片上传" class="mt-2">
              <div class="mb-3" v-if="form.imageUrl">
                <div class="relative w-full h-[200px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50">
                  <img :src="form.imageUrl" class="w-full h-full object-contain" />
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
                  <div class="text-4xl text-blue-400 mb-2">图</div>
                  <div class="el-upload__text text-sm text-gray-400">
                    将图片拖到此处，或 <em class="text-blue-500 font-medium">点击上传</em>
                  </div>
                </div>
                <template #tip>
                  <div class="el-upload__tip text-gray-400 text-[11px] mt-2">
                    建议上传正面、清晰、光线均匀的半身或全身照片。
                    <span v-if="orientation === 'portrait'" class="text-red-500">竖屏模式要求接近 9:16</span>
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <div class="mb-4">
              <div class="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-bold text-gray-700">提示词模板</div>
                  <span v-if="promptLoading.templates" class="text-xs text-gray-400">加载中...</span>
                </div>
                <div class="text-xs text-gray-500 mb-3">点击一个模板后，会同时填充正向和负向提示词。</div>
                <div class="flex flex-wrap gap-2">
                  <el-button
                    v-for="item in promptTemplates"
                    :key="item.id"
                    size="small"
                    :type="selectedTemplateId === item.id ? 'primary' : 'default'"
                    @click="applyTemplate(item)"
                  >
                    {{ item.name || `模板-${item.id}` }}
                  </el-button>
                  <span v-if="!promptLoading.templates && promptTemplates.length === 0" class="text-xs text-gray-400">
                    暂无可用模板
                  </span>
                </div>
              </div>
            </div>

            <el-form-item label="正面提示词 (Positive Prompt)" class="mt-2">
              <el-input type="textarea" :rows="3" v-model="form.positivePrompt" placeholder="描述你希望生成的正向效果" />
            </el-form-item>

            <el-form-item label="负面提示词 (Negative Prompt)" class="mt-2">
              <el-input type="textarea" :rows="3" v-model="form.negativePrompt" placeholder="描述你希望排除的负向效果" />
            </el-form-item>

            <div class="flex justify-end mt-1 mb-2">
              <el-button size="small" @click="handleSaveTemplate">保存模板</el-button>
            </div>
          </el-form>
        </div>

        <div class="w-80 flex-shrink-0 bg-gray-50 rounded-xl p-4 flex flex-col" style="max-height: 580px">
          <div class="font-bold text-gray-700 text-sm mb-3">常用提示词</div>

          <el-input v-model="tagSearch" placeholder="搜索提示词..." size="small" clearable class="mb-3" />

          <div class="mb-3 bg-white rounded-lg p-3 border border-gray-100">
            <div class="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b border-gray-200 flex items-center justify-between">
              <span>正面提示词</span>
              <span class="text-gray-400 font-normal">{{ filteredPositiveTags.length }} 个</span>
            </div>
            <div class="flex flex-wrap gap-1.5 min-h-[52px]">
              <span
                v-for="tag in pagedPositiveTags"
                :key="tag"
                @click="toggleTag(tag, 'positive')"
                :class="[
                  'cursor-pointer select-none px-2 py-1 text-xs rounded border transition-colors',
                  isTagSelected(tag, 'positive')
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-600 bg-white hover:border-blue-400 hover:text-blue-500'
                ]"
              >
                {{ tag }}
              </span>
              <span v-if="promptLoading.words" class="text-xs text-gray-300 italic">加载中...</span>
              <span v-else-if="filteredPositiveTags.length === 0" class="text-xs text-gray-300 italic">无匹配结果</span>
            </div>
            <div v-if="filteredPositiveTags.length > tagPageSize" class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <button class="text-xs text-gray-400 hover:text-blue-500 disabled:opacity-30" :disabled="posPage <= 1" @click="posPage--">上一页</button>
              <span class="text-xs text-gray-400">{{ posPage }} / {{ Math.ceil(filteredPositiveTags.length / tagPageSize) }}</span>
              <button class="text-xs text-gray-400 hover:text-blue-500 disabled:opacity-30" :disabled="posPage >= Math.ceil(filteredPositiveTags.length / tagPageSize)" @click="posPage++">下一页</button>
            </div>
          </div>

          <div class="bg-white rounded-lg p-3 border border-gray-100">
            <div class="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b border-gray-200 flex items-center justify-between">
              <span>负面提示词</span>
              <span class="text-gray-400 font-normal">{{ filteredNegativeTags.length }} 个</span>
            </div>
            <div class="flex flex-wrap gap-1.5 min-h-[52px]">
              <span
                v-for="tag in pagedNegativeTags"
                :key="tag"
                @click="toggleTag(tag, 'negative')"
                :class="[
                  'cursor-pointer select-none px-2 py-1 text-xs rounded border transition-colors',
                  isTagSelected(tag, 'negative')
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-600 bg-white hover:border-blue-400 hover:text-blue-500'
                ]"
              >
                {{ tag }}
              </span>
              <span v-if="promptLoading.words" class="text-xs text-gray-300 italic">加载中...</span>
              <span v-else-if="filteredNegativeTags.length === 0" class="text-xs text-gray-300 italic">无匹配结果</span>
            </div>
            <div v-if="filteredNegativeTags.length > tagPageSize" class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <button class="text-xs text-gray-400 hover:text-blue-500 disabled:opacity-30" :disabled="negPage <= 1" @click="negPage--">上一页</button>
              <span class="text-xs text-gray-400">{{ negPage }} / {{ Math.ceil(filteredNegativeTags.length / tagPageSize) }}</span>
              <button class="text-xs text-gray-400 hover:text-blue-500 disabled:opacity-30" :disabled="negPage >= Math.ceil(filteredNegativeTags.length / tagPageSize)" @click="negPage++">下一页</button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelDialog" :disabled="submitting">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting || nameValidationLoading" :disabled="submitting || !canSubmitTask">
            开始训练生成
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog :title="'视频预览 - ' + (currentItem.name || '')" v-model="previewVisible" width="400px" destroy-on-close class="preview-dialog" @closed="handlePreviewClosed">
      <div class="bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[500px]">
        <video v-if="currentItem.videoUrl" ref="previewVideoRef" :src="currentItem.videoUrl" controls autoplay class="max-w-full max-h-[600px]"></video>
        <div v-else class="text-gray-500 italic text-sm">暂无可预览的视频资源</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createDigitalHumanTask,
  createPromptTemplate,
  deleteDigitalHumanTask,
  getDigitalHumanTaskList,
  getDigitalHumanTaskWaiting,
  getPromptTemplateGrouped,
  getPromptTemplateGroupedByUser,
  getPromptWordGrouped,
  getPromptWordGroupedByUser,
  validateDigitalHumanTaskName
} from '/@/api/material'

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

interface PromptWordItem {
  id: string | number
  name?: string
  content?: string
}

interface PromptTemplateItem {
  id: string | number
  name?: string
  positive_content?: string
  negative_content?: string
}

const taskList = ref<DigitalHumanTask[]>([])
const dialogVisible = ref(false)
const previewVisible = ref(false)
const submitting = ref(false)
const currentItem = ref<Partial<DigitalHumanTask>>({})
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const selectedTemplateId = ref<string | number | null>(null)
const tagSearch = ref('')
const posPage = ref(1)
const negPage = ref(1)
const tagPageSize = 20
const orientation = ref<'portrait' | 'landscape'>('portrait')
const nameValidationLoading = ref(false)
const nameValidationState = ref<'idle' | 'valid' | 'invalid'>('idle')
const recommendedName = ref('')
const validatedName = ref('')
const imageRatioValid = ref(false)
const promptLoading = reactive({ templates: false, words: false })
let nameValidateTimer: ReturnType<typeof setTimeout> | null = null

const handlePreviewClosed = () => {
  if (!previewVideoRef.value) return
  previewVideoRef.value.pause()
  previewVideoRef.value.currentTime = 0
}

const form = reactive({
  name: '',
  gender: '女',
  imageUrl: '',
  rawFile: null as File | null,
  positivePrompt: '',
  negativePrompt: ''
})

const promptTemplates = ref<PromptTemplateItem[]>([])
const promptWords = reactive<{ positive: PromptWordItem[]; negative: PromptWordItem[] }>({
  positive: [],
  negative: []
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})
const digitalHumanWaitingInfo = reactive({
  waitingTotal: 0,
  waitingBefore: 0
})

const splitPromptText = (value = '') => value.split(/[、,，]/).map(item => item.trim()).filter(Boolean)
const joinPromptText = (items: string[]) => Array.from(new Set(items.map(item => item.trim()).filter(Boolean))).join('、')
const normalizePromptContent = (value = '') => joinPromptText(splitPromptText(value))
const toBackendPromptContent = (value = '') => splitPromptText(value).join(',')

const normalizePromptWordGrouped = (data: any) => ({
  positive: Array.isArray(data?.positive) ? data.positive as PromptWordItem[] : [],
  negative: Array.isArray(data?.negative) ? data.negative as PromptWordItem[] : []
})

const getPromptWordLabel = (item: PromptWordItem) => String(item.content || item.name || '').trim()

const filteredPositiveTags = computed(() => {
  const q = tagSearch.value.trim()
  const tags = Array.from(new Set(promptWords.positive.map(getPromptWordLabel).filter(Boolean)))
  return q ? tags.filter(tag => tag.includes(q)) : tags
})

const filteredNegativeTags = computed(() => {
  const q = tagSearch.value.trim()
  const tags = Array.from(new Set(promptWords.negative.map(getPromptWordLabel).filter(Boolean)))
  return q ? tags.filter(tag => tag.includes(q)) : tags
})

const pagedPositiveTags = computed(() => {
  const start = (posPage.value - 1) * tagPageSize
  return filteredPositiveTags.value.slice(start, start + tagPageSize)
})

const pagedNegativeTags = computed(() => {
  const start = (negPage.value - 1) * tagPageSize
  return filteredNegativeTags.value.slice(start, start + tagPageSize)
})

const canSubmitTask = computed(() => {
  const finalName = form.name.trim()
  return !!finalName
    && !nameValidationLoading.value
    && nameValidationState.value === 'valid'
    && validatedName.value === finalName
    && !!form.imageUrl
    && imageRatioValid.value
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    已完成: 'success',
    生成中: 'warning',
    已提交: 'info',
    生成失败: 'danger'
  }
  return map[status] || ''
}

const loadDigitalHumanTaskList = async () => {
  try {
    const res = await getDigitalHumanTaskList(pagination.currentPage, pagination.pageSize)
    if (res.data?.code === 200) {
      const taskListData = res.data.data?.data || []
      taskList.value = taskListData.map((item: any) => {
        let videoUrl = item.videoUrl || item.url || ''
        if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('[')) {
          try {
            if (videoUrl.includes("'")) videoUrl = videoUrl.replace(/'/g, '"')
            const urlArray = JSON.parse(videoUrl)
            videoUrl = urlArray[0] || ''
          } catch (error) {
            console.warn('Failed to parse video url:', error)
          }
        }
        if (videoUrl) videoUrl = videoUrl.replace(/^["']|["']$/g, '')

        return {
          id: item.id,
          name: item.digitalHumanName || item.voiceName || item.name || item.humanName,
          gender: item.gender === 'male' ? '男' : '女',
          status: item.taskStatus === '2' ? '已完成' : (item.taskStatus === '1' ? '生成中' : (item.taskStatus === '0' ? '已提交' : '生成失败')),
          basePhotoUrl: item.basePhotoUrl || item.coverUrl || item.sourceImage || item.image || '',
          videoUrl,
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

const loadDigitalHumanWaitingInfo = async () => {
  try {
    const res = await getDigitalHumanTaskWaiting()
    if (res.data?.code === 200 && res.data?.data) {
      const data = res.data.data
      digitalHumanWaitingInfo.waitingTotal = Number(data.waitingTotal || data.waiting_total || 0)
      digitalHumanWaitingInfo.waitingBefore = Number(data.waitingBefore || data.waiting_before || 0)
    }
  } catch (error) {
    console.error('Failed to load digital human waiting info:', error)
  }
}

const loadPromptWords = async () => {
  promptLoading.words = true
  try {
    const res = await getPromptWordGroupedByUser()
    Object.assign(promptWords, normalizePromptWordGrouped(res.data?.data))
  } catch (error) {
    try {
      const res = await getPromptWordGrouped()
      Object.assign(promptWords, normalizePromptWordGrouped(res.data?.data))
    } catch (fallbackError) {
      console.error('Failed to load prompt words:', fallbackError)
      promptWords.positive = []
      promptWords.negative = []
    }
  } finally {
    promptLoading.words = false
  }
}

const loadPromptTemplates = async () => {
  promptLoading.templates = true
  try {
    const res = await getPromptTemplateGroupedByUser()
    promptTemplates.value = Array.isArray(res.data?.data) ? res.data.data : []
  } catch (error) {
    try {
      const res = await getPromptTemplateGrouped()
      promptTemplates.value = Array.isArray(res.data?.data) ? res.data.data : []
    } catch (fallbackError) {
      console.error('Failed to load prompt templates:', fallbackError)
      promptTemplates.value = []
    }
  } finally {
    promptLoading.templates = false
  }
}

const loadPromptResources = async () => {
  await Promise.all([loadPromptWords(), loadPromptTemplates()])
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

const applyTemplate = (template: PromptTemplateItem) => {
  form.positivePrompt = normalizePromptContent(String(template.positive_content || ''))
  form.negativePrompt = normalizePromptContent(String(template.negative_content || ''))
  selectedTemplateId.value = template.id
}

const isTagSelected = (tag: string, type: 'positive' | 'negative') => {
  const prompt = type === 'positive' ? form.positivePrompt : form.negativePrompt
  return splitPromptText(prompt).includes(tag)
}

const toggleTag = (tag: string, type: 'positive' | 'negative') => {
  const current = type === 'positive' ? form.positivePrompt : form.negativePrompt
  const tags = splitPromptText(current)
  const idx = tags.indexOf(tag)
  if (idx >= 0) tags.splice(idx, 1)
  else tags.push(tag)

  if (type === 'positive') form.positivePrompt = joinPromptText(tags)
  else form.negativePrompt = joinPromptText(tags)
  selectedTemplateId.value = null
}

const handleSaveTemplate = async () => {
  const positiveContent = normalizePromptContent(form.positivePrompt)
  const negativeContent = normalizePromptContent(form.negativePrompt)
  if (!positiveContent && !negativeContent) {
    ElMessage.warning('请先填写提示词内容')
    return
  }

  try {
    const { value } = await ElMessageBox.prompt('请输入模板名称', '保存提示词模板', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：主播形象模板',
      inputValidator: (input: string) => !!input.trim() || '模板名称不能为空'
    })

    await createPromptTemplate({
      name: value.trim(),
      positive_content: toBackendPromptContent(positiveContent),
      negative_content: toBackendPromptContent(negativeContent)
    })
    await loadPromptResources()
    ElMessage.success('模板已保存')
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    console.error('Failed to save prompt template:', error)
    ElMessage.error(error?.message || '模板保存失败，请稍后重试')
  }
}

const handleImageChange = (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('仅支持 JPG 和 PNG 格式的图片')
    return false
  }

  if (form.imageUrl) URL.revokeObjectURL(form.imageUrl)
  const objectUrl = URL.createObjectURL(rawFile)
  const img = new Image()

  img.onload = () => {
    const aspectRatio = img.width / img.height
    if (orientation.value === 'portrait') {
      const targetRatio = 9 / 16
      const tolerance = 0.05
      if (Math.abs(aspectRatio - targetRatio) > tolerance) {
        URL.revokeObjectURL(objectUrl)
        form.rawFile = null
        form.imageUrl = ''
        imageRatioValid.value = false
        ElMessage.error(`竖屏模式下图片宽高比必须接近 9:16，当前约为 ${img.width}:${img.height}`)
        return
      }
    }
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

  if (finalName === validatedName.value && nameValidationState.value === 'valid') return true

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
  if (ok) ElMessage.success('已应用推荐名称')
}

const resetPromptState = () => {
  selectedTemplateId.value = null
}

const handleCancelDialog = () => {
  dialogVisible.value = false
  if (form.imageUrl) URL.revokeObjectURL(form.imageUrl)
  form.imageUrl = ''
  form.rawFile = null
  form.positivePrompt = ''
  form.negativePrompt = ''
  imageRatioValid.value = false
  resetNameValidationState()
  resetPromptState()
}

const handleSubmit = async () => {
  if (submitting.value) return
  if (!form.name.trim()) return ElMessage.warning('请输入数字人名称')
  if (!form.imageUrl) return ElMessage.warning('请上传一张形象照片')

  const finalName = form.name.trim()
  const nameValid = await validateName(finalName, true)
  if (!nameValid) return

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('file', form.rawFile!)
    formData.append('name', finalName)
    formData.append('gender', form.gender === '男' ? 'male' : 'female')
    formData.append('model', 'a2e')
    formData.append('type', orientation.value === 'landscape' ? '1' : '0')
    formData.append('language', 'zh')
    formData.append('positivePrompt', normalizePromptContent(form.positivePrompt))
    formData.append('negativePrompt', normalizePromptContent(form.negativePrompt))

    const res = await createDigitalHumanTask(formData)
    if (res.data?.code === 200) {
      pagination.currentPage = 1
      await loadDigitalHumanTaskList()
      await loadDigitalHumanWaitingInfo()
      handleCancelDialog()
      ElMessage.success('数字人训练任务已提交，预计生成时间 15-30 分钟')
      setTimeout(() => {
        location.reload()
      }, 1000)
    } else {
      ElMessage.error(res.data?.message || '提交失败，请稍后重试')
    }
  } catch (error: any) {
    console.error('Failed to create digital human task:', error)
    ElMessage.error(error?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const previewVideo = (row: DigitalHumanTask) => {
  currentItem.value = row
  previewVisible.value = true
}

const handleDelete = (index: number) => {
  const task = taskList.value[index]
  if (!task?.id) {
    ElMessage.warning('无法删除：任务 ID 不存在')
    return
  }

  ElMessageBox.confirm('确定要删除该数字人任务吗？生成的视频资产也将被移除。', '操作提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteDigitalHumanTask(task.id)
      if (res.data?.code === 200) {
        taskList.value.splice(index, 1)
        await loadDigitalHumanWaitingInfo()
        ElMessage.success('已删除')
      } else {
        ElMessage.error(res.data?.message || '删除失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('Failed to delete digital human task:', error)
      ElMessage.error(error?.message || '删除失败，请稍后重试')
    }
  }).catch(() => {})
}

watch(tagSearch, () => {
  posPage.value = 1
  negPage.value = 1
})

watch(
  () => form.name,
  value => {
    if (nameValidateTimer) clearTimeout(nameValidateTimer)
    const finalName = value.trim()
    if (!finalName) {
      resetNameValidationState()
      return
    }
    if (finalName === validatedName.value && nameValidationState.value === 'valid') return
    nameValidationState.value = 'idle'
    recommendedName.value = ''
    nameValidateTimer = setTimeout(() => {
      validateName(finalName)
    }, 400)
  }
)

watch(dialogVisible, visible => {
  if (visible) loadPromptResources()
})

onMounted(() => {
  loadDigitalHumanTaskList()
  loadDigitalHumanWaitingInfo()
  loadPromptResources()
})

onUnmounted(() => {
  if (nameValidateTimer) clearTimeout(nameValidateTimer)
})
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

.queue-hint {
  min-width: 188px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  line-height: 1.4;
}
</style>
