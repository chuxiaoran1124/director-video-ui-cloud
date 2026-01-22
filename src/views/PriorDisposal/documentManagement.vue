<template>
  <div class="document-management-container p-4 bg-gray-50 min-h-screen">
    <el-tabs v-model="activeTab" class="custom-tabs shadow-sm rounded-lg overflow-hidden bg-white">
      <!-- 历史脚本面 -->
      <el-tab-pane label="历史脚本" name="history">
        <div class="p-4 bg-white">
          <!-- 搜索栏 -->
          <div class="filter-header mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-input 
                v-model="searchHistory" 
                placeholder="搜索脚本内容..." 
                size="default" 
                style="width: 280px" 
                clearable 
                prefix-icon="ElIconSearch"
              />
              <el-date-picker
                v-model="historyDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="default"
                style="width: 260px"
              />
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetHistorySearch">重置</el-button>
              <el-button type="primary" size="default" @click="fetchHistory">
                <el-icon class="mr-1"><ElIconSearch /></el-icon>查询
              </el-button>
            </div>
          </div>

          <!-- 表格 -->
          <el-table :data="paginatedHistory" stripe border v-loading="loading">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (historyPage.currentPage - 1) * historyPage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="脚本内容" min-width="300" show-overflow-tooltip />
            <el-table-column label="标签" width="200">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <el-tag v-for="tag in scope.row.tags" :key="tag" size="mini" effect="plain">{{ tag }}</el-tag>
                  <span v-if="!scope.row.tags?.length" class="text-gray-300 text-xs">暂无标签</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="usedAt" label="使用时间" width="160" align="center" />
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" plain size="mini" @click="handleEditHistory(scope.row)">标签</el-button>
                <el-button type="success" plain size="mini" @click="handleAddToLibrary(scope.row)">添加至脚本库</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="historyPage.currentPage"
              v-model:page-size="historyPage.pageSize"
              :total="historyData.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 脚本库面 -->
      <el-tab-pane label="脚本库" name="library">
        <div class="p-4 bg-white">
          <!-- 搜索与添加 -->
          <div class="filter-header mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-button type="primary" @click="openAddLibraryDialog">
                <el-icon class="mr-1"><ElIconPlus /></el-icon>新增脚本
              </el-button>
              <el-input 
                v-model="searchLibrary" 
                placeholder="搜索标题或内容..." 
                size="default" 
                style="width: 220px" 
                clearable 
                prefix-icon="ElIconSearch"
              />
              <el-input 
                v-model="searchLibTag" 
                placeholder="搜索标签..." 
                size="default" 
                style="width: 160px" 
                clearable 
                prefix-icon="ElIconCollectionTag"
              />
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetLibrarySearch">重置</el-button>
              <el-button type="primary" size="default" @click="fetchLibrary">
                <el-icon class="mr-1"><ElIconSearch /></el-icon>查询
              </el-button>
            </div>
          </div>

          <!-- 表格 -->
          <el-table :data="paginatedLibrary" stripe border v-loading="loading">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (libraryPage.currentPage - 1) * libraryPage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="title" label="脚本标题" width="180" show-overflow-tooltip />
            <el-table-column prop="content" label="脚本内容" min-width="250" show-overflow-tooltip />
            <el-table-column label="标签" width="180">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <el-tag v-for="tag in scope.row.tags" :key="tag" size="mini" effect="plain" type="success">{{ tag }}</el-tag>
                  <span v-if="!scope.row.tags?.length" class="text-gray-300 text-xs">暂无标签</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="creator" label="创建者" width="120" align="center">
              <template #default="scope">
                <el-tag size="small" type="info" effect="light">{{ scope.row.creator }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center" />
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="scope">
                <!-- 模拟权限判定：只有创建者或管理员能编辑/删除 -->
                <template v-if="canManage(scope.row)">
                  <el-button type="primary" plain size="mini" @click="handleEditLibrary(scope.row)">编辑</el-button>
                  <el-button type="danger" plain size="mini" @click="handleDeleteLibrary(scope.row)">删除</el-button>
                </template>
                <span v-else class="text-gray-400 text-xs italic">无权限</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="libraryPage.currentPage"
              v-model:page-size="libraryPage.pageSize"
              :total="libraryData.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 历史脚本编辑弹窗 -->
    <el-dialog 
      v-model="historyEditVisible" 
      title="历史脚本标签管理" 
      width="500px" 
      destroy-on-close
      append-to-body
    >
      <el-form :model="historyEditForm" label-position="top">
        <el-form-item label="脚本内容 (预览)">
          <div class="p-3 bg-gray-50 rounded border text-gray-600 text-sm leading-relaxed max-h-40 overflow-y-auto">
            {{ historyEditForm.content }}
          </div>
        </el-form-item>
        <el-form-item label="标签管理">
          <div class="tag-manager-box p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="(tag, index) in historyEditForm.tags"
                :key="index"
                closable
                effect="light"
                class="transition-all hover:scale-105"
                @close="removeHistoryTag(index)"
              >
                {{ tag }}
              </el-tag>
              
              <template v-if="historyEditForm.tags.length < 5">
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="newTag"
                  class="w-24"
                  size="small"
                  @keyup.enter="addHistoryTag"
                  @blur="addHistoryTag"
                />
                <el-button v-else size="small" class="button-new-tag" @click="showTagInput">
                  <el-icon class="mr-1"><ElIconPlus /></el-icon>
                  添加标签
                </el-button>
              </template>
            </div>
            <div class="mt-2 text-[12px] text-gray-400 flex justify-between">
              <span>{{ historyEditForm.tags.length }}/5</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="historyEditVisible = false">关闭</el-button>
          <el-button type="primary" @click="saveHistoryEdit">确认修改</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 脚本库编辑/新增弹窗 -->
    <el-dialog 
      v-model="libraryEditVisible" 
      :title="libraryEditForm.id ? '编辑脚本库' : '新增脚本库'" 
      width="600px" 
      destroy-on-close
      append-to-body
    >
      <el-form :model="libraryEditForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="libraryEditForm.title" placeholder="输入脚本库标题标识" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="libraryEditForm.content" type="textarea" :rows="6" placeholder="输入核心正文内容..." />
        </el-form-item>
        <el-form-item label="标签">
          <div class="tag-manager-box p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="(tag, index) in libraryEditForm.tags"
                :key="index"
                closable
                effect="light"
                class="transition-all hover:scale-105"
                @close="removeLibraryTag(index)"
              >
                {{ tag }}
              </el-tag>
              
              <template v-if="libraryEditForm.tags.length < 5">
                <el-input
                  v-if="libTagInputVisible"
                  ref="libTagInputRef"
                  v-model="newLibTag"
                  class="w-24"
                  size="small"
                  @keyup.enter="addLibraryTag"
                  @blur="addLibraryTag"
                />
                <el-button v-else size="small" class="button-new-tag" @click="showLibTagInput">
                  <el-icon class="mr-1"><ElIconPlus /></el-icon>
                  添加标签
                </el-button>
              </template>
            </div>
            <div class="mt-2 text-[12px] text-gray-400 flex justify-between">
              <span>最多 5 个标签</span>
              <span>{{ libraryEditForm.tags.length }}/5</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="libraryEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLibraryEdit">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default defineComponent({
  name: 'DocumentManagement',
  setup() {
    // 状态控制
    const activeTab = ref('history')
    const loading = ref(false)
    const currentUser = 'admin' // 模拟当前登录人

    // 历史脚本相关
    const historyData = ref<any[]>([])
    const searchHistory = ref('')
    const historyDateRange = ref([])
    const historyPage = reactive({ currentPage: 1, pageSize: 10 })
    const historyEditVisible = ref(false)
    const tagInputVisible = ref(false)
    const tagInputRef = ref(null)
    const historyEditForm = reactive<any>({
      id: null,
      content: '',
      tags: [],
      originalRow: null
    })
    const newTag = ref('')

    // 脚本库相关
    const libraryData = ref<any[]>([])
    const searchLibrary = ref('')
    const searchLibTag = ref('')
    const libraryPage = reactive({ currentPage: 1, pageSize: 10 })
    const libraryEditVisible = ref(false)
    const libTagInputVisible = ref(false)
    const libTagInputRef = ref(null)
    const newLibTag = ref('')
    const libraryEditForm = reactive<any>({
      id: null,
      title: '',
      content: '',
      tags: [],
      creator: '',
      originalRow: null
    })

    // 模拟数据初始化
    const initMockData = () => {
      // 历史脚本
      historyData.value = Array.from({ length: 25 }).map((_, i) => ({
        id: 1000 + i,
        content: `这是一条历史脚本内容片段 ${i + 1}，用于展示历史记录。`,
        tags: i % 3 === 0 ? ['历史', '测试'] : ['常规'],
        usedAt: '2023-10-25 14:30:00'
      }))
      // 脚本库
      libraryData.value = Array.from({ length: 15 }).map((_, i) => ({
        id: 2000 + i,
        title: `爆款脚本 V${i + 1}`,
        content: `这是脚本库里的核心内容 ${i + 1}。`,
        tags: ['精品'],
        creator: i % 4 === 0 ? 'admin' : 'user_' + i,
        createdAt: '2023-11-01 10:00:00'
      }))
    }

    // 搜索过滤逻辑
    const filteredHistory = computed(() => {
      return historyData.value.filter(item => 
        item.content.includes(searchHistory.value)
      )
    })

    const paginatedHistory = computed(() => {
      const start = (historyPage.currentPage - 1) * historyPage.pageSize
      return filteredHistory.value.slice(start, start + historyPage.pageSize)
    })

    const filteredLibrary = computed(() => {
      return libraryData.value.filter(item => {
        const matchesText = item.content.includes(searchLibrary.value) || item.title.includes(searchLibrary.value)
        const matchesTag = !searchLibTag.value || item.tags?.includes(searchLibTag.value)
        return matchesText && matchesTag
      })
    })

    const paginatedLibrary = computed(() => {
      const start = (libraryPage.currentPage - 1) * libraryPage.pageSize
      return filteredLibrary.value.slice(start, start + libraryPage.pageSize)
    })

    // 权限判断逻辑
    const canManage = (row: any) => {
      return currentUser === 'admin' || row.creator === currentUser
    }

    // 操作函数
    const resetHistorySearch = () => {
      searchHistory.value = ''
      historyDateRange.value = []
    }

    const resetLibrarySearch = () => {
      searchLibrary.value = ''
      searchLibTag.value = ''
    }

    const fetchHistory = () => {
      loading.value = true
      setTimeout(() => { loading.value = false }, 300)
    }

    const fetchLibrary = () => {
      loading.value = true
      setTimeout(() => { loading.value = false }, 300)
    }

    // 历史操作项
    const handleEditHistory = (row: any) => {
      historyEditForm.id = row.id
      historyEditForm.content = row.content
      historyEditForm.tags = [...row.tags]
      historyEditForm.originalRow = row
      tagInputVisible.value = false
      historyEditVisible.value = true
    }

    const showTagInput = () => {
      tagInputVisible.value = true
      nextTick(() => {
        ;(tagInputRef.value as any)?.focus()
      })
    }

    const addHistoryTag = () => {
      const tag = newTag.value.trim()
      if (!tag) {
        tagInputVisible.value = false
        return
      }
      if (historyEditForm.tags.includes(tag)) {
        ElMessage.warning('标签已存在')
        return
      }
      if (historyEditForm.tags.length >= 5) {
        ElMessage.warning('最多添加5个标签')
        tagInputVisible.value = false
        return
      }
      historyEditForm.tags.push(tag)
      newTag.value = ''
      nextTick(() => {
        ;(tagInputRef.value as any)?.focus()
      })
    }

    const removeHistoryTag = (index: number) => {
      historyEditForm.tags.splice(index, 1)
    }

    const saveHistoryEdit = () => {
      historyEditForm.originalRow.tags = [...historyEditForm.tags]
      historyEditVisible.value = false
      ElMessage.success('历史脚本标签更新成功')
    }

    const handleAddToLibrary = (row: any) => {
      // 不再直接同步，而是打开编辑页面，填入内容，引导用户输入标题和标签
      Object.assign(libraryEditForm, {
        id: null,
        title: '', // 保持为空，强制用户输入
        content: row.content,
        tags: [...row.tags],
        creator: currentUser,
        originalRow: null
      })
      libTagInputVisible.value = false
      libraryEditVisible.value = true
      ElMessage.info('请完善脚本标题、内容和标签后保存至脚本库')
    }

    // 库操作项
    const openAddLibraryDialog = () => {
      Object.assign(libraryEditForm, {
        id: null,
        title: '',
        content: '',
        tags: [],
        creator: currentUser,
        originalRow: null
      })
      libTagInputVisible.value = false
      libraryEditVisible.value = true
    }

    const handleEditLibrary = (row: any) => {
      Object.assign(libraryEditForm, {
        id: row.id,
        title: row.title,
        content: row.content,
        tags: [...row.tags],
        creator: row.creator,
        originalRow: row
      })
      libTagInputVisible.value = false
      libraryEditVisible.value = true
    }

    const showLibTagInput = () => {
      libTagInputVisible.value = true
      nextTick(() => {
        ;(libTagInputRef.value as any)?.focus()
      })
    }

    const addLibraryTag = () => {
      const tag = newLibTag.value.trim()
      if (!tag) {
        libTagInputVisible.value = false
        return
      }
      if (libraryEditForm.tags.includes(tag)) {
        ElMessage.warning('标签已存在')
        return
      }
      if (libraryEditForm.tags.length >= 5) {
        ElMessage.warning('最多添加5个标签')
        libTagInputVisible.value = false
        return
      }
      libraryEditForm.tags.push(tag)
      newLibTag.value = ''
      nextTick(() => {
        ;(libTagInputRef.value as any)?.focus()
      })
    }

    const removeLibraryTag = (index: number) => {
      libraryEditForm.tags.splice(index, 1)
    }

    const saveLibraryEdit = () => {
      if (!libraryEditForm.title || !libraryEditForm.content) {
        return ElMessage.error('请填写完整必填项')
      }
      if (libraryEditForm.id) {
        // 编辑
        const row = libraryEditForm.originalRow
        row.title = libraryEditForm.title
        row.content = libraryEditForm.content
        row.tags = [...libraryEditForm.tags]
      } else {
        // 新增
        libraryData.value.unshift({
          ...libraryEditForm,
          id: Date.now(),
          createdAt: new Date().toLocaleString()
        })
      }
      libraryEditVisible.value = false
      ElMessage.success('库操作成功')
    }

    const handleDeleteLibrary = (row: any) => {
      ElMessageBox.confirm('确定删除该脚本吗？不可恢复。', '警告', {
        type: 'warning'
      }).then(() => {
        libraryData.value = libraryData.value.filter(item => item.id !== row.id)
        ElMessage.success('删除成功')
      })
    }

    onMounted(() => {
      initMockData()
    })

    return {
      activeTab,
      loading,
      searchHistory,
      historyDateRange,
      historyPage,
      historyData,
      paginatedHistory,
      historyEditVisible,
      tagInputVisible,
      tagInputRef,
      historyEditForm,
      newTag,
      searchLibrary,
      searchLibTag,
      libTagInputVisible,
      libTagInputRef,
      newLibTag,
      libraryPage,
      libraryData,
      paginatedLibrary,
      libraryEditVisible,
      libraryEditForm,
      canManage,
      resetHistorySearch,
      resetLibrarySearch,
      fetchHistory,
      fetchLibrary,
      handleEditHistory,
      showTagInput,
      addHistoryTag,
      removeHistoryTag,
      saveHistoryEdit,
      handleAddToLibrary,
      openAddLibraryDialog,
      handleEditLibrary,
      showLibTagInput,
      addLibraryTag,
      removeLibraryTag,
      saveLibraryEdit,
      handleDeleteLibrary
    }
  }
})
</script>

<style scoped>
.document-management-container {
  /* 由 template 中的 class 控制 */
}

:deep(.el-tabs__header) {
  margin: 0;
  background: #fdfdfd;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 10px;
}

.custom-tabs {
  border: 1px solid #ebeef5;
}

.filter-header {
  transition: all 0.3s ease;
}

/* 单元格内容溢出提示优化 */
:deep(.el-table .cell) {
  white-space: nowrap;
}
</style>
