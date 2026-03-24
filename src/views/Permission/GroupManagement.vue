<template>
  <div class="page-group-management p-6 bg-gray-50 min-h-full">
    <!-- 分组列表 -->
    <div class="max-w-[1400px] mx-auto">
      <!-- 顶部标题和操作 -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-800">分组管理</h2>
          <p class="text-xs text-gray-400 mt-1">创建和管理分组，分配分组成员及权限</p>
        </div>
        <el-button type="primary" size="large" @click="handleCreateGroup">
          <el-icon class="mr-2"><el-icon-plus /></el-icon>
          新建分组
        </el-button>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- 左侧：分组列表 -->
        <div class="col-span-1">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 class="text-base font-bold text-gray-800 mb-4">分组列表</h3>
            
            <!-- 搜索 -->
            <div class="mb-4">
              <el-input 
                v-model="searchKeyword" 
                placeholder="搜索分组..." 
                clearable
                @input="handleSearch"
                class="search-box"
              >
                <template #suffix>
                  <el-icon class="text-gray-400"><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <!-- 分组列表 -->
            <div class="flex-1 overflow-y-auto">
              <div v-if="groupList.length === 0" class="text-center text-gray-400 py-8">
                <el-empty description="暂无分组数据" />
              </div>
              
              <template v-else>
                <template v-for="group in filteredGroupList" :key="group.id">
                  <div 
                    class="p-4 mb-3 rounded-lg border-2 cursor-pointer transition-all"
                    :class="selectedGroup?.id === group.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'"
                    @click="selectGroup(group)"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="font-bold text-gray-800">{{ group.groupName }}</div>
                        <div class="text-xs text-gray-400 mt-1">{{ group.description || '无描述' }}</div>
                        <div class="text-xs text-gray-500 mt-2">成员数：{{ group.memberCount || 0 }}</div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- 右侧：分组详情和成员列表 -->
        <div class="col-span-2">
          <div v-if="selectedGroup" class="space-y-6">
            <!-- 分组详情 -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-base font-bold text-gray-800">分组详情</h3>
                <div class="flex gap-2">
                  <el-button type="primary" size="small" plain @click="handleEditGroup">编辑</el-button>
                  <el-button type="danger" size="small" plain @click="handleDeleteGroup">删除</el-button>
                </div>
              </div>

              <el-form :model="selectedGroup" label-width="100px">
                <el-form-item label="分组名称">
                  <div class="text-gray-800 font-bold">{{ selectedGroup.groupName }}</div>
                </el-form-item>
                <el-form-item label="描述">
                  <div class="text-gray-700">{{ selectedGroup.description || '无描述' }}</div>
                </el-form-item>
                <el-form-item label="成员数">
                  <div class="text-gray-700">{{ selectedGroup.memberCount || 0 }} 人</div>
                </el-form-item>
                <el-form-item label="创建时间">
                  <div class="text-gray-700">{{ selectedGroup.createdAt || '-' }}</div>
                </el-form-item>
              </el-form>
            </div>

            <!-- 分组成员列表 -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold text-gray-800">分组成员（{{ memberList.length }}）</h3>
                <el-button type="primary" size="small" @click="handleAddMember">添加成员</el-button>
              </div>

              <!-- 成员搜索 -->
              <div class="mb-4">
                <el-input 
                  v-model="memberSearchKeyword" 
                  placeholder="搜索成员..." 
                  clearable
                  @input="handleMemberSearch"
                  class="search-box"
                >
                  <template #suffix>
                    <el-icon class="text-gray-400"><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <el-table :data="memberList" border style="width: 100%">
                <el-table-column label="用户名" prop="username" min-width="120" />
                <el-table-column label="姓名" prop="name" min-width="120" />
                <el-table-column label="权限等级" min-width="120" align="center">
                  <template #default="scope">
                    <el-tag :type="scope.row.role === 'admin' || scope.row.role === '2' ? 'danger' : 'info'">
                      {{ scope.row.role === 'admin' || scope.row.role === '2' ? '可管理' : '只读' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="加入时间" prop="joinedAt" min-width="160" />
                <el-table-column label="操作" min-width="80" align="center" fixed="right">
                  <template #default="scope">
                    <el-button type="danger" size="small" plain @click="handleRemoveMember(scope.row)">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div v-if="memberList.length === 0" class="text-center text-gray-400 py-8">
                <el-empty description="暂无成员" />
              </div>
            </div>
          </div>

          <div v-else class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex items-center justify-center min-h-[500px]">
            <div class="text-center">
              <el-empty description="请选择一个分组查看详情" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑分组对话框 -->
    <el-dialog 
      v-model="groupFormVisible" 
      :title="groupFormMode === 'create' ? '新建分组' : '编辑分组'"
      width="500px"
      @close="resetGroupForm"
    >
      <el-form :model="groupForm" label-width="100px">
        <el-form-item label="分组名称" required>
          <el-input 
            v-model="groupForm.groupName" 
            placeholder="输入分组名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="groupForm.description" 
            type="textarea"
            :rows="3"
            placeholder="输入分组描述"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGroupForm">
            {{ groupFormMode === 'create' ? '创建' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog 
      v-model="addMemberFormVisible" 
      title="添加分组成员"
      width="500px"
      @close="resetAddMemberForm"
    >
      <el-form :model="addMemberForm" label-width="100px">
        <el-form-item label="选择用户" required>
          <el-select 
            v-model="addMemberForm.userId" 
            placeholder="选择要添加的用户"
            clearable
            filterable
            :loading="userSearchLoading"
            @visible-change="(visible) => visible && !userList.length && searchUsers('')"
          >
            <el-option 
              v-for="user in userList"
              :key="user.userId"
              :label="`${user.name}(${user.username})`"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addMemberFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddMember">添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import * as groupApi from '/@/api/system/group'

interface IGroup {
  id?: number | string
  groupName: string
  groupCode?: string
  description?: string
  memberCount?: number
  createdAt?: string
  updatedAt?: string
}

interface IMember {
  userId: number | string
  username: string
  name: string
  email: string
  role: '1' | '2' | 'admin'
  joinedAt?: string
}

interface IUser {
  userId: number | string
  username: string
  name: string
  email: string
}

// 分组列表相关
const groupList = ref<IGroup[]>([])
const selectedGroup = ref<IGroup | null>(null)
const searchKeyword = ref('')
const searchGroupList = ref<IGroup[]>([])
const isSearching = ref(false)
const groupFormVisible = ref(false)
const groupFormMode = ref<'create' | 'edit'>('create')
const groupForm = ref<IGroup>({
  groupName: '',
  description: ''
})

// 成员列表相关
const memberList = ref<IMember[]>([])
const originalMemberList = ref<IMember[]>([])
const memberSearchKeyword = ref('')
const addMemberFormVisible = ref(false)
const addMemberForm = ref({
  userId: '',
  role: '1'
})
const userList = ref<IUser[]>([])
const userSearchLoading = ref(false)

// 计算过滤后的分组列表
const filteredGroupList = computed(() => {
  if (isSearching.value) {
    return searchGroupList.value
  }
  return groupList.value
})

// 搜索分组
const handleSearch = async () => {
  try {
    if (!searchKeyword.value) {
      // 搜索框清空时，清空搜索结果以显示全部
      searchGroupList.value = []
      isSearching.value = false
      return
    }
    
    isSearching.value = true
    const res = await groupApi.getGroupsPaginate(1, 100, {
      group_name: searchKeyword.value
    })
    console.log('完整响应:', res.data)
    
    if (res.data.code === 200) {
      // 数据在 res.data.data.data 中
      const dataList = res.data.data?.data || []
      console.log('处理后的数据列表:', dataList)
      
      searchGroupList.value = dataList.map((g: any) => ({
        id: g.id,
        groupName: g.group_name,
        groupCode: g.group_code,
        description: g.msg,
        memberCount: g.number,
        createdAt: g.create_time,
        updatedAt: g.update_time
      }))
      
      console.log('最终搜索结果:', searchGroupList.value)
    } else {
      ElMessage.error(res.data.msg || '搜索失败')
      searchGroupList.value = []
    }
  } catch (error: any) {
    console.error('搜索错误:', error)
    ElMessage.error(error.message || '搜索失败')
    searchGroupList.value = []
  }
}

// 搜索成员
const handleMemberSearch = async () => {
  if (!selectedGroup.value) return
  
  try {
    if (!memberSearchKeyword.value) {
      // 如果清空，恢复所有成员
      memberList.value = [...originalMemberList.value]
      return
    }
    
    // 基于原始列表过滤搜索成员
    memberList.value = originalMemberList.value.filter(member =>
      member.username?.toLowerCase().includes(memberSearchKeyword.value.toLowerCase()) ||
      member.name?.toLowerCase().includes(memberSearchKeyword.value.toLowerCase())
    )
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
  }
}

// 选择分组
const selectGroup = (group: IGroup) => {
  selectedGroup.value = group
  loadMemberList()
}

// 新建分组
const handleCreateGroup = () => {
  groupFormMode.value = 'create'
  resetGroupForm()
  groupFormVisible.value = true
}

// 编辑分组
const handleEditGroup = () => {
  if (!selectedGroup.value) return
  groupFormMode.value = 'edit'
  groupForm.value = {
    groupName: selectedGroup.value.groupName,
    groupCode: selectedGroup.value.groupCode,
    description: selectedGroup.value.description
  }
  groupFormVisible.value = true
}

// 删除分组
const handleDeleteGroup = async () => {
  if (!selectedGroup.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定删除分组 "${selectedGroup.value.groupName}" 吗？删除后无法恢复。`,
      '删除分组',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    const res = await groupApi.deleteGroup(selectedGroup.value.id as number)
    if (res.data.code === 200) {
      ElMessage.success('分组已删除')
      groupList.value = groupList.value.filter(g => g.id !== selectedGroup.value?.id)
      selectedGroup.value = null
      memberList.value = []
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 提交分组表单
const submitGroupForm = async () => {
  if (!groupForm.value.groupName) {
    ElMessage.warning('请输入分组名称')
    return
  }

  try {
    if (groupFormMode.value === 'create') {
      // 创建分组（分组编码由后端自动生成）
      const res = await groupApi.createGroup({
        groupName: groupForm.value.groupName,
        groupCode: '',
        msg: groupForm.value.description,
        number: 0
      })
      
      if (res.data.code === 200) {
        const newGroup: IGroup = {
          id: res.data.data.id,
          groupName: res.data.data.group_name,
          groupCode: res.data.data.group_code,
          description: res.data.data.msg,
          memberCount: res.data.data.number,
          createdAt: res.data.data.create_time
        }
        
        groupList.value.push(newGroup)
        ElMessage.success('分组创建成功')
      } else {
        ElMessage.error(res.data.msg || '创建失败')
      }
    } else {
      // 编辑分组
      const res = await groupApi.updateGroup(selectedGroup.value?.id as number, {
        groupName: groupForm.value.groupName,
        msg: groupForm.value.description
      })
      
      if (res.data.code === 200) {
        const index = groupList.value.findIndex(g => g.id === selectedGroup.value?.id)
        if (index > -1) {
          groupList.value[index] = {
            ...groupList.value[index],
            groupName: res.data.data.group_name,
            description: res.data.data.msg,
            updatedAt: res.data.data.update_time
          }
          selectedGroup.value = groupList.value[index]
        }
        ElMessage.success('分组已更新')
      } else {
        ElMessage.error(res.data.msg || '更新失败')
      }
    }
    
    groupFormVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 重置分组表单
const resetGroupForm = () => {
  groupForm.value = {
    groupName: '',
    description: ''
  }
}

// 加载成员列表
const loadMemberList = async () => {
  if (!selectedGroup.value) return
  
  try {
    const res = await groupApi.getGroupPersonsByGroupId(selectedGroup.value.id as number)
    if (res.data.code === 200) {
      const dataList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.list || [])
      const memberData = dataList.map((m: any) => ({
        userId: m.id,
        username: m.user_name,
        name: m.person_name,
        email: m.user_name || '',
        role: m.role || 'viewer',
        joinedAt: m.create_time
      }))
      memberList.value = memberData
      originalMemberList.value = [...memberData]
      memberSearchKeyword.value = ''
    } else {
      ElMessage.error(res.data.msg || '加载成员失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载成员失败')
  }
}

// 添加成员
const handleAddMember = () => {
  addMemberFormVisible.value = true
  resetAddMemberForm()
  // 打开对话框时自动加载所有成员
  searchUsers('')
}

// 搜索用户
const searchUsers = async (query: string) => {
  userSearchLoading.value = true
  
  try {
    const res = await groupApi.searchUsers(query)
    if (res.data.code === 200) {
      userList.value = res.data.data.map((u: any) => ({
        userId: u.user_id,
        username: u.username,
        name: u.name,
        email: u.email || ''
      }))
    } else {
      ElMessage.error(res.data.msg || '搜索失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
  } finally {
    userSearchLoading.value = false
  }
}

// 提交添加成员
const submitAddMember = async () => {
  if (!addMemberForm.value.userId) {
    ElMessage.warning('请选择用户')
    return
  }

  if (!selectedGroup.value) return

  try {
    const selectedMember = userList.value.find(u => u.userId === addMemberForm.value.userId)
    if (selectedMember) {
      const res = await groupApi.createGroupPerson({
        groupId: selectedGroup.value.id as number,
        personName: selectedMember.name,
        userName: selectedMember.username as string,
        userId: selectedMember.userId,
        role: '1'
      })
      
      if (res.data.code === 200) {
        const newMember = {
          userId: res.data.data.id,
          username: res.data.data.user_name || selectedMember.username,
          name: res.data.data.person_name || selectedMember.name,
          email: selectedMember.email || '',
          role: res.data.data.role || '1',
          joinedAt: res.data.data.create_time
        }
        memberList.value.push(newMember)
        originalMemberList.value.push(newMember)
        
        if (selectedGroup.value) {
          selectedGroup.value.memberCount = (selectedGroup.value.memberCount || 0) + 1
        }
        
        ElMessage.success('成员添加成功')
        addMemberFormVisible.value = false
      } else {
        ElMessage.error(res.data.msg || '添加失败')
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  }
}

// 移除成员
const handleRemoveMember = async (member: IMember) => {
  try {
    await ElMessageBox.confirm(
      `确定从分组中移除 "${member.name}" 吗？`,
      '移除成员',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    const res = await groupApi.deleteGroupPerson(member.userId as number)
    if (res.data.code === 200) {
      memberList.value = memberList.value.filter(m => m.userId !== member.userId)
      originalMemberList.value = originalMemberList.value.filter(m => m.userId !== member.userId)
      
      if (selectedGroup.value) {
        selectedGroup.value.memberCount = Math.max(0, (selectedGroup.value.memberCount || 1) - 1)
      }
      ElMessage.success('成员已移除')
    } else {
      ElMessage.error(res.data.msg || '移除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '移除失败')
    }
  }
}

// 修改成员权限
const handleRoleChange = async (member: IMember) => {
  try {
    const res = await groupApi.updateGroupPerson(member.userId as number, {
      role: member.role
    })
    
    if (res.data.code === 200) {
      ElMessage.success('权限已更新')
    } else {
      ElMessage.error(res.data.msg || '更新失败')
      // 重新加载成员列表
      await loadMemberList()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
    // 重新加载成员列表
    await loadMemberList()
  }
}

// 重置添加成员表单
const resetAddMemberForm = () => {
  addMemberForm.value = {
    userId: '',
    role: '1'
  }
  userList.value = []
}

// 加载初始数据
onMounted(async () => {
  try {
    const res = await groupApi.getAllGroups()
    if (res.data.code === 200) {
      groupList.value = res.data.data.map((g: any) => ({
        id: g.id,
        groupName: g.group_name,
        groupCode: g.group_code,
        description: g.msg,
        memberCount: g.number,
        createdAt: g.create_time,
        updatedAt: g.update_time
      }))
    } else {
      ElMessage.error(res.data.msg || '加载分组失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载分组失败')
    // 如果加载失败，使用空列表
    groupList.value = []
  }
})
</script>

<style scoped>
.page-group-management {
  --el-fill-color-light: #f5f7fa;
}

.search-box :deep(.el-input__suffix) {
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: text;
}

.search-box :deep(.el-input__suffix-inner) {
  display: flex;
  align-items: center;
}
</style>
