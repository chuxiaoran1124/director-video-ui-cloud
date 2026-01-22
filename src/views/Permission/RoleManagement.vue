<template>
  <div class="role-management">
    <div class="container">
      <!-- 左侧：角色树 -->
      <div class="left-panel">
        <div class="panel-header">角色列表</div>
        <el-tree
          :data="roleTreeData"
          :props="roleTreeProps"
          @node-click="handleRoleClick"
          default-expand-all
        />
      </div>

      <!-- 右侧：权限配置 -->
      <div class="right-panel">
        <div class="panel-header">
          <div class="header-content">
            <span>{{ selectedRole?.name }} - 菜单权限配置</span>
            <el-button 
              v-if="selectedRole" 
              type="primary" 
              size="small" 
              @click="savePermissions"
            >
              保存
            </el-button>
          </div>
        </div>

        <!-- 权限树形表格 -->
        <el-table
          ref="tableRef"
          :data="menuTableData"
          :tree-props="treeProps"
          row-key="id"
          default-expand-all
          style="width: 100%"
          size="small"
          border
          @select="handleSelectionChange"
          @select-all="handleSelectAll"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="菜单名称" min-width="200" />
          <el-table-column prop="path" label="路径" width="250" />
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column label="图标" width="100">
            <template #default="{ row }">
              <component v-if="row.icon" :is="UseElIcon(row.icon)" style="font-size:18px" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UseElIcon } from '/@/components/SvnIcon/elIcon'
import { getAllRoute, getRoleList, getRoleRoutePermissions, updateRoleRoutePermissions } from '/@/api/system/index'

// =============== 接口和类型定义 ===============
interface MenuNode {
  id: number | string
  title: string
  name?: string
  path?: string
  icon?: string
  children?: MenuNode[]
}

interface RoleNode {
  id: number | string
  name: string
  description?: string
  label?: string
}

// =============== 左侧：角色树 ===============
const roleTreeData = ref<RoleNode[]>([])

const roleTreeProps = {
  children: 'children',
  label: (data: RoleNode) => `${data.description}(${data.name})`
}

const selectedRole = ref<RoleNode | null>(null)

async function handleRoleClick(node: RoleNode) {
  selectedRole.value = node
  console.log('选中角色：', node)
  
  // 首次选择角色时加载菜单数据
  if (!menuDataLoaded.value) {
    await loadMenuData()
    menuDataLoaded.value = true
  }
  
  // 清空选中状态
  selectedRowIds.value.clear()
  
  // 加载该角色的权限配置
  try {
    const res = await getRoleRoutePermissions(node.id as number)
    if (res.data.code === 200) {
      const permissions = res.data.data as any[]
      
      // 构建 route_id 到 permissions 的映射
      const permissionMap = new Map<number, number[]>()
      permissions.forEach(item => {
        permissionMap.set(item.route_id, item.permissions || [])
      })
      
      // 清空所有勾选
      tableRef.value?.clearSelection()
      
      // 根据权限数据勾选对应的菜单项
      const checkedRows = getAllRowsWithRouteIds(menuTableData.value, new Set(permissionMap.keys()))
      checkedRows.forEach(row => {
        tableRef.value?.toggleRowSelection(row, true)
        selectedRowIds.value.add(row.id)
      })
      
      console.log('权限加载完成，权限映射：', permissionMap)
    }
  } catch (e) {
    console.error('加载角色权限配置失败：', e)
    ElMessage.error('加载角色权限配置失败')
  }
}

// 递归获取所有路由ID在权限集合中的行
function getAllRowsWithRouteIds(data: MenuNode[], routeIdSet: Set<number | string>): MenuNode[] {
  const rows: MenuNode[] = []
  
  function traverse(items: MenuNode[]) {
    items.forEach(item => {
      if (routeIdSet.has(item.id)) {
        rows.push(item)
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  
  traverse(data)
  return rows
}

// 处理单个行的选择变化
function handleSelectionChange(selection: any[], row: MenuNode) {
  const isSelected = selection.some(item => item.id === row.id)
  
  // 更新选中状态记录
  if (isSelected) {
    selectedRowIds.value.add(row.id)
  } else {
    selectedRowIds.value.delete(row.id)
  }
  
  // 如果有子节点，也选中或取消子节点
  if (row.children && row.children.length > 0) {
    toggleChildrenSelection(row.children, isSelected)
  }
}

// 处理全选
function handleSelectAll(selection: any[]) {
  // 清空之前的选中状态
  selectedRowIds.value.clear()
  
  // 全选时，选中所有子节点
  if (selection.length > 0) {
    flattenAllChildren(menuTableData.value).forEach(node => {
      selectedRowIds.value.add(node.id)
      if (!selection.includes(node)) {
        tableRef.value?.toggleRowSelection(node, true)
      }
    })
  }
}

// 递归选中/取消子节点
function toggleChildrenSelection(children: MenuNode[], isSelected: boolean) {
  children.forEach(child => {
    tableRef.value?.toggleRowSelection(child, isSelected)
    
    // 更新选中状态记录
    if (isSelected) {
      selectedRowIds.value.add(child.id)
    } else {
      selectedRowIds.value.delete(child.id)
    }
    
    if (child.children && child.children.length > 0) {
      toggleChildrenSelection(child.children, isSelected)
    }
  })
}

// 平铺所有子节点
function flattenAllChildren(data: MenuNode[]): MenuNode[] {
  const result: MenuNode[] = []
  
  function traverse(items: MenuNode[]) {
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  
  traverse(data)
  return result
}

// 保存权限配置
async function savePermissions() {
  if (!selectedRole.value) {
    ElMessage.warning('请先选择一个角色')
    return
  }
  
  try {
    // 使用记录的选中状态
    const routeIds = Array.from(selectedRowIds.value)
    
    // 构建请求数据
    const requestData = {
      permissions: [
        {
          roleId: selectedRole.value.id,
          routeId: routeIds
        }
      ]
    }
    
    console.log('保存权限数据：', requestData)
    
    const res = await updateRoleRoutePermissions(requestData)
    
    if (res.data.code === 200) {
      ElMessage.success(res.data.message || '权限保存成功')
    } else {
      ElMessage.error(res.data.message || '权限保存失败')
    }
  } catch (e) {
    console.error('保存权限配置失败：', e)
    ElMessage.error('保存权限配置失败')
  }
}

// =============== 右侧：权限树形表格 ===============
const treeProps = ref({
  children: 'children',
  hasChildren: 'hasChildren',
  checkStrictly: false,
})

const menuTableData = ref<MenuNode[]>([])

// 树形表格的勾选框配置
const tableRef = ref<any>(null)

// 存储当前选中的行ID
const selectedRowIds = ref<Set<number | string>>(new Set())

// 菜单数据是否已加载
const menuDataLoaded = ref(false)

// =============== 加载角色数据 ===============
async function loadRoleData() {
  try {
    const res = await getRoleList()
    if (res.data.code === 200) {
      roleTreeData.value = res.data.data as RoleNode[]
      console.log('角色数据加载完成：', roleTreeData.value)
    }
  } catch (e) {
    console.error('加载角色数据失败：', e)
    ElMessage.error('加载角色数据失败')
  }
}

// =============== 加载菜单数据 ===============
async function loadMenuData() {
  try {
    const res = await getAllRoute()
    if (res.data.code === 200) {
      let data = res.data.data as any[]
      // 根据 parent_id 构建树形结构
      menuTableData.value = buildTreeByParent(data)
      console.log('菜单数据加载完成：', menuTableData.value)
    }
  } catch (e) {
    console.error('加载菜单数据失败：', e)
    ElMessage.error('加载菜单数据失败')
  }
}

// 根据 parent_id 构建树形结构（从平坦数组构建）
function buildTreeByParent(items: any[]): MenuNode[] {
  // 创建 id 到节点的映射
  const nodeMap = new Map<number | string, MenuNode>()
  
  // 第一步：将所有项转换为 MenuNode 并存储在 map 中
  items.forEach(item => {
    const node: MenuNode = {
      id: item.id,
      title: item.meta?.title || item.name,
      name: item.name,
      path: item.path,
      icon: item.meta?.icon,
      children: []
    }
    nodeMap.set(item.id, node)
  })
  
  // 第二步：建立父子关系
  const rootNodes: MenuNode[] = []
  
  items.forEach(item => {
    const node = nodeMap.get(item.id)!
    
    if (item.parentId === null || item.parentId === undefined || item.parentId === 0) {
      // 这是一个根节点
      rootNodes.push(node)
    } else {
      // 这是一个子节点，添加到父节点的 children 中
      const parentNode = nodeMap.get(item.parentId)
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = []
        }
        parentNode.children.push(node)
      } else {
        // 如果找不到父节点，也作为根节点
        rootNodes.push(node)
      }
    }
  })
  
  console.log('树形数据结构：', rootNodes)
  return rootNodes
}

// =============== 初始化 ===============
loadRoleData()
// 菜单数据在选择角色时加载
</script>

<style scoped>
.role-management {
  padding: 12px;
  height: 100%;
}

.container {
  display: flex;
  gap: 12px;
  height: calc(100vh - 120px);
}

.left-panel {
  width: 20%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-y: auto;
  background: #fff;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.panel-header {
  padding: 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #ddd;
  font-weight: 600;
  color: #333;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-panel ::v-deep(.el-table) {
  flex: 1;
}

.right-panel ::v-deep(.el-table__body-wrapper) {
  overflow-y: auto;
}
</style>
