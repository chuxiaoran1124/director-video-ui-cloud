<template>
  <div class="material-management-container">
    <el-tabs v-model="activeName" class="custom-tabs">
      <!-- 声音管理 -->
      <el-tab-pane label="声音管理" name="voice">
        <div class="p-4 bg-white rounded-b-lg">
          <div class="filter-header mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-input 
                v-model="searchVoice" 
                placeholder="输入素材名称搜索" 
                size="default" 
                style="width: 260px" 
                clearable 
                prefix-icon="ElIconSearch"
                @change="fetchData"
              />
              <el-input v-model="filterVoiceTag" placeholder="输入标签关键字" size="default" style="width: 220px" clearable @change="fetchData" />
              <el-select v-model="filterVoiceSource" placeholder="来源限制" size="default" style="width: 140px" clearable @change="fetchData">
                <el-option label="a2e 来源" :value="1" />
                <el-option label="即创 来源" :value="2" />
              </el-select>
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetVoiceSearch">重置条件</el-button>
              <el-button type="primary" size="default" icon="ElIconSearch" @click="fetchData">查询素材</el-button>
            </div>
          </div>

          <el-table :data="paginatedVoices" stripe border :header-cell-style="{background:'#f8f9fb', color:'#606266'}">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (voicePage.currentPage - 1) * voicePage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="name" label="声音名称" min-width="120" show-overflow-tooltip>
              <template #default="scope">
                <span class="font-medium text-blue-600">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="150">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <el-tag v-for="tag in splitTags(scope.row.type)" :key="tag" size="mini" effect="plain" type="info">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.source === 1 ? 'warning' : 'success'" size="small" effect="dark">
                  {{ sourceMap[scope.row.source] || '其他' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="url" label="资源链接" min-width="150" show-overflow-tooltip>
              <template #default="scope">
                <el-link type="primary" :href="scope.row.url" target="_blank" size="small">{{ scope.row.url }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="录入日期" width="160" align="center" />
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <div class="flex items-center justify-center gap-2">
                  <el-button type="primary" plain size="mini" @click="handleEdit(scope.row)">
                    <el-icon class="mr-1"><ElIconEdit /></el-icon>编辑
                  </el-button>
                  <el-button type="danger" plain size="mini" @click="handleDelete(scope.row)">
                    <el-icon class="mr-1"><ElIconDelete /></el-icon>删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="voicePage.currentPage"
              v-model:page-size="voicePage.pageSize"
              :total="filteredVoices.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 数字人管理 -->
      <el-tab-pane label="数字人管理" name="digitalHuman">
        <div class="p-4 bg-white rounded-b-lg">
          <div class="filter-header mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-input 
                v-model="searchDH" 
                placeholder="输入名称搜索" 
                size="default" 
                style="width: 260px" 
                clearable 
                prefix-icon="ElIconSearch"
                @change="fetchData"
              />
              <el-input v-model="filterDHTag" placeholder="输入标签关键字" size="default" style="width: 220px" clearable @change="fetchData" />
              <el-select v-model="filterDHSource" placeholder="来源限制" size="default" style="width: 140px" clearable @change="fetchData">
                <el-option label="a2e 来源" :value="1" />
                <el-option label="即创 来源" :value="2" />
              </el-select>
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetDHSearch">重置条件</el-button>
              <el-button type="primary" size="default" icon="ElIconSearch" @click="fetchData">查询素材</el-button>
            </div>
          </div>

          <el-table :data="paginatedDigitalHumans" stripe border :header-cell-style="{background:'#f8f9fb', color:'#606266'}">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (dhPage.currentPage - 1) * dhPage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="预览" width="100" align="center">
              <template #default="scope">
                <el-avatar :size="50" shape="square" :src="scope.row.avatar" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column label="个性标签" min-width="150">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <el-tag v-for="tag in splitTags(scope.row.type)" :key="tag" size="mini" effect="plain" type="success">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.source === 1 ? 'warning' : 'success'" size="small" effect="dark">
                  {{ sourceMap[scope.row.source] || '其他' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="录入日期" width="160" align="center" />
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <div class="flex items-center justify-center gap-2">
                  <el-button type="primary" plain size="mini" @click="handleEdit(scope.row)">
                    <el-icon class="mr-1"><ElIconEdit /></el-icon>编辑
                  </el-button>
                  <el-button type="danger" plain size="mini" @click="handleDelete(scope.row)">
                    <el-icon class="mr-1"><ElIconDelete /></el-icon>删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="dhPage.currentPage"
              v-model:page-size="dhPage.pageSize"
              :total="filteredDigitalHumans.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 关系管理 -->
      <el-tab-pane label="关系管理" name="relation">
        <div class="p-4 bg-white rounded-b-lg">
          <div class="mb-4">
            <el-button type="primary" icon="ElIconPlus" size="default" @click="openAddRelDialog">批量建立关系</el-button>
          </div>
          <el-table :data="paginatedRelations" border stripe :header-cell-style="{background:'#f8f9fb', color:'#606266'}">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (relPage.currentPage - 1) * relPage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="绑定详情" min-width="300" align="center">
              <template #default="scope">
                <div class="flex items-center justify-center">
                  <span class="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-l-md border border-blue-200 border-r-0 text-xs">{{ scope.row.voiceName }}</span>
                  <div class="flex items-center justify-center w-6 h-6 bg-white border border-gray-200 z-10 -ml-px -mr-px rounded-full shadow-sm">
                    <el-icon class="text-gray-400 text-[10px]"><ElIconConnection /></el-icon>
                  </div>
                  <span class="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-r-md border border-green-200 border-l-0 text-xs">{{ scope.row.digitalHumanName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关系标签" min-width="150" align="center">
              <template #default="scope">
                <div class="flex flex-wrap gap-1 justify-center">
                  <el-tag v-for="tag in (scope.row.tags || [])" :key="tag" size="mini" effect="plain" type="warning">{{ tag }}</el-tag>
                  <span v-if="!scope.row.tags?.length" class="text-gray-300 text-xs">无</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="绑定时间" width="160" align="center" />
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="scope">
                <div class="flex items-center justify-center gap-2">
                  <el-button type="primary" plain size="mini" @click="handleEditRel(scope.row)">编辑</el-button>
                  <el-button type="danger" plain size="mini" @click="handleDelete(scope.row)">解除关联</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="relPage.currentPage"
              v-model:page-size="relPage.pageSize"
              :total="relations.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑弹窗 (通用) -->
    <el-dialog
      v-model="dialogVisible"
      :title="activeName === 'voice' ? '编辑声音素材' : '编辑数字人素材'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="editForm" label-width="80px" size="default" class="mt-4">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入素材名称" class="max-w-xs" />
        </el-form-item>
        <el-form-item label="标签">
          <div class="tag-manager-box p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="(tag, index) in editForm.tags"
                :key="index"
                closable
                :type="activeName === 'voice' ? '' : 'success'"
                effect="light"
                class="transition-all hover:scale-105"
                @close="removeTag(editForm, index)"
              >
                {{ tag }}
              </el-tag>
              
              <template v-if="editForm.tags.length < (activeName === 'voice' ? 5 : 7)">
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="newTag"
                  class="w-20"
                  size="small"
                  @keyup.enter="addTag(editForm, activeName === 'voice' ? 5 : 7)"
                  @blur="addTag(editForm, activeName === 'voice' ? 5 : 7)"
                />
                <el-button v-else size="small" class="button-new-tag" @click="showTagInput">
                  <el-icon class="mr-1"><ElIconPlus /></el-icon>
                  添加新标签
                </el-button>
              </template>
            </div>
            <div class="mt-2 text-[12px] text-gray-400 flex justify-between">
              <span>{{ editForm.tags.length }}/{{ activeName === 'voice' ? 5 : 7 }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增绑定关系弹窗 (批量) -->
    <el-dialog
      v-model="addRelVisible"
      title="批量建立绑定关系"
      width="1000px"
      destroy-on-close
    >
      <div class="flex gap-6">
        <!-- 左侧选择器 -->
        <div class="flex-[3] flex flex-col gap-4">
          <div class="flex gap-4 h-[400px]">
             <!-- 声音选择 -->
            <div class="flex-1 flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="p-2 bg-blue-50 border-b font-medium text-xs flex justify-between">
                <span>1. 选择声音</span>
                <span class="text-blue-600">{{ selectedVoices.length }} 个</span>
              </div>
              <div class="p-2">
                <el-input v-model="searchAddVoice" placeholder="搜索声音..." size="mini" prefix-icon="ElIconSearch" />
              </div>
              <el-table :data="filteredAddVoices" height="100%" size="mini" @selection-change="handleVoiceSelectionChange" class="flex-1">
                <el-table-column type="selection" width="35" />
                <el-table-column prop="name" label="名称" show-overflow-tooltip />
              </el-table>
            </div>

            <!-- 数字人选择 -->
            <div class="flex-1 flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="p-2 bg-green-50 border-b font-medium text-xs flex justify-between">
                <span>2. 选择数字人</span>
                <span class="text-green-600">{{ selectedDHs.length }} 个</span>
              </div>
              <div class="p-2">
                <el-input v-model="searchAddDH" placeholder="搜索数字人..." size="mini" prefix-icon="ElIconSearch" />
              </div>
              <el-table :data="filteredAddDHs" height="100%" size="mini" @selection-change="handleDHSelectionChange" class="flex-1">
                <el-table-column type="selection" width="35" />
                <el-table-column prop="name" label="名称" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </div>

        <!-- 右侧：关系配置 -->
        <div class="flex-[1.2] flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="font-bold text-sm text-gray-700 mb-2">3. 关系配置</div>
          
          <div class="space-y-4">
            <div>
              <div class="text-[12px] text-gray-500 mb-2">是否为新关系添加标签？</div>
              <el-switch v-model="isAddRelTag" active-text="添加共有标签" />
            </div>

            <div v-if="isAddRelTag" class="tag-manager-box p-3 bg-white rounded border border-gray-200 shadow-inner">
              <div class="flex flex-wrap gap-2 mb-2">
                <el-tag v-for="(tag, index) in bulkRelTags" :key="index" closable size="mini" @close="bulkRelTags.splice(index, 1)">{{ tag }}</el-tag>
              </div>
              <div v-if="bulkRelTags.length < 5" class="flex gap-1">
                <el-input v-model="bulkTagInput" size="mini" placeholder="输入标签" @keyup.enter="addBulkRelTag" />
                <el-button size="mini" type="primary" plain @click="addBulkRelTag">添加</el-button>
              </div>
            </div>

            <div class="mt-auto pt-6 border-t border-gray-200">
              <div class="text-xs text-gray-400 mb-2">生成预览：</div>
              <div class="p-3 bg-blue-100 text-blue-800 rounded text-xs leading-5">
                将生成 <span class="font-bold text-blue-900">{{ selectedVoices.length * selectedDHs.length }}</span> 条绑定项。
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addRelVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!selectedVoices.length || !selectedDHs.length" @click="saveRelations">确认生成</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑绑定关系弹窗 (单条修改) -->
    <el-dialog v-model="editRelVisible" title="编辑绑定关系" width="550px" destroy-on-close>
      <el-form label-position="top" size="default">
        <div class="space-y-4">
          <el-form-item label="声音素材修正">
            <el-select 
              v-model="editRelForm.voiceId" 
              filterable 
              clearable
              placeholder="请输入关键词检索声音" 
              class="w-full"
            >
              <template #prefix>
                <el-icon><ElIconSearch /></el-icon>
              </template>
              <el-option
                v-for="v in voices"
                :key="v.id"
                :label="v.name"
                  :value="v.id"
              >
                <div class="flex justify-between items-center">
                  <span>{{ v.name }}</span>
                  <span class="text-gray-400 text-xs">{{ sourceMap[v.source] }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="数字人素材修正">
            <el-select 
              v-model="editRelForm.digitalHumanId" 
              filterable 
              clearable
              placeholder="请输入关键词检索数字人" 
              class="w-full"
            >
              <template #prefix>
                <el-icon><ElIconSearch /></el-icon>
              </template>
              <el-option
                v-for="d in digitalHumans"
                :key="d.id"
                :label="d.name"
                :value="d.id"
              >
                <div class="flex justify-between items-center">
                  <span>{{ d.name }}</span>
                  <span class="text-gray-400 text-xs">{{ sourceMap[d.source] }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="绑定关系标签 (可增删)" class="mt-6">
          <div class="tag-manager-box p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="(tag, index) in editRelForm.tags"
                :key="index"
                closable
                type="warning"
                size="small"
                @close="removeTag(editRelForm, index)"
              >
                {{ tag }}
              </el-tag>
              
              <template v-if="editRelForm.tags.length < 5">
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="newTag"
                  class="w-20"
                  size="mini"
                  @keyup.enter="addTag(editRelForm, 5)"
                  @blur="addTag(editRelForm, 5)"
                />
                <el-button v-else size="mini" class="button-new-tag" @click="showTagInput">
                  添加
                </el-button>
              </template>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editRelVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditRel">确认更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, reactive, nextTick } from 'vue'
import { getVoices, getDigitalHumans, getRelations } from '/@/api/material/index'
import { ElMessage, ElMessageBox } from 'element-plus'

export default defineComponent({
  name: 'MaterialManagement',
  setup() {
    const activeName = ref('voice')
    const voices = ref([])
    const digitalHumans = ref([])
    const relations = ref([])
    
    // 搜索数据初始化
    const searchVoice = ref('')
    const searchDH = ref('')
    const filterVoiceTag = ref('')
    const filterVoiceSource = ref<number | null>(1) // 默认 a2e
    const filterDHTag = ref('')
    const filterDHSource = ref<number | null>(1) // 默认 a2e

    // 分页数据
    const voicePage = reactive({ currentPage: 1, pageSize: 10 })
    const dhPage = reactive({ currentPage: 1, pageSize: 10 })
    const relPage = reactive({ currentPage: 1, pageSize: 10 })

    // 编辑弹窗相关
    const dialogVisible = ref(false)
    const tagInputVisible = ref(false)
    const tagInputRef = ref(null)
    const newTag = ref('')
    const editForm = reactive({
      id: null,
      name: '',
      tags: [] as string[],
      originalRow: null as any
    })

    // 关系新增相关
    const addRelVisible = ref(false)
    const editRelVisible = ref(false)
    const searchAddVoice = ref('')
    const searchAddDH = ref('')
    const selectedVoices = ref<any[]>([])
    const selectedDHs = ref<any[]>([])

    const isAddRelTag = ref(false)
    const bulkRelTags = ref<string[]>([])
    const bulkTagInput = ref('')

    const editRelForm = reactive<any>({
      id: null,
      voiceId: null,
      voiceName: '',
      digitalHumanId: null,
      digitalHumanName: '',
      tags: [],
      originalRow: null
    })

    const sourceMap: { [key: number]: string } = {
        1: 'a2e',
        2: '即创'
    }

    const splitTags = (tagsStr: string) => {
        if (!tagsStr) return []
        return tagsStr.split('|').filter(t => t.trim() !== '')
    }

    // 过滤逻辑
    const filteredVoices = computed(() => {
        return voices.value.filter((v: any) => {
            const nameMatch = v.name.toLowerCase().includes(searchVoice.value.toLowerCase())
            const tagMatch = !filterVoiceTag.value || v.type.toLowerCase().includes(filterVoiceTag.value.toLowerCase())
            const sourceMatch = filterVoiceSource.value === null || filterVoiceSource.value === '' || v.source === filterVoiceSource.value
            return nameMatch && tagMatch && sourceMatch
        })
    })

    const filteredDigitalHumans = computed(() => {
        return digitalHumans.value.filter((v: any) => {
            const nameMatch = v.name.toLowerCase().includes(searchDH.value.toLowerCase())
            const tagMatch = !filterDHTag.value || v.type.toLowerCase().includes(filterDHTag.value.toLowerCase())
            const sourceMatch = filterDHSource.value === null || filterDHSource.value === '' || v.source === filterDHSource.value
            return nameMatch && tagMatch && sourceMatch
        })
    })

    // 分页截取逻辑
    const paginatedVoices = computed(() => {
      const start = (voicePage.currentPage - 1) * voicePage.pageSize
      return filteredVoices.value.slice(start, start + voicePage.pageSize)
    })

    const paginatedDigitalHumans = computed(() => {
      const start = (dhPage.currentPage - 1) * dhPage.pageSize
      return filteredDigitalHumans.value.slice(start, start + dhPage.pageSize)
    })

    const paginatedRelations = computed(() => {
      const start = (relPage.currentPage - 1) * relPage.pageSize
      return relations.value.slice(start, start + relPage.pageSize)
    })

    // 弹窗内的过滤逻辑
    const filteredAddVoices = computed(() => {
      return voices.value.filter((v: any) => 
        v.name.toLowerCase().includes(searchAddVoice.value.toLowerCase())
      )
    })

    const filteredAddDHs = computed(() => {
      return digitalHumans.value.filter((d: any) => 
        d.name.toLowerCase().includes(searchAddDH.value.toLowerCase())
      )
    })

    const fetchData = async () => {
      try {
        const [vRes, dRes, rRes] = await Promise.all([
          getVoices(),
          getDigitalHumans(),
          getRelations()
        ])
        voices.value = vRes.data.data
        digitalHumans.value = dRes.data.data
        relations.value = rRes.data.data
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    const resetVoiceSearch = () => {
      searchVoice.value = ''
      filterVoiceTag.value = ''
      filterVoiceSource.value = 1
      voicePage.currentPage = 1
    }

    const resetDHSearch = () => {
      searchDH.value = ''
      filterDHTag.value = ''
      filterDHSource.value = 1
      dhPage.currentPage = 1
    }

    // 关系管理操作
    const openAddRelDialog = () => {
      searchAddVoice.value = ''
      searchAddDH.value = ''
      selectedVoices.value = []
      selectedDHs.value = []
      isAddRelTag.value = false
      bulkRelTags.value = []
      bulkTagInput.value = ''
      addRelVisible.value = true
    }

    const addBulkRelTag = () => {
      const tag = bulkTagInput.value.trim()
      if (tag && !bulkRelTags.value.includes(tag) && bulkRelTags.value.length < 5) {
        bulkRelTags.value.push(tag)
        bulkTagInput.value = ''
      }
    }

    const handleVoiceSelectionChange = (val: any[]) => {
      selectedVoices.value = val
    }

    const handleDHSelectionChange = (val: any[]) => {
      selectedDHs.value = val
    }

    const saveRelations = () => {
      if (selectedVoices.value.length === 0 || selectedDHs.value.length === 0) return
      
      const newEntries: any[] = []
      const timestamp = new Date().toLocaleString()
      const sharedTags = isAddRelTag.value ? [...bulkRelTags.value] : []
      
      // 笛卡尔积生成
      selectedVoices.value.forEach(v => {
        selectedDHs.value.forEach(d => {
          newEntries.push({
            id: Math.floor(Math.random() * 10000) + 5000,
            voiceId: v.id,
            voiceName: v.name,
            digitalHumanId: d.id,
            digitalHumanName: d.name,
            tags: sharedTags,
            createdAt: timestamp
          })
        })
      })

      relations.value = [...newEntries, ...relations.value]
      addRelVisible.value = false
      ElMessage.success(`成功生成 ${newEntries.length} 条绑定关系`)
    }

    const handleEditRel = (row: any) => {
      editRelForm.id = row.id
      editRelForm.voiceId = row.voiceId
      editRelForm.voiceName = row.voiceName
      editRelForm.digitalHumanId = row.digitalHumanId
      editRelForm.digitalHumanName = row.digitalHumanName
      editRelForm.tags = [...(row.tags || [])]
      editRelForm.originalRow = row
      
      editRelVisible.value = true
    }

    const saveEditRel = () => {
      const row = editRelForm.originalRow
      
      // 根据选中的 ID 同步更新名称
      const voice = voices.value.find((v: any) => v.id === editRelForm.voiceId)
      const dh = digitalHumans.value.find((d: any) => d.id === editRelForm.digitalHumanId)
      
      if (voice) {
        row.voiceId = voice.id
        row.voiceName = voice.name
      }
      if (dh) {
        row.digitalHumanId = dh.id
        row.digitalHumanName = dh.name
      }
      
      row.tags = [...editRelForm.tags]
      
      editRelVisible.value = false
      ElMessage.success('绑定关系更新成功')
    }

    const handleEdit = (row: any) => {
      editForm.id = row.id
      editForm.name = row.name
      editForm.tags = splitTags(row.type)
      editForm.originalRow = row
      newTag.value = ''
      tagInputVisible.value = false
      dialogVisible.value = true
    }

    const showTagInput = () => {
      tagInputVisible.value = true
      nextTick(() => {
        ;(tagInputRef.value as any)?.focus()
      })
    }

    const hideTagInput = () => {
      tagInputVisible.value = false
      newTag.value = ''
    }

    const addTag = (targetForm: any, limit: number) => {
      const tag = newTag.value.trim()
      if (!tag) {
        hideTagInput()
        return
      }
      if (targetForm.tags.includes(tag)) {
        ElMessage.warning('标签已存在')
        return
      }
      if (targetForm.tags.length >= limit) {
        ElMessage.warning(`最多只能添加${limit}个标签`)
        hideTagInput()
        return
      }
      targetForm.tags.push(tag)
      newTag.value = ''
      nextTick(() => {
        ;(tagInputRef.value as any)?.focus()
      })
    }

    const removeTag = (targetForm: any, index: number) => {
      targetForm.tags.splice(index, 1)
    }

    const saveEdit = () => {
      if (!editForm.name.trim()) {
        return ElMessage.error('名称不能为空')
      }
      // 更新本地数据 (模拟保存)
      const dataStr = `|${editForm.tags.join('|')}|`
      editForm.originalRow.name = editForm.name
      editForm.originalRow.type = dataStr
      
      dialogVisible.value = false
      ElMessage.success('保存成功')
    }

    const handleDelete = (row: any) => {
      ElMessageBox.confirm('确定要删除该项吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('模拟删除成功')
      })
    }

    onMounted(() => {
      fetchData()
    })

    return {
      activeName,
      voices,
      digitalHumans,
      relations,
      searchVoice,
      searchDH,
      filterVoiceTag,
      filterVoiceSource,
      filterDHTag,
      filterDHSource,
      sourceMap,
      splitTags,
      filteredVoices,
      filteredDigitalHumans,
      paginatedVoices,
      paginatedDigitalHumans,
      paginatedRelations,
      voicePage,
      dhPage,
      relPage,
      dialogVisible,
      editRelVisible,
      editRelForm,
      isAddRelTag,
      bulkRelTags,
      bulkTagInput,
      editForm,
      newTag,
      tagInputVisible,
      tagInputRef,
      addRelVisible,
      searchAddVoice,
      searchAddDH,
      selectedVoices,
      selectedDHs,
      filteredAddVoices,
      filteredAddDHs,
      fetchData,
      resetVoiceSearch,
      resetDHSearch,
      handleEdit,
      handleDelete,
      addTag,
      removeTag,
      saveEdit,
      showTagInput,
      hideTagInput,
      openAddRelDialog,
      addBulkRelTag,
      handleVoiceSelectionChange,
      handleDHSelectionChange,
      saveRelations,
      handleEditRel,
      saveEditRel
    }
  }
})
</script>

<style scoped>
.material-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.custom-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.1);
}

.context-label {
  display: none;
}

.filter-header {
  transition: all 0.3s ease;
}

/* 标签管理样式优化 */
.tag-manager-box {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.button-new-tag {
  border-style: dashed;
  height: 24px;
  line-height: 22px;
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.el-tabs__header) {
  margin: 0;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  border-radius: 8px 8px 0 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
}
</style>
