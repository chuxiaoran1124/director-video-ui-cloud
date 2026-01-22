<template>
  <div class="role-page">
    <div class="container-box">
      <div class="operation-bar">
        <el-button type="primary" @click="openAddDialog">+ 新增角色</el-button>
        <el-button type="danger" @click="batchDelete" :disabled="selectedRoles.length === 0">批量删除</el-button>
      </div>
      <el-table
        ref="tableRef"
        :data="roleList"
        border
        stripe
        style="width: 100%; margin-top: 12px;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="角色ID" width="100" />
        <el-table-column prop="name" label="角色英文名" width="150" />
        <el-table-column prop="description" label="角色描述" min-width="200" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
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
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑角色' : '新增角色'" width="400px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="角色英文名" prop="name">
          <el-input v-model="formData.name" placeholder="输入英文名" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="formData.description" placeholder="输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 假设API如下，实际请替换为你的接口
// import { getRoleList, createRole, updateRole, deleteRole } from '/@/api/role/index'

interface RoleItem {
  id: number
  name: string
  description: string
}

const roleList = ref<RoleItem[]>([])
const tableRef = ref<any>(null)
const selectedRoles = ref<RoleItem[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

function handleSelectionChange(selection: RoleItem[]) {
  selectedRoles.value = selection
}
function handlePageChange(page: number) {
  pagination.current = page
  loadRoleList()
}
function handlePageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  loadRoleList()
}

// =============== 对话框相关 ===============
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentEditId = ref<number | null>(null)
const formRef = ref<any>(null)
const formData = reactive({ name: '', description: '' })
const formRules = {
  name: [{ required: true, message: '请输入英文名', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

function openAddDialog() {
  isEditMode.value = false
  currentEditId.value = null
  formData.name = ''
  formData.description = ''
  formRef.value?.clearValidate()
  dialogVisible.value = true
}
function openEditDialog(row: RoleItem) {
  isEditMode.value = true
  currentEditId.value = row.id
  formData.name = row.name
  formData.description = row.description
  formRef.value?.clearValidate()
  dialogVisible.value = true
}
async function submitForm() {
  await formRef.value?.validate()
  if (isEditMode.value) {
    // await updateRole({ id: currentEditId.value, ...formData })
    ElMessage.success('角色编辑成功（请接入API）')
  } else {
    // await createRole(formData)
    ElMessage.success('角色新增成功（请接入API）')
  }
  dialogVisible.value = false
  loadRoleList()
}
function deleteRole(row: RoleItem) {
  ElMessageBox.confirm(`确定删除角色 "${row.name}" 吗？`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  })
    .then(async () => {
      // await deleteRole(row.id)
      ElMessage.success('角色删除成功（请接入API）')
      loadRoleList()
    })
    .catch(() => {
      ElMessage.info('删除已取消')
    })
}
function batchDelete() {
  if (selectedRoles.value.length === 0) {
    ElMessage.warning('请先选择要删除的角色')
    return
  }
  ElMessageBox.confirm(`确定批量删除选中的 ${selectedRoles.value.length} 个角色吗？`, '批量删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  })
    .then(async () => {
      // await deleteRole({ ids: selectedRoles.value.map(r => r.id) })
      ElMessage.success('批量删除成功（请接入API）')
      tableRef.value?.clearSelection()
      loadRoleList()
    })
    .catch(() => {
      ElMessage.info('删除已取消')
    })
}
async function loadRoleList() {
  // const res = await getRoleList({ page: pagination.current, page_size: pagination.pageSize })
  // roleList.value = res.data.data
  // pagination.total = res.data.total
  // DEMO数据
  roleList.value = [
    { id: 1, name: 'admin', description: '管理员' },
    { id: 2, name: 'user', description: '普通用户' },
    { id: 3, name: 'test', description: '测试人员' },
    { id: 4, name: 'dev', description: '开发人员' }
  ]
  pagination.total = 4
}
loadRoleList()
</script>

<style scoped>
.role-page {
  padding: 12px;
  height: 100%;
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
  gap: 8px;
  margin-bottom: 12px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
</style>
