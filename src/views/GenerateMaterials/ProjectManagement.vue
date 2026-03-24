<template>
  <div class="project-management p-4 bg-gray-50 min-h-full">
    <div class="bg-white p-4 rounded-md shadow-sm mb-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold">生成计划管理</h2>
        <el-button type="primary" icon="el-icon-plus" @click="handleAddProject">新建生成计划</el-button>
      </div>

      <!-- 第一层：生成计划列表 -->
      <el-table :data="projectList" style="width: 100%" border stripe>
        <el-table-column type="expand">
          <template #default="props">
            <div class="p-4 bg-gray-50 rounded">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-sm font-bold text-blue-600">子任务列表</h3>
                <el-button type="success" size="mini" plain @click="handleAddSubTask(props.row)">添加子任务</el-button>
              </div>
              <!-- 第二层：执行计划的子任务 -->
              <el-table :data="props.row.subTasks" border size="small">
                <el-table-column label="子任务名称" prop="name" width="150" />
                <el-table-column label="形象" prop="digitalHuman" width="120">
                  <template #default="scope">
                    <el-tag size="small">{{ scope.row.digitalHuman }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="配音" prop="voice" width="120">
                  <template #default="scope">
                    <el-tag size="small" type="info">{{ scope.row.voice }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="执行时间" prop="executeTime" width="160" />
                <el-table-column label="执行情况" prop="status" width="100">
                  <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" min-width="220">
                  <template #default="scope">
                    <div class="flex gap-2">
                      <el-button type="primary" size="mini" @click="handleRunTask(scope.row)">立即执行</el-button>
                      <el-button type="warning" size="mini" plain @click="handleEditSubTask(scope.row, props.row)">编辑任务</el-button>
                      <el-button type="danger" size="mini" plain @click="handleDeleteSubTask(scope.row, props.row)">删除</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="计划名称" prop="name" min-width="150" />
        <el-table-column label="执行时间" prop="createTime" width="160" />
        <el-table-column label="执行情况" prop="status" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行渠道" prop="channel" width="120">
          <template #default="scope">
            <el-tag effect="plain">{{ scope.row.channel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="脚本状态" width="100">
          <template #default="scope">
            <span>{{ scope.row.script ? '已填入' : '未填入' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <div class="flex gap-2">
              <el-button type="primary" size="mini" plain @click="handleEditProject(scope.row)">编辑</el-button>
              <el-button type="danger" size="mini" plain @click="handleDeleteProject(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新建/编辑计划弹窗 -->
    <el-dialog :title="projectDialog.title" v-model="projectDialog.visible" width="600px" append-to-body>
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="计划名称" required>
          <el-input v-model="projectForm.name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="执行渠道" required>
          <el-select v-model="projectForm.channel" placeholder="请选择渠道" class="w-full">
            <el-option label="A2E" value="a2e" />
            <el-option label="即创" value="jichuang" />
          </el-select>
        </el-form-item>
        <el-form-item label="公共脚本">
          <div class="flex flex-col gap-2">
            <el-input
              type="textarea"
              v-model="projectForm.script"
              :rows="4"
              placeholder="如果不填，则需要在子任务中单独设置；如果填写，子任务将默认使用此脚本"
            />
            <div class="flex justify-end gap-2">
              <el-button size="mini" @click="openScriptSelector('project')">从脚本库选择</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitProject">确定</el-button>
      </template>
    </el-dialog>

    <!-- 子任务编辑弹窗 -->
    <el-dialog :title="subTaskDialog.title" v-model="subTaskDialog.visible" width="700px" append-to-body>
      <el-form :model="subTaskForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="子任务名称" required>
              <el-input v-model="subTaskForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="绑定关系">
              <el-select v-model="subTaskForm.relId" placeholder="选择预设绑定" clearable class="w-full" @change="handleRelChange">
                <el-option v-for="item in relList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数字人形象" required>
              <el-select v-model="subTaskForm.digitalHuman" filterable placeholder="请选择数字人" class="w-full">
                <el-option v-for="item in humanOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配音选择" required>
              <el-select v-model="subTaskForm.voice" filterable placeholder="请选择配音" class="w-full">
                <el-option v-for="item in voiceOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="脚本内容">
          <div class="flex flex-col gap-2">
            <template v-if="subTaskForm.isInherited">
              <div class="p-3 bg-gray-100 border rounded text-gray-500 italic">
                {{ subTaskForm.script || '已继承父计划脚本（当前为空）' }}
              </div>
              <div class="text-xs text-blue-500">注：父计划已设置脚本，当前子任务默认继承且不可修改。</div>
            </template>
            <template v-else>
              <el-input
                type="textarea"
                v-model="subTaskForm.script"
                :rows="6"
                placeholder="请输入脚本内容"
              />
              <div class="flex justify-end gap-2 mt-2">
                <el-button size="mini" plain @click="openScriptSelector('subtask', 'history')">历史脚本</el-button>
                <el-button size="mini" plain @click="openScriptSelector('subtask', 'library')">脚本库</el-button>
              </div>
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subTaskDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitSubTask">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 脚本选择器（复用之前的脚本逻辑） -->
    <el-dialog title="选择脚本" v-model="scriptSelector.visible" width="800px" append-to-body>
      <el-tabs v-model="scriptSelector.activeTab">
        <el-tab-pane label="脚本库" name="library">
          <div class="mb-4 flex gap-2">
            <el-input placeholder="搜索脚本标题" v-model="scriptSelector.search" size="small" style="width: 200px" />
            <el-button type="primary" size="small">查询</el-button>
          </div>
          <el-table :data="mockScriptLibrary" height="300px" border size="small">
            <el-table-column prop="title" label="标题" width="150" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" size="small" @click="selectScript(scope.row)">选择此脚本</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="历史记录" name="history">
           <el-table :data="mockHistoryScripts" height="300px" border size="small">
            <el-table-column prop="date" label="时间" width="150" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" size="small" @click="selectScript(scope.row)">选择此脚本</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 数据定义 ---

const projectList = ref([
  {
    id: 1,
    name: '夏季衣服推广计划_01',
    createTime: '2023-10-24 10:00:00',
    status: '执行中',
    channel: 'A2E',
    script: '欢迎来到我们的直播间，今天给大家带来的是夏季新款...',
    subTasks: [
      { id: 101, name: '分镜头_01', digitalHuman: '小美', voice: '甜美女声', executeTime: '2023-10-24 10:05:00', status: '已完成' },
      { id: 102, name: '分镜头_02', digitalHuman: '小美', voice: '甜美女声', executeTime: '2023-10-24 10:10:00', status: '等待中' }
    ]
  },
  {
    id: 2,
    name: '数码产品测评_A区',
    createTime: '2023-10-24 14:00:00',
    status: '未执行',
    channel: '即创',
    script: '',
    subTasks: [
      { id: 201, name: '开场特写', digitalHuman: '阿强', voice: '磁性男声', executeTime: '2023-10-24 14:10:00', status: '未执行' }
    ]
  }
])

const humanOptions = ['小美', '阿强', '露西', '大白']
const voiceOptions = ['甜美女声', '磁性男声', '活力少女', '成熟稳重']
const relList = [
  { id: 1, name: '小美 + 甜美 (夏季款专用)', human: '小美', voice: '甜美女声' },
  { id: 2, name: '阿强 + 磁性 (科技款专用)', human: '阿强', voice: '磁性男声' }
]

const mockScriptLibrary = [
  { title: '带货通案', content: '这个产品真的太好用了，家人们快冲...' },
  { title: '品牌介绍', content: '我们是一家拥有10年历史的专业制造公司...' }
]

const mockHistoryScripts = [
  { date: '2023-10-20', content: '历史脚本内容示例 01' },
  { date: '2023-10-21', content: '历史脚本内容示例 02' }
]

// --- 弹窗逻辑 ---

const projectDialog = reactive({ visible: false, title: '新建生成计划' })
const projectForm = reactive({ name: '', channel: '', script: '' })

const subTaskDialog = reactive({ visible: false, title: '编辑子任务' })
const subTaskForm = reactive({ 
  id: null, 
  name: '', 
  relId: '', 
  digitalHuman: '', 
  voice: '', 
  script: '',
  isInherited: false 
})

const scriptSelector = reactive({ 
  visible: false, 
  activeTab: 'library', 
  search: '', 
  target: 'project' // 'project' or 'subtask'
})

// --- 方法 ---

const getStatusType = (status: string) => {
  switch (status) {
    case '已完成': return 'success'
    case '执行中': return 'warning'
    case '等待中': return 'info'
    case '未执行': return ''
    default: return ''
  }
}

const handleAddProject = () => {
  projectDialog.title = '新建生成计划'
  projectForm.name = ''
  projectForm.channel = ''
  projectForm.script = ''
  projectDialog.visible = true
}

const handleEditProject = (row: any) => {
  projectDialog.title = '编辑生成计划'
  Object.assign(projectForm, row)
  projectDialog.visible = true
}

const handleDeleteProject = (row: any) => {
  ElMessageBox.confirm(`确定删除计划 "${row.name}" 吗？`, '提示', { type: 'warning' }).then(() => {
    ElMessage.success('删除成功')
  })
}

const handleAddSubTask = (project: any) => {
  subTaskDialog.title = '添加子任务'
  subTaskForm.id = null
  subTaskForm.name = ''
  subTaskForm.relId = ''
  subTaskForm.digitalHuman = ''
  subTaskForm.voice = ''
  subTaskForm.isInherited = !!project.script
  subTaskForm.script = project.script || ''
  subTaskDialog.visible = true
}

const handleEditSubTask = (task: any, project: any) => {
  subTaskDialog.title = '编辑子任务'
  Object.assign(subTaskForm, task)
  subTaskForm.isInherited = !!project.script
  // 如果父级有脚本，子级强制显示父级脚本
  if (project.script) {
    subTaskForm.script = project.script
  }
  subTaskDialog.visible = true
}

const handleRelChange = (val: any) => {
  const rel = relList.find(r => r.id === val)
  if (rel) {
    subTaskForm.digitalHuman = rel.human
    subTaskForm.voice = rel.voice
  }
}

const openScriptSelector = (target: 'project' | 'subtask', tab: 'library' | 'history' = 'library') => {
  scriptSelector.target = target
  scriptSelector.activeTab = tab
  scriptSelector.visible = true
}

const selectScript = (script: any) => {
  const content = script.content
  if (scriptSelector.target === 'project') {
    projectForm.script = content
  } else {
    subTaskForm.script = content
  }
  scriptSelector.visible = false
  ElMessage.success('已选择脚本')
}

const handleRunTask = (row: any) => {
  ElMessage.warning(`正在开始执行任务: ${row.name}`)
}

const submitProject = () => {
  ElMessage.success('计划已保存')
  projectDialog.visible = false
}

const submitSubTask = () => {
  ElMessage.success('任务修改已保存')
  subTaskDialog.visible = false
}
</script>

<style scoped>
.project-management :deep(.el-table__expanded-cell) {
  padding: 0 !important;
}
</style>
