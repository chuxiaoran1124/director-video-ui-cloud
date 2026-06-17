<template>
  <div class="p-5 bg-white rounded-b-lg">
    <template v-if="mode === 'list'">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="text-base font-semibold text-gray-700">角标图片列表</div>
          <el-input
            v-model="searchKeyword"
            placeholder="输入角标名称搜索"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button @click="resetSearch">重置条件</el-button>
          <el-button type="primary" @click="handleSearch">查询角标</el-button>
        </div>
        <el-button type="primary" @click="openCreate">新建角标</el-button>
      </div>

      <el-table
        :data="cornerMarkList"
        :loading="pageState.loading"
        border
        stripe
        :header-cell-style="{ background: '#f8f9fb', color: '#606266' }"
      >
        <el-table-column label="序号" width="70" align="center">
          <template #default="scope">
            {{ (pageState.currentPage - 1) * pageState.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="photoName" label="角标名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="角标图" min-width="160" align="center">
          <template #default="scope">
            <div
              v-if="scope.row.photoUrl"
              class="corner-mark-thumb w-16 h-16 rounded-lg border border-gray-200 overflow-hidden cursor-pointer"
              @click="openPreview(scope.row)"
            >
              <img :src="scope.row.photoUrl" class="w-full h-full object-contain bg-white" />
            </div>
            <span v-else class="text-xs text-gray-400">暂无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" align="center" />
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="scope">
            <div class="flex items-center justify-center gap-2">
              <el-button size="small" @click="moveToTop(scope.row)">置顶</el-button>
              <el-button type="primary" plain size="small" @click="openEdit(scope.row)">编辑</el-button>
              <el-button type="danger" plain size="small" @click="deleteItem(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4" v-if="pageState.total > 0">
        <el-pagination
          v-model:current-page="pageState.currentPage"
          v-model:page-size="pageState.pageSize"
          :total="pageState.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>

      <el-empty v-if="cornerMarkList.length === 0" description="暂无角标，点击右上角新建" :image-size="86" />
    </template>

    <template v-else>
      <div class="flex items-center justify-between mb-4">
        <div class="text-base font-semibold text-gray-700">{{ editingId ? '编辑角标' : '新建角标' }}</div>
        <el-button @click="cancelEdit">返回列表</el-button>
      </div>

      <div class="flex gap-6 items-start">
        <div class="w-96 flex-shrink-0 space-y-4">
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="text-sm font-semibold text-gray-700 mb-2">角标名称</div>
            <el-input
              v-model="formState.name"
              maxlength="30"
              show-word-limit
              placeholder="请输入角标名称"
            />
            <div v-if="nameCheckLoading" class="text-xs text-gray-400 mt-1">正在检查名称...</div>
            <div v-else-if="formState.name && !nameValid" class="text-xs text-red-500 mt-1">
              名称已存在
              <span v-if="recommendedName" class="ml-1">建议：{{ recommendedName }}</span>
              <el-button v-if="recommendedName" link type="primary" size="small" @click="useRecommendedName">使用推荐名</el-button>
            </div>
          </div>

          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="text-sm font-semibold text-gray-700 mb-3">上传角标图片</div>
            <el-upload
              drag
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              @change="onFileChange"
            >
              <div v-if="formState.previewUrl" class="relative w-full h-40 rounded-lg overflow-hidden bg-white border border-dashed border-gray-200">
                <img :src="formState.previewUrl" class="w-full h-full object-contain" />
                <div class="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">点击更换图片</div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-8 text-gray-400">
                <el-icon class="text-3xl mb-1"><upload-filled /></el-icon>
                <span class="text-xs">拖拽或点击上传角标图</span>
              </div>
            </el-upload>
            <div class="text-xs text-gray-400 mt-2">支持 `jpg / png / gif / webp`，建议透明底图。</div>
          </div>

          <div class="flex gap-2">
            <el-button style="flex: 1" @click="resetForm">重置</el-button>
            <el-button type="primary" style="flex: 1" :loading="saving" @click="saveItem">保存角标</el-button>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-700 mb-3">预览</div>
          <div class="corner-mark-preview-panel rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
            <img v-if="formState.previewUrl" :src="formState.previewUrl" class="max-w-full max-h-full object-contain" />
            <div v-else class="text-sm text-gray-400">上传后可在这里预览角标效果</div>
          </div>
        </div>
      </div>
    </template>

    <el-dialog v-model="previewDialog.visible" title="角标预览" width="520px" append-to-body>
      <div class="corner-mark-preview-dialog">
        <img v-if="previewDialog.url" :src="previewDialog.url" class="max-w-full max-h-full object-contain" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import { onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCornerMarkMaterial,
  deleteCornerMarkMaterial,
  getCornerMarkPaginateList,
  toTopCornerMark,
  updateCornerMarkMaterial,
  validateCornerMarkName
} from '/@/api/material'

interface CornerMarkItem {
  id: number
  photoName: string
  photoUrl: string
  updateTime: string
}

const mode = ref<'list' | 'edit'>('list')
const editingId = ref<number | null>(null)
const cornerMarkList = ref<CornerMarkItem[]>([])
const searchKeyword = ref('')
const pageState = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  loading: false
})
const formState = reactive({
  name: '',
  previewUrl: '',
  selectedFile: null as File | null
})
const previewDialog = reactive({
  visible: false,
  url: ''
})
const saving = ref(false)
const nameCheckLoading = ref(false)
const nameValid = ref(true)
const recommendedName = ref('')
let localPreviewUrl = ''
let validateTimer: ReturnType<typeof setTimeout> | null = null

const revokeLocalPreview = () => {
  if (localPreviewUrl) {
    URL.revokeObjectURL(localPreviewUrl)
    localPreviewUrl = ''
  }
}

const normalizeItem = (item: any): CornerMarkItem => ({
  id: Number(item?.id ?? 0),
  photoName: item?.photoName || item?.name || '',
  photoUrl: item?.photoUrl || '',
  updateTime: item?.updateTime || item?.createTime || ''
})

const fetchCornerMarks = async() => {
  pageState.loading = true
  try {
    const response = await getCornerMarkPaginateList(pageState.currentPage, pageState.pageSize, {
      name: searchKeyword.value.trim()
    })
    const root = response?.data?.data ?? {}
    const records = Array.isArray(root?.records)
      ? root.records
      : Array.isArray(root?.data)
        ? root.data
        : []
    cornerMarkList.value = records.map((item: any) => normalizeItem(item))
    pageState.total = Number(root?.total ?? cornerMarkList.value.length)
  } catch (error) {
    console.error('获取角标列表失败:', error)
    cornerMarkList.value = []
    pageState.total = 0
  } finally {
    pageState.loading = false
  }
}

const handleSearch = () => {
  pageState.currentPage = 1
  fetchCornerMarks()
}

const resetSearch = () => {
  searchKeyword.value = ''
  handleSearch()
}

const resetForm = () => {
  revokeLocalPreview()
  formState.name = ''
  formState.previewUrl = ''
  formState.selectedFile = null
  nameValid.value = true
  recommendedName.value = ''
}

const openCreate = () => {
  editingId.value = null
  resetForm()
  mode.value = 'edit'
}

const openEdit = (row: CornerMarkItem) => {
  editingId.value = row.id
  resetForm()
  formState.name = row.photoName
  formState.previewUrl = row.photoUrl
  mode.value = 'edit'
}

const cancelEdit = () => {
  mode.value = 'list'
  editingId.value = null
  resetForm()
}

const onFileChange = (file: any) => {
  if (!file?.raw) {
    return
  }
  revokeLocalPreview()
  formState.selectedFile = file.raw as File
  localPreviewUrl = URL.createObjectURL(file.raw)
  formState.previewUrl = localPreviewUrl
}

const validateName = async(showErrorMessage = false) => {
  const name = formState.name.trim()
  if (!name) {
    nameValid.value = true
    recommendedName.value = ''
    return true
  }

  nameCheckLoading.value = true
  try {
    const response = await validateCornerMarkName(name, editingId.value ?? undefined)
    const data = response?.data?.data || {}
    nameValid.value = Boolean(data.is_valid)
    recommendedName.value = data.recommended_name || ''
    if (!nameValid.value && showErrorMessage) {
      ElMessage.warning(recommendedName.value ? `名称已存在，建议使用 ${recommendedName.value}` : '名称已存在')
    }
    return nameValid.value
  } catch (error) {
    console.error('校验角标名称失败:', error)
    return false
  } finally {
    nameCheckLoading.value = false
  }
}

const useRecommendedName = () => {
  if (!recommendedName.value) {
    return
  }
  formState.name = recommendedName.value
  nameValid.value = true
  recommendedName.value = ''
}

const saveItem = async() => {
  const name = formState.name.trim()
  if (!name) {
    ElMessage.warning('请输入角标名称')
    return
  }
  if (!editingId.value && !formState.selectedFile) {
    ElMessage.warning('请先上传角标图片')
    return
  }
  const isValid = await validateName(true)
  if (!isValid) {
    return
  }

  const formData = new FormData()
  formData.append('photoName', name)
  if (formState.selectedFile) {
    formData.append('file', formState.selectedFile)
  }
  if (editingId.value) {
    formData.append('cornerMarkId', String(editingId.value))
  }

  saving.value = true
  try {
    if (editingId.value) {
      await updateCornerMarkMaterial(formData)
      ElMessage.success('角标更新成功')
    } else {
      await createCornerMarkMaterial(formData)
      ElMessage.success('角标创建成功')
    }
    cancelEdit()
    await fetchCornerMarks()
  } catch (error) {
    console.error('保存角标失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteItem = async(row: CornerMarkItem) => {
  try {
    await ElMessageBox.confirm(`确定删除角标“${row.photoName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCornerMarkMaterial(row.id)
    ElMessage.success('角标已删除')
    await fetchCornerMarks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角标失败:', error)
    }
  }
}

const moveToTop = async(row: CornerMarkItem) => {
  try {
    await toTopCornerMark(row.id)
    ElMessage.success('置顶成功')
    await fetchCornerMarks()
  } catch (error) {
    console.error('角标置顶失败:', error)
  }
}

const openPreview = (row: CornerMarkItem) => {
  previewDialog.url = row.photoUrl
  previewDialog.visible = true
}

watch(() => [pageState.currentPage, pageState.pageSize], () => {
  fetchCornerMarks()
}, { deep: true })

watch(() => formState.name, () => {
  if (validateTimer) {
    clearTimeout(validateTimer)
    validateTimer = null
  }
  if (!formState.name.trim()) {
    nameValid.value = true
    recommendedName.value = ''
    return
  }
  validateTimer = setTimeout(() => {
    validateName(false)
  }, 300)
})

onUnmounted(() => {
  if (validateTimer) {
    clearTimeout(validateTimer)
    validateTimer = null
  }
  revokeLocalPreview()
})

fetchCornerMarks()
</script>

<style scoped>
.corner-mark-thumb {
  background-color: #f6f7fb;
  background-image:
    linear-gradient(45deg, #e6e8ef 25%, transparent 25%),
    linear-gradient(-45deg, #e6e8ef 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e6e8ef 75%),
    linear-gradient(-45deg, transparent 75%, #e6e8ef 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.corner-mark-preview-panel {
  min-height: 420px;
  padding: 24px;
}

.corner-mark-preview-dialog {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
