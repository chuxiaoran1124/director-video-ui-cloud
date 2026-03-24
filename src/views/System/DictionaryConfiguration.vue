<template>
  <div class="p-4 bg-gray-50 min-h-screen">
    <!-- 1. 字典列表页 (List Mode) -->
    <div v-if="viewMode === 'list'" class="animate-fade-in">
      <!-- 头部搜索栏 -->
      <div class="bg-white p-4 rounded-xl shadow-sm mb-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <el-icon class="text-blue-500"><el-icon-collection /></el-icon>
              字典配置管理
            </h2>
            <el-input 
              v-model="searchQuery"
              placeholder="搜索字典名称或编码..."
              class="!w-72"
              clearable
              @change="fetchDictionaries"
            >
              <template #prefix>
                <el-icon class="el-input__icon"><el-icon-search /></el-icon>
              </template>
            </el-input>
            <dictionary-select 
              v-model="filterType" 
              code="dict_type" 
              placeholder="字典类型" 
              class="!w-40" 
              @change="fetchDictionaries" 
            />
          </div>
          <el-button type="primary" icon="el-icon-plus" @click="handleAddDictionary">新增字典</el-button>
        </div>
      </div>

      <!-- 字典列表表格 -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <el-table :data="dictionaries" border style="width: 100%" v-loading="loading">
          <el-table-column prop="dictName" label="字典名称" width="140" show-overflow-tooltip>
            <template #default="scope">
              <span class="font-medium text-gray-700">{{ scope.row.dictName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="dictCode" label="字典编码" width="160">
            <template #default="scope">
              <el-tag size="small" effect="plain" class="font-mono">{{ scope.row.dictCode }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getTypeStyle(scope.row.type)" size="small">
                {{ typeMap[scope.row.type] || scope.row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述说明" min-width="220" />
          <el-table-column prop="createTime" label="创建时间" width="190" />
          <el-table-column label="操作" width="350" align="center">
            <template #default="scope">
              <div class="flex justify-center gap-2">
                <el-button type="primary" icon="el-icon-edit" @click="handleEditDictionary(scope.row)">编辑</el-button>
                <el-button type="success" icon="el-icon-setting" @click="handleManageItems(scope.row)">管理项</el-button>
                <el-button type="danger" icon="el-icon-delete" @click="handleDeleteDictionary(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="p-4 flex justify-end">
          <el-pagination 
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            layout="total, prev, pager, next" 
            :total="pagination.total" 
            background 
            small 
            @current-change="fetchDictionaries"
          />
        </div>
      </div>
    </div>

    <!-- 2. 字典项管理页 (Detail Mode) -->
    <div v-else class="animate-fade-in">
      <div class="bg-white p-4 rounded-xl shadow-sm mb-4 flex items-center justify-between border-l-4 border-l-blue-500">
        <div class="flex items-center gap-4">
          <el-button icon="el-icon-back" circular @click="viewMode = 'list'">返回列表</el-button>
          <div class="flex flex-col">
            <span class="text-lg font-bold text-gray-800">{{ currentDic?.dictName }}</span>
            <span class="text-xs text-gray-400 font-mono">字典编码: {{ currentDic?.dictCode }}</span>
          </div>
        </div>
        <div>
          <el-button type="primary" icon="el-icon-plus" @click="handleAddItem">添加数据项</el-button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-4 min-h-[500px]">
        <el-table :data="currentItems" border style="width: 100%" class="rounded-lg">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="valueName" label="显示名称" min-width="150" />
          <el-table-column prop="keyCode" label="属性 " width="160">
             <template #default="scope">
                <code class="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">{{ scope.row.keyCode }}</code>
             </template>
          </el-table-column>
          <el-table-column prop="order" label="顺序" width="150" align="center">
            <template #default="scope">
              <el-input-number v-model="scope.row.order" :min="0" controls-position="right" class="!w-24" />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="是否启用" width="100" align="center">
            <template #default="scope">
              <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <div class="flex justify-center gap-2">
                <el-button type="primary" icon="el-icon-edit" @click="handleEditItem(scope.row)">编辑</el-button>
                <el-button type="danger" icon="el-icon-delete" @click="handleDeleteItem(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="p-4 flex justify-end">
          <el-pagination 
            v-model:current-page="entryPagination.page"
            v-model:page-size="entryPagination.pageSize"
            layout="total, prev, pager, next" 
            :total="entryPagination.total" 
            background 
            small 
            @current-change="fetchDictionaryEntries"
          />
        </div>
      </div>
    </div>

    <!-- 子项编辑弹窗 -->
    <el-dialog title="字典项编辑" v-model="itemDialogVisible" width="400px" append-to-body>
      <el-form :model="itemForm" label-width="80px" class="pr-2">
        <el-form-item label="名称" required>
          <el-input v-model="itemForm.valueName" placeholder="如：进行中" />
        </el-form-item>
        <el-form-item label="属性" required>
          <el-input v-model="itemForm.keyCode" placeholder="如：1 或 running" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="itemForm.order" :min="1" :max="999" class="!w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitItem">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典主表编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="dictionaryForm" label-width="100px" class="pr-4">
        <el-form-item label="字典名称" required>
          <el-input v-model="dictionaryForm.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典编码" required>
          <el-input v-model="dictionaryForm.dictCode" placeholder="请输入唯一编码" />
        </el-form-item>
        <el-form-item label="字典类型">
          <dictionary-select v-model="dictionaryForm.type" code="dict_type" placeholder="请选择字典类型" />
        </el-form-item>
        <el-form-item label="描述说明">
          <el-input v-model="dictionaryForm.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDictionary">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DictionarySelect from '/@/components/DictionarySelect/index.vue'
import { 
  getDictionaryPage, 
  createDictionary, 
  updateDictionary, 
  deleteDictionary,
  getDictionaryEntryPage,
  createDictionaryEntry,
  updateDictionaryEntry,
  deleteDictionaryEntry,
  getDictionaryEntryListByCode
} from '/@/api/system/dictionary'

// --- 状态控制 ---
const loading = ref(false)
const viewMode = ref('list')
const dictionaries = ref<any[]>([])
const typeMap = ref<Record<string, string>>({}) // 类型映射表
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// --- 字典项列表数据 ---
const currentDic = ref<any>(null)
const currentItems = ref<any[]>([])
const entryPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// --- 搜索与过滤 ---
const searchQuery = ref('')
const filterType = ref('')

const getTypeStyle = (type: string) => {
  const map: Record<string, string> = { 
    'System': 'danger', 
    'GenerateMaterials': 'success', 
    'PriorDisposal': 'warning',
    '系统': 'danger', 
    '业务': 'success', 
    '基础': 'warning' 
  }
  return map[type] || 'info'
}

/**
 * 获取字典主表数据
 */
const fetchDictionaries = async () => {
  loading.value = true
  try {
    const res = await getDictionaryPage({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: {
        dictName: searchQuery.value,
        dictCode: '',
        type: filterType.value // 添加类型筛选
      }
    })
    // 后端可能返回 0 (MD文档) 或 200 (实际情况)
    if (res.data.code === 0 || res.data.code === 200) {
      // 这里的 res.data.data.data 对应 JSON 中的 data -> data 列表
      dictionaries.value = res.data.data.data || []
      pagination.total = res.data.data.total || 0
    }
  } catch (error) {
    console.error('Fetch dictionaries failed:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 获取字典项数据 (根据当前字典 ID)
 */
const fetchDictionaryEntries = async () => {
  if (!currentDic.value) return
  loading.value = true
  try {
    const res = await getDictionaryEntryPage({
      page: entryPagination.page,
      pageSize: entryPagination.pageSize,
      search: {
        dictionaryId: currentDic.value.id.toString()
      }
    })
    if (res.data.code === 0 || res.data.code === 200) {
      currentItems.value = res.data.data.data || []
      entryPagination.total = res.data.data.total || 0
    }
  } catch (error) {
    console.error('Fetch entries failed:', error)
  } finally {
    loading.value = false
  }
}

// --- 字典主项操作 ---
const dialogVisible = ref(false)
const dialogTitle = ref('新增字典')
const isEdit = ref(false)
const dictionaryForm = reactive({ 
  id: '',
  dictName: '', 
  dictCode: '', 
  type: '基础', 
  description: '' 
})

const handleAddDictionary = () => {
  isEdit.value = false
  dialogTitle.value = '新增字典'
  Object.assign(dictionaryForm, { id: '', dictName: '', dictCode: '', type: '基础', description: '' })
  dialogVisible.value = true
}

const handleEditDictionary = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑字典'
  Object.assign(dictionaryForm, { ...row })
  dialogVisible.value = true
}

const submitDictionary = async () => {
  if (!dictionaryForm.dictName || !dictionaryForm.dictCode) return ElMessage.warning('请填写必选字段')
  
  try {
    let res
    if (!isEdit.value) {
      res = await createDictionary(dictionaryForm)
    } else {
      res = await updateDictionary(dictionaryForm.id, dictionaryForm)
    }
    
    if (res.data.code === 0 || res.data.code === 200) {
      ElMessage.success(isEdit.value ? '字典更新成功' : '字典创建成功')
      dialogVisible.value = false
      fetchDictionaries()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteDictionary = (row: any) => {
  ElMessageBox.confirm(`确定删除字典 "${row.dictName}" 吗？`, '警告', { 
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await deleteDictionary(row.id)
    if (res.data.code === 0 || res.data.code === 200) {
      ElMessage.success('已删除')
      fetchDictionaries()
    }
  })
}

// --- 字典项管理 ---
const handleManageItems = (row: any) => {
  currentDic.value = row
  viewMode.value = 'detail'
  entryPagination.page = 1
  fetchDictionaryEntries()
}

const itemDialogVisible = ref(false)
const isEditItem = ref(false)
const itemForm = reactive({ 
  id: '',
  keyCode: '', 
  valueName: '', 
  order: 1, 
  status: 1 
})

const handleAddItem = () => {
  isEditItem.value = false
  Object.assign(itemForm, { id: '', keyCode: '', valueName: '', order: currentItems.value.length + 1, status: 1 })
  itemDialogVisible.value = true
}

const handleEditItem = (row: any) => {
  isEditItem.value = true
  Object.assign(itemForm, row)
  itemDialogVisible.value = true
}

const handleDeleteItem = (row: any) => {
  ElMessageBox.confirm(`确定删除字典项 "${row.valueName}" 吗？`, '警告', { 
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await deleteDictionaryEntry(row.id)
      if (res.data.code === 0 || res.data.code === 200) {
        ElMessage.success('已删除')
        fetchDictionaryEntries()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const submitItem = async () => {
  if (!itemForm.keyCode || !itemForm.valueName) return ElMessage.warning('请填写必填项')
  
  try {
    let res
    if (!isEditItem.value) {
      res = await createDictionaryEntry({
        ...itemForm,
        dictionaryId: currentDic.value.id
      })
    } else {
      res = await updateDictionaryEntry(itemForm.id, itemForm)
    }

    if (res.data.code === 0 || res.data.code === 200) {
      ElMessage.success('操作成功')
      itemDialogVisible.value = false
      fetchDictionaryEntries()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const saveItems = () => {
  ElMessage.info('所有变更已即时同步至服务端。')
  viewMode.value = 'list'
}

/**
 * 初始化类型映射
 */
const initTypeMap = async () => {
  try {
    const res = await getDictionaryEntryListByCode('dict_type')
    if (res.data.code === 200 || res.data.code === 0) {
      const list = res.data.data || []
      list.forEach((item: any) => {
        typeMap.value[item.keyCode] = item.valueName
      })
    }
  } catch (e) {
    console.error('Init type map failed', e)
  }
}

// --- 初始化 ---
onMounted(async () => {
  await initTypeMap()
  fetchDictionaries()
})
</script>

<style scoped>
:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
}
:deep(.el-drawer__header) {
  margin-bottom: 20px;
  font-weight: bold;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 15px;
}
</style>
