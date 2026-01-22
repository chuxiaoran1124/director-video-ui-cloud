<template>
  <div class="page-user-management">
    <div class="page-header">
      <el-button @click="refresh">刷新</el-button>
    </div>

    <el-table :data="users" style="width:100%" stripe>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="电子邮件" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="role" label="角色">
        <template #default="{ row }">
          <el-tag size="small">{{ row.role }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as userApi from '/@/api/user/index'

interface IUser {
  user_id: number
  username: string
  email: string
  name: string
  phone: string
  role: string
}

const users = ref<IUser[]>([])

async function loadList() {
  try {
    const res = await userApi.userList()
    if (res.data.code === 200) {
      users.value = res.data.data.map((u: any) => ({
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role
      }))
    } else {
      ElMessage({ message: res.data.message || '获取列表失败', type: 'error' })
    }
  } catch (e: any) {
    ElMessage({ message: e.message || '请求失败', type: 'error' })
  }
}

function refresh() {
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-header { display:flex; gap:8px; margin-bottom:12px }
</style>
        import { ElMessage } from 'element-plus'
