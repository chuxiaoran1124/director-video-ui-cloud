<template>
  <div class="user-management">
    <div class="container-box">
      <div class="operation-bar">
        <!-- 左上角：新增和批量删除 -->
        <div class="left-actions">
          <el-button type="primary" @click="openAddDialog">
            + 新增
          </el-button>
          <el-button 
            type="danger" 
            @click="batchDelete"
            :disabled="selectedUsers.length === 0"
          >
            批量删除
          </el-button>
        </div>

        <!-- 右上角：查询和重置 -->
        <div class="right-actions">
          <el-input
            v-model="searchForm.username"
            placeholder="输入用户名查询"
            clearable
            style="width: 200px"
          />
          <el-button @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 用户列表表格 -->
      <el-table
        ref="tableRef"
        :data="userList"
        border
        stripe
        style="width: 100%; margin-top: 12px; flex: 1"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" :index="indexMethod" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="name" label="姓名" width="150" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            {{ getRoleLabel(row.role) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" >
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="180" />
      <el-table-column prop="update_time" label="更新时间" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openEditDialog(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="deleteUser(row)">
            删除
          </el-button>
          <el-button type="primary" size="small" text @click="openPwdDialog(row)">
            修改密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页条 -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" type="email" placeholder="输入邮箱" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="输入电话" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色">
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.description"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="选择状态">
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="pwdDialog.visible"
      :title="`修改密码 - ${pwdDialog.user?.username || ''}`"
      width="420px"
    >
      <el-form label-width="90px">
        <el-form-item label="原密码">
          <el-input v-model="pwdDialog.old_password" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdDialog.new_password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog.visible=false">取消</el-button>
        <el-button type="primary" :loading="pwdDialog.loading" @click="submitChangePwd">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, userUpdate, userDelete, getRoleList, changePassword } from '/@/api/user/index'

interface UserItem {
  user_id: number
  username: string
  email: string
  name: string | null
  phone: string | null
  create_time: string
  update_time: string
  status: string
  role: string
}

interface FormData {
  username: string
  email: string
  name: string
  phone: string
  role: string
  status: string
}

// 角色列表相关
interface RoleItem {
  id: number
  name: string
  description: string
}
const roleOptions = ref<RoleItem[]>([])
const roleLabelMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  roleOptions.value.forEach((r) => {
    map[r.name] = r.description
  })
  return map
})

// =============== 表格相关 ===============
const userList = ref<UserItem[]>([])
function getRoleLabel(name: string) {
  return roleLabelMap.value[name] || name
}

const tableRef = ref<any>(null)
const selectedUsers = ref<UserItem[]>([])

// 修改密码弹窗
const pwdDialog = ref<{ visible: boolean; loading: boolean; user: UserItem | null; old_password: string; new_password: string }>(
  { visible: false, loading: false, user: null, old_password: '', new_password: '' }
)

// =============== 分页相关 ===============
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

function handleSelectionChange(selection: UserItem[]) {
  selectedUsers.value = selection
}

function handlePageChange(page: number) {
  pagination.current = page
  loadUserList()
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  loadUserList()
}

// =============== 搜索相关 ===============
const searchForm = reactive({
  username: ''
})

async function handleSearch() {
  pagination.current = 1
  try {
  const res = await getUserList({
      username: searchForm.username,
      page: pagination.current,
      page_size: pagination.pageSize
    })
    if (res.data.code === 200) {
      userList.value = res.data.data.data
      pagination.total = res.data.data.total
      ElMessage.success('查询成功')
    }
  } catch (e) {
    console.error('查询用户列表失败：', e)
    ElMessage.error('查询用户列表失败')
  }
}

function handleReset() {
  searchForm.username = ''
  pagination.current = 1
  loadUserList()
}

// =============== 加载用户列表 ===============
async function loadUserList() {
  try {
  const res = await getUserList({
      username: searchForm.username,
      page: pagination.current,
      page_size: pagination.pageSize
    })
    if (res.data.code === 200) {
      userList.value = res.data.data.data
      pagination.total = res.data.data.total
    }
  } catch (e) {
    console.error('加载用户列表失败：', e)
    ElMessage.error('加载用户列表失败')
  }
}

// 表格序号（全局序号：受分页影响）
function indexMethod(index: number) {
  return (pagination.current - 1) * pagination.pageSize + index + 1
}

// =============== 对话框相关 ===============
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditId = ref<number | null>(null)
const formRef = ref<any>(null)

const formData = reactive<FormData>({
  username: '',
  email: '',
  name: '',
  phone: '',
  role: '',
  status: 'active'
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  phone: [
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback()
          return
        }
        // 手机号/座机号正则
        const mobileReg = /^1[3-9]\d{9}$/
        const telReg = /^0\d{2,3}-?\d{7,8}$/
        if (mobileReg.test(value) || telReg.test(value)) {
          callback()
        } else {
          callback(new Error('电话号码格式不正确'))
        }
      },
      trigger: 'blur'
    }
  ]
}

async function loadRoleList() {
  try {
    const res = await getRoleList()
    if (res.data.code === 200) {
      roleOptions.value = res.data.data
    }
  } catch (e) {
    ElMessage.error('获取角色列表失败')
  }
}

function openAddDialog() {
  isEditMode.value = false
  currentEditId.value = null
  Object.assign(formData, {
    username: '',
    email: '',
    name: '',
    phone: '',
    role: '',
    status: 'active'
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
  loadRoleList()
}

function openEditDialog(row: UserItem) {
  isEditMode.value = true
  currentEditId.value = row.user_id
  Object.assign(formData, {
    username: row.username,
    email: row.email,
    name: row.name || '',
    phone: row.phone || '',
    role: row.role,
    status: row.status
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
  loadRoleList()
}

async function submitForm() {
  try {
    await formRef.value?.validate()
    
    if (isEditMode.value) {
      // 编辑模式
      const res = await userUpdate({
        user_id: currentEditId.value,
        ...formData
      })
      if (res.data.code === 200) {
        ElMessage.success('用户编辑成功')
        dialogVisible.value = false
        loadUserList()
      }
    } else {
      // 新增模式
      const res = await createUser(formData)
      if (res.data.code === 200) {
        ElMessage.success('用户创建成功，默认密码为123456，如需修改请登录后前往个人中心修改')
        dialogVisible.value = false
        loadUserList()
      }
    }
  } catch (e) {
    console.error('保存用户失败：', e)
  }
}

// =============== 删除相关 ===============
function deleteUser(row: UserItem) {
  ElMessageBox.confirm(
    `确定删除用户 "${row.username}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const res = await userDelete({ user_id: row.user_id })
        if (res.data.code === 200) {
          ElMessage.success('用户删除成功')
          loadUserList()
        }
      } catch (e) {
        console.error('删除用户失败：', e)
        ElMessage.error('删除用户失败')
      }
    })
    .catch(() => {
      ElMessage.info('删除已取消')
    })
}

function batchDelete() {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }

  ElMessageBox.confirm(
    `确定批量删除选中的 ${selectedUsers.value.length} 个用户吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const userIds = selectedUsers.value.map(u => u.user_id)
        const res = await userDelete({ user_ids: userIds })
        if (res.data.code === 200) {
          ElMessage.success('批量删除成功')
          tableRef.value?.clearSelection()
          loadUserList()
        }
      } catch (e) {
        console.error('批量删除失败：', e)
        ElMessage.error('批量删除失败')
      }
    })
    .catch(() => {
      ElMessage.info('删除已取消')
    })
}

// =============== 修改密码相关 ===============
function openPwdDialog(row: UserItem) {
  pwdDialog.value.visible = true
  pwdDialog.value.user = row
  pwdDialog.value.old_password = ''
  pwdDialog.value.new_password = ''
}

async function submitChangePwd() {
  const d = pwdDialog.value
  if (!d.user) return
  if (!d.old_password || !d.new_password) {
    ElMessage.error('请填写原密码和新密码')
    return
  }
  try {
    d.loading = true
    const res = await changePassword({
      user_id: d.user.user_id,
      old_password: d.old_password,
      new_password: d.new_password
    })
    if (res?.data?.code === 200) {
      ElMessage.success(res?.data?.message || '密码修改成功')
      d.visible = false
    } else {
      ElMessage.error(res?.data?.message || '修改失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '请求失败')
  } finally {
    d.loading = false
  }
}

// =============== 初始化 ===============
loadRoleList()
loadUserList()
</script>

<style scoped>
.user-management {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container-box {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.left-actions {
  display: flex;
  gap: 8px;
}

.right-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

:deep(.el-table) {
  flex: 1;
}
</style>
