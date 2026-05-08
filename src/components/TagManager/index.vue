<template>
  <div class="tag-manager bg-white rounded-xl border border-gray-200 shadow-sm">
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
      <div>
        <span class="font-bold text-sm text-gray-700">个人资产 - 标签管理</span>
        <span class="ml-2 text-[11px] text-gray-400">标签来自后端字典，双击可重命名</span>
      </div>
      <div class="flex gap-2">
        <el-button size="small" :disabled="!activeTag || loading" @click="handleMoveUp">进步置顶</el-button>
        <el-button size="small" type="danger" plain :disabled="!activeTag" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <div class="px-4 py-3 space-y-3">
      <div
        v-for="level in tagLevels"
        :key="level.key"
        class="flex items-start gap-2"
      >
        <div class="flex-shrink-0 w-[88px] text-xs text-gray-500 leading-7 text-right pr-1 whitespace-nowrap">
          {{ level.label }}：
        </div>

        <div class="flex flex-wrap gap-1.5 flex-1">
          <span
            v-for="tag in level.tags"
            :key="tag.id"
            :class="[
              'inline-flex items-center px-2.5 h-7 text-xs rounded border cursor-pointer select-none transition-all',
              isSelected(level.key, tag.id)
                ? 'border-blue-500 bg-blue-500 text-white font-medium'
                : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-500',
              editingTag && editingTag.levelKey === level.key && editingTag.id === tag.id
                ? 'ring-2 ring-amber-300 !bg-amber-50 !text-amber-700 !border-amber-400'
                : '',
            ]"
            :style="isActiveTag(level.key, tag.id) ? activeTagOutlineStyle : null"
            @click="handleTagClick(level.key, tag)"
            @dblclick="startEdit(level.key, tag)"
          >
            <template v-if="editingTag && editingTag.levelKey === level.key && editingTag.id === tag.id">
              <input
                ref="editInputRef"
                v-model="editingName"
                class="w-14 text-xs bg-transparent border-none outline-none text-current"
                @blur="commitEdit(tag)"
                @keyup.enter="commitEdit(tag)"
                @keyup.esc="cancelEdit"
                @click.stop
              />
            </template>
            <template v-else>
              {{ tag.name }}
            </template>
          </span>

          <!-- 新增标签内联输入 -->
          <template v-if="addingLevelKey === level.key">
            <input
              ref="addingInputRef"
              v-model="addingName"
              class="inline-flex items-center px-2.5 h-7 text-xs rounded border border-blue-400 outline-none w-24"
              placeholder="输入标签名"
              @blur="confirmAdd(level)"
              @keyup.enter="confirmAdd(level)"
              @keyup.esc="cancelAdd"
              @click.stop
            />
          </template>

          <!-- 添加按钮 -->
          <button
            v-if="level.canAdd && addingLevelKey !== level.key"
            class="inline-flex items-center justify-center w-7 h-7 rounded border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
            @click="addTag(level)"
          >
            <el-icon><Plus /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="px-4 pb-3 text-xs text-gray-400">标签加载中...</div>
    <div class="mx-4 mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 min-h-[28px] leading-5">
      <span class="text-blue-400 mr-1">已选：</span>
      <span v-if="selectionSummary">{{ selectionSummary }}</span>
      <span v-else class="text-blue-300 italic">未选择</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createLabel, deleteLabel, getUserVisibleLabelGroups, topLabel, updateLabel } from '/@/api/material/index'
import { useLayoutStore } from '/@/store/modules/layout'

const layoutStore = useLayoutStore()
const isAdmin = computed(() => layoutStore.getUserInfo.username === 'admin')

const props = withDefaults(defineProps<{
  initialTags?: string[]
}>(), {
  initialTags: () => []
})

const emit = defineEmits<{
  change: [tags: string[]]
}>()

interface ApiTagItem {
  id: number
  name: string
  level: number
  is_public?: boolean
  is_shared?: boolean
  sort?: number
  toTop?: boolean
}

interface TagItem extends ApiTagItem {}

interface TagLevel {
  key: number
  label: string
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
  tags: TagItem[]
}

const loading = ref(false)
const tagLevels = ref<TagLevel[]>([
  { key: 1, label: '1级标签', canAdd: false, canEdit: false, canDelete: false, tags: [] },
  { key: 2, label: '2级标签', canAdd: true, canEdit: true, canDelete: true, tags: [] },
  { key: 3, label: '3级标签', canAdd: true, canEdit: true, canDelete: true, tags: [] },
  { key: 4, label: '4级标签', canAdd: true, canEdit: true, canDelete: true, tags: [] },
])

const selectedMap = ref<Record<number, Set<number>>>({})
const activeTagOutlineStyle = {
  outline: '1px dashed #64748b',
  outlineOffset: '2px'
}

const buildEmptySelectedMap = () => {
  const map: Record<number, Set<number>> = {}
  tagLevels.value.forEach((level) => {
    map[level.key] = new Set<number>()
  })
  return map
}

const initFromTags = (names: string[]) => {
  const nameCount: Record<string, number> = {}
  names.forEach((name) => {
    const n = name.trim()
    if (!n) return
    nameCount[n] = (nameCount[n] || 0) + 1
  })

  const map = buildEmptySelectedMap()
  tagLevels.value.forEach(level => {
    level.tags.forEach(tag => {
      if ((nameCount[tag.name] || 0) > 0) {
        map[level.key].add(tag.id)
        nameCount[tag.name] -= 1
      }
    })
  })
  selectedMap.value = map
}

const getSelectedTags = (): string[] => {
  const names: string[] = []
  tagLevels.value.forEach(level => {
    const ids = selectedMap.value[level.key]
    if (!ids) return
    level.tags.filter(t => ids.has(t.id)).forEach(t => names.push(t.name))
  })
  return names
}

const emitChange = () => {
  emit('change', getSelectedTags())
}

const syncSelection = () => {
  initFromTags(props.initialTags)
  emitChange()
}

const normalizeGroupedData = (grouped: Record<string, ApiTagItem[]>) => {
  const admin = isAdmin.value
  tagLevels.value = [
    { key: 1, label: '1级标签', canAdd: admin, canEdit: admin, canDelete: admin, tags: Array.isArray(grouped['level1']) ? grouped['level1'] : [] },
    { key: 2, label: '2级标签', canAdd: true, canEdit: true, canDelete: true, tags: Array.isArray(grouped['level2']) ? grouped['level2'] : [] },
    { key: 3, label: '3级标签', canAdd: true, canEdit: true, canDelete: true, tags: Array.isArray(grouped['level3']) ? grouped['level3'] : [] },
    { key: 4, label: '4级标签', canAdd: true, canEdit: true, canDelete: true, tags: Array.isArray(grouped['level4']) ? grouped['level4'] : [] },
  ]
}

const fetchLabels = async () => {
  loading.value = true
  try {
    const res = await getUserVisibleLabelGroups()
    const grouped = res.data?.data || {}
    normalizeGroupedData(grouped)
    syncSelection()
  } catch (error) {
    console.error('Failed to fetch labels:', error)
    ElMessage.error('标签列表加载失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.initialTags, () => {
  syncSelection()
}, { immediate: true })

onMounted(() => {
  fetchLabels()
})

const isSelected = (levelKey: number, tagId: number) =>
  selectedMap.value[levelKey]?.has(tagId) ?? false

const isActiveTag = (levelKey: number, tagId: number) =>
  !!activeTag.value && activeTag.value.levelKey === levelKey && activeTag.value.tag.id === tagId

const handleTagClick = (levelKey: number, tag: TagItem) => {
  if (editingTag.value?.levelKey === levelKey && editingTag.value?.id === tag.id) return
  if (!selectedMap.value[levelKey]) selectedMap.value[levelKey] = new Set()
  const set = selectedMap.value[levelKey]
  if (set.has(tag.id)) { set.delete(tag.id) } else { set.add(tag.id) }
  selectedMap.value = { ...selectedMap.value }
  activeTag.value = { levelKey, tag }
  emitChange()
}

const activeTag = ref<{ levelKey: number; tag: TagItem } | null>(null)

const editingTag = ref<{ levelKey: number; id: number } | null>(null)
const editingName = ref('')
const editInputRef = ref<HTMLInputElement[]>([])

const startEdit = (levelKey: number, tag: TagItem) => {
  const level = tagLevels.value.find(l => l.key === levelKey)
  if (!level?.canEdit) return
  editingTag.value = { levelKey, id: tag.id }
  editingName.value = tag.name
  nextTick(() => editInputRef.value?.[0]?.focus())
}

const commitEdit = async (tag: TagItem) => {
  const name = editingName.value.trim()
  if (!name || name === tag.name) {
    cancelEdit()
    return
  }

  try {
    await updateLabel({ id: tag.id, name, level: tag.level })
    tag.name = name
    syncSelection()
    ElMessage.success('标签已更新')
  } catch (error) {
    console.error('Failed to update label:', error)
    ElMessage.error('标签更新失败')
  } finally {
    cancelEdit()
  }
}

const cancelEdit = () => { editingTag.value = null; editingName.value = '' }

const addingLevelKey = ref<number | null>(null)
const addingName = ref('')
const addingInputRef = ref<HTMLInputElement | null>(null)

const addTag = (level: TagLevel) => {
  addingLevelKey.value = level.key
  addingName.value = ''
  nextTick(() => addingInputRef.value?.focus())
}

const confirmAdd = async (level: TagLevel) => {
  const name = addingName.value.trim()
  if (!name) { cancelAdd(); return }
  try {
    await createLabel({ name, level: level.key })
    await fetchLabels()
    ElMessage.success('标签已创建')
  } catch (error: any) {
    const msg = error?.message || '标签创建失败'
    ElMessage.error(msg)
  } finally {
    cancelAdd()
  }
}

const cancelAdd = () => {
  addingLevelKey.value = null
  addingName.value = ''
}

const handleMoveUp = async () => {
  if (!activeTag.value) return
  try {
    await topLabel(activeTag.value.tag.id)
    await fetchLabels()
    ElMessage.success('标签已置顶')
  } catch (error) {
    console.error('Failed to top label:', error)
    ElMessage.error('标签置顶失败')
  }
}

const handleDelete = () => {
  if (!activeTag.value) return
  const { levelKey, tag } = activeTag.value
  ElMessageBox.confirm(
    `删除标签「${tag.name}」后，该标签下资产将归属"未指定"，确认删除？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(async () => {
    try {
      await deleteLabel(tag.id)
      selectedMap.value[levelKey]?.delete(tag.id)
      activeTag.value = null
      await fetchLabels()
      ElMessage.success('已删除')
    } catch (error) {
      console.error('Failed to delete label:', error)
      ElMessage.error('标签删除失败')
    }
  }).catch(() => {})
}

const selectionSummary = computed(() => {
  const parts: string[] = []
  tagLevels.value.forEach(level => {
    const ids = selectedMap.value[level.key]
    if (!ids || ids.size === 0) return
    const names = level.tags.filter(t => ids.has(t.id)).map(t => t.name)
    if (names.length) parts.push(names.join('、'))
  })
  return parts.join(' / ')
})

defineExpose({ getSelectedTags, fetchLabels })
</script>

<style scoped>
input:focus {
  outline: none;
}
</style>
