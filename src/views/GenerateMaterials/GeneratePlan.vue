<template>
  <div class="project-management p-6 bg-gray-50 min-h-full">
    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" class="space-y-4">
      <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-center relative border border-gray-100">
        <div class="text-center">
          <h2 class="text-xl font-bold text-gray-800">生成计划管理</h2>
          <p class="text-xs text-gray-400 mt-1">管理并监控视频素材生成任务</p>
        </div>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAddProject" class="absolute right-6 rounded shadow-sm">
          新建计划
        </el-button>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <el-table :data="projectList" style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: 'bold' }">
          <el-table-column label="计划名称" min-width="140" show-overflow-tooltip>
            <template #default="scope">
              <span class="font-bold text-gray-700">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="创建日期" width="100" align="center">
             <template #default="scope">
               <span class="text-gray-500 text-xs">{{ scope.row.createTime }}</span>
             </template>
          </el-table-column>

          <el-table-column label="计划开始" width="150" align="center">
            <template #default="scope">
               <span class="text-gray-600 text-xs">{{ scope.row.startTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="计划结束" width="150" align="center">
            <template #default="scope">
               <span class="text-gray-600 text-xs">{{ scope.row.endTime || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="mini" effect="light" class="rounded">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="任务数" width="70" align="center">
            <template #default="scope">
              <span class="text-gray-600 font-medium text-xs">{{ scope.row.subTasks.length }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="340" fixed="right" align="center">
            <template #default="scope">
              <div class="flex items-center justify-center gap-1">
                <el-button type="primary" size="mini" class="!px-1.5 !text-[11px]" @click="enterSubTaskView(scope.row)">任务详情</el-button>
                <el-button size="mini" class="!px-1.5 !text-[11px]" @click="handleEditProject(scope.row)">编辑</el-button>
                <el-button type="danger" size="mini" plain class="!px-1.5 !text-[11px]" @click="handleDeleteProject(scope.row)">删除</el-button>
                <el-button 
                  type="success" 
                  size="mini" 
                  icon="el-icon-video-play" 
                  class="!px-1.5 !text-[11px]"
                  :disabled="scope.row.status === '执行中'"
                  @click="handleRunProject(scope.row)"
                >立即执行</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 子任务详情页 (单独页面模式) -->
    <div v-else class="space-y-4 animate-fade-in">
      <div class="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center border border-gray-100">
        <div class="flex items-center gap-4">
          <el-button circle icon="el-icon-back" @click="viewMode = 'list'"></el-button>
          <div>
            <h2 class="text-xl font-bold text-gray-800">
              <span class="text-gray-400 font-normal">计划：</span>{{ currentProject.name }}
            </h2>
            <div class="flex gap-4 mt-1">

              <span class="text-xs text-gray-400 italic">脚本：{{ currentProject.script ? '已配置通用脚本' : '由子任务独立配置' }}</span>
            </div>
          </div>
        </div>
        <el-button type="success" size="small" icon="el-icon-plus" @click="handleAddSubTask(currentProject)">添加子任务</el-button>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-5">
        <div class="flex flex-wrap gap-6">
          <div v-for="task in currentProject.subTasks" :key="task.id" 
               class="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.3%-16px)] group relative bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all border-l-4 flex flex-col min-h-[280px]"
               :class="task.status === '已完成' ? 'border-l-green-500' : 'border-l-blue-500'">
            
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-bold text-gray-800">{{ task.name }}</h3>
                <div class="flex items-center gap-1 mt-0.5" v-if="task.executeTime !== '待定'">
                  <el-icon class="text-[10px] text-gray-400"><el-icon-clock /></el-icon>
                  <span class="text-[11px] text-gray-400">完成: {{ task.executeTime }}</span>
                </div>
                <span v-else class="text-xs text-gray-400">待执行</span>
              </div>
              <el-tag :type="getStatusType(task.status)" size="mini">{{ task.status }}</el-tag>
            </div>

            <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-lg mb-4">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                <img :src="getHumanImg(task.digitalHuman)" class="w-full h-full object-cover">
              </div>
              <div class="flex-grow">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold">{{ task.digitalHuman }}</span>
                  <el-button circle size="mini" icon="el-icon-headset" class="!p-1 h-6 w-6" @click="playVoice(task.voice)"></el-button>
                </div>
                <div class="text-xs text-gray-500 mt-1">配音: {{ task.voice }}</div>
              </div>
            </div>

            <!-- 执行结果/错误展示区域 (固定高度或弹性以对齐按钮) -->
            <div class="flex-grow">
              <div v-if="task.status === '已完成'" class="mb-4 bg-green-50 rounded-lg p-2 border border-green-100 animate-fade-in relative overflow-hidden">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-green-700">
                    <i class="el-icon-video-camera text-base"></i>
                    <span class="text-xs font-bold">生成成功</span>
                  </div>
                  <div class="flex gap-1">
                    <el-button type="success" size="mini" plain icon="el-icon-view" class="!px-2 !py-1" @click="previewVideo(task.videoUrl)">预览</el-button>
                    <el-button type="success" size="mini" icon="el-icon-download" class="!px-2 !py-1" @click="downloadVideo(task)"></el-button>
                  </div>
                </div>
              </div>

              <div v-if="task.status === '执行失败'" class="mb-4 bg-red-50 rounded-lg p-3 border border-red-100 animate-fade-in">
                <div class="flex items-center gap-2 text-red-700 mb-1">
                  <i class="el-icon-warning-outline text-base"></i>
                  <span class="text-xs font-bold">执行失败</span>
                </div>
                <p class="text-[10px] text-red-500 line-clamp-2 leading-relaxed">{{ task.errorMsg || '未知系统错误，请重试' }}</p>
              </div>
            </div>

            <div class="flex justify-end items-center border-t border-gray-50 pt-3 gap-1.5 mt-auto">
              <div class="flex gap-1 opacity-100 transition-opacity mr-auto">
                <el-button type="primary" size="mini" plain class="!px-2" icon="el-icon-edit" @click="handleEditSubTask(task, currentProject)">编辑</el-button>
                <el-button type="danger" size="mini" plain class="!px-2" icon="el-icon-delete" @click="handleDeleteSubTask(task, currentProject)">删除</el-button>
              </div>
              <el-button type="success" size="mini" class="!px-3 font-bold" icon="el-icon-video-play" @click="handleRunTask(task)" v-if="task.status !== '已完成'">立即执行</el-button>
              <div v-else class="text-[11px] text-green-500 font-bold flex items-center gap-1">
                <i class="el-icon-circle-check"></i>已就绪
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="currentProject.subTasks.length === 0" class="w-full py-20 flex flex-col items-center text-gray-300">
             <i class="el-icon-folder-opened text-6xl"></i>
             <p class="mt-4">暂无子任务，点击上方按钮添加</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑计划弹窗 -->
    <el-dialog :title="projectDialog.title" v-model="projectDialog.visible" width="600px" append-to-body>
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="计划名称" required>
          <el-input v-model="projectForm.name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="视频语言">
          <el-select v-model="projectForm.language" placeholder="设置后将自动填充至子任务，也可不选" class="w-full" clearable>
            <el-option label="自动识别" value="auto" />
            <el-option label="中文" value="zh" />
            <el-option label="英文" value="en" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行方式">
          <el-radio-group v-model="projectForm.executionMode">
            <el-radio label="manual">手动执行</el-radio>
            <el-radio label="scheduled">定时执行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="定时时间" v-if="projectForm.executionMode === 'scheduled'" required>
          <el-date-picker
            v-model="projectForm.scheduledTime"
            type="datetime"
            placeholder="选择计划执行时间"
            class="w-full"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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

    <!-- 子任务编辑弹窗 (回归简洁版UI) -->
    <el-dialog 
      :title="subTaskForm.id ? '编辑子任务' : '添加子任务'" 
      v-model="subTaskDialog.visible" 
      width="680px" 
      append-to-body
    >
      <el-form :model="subTaskForm" label-width="100px" class="py-2">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="任务名称" required>
              <el-input v-model="subTaskForm.name" placeholder="请输入子任务名称" />
            </el-form-item>
            
            <el-form-item label="配置方式">
              <el-radio-group v-model="subTaskForm.useRel" size="mini">
                <el-radio-button :label="true">选择绑定关系</el-radio-button>
                <el-radio-button :label="false">手动自由选择</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="视频语言" required>
              <el-select v-model="subTaskForm.language" placeholder="请选择视频语言" class="w-full">
                <el-option label="自动识别" value="auto" />
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
              </el-select>
            </el-form-item>

            <template v-if="subTaskForm.useRel">
              <el-form-item label="绑定关系" required>
                <div class="flex gap-2">
                  <el-select v-model="subTaskForm.relId" placeholder="请选择预设绑定关系" class="flex-1" @change="handleRelChange">
                    <el-option v-for="item in relList" :key="item.id" :label="item.name" :value="item.id">
                      <div class="flex justify-between items-center w-full">
                        <span>{{ item.name }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] text-gray-400">({{ item.voice }})</span>
                          <el-button type="text" icon="el-icon-headset" size="mini" @click.stop="playVoice(item.voice)"></el-button>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                  <el-button v-if="subTaskForm.voice" type="primary" plain icon="el-icon-headset" @click="playVoice(subTaskForm.voice)">试听</el-button>
                </div>
                <div class="text-[11px] text-gray-400 mt-1">已选配音: <span class="text-blue-500">{{ subTaskForm.voice || '未选择' }}</span></div>
              </el-form-item>
            </template>

            <template v-else>
              <el-form-item label="数字人" required>
                <el-select v-model="subTaskForm.digitalHuman" filterable placeholder="请选择数字人" class="w-full">
                  <el-option v-for="item in humanOptions" :key="item.name" :label="item.name" :value="item.name">
                    <div class="flex items-center gap-2">
                      <img :src="item.img" class="w-6 h-6 rounded-full object-cover">
                      <span>{{ item.name }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="配音选择" required>
                <div class="flex gap-2">
                  <el-select v-model="subTaskForm.voice" filterable placeholder="请选择配音" class="flex-1">
                    <el-option v-for="item in voiceOptions" :key="item.name" :label="item.name" :value="item.name">
                      <div class="flex justify-between items-center w-full">
                        <span>{{ item.name }}</span>
                        <el-button type="text" icon="el-icon-headset" @click.stop="playVoice(item.name)"></el-button>
                      </div>
                    </el-option>
                  </el-select>
                  <el-button v-if="subTaskForm.voice" type="primary" plain icon="el-icon-headset" @click="playVoice(subTaskForm.voice)">试听</el-button>
                </div>
              </el-form-item>
            </template>
          </el-col>
          <el-col :span="8" class="flex flex-col items-center">
             <!-- 预览区域 -->
             <div class="w-32 h-32 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden relative">
                <img v-if="subTaskForm.digitalHuman" :src="getHumanImg(subTaskForm.digitalHuman)" class="w-full h-full object-cover">
                <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <i class="el-icon-user text-3xl"></i>
                    <span class="text-[10px] mt-1">形象预览</span>
                </div>
                <!-- 声音播放指示 -->
                <div v-if="isPlaying" class="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div class="flex gap-1">
                        <div class="w-1 h-3 bg-white animate-bounce"></div>
                        <div class="w-1 h-5 bg-white animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-1 h-3 bg-white animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
             </div>
             <div class="mt-2 text-[10px] text-gray-400">形象/声音预览</div>
          </el-col>
        </el-row>

        <el-form-item label="脚本内容">
          <template v-if="subTaskForm.isInherited">
            <div class="p-3 bg-blue-50 border border-blue-100 rounded text-blue-600 text-xs italic">
              {{ subTaskForm.script || '已继承公共脚本' }}
              <p class="mt-1 text-[10px] text-blue-400 not-italic">(公共脚本模式下不支持在本级编辑)</p>
            </div>
          </template>
          <template v-else>
            <el-input
              type="textarea"
              v-model="subTaskForm.script"
              :rows="5"
              placeholder="请输入脚本内容"
            />
            <div class="flex justify-end gap-2 mt-2">
              <el-button size="mini" plain @click="openScriptSelector('subtask', 'library')">从脚本库选择</el-button>
              <el-button size="mini" plain type="success" :disabled="!subTaskForm.script" @click="openSaveScriptDialog(subTaskForm.script)">保存到脚本库</el-button>
            </div>
          </template>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subTaskDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitSubTask">保存</el-button>
      </template>
    </el-dialog>

    <!-- 脚本选择器 -->
    <el-dialog title="选择脚本" v-model="scriptSelector.visible" width="850px" append-to-body>
      <el-tabs v-model="scriptSelector.activeTab" class="custom-tabs">
        <el-tab-pane label="脚本库" name="library">
          <div class="mb-4 flex gap-2">
            <el-input placeholder="查找脚本..." v-model="scriptSelector.search" size="small" style="width: 240px">
                <template #prefix><i class="el-icon-search"></i></template>
            </el-input>
          </div>
          <el-table :data="filteredScriptLibrary" height="350px" border>
            <el-table-column prop="title" label="标题" width="150" />
            <el-table-column label="标签" width="180">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <el-tag v-for="tag in scope.row.tags" :key="tag" size="mini" effect="plain">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="mini" text @click="selectScript(scope.row)">选入</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="历史记录" name="history">
           <el-table :data="mockHistoryScripts" height="350px" border>
            <el-table-column prop="date" label="生成时间" width="180" />
            <el-table-column prop="content" label="内容片段" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="mini" text @click="selectScript(scope.row)">选入</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 保存到脚本库弹窗 -->
    <el-dialog title="保存到脚本库" v-model="saveScriptDialog.visible" width="450px" append-to-body>
      <el-form :model="saveScriptDialog.form" label-width="80px">
        <el-form-item label="脚本标题" required>
          <el-input v-model="saveScriptDialog.form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="脚本内容">
          <el-input type="textarea" v-model="saveScriptDialog.form.content" :rows="4" readonly />
        </el-form-item>
        <el-form-item label="脚本标签">
          <div class="flex flex-wrap gap-2 mb-2">
            <el-tag 
              v-for="(tag, index) in saveScriptDialog.form.tags" 
              :key="index" 
              closable 
              size="small"
              @close="saveScriptDialog.form.tags.splice(index, 1)"
            >
              {{ tag }}
            </el-tag>
          </div>
          <el-input 
            v-model="saveScriptDialog.form.newTag" 
            placeholder="输入标签按回车添加" 
            size="small"
            @keyup.enter="() => {
              if (saveScriptDialog.form.newTag) {
                saveScriptDialog.form.tags.push(saveScriptDialog.form.newTag);
                saveScriptDialog.form.newTag = '';
              }
            }"
          >
            <template #append>
              <el-button @click="() => {
                if (saveScriptDialog.form.newTag) {
                   saveScriptDialog.form.tags.push(saveScriptDialog.form.newTag);
                   saveScriptDialog.form.newTag = '';
                }
              }">添加</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveScriptDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveScript">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- 视频播放弹窗 -->
    <el-dialog title="视频预览" v-model="videoPreview.visible" width="800px" append-to-body top="5vh" custom-class="video-preview-dialog">
       <div class="bg-black flex items-center justify-center rounded overflow-hidden" style="height: 450px;">
          <video v-if="videoPreview.url" :src="videoPreview.url" controls autoplay class="max-w-full max-h-full"></video>
       </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTaskStore } from '/@/store/modules/task'

// --- 数据定义 ---
const taskStore = useTaskStore()
const viewMode = ref('list') // 'list' 或 'detail'
const currentProject = ref<any>(null)
const isPlaying = ref(false)

// --- 模拟数据 ---
const humanOptions = [
  { name: '小美', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
  { name: '阿强', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { name: '露西', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { name: '大白', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }
]

const voiceOptions = [
  { name: '甜美女声', audio: '' },
  { name: '磁性男声', audio: '' },
  { name: '活力少女', audio: '' },
  { name: '成熟稳重', audio: '' }
]

const relList = [
  { id: 1, name: '夏季服装场景 (小美 + 甜美)', human: '小美', voice: '甜美女声' },
  { id: 2, name: '专业测评场景 (阿强 + 磁性)', human: '阿强', voice: '磁性男声' }
]

const projectList = ref<any[]>([
  {
    id: 1,
    name: '2024夏季新品预热计划',
    createTime: '2023-11-20',
    startTime: '2023-11-20 10:00:00',
    endTime: '2023-11-20 18:30:00',
    status: '执行中',
    channel: '\u9ed8\u8ba4',
    language: 'auto',
    script: '欢迎来到直播间...',
    executionMode: 'manual',
    scheduledTime: '',
    subTasks: [
      { 
        id: 101, 
        name: '户外展示段', 
        digitalHuman: '小美', 
        voice: '甜美女声', 
        executeTime: '11-20 09:35', 
        status: '已完成',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
      },
      { 
        id: 102, 
        name: '细节解说段', 
        digitalHuman: '小美', 
        voice: '甜美女声', 
        executeTime: '11-20 09:40', 
        status: '等待中' 
      },
      { 
        id: 103, 
        name: '尾声引导', 
        digitalHuman: '露西', 
        voice: '活力少女', 
        executeTime: '11-20 10:00', 
        status: '执行失败',
        errorMsg: '渲染引擎超时: Network timeout while fetching assets'
      }
    ]
  },
  {
    id: 2,
    name: '黑科技耳机深度解说计划',
    createTime: '2023-11-21',
    startTime: '2023-11-21 14:00:00',
    endTime: '2023-11-21 16:30:00',
    status: '未执行',
    channel: '即创',
    language: '',
    script: '',
    executionMode: 'manual',
    scheduledTime: '',
    subTasks: [
      { id: 201, name: '参数硬壳展示', digitalHuman: '阿强', voice: '磁性男声', executeTime: '待定', status: '未执行' }
    ]
  }
])

const mockScriptLibrary = ref([
  { title: '带货通用模板', content: '家人们，今天这款产品真的超级划算...', tags: ['带货', '通用'] },
  { title: '品牌故事模板', content: '跨越十年的坚持，只为给你最极致的体验...', tags: ['品牌', '案例'] }
])

const mockHistoryScripts = [
  { date: '2023-11-15', content: '上一场直播用过的开场白...' },
  { date: '2023-11-16', content: '关于洗面奶的解说词...' }
]

// --- 弹窗逻辑 ---
const projectDialog = reactive({ visible: false, title: '新建生成计划' })
const projectForm = reactive<any>({ 
  id: null, 
  name: '', 
  language: '',
  script: '',
  executionMode: 'manual',
  scheduledTime: '' 
})

const subTaskDialog = reactive({ visible: false, title: '编辑子任务' })
const subTaskForm = reactive<any>({ 
  id: null, 
  name: '', 
  language: 'auto',
  relId: '',
  useRel: true,
  digitalHuman: '', 
  voice: '', 
  script: '',
  isInherited: false 
})

const scriptSelector = reactive({ 
  visible: false, 
  activeTab: 'library', 
  search: '', 
  target: 'project' 
})

const saveScriptDialog = reactive({
  visible: false,
  form: {
    title: '',
    content: '',
    tags: [] as string[],
    newTag: ''
  }
})

const videoPreview = reactive({
  visible: false,
  url: ''
})

const filteredScriptLibrary = computed(() => {
  const s = scriptSelector.search.toLowerCase()
  return mockScriptLibrary.value.filter(item => 
    item.title.toLowerCase().includes(s) || 
    item.content.toLowerCase().includes(s) ||
    item.tags.some((t: string) => t.toLowerCase().includes(s))
  )
})

// --- 基础工具函数 ---
const getStatusType = (status: string) => {
  switch (status) {
    case '已完成': return 'success'
    case '执行中': return 'warning'
    case '进行中': return 'primary'
    case '排队中': return 'info'
    case '执行失败': return 'danger'
    default: return 'info'
  }
}

const getHumanImg = (name: string) => {
  return humanOptions.find(h => h.name === name)?.img || ''
}

// 视频预览
const previewVideo = (url?: string) => {
  if (!url) {
    ElMessage.warning('暂无视频预览地址')
    return
  }
  videoPreview.url = url
  videoPreview.visible = true
}

// 绑定关系切换逻辑
const handleRelChange = (val: any) => {
  const rel = relList.find(r => r.id === val)
  if (rel) {
    subTaskForm.digitalHuman = rel.human
    subTaskForm.voice = rel.voice
    ElMessage.success(`已应用联动配置: ${rel.human} + ${rel.voice}`)
  }
}

// 脚本保存逻辑
const openSaveScriptDialog = (content: string) => {
  saveScriptDialog.form.title = ''
  saveScriptDialog.form.content = content
  saveScriptDialog.form.tags = []
  saveScriptDialog.form.newTag = ''
  saveScriptDialog.visible = true
}

const confirmSaveScript = () => {
  if (!saveScriptDialog.form.title) {
    ElMessage.warning('请输入脚本标题')
    return
  }
  mockScriptLibrary.value.push({
    title: saveScriptDialog.form.title,
    content: saveScriptDialog.form.content,
    tags: [...saveScriptDialog.form.tags]
  })
  ElMessage.success('已存入脚本库')
  saveScriptDialog.visible = false
}

// 视频下载
const downloadVideo = (task: any) => {
  if (!task.videoUrl) return
  ElMessage.success(`正在准备下载：${task.name}.mp4`)
  const a = document.createElement('a')
  a.href = task.videoUrl
  a.download = `${task.name}.mp4`
  a.click()
}

const playVoice = (voiceName: string) => {
  if (!voiceName) return
  isPlaying.value = true
  ElMessage({ 
    message: `正在试听配音: ${voiceName} ...`, 
    type: 'success',
    duration: 2000 
  })
  setTimeout(() => isPlaying.value = false, 2500)
}

// --- 页面跳转 ---
const enterSubTaskView = (row: any) => {
  currentProject.value = row
  viewMode.value = 'detail'
}

// --- 逻辑处理 ---
const handleAddProject = () => {
  projectDialog.title = '新建生成计划'
  projectForm.id = null
  projectForm.name = ''
  projectForm.language = ''
  projectForm.script = ''
  projectForm.executionMode = 'manual'
  projectForm.scheduledTime = ''
  projectDialog.visible = true
}

const handleEditProject = (row: any) => {
  projectDialog.title = '编辑生成计划'
  Object.assign(projectForm, row)
  // 如果没有这些字段则初始化
  if (!projectForm.executionMode) projectForm.executionMode = 'manual'
  if (!projectForm.language) projectForm.language = ''
  projectDialog.visible = true
}

const handleDeleteProject = (row: any) => {
  ElMessageBox.confirm(`确定删除计划 "${row.name}"?`, '提醒', { type: 'error' }).then(() => {
    projectList.value = projectList.value.filter(p => p.id !== row.id)
    ElMessage.success('已删除')
  })
}

const handleRunProject = (row: any) => {
  row.status = '执行中'

  // 同步到全局任务中心
  taskStore.addTask({
    taskType: 'VIDEO_PLAN_TASK',
    subTitle: `计划名称：${row.name}`,
    status: 'running'
  })

  ElMessage.success(`已开始立即执行计划: ${row.name}`)
}

const handleAddSubTask = (project: any) => {
  subTaskDialog.title = '添加子任务'
  subTaskForm.id = Date.now()
  subTaskForm.name = ''
  subTaskForm.language = project.language || 'auto'
  subTaskForm.useRel = true
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
  subTaskForm.useRel = !!task.relId
  subTaskForm.isInherited = !!project.script
  if (project.script) subTaskForm.script = project.script
  subTaskDialog.visible = true
}

const handleDeleteSubTask = (task: any, project: any) => {
  ElMessageBox.confirm('确定删除此子任务?', '提醒').then(() => {
    project.subTasks = project.subTasks.filter((t: any) => t.id !== task.id)
    ElMessage.success('已移除任务')
  })
}

const openScriptSelector = (target: any, tab: any = 'library') => {
  scriptSelector.target = target
  scriptSelector.activeTab = tab
  scriptSelector.visible = true
}

const selectScript = (script: any) => {
  if (scriptSelector.target === 'project') projectForm.script = script.content
  else subTaskForm.script = script.content
  scriptSelector.visible = false
}

const handleRunTask = (row: any) => {
  row.status = '执行中'

  // 同步到全局任务中心
  taskStore.addTask({
    taskType: 'VIDEO_TASK',
    subTitle: `任务名称：${row.name}`,
    status: 'running'
  })

  ElMessage.success(`已启动任务: ${row.name}`)
}

const submitProject = () => {
  if (projectForm.id) {
    const idx = projectList.value.findIndex(p => p.id === projectForm.id)
    projectList.value[idx].name = projectForm.name
    projectList.value[idx].channel = projectForm.channel
    projectList.value[idx].language = projectForm.language
    projectList.value[idx].script = projectForm.script
    projectList.value[idx].executionMode = projectForm.executionMode
    projectList.value[idx].scheduledTime = projectForm.scheduledTime
  } else {
    projectList.value.push({
      id: Date.now(),
      name: projectForm.name,
      channel: projectForm.channel,
      language: projectForm.language,
      script: projectForm.script,
      executionMode: projectForm.executionMode,
      scheduledTime: projectForm.scheduledTime,
      createTime: '刚刚',
      status: projectForm.executionMode === 'manual' ? '未执行' : '等待中',
      subTasks: []
    })
  }
  projectDialog.visible = false
  ElMessage.success(projectForm.executionMode === 'manual' ? '计划已创建' : '计划已预约')
}

const submitSubTask = () => {
  const tasks = currentProject.value.subTasks
  const idx = tasks.findIndex((t: any) => t.id === subTaskForm.id)
  const taskData = { ...subTaskForm, executeTime: '待定', status: '未执行' }
  if (idx > -1) tasks[idx] = taskData
  else tasks.push(taskData)
  subTaskDialog.visible = false
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-table th.el-table__cell) {
  padding: 10px 0;
}

:deep(.el-table td.el-table__cell) {
  padding: 8px 0;
}

:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 15px;
}

:deep(.el-dialog__title) {
  font-weight: bold;
  font-size: 16px;
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  background-color: #f9fafb;
}

:deep(.custom-tabs .el-tabs__item.is-active) {
  font-weight: bold;
}

:deep(.video-preview-dialog) {
  background: transparent;
  box-shadow: none;
}

:deep(.video-preview-dialog .el-dialog__header) {
  background: white;
  border-radius: 12px 12px 0 0;
}

:deep(.video-preview-dialog .el-dialog__body) {
  background: #000;
  padding: 0;
  border-radius: 0 0 12px 12px;
}
</style>
