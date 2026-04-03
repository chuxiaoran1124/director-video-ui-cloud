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
            <el-table-column prop="voiceName" label="声音名称" min-width="120" show-overflow-tooltip>
              <template #default="scope">
                <span class="font-medium text-blue-600">{{ scope.row.voiceName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="150">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <span v-if="splitTags(scope.row.title).length === 0" class="text-gray-400 text-xs">暂无标签</span>
                  <el-tag v-for="tag in splitTags(scope.row.title)" :key="tag" size="mini" effect="plain" type="info">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="试听" width="80" align="center">
              <template #default="scope">
                <el-button size="small" type="primary" icon="ElIconVideoPlay" @click="playVoice(scope.row)" circle />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="录入日期" width="160" align="center" />
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
              :total="voicesTotal"
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
              <el-input v-model="filterDHTag" placeholder="输入标签关键字" size="default" style="width: 220px" clearable @change="activeName === 'digitalHuman' ? fetchDigitalHumans() : fetchData()" />
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetDHSearch">重置条件</el-button>
              <el-button type="primary" size="default" icon="ElIconSearch" @click="fetchDigitalHumans()">查询素材</el-button>
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
                <el-avatar :size="50" shape="square" :src="scope.row.coverUrl" />
              </template>
            </el-table-column>
            <el-table-column prop="digitalHumanName" label="名称" min-width="120" />
            <el-table-column label="个性标签" min-width="150">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <span v-if="!scope.row.title" class="text-gray-400 text-xs">暂无标签</span>
                  <el-tag v-for="tag in splitTags(scope.row.title)" :key="tag" size="mini" effect="plain" type="success">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="录入日期" width="160" align="center" />
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
              :total="digitalHumansTotal"
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
                  <el-tag v-for="tag in splitTags(scope.row.title)" :key="tag" size="mini" effect="plain" type="warning">{{ tag }}</el-tag>
                  <span v-if="splitTags(scope.row.title).length === 0" class="text-gray-300 text-xs">无</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="绑定时间" width="160" align="center" />
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
              <el-table ref="voiceTableRef" :data="filteredAddVoices" height="100%" size="mini" @selection-change="handleVoiceSelectionChange" class="flex-1">
                <el-table-column type="selection" width="35" />
                <el-table-column prop="voiceName" label="名称" show-overflow-tooltip />
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
              <el-table ref="dhTableRef" :data="filteredAddDHs" height="100%" size="mini" @selection-change="handleDHSelectionChange" class="flex-1">
                <el-table-column type="selection" width="35" />
                <el-table-column prop="digitalHumanName" label="名称" show-overflow-tooltip />
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
import { defineComponent, ref, onMounted, computed, reactive, nextTick, watch } from 'vue'
import { getVoices, getDigitalHumans, getRelations, getDigitalHumanPaginateList, updateDigitalHuman, updateVoice, deleteVoice, deleteDigitalHuman, getVoicePaginateList, getBindingList, createBinding, updateBinding, deleteBinding } from '/@/api/material/index'
import { ElMessage, ElMessageBox } from 'element-plus'

export default defineComponent({
  name: 'MaterialManagement',
  setup() {
    const activeName = ref('voice')
    const voices = ref([])
    const digitalHumans = ref([])
    const digitalHumansTotal = ref(0) // 数字人总数
    const voicesTotal = ref(0) // 声音总数
    const relations = ref([])
    
    // 音频播放相关
    const audioPlayer = ref(null as HTMLAudioElement | null)
    const currentPlayingVoice = ref(null as any)
    
    // 搜索数据初始化
    const searchVoice = ref('')
    const searchDH = ref('')
    const filterVoiceTag = ref('')
    const filterDHTag = ref('')

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
    const voicesForDialog = ref<any[]>([])
    const digitalHumansForDialog = ref<any[]>([])
    const voiceDialogPage = reactive({ currentPage: 1, pageSize: 20, total: 0, loading: false })
    const dhDialogPage = reactive({ currentPage: 1, pageSize: 20, total: 0, loading: false })
    const voiceTableRef = ref(null)
    const dhTableRef = ref(null)

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

    const splitTags = (tags: string | string[] | null | undefined) => {
      if (!tags) return []
      if (Array.isArray(tags)) {
        return tags.filter((t: string) => t && t.toString().trim() !== '')
      }
      return tags.split('|').map(t => t.trim()).filter(t => t !== '')
    }

    // 过滤逻辑
    const filteredVoices = computed(() => {
        return voices.value.filter((v: any) => {
            const nameMatch = v.name.toLowerCase().includes(searchVoice.value.toLowerCase())
            const tagMatch = !filterVoiceTag.value || v.type.toLowerCase().includes(filterVoiceTag.value.toLowerCase())
            return nameMatch && tagMatch
        })
    })

    const filteredDigitalHumans = computed(() => {
        return digitalHumans.value.filter((v: any) => {
            const nameMatch = v.digitalHumanName && v.digitalHumanName.toLowerCase().includes(searchDH.value.toLowerCase())
            // 注：API返回的数据中没有type字段，可以根据实际字段调整
            return nameMatch
        })
    })

    // 分页截取逻辑
    const paginatedVoices = computed(() => {
      // 声音数据已经是分页查询的结果，直接返回
      return voices.value
    })

    const paginatedDigitalHumans = computed(() => {
      // 数字人数据已经是分页查询的结果，直接返回
      return digitalHumans.value
    })

    const paginatedRelations = computed(() => {
      const start = (relPage.currentPage - 1) * relPage.pageSize
      return relations.value.slice(start, start + relPage.pageSize)
    })

    // 弹窗内的过滤逻辑
    const filteredAddVoices = computed(() => {
      return voicesForDialog.value.filter((v: any) => 
        (v.voiceName || '').toLowerCase().includes(searchAddVoice.value.toLowerCase())
      )
    })

    const filteredAddDHs = computed(() => {
      return digitalHumansForDialog.value.filter((d: any) => 
        (d.digitalHumanName || '').toLowerCase().includes(searchAddDH.value.toLowerCase())
      )
    })

    const fetchData = async () => {
      try {
        // 使用新的分页接口获取绑定关系
        const [bRes] = await Promise.all([
          getBindingList(relPage.currentPage, relPage.pageSize)
        ])
        relations.value = bRes.data.data.data || []
        
        // 声音和数字人都使用分页查询
        await fetchVoices()
        await fetchDigitalHumans()
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    const fetchVoices = async () => {
      try {
        const searchObj = {}
        // 传递搜索条件到API
        if (searchVoice.value) Object.assign(searchObj, { voiceName: searchVoice.value })
        if (filterVoiceTag.value) Object.assign(searchObj, { title: filterVoiceTag.value })
        
        const res = await getVoicePaginateList(voicePage.currentPage, voicePage.pageSize, searchObj)
        if (res.data.code === 200 && res.data.data) {
          voices.value = res.data.data.data || []
          voicesTotal.value = res.data.data.total || 0
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error)
      }
    }

    const fetchDigitalHumans = async () => {
      try {
        const searchObj = {}
        // 传递搜索条件到API
        if (searchDH.value) Object.assign(searchObj, { digitalHumanName: searchDH.value })
        if (filterDHTag.value) Object.assign(searchObj, { title: filterDHTag.value })
        
        const res = await getDigitalHumanPaginateList(dhPage.currentPage, dhPage.pageSize, searchObj)
        if (res.data.code === 200 && res.data.data) {
          digitalHumans.value = res.data.data.data || []
          digitalHumansTotal.value = res.data.data.total || 0
        }
      } catch (error) {
        console.error('Failed to fetch digital humans:', error)
      }
    }

    const resetVoiceSearch = () => {
      searchVoice.value = ''
      filterVoiceTag.value = ''
      voicePage.currentPage = 1
      fetchVoices()
    }

    const resetDHSearch = () => {
      searchDH.value = ''
      filterDHTag.value = ''
      dhPage.currentPage = 1
      fetchDigitalHumans()
    }

    // 关系管理操作
    const fetchVoicesForDialog = async () => {
      try {
        console.log('Fetching all voices for dialog')
        const res = await getVoicePaginateList(1, 999)
        if (res.data.code === 200 && res.data.data) {
          voicesForDialog.value = res.data.data.data || []
          console.log('Voices loaded:', voicesForDialog.value.length)
        }
      } catch (error) {
        console.error('Failed to fetch voices for dialog:', error)
      }
    }

    const fetchDigitalHumansForDialog = async () => {
      try {
        console.log('Fetching all digital humans for dialog')
        const res = await getDigitalHumanPaginateList(1, 999)
        if (res.data.code === 200 && res.data.data) {
          digitalHumansForDialog.value = res.data.data.data || []
          console.log('Digital humans loaded:', digitalHumansForDialog.value.length)
        }
      } catch (error) {
        console.error('Failed to fetch digital humans for dialog:', error)
      }
    }

    const handleVoiceTableScroll = () => {}
    const handleDHTableScroll = () => {}

    const attachScrollListeners = () => {}
    const detachScrollListeners = () => {}

    const handleSearchAddVoiceChange = () => {}

    const openAddRelDialog = async () => {
      searchAddVoice.value = ''
      searchAddDH.value = ''
      selectedVoices.value = []
      selectedDHs.value = []
      isAddRelTag.value = false
      bulkRelTags.value = []
      bulkTagInput.value = ''
      
      voicesForDialog.value = []
      digitalHumansForDialog.value = []
      
      // 一次加载所有数据（最多999条）
      await Promise.all([
        fetchVoicesForDialog(),
        fetchDigitalHumansForDialog()
      ])
      
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

    const saveRelations = async () => {
      if (selectedVoices.value.length === 0 || selectedDHs.value.length === 0) return
      
      const sharedTags = isAddRelTag.value ? `|${bulkRelTags.value.join('|')}|` : ''
      
      try {
        let successCount = 0
        // 笛卡尔积生成并创建
        for (const v of selectedVoices.value) {
          for (const d of selectedDHs.value) {
            const bindingData = {
              voiceId: v.id,
              digitalHumanId: d.id,
              title: sharedTags
            }
            
            const res = await createBinding(bindingData)
            if (res.data.code === 200) {
              successCount++
            }
          }
        }

        // 创建完成后重新请求分页接口刷新
        relPage.currentPage = 1
        const bRes = await getBindingList(relPage.currentPage, relPage.pageSize)
        if (bRes.data.code === 200) {
          relations.value = bRes.data.data.data || []
        }

        addRelVisible.value = false
        ElMessage.success(`成功生成 ${successCount} 条绑定关系`)
      } catch (error) {
        console.error('创建绑定关系失败:', error)
        ElMessage.error('创建绑定关系失败，请重试')
      }
    }

    const handleEditRel = (row: any) => {
      editRelForm.id = row.id
      editRelForm.voiceId = row.voiceId
      editRelForm.voiceName = row.voiceName
      editRelForm.digitalHumanId = row.digitalHumanId
      editRelForm.digitalHumanName = row.digitalHumanName
      editRelForm.tags = splitTags(row.title)
      editRelForm.originalRow = row
      
      editRelVisible.value = true
    }

    const saveEditRel = async () => {
      const row = editRelForm.originalRow
      
      try {
        const tagsStr = `|${editRelForm.tags.join('|')}|`
        const updateData = {
          title: tagsStr
        }
        
        const res = await updateBinding(row.id, updateData)
        if (res.data.code === 200) {
          // 更新本地数据
          Object.assign(row, res.data.data)
          editRelVisible.value = false
          ElMessage.success('绑定关系更新成功')
        }
      } catch (error) {
        console.error('更新绑定关系失败:', error)
        ElMessage.error('更新绑定关系失败，请重试')
      }
    }

    // 音频播放功能
    const playVoice = (voice: any) => {
      let url = voice.url

      // 处理 "['https://...']" 格式
      if (url && !url.startsWith('http')) {
        const match = url.match(/https?:\/\/[^'"\]\)\s]+/)
        if (match) url = match[0]
      }

      if (!url) {
        ElMessage.warning('该声音文件不存在')
        return
      }

      // 同一个音频：切换播放/暂停
      if (audioPlayer.value && currentPlayingVoice.value === voice) {
        if (audioPlayer.value.paused) {
          audioPlayer.value.play().catch(() => {})
        } else {
          audioPlayer.value.pause()
        }
        return
      }

      // 不同音频：停止当前，播放新的
      if (audioPlayer.value) {
        ;(audioPlayer.value as any)._aborted = true
        audioPlayer.value.pause()
        audioPlayer.value.src = ''
        audioPlayer.value = null
      }
      currentPlayingVoice.value = voice

      const audio = new Audio()
      audioPlayer.value = audio

      audio.addEventListener('error', () => {
        if ((audio as any)._aborted) return
        ElMessage.error('音频播放失败，请检查文件地址')
        audioPlayer.value = null
        currentPlayingVoice.value = null
      })

      audio.src = url
      audio.play().catch(error => {
        ElMessage.error('音频播放失败: ' + (error.message || ''))
        audioPlayer.value = null
        currentPlayingVoice.value = null
      })

      audio.onended = () => {
        audioPlayer.value = null
        currentPlayingVoice.value = null
      }
    }

    const handleEdit = (row: any) => {
      editForm.id = row.externalId || row.id
      // 根据当前标签页设置正确的字段
      if (activeName.value === 'digitalHuman') {
        editForm.name = row.digitalHumanName || ''
      } else {
        editForm.name = row.voiceName || ''
      }
      editForm.tags = splitTags(row.title)
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

    const saveEdit = async () => {
      if (!editForm.name.trim()) {
        return ElMessage.error('名称不能为空')
      }
      
      try {
        const tagsStr = `|${editForm.tags.join('|')}|`
        
        if (activeName.value === 'digitalHuman') {
          // 更新数字人
          const row = editForm.originalRow
          const updateData = {
            digital_human_name: editForm.name,
            title: tagsStr,
            cover_url: row.coverUrl || '',
            language: row.language || '',
            gender: row.gender || ''
          }
          
          const res = await updateDigitalHuman(row.id, updateData)
          if (res.data.code === 200) {
            // 更新本地数据
            row.digitalHumanName = editForm.name
            row.title = tagsStr
            ElMessage.success('保存成功')
            dialogVisible.value = false
          }
        } else {
          // 更新声音
          const row = editForm.originalRow
          const tagsStr = `|${editForm.tags.join('|')}|`
          const updateData = {
            voice_name: editForm.name,
            title: tagsStr,
            url: row.url || ''
          }
          
          const res = await updateVoice(row.id, updateData)
          if (res.data.code === 200) {
            // 更新本地数据
            row.voiceName = editForm.name
            row.title = tagsStr
            ElMessage.success('保存成功')
            dialogVisible.value = false
          }
        }
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败，请重试')
      }
    }

    const handleDelete = (row: any) => {
      ElMessageBox.confirm('确定要删除该项吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 判断是否是关系记录（有voiceId和digitalHumanId）
          if (row.voiceId !== undefined && row.digitalHumanId !== undefined) {
            // 删除绑定关系
            const res = await deleteBinding(row.id)
            if (res.data.code === 200) {
              // 从列表中移除
              const index = relations.value.findIndex((r: any) => r.id === row.id)
              if (index > -1) {
                relations.value.splice(index, 1)
              }
              ElMessage.success('绑定关系已删除')
            }
          } else if (activeName.value === 'voice') {
            // 删除声音素材
            const res = await deleteVoice(row.id)
            if (res.data.code === 200) {
              // 从列表中移除
              const index = voices.value.findIndex((v: any) => v.id === row.id)
              if (index > -1) {
                voices.value.splice(index, 1)
              }
              ElMessage.success('声音已删除')
              // 重新加载声音和关系管理列表
              await Promise.all([
                fetchVoices(),
                fetchData()
              ])
            }
          } else if (activeName.value === 'digitalHuman') {
            // 删除数字人素材
            const res = await deleteDigitalHuman(row.id)
            if (res.data.code === 200) {
              // 从列表中移除
              const index = digitalHumans.value.findIndex((dh: any) => dh.id === row.id)
              if (index > -1) {
                digitalHumans.value.splice(index, 1)
              }
              ElMessage.success('数字人已删除')
              // 重新加载数字人和关系管理列表
              await Promise.all([
                fetchDigitalHumans(),
                fetchData()
              ])
            }
          } else {
            ElMessage.success('删除成功')
          }
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败，请重试')
        }
      })
    }

    // 监听对话框打开/关闭，管理滚动监听
    watch(() => addRelVisible.value, (newVal) => {
      if (newVal) {
        attachScrollListeners()
      } else {
        detachScrollListeners()
      }
    })

    onMounted(() => {
      fetchData()
    })

    // 监听数字人分页变化
    watch(() => [dhPage.currentPage, dhPage.pageSize], () => {
      fetchDigitalHumans()
    }, { deep: true })
    
    // 监听声音分页变化
    watch(() => [voicePage.currentPage, voicePage.pageSize], () => {
      fetchVoices()
    }, { deep: true })
    
    // 监听搜索条件变化
    watch(() => searchDH.value, () => {
      dhPage.currentPage = 1 // 重置到第一页
      fetchDigitalHumans()
    })
    
    // 监听声音搜索条件变化
    watch(() => searchVoice.value, () => {
      voicePage.currentPage = 1 // 重置到第一页
      fetchVoices()
    })
    
    // 监听标签搜索条件变化
    watch(() => filterDHTag.value, () => {
      dhPage.currentPage = 1 // 重置到第一页
      fetchDigitalHumans()
    })
    
    // 监听声音标签搜索条件变化
    watch(() => filterVoiceTag.value, () => {
      voicePage.currentPage = 1 // 重置到第一页
      fetchVoices()
    })

    // 监听关系分页变化
    watch(() => [relPage.currentPage, relPage.pageSize], () => {
      fetchData()
    }, { deep: true })

    return {
      activeName,
      voices,
      digitalHumans,
      digitalHumansTotal,
      voicesTotal,
      relations,
      searchVoice,
      searchDH,
      filterVoiceTag,
      filterDHTag,
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
      voicesForDialog,
      digitalHumansForDialog,
      voiceDialogPage,
      dhDialogPage,
      fetchData,
      fetchVoices,
      fetchDigitalHumans,
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
      fetchVoicesForDialog,
      fetchDigitalHumansForDialog,
      voiceTableRef,
      dhTableRef,
      addBulkRelTag,
      handleVoiceSelectionChange,
      handleDHSelectionChange,
      saveRelations,
      handleEditRel,
      saveEditRel,
      playVoice
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
