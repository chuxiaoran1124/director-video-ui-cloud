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
        <!-- 搜索框 -->
        <div class="p-5 border-b border-gray-100">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 max-w-md">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索计划名称或ID..."
                clearable
                size="large"
                @input="handleSearch"
              >
                <template #prefix>
                  <i class="el-icon-search text-gray-400"></i>
                </template>
              </el-input>
            </div>
          </div>
        </div>
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
              <el-tag :type="getStatusType(scope.row.status)" size="small" effect="light" class="rounded">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="任务数" width="70" align="center">
            <template #default="scope">
              <span class="text-gray-600 font-medium text-xs">{{ scope.row.taskCount ?? scope.row.subTasks.length }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="340" fixed="right" align="center">
            <template #default="scope">
              <div class="flex items-center justify-center gap-1">
                <el-button type="primary" size="small" class="!px-1.5 !text-[11px]" @click="enterSubTaskView(scope.row)">任务详情</el-button>
                <el-button size="small" class="!px-1.5 !text-[11px]" @click="handleEditProject(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" plain class="!px-1.5 !text-[11px]" @click="handleDeleteProject(scope.row)">删除</el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  icon="el-icon-video-play" 
                  class="!px-1.5 !text-[11px]"
                  :disabled="Number(scope.row.taskStatus) !== 0"
                  @click="handleRunProject(scope.row)"
                >立即执行</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="flex justify-end">
        <el-pagination
          v-model:current-page="planPage"
          v-model:page-size="planPageSize"
          :total="planTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadProjectList"
          @size-change="() => { planPage = 1; loadProjectList() }"
        />
      </div>
    </div>

    <!-- 子任务详情页 (单独页面模式) -->
    <div v-else class="space-y-4 animate-fade-in">
      <div class="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center border border-gray-100">
        <div class="flex items-center gap-4">
          <el-button circle icon="el-icon-back" @click="goBackToList"></el-button>
          <div>
            <h2 class="text-xl font-bold text-gray-800">
              <span class="text-gray-400 font-normal">计划：</span>{{ currentProject.name }}
            </h2>
            <div class="flex gap-4 mt-1">

              <span class="text-xs text-gray-400 italic">脚本：{{ currentProject.script ? '已配置通用脚本' : '由子任务独立配置' }}</span>
            </div>
          </div>
        </div>
        <el-button
          type="success"
          size="small"
          icon="el-icon-plus"
          :disabled="Number(currentProject.taskStatus) === 2 || currentProject.status === '已完成'"
          @click="handleAddSubTask(currentProject)"
        >添加子任务</el-button>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-5">
        <div class="flex flex-wrap gap-6">
          <div v-for="task in currentProject.subTasks" :key="task.id" 
               class="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.3%-16px)] group relative bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all border-l-4 flex flex-col min-h-[280px]"
               :class="Number(task.taskStatus) === 5 ? 'border-l-green-500' : 'border-l-blue-500'">
            
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-bold text-gray-800">{{ task.name }}</h3>
                <div class="flex items-center gap-1 mt-0.5" v-if="task.executeTime !== '待定'">
                  <el-icon class="text-[10px] text-gray-400"><el-icon-clock /></el-icon>
                  <span class="text-[11px] text-gray-400">完成: {{ task.executeTime }}</span>
                </div>
                <span v-else class="text-xs text-gray-400">待执行</span>
              </div>
              <el-tooltip :content="task.status" placement="top">
                <el-tag :type="task.statusType || getStatusType(task.status)" size="small">{{ task.status }}</el-tag>
              </el-tooltip>
            </div>

            <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-lg mb-4">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                <img :src="getHumanImg(task.digitalHuman)" class="w-full h-full object-cover">
              </div>
              <div class="flex-grow">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold">{{ task.digitalHuman }}</span>
                  <el-button v-if="task.voiceAudio || task.voiceUrl" circle size="small" icon="el-icon-headset" class="!p-1 h-6 w-6" @click="playVoice(task.voiceAudio || task.voiceUrl, task.voice)"></el-button>
                </div>
                <div class="text-xs text-gray-500 mt-1">配音: {{ task.voice }}</div>
              </div>
            </div>

            <!-- 执行结果/错误展示区域 (固定高度或弹性以对齐按钮) -->
            <div class="flex-grow">
              <!-- 执行中状态：显示进度条 -->
              <div v-if="Number(task.taskStatus) !== 0 && Number(task.taskStatus) !== 5" class="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-gray-600 font-medium">{{ task.status }}</span>
                  <span class="text-xs text-gray-400">{{ task.statusPercent }}%</span>
                </div>
                <el-progress :percentage="task.statusPercent" :color="task.statusPercent === 100 ? '#67c23a' : '#e6a23c'" :show-text="false" />
              </div>

              <!-- 完成状态：显示视频预览和下载 -->
              <div v-if="Number(task.taskStatus) === 5" class="mb-4 bg-green-50 rounded-lg p-3 border border-green-100 animate-fade-in">
                <div class="mb-3">
                  <div class="aspect-video bg-black rounded-lg overflow-hidden mb-2 relative group">
                    <video v-if="task.videoUrl" :src="task.videoUrl" class="w-full h-full object-cover" preload="metadata"></video>
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                      <span class="text-sm">视频加载中...</span>
                    </div>
                    <div class="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <el-button type="primary" circle icon="el-icon-video-play" size="large" @click="openVideoPreview(task.videoUrl)"></el-button>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-green-700 mb-2">
                    <i class="el-icon-circle-check"></i>
                    <span class="text-xs font-bold">生成完成</span>
                  </div>
                </div>
                <div class="flex gap-2 justify-end">
                  <el-button type="success" size="small" plain icon="el-icon-view" @click="openVideoPreview(task.videoUrl)">全屏预览</el-button>
                  <el-button type="success" size="small" icon="el-icon-download" @click="downloadAudio(task)">下载音频</el-button>
                  <el-button type="success" size="small" icon="el-icon-download" @click="downloadVideo(task)">下载视频</el-button>
                </div>
              </div>

              <!-- 失败状态 -->
              <div v-if="Number(task.taskStatus) > 5 || task.errorMessage" class="mb-4 bg-red-50 rounded-lg p-3 border border-red-100 animate-fade-in">
                <div class="flex items-center gap-2 text-red-700 mb-2">
                  <i class="el-icon-warning-outline"></i>
                  <span class="text-xs font-bold">执行失败</span>
                </div>
                <p class="text-[11px] text-red-600 line-clamp-3 leading-relaxed">{{ task.errorMessage || '未知系统错误，请重试或联系管理员' }}</p>
              </div>
            </div>

            <div class="flex justify-end items-center border-t border-gray-50 pt-3 gap-1.5 mt-auto">
              <div class="flex gap-1 opacity-100 transition-opacity mr-auto">
                <el-button type="primary" size="mini" plain class="!px-2" icon="el-icon-edit" @click="handleEditSubTask(task, currentProject)">编辑</el-button>
                <el-button type="danger" size="mini" plain class="!px-2" icon="el-icon-delete" @click="handleDeleteSubTask(task, currentProject)">删除</el-button>
              </div>
              <el-button type="success" size="small" class="!px-3 font-bold" icon="el-icon-video-play" @click="handleRunTask(task)" v-show="false" :disabled="Number(task.taskStatus) !== 0">{{ Number(task.taskStatus) !== 0 ? '执行中' : '立即执行' }}</el-button>
              <div v-if="Number(task.taskStatus) === 5" class="text-[11px] text-green-500 font-bold flex items-center gap-1">
                <i class="el-icon-circle-check"></i>已完成
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="currentProject.subTasks.length === 0" class="w-full py-20 flex flex-col items-center text-gray-300">
             <i class="el-icon-folder-opened text-6xl"></i>
             <p class="mt-4">暂无子任务，点击上方按钮添加</p>
          </div>

          <!-- 分页 -->
          <div v-if="subTaskTotal > subTaskPageSize" class="mt-4 flex justify-center">
            <el-pagination
              v-model:current-page="subTaskPage"
              v-model:page-size="subTaskPageSize"
              :total="subTaskTotal"
              :page-sizes="[12, 24, 48]"
              layout="total, sizes, prev, pager, next"
              background
              @current-change="loadSubTaskList(currentProject.id)"
              @size-change="() => { subTaskPage = 1; loadSubTaskList(currentProject.id) }"
            />
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
              <el-button size="small" plain @click="openScriptSelector('project')">从脚本库选择</el-button>
              <el-button size="small" plain type="success" :disabled="!projectForm.script" @click="openSaveScriptDialog(projectForm.script)">保存到脚本库</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="生成字幕">
          <el-switch v-model="projectForm.subtitleSelector" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="角标" required v-if="projectForm.subtitleSelector === 1">
          <div class="flex items-center gap-2 w-full">
            <div class="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white min-h-10">
              <template v-if="projectForm.cornerMark">
                <img
                  v-for="item in cornerMarkOptions"
                  v-show="item.id === projectForm.cornerMark"
                  :key="item.id"
                  :src="item.photoUrl"
                  class="w-8 h-8 object-contain"
                >
                <span class="text-gray-700 text-sm">{{ cornerMarkOptions.find((item: any) => item.id === projectForm.cornerMark)?.name }}</span>
              </template>
              <span v-else class="text-gray-400 text-sm">请选择角标</span>
            </div>
            <el-button type="primary" @click="openCornerMarkSelector('project')">选择</el-button>
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
              <el-radio-group v-model="subTaskForm.useRel" size="small">
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
                <el-button 
                  class="w-full" 
                  type="primary" 
                  plain
                  @click="openRelSelector"
                >
                  {{ relList.find((r: any) => r.id === subTaskForm.relId)?.displayName || '选择预设绑定关系' }}
                </el-button>
                <div v-if="subTaskForm.relId" class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                  <img 
                    v-if="relList.find((r: any) => r.id === subTaskForm.relId)?.humanImg"
                    :src="relList.find((r: any) => r.id === subTaskForm.relId)?.humanImg"
                    class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  >
                  <div>
                    <div class="text-sm font-semibold text-blue-900">{{ subTaskForm.digitalHuman }}</div>
                    <div class="flex items-center gap-2 text-xs text-blue-700 mt-1">
                      <i class="el-icon-headset"></i>
                      <span>{{ subTaskForm.voice }}</span>
                      <el-button v-if="subTaskForm.voiceAudio" type="text" icon="el-icon-video-play" size="small" @click="playVoice(subTaskForm.voiceAudio, subTaskForm.voice)"></el-button>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </template>

            <template v-else>
              <el-form-item label="数字人" required>
                <el-button 
                  class="w-full"
                  type="primary" 
                  plain
                  @click="openHumanSelector"
                >
                  {{ subTaskForm.digitalHuman || '选择数字人' }}
                </el-button>
              </el-form-item>
              <el-form-item label="配音选择" required>
                <div class="flex gap-2">
                  <el-button 
                    class="flex-1"
                    type="primary" 
                    plain
                    @click="openVoiceSelector"
                  >
                    {{ subTaskForm.voice || '选择配音' }}
                  </el-button>
                  <el-button v-if="subTaskForm.voice && subTaskForm.voiceAudio" type="primary" plain icon="el-icon-headset" @click="playVoice(subTaskForm.voiceAudio, subTaskForm.voice)">试听</el-button>
                </div>
              </el-form-item>
            </template>
          </el-col>
          <el-col :span="8" class="flex flex-col items-center">
             <!-- 预览区域 -->
             <div class="w-48 h-48 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden relative">
                <!-- 使用预设时显示预设的图片；手动选择时显示humanOptions的图片 -->
                <img 
                  v-if="subTaskForm.humanImg" 
                  :src="subTaskForm.humanImg" 
                  class="w-full h-full object-cover"
                >
                <img 
                  v-else-if="!subTaskForm.humanImg && subTaskForm.digitalHuman" 
                  :src="getHumanImg(subTaskForm.digitalHuman)" 
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <i class="el-icon-user text-4xl"></i>
                    <span class="text-xs mt-2">形象预览</span>
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
              <el-button size="small" plain @click="openScriptSelector('subtask', 'library')">从脚本库选择</el-button>
              <el-button size="small" plain type="success" :disabled="!subTaskForm.script" @click="openSaveScriptDialog(subTaskForm.script)">保存到脚本库</el-button>
            </div>
          </template>
        </el-form-item>
        <el-form-item label="生成字幕">
          <el-switch v-model="subTaskForm.subtitleSelector" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="角标" required v-if="subTaskForm.subtitleSelector === 1">
          <div class="flex items-center gap-2 w-full">
            <div class="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white min-h-10">
              <template v-if="subTaskForm.cornerMark">
                <img
                  v-for="item in cornerMarkOptions"
                  v-show="item.id === subTaskForm.cornerMark"
                  :key="item.id"
                  :src="item.photoUrl"
                  class="w-8 h-8 object-contain"
                >
                <span class="text-gray-700 text-sm">{{ cornerMarkOptions.find((item: any) => item.id === subTaskForm.cornerMark)?.name }}</span>
              </template>
              <span v-else class="text-gray-400 text-sm">请选择角标（默认继承计划设置）</span>
            </div>
            <el-button type="primary" @click="openCornerMarkSelector('subtask')">选择</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subTaskDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitSubTask">保存</el-button>
      </template>
    </el-dialog>

    <!-- 脚本选择器 -->
    <el-dialog title="选择脚本" v-model="scriptSelector.visible" width="850px" append-to-body>
      <el-tabs v-model="scriptSelector.activeTab" class="custom-tabs" @tab-change="handleScriptTabChange">
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
                  <el-tag v-for="tag in scope.row.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
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
          <div class="mb-4 flex gap-2">
            <el-input placeholder="查找脚本..." v-model="scriptSelector.search" size="small" style="width: 240px">
                <template #prefix><i class="el-icon-search"></i></template>
            </el-input>
          </div>
           <el-table :data="filteredScriptHistory" height="350px" border>
            <el-table-column prop="createTime" label="生成时间" width="180" />
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

    <!-- 角标选择器 -->
    <el-dialog title="选择角标" v-model="cornerMarkSelectorDialog.visible" width="900px" append-to-body>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <el-input placeholder="搜索角标..." v-model="cornerMarkSelectorDialog.search" size="small" style="width: 300px;" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
          <span v-if="pinnedCornerMarkIds.length > 0" class="text-xs text-blue-500 flex items-center gap-1">
            <i class="el-icon-top"></i>{{ pinnedCornerMarkIds.length }} 个已置顶
          </span>
        </div>
        <div class="grid grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[700px] overflow-y-auto">
          <div
            v-for="item in sortedCornerMarkOptions"
            :key="item.id"
            class="relative cursor-pointer group text-center"
            @click="selectCornerMark(item)"
          >
            <!-- 置顶标识 -->
            <div v-if="pinnedCornerMarkIds.includes(item.id)" class="absolute top-2 left-2 z-10">
              <el-tag type="primary" size="small" effect="dark" class="!px-1.5 !text-[10px] !h-5 leading-5 shadow">
                置顶
              </el-tag>
            </div>
            <div
              class="rounded-lg overflow-hidden border-2 transition-all shadow-sm p-2 bg-white h-[400px] flex items-center justify-center"
              :class="(cornerMarkSelectorDialog.context === 'project' ? projectForm.cornerMark : subTaskForm.cornerMark) === item.id
                ? 'border-blue-500 shadow-lg shadow-blue-300/50'
                : 'border-blue-300 group-hover:border-blue-400 group-hover:shadow-md'"
            >
              <img
                :src="item.photoUrl"
                class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                :alt="item.name"
              >
            </div>
            <div class="mt-3 flex items-center justify-center gap-2">
              <p class="text-sm text-gray-700 font-medium truncate flex-1 text-center">{{ item.name }}</p>
              <div
                :class="[
                  'flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border cursor-pointer transition-all select-none flex-shrink-0 font-medium',
                  pinnedCornerMarkIds.includes(item.id)
                    ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                    : 'bg-white border-blue-300 text-blue-400 hover:border-blue-500 hover:text-blue-500'
                ]"
                @click.stop="togglePinCornerMark(item.id)"
              >
                <svg viewBox="0 0 24 24" class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                  <line x1="5" y1="3" x2="19" y2="3"/>
                </svg>
                <span>置顶</span>
              </div>
            </div>
            <div
              v-if="(cornerMarkSelectorDialog.context === 'project' ? projectForm.cornerMark : subTaskForm.cornerMark) === item.id"
              class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md"
            >
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 数字人选择器 -->
    <el-dialog title="选择数字人" v-model="humanSelectorDialog.visible" width="600px" append-to-body>
      <!-- 数字人选择器搜索框 -->
      <el-input
        v-model="humanSelectorDialog.search"
        placeholder="搜索数字人..."
        clearable
        size="large"
        class="mb-4"
        @input="filterHumanSelector"
      >
        <template #prefix>
          <i class="el-icon-search text-gray-400"></i>
        </template>
      </el-input>
      <div v-if="humanSelectorDialog.displayList.length > 0" style="height: 400px; overflow-y: auto;">
        <div class="grid grid-cols-4 gap-4 p-4">
          <div 
            v-for="item in humanSelectorDialog.displayList" 
            :key="item.name"
            class="cursor-pointer text-center hover:opacity-80 transition"
            @click="selectHuman(item)"
          >
            <img :src="item.img" class="w-full h-24 rounded-lg object-cover mb-2">
            <div class="text-sm">{{ item.name }}</div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-8">暂无匹配的数字人</div>
    </el-dialog>

    <!-- 配音选择器 -->
    <el-dialog title="选择配音" v-model="voiceSelectorDialog.visible" width="500px" append-to-body>
      <!-- 配音选择器搜索框 -->
      <el-input
        v-model="voiceSelectorDialog.search"
        placeholder="搜索配音..."
        clearable
        size="large"
        class="mb-4"
        @input="filterVoiceSelector"
      >
        <template #prefix>
          <i class="el-icon-search text-gray-400"></i>
        </template>
      </el-input>
      <div v-if="voiceSelectorDialog.displayList.length > 0" style="height: 400px; overflow-y: auto;">
        <div class="space-y-2 p-4">
          <div 
            v-for="item in voiceSelectorDialog.displayList" 
            :key="item.name"
            class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
            @click="selectVoice(item)"
          >
            <span>{{ item.name }}</span>
            <el-button type="text" icon="el-icon-headset" size="small" @click.stop="playVoice(item.url, item.name)"></el-button>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-8">暂无匹配的配音</div>
    </el-dialog>

    <!-- 预设选择器 -->
    <el-dialog title="选择预设绑定" v-model="relSelectorDialog.visible" width="700px" append-to-body>
      <!-- 预设选择器中的搜索框 -->
      <el-input
        v-model="relSelectorDialog.search"
        placeholder="搜索数字人或配音..."
        clearable
        size="large"
        class="mb-4"
        @input="filterRelSelector"
      >
        <template #prefix>
          <i class="el-icon-search text-gray-400"></i>
        </template>
      </el-input>
      <div v-if="relSelectorDialog.displayList.length > 0" style="height: 450px; overflow-y: auto;">
        <div class="space-y-3 p-4">
          <div 
            v-for="item in relSelectorDialog.displayList" 
            :key="item.id"
            class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
            @click="selectRel(item)"
          >
            <!-- 左边：数字人头像 -->
            <img 
              v-if="item.humanImg" 
              :src="item.humanImg" 
              class="w-24 h-24 rounded-lg object-cover flex-shrink-0 shadow-sm"
            >
            <div v-else class="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <i class="el-icon-user text-3xl text-gray-400"></i>
            </div>

            <!-- 中间：信息 -->
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm mb-1">{{ item.human }}</div>
              <div class="flex items-center gap-2 mb-2">
                <i class="el-icon-headset text-gray-400"></i>
                <span class="text-sm text-gray-600">{{ item.voice }}</span>
              </div>
              <div class="text-xs text-gray-400">{{ item.displayName }}</div>
            </div>

            <!-- 右边：操作按钮 -->
            <div class="flex flex-col gap-2 flex-shrink-0">
              <el-button 
                type="primary" 
                icon="el-icon-headset" 
                circle
                size="small"
                @click.stop="playVoice(item.voiceUrl, item.voice)"
                title="试听配音"
              ></el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-12">暂无匹配的预设数据</div>
    </el-dialog>

    <!-- 视频播放弹窗 -->
    <el-dialog title="视频预览" v-model="videoPreview.visible" width="85%" :modal="true" append-to-body top="5vh" custom-class="video-preview-dialog" @closed="handleVideoPreviewClosed">
      <div class="flex flex-col gap-4">
        <div class="bg-black flex items-center justify-center rounded-lg overflow-hidden" style="height: 500px;">
          <video v-if="videoPreview.url" ref="videoPreviewRef" :src="videoPreview.url" controls autoplay class="max-w-full max-h-full object-contain"></video>
          <div v-else class="text-white text-center">
            <i class="el-icon-loading text-4xl animate-spin"></i>
            <p class="mt-2 text-sm">加载中...</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="videoPreview.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTaskStore } from '/@/store/modules/task'
import { createPlanVideo, createPlanVideoTask, deletePlanVideoTask, deletePlanVideo, getPlanVideoList, getScriptPaginateList, getScriptHistoryList, createScript, getDigitalHumanList, getVoiceList, getBindingList, startPlanVideoTask, startAllPlanTasks, getCornerMarkList, toTopCornerMark } from '/@/api/material/index'
import request from '/@/utils/request'

// --- 数据定义 ---
const taskStore = useTaskStore()
const viewMode = ref('list') // 'list' 或 'detail'
const currentProject = ref<any>(null)
const isPlaying = ref(false)
let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl = ''

// --- 模拟数据 ---
const humanOptions = ref<any[]>([
  { name: '小美', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
  { name: '阿强', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { name: '露西', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { name: '大白', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }
])

const voiceOptions = ref<any[]>([
  { name: '甜美女声', audio: '' },
  { name: '磁性男声', audio: '' },
  { name: '活力少女', audio: '' },
  { name: '成熟稳重', audio: '' }
])

const relList = ref<any[]>([
  { 
    id: 1, 
    name: '夏季服装场景', 
    displayName: '小美 + 甜美女声',
    human: '小美', 
    humanImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    voice: '甜美女声', 
    voiceAudio: ''
  },
  { 
    id: 2, 
    name: '专业测评场景', 
    displayName: '阿强 + 磁性男声',
    human: '阿强', 
    humanImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    voice: '磁性男声',
    voiceAudio: ''
  }
])

const projectList = ref<any[]>([])
const searchKeyword = ref('')
const planPage = ref(1)
const planPageSize = ref(20)
const planTotal = ref(0)

// 子任务分页
const subTaskPage = ref(1)
const subTaskPageSize = ref(12)
const subTaskTotal = ref(0)

const scriptLibrary = ref([
  { title: '带货通用模板', content: '家人们，今天这款产品真的超级划算...', tags: ['带货', '通用'] },
  { title: '品牌故事模板', content: '跨越十年的坚持，只为给你最极致的体验...', tags: ['品牌', '案例'] }
])

const scriptHistory = ref([
  { date: '2023-11-15', content: '上一场直播用过的开场白...' },
  { date: '2023-11-16', content: '关于洗面奶的解说词...' }
])

// --- 弹窗逻辑 ---
const projectDialog = reactive({ visible: false, title: '新建生成计划' })
const projectForm = reactive<any>({
  id: null,
  name: '',
  language: '',
  script: '',
  executionMode: 'manual',
  scheduledTime: '',
  subtitleSelector: 1, // 0=不生成字幕，1=生成字幕
  colour: 'yellow', // 字幕颜色，固定黄色
  cornerMark: '', // 角标ID
})

const subTaskDialog = reactive({ visible: false, title: '编辑子任务' })
const subTaskForm = reactive<any>({ 
  id: null, 
  name: '',  // 标题
  language: 'auto',
  script: '',  // 字幕/脚本内容
  subtitleSelector: 0,
  colour: 'yellow',
  cornerMark: '', // 角标ID
  // 数字人相关
  relId: '',  // 预设ID
  useRel: true,  // 是否使用预设
  digital_human_id: '',
  digital_human_name: '',
  digital_human_cover_url: '',
  // 配音相关
  voice_id: '',
  voice_name: '',
  voice_url: '',  // 配音试听URL
  base_voice_url: '',
  // 兼容字段
  digitalHuman: '',
  voice: '',
  humanImg: '',
  voiceAudio: ''
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

// --- 数字人选择器 ---
const humanSelectorDialog = reactive({
  visible: false,
  search: '',
  allList: [] as any[],
  displayList: [] as any[],
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true
})

// --- 配音选择器 ---
const voiceSelectorDialog = reactive({
  visible: false,
  search: '',
  allList: [] as any[],
  displayList: [] as any[],
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true
})

// --- 快捷预设选择器 ---
const relSelectorDialog = reactive({
  visible: false,
  search: '',
  allList: [] as any[],
  displayList: [] as any[],
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true
})

// --- 角标选择器 ---
const cornerMarkOptions = ref<any[]>([])
const cornerMarkSelectorDialog = reactive({
  visible: false,
  search: '',
  context: 'project' as 'project' | 'subtask'
})

// 置顶的角标 ID（按 sort 倒序，sort 越大越靠前）
const pinnedCornerMarkIds = ref<(string | number)[]>([])

// 置顶排序后的角标列表
const sortedCornerMarkOptions = computed(() => {
  const filtered = cornerMarkOptions.value.filter(
    (i: any) => !cornerMarkSelectorDialog.search || i.name.includes(cornerMarkSelectorDialog.search)
  )
  const pinned = filtered
    .filter((i: any) => i.sort !== null && i.sort !== undefined)
    .sort((a: any, b: any) => b.sort - a.sort)
  const rest = filtered.filter((i: any) => i.sort === null || i.sort === undefined)
  return [...pinned, ...rest]
})

// 切换置顶状态（调用后端接口，接口同时处理置顶和取消置顶）
const togglePinCornerMark = async (id: string | number) => {
  try {
    await toTopCornerMark(id)
    // 重新拉取列表以获取最新 sort 值
    await fetchCornerMarks()
    const isPinned = pinnedCornerMarkIds.value.includes(id)
    ElMessage.success(isPinned ? '已置顶，排在最前' : '已取消置顶')
  } catch (error) {
    console.error('置顶操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

const videoPreview = reactive({
  visible: false,
  url: ''
})
const videoPreviewRef = ref<HTMLVideoElement | null>(null)

const handleVideoPreviewClosed = () => {
  if (!videoPreviewRef.value) return
  videoPreviewRef.value.pause()
  videoPreviewRef.value.currentTime = 0
}

const filteredScriptLibrary = computed(() => {
  const s = scriptSelector.search.toLowerCase()
  if (!Array.isArray(scriptLibrary.value)) {
    console.warn('脚本库数据不是数组:', scriptLibrary.value)
    return []
  }
  return scriptLibrary.value.filter(item => 
    item.title.toLowerCase().includes(s) || 
    item.content.toLowerCase().includes(s) ||
    item.tags.some((t: string) => t.toLowerCase().includes(s))
  )
})

const filteredScriptHistory = computed(() => {
  const s = scriptSelector.search.toLowerCase()
  if (!Array.isArray(scriptHistory.value)) {
    console.warn('历史脚本数据不是数组:', scriptHistory.value)
    return []
  }
  return scriptHistory.value.filter(item => 
    item.content.toLowerCase().includes(s)
  )
})

// --- 数据加载函数 ---
const loadDigitalHumanList = async () => {
  try {
    const response = await getDigitalHumanList()
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // 映射API字段：digitalHumanName -> name，coverUrl -> img，externalId -> externalId
      humanOptions.value = response.data.data.map((item: any) => ({
        externalId: item.externalId || item.id || '',
        name: item.digitalHumanName || item.name || '',
        img: item.coverUrl || item.img || '',
        ...item  // 保留原始字段以备使用
      }))
    }
  } catch (error) {
    console.error('加载数字人列表失败:', error)
  }
}

const loadVoiceList = async () => {
  try {
    const response = await getVoiceList()
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // 映射API字段：voiceName -> name，url -> url，externalId -> externalId
      voiceOptions.value = response.data.data.map((item: any) => {
        // 从多个可能的字段提取URL，然后使用辅助函数处理
        const rawUrl = item.url || item.audio || ''
        const processedUrl = extractAudioUrl(rawUrl)
        return {
          externalId: item.externalId || item.id || '',
          name: item.voiceName || item.name || '',
          url: processedUrl,
          ...item  // 保留原始字段以备使用
        }
      })
    }
  } catch (error) {
    console.error('加载配音列表失败:', error)
  }
}

const loadBindingList = async () => {
  try {
    const response = await getBindingList(1, 50)
    if (response.data && response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
      relList.value = response.data.data.data.map((item: any) => {
        return {
          ...item,
          id: item.bindingId,
          name: item.digitalHumanName,
          human: item.digitalHumanName,
          displayName: `${item.digitalHumanName} + ${item.voiceName}`,
          humanImg: item.digitalHumanCoverUrl || '',
          voice: item.voiceName,
          // voiceUrl 直接用 API 返回的原始值，playVoice 内部会调 extractAudioUrl 处理格式
          voiceUrl: item.voiceUrl || '',
          voiceAudio: item.voiceUrl || '',
        }
      })
    }
  } catch (error) {
    console.error('加载绑定关系列表失败:', error)
  }
}

// --- 角标 ---
const fetchCornerMarks = async () => {
  try {
    const result = await getCornerMarkList()
    const cornerMarkData = result.data?.data || result.data || []
    cornerMarkOptions.value = cornerMarkData.map((item: any) => ({
      id: item.id,
      name: item.photoName || item.name || '',
      photoUrl: item.photoUrl || '',
      sort: item.sort ?? null
    }))
    // 初始化置顶列表：sort不为null的按sort倒序
    pinnedCornerMarkIds.value = cornerMarkOptions.value
      .filter((i: any) => i.sort !== null && i.sort !== undefined)
      .sort((a: any, b: any) => b.sort - a.sort)
      .map((i: any) => i.id)
  } catch (error) {
    console.error('获取角标列表失败:', error)
  }
}

const openCornerMarkSelector = (context: 'project' | 'subtask') => {
  cornerMarkSelectorDialog.context = context
  cornerMarkSelectorDialog.search = ''
  cornerMarkSelectorDialog.visible = true
}

const selectCornerMark = (item: any) => {
  if (cornerMarkSelectorDialog.context === 'project') {
    projectForm.cornerMark = item.id
    // 自动同步：将新角标同步到当前打开的子任务表单（如果子任务未单独设置）
  } else {
    subTaskForm.cornerMark = item.id
  }
  cornerMarkSelectorDialog.visible = false
  ElMessage.success('已选择角标')
}

// --- 基础工具函数 ---
const getStatusType = (status: string) => {
  switch (status) {
    case '已完成':
    case '任务已完成': return 'success'
    case '音频克隆中':
    case '视频克隆中':
    case '等待中': return 'warning'
    case '音频克隆完成': return 'primary'
    case '未开始': return 'info'
    case '执行失败': return 'danger'
    default: return 'info'
  }
}

// 获取任务状态标签和颜色
const getTaskStatusInfo = (taskStatus: number | string) => {
  const status = Number(taskStatus)
  const statusMap: any = {
    0: { label: '未开始', type: 'info', percent: 0 },
    1: { label: '等待中', type: 'warning', percent: 10 },
    2: { label: '音频克隆中', type: 'warning', percent: 30 },
    3: { label: '音频克隆完成', type: 'primary', percent: 50 },
    4: { label: '视频克隆中', type: 'warning', percent: 75 },
    5: { label: '任务已完成', type: 'success', percent: 100 }
  }
  return statusMap[status] || statusMap[0]
}

const getHumanImg = (name: string) => {
  return humanOptions.value.find((h: any) => h.name === name)?.img || ''
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

// 打开全屏视频预览
const openVideoPreview = (url?: string) => {
  if (!url) {
    ElMessage.warning('暂无视频预览地址')
    return
  }
  videoPreview.url = url
  videoPreview.visible = true
}

// 下载视频
const downloadVideo = (task: any) => {
  if (!task.videoUrl) {
    ElMessage.warning('暂无可下载的视频文件')
    return
  }
  
  try {
    // 使用fetch获取文件，然后用Blob方式下载
    fetch(task.videoUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 获取文件名
        const urlParts = task.videoUrl.split('/')
        let fileName = urlParts[urlParts.length - 1] || task.name + '.mp4'
        if (fileName && !fileName.includes('.')) {
          fileName = fileName + '.mp4'
        }
        
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('视频下载已开始')
      })
      .catch(error => {
        console.error('下载视频失败:', error)
        ElMessage.error('下载视频失败，请重试')
      })
  } catch (error) {
    console.error('下载视频失败:', error)
    ElMessage.error('下载视频失败，请重试')
  }
}

// 下载音频
const downloadAudio = (task: any) => {
  let audioUrl = task.baseVoiceUrl || task.base_voice_url || task.voice_url || task.voiceAudio
  
  if (!audioUrl) {
    ElMessage.warning('暂无可下载的音频文件')
    return
  }
  
  // 处理URL数组格式的字符串，如 "['https://...']"
  if (typeof audioUrl === 'string' && audioUrl.includes('[')) {
    try {
      // 使用正则表达式提取URL
      const urlMatch = audioUrl.match(/https?:\/\/[^\s'"]+/)
      if (urlMatch && urlMatch[0]) {
        audioUrl = urlMatch[0]
      }
    } catch (e) {
      console.error('解析音频URL失败:', e)
    }
  }
  
  if (!audioUrl || audioUrl.includes('[')) {
    ElMessage.warning('音频URL格式不正确')
    return
  }
  
  try {
    // 使用fetch获取文件，然后用Blob方式下载
    fetch(audioUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 获取文件名
        const urlParts = audioUrl.split('/')
        let fileName = urlParts[urlParts.length - 1] || task.voice_name + '.mp3'
        if (fileName && !fileName.includes('.')) {
          fileName = fileName + '.mp3'
        }
        
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('音频下载已开始')
      })
      .catch(error => {
        console.error('下载音频失败:', error)
        ElMessage.error('下载音频失败，请重试')
      })
  } catch (error) {
    console.error('下载音频失败:', error)
    ElMessage.error('下载音频失败，请重试')
  }
}

// 绑定关系切换逻辑
const handleRelChange = (val: any) => {
  const rel = relList.value.find((r: any) => r.id === val)
  if (rel) {
    subTaskForm.digitalHuman = rel.human
    subTaskForm.voice = rel.voice
    ElMessage.success(`已应用预设: ${rel.displayName}`)
  }
}

// --- 选择器打开函数 ---
const openHumanSelector = async () => {
  humanSelectorDialog.visible = true
  humanSelectorDialog.search = ''
  humanSelectorDialog.allList = humanOptions.value
  humanSelectorDialog.displayList = humanOptions.value.slice(0, humanSelectorDialog.pageSize)
  humanSelectorDialog.page = 1
  humanSelectorDialog.hasMore = humanOptions.value.length > humanSelectorDialog.pageSize
}

// 数字人选择器搜索过滤
const filterHumanSelector = () => {
  const search = humanSelectorDialog.search.toLowerCase()
  const filtered = humanSelectorDialog.allList.filter((item: any) => {
    return item.name.toLowerCase().includes(search)
  })
  humanSelectorDialog.displayList = filtered.slice(0, humanSelectorDialog.pageSize)
}

const openVoiceSelector = async () => {
  voiceSelectorDialog.visible = true
  voiceSelectorDialog.search = ''
  voiceSelectorDialog.allList = voiceOptions.value
  voiceSelectorDialog.displayList = voiceOptions.value.slice(0, voiceSelectorDialog.pageSize)
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = voiceOptions.value.length > voiceSelectorDialog.pageSize
}

// 配音选择器搜索过滤
const filterVoiceSelector = () => {
  const search = voiceSelectorDialog.search.toLowerCase()
  const filtered = voiceSelectorDialog.allList.filter((item: any) => {
    return item.name.toLowerCase().includes(search)
  })
  voiceSelectorDialog.displayList = filtered.slice(0, voiceSelectorDialog.pageSize)
}

const openRelSelector = async () => {
  relSelectorDialog.visible = true
  relSelectorDialog.search = ''
  relSelectorDialog.allList = relList.value
  relSelectorDialog.displayList = relList.value.slice(0, relSelectorDialog.pageSize)
  relSelectorDialog.page = 1
  relSelectorDialog.hasMore = relList.value.length > relSelectorDialog.pageSize
}

// 绑定关系选择器搜索过滤
const filterRelSelector = () => {
  const search = relSelectorDialog.search.toLowerCase()
  const filtered = relSelectorDialog.allList.filter((item: any) => {
    return (
      item.human.toLowerCase().includes(search) ||
      item.voice.toLowerCase().includes(search) ||
      item.displayName.toLowerCase().includes(search)
    )
  })
  relSelectorDialog.displayList = filtered.slice(0, relSelectorDialog.pageSize)
}

// 选择数字人
const selectHuman = (item: any) => {
  subTaskForm.digital_human_id = item.externalId || item.digitalHumanId || item.id || ''
  subTaskForm.digital_human_name = item.name
  subTaskForm.digital_human_cover_url = item.img || ''
  // 兼容字段
  subTaskForm.digitalHuman = item.name
  subTaskForm.humanImg = item.img
  humanSelectorDialog.visible = false
  ElMessage.success('已选择数字人')
}

// 选择配音
const selectVoice = (item: any) => {
  subTaskForm.voice_id = item.externalId || item.voiceId || item.id || ''
  subTaskForm.voice_name = item.name
  subTaskForm.voice_url = item.url || item.audio || ''
  subTaskForm.base_voice_url = item.url || item.audio || ''
  // 兼容字段
  subTaskForm.voice = item.name
  subTaskForm.voiceAudio = item.url || item.audio
  voiceSelectorDialog.visible = false
  ElMessage.success('已选择配音')
}

// 选择预设
const selectRel = (item: any) => {
  // 预设ID
  subTaskForm.relId = item.id
  
  // 数字人信息 - 优先使用externalId
  subTaskForm.digital_human_id = item.digitalHumanExternalId || item.externalId || item.digitalHumanId || item.id || ''
  subTaskForm.digital_human_name = item.human || item.name || ''
  subTaskForm.digital_human_cover_url = item.humanImg || ''
  
  // 配音信息 - 优先使用externalId和url
  subTaskForm.voice_id = item.voiceExternalId || item.voiceId || ''
  subTaskForm.voice_name = item.voice || ''
  subTaskForm.voice_url = item.voiceUrl || item.voiceAudio || ''
  subTaskForm.base_voice_url = item.voiceUrl || item.voiceAudio || ''
  
  // 兼容字段
  subTaskForm.digitalHuman = item.human
  subTaskForm.voice = item.voice
  subTaskForm.humanImg = item.humanImg
  subTaskForm.voiceAudio = item.voiceUrl  // 直接用 voiceUrl，playVoice 内部处理格式
  
  relSelectorDialog.visible = false
  ElMessage.success(`已应用预设: ${item.displayName}`)
}

// 脚本保存逻辑
const openSaveScriptDialog = (content: string) => {
  saveScriptDialog.form.title = ''
  saveScriptDialog.form.content = content
  saveScriptDialog.form.tags = []
  saveScriptDialog.form.newTag = ''
  saveScriptDialog.visible = true
}

const confirmSaveScript = async () => {
  if (!saveScriptDialog.form.title) {
    ElMessage.warning('请输入脚本标题')
    return
  }
  
  try {
    // 按后端要求的字段名发送数据
    const res = await createScript({
      scriptTitle: saveScriptDialog.form.title,
      scriptContent: saveScriptDialog.form.content,
      scriptTags: saveScriptDialog.form.tags
    })
    
    console.log('保存脚本响应:', res)
    // res.data 是后端返回的 { code: 200, data: { id: 6 }, message: "提交成功" }
    const apiResponse = res.data
    if (apiResponse && apiResponse.code === 200) {
      ElMessage.success('已存入脚本库')
      saveScriptDialog.visible = false
      // 重新加载脚本库以获取最新数据
      await fetchScriptLibrary()
    } else {
      ElMessage.error(apiResponse?.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + (error as any)?.message)
    console.error(error)
  }
}

// 提取音频URL 辅助函数 - 处理多种格式
const extractAudioUrl = (urlString: string): string => {
  if (!urlString) return ''
  
  // 处理一般字符串URL
  if (typeof urlString === 'string' && urlString.startsWith('http')) {
    return urlString
  }
  
  // 处理 "['https://...']" 或 "[\"https://...\"]" 的格式
  if (urlString.includes('[') || urlString.includes('(')) {
    // 使用正则提取 https 或 http 开头的URL
    const match = urlString.match(/https?:\/\/[^'"\]\)\s]+/)
    if (match && match[0]) {
      console.log('从数组字符串中提取URL:', match[0])
      return match[0]
    }
  }
  
  // 作为最后的正则模式提取
  const match = urlString.match(/https?:\/\/[^\s'"]+/)
  if (match && match[0]) {
    return match[0]
  }
  
  return urlString
}

const playVoice = (audioUrl: string, voiceName: string = '配音') => {
  if (!audioUrl) {
    ElMessage.warning('暂无试听地址')
    return
  }

  const urlToPlay = extractAudioUrl(audioUrl)
  if (!urlToPlay) {
    ElMessage.error('无效的音频地址')
    return
  }

  // 同一个音频：切换播放/暂停
  if (currentAudio && currentAudioUrl === urlToPlay) {
    if (currentAudio.paused) {
      currentAudio.play().catch(() => {})
      isPlaying.value = true
    } else {
      currentAudio.pause()
      isPlaying.value = false
    }
    return
  }

  // 不同音频：停止当前，播放新的
  if (currentAudio) {
    ;(currentAudio as any)._aborted = true
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
    isPlaying.value = false
  }

  const audio = new Audio()
  currentAudio = audio
  currentAudioUrl = urlToPlay

  audio.addEventListener('error', () => {
    if ((audio as any)._aborted) return
    const errorName = ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][audio.error?.code!] || ''
    if (errorName === 'MEDIA_ERR_SRC_NOT_SUPPORTED') {
      ElMessage.error('音频格式不支持，请联系管理员')
    } else if (errorName === 'MEDIA_ERR_NETWORK') {
      ElMessage.error('网络加载失败，请检查网络连接')
    } else {
      ElMessage.error('音频播放失败: ' + (audio.error?.message || '未知错误'))
    }
    isPlaying.value = false
    currentAudioUrl = ''
  })

  audio.src = urlToPlay
  audio.play().then(() => {
    isPlaying.value = true
    ElMessage.success(`正在试听: ${voiceName}`)
  }).catch((error) => {
    ElMessage.error('音频播放失败: ' + (error.message || '请检查浏览器设置'))
    isPlaying.value = false
    currentAudioUrl = ''
  })

  audio.addEventListener('ended', () => {
    isPlaying.value = false
    currentAudio = null
    currentAudioUrl = ''
  })
}

// --- 页面跳转 ---
const goBackToList = async () => {
  viewMode.value = 'list'
  // 刷新外部列表，确保任务数和状态是最新的
  await loadProjectList()
}

const enterSubTaskView = async (row: any) => {
  currentProject.value = row
  viewMode.value = 'detail'
  subTaskPage.value = 1
  
  // 加载该计划的子任务列表
  if (row.id) {
    await loadSubTaskList(row.id)
  }
}

// 加载子任务列表
const loadSubTaskList = async (planId: number | string) => {
  try {
    // POST 方式请求子任务分页列表
    const response = await request.post(`/api/material/plan/video/task/paginate/post/`, {
      page: subTaskPage.value,
      pageSize: subTaskPageSize.value,
      search: {
        plan_id: planId
      }
    })
    
    const apiData = response.data
    if (apiData && apiData.code === 200) {
      let subTasks = []
      
      // 处理分页返回结构 - { page, pageSize, data: [...], total }
      if (apiData.data && apiData.data.data && Array.isArray(apiData.data.data)) {
        subTasks = apiData.data.data
        subTaskTotal.value = apiData.data.total || 0
      } else if (apiData.data && Array.isArray(apiData.data)) {
        // 如果直接返回数组
        subTasks = apiData.data
      }
      
      // 映射字段名 - 使用camelCase格式，并使用新的状态映射
      currentProject.value.subTasks = subTasks.map((item: any) => {
        const statusInfo = getTaskStatusInfo(item.taskStatus)
        const resolvedSubtitleSelector = Number(item.subtitleSelector ?? currentProject.value.subtitleSelector ?? 0)
        const resolvedColour = item.colour ?? currentProject.value.colour ?? 'white'
        const resolvedScript = item.msg ?? currentProject.value.script ?? ''
        return {
          id: item.id,
          name: item.title || '',
          script: resolvedScript,
          digitalHuman: item.digitalHumanName || '',
          voice: item.voiceName || '',
          language: item.language || 'auto',
          subtitleSelector: resolvedSubtitleSelector,
          colour: resolvedColour,
          taskStatus: item.taskStatus,
          status: statusInfo.label,
          statusType: statusInfo.type,
          statusPercent: statusInfo.percent,
          videoUrl: item.videoUrl || '',
          errorMessage: item.errorMessage || '',
          // 保留完整信息用于编辑
          digital_human_id: item.digitalHumanId || '',
          digital_human_cover_url: item.digitalHumanCoverUrl || '',
          voice_id: item.voiceId || '',
          voice_url: item.voiceUrl || '',
          base_voice_url: item.baseVoiceUrl || '',
          cornerMark: item.cornerMarkId || item.corner_mark_id || '',
          cornerMarkId: item.cornerMarkId || item.corner_mark_id || '',
          cornerMarkUrl: item.cornerMarkUrl || item.corner_mark_url || '',
          ...item
        }
      })
      
      console.log('子任务列表已加载:', currentProject.value.subTasks)
    }
  } catch (error) {
    console.error('加载子任务列表失败:', error)
    currentProject.value.subTasks = []
  }
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
  projectForm.subtitleSelector = 1
  projectForm.colour = 'yellow'
  projectForm.cornerMark = ''
  projectDialog.visible = true
}

const handleEditProject = (row: any) => {
  projectDialog.title = '编辑生成计划'
  Object.assign(projectForm, row)

  // 回绑执行方式和定时时间
  const runMode = row.runMode ?? row.run_mode
  const runTime = row.runTime ?? row.run_time
  projectForm.executionMode = String(runMode) === '2' ? 'scheduled' : 'manual'
  projectForm.scheduledTime = runTime || ''

  // 回填角标：根据 corner_mark_id 找到对应项
  const cornerMarkId = row.corner_mark_id || row.cornerMarkId || ''
  projectForm.cornerMark = cornerMarkId

  // 如果没有这些字段则初始化
  if (!projectForm.executionMode) projectForm.executionMode = 'manual'
  if (!projectForm.language) projectForm.language = ''
  if (typeof projectForm.subtitleSelector === 'undefined') projectForm.subtitleSelector = 1
  if (!projectForm.colour) projectForm.colour = 'yellow'
  projectDialog.visible = true
}

const handleDeleteProject = (row: any) => {
  ElMessageBox.confirm(`确定删除计划 "${row.name}"?`, '提醒', { type: 'error' }).then(async () => {
    try {
      const res = await deletePlanVideo(row.id)
      const apiData = res.data
      if (apiData && apiData.code === 200) {
        ElMessage.success('计划已删除')
        // 刷新列表
        await loadProjectList()
      } else {
        ElMessage.error(apiData?.message || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败: ' + (error as any)?.message)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const handleRunProject = async (row: any) => {
  if (Number(row.taskStatus) !== 0) {
    ElMessage.warning('当前计划状态不允许立即执行')
    return
  }

  try {
    // 调用批量启动API
    const res = await startAllPlanTasks(row.id)
    const apiData = res.data
    
    if (apiData && apiData.code === 200) {
      const result = apiData.data
      
      // 更新项目状态
      row.status = '执行中'

      // 同步到全局任务中心
      taskStore.addTask({
        taskType: 'VIDEO_PLAN_TASK',
        subTitle: `计划名称：${row.name}`,
        status: 'running'
      })

      // 显示详细结果
      let message = `已启动 ${result.success_count}/${result.total_count} 个任务`
      if (result.failed_count > 0) {
        message += `，其中 ${result.failed_count} 个任务无法启动`
        ElMessage.warning(message)
      } else {
        ElMessage.success(message)
      }
      
      // 如果有失败任务，打印详细错误信息
      if (result.failed_tasks && result.failed_tasks.length > 0) {
        console.warn('部分任务启动失败:', result.failed_tasks)
      }
      
            // 延迟2秒后重新加载列表，给后端处理时间
      setTimeout(async () => {
        await loadProjectList()
      }, 2000)
    } else {
      ElMessage.error(apiData?.message || '计划启动失败')
    }
  } catch (error) {
    console.error('启动计划失败:', error)
    ElMessage.error('启动计划失败，请重试')
  }
}

const handleAddSubTask = (project: any) => {
  subTaskDialog.title = '添加子任务'
  subTaskForm.id = null
  subTaskForm.name = ''
  subTaskForm.language = project.language || 'auto'
  // 新增默认继承计划设置
  subTaskForm.script = project.script ?? ''
  subTaskForm.subtitleSelector = Number(project.subtitleSelector ?? 1)
  subTaskForm.colour = 'yellow'
  subTaskForm.cornerMark = project.cornerMark ?? ''
  subTaskForm.useRel = true
  subTaskForm.relId = ''
  // 数字人相关
  subTaskForm.digital_human_id = ''
  subTaskForm.digital_human_name = ''
  subTaskForm.digital_human_cover_url = ''
  // 配音相关
  subTaskForm.voice_id = ''
  subTaskForm.voice_name = ''
  subTaskForm.voice_url = ''
  subTaskForm.base_voice_url = ''
  // 兼容字段
  subTaskForm.digitalHuman = ''
  subTaskForm.voice = ''
  subTaskForm.humanImg = ''
  subTaskForm.voiceAudio = ''
  subTaskDialog.visible = true
}

const handleEditSubTask = (task: any, project: any) => {
  subTaskDialog.title = '编辑子任务'
  Object.assign(subTaskForm, task)
  subTaskForm.useRel = !!task.relId
  // 回绑逻辑：子任务有值用子任务，缺失则继承计划
  subTaskForm.script = task.script ?? task.msg ?? project.script ?? ''
  subTaskForm.subtitleSelector = Number(task.subtitleSelector ?? project.subtitleSelector ?? 1)
  subTaskForm.colour = 'yellow'
  
  // 回填角标：根据 corner_mark_id 找到对应项，或继承计划
  const cornerMarkId = task.cornerMarkId || task.corner_mark_id || ''
  subTaskForm.cornerMark = cornerMarkId || (project.cornerMark ?? '')
  
  // 确保所有字段有默认值
  if (!subTaskForm.digital_human_id) subTaskForm.digital_human_id = ''
  if (!subTaskForm.digital_human_name) subTaskForm.digital_human_name = task.digitalHuman || ''
  if (!subTaskForm.digital_human_cover_url) subTaskForm.digital_human_cover_url = task.humanImg || ''
  if (!subTaskForm.voice_id) subTaskForm.voice_id = ''
  if (!subTaskForm.voice_name) subTaskForm.voice_name = task.voice || ''
  if (!subTaskForm.voice_url) subTaskForm.voice_url = task.voiceAudio || ''
  if (!subTaskForm.base_voice_url) subTaskForm.base_voice_url = task.voiceAudio || ''
  if (typeof subTaskForm.subtitleSelector === 'undefined' || subTaskForm.subtitleSelector === null) subTaskForm.subtitleSelector = Number(project.subtitleSelector ?? 1)
  if (!subTaskForm.colour) subTaskForm.colour = project.colour ?? 'white'
  subTaskDialog.visible = true
}

const handleDeleteSubTask = (task: any, project: any) => {
  ElMessageBox.confirm('确定删除此子任务?', '提醒').then(async () => {
    try {
      const res = await deletePlanVideoTask(task.id)
      const apiData = res.data
      if (apiData && apiData.code === 200) {
        project.subTasks = project.subTasks.filter((t: any) => t.id !== task.id)
        ElMessage.success('任务已删除')
      } else {
        ElMessage.error(apiData?.message || '删除失败')
      }
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 获取脚本库数据
const fetchScriptLibrary = async () => {
  try {
    const res = await getScriptPaginateList(1, 100)
    console.log('脚本库原始响应:', res)
    
    // res 是 axios response，res.data 是后端 API 返回 { code, data: {...}, message }
    const apiData = res.data
    if (apiData && apiData.code === 200 && apiData.data) {
      const pageData = apiData.data
      // pageData 中的 data 字段是列表数组
      if (pageData.data && Array.isArray(pageData.data)) {
        scriptLibrary.value = pageData.data.map((item: any) => ({
          scriptId: item.scriptId,
          title: item.scriptTitle || item.title || '',
          content: item.scriptContent || item.content || '',
          tags: item.scriptTags || item.tags || [],
          createTime: item.scriptCreateTime || item.createTime || '',
          editTime: item.scriptEditTime || item.editTime || '',
          createUserId: item.scriptCreateUserId,
          userGroupCode: item.scriptUserGroupCode
        }))
        console.log('脚本库已加载，共', scriptLibrary.value.length, '条:', scriptLibrary.value)
      } else {
        scriptLibrary.value = []
        console.warn('脚本库数据数组为空')
      }
    } else {
      scriptLibrary.value = []
      console.warn('脚本库返回数据结构不正常:', apiData)
    }
  } catch (error) {
    console.error('获取脚本库失败:', error)
    scriptLibrary.value = []
    ElMessage.error('获取脚本库失败: ' + (error as any)?.message)
  }
}

// 获取历史脚本数据
const fetchScriptHistory = async () => {
  try {
    const res = await getScriptHistoryList(1, 100)
    console.log('历史脚本原始响应:', res)
    
    // res 是 axios response，res.data 是后端 API 返回 { code, data: {...}, message }
    const apiData = res.data
    if (apiData && apiData.code === 200 && apiData.data) {
      const pageData = apiData.data
      // pageData 中的 data 字段是列表数组
      if (pageData.data && Array.isArray(pageData.data)) {
        scriptHistory.value = pageData.data.map((item: any) => ({
          scriptId: item.taskId || item.scriptId,
          title: item.scriptTitle || item.title || '',
          content: item.taskContent || item.scriptContent || item.content || '',
          tags: item.taskTags || item.scriptTags || item.tags || [],
          createTime: item.usedTime || item.scriptCreateTime || item.createTime || '',
          editTime: item.editTime || item.scriptEditTime || '',
          createUserId: item.scriptCreateUserId,
          userGroupCode: item.scriptUserGroupCode
        }))
        console.log('历史脚本已加载，共', scriptHistory.value.length, '条:', scriptHistory.value)
      } else {
        scriptHistory.value = []
        console.warn('历史脚本数据数组为空')
      }
    } else {
      scriptHistory.value = []
      console.warn('历史脚本返回数据结构不正常:', apiData)
    }
  } catch (error) {
    console.error('获取历史脚本失败:', error)
    scriptHistory.value = []
    ElMessage.error('获取历史脚本失败: ' + (error as any)?.message)
  }
}

const openScriptSelector = async (target: any, tab: any = 'library') => {
  scriptSelector.target = target
  scriptSelector.activeTab = tab
  scriptSelector.search = ''
  
  // 根据 tab 加载对应数据
  if (tab === 'library') {
    await fetchScriptLibrary()
  } else {
    await fetchScriptHistory()
  }
  
  scriptSelector.visible = true
}

const handleScriptTabChange = async (tabName: string) => {
  if (tabName === 'library') {
    await fetchScriptLibrary()
  } else if (tabName === 'history') {
    await fetchScriptHistory()
  }
}

const selectScript = (script: any) => {
  if (scriptSelector.target === 'project') {
    projectForm.script = script.content
  } else {
    subTaskForm.script = script.content
  }
  scriptSelector.visible = false
  ElMessage.success('脚本已成功导入')
}

const handleRunTask = async (row: any) => {
  if (Number(row.taskStatus) !== 0) {
    ElMessage.warning('当前任务状态不允许立即执行')
    return
  }

  try {
    // 调用启动任务API
    const res = await startPlanVideoTask(row.id)
    const apiData = res.data
    
    if (apiData && apiData.code === 0) {
      // 更新本地任务状态
      row.status = '执行中'

      // 同步到全局任务中心
      taskStore.addTask({
        taskType: 'VIDEO_TASK',
        subTitle: `任务名称：${row.name}`,
        status: 'running'
      })

      ElMessage.success(`已启动任务: ${row.name}`)
    } else {
      ElMessage.error(apiData?.message || '任务启动失败')
    }
  } catch (error) {
    console.error('启动任务失败:', error)
    ElMessage.error('任务启动失败，请重试')
  }
}

const submitProject = async () => {
  // 必填字段验证
  if (!projectForm.name) {
    ElMessage.warning('请输入计划名称')
    return
  }

  // 构造请求参数（严格按API文档）
  const params: any = {
    plan_name: projectForm.name,
  }
  
  // 添加可选参数
  if (projectForm.id) {
    params.id = projectForm.id
  }
  if (projectForm.script) {
    params.msg = projectForm.script
  }
  if (projectForm.language) {
    params.language = projectForm.language
  }
  
  // 字幕配置
  params.subtitleSelector = projectForm.subtitleSelector || 0
  if (projectForm.subtitleSelector === 1) {
    params.colour = 'yellow'
  }
  
  // 角标配置
  if (projectForm.cornerMark) {
    params.corner_mark_id = projectForm.cornerMark
    const selectedCornerMark = cornerMarkOptions.value.find((item: any) => item.id === projectForm.cornerMark)
    if (selectedCornerMark?.photoUrl) {
      params.corner_mark_url = selectedCornerMark.photoUrl
    }
  }

  // 运行方式配置 (runMode: 1=手动执行, 2=自动执行)
  params.runMode = projectForm.executionMode === 'manual' ? 1 : 2
  if (projectForm.executionMode === 'scheduled' && projectForm.scheduledTime) {
    params.scheduledTime = projectForm.scheduledTime
  }

  console.log('submitProject params:', params)
  
  try {
    const res = await createPlanVideo(params)
    console.log('submitProject response:', res)
    
    const apiData = res.data
    if (apiData && apiData.code === 200) {
      ElMessage.success('保存成功')
      projectDialog.visible = false
      
      // 如果是新增，把返回的ID赋值给表单
      if (apiData.data && apiData.data.id && !projectForm.id) {
        projectForm.id = apiData.data.id
      }
      
      // 刷新列表
      await loadProjectList()
    } else {
      ElMessage.error(apiData?.message || '保存失败')
    }
  } catch (error) {
    console.error('submitProject error:', error)
    ElMessage.error('请求失败：' + (error as any)?.message || '未知错误')
  }
}

const submitSubTask = async () => {
  const taskName = (subTaskForm.name || '').trim()
  if (!taskName) {
    ElMessage.warning('????????')
    return
  }
  if (!subTaskForm.language) {
    ElMessage.warning('???????')
    return
  }
  if (subTaskForm.useRel) {
    if (!subTaskForm.relId) {
      ElMessage.warning('???????')
      return
    }
  } else {
    if (!subTaskForm.digital_human_id) {
      ElMessage.warning('??????')
      return
    }
    if (!subTaskForm.voice_id) {
      ElMessage.warning('?????')
      return
    }
  }

  // ????ID??projectList????????
  const plan = projectList.value.find((p: any) => p.id === currentProject.value.id)
  if (!plan) {
    ElMessage.error('计划信息获取失败')
    return
  }

  // 如果子任务未设置字幕配置，则继承计划的设置
  const subtitleSelector = typeof subTaskForm.subtitleSelector !== 'undefined' ? subTaskForm.subtitleSelector : plan.subtitleSelector
  const colour = subtitleSelector === 1 ? 'yellow' : undefined
  
  // 构造请求参数
  const params: any = {
    title: taskName,
    msg: subTaskForm.script,
    plan_id: plan.id,
    voice_id: subTaskForm.voice_id || '',
    voice_name: subTaskForm.voice_name || '',
    voice_url: subTaskForm.voice_url || '',
    digital_human_id: subTaskForm.digital_human_id || '',
    digital_human_name: subTaskForm.digital_human_name || '',
    digital_human_cover_url: subTaskForm.digital_human_cover_url || '',
    base_voice_url: subTaskForm.base_voice_url || '',
    language: subTaskForm.language,
    speechRate: 1.0,
    anchor_type: 1,
    isSkipRs: 0,
    subtitleSelector: subtitleSelector,
    colour: colour,
    user_group: 'default'
  }
  
  // 只有开启字幕时才处理和提交角标
  if (subtitleSelector === 1) {
    // 角标：子任务优先，回退到计划
    const cornerMarkId = subTaskForm.cornerMark || plan.cornerMark || ''
    if (!cornerMarkId) {
      ElMessage.warning('???????????')
      return
    }
    if (cornerMarkId) {
      const cornerMarkItem = cornerMarkOptions.value.find((item: any) => item.id === cornerMarkId)
      if (cornerMarkItem?.photoUrl) {
        params.corner_mark_id = cornerMarkId
        params.corner_mark_url = cornerMarkItem.photoUrl
      }
    }
  }

  // 添加ID（如果是更新）
  if (subTaskForm.id) {
    params.id = subTaskForm.id
  }

  try {
    const res = await createPlanVideoTask(params)
    const apiData = res.data
    if (apiData && apiData.code === 200) {
      ElMessage.success('任务保存成功')
      subTaskDialog.visible = false
      
      // 如果是新增，把返回的ID赋值给表单
      if (apiData.data && apiData.data.id && !subTaskForm.id) {
        subTaskForm.id = apiData.data.id
      }
      
      // 更新本地任务列表
      const tasks = currentProject.value.subTasks
      const idx = tasks.findIndex((t: any) => t.id === subTaskForm.id)
      const taskData = { 
        ...subTaskForm, 
        executeTime: '待定', 
        status: '未执行',
        taskStatus: '0',
        statusType: 'info',
        statusPercent: 0
      }
      if (idx > -1) {
        tasks[idx] = taskData
      } else {
        tasks.push(taskData)
      }
      
      // 重新加载子任务列表以确保数据同步
      await loadSubTaskList(plan.id)
    } else {
      ElMessage.error(apiData?.message || '任务保存失败')
    }
  } catch (e) {
    ElMessage.error('任务保存失败')
  }
}

// ===== 页面加载时获取列表数据 =====
const loadProjectList = async () => {
  try {
    console.log('开始加载计划列表...')
    const res = await getPlanVideoList(planPage.value, planPageSize.value, {})
    console.log('计划列表原始响应:', res)
    
    // res 是整个 axios response，res.data 是后端返回的 API 数据
    const apiData = res.data
    if (apiData.code === 200) {
      let data = []
      
      // 后端返回的结构：{ code, message, data: { page, pageSize, data: [...], total } }
      if (apiData.data && apiData.data.data && Array.isArray(apiData.data.data)) {
        data = apiData.data.data
        planTotal.value = apiData.data.total || 0
      } else if (apiData.data && Array.isArray(apiData.data)) {
        data = apiData.data
      }
      
      // 映射字段名称，适配后端返回的字段格式
      projectList.value = data.map((item: any) => ({
        id: item.id,
        name: item.planName || item.name || '',
        createTime: item.createTime || '',
        startTime: item.runTime || '',
        endTime: item.endTime || '',
        runMode: item.runMode ?? item.run_mode ?? '1',
        runTime: item.runTime ?? item.run_time ?? '',
        taskStatus: item.taskStatus,
        status: item.taskStatus === '0' ? '未执行' : item.taskStatus === '1' ? '执行中' : '已完成',
        taskCount: Number(item.size ?? item.taskCount ?? (Array.isArray(item.subTasks) ? item.subTasks.length : 0)),
        language: item.language || '',
        script: item.msg || '',
        executionMode: String(item.runMode ?? item.run_mode) === '2' ? 'scheduled' : 'manual',
        scheduledTime: item.runTime ?? item.run_time ?? '',
        subtitleSelector: item.subtitleSelector || 0,
        colour: item.colour || 'white',
        cornerMark: item.cornerMarkId || item.corner_mark_id || '',
        cornerMarkId: item.cornerMarkId || item.corner_mark_id || '',
        cornerMarkUrl: item.cornerMarkUrl || item.corner_mark_url || '',
        subTasks: [] // 初始化时为空，需要通过详情接口获取
      }))
      
      console.log('计划列表已加载:', projectList.value)
    } else {
      ElMessage.error(apiData?.message || apiData?.msg || '加载列表失败')
    }
  } catch (error) {
    console.error('加载计划列表失败:', error)
    ElMessage.error('加载列表失败: ' + (error as any)?.message)
  }
}

// 搜索/查询计划
const handleSearch = async () => {
  try {
    planPage.value = 1
    const search = searchKeyword.value ? { planName: searchKeyword.value } : {}
    const res = await getPlanVideoList(planPage.value, planPageSize.value, search)
    
    const apiData = res.data
    if (apiData.code === 200) {
      let data = []
      
      if (apiData.data && apiData.data.data && Array.isArray(apiData.data.data)) {
        data = apiData.data.data
        planTotal.value = apiData.data.total || 0
      } else if (apiData.data && Array.isArray(apiData.data)) {
        data = apiData.data
      }
      
      projectList.value = data.map((item: any) => ({
        id: item.id,
        name: item.planName || item.name || '',
        createTime: item.createTime || '',
        startTime: item.runTime || '',
        endTime: item.endTime || '',
        runMode: item.runMode ?? item.run_mode ?? '1',
        runTime: item.runTime ?? item.run_time ?? '',
        taskStatus: item.taskStatus,
        status: item.taskStatus === '0' ? '未执行' : item.taskStatus === '1' ? '执行中' : '已完成',
        taskCount: Number(item.size ?? item.taskCount ?? (Array.isArray(item.subTasks) ? item.subTasks.length : 0)),
        language: item.language || '',
        script: item.msg || '',
        executionMode: String(item.runMode ?? item.run_mode) === '2' ? 'scheduled' : 'manual',
        scheduledTime: item.runTime ?? item.run_time ?? '',
        subtitleSelector: item.subtitleSelector || 0,
        colour: item.colour || 'white',
        cornerMark: item.cornerMarkId || item.corner_mark_id || '',
        cornerMarkId: item.cornerMarkId || item.corner_mark_id || '',
        cornerMarkUrl: item.cornerMarkUrl || item.corner_mark_url || '',
        subTasks: []
      }))
    } else {
      ElMessage.error(apiData?.message || apiData?.msg || '搜索失败')
    }
  } catch (error) {
    console.error('搜索计划失败:', error)
    ElMessage.error('搜索失败')
  }
}

// 监视脚本选择器的 tab 变化
watch(
  () => scriptSelector.activeTab,
  async (newTab) => {
    if (!scriptSelector.visible) return
    console.log('脚本选择器 tab 变化:', newTab)
    if (newTab === 'library') {
      await fetchScriptLibrary()
    } else if (newTab === 'history') {
      await fetchScriptHistory()
    }
  }
)

// 页面挂载时加载数据
onMounted(() => {
  console.log('组件已挂载，开始加载数据')
  loadProjectList()
  // 预加载脚本库和历史脚本
  fetchScriptLibrary()
  fetchScriptHistory()
  // 预加载数字人、配音和绑定关系列表
  loadDigitalHumanList()
  loadVoiceList()
  loadBindingList()
  // 预加载角标列表
  fetchCornerMarks()
})
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
