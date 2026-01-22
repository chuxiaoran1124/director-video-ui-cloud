<template>
  <div class="route-management">
    <div class="toolbar">
      <div class="left">
        <el-input v-model="filter" clearable placeholder="按标题/路径/名称搜索" size="small" style="width:320px">
          <template #prefix>
            <i class="el-icon-search" />
          </template>
        </el-input>
         
          <el-button @click="loadRoutes" size="small">刷新</el-button>
          <el-button @click="expandAll" size="small">展开全部</el-button>
          <el-button @click="collapseAll" type="primary" size="small">折叠全部</el-button>
      </div>
      <div class="right">
         <el-button type="success" size="small" @click="openAdd">新增</el-button>
      </div>
    </div>

    <el-table
      :key="tableKey"
      :data="flatData"
      style="width: 100%; margin-top: 12px"
      row-key="key"
      border
      :tooltip-effect="'dark'"
      size="small"
      stripe
      ref="tableRef"
    >
      <el-table-column prop = "title" label="Title" min-width="320">
      </el-table-column>
      <el-table-column prop="name" label="Name" width="200" />
      <el-table-column prop="path" label="Path" width="320" />

      <el-table-column label="Icon" width="100">
        <template #default="{ row }">
          <component v-if="row.icon" :is="UseElIcon(row.icon)" style="font-size:18px" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="showEdit(row)">编辑</el-button>
          <el-button v-if="!row.children || row.children.length === 0" size="small" type="danger" @click="deleteRouteHandler(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!treeTableData.length" class="empty">暂无路由数据</div>

    <!-- Add Route Dialog -->
    <el-dialog v-model="addDialogVisible" title="新增路由" width="600px">
      <el-form :model="form" :rules="formRules" ref="addFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" placeholder="例如 /dashboard/workplace" />
        </el-form-item>

        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="路由 name，用于路由跳转" />
        </el-form-item>

        <el-form-item label="组件" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件名称" />
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-select v-model="form.icon" placeholder="请选择图标" clearable filterable>
            <el-option v-for="icon in iconOptions" :key="icon" :label="icon" :value="icon">
              <div style="display:flex;align-items:center;gap:8px">
                <component :is="UseElIcon(icon)" />
                <span style="font-size:12px">{{ icon }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAdd">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑路由弹窗 -->
<el-dialog v-model="editDialogVisible" title="编辑路由" width="600px">
  <el-form :model="editForm" :rules="formRules" ref="editFormRef" label-width="80px">
    <el-form-item label="标题" prop="title">
      <el-input v-model="editForm.title" placeholder="请输入标题" />
    </el-form-item>
    <el-form-item label="路径" prop="path">
      <el-input v-model="editForm.path" placeholder="例如 /dashboard/workplace" :disabled="editForm.hasChildren" />
    </el-form-item>
    <el-form-item label="名称" prop="name">
      <el-input v-model="editForm.name" placeholder="路由 name，用于路由跳转" :disabled="editForm.hasChildren" />
    </el-form-item>
    <el-form-item label="组件" prop="component">
      <el-input v-model="editForm.component" placeholder="请输入组件名称" :disabled="editForm.hasChildren" />
    </el-form-item>
    <el-form-item label="图标" prop="icon">
      <el-select v-model="editForm.icon" placeholder="请选择图标" clearable filterable>
        <el-option v-for="icon in iconOptions" :key="icon" :label="icon" :value="icon">
          <div style="display:flex;align-items:center;gap:8px">
            <component :is="UseElIcon(icon)" />
            <span style="font-size:12px">{{ icon }}</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="editDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="submitEdit">确 定</el-button>
  </template>
</el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UseElIcon } from '/@/components/SvnIcon/elIcon'
import { getAllRoute, createRoute, deleteRoute, updateRoute } from '/@/api/system/index'
const editDialogVisible = ref(false)
const editForm = ref({ id: '', title: '', name: '', path: '', icon: '', component: '', hasChildren: false })
const editFormRef = ref<any>(null)
import { listToTree } from '/@/utils/tools'
import * as ElIcons from '@element-plus/icons-vue'

interface INode { key: string; name?: string; path?: string; title?: string; icon?: string; children?: INode[]; level?: number; expanded?: boolean }

const treeTableData = ref<INode[]>([])
const tableKey = ref<number>(1)
const defaultExpand = ref<boolean>(false)
const filter = ref<string>('')
const flatData = ref<INode[]>([])
const tableRef = ref<any>(null)
const addDialogVisible = ref(false)
const form = ref({ title: '', name: '', path: '', icon: '', component: '' })
const addFormRef = ref<any>(null)
const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  component: [{ required: true, message: '请输入组件名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }]
}

// build icon options from element-plus icons
const ElIconsData = ElIcons as unknown as Record<string, any>
const iconOptions = Object.keys(ElIconsData).map(name => {
  // convert PascalCase icon name to kebab-case el-icon-xxx
  const kebab = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  return `el-icon-${kebab}`
})

function buildTreeNodes(data: any[], level = 1): INode[] {
  const mapNode = (item: any, lv = level): INode => {
    const children = item.children && item.children.length ? item.children.map((c: any) => mapNode(c, lv + 1)) : []
    return {
      key: item.id?.toString() || (item.name || item.path || Math.random()).toString(),
      name: item.name,
      path: item.path,
      title: item.meta?.title || item.name || item.path,
      icon: item.meta?.icon,
      children,
      level: lv,
      expanded: false,
    }
  }
  return data.map((d) => mapNode(d, level))
}

async function loadRoutes() {
  try {
    const res = await getAllRoute()
    if (res.data.code === 200) {
      let data = res.data.data as any[]
      if (data.length && !data[0].children) {
        data = listToTree(data, 0)
      }
      treeTableData.value = buildTreeNodes(data)
      // build flat view
      rebuildFlat(treeTableData.value)
      // reset table render key
      tableKey.value++
    }
  } catch (e) {
    console.error(e)
  }
}

// 刷新路由

function expandAll() {
  function setAll(nodes: INode[]) { for (const n of nodes) { n.expanded = true; if (n.children && n.children.length) setAll(n.children) } }
  setAll(treeTableData.value)
  rebuildFlat(treeTableData.value)
}

function collapseAll() {
  function setAll(nodes: INode[]) { for (const n of nodes) { n.expanded = false; if (n.children && n.children.length) setAll(n.children) } }
  setAll(treeTableData.value)
  rebuildFlat(treeTableData.value)
}

function rowStyle(row: INode) {
  const level = row.level || 1
  const base = 96
  const step = 6
  const light = Math.max(20, base - (level - 1) * step)
  return { background: `hsl(210 20% ${light}%)`, padding: '6px 8px', borderRadius: '4px' }
}

// filter tree by keyword (keep ancestors if child matches)
function filterTree(nodes: INode[], kw: string): INode[] {
  if (!kw) return nodes
  const k = kw.toLowerCase()
  const res: INode[] = []
  for (const n of nodes) {
    const title = (n.title || n.name || n.path || '').toLowerCase()
    const children = n.children && n.children.length ? filterTree(n.children, kw) : []
    if (title.includes(k) || children.length) {
      res.push({ ...n, children })
    }
  }
  return res
}

function assignLevels(nodes: INode[], level = 1) {
  for (const n of nodes) {
    n.level = level
    if (n.children && n.children.length) assignLevels(n.children, level + 1)
  }
}

const filteredData = computed(() => {
  const tree = filterTree(treeTableData.value, filter.value)
  // reassign levels after filter
  assignLevels(tree, 1)
  return tree
})
// rebuild flat view when filter changes
watch(filter, (val) => {
  if (!val) {
    rebuildFlat(treeTableData.value)
    return
  }
  const tree = filteredData.value
  function setAll(nodes: INode[]) { for (const n of nodes) { n.expanded = true; if (n.children && n.children.length) setAll(n.children) } }
  setAll(tree)
  rebuildFlat(tree)
})
function rebuildFlat(nodes: INode[]) {
  const out: INode[] = []
  function walk(list: INode[]) {
    for (const n of list) {
      out.push(n)
      if (n.expanded && n.children && n.children.length) {
        walk(n.children)
      }
    }
  }
  walk(nodes)
  flatData.value = out
}

function toggleExpand(row: INode) {
  row.expanded = !row.expanded
  rebuildFlat(filteredData.value.length ? filteredData.value : treeTableData.value)
}

function openAdd() {
  form.value = { title: '', name: '', path: '', icon: '', component: '' }
  addDialogVisible.value = true
}

async function submitAdd() {
  const f = form.value
  try {
    await new Promise<void>((resolve, reject) => {
      addFormRef.value?.validate((valid: boolean) => {
        if (valid) resolve()
        else reject(new Error('验证失败'))
      })
    })
    // 构造后端需要的字段
    const payload = {
      title: f.title,
      name: f.name,
      path: f.path,
      icon: f.icon,
      component: f.component || f.name // 默认用 name 作为 component
    }
    const res = await createRoute(payload)
    if (res.data && res.data.code === 200) {
      ElMessage.success(res.data.message || '新增成功')
      addDialogVisible.value = false
      // 用后端返回的 tree 刷新页面
      if (res.data.data && res.data.data.tree) {
        treeTableData.value = buildTreeNodes(res.data.data.tree)
        rebuildFlat(treeTableData.value)
        tableKey.value++
      } else {
        await loadRoutes()
      }
    } else {
      ElMessage.error(res.data?.message || '新增失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('新增请求出错')
  }
}

function titleCellStyle(row: INode) {
  return { display: 'flex', alignItems: 'center', gap: '8px' }
}

function showDetail(row: INode) {
  // placeholder: 弹窗或侧边面板可在后续实现
  ElMessage.info(`路由: ${row.title || row.path}`)
}

function locateRoute(row: INode) {
  // placeholder: 可以实现高亮或展开到该节点的逻辑
  ElMessage.info(`定位到: ${row.path}`)
}

// 获取所有已展开节点的 path（更稳定）
function getExpandedPaths(nodes: INode[]): string[] {
  const paths: string[] = []
  function walk(list: INode[]) {
    for (const n of list) {
      if (n.expanded && n.path) paths.push(n.path)
      if (n.children && n.children.length) walk(n.children)
    }
  }
  walk(nodes)
  return paths
}

function getVisibleKeys(flat: INode[]): string[] {
  return flat.map(n => n.key)
}

// 根据 path 恢复展开状态，并确保所有祖先节点也被展开
function restoreExpandedByPath(nodes: INode[], expandedPaths: string[]) {
  const expandedSet = new Set(expandedPaths)
  
  function markNodes(list: INode[]): boolean {
    let hasExpanded = false
    for (const n of list) {
      let nodeExpanded = n.path && expandedSet.has(n.path)
      if (n.children && n.children.length) {
        const childExpanded = markNodes(n.children)
        nodeExpanded = nodeExpanded || childExpanded
      }
      n.expanded = nodeExpanded || false
      if (nodeExpanded) hasExpanded = true
    }
    return hasExpanded
  }
  
  markNodes(nodes)
}

function expandAncestors(nodes: INode[], keys: string[]) {
  const keySet = new Set(keys)
  function walk(list: INode[], parentExpanded = false) {
    for (const n of list) {
      // 如果自己或子孙在 keySet，则展开
      let shouldExpand = keySet.has(n.key)
      if (n.children && n.children.length) {
        walk(n.children, shouldExpand)
        // 如果有子节点需要展开，则自己也要展开
        shouldExpand = shouldExpand || n.children.some(child => child.expanded)
      }
      n.expanded = shouldExpand
    }
  }
  walk(nodes)
}

async function deleteRouteHandler(row: INode) {
  try {
    await ElMessageBox.confirm(`确认删除路由：${row.title || row.path} ?`, '提示', { type: 'warning' })
    const res = await deleteRoute(Number(row.key))
    if (res.data && res.data.code === 200) {
      ElMessage.success(res.data.message || '删除成功')
      // 用后端返回的 tree 刷新页面，并根据缓存恢复展开状态
      if (res.data.data && res.data.data.tree) {
        treeTableData.value = buildTreeNodes(res.data.data.tree)
        rebuildFlat(treeTableData.value)
        tableKey.value++
      } else {
        await loadRoutes()
      }
    } else {
      ElMessage.error(res.data?.message || '删除失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '删除请求出错')
  }
}

function showEdit(row: INode) {
  // 打开编辑弹窗并填充数据
  editForm.value = {
    id: row.key,
    title: row.title || '',
    name: row.name || '',
    path: row.path || '',
    icon: row.icon || '',
    component: row.name || '',
    hasChildren: !!(row.children && row.children.length)
  }
  editDialogVisible.value = true
}


async function submitEdit() {
  const f = editForm.value
  try {
    await new Promise<void>((resolve, reject) => {
      editFormRef.value?.validate((valid: boolean) => {
        if (valid) resolve()
        else reject(new Error('验证失败'))
      })
    })
    const payload = {
      title: f.title,
      name: f.name,
      path: f.path,
      icon: f.icon,
      component: f.component || f.name
    }
    const res = await updateRoute(Number(f.id), payload)
    if (res.data && res.data.code === 200) {
      ElMessage.success(res.data.message || '编辑成功')
      editDialogVisible.value = false
      // 用后端返回的 tree 刷新页面并保留展开
      if (res.data.data && res.data.data.tree) {
        treeTableData.value = buildTreeNodes(res.data.data.tree)
        rebuildFlat(treeTableData.value)
        tableKey.value++
      } else {
        await loadRoutes()
      }
    } else {
      ElMessage.error(res.data?.message || '编辑失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message ? e.message : String(e) || '编辑请求出错')
  }
}

loadRoutes()
</script>

<style scoped>
.route-management { padding: 12px 8px }
.toolbar { display:flex; justify-content:space-between; align-items:center; gap:12px }
.toolbar .left { display:flex; align-items:center }
.toolbar .right { display:flex; gap:8px }
.title-text { font-weight:600; color:var(--el-color-text-primary) }
.el-table .cell { padding: 8px 12px }
.el-table .row:hover { background: rgba(16, 142, 233, 0.03) }
.empty { color:#999; padding:12px }
</style>
