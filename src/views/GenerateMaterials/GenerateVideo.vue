<template>
  <div class="generate-video p-6 bg-gray-50 min-h-full">
    <!-- 列表页面 -->
    <div v-if="!showCreate" class="max-w-[1200px] mx-auto">
      <!-- 顶部标题 -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-800">视频单次生成</h2>
          <p class="text-xs text-gray-400 mt-1">快速配置并制作单个高质量视频素材</p>
        </div>
        <el-button type="primary" size="large" @click="handleCreateNew">
          <el-icon class="mr-2"><el-icon-plus /></el-icon>
          创建视频
        </el-button>
      </div>

      <!-- 任务列表 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <!-- 搜索和批量操作 -->
        <div class="mb-6 flex items-center justify-between gap-4">
          <div class="flex-1 max-w-md">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索视频标题或ID..." 
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="flex items-center gap-2">
            <el-button 
              type="primary" 
              :disabled="selectedVideos.length === 0"
              @click="batchDownloadVideos"
            >
              批量下载视频 ({{ selectedVideos.length }})
            </el-button>
            <el-button 
              type="success" 
              :disabled="selectedVideos.length === 0"
              @click="batchDownloadAudios"
            >
              批量下载音频 ({{ selectedVideos.length }})
            </el-button>
          </div>
        </div>

        <el-table 
          :data="filteredVideoList" 
          border 
          style="width: 100%" 
          header-cell-class-name="bg-gray-50 font-bold text-gray-700"
          @selection-change="selectedVideos = $event"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="视频预览" width="140" align="center">
            <template #default="scope">
              <div v-if="scope.row.videoCoverUrl" class="relative group cursor-pointer" @click="handleViewVideo(scope.row)">
                <img :src="scope.row.videoCoverUrl" class="w-28 h-16 object-cover rounded-lg border border-gray-200 group-hover:shadow-lg transition-shadow">
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <i class="el-icon-video-play text-white text-xl"></i>
                </div>
              </div>
              <div v-else class="w-28 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                <i class="el-icon-picture text-xl"></i>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="视频信息" min-width="250">
            <template #default="scope">
              <div class="flex items-center gap-3 py-1">
                <div>
                  <div class="font-bold text-gray-800 line-clamp-1">{{ scope.row.title || scope.row.script?.substring(0, 30) }}...</div>
                  <div class="text-xs text-gray-400">ID: {{ scope.row.id }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="任务状态" width="140" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.taskStatus)" :effect="scope.row.taskStatus === '5' ? 'light' : 'plain'">
                {{ getStatusLabel(scope.row.taskStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180" align="center">
            <template #default="scope">
              <span class="text-sm">{{ scope.row.createTime }}</span>
            </template>
          </el-table-column>
          <el-table-column label="完成时间" width="180" align="center">
            <template #default="scope">
              <span v-if="scope.row.taskStatus === '5'" class="text-sm">{{ scope.row.updateTime }}</span>
              <span v-else class="text-gray-400 text-sm">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" plain @click="handleViewVideo(scope.row)">查看</el-button>
              <el-button type="danger" size="small" plain @click="handleDeleteVideo(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建/编辑页面 -->
    <div v-else class="max-w-[1400px] mx-auto">
      <!-- 顶部导航 -->
      <div class="mb-6">
        <el-button @click="showCreate = false" icon="el-icon-arrow-left">返回列表</el-button>
      </div>

      <!-- 顶部标题 -->
      <div class="bg-white p-5 rounded-xl shadow-sm flex items-center justify-center relative border border-gray-100 mb-6">
        <div class="text-center">
          <h2 class="text-xl font-bold text-gray-800">视频单次生成</h2>
          <p class="text-xs text-gray-400 mt-1">快速配置并制作单个高质量视频素材</p>
        </div>
      </div>

      <div class="flex gap-6">
      <!-- 左侧制作区 -->
      <div class="flex-1 space-y-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
          <h3 class="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
             <i class="el-icon-setting text-blue-500"></i>制作配置
          </h3>

          <el-form :model="videoForm" label-width="100px" label-position="top">
            <!-- 渠道与数字人 -->
            <el-row :gutter="40">
              <el-col :span="24">
                <el-form-item label="生成渠道" required>
                  <div class="flex gap-4 p-1 bg-gray-50 rounded-xl w-fit">
                    <div 
                      class="px-6 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-2 border-2 bg-white border-blue-500 shadow-sm text-blue-600"
                      @click="videoForm.channel = 'A2E'"
                    >
                      <span class="font-bold">默认</span>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="40" class="mt-4">
              <el-col :span="12">
                <el-form-item required>
                  <template #label>
                    <div class="flex items-center gap-2">
                      <span>数字人形象</span>
                      <span class="text-xs text-gray-400">{{ humanOptions.length }} 个</span>
                    </div>
                  </template>
                  <!-- 数字人选择器 -->
                  <el-input 
                    v-model="videoForm.digitalHuman" 
                    placeholder="点击搜索选择形象"
                    readonly
                    style="cursor: pointer;"
                    clearable
                    @clear="videoForm.digitalHuman = ''"
                    @click="openHumanSelector"
                  >
                    <template #prepend>选择形象</template>
                    <template #append>
                      <el-button icon="el-icon-search" @click.stop="openHumanSelector" />
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item required>
                  <template #label>
                    <div class="flex items-center gap-2">
                      <span>配音声音</span>
                      <span class="text-xs text-gray-400">{{ voiceOptions.length }} 个</span>
                    </div>
                  </template>
                  <!-- 配音选择器 -->
                  <div class="flex gap-2">
                    <el-input 
                      v-model="videoForm.voice" 
                      placeholder="点击搜索选择配音"
                      readonly
                      style="cursor: pointer;"
                      clearable
                      @clear="videoForm.voice = ''"
                      @click="openVoiceSelector"
                      class="flex-1"
                    >
                      <template #prepend>选择配音</template>
                      <template #append>
                        <el-button icon="el-icon-search" @click.stop="openVoiceSelector" />
                      </template>
                    </el-input>
                    <el-button v-if="videoForm.voice" type="primary" plain icon="el-icon-headset" @click="playVoice(videoForm.voice)">试听</el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="40" class="mt-2">
              <el-col :span="24">
                <el-form-item label="快捷预设 (绑定关系)">
                  <!-- 快捷预设选择器 -->
                  <div class="flex gap-2">
                    <el-input 
                      v-model="relName" 
                      placeholder="点击搜索选择预设" 
                      readonly 
                      style="cursor: pointer;"
                      clearable
                      @clear="videoForm.relId = ''; relName = ''"
                      @click="openRelSelector"
                      class="flex-1"
                    >
                      <template #prepend>选择预设</template>
                      <template #append>
                        <el-button icon="el-icon-search" @click.stop="openRelSelector" />
                      </template>
                    </el-input>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="40" class="mt-4">
              <el-col :span="12">
                <el-form-item label="启用字幕">
                  <el-switch 
                    v-model="videoForm.subtitleSelector" 
                    :active-value="1" 
                    :inactive-value="0"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="视频语言">
                  <el-select v-model="videoForm.language" placeholder="请选择语言种类" class="w-full">
                    <el-option label="自动识别" value="auto" />
                    <el-option label="中文" value="zh" />
                    <el-option label="英文" value="en" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 字幕颜色选择（启用字幕时显示） -->
            <el-row :gutter="40" class="mt-4" v-if="videoForm.subtitleSelector === 1">
              <el-col :span="12">
                <el-form-item label="字幕颜色">
                  <div class="flex gap-3">
                    <div 
                      @click="videoForm.subtitleColor = 'white'"
                      class="w-12 h-12 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center"
                      :class="videoForm.subtitleColor === 'white' ? 'border-blue-500 bg-white shadow-md' : 'border-gray-300 bg-white'"
                      title="白色"
                    >
                      <span class="text-sm text-gray-800">白</span>
                    </div>
                    <div 
                      @click="videoForm.subtitleColor = 'yellow'"
                      class="w-12 h-12 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center"
                      :class="videoForm.subtitleColor === 'yellow' ? 'border-blue-500 bg-yellow-300 shadow-md' : 'border-gray-300 bg-yellow-300'"
                      title="黄色"
                    >
                      <span class="text-sm text-gray-800">黄</span>
                    </div>
                    <div 
                      @click="videoForm.subtitleColor = 'black'"
                      class="w-12 h-12 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center"
                      :class="videoForm.subtitleColor === 'black' ? 'border-blue-500 bg-black shadow-md' : 'border-gray-300 bg-black'"
                      title="黑色"
                    >
                      <span class="text-sm text-white">黑</span>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <div class="text-[11px] text-gray-400 -mt-2 mb-4 italic">
                    <i class="el-icon-info"></i> 说明：选择预设后将自动覆盖上方的形象和配音选择。
                </div>
              </el-col>
            </el-row>

            <!-- 标题部分 -->
            <div class="mt-8">
              <el-form-item label="视频标题" required>
                <el-input 
                  v-model="videoForm.title" 
                  placeholder="请输入视频标题（如：产品介绍、教程等）"
                  maxlength="100"
                  show-word-limit
                  clearable
                />
              </el-form-item>
            </div>

            <!-- 文案部分 -->
            <div class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-600 text-sm font-bold flex items-center gap-1">
                  视频文案内容 <span class="text-red-500">*</span>
                </span>
                <div class="flex gap-2">
                  <el-button size="mini" plain @click="openScriptSelector('library')">文案库导入</el-button>
                  <el-button size="mini" plain @click="openScriptSelector('history')">历史文案</el-button>
                </div>
              </div>
              <el-input
                type="textarea"
                v-model="videoForm.script"
                placeholder="请输入视频解说文案（建议300-500字以获得最佳生成效果）"
                :rows="12"
                class="script-input"
              />
              <div class="flex justify-between items-center mt-3">
                <div class="text-[11px] text-gray-400">
                   当前字数：<span class="text-blue-500 font-bold">{{ videoForm.script.length }}</span> / 2000
                </div>
                <el-button size="mini" plain type="success" :disabled="!videoForm.script" @click="openSaveScriptDialog" icon="el-icon-folder-add">
                  转存至文案库
                </el-button>
              </div>
            </div>

            <div class="mt-10 flex flex-col items-center border-t border-gray-50 pt-8 gap-4">
               <el-button 
                 type="primary" 
                 size="large" 
                 class="!w-48 !h-12 !font-bold rounded-xl shadow-lg shadow-blue-100"
                 :loading="isGenerating"
                 :disabled="isGenerating"
                 icon="el-icon-video-play"
                 @click="startGeneration"
               >
                 {{ isGenerating ? '正在生成视频...' : '立即生成视频' }}
               </el-button>
            </div>
          </el-form>
        </div>
      </div>

      <!-- 右侧预览与结果区 -->
      <div class="w-[320px] space-y-6">
        <!-- 实时预览预览图 -->
        <div v-if="currentDisplayImg" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
           <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
             <i class="el-icon-view text-orange-500"></i>形象展示
          </h3>
          <div class="aspect-[3/4] bg-black rounded-lg overflow-hidden relative group shadow-inner">
             <img :src="currentDisplayImg" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
             
             <!-- 声音播放动画 -->
             <div v-if="isPlaying" class="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 h-8 items-end">
                <div v-for="i in 8" :key="i" class="w-1.5 bg-blue-400 rounded-full animate-bounce" :style="{ height: (Math.random() * 20 + 10) + 'px', animationDelay: (i * 0.1) + 's' }"></div>
             </div>

             <!-- 遮罩/提示 -->
             <div class="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur p-3 rounded-lg border border-white/10">
                <p class="text-[12px] text-white/90">当前选择：{{ videoForm.digitalHuman }}</p>
                <p class="text-[10px] text-white/50">配音：{{ videoForm.voice || '未配置' }}</p>
             </div>
          </div>
        </div>

        <!-- 任务状态与历史 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
           <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <el-icon class="text-green-500"><el-icon-clock /></el-icon>执行状态
          </h3>
          
          <div v-if="isGenerating" class="py-10 text-center animate-fade-in">
             <el-progress type="circle" :percentage="genProgress" status="success" :stroke-width="10"></el-progress>
             <p class="mt-4 text-sm font-bold text-gray-600">{{ genStage }}</p>
             <p class="text-xs text-gray-400 mt-2">素材上传中 -> 逻辑合成 -> 最终渲染</p>
          </div>

          <div v-else-if="resultVideo" class="animate-fade-in">
             <div class="bg-green-50 border border-green-100 rounded-xl p-5 mb-4">
                <div class="flex items-center gap-3 text-green-700">
                   <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                      <i class="el-icon-check"></i>
                   </div>
                   <div>
                      <h4 class="font-bold text-sm">视频生成成功</h4>
                      <p class="text-[10px] opacity-70">生成耗时：2分15秒</p>
                   </div>
                </div>
             </div>
             <div class="grid grid-cols-2 gap-3">
                <el-button type="primary" class="w-full !rounded-lg" icon="el-icon-view" @click="previewResult">立即预览</el-button>
                <el-button type="success" plain class="w-full !rounded-lg" icon="el-icon-download" @click="downloadResult">保存到本地</el-button>
             </div>
          </div>

          <div v-else class="py-20 text-center text-gray-300">
             <i class="el-icon-magic-stick text-5xl opacity-30"></i>
             <p class="mt-4 text-xs">配置后点击下方生成的按钮开始制作</p>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 文案库/历史记录选择器 -->
    <el-dialog :title="scriptSelector.title" v-model="scriptSelector.visible" width="900px" append-to-body @open="onDialogOpen">
      <!-- 库模式 -->
      <div v-if="scriptSelector.mode === 'library'" class="space-y-4">
        <div class="mb-4 flex items-center gap-4">
          <el-input 
            placeholder="按标签搜索..." 
            v-model="scriptSelector.search" 
            size="small" 
            style="width: 320px"
            clearable
          >
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
          <div class="flex gap-2 flex-wrap">
            <el-tag 
              v-for="tag in allScriptTags" 
              :key="tag" 
              size="mini" 
              effect="plain" 
              class="cursor-pointer hover:bg-blue-50"
              @click="scriptSelector.search = tag"
            >{{ tag }}</el-tag>
          </div>
        </div>
        
        <el-table :data="currentScripts" height="400px" border :header-cell-style="{ background: '#f8fafc' }">
          <el-table-column prop="title" label="文案标题" width="180" />
          <el-table-column label="标签分类" width="200">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-1">
                <el-tag v-for="tag in row.tags" :key="tag" size="mini" effect="plain" type="info">{{ tag }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="文案内容" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="mini" text @click="selectScript(row)">选入文案</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 历史模式 -->
      <div v-else class="space-y-4">
        <div class="mb-4">
          <el-input 
            placeholder="按标题、内容或标签搜索..." 
            v-model="scriptSelector.search" 
            size="small" 
            style="width: 320px"
            clearable
          >
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div class="max-h-96 overflow-y-auto space-y-3">
          <div 
            v-for="script in currentScripts" 
            :key="script.id"
            class="p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
            @click="selectScript(script)"
          >
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-600 line-clamp-3 break-words">{{ script.content }}</div>
              </div>
              <el-button type="primary" size="small" plain class="flex-shrink-0">导入</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 保存到文案库弹窗 -->
    <el-dialog title="保存至文案库" v-model="saveScriptDialog.visible" width="450px" append-to-body>
      <el-form :model="saveScriptDialog.form" label-width="80px">
        <el-form-item label="文案标题" required>
          <el-input v-model="saveScriptDialog.form.title" placeholder="如：XX产品带货解说词" />
        </el-form-item>
        <el-form-item label="分类标签">
          <div class="flex flex-wrap gap-2 mb-2">
            <el-tag v-for="(tag, index) in saveScriptDialog.form.tags" :key="index" closable size="small" @close="saveScriptDialog.form.tags.splice(index, 1)">{{ tag }}</el-tag>
          </div>
          <el-input v-model="saveScriptDialog.form.newTag" placeholder="输入回车确认" size="small" @keyup.enter="addTag">
            <template #append><el-button @click="addTag">添加</el-button></template>
          </el-input>
        </el-form-item>
        <el-form-item label="内容预览">
          <div class="text-[11px] text-gray-500 bg-gray-50 p-2 rounded max-h-24 overflow-y-auto italic">
            {{ videoForm.script }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveScriptDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveScript">确认存入</el-button>
      </template>
    </el-dialog>

    <!-- 数字人形象选择器 -->
    <el-dialog title="选择数字人形象" v-model="humanSelectorDialog.visible" width="1000px" append-to-body>
      <div class="space-y-4">
        <div class="flex gap-2">
          <el-input placeholder="搜索数字人..." v-model="humanSelectorDialog.search" size="small" style="width: 300px;" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div 
          class="grid grid-cols-5 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[500px] overflow-y-auto"
          @scroll="handleHumanScroll"
        >
          <div 
            v-for="item in humanSelectorDialog.displayList" 
            :key="item.name"
            class="relative cursor-pointer group text-center"
            @click="selectHuman(item)"
          >
            <div 
              class="aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all shadow-sm"
              :class="videoForm.digitalHuman === item.name 
                ? 'border-blue-500 shadow-lg shadow-blue-300/50' 
                : 'border-blue-300 group-hover:border-blue-400 group-hover:shadow-md'"
            >
              <img 
                :src="item.img" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                @error="(e: any) => e.target.src = 'https://via.placeholder.com/150x200?text=Error'"
              >
            </div>
            <div class="mt-2">
              <p class="text-xs text-gray-700 font-medium truncate">{{ item.name }}</p>
              <p class="text-[10px] text-gray-500">{{ item.gender === 'male' ? '男' : '女' }}</p>
            </div>
            <div v-if="videoForm.digitalHuman === item.name" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
        </div>
        <div v-if="humanSelectorDialog.loading" class="text-center py-4">
          <el-loading-icon></el-loading-icon> 加载中...
        </div>
      </div>
    </el-dialog>

    <!-- 配音选择器 -->
    <el-dialog title="选择配音声音" v-model="voiceSelectorDialog.visible" width="800px" append-to-body>
      <div class="space-y-4">
        <div class="flex gap-2">
          <el-input placeholder="搜索配音..." v-model="voiceSelectorDialog.search" size="small" style="width: 300px;" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div 
          class="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[500px] overflow-y-auto"
          @scroll="handleVoiceScroll"
        >
          <div 
            v-for="item in voiceSelectorDialog.displayList" 
            :key="item.name"
            class="p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between"
            :class="videoForm.voice === item.name 
              ? 'border-blue-500 bg-blue-100 shadow-md' 
              : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50'"
            @click="selectVoice(item)"
          >
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <i class="el-icon-headset text-blue-500"></i>
              <p class="text-xs text-gray-700 font-medium truncate">{{ item.name }}</p>
            </div>
            <el-button 
              type="text" 
              icon="el-icon-headset" 
              size="small" 
              class="!text-blue-500 flex-shrink-0"
              @click.stop="playVoice(item.name)"
            ></el-button>
            <i v-if="videoForm.voice === item.name" class="el-icon-check text-blue-500 text-sm ml-1"></i>
          </div>
        </div>
        <div v-if="voiceSelectorDialog.loading" class="text-center py-4">
          <el-loading-icon></el-loading-icon> 加载中...
        </div>
      </div>
    </el-dialog>

    <!-- 快捷预设选择器 -->
    <el-dialog title="选择快捷预设" v-model="relSelectorDialog.visible" width="900px" append-to-body>
      <div class="space-y-4">
        <div class="flex gap-2">
          <el-input 
            v-model="relSelectorDialog.search"
            placeholder="输入预设信息..."
            style="max-width: 600px"
            clearable
          >
            <template #prepend>搜索预设</template>
          </el-input>
          <el-button 
            type="danger"
            plain
            @click="clearRelSelection"
          >
            清空选择
          </el-button>
        </div>
        <div 
          class="grid grid-cols-4 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[500px] overflow-y-auto"
          @scroll="handleRelScroll"
        >
          <div 
            v-for="item in relSelectorDialog.displayList" 
            :key="item.id"
            class="rounded-lg border-2 cursor-pointer transition-all overflow-hidden flex flex-col justify-between relative group"
            :class="videoForm.relId === item.id 
              ? 'border-blue-500 shadow-lg shadow-blue-300/50' 
              : 'border-blue-300 hover:border-blue-400 hover:shadow-md'"
            @click="selectRel(item)"
          >
            <!-- 数字人封面图 -->
            <div v-if="item.digitalHumanCoverUrl" class="w-full aspect-[3/4] overflow-hidden bg-gray-200 relative">
              <img 
                :src="item.digitalHumanCoverUrl" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                @error="(e: any) => e.target.src = 'https://via.placeholder.com/150x200?text=Error'"
              >
            </div>
            <!-- 预设名称和试听 -->
            <div class="p-3 bg-white">
              <p class="text-xs text-gray-700 font-medium line-clamp-2 mb-2">{{ item.name }}</p>
              <div class="flex items-center justify-center pt-2 border-t border-blue-200">
                <el-button type="text" size="small" icon="el-icon-headset" class="!text-blue-500 !p-0" @click.stop="playVoice(item.voice)">试听</el-button>
              </div>
            </div>
            <!-- 选中标记 -->
            <div v-if="videoForm.relId === item.id" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
        </div>
        <div v-if="relSelectorDialog.loading" class="text-center py-4">
          <el-loading-icon></el-loading-icon> 加载中...
        </div>
      </div>
    </el-dialog>

    <!-- 视频播放弹窗 -->
    <el-dialog title="视频详情预览" v-model="videoPreview.visible" width="1000px" append-to-body custom-class="video-preview-dialog">
       <div class="space-y-6">
          <!-- 视频预览 -->
          <div v-if="videoPreview.url" class="space-y-3">
             <div class="flex items-center justify-between">
               <h4 class="font-bold text-gray-800 text-base flex items-center gap-2">
                 <span class="text-blue-500">🎬</span>视频内容
               </h4>
               <el-button type="primary" size="small" @click="downloadVideo" :icon="ElIcon.Download">
                 下载视频
               </el-button>
             </div>
             <div class="bg-black flex items-center justify-center rounded-lg overflow-hidden h-[500px] border-2 border-blue-100">
                <video :src="videoPreview.url" controls autoplay class="max-w-full max-h-full"></video>
             </div>
          </div>
          
          <!-- 预览图 -->
          <div v-if="videoPreview.coverUrl" class="space-y-3">
             <h4 class="font-bold text-gray-800 text-base flex items-center gap-2">
               <span class="text-yellow-500">🖼️</span>视频封面
             </h4>
             <img :src="videoPreview.coverUrl" class="w-full max-h-[300px] object-contain rounded-lg border-2 border-yellow-100">
          </div>
          
          <!-- 配音试听 -->
          <div v-if="videoPreview.voiceUrl" class="space-y-3">
             <div class="flex items-center justify-between">
               <h4 class="font-bold text-gray-800 text-base flex items-center gap-2">
                 <span class="text-green-500">🎵</span>配音试听
               </h4>
               <el-button type="success" size="small" @click="downloadAudio" :icon="ElIcon.Download">
                 下载音频
               </el-button>
             </div>
             <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-100">
               <audio :src="videoPreview.voiceUrl" controls class="w-full h-10"></audio>
             </div>
          </div>
       </div>
       
       <!-- 对话框底部按钮 -->
       <template #footer>
         <div class="flex justify-end gap-2">
           <el-button @click="videoPreview.visible = false">关闭</el-button>
         </div>
       </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as ElIcon from '@element-plus/icons-vue'
import { Search } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import { useTaskStore } from '/@/store/modules/task'
import { createVideoTask, getVideoTaskList, deleteVideoTask, getVoiceList, getDigitalHumanList, getVideoTaskDetail, getBindingList, getScriptPaginateList, getScriptHistoryList, createScript } from '/@/api/material'

// --- 数据定义 ---
const taskStore = useTaskStore()

// 页面状态
const showCreate = ref(false)

// 任务列表
const videoTaskList = ref<any[]>([])
const searchKeyword = ref('')
const selectedVideos = ref<any[]>([])
const filteredVideoList = computed(() => {
  return videoTaskList.value
})

const videoForm = reactive({
  title: '',
  channel: 'A2E',
  relId: '',
  digitalHuman: '',
  voice: '',
  script: '',
  language: 'auto',
  subtitleSelector: 0,  // 字幕启用状态，0-关闭，1-开启
  subtitleColor: 'white',  // 字幕颜色，white-白色，yellow-黄色，black-黑色
  previewImg: ''  // 预设选择时的预览图
})

const relList = ref<any[]>([])
const voiceSearchInput = ref('')  // 配音搜索框
const digitalHumanSearchInput = ref('')  // 数字人搜索框

// 模拟数据 - 如果需要保留默认选项
const defaultRelList = [
  { id: 1, name: '夏季服装场景 (小美 + 甜美)', human: '小美', voice: '甜美女声' },
  { id: 2, name: '专业测评场景 (阿强 + 磁性)', human: '阿强', voice: '磁性男声' }
]

// 数字人选项列表（从API获取）
const humanOptions = ref<any[]>([])
const humanSearch = ref('')  // 数字人搜索框

// 配音选项列表（从API获取）
const voiceOptions = ref<any[]>([])
const voiceSearch = ref('')  // 配音搜索框

// 搜索防抖计时器
let humanSearchTimer: NodeJS.Timeout
let voiceSearchTimer: NodeJS.Timeout

const scriptLibrary = ref<any[]>([])  // 脚本库数据
const scriptHistory = ref<any[]>([])  // 历史脚本数据
const videoTaskRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 获取脚本库数据
const fetchScriptLibrary = async () => {
  try {
    const res = await getScriptPaginateList(1, 100)
    if (res.data) {
      const data = res.data.data?.data || res.data.data || []
      scriptLibrary.value = data.map((item: any) => ({
        id: item.scriptId,
        title: item.scriptTitle,
        content: item.scriptContent,
        tags: Array.isArray(item.scriptTags) ? item.scriptTags : (item.scriptTags ? item.scriptTags.split('|').filter((t: string) => t) : [])
      }))
    }
  } catch (error) {
    console.error('获取脚本库失败:', error)
  }
}

// 获取历史脚本数据
const fetchScriptHistory = async () => {
  try {
    const res = await getScriptHistoryList(1, 100)
    if (res.data) {
      const data = res.data.data?.data || res.data.data || []
      // 直接过滤，去掉重复的 taskId
      const seen = new Set()
      const uniqueData = data.filter((item: any) => {
        if (seen.has(item.taskId)) {
          return false
        }
        seen.add(item.taskId)
        return true
      })
      
      scriptHistory.value = uniqueData.map((item: any) => ({
        id: item.taskId,
        title: item.taskContent.substring(0, 50),
        content: item.taskContent,
        tags: Array.isArray(item.taskTags) ? item.taskTags : []
      }))
    }
  } catch (error) {
    console.error('获取历史脚本失败:', error)
  }
}

// --- 状态控制 ---
const isPlaying = ref(false)
const isGenerating = ref(false)
const genProgress = ref(0)
const genStage = ref('准备就绪')
const resultVideo = ref('')

const scriptSelector = reactive({
  visible: false,
  title: '文案库选择',
  search: '',
  mode: 'library' // 'library' or 'history'
})

// 数字人选择器状态
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

// 配音选择器状态
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

// 快捷预设选择器状态
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

// 快捷预设显示名称
const relName = ref('')

const saveScriptDialog = reactive({
  visible: false,
  form: { title: '', tags: [] as string[], newTag: '' }
})

const videoPreview = reactive({
  visible: false,
  url: '',
  coverUrl: '',
  voiceUrl: '',
  title: ''
})

// 监听关键配置变化，重置配音状态
// --- 逻辑处理 ---

// 加载视频任务列表
const loadVideoTasks = async () => {
  try {
    const response = await getVideoTaskList(1, 20)
    console.log('API返回数据:', response)
    
    // 处理API返回的数据结构：response.data.data.data 是任务列表数组
    let tasks = []
    if (response.data && response.data.data) {
      const data = response.data.data
      // API返回格式：{ page, pageSize, data: [...] }
      if (Array.isArray(data.data)) {
        tasks = data.data
      } else if (Array.isArray(data)) {
        tasks = data
      }
    }
    
    // 映射字段到前端格式
    videoTaskList.value = tasks.map((task: any) => ({
      id: task.id,
      script: task.msg || task.title || '',
      title: task.title || '',
      digitalHuman: task.digitalHuman || task.digital_human || '',
      voice: task.voice || '',
      voiceId: task.voiceId,
      digitalHumanId: task.digitalHumanId,
      createTime: task.createTime ? new Date(task.createTime).toLocaleString('zh-CN') : new Date().toLocaleString(),
      updateTime: task.updateTime ? new Date(task.updateTime).toLocaleString('zh-CN') : '',
      videoUrl: task.videoUrl || task.video_url || '',
      videoCoverUrl: task.videoCoverUrl || task.video_cover_url || '',
      taskStatus: task.taskStatus || '0',
      baseVoiceUrl: task.baseVoiceUrl || task.base_voice_url || ''
    }))
    
    console.log('加载的任务列表:', videoTaskList.value)
  } catch (error) {
    console.error('加载视频任务列表失败:', error)
  }
}

const startVideoTaskAutoRefresh = () => {
  if (videoTaskRefreshTimer.value) return
  videoTaskRefreshTimer.value = setInterval(() => {
    if (!showCreate.value) {
      loadVideoTasks()
    }
  }, 30000)
}

const stopVideoTaskAutoRefresh = () => {
  if (videoTaskRefreshTimer.value) {
    clearInterval(videoTaskRefreshTimer.value)
    videoTaskRefreshTimer.value = null
  }
}

// 加载数字人列表
const loadDigitalHumanList = async (searchName?: string) => {
  try {
    const response = await getDigitalHumanList(searchName)
    console.log('数字人列表API返回:', response)
    
    // 处理API返回的数据结构：response.data 中的 data 字段才是数字人列表数组
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // 映射API返回的数据到前端格式
      humanOptions.value = response.data.data.map((digital: any) => ({
        name: digital.digitalHumanName || digital.name,
        externalId: digital.externalId,
        img: digital.coverUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        videoUrl: digital.videoUrl,
        gender: digital.gender
      }))
      console.log('加载的数字人列表:', humanOptions.value)
    }
  } catch (error) {
    console.error('加载数字人列表失败:', error)
    // 如果加载失败，使用默认数字人列表
    humanOptions.value = [
      { name: '小美', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { name: '阿强', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { name: '露西', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
      { name: '大白', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }
    ]
  }
}

// 数字人搜索处理函数（防抖）
const handleHumanSearch = () => {
  if (humanSearchTimer) clearTimeout(humanSearchTimer)
  humanSearchTimer = setTimeout(() => {
    loadDigitalHumanList(humanSearch.value || undefined)
  }, 300)
}

// 配音搜索处理函数（防抖）
const handleVoiceSearch = () => {
  if (voiceSearchTimer) clearTimeout(voiceSearchTimer)
  voiceSearchTimer = setTimeout(() => {
    loadVoiceList(voiceSearch.value || undefined)
  }, 300)
}

// 加载配音列表
const loadVoiceList = async (searchName?: string) => {
  try {
    const response = await getVoiceList(searchName)
    console.log('配音列表API返回:', response)
    
    // 处理API返回的数据结构：response.data 中的 data 字段才是配音列表数组
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // 映射API返回的数据到前端格式
      voiceOptions.value = response.data.data.map((voice: any) => ({
        name: voice.voiceName || voice.name,
        externalId: voice.externalId,
        url: voice.url
      }))
      console.log('加载的配音列表:', voiceOptions.value)
    }
  } catch (error) {
    console.error('加载配音列表失败:', error)
    // 如果加载失败，使用默认配音列表
    voiceOptions.value = [
      { name: '甜美女声' },
      { name: '磁性男声' },
      { name: '活力少女' },
      { name: '成熟稳重' }
    ]
  }
}

// 加载绑定关系列表
const loadBindingList = async (voiceName?: string, digitalHumanName?: string) => {
  try {
    const searchObj: any = {}
    // 支持通过voiceName和digitalHumanName分别模糊查询
    if (voiceName) {
      searchObj.voiceName = voiceName
    }
    if (digitalHumanName) {
      searchObj.digitalHumanName = digitalHumanName
    }
    
    const response = await getBindingList(1, 50, searchObj)
    console.log('绑定关系列表API返回:', response)
    
    // 处理API返回的数据结构
    if (response.data && response.data.data && response.data.data.data) {
      const bindingData = response.data.data.data
      
      // 映射API返回的数据到前端格式
      relList.value = bindingData.map((binding: any) => ({
        id: binding.id,
        name: `${binding.voiceName} + ${binding.digitalHumanName}`,
        voice: binding.voiceName,
        human: binding.digitalHumanName,
        voiceName: binding.voiceName,
        digitalHumanName: binding.digitalHumanName,
        voiceId: binding.voiceId,
        digitalHumanId: binding.digitalHumanId,
        title: binding.title,
        digitalHumanUrl: binding.digitalHumanUrl,  // 保存视频URL
        digitalHumanCoverUrl: binding.digitalHumanCoverUrl || binding.coverUrl || binding.digitalHumanUrl,  // 数字人封面图
        voiceUrl: binding.voiceUrl
      }))
      console.log('加载的绑定关系列表:', relList.value)
    }
  } catch (error) {
    console.error('加载绑定关系列表失败:', error)
    // 失败时使用默认数据
    relList.value = defaultRelList
  }
}

// 绑定关系搜索处理函数
const handleBindingSearch = () => {
  loadBindingList(voiceSearchInput.value || undefined, digitalHumanSearchInput.value || undefined)
}

// 监听手动选择数字人或配音，清空预设和预览图
watch(() => videoForm.digitalHuman, (newVal, oldVal) => {
  if (newVal && oldVal && videoForm.relId) {
    // 数字人发生改变且预设被选中，说明是手动改变，清空预设
    videoForm.relId = ''
    videoForm.previewImg = ''
  }
})

watch(() => videoForm.voice, (newVal, oldVal) => {
  if (newVal && oldVal && videoForm.relId) {
    // 配音发生改变且预设被选中，说明是手动改变，清空预设
    videoForm.relId = ''
    videoForm.previewImg = ''
  }
})

// 组件挂载时加载任务列表、数字人列表、配音列表和绑定关系列表
onMounted(() => {
  loadVideoTasks()
  loadDigitalHumanList()
  loadVoiceList()
  loadBindingList()
  startVideoTaskAutoRefresh()
})

onUnmounted(() => {
  stopVideoTaskAutoRefresh()
})

watch(showCreate, (val) => {
  if (val) {
    stopVideoTaskAutoRefresh()
  } else {
    loadVideoTasks()
    startVideoTaskAutoRefresh()
  }
})

const handleCreateNew = () => {
  resetForm()
  showCreate.value = true
}

const handleViewVideo = (video: any) => {
  videoPreview.url = video.videoUrl
  videoPreview.coverUrl = video.videoCoverUrl
  videoPreview.voiceUrl = video.baseVoiceUrl
  videoPreview.title = video.title
  videoPreview.visible = true
}

const handleDeleteVideo = async (id: any) => {
  try {
    // 调用API删除视频任务
    await deleteVideoTask(id)
    ElMessage.success('视频已删除')
    // 从列表中移除
    videoTaskList.value = videoTaskList.value.filter(v => v.id !== id)
  } catch (error) {
    ElMessage.error('删除视频失败')
    console.error('删除视频任务失败:', error)
  }
}

// 获取任务状态标签
const getStatusLabel = (status: string | number) => {
  const statusMap: { [key: string]: string } = {
    '0': '等待中',
    '1': '上传中',
    '2': '配音生成中',
    '3': '视频预备中',
    '4': '视频生成中',
    '5': '已完成',
    '-1': '失败'
  }
  return statusMap[String(status)] || '未知'
}

// 获取任务状态类型（用于tag颜色）
const getStatusType = (status: string | number): 'success' | 'danger' | 'warning' | 'info' => {
  const statusStr = String(status)
  if (statusStr === '5') return 'success'           // 已完成 - 绿色
  if (statusStr === '-1') return 'danger'           // 失败 - 红色
  if (statusStr === '0') return 'info'              // 等待中 - 灰色
  if (statusStr === '4') return 'warning'           // 视频生成中 - 橙色
  return 'info'                                      // 其他 - 灰色
}

const resetForm = () => {
  videoForm.title = ''
  videoForm.channel = 'A2E'
  videoForm.relId = ''
  videoForm.digitalHuman = ''
  videoForm.voice = ''
  videoForm.script = ''
  videoForm.language = 'auto'
  videoForm.subtitleSelector = 0
  videoForm.subtitleColor = 'white'
  resultVideo.value = ''
  genProgress.value = 0
}

const getHumanImg = (name: string) => humanOptions.value.find((h: any) => h.name === name)?.img || ''

const handleRelChange = async (val: any) => {
  if (!val) {
    // 清空预设选择
    videoForm.relId = ''
    relName.value = ''
    videoForm.previewImg = ''
    return
  }
  
  const rel = relList.value.find((r: any) => r.id === val)
  if (rel) {
    relName.value = rel.name
    videoForm.digitalHuman = rel.human || rel.digitalHumanName
    videoForm.voice = rel.voice || rel.voiceName
    
    // 从视频首帧提取预览图
    if (rel.digitalHumanUrl) {
      videoForm.previewImg = await extractVideoFirstFrame(rel.digitalHumanUrl)
    }
    
    ElMessage.success(`已应用联动配置: ${rel.digitalHumanName || rel.human} & ${rel.voiceName || rel.voice}`)
  }
}

const playVoice = (name: string) => {
  if (!name) return
  isPlaying.value = true
  ElMessage.success(`正在试听配音: ${name}`)
  setTimeout(() => isPlaying.value = false, 3000)
}

// 从视频首帧提取预览图
const extractVideoFirstFrame = (videoUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    // 处理URL中可能包含的数组标记
    let url = videoUrl
    if (url.startsWith("['")){      url = url.slice(2, -2)
    }
    
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    video.crossOrigin = 'anonymous'
    video.style.display = 'none'
    document.body.appendChild(video)
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      resolve('')
      document.body.removeChild(video)
      return
    }
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      video.currentTime = Math.min(1, video.duration * 0.1)  // 取1秒或视频的10%位置
    }, { once: true })
    
    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
      document.body.removeChild(video)
    }, { once: true })
    
    video.addEventListener('error', () => {
      resolve('')
      document.body.removeChild(video)
    }, { once: true })
    
    video.src = url
  })
}

const openScriptSelector = async (mode: string) => {
  scriptSelector.mode = mode
  scriptSelector.title = mode === 'library' ? '从文案库导入' : '从历史记录选择'
  scriptSelector.search = '' // 重置搜索框
  // 根据 mode 加载数据
  if (mode === 'library') {
    await fetchScriptLibrary()
  } else {
    await fetchScriptHistory()
  }
  scriptSelector.visible = true
}

// 对话框打开时处理
const onDialogOpen = () => {
  scriptSelector.search = ''
}

// 获取所有唯一的标签
const allScriptTags = computed(() => {
  const data = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  const tags = new Set<string>()
  data.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => tags.add(tag))
    }
  })
  return Array.from(tags)
})

const filteredScripts = computed(() => {
  const s = scriptSelector.search.toLowerCase()
  const data = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  
  if (!s) {
    return data
  }
  
  // 文案库按标签搜索，历史文案可以按所有字段搜索
  if (scriptSelector.mode === 'library') {
    return data.filter(item => 
      item.tags && item.tags.some((t: string) => t.toLowerCase().includes(s))
    )
  } else {
    // 历史文案可以按标题、内容、标签搜索
    return data.filter(item => 
      item.title.toLowerCase().includes(s) ||
      item.content.toLowerCase().includes(s) ||
      (item.tags && item.tags.some((t: string) => t.toLowerCase().includes(s)))
    )
  }
})

// 当前显示的形象（computed，确保实时响应）
const currentDisplayImg = computed(() => {
  // 如果有 relId（预设被选中），显示预设的预览图
  if (videoForm.relId && videoForm.previewImg) {
    return videoForm.previewImg
  }
  // 否则显示手动选择的形象
  if (videoForm.digitalHuman) {
    return getHumanImg(videoForm.digitalHuman)
  }
  return ''
})

// 当前模式下的脚本数据（简化版）
const currentScripts = computed(() => {
  const s = scriptSelector.search.toLowerCase().trim()
  const sourceData = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  
  // 搜索为空，返回全部
  if (!s) {
    return sourceData
  }
  
  // 根据模式搜索
  if (scriptSelector.mode === 'library') {
    // 库模式：按标签搜索
    return sourceData.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) return false
      return item.tags.some(t => String(t).toLowerCase().includes(s))
    })
  } else {
    // 历史模式：按标题、内容、标签搜索
    return sourceData.filter(item => {
      const titleMatch = item.title && item.title.toLowerCase().includes(s)
      const contentMatch = item.content && item.content.toLowerCase().includes(s)
      const tagMatch = item.tags && Array.isArray(item.tags) && 
        item.tags.some(t => String(t).toLowerCase().includes(s))
      return titleMatch || contentMatch || tagMatch
    })
  }
})

const selectScript = (script: any) => {
  videoForm.script = script.content
  scriptSelector.visible = false
  ElMessage.success('文案已成功导入')
}

const openSaveScriptDialog = () => {
  saveScriptDialog.form.title = ''
  saveScriptDialog.form.tags = []
  saveScriptDialog.form.newTag = ''
  saveScriptDialog.visible = true
  // 打开后重新加载脚本库
  fetchScriptLibrary()
}

const addTag = () => {
  if (saveScriptDialog.form.newTag) {
    saveScriptDialog.form.tags.push(saveScriptDialog.form.newTag)
    saveScriptDialog.form.newTag = ''
  }
}

const confirmSaveScript = async () => {
  if (!saveScriptDialog.form.title) return ElMessage.warning('请输入文案标题')
  try {
    await createScript({
      script_title: saveScriptDialog.form.title,
      script_content: videoForm.script,
      script_tags: saveScriptDialog.form.tags
    })
    ElMessage.success('已存入文案库')
    saveScriptDialog.visible = false
    // 重新加载脚本库
    await fetchScriptLibrary()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

// A2E 流程处理
// 渲染流程模拟
const startGeneration = async () => {
  // 防止重复点击
  if (isGenerating.value) {
    return
  }
  
  if (!videoForm.title || !videoForm.digitalHuman || !videoForm.voice || !videoForm.script) {
    return ElMessage.warning('请先完整配置标题、数字人、配音及文案')
  }

  isGenerating.value = true
  resultVideo.value = ''
  genProgress.value = 0
  genStage.value = '正在上传素材...'

  try {
    // 根据选中的数字人找到对应的externalId
    const selectedHuman = humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)
    const digitalHumanId = selectedHuman?.externalId || videoForm.digitalHuman
    
    // 根据选中的配音名称找到对应的externalId
    const selectedVoice = voiceOptions.value.find((voice: any) => voice.name === videoForm.voice)
    const voiceId = selectedVoice?.externalId || videoForm.voice
    
    // 确定语言（如果是自动，则默认zh）
    const language = videoForm.language === 'auto' ? 'zh' : videoForm.language
    
    // 创建FormData对象
    const formData = new FormData()
    
    // 映射表单字段到API参数（使用snake_case）
    formData.append('title', videoForm.title)
    formData.append('msg', videoForm.script)
    formData.append('voice_id', voiceId)
    formData.append('digital_human_id', digitalHumanId)
    formData.append('language', language)
    formData.append('speechRate', '1')
    formData.append('subtitleSelector', String(videoForm.subtitleSelector))
    if (videoForm.subtitleSelector === 1) {
      formData.append('colour', videoForm.subtitleColor)
    }

    console.log('提交的表单数据：', {
      title: videoForm.title,
      msg: videoForm.script,
      voice_id: voiceId,
      digital_human_id: digitalHumanId,
      language: language,
      speechRate: '1',
      subtitleSelector: videoForm.subtitleSelector,
      colour: videoForm.subtitleSelector === 1 ? videoForm.subtitleColor : undefined
    })

    // 同步到全局通知中心（暂未启用）
    // taskStore.addTask({
    //   taskType: 'VIDEO_TASK',
    //   subTitle: `正在制作：${videoForm.title}`,
    //   status: 'running',
    //   image: getHumanImg(videoForm.digitalHuman)
    // })

    // 调用API创建视频任务
    const response = await createVideoTask(formData)
    console.log('创建任务响应:', response)
    
    if (response && response.data) {
      const taskId = response.data.id || response.data.data?.id
      console.log('任务ID:', taskId)
      
      // 获取任务详情以获取实时进度
      const checkTaskProgress = async () => {
        try {
          const detailResponse = await getVideoTaskDetail(taskId)
          console.log('任务详情:', detailResponse)
          
          if (detailResponse && detailResponse.data && detailResponse.data.data) {
            const taskData = detailResponse.data.data
            const taskStatus = String(taskData.taskStatus)
            
            // 根据 taskStatus 更新进度
            // 0: 等待中, 1: 一开始, 2: 配音生成中, 3: 视频预备中, 4: 视频生成中, 5: 已完成, -1: 失败
            switch(taskStatus) {
              case '0':
              case '1':
                genProgress.value = 10
                genStage.value = '正在初始化...'
                break
              case '2':
                genProgress.value = 30
                genStage.value = '配音生成中...'
                break
              case '3':
                genProgress.value = 60
                genStage.value = '视频预备中...'
                break
              case '4':
                genProgress.value = 85
                genStage.value = '视频生成中...'
                break
              case '5':
                genProgress.value = 100
                genStage.value = '已完成'
                completeGeneration(taskId, taskData)
                return
              case '-1':
                throw new Error(taskData.errorMessage || '任务失败')
              default:
                genProgress.value = 20
                genStage.value = '处理中...'
            }
            
            // 未完成则继续轮询
            if (taskStatus !== '5' && taskStatus !== '-1') {
              setTimeout(checkTaskProgress, 2000)
            }
          }
        } catch (err) {
          console.error('获取任务详情失败:', err)
          // 将继续检查
          setTimeout(checkTaskProgress, 3000)
        }
      }
      
      // 延迟1秒后开始轮询（等待服务器处理）
      setTimeout(checkTaskProgress, 1000)
    } else {
      throw new Error('任务创建失败')
    }
  } catch (error) {
    isGenerating.value = false
    console.error('视频生成失败:', error)
    ElMessage.error(`视频生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

const completeGeneration = async (taskId?: any, taskData?: any) => {
  isGenerating.value = false
  // 如果有任务数据，使用真实的视频URL
  if (taskData && taskData.videoUrl) {
    resultVideo.value = taskData.videoUrl
  } else {
    resultVideo.value = 'https://www.w3schools.com/html/mov_bbb.mp4'
  }
  
  // 添加新视频到列表
  const newTask = {
    id: taskId || Date.now(),
    script: videoForm.script,
    digitalHuman: videoForm.digitalHuman,
    voice: videoForm.voice,
    createTime: new Date().toLocaleString(),
    videoUrl: resultVideo.value
  }
  
  videoTaskList.value.unshift(newTask)
  ElMessage.success('视频生成成功！')
  
  // 1秒后返回列表
  setTimeout(() => {
    showCreate.value = false
  }, 1000)
}

const previewResult = () => {
  videoPreview.url = resultVideo.value
  videoPreview.visible = true
}

// 下载视频
const downloadVideo = async () => {
  if (!videoPreview.url) {
    ElMessage.warning('视频URL不可用')
    console.log('videoPreview:', videoPreview)
    return
  }
  
  try {
    console.log('开始下载视频:', videoPreview.url)
    
    // 方法1：尝试用fetch下载
    try {
      const response = await fetch(videoPreview.url)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `video-${new Date().getTime()}.mp4`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setTimeout(() => {
          ElMessage.success('下载已开始')
        }, 2000)
      } else {
        throw new Error('fetch返回非200状态码')
      }
    } catch (fetchError) {
      console.log('fetch失败，尝试直接跳转下载:', fetchError)
      // 方法2：直接用window.location.href跳转下载
      const link = document.createElement('a')
      link.href = videoPreview.url
      link.download = `video-${new Date().getTime()}.mp4`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        ElMessage.success('下载已开始')
      }, 1000)
    }
  } catch (error) {
    console.error('下载视频失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

// 下载音频
const downloadAudio = async () => {
  if (!videoPreview.voiceUrl) {
    ElMessage.warning('音频URL不可用')
    console.log('videoPreview:', videoPreview)
    return
  }
  
  try {
    console.log('开始下载音频:', videoPreview.voiceUrl)
    
    // 方法1：尝试用fetch下载
    try {
      const response = await fetch(videoPreview.voiceUrl)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audio-${new Date().getTime()}.mp3`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setTimeout(() => {
          ElMessage.success('下载已开始')
        }, 2000)
      } else {
        throw new Error('fetch返回非200状态码')
      }
    } catch (fetchError) {
      console.log('fetch失败，尝试直接跳转下载:', fetchError)
      // 方法2：直接用window.location.href跳转下载
      const link = document.createElement('a')
      link.href = videoPreview.voiceUrl
      link.download = `audio-${new Date().getTime()}.mp3`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        ElMessage.success('下载已开始')
      }, 1000)
    }
  } catch (error) {
    console.error('下载音频失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

const downloadResult = () => {
  ElMessage.success('正在导出视频文件...')
}

// 搜索视频
const handleSearch = async () => {
  try {
    // 构建搜索条件
    const search = searchKeyword.value ? { title: searchKeyword.value } : undefined
    
    const response = await getVideoTaskList(1, 10, search)
    console.log('搜索API返回数据:', response)
    
    let tasks = []
    if (response.data && response.data.data) {
      const data = response.data.data
      if (Array.isArray(data.data)) {
        tasks = data.data
      } else if (Array.isArray(data)) {
        tasks = data
      }
    }
    
    // 映射字段到前端格式
    videoTaskList.value = tasks.map((task: any) => ({
      id: task.id,
      script: task.msg || task.title || '',
      title: task.title || '',
      digitalHuman: task.digitalHuman || task.digital_human || '',
      voice: task.voice || '',
      voiceId: task.voiceId,
      digitalHumanId: task.digitalHumanId,
      createTime: task.createTime ? new Date(task.createTime).toLocaleString('zh-CN') : new Date().toLocaleString(),
      updateTime: task.updateTime ? new Date(task.updateTime).toLocaleString('zh-CN') : '',
      videoUrl: task.videoUrl || task.video_url || '',
      videoCoverUrl: task.videoCoverUrl || task.video_cover_url || '',
      taskStatus: task.taskStatus || '0',
      baseVoiceUrl: task.baseVoiceUrl || task.base_voice_url || ''
    }))
    
    console.log('搜索结果:', videoTaskList.value)
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请重试')
  }
}

// 批量下载视频
const batchDownloadVideos = async () => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning('请先选择要下载的视频')
    return
  }

  const validVideos = selectedVideos.value.filter(v => v.taskStatus === '5' && v.videoUrl)
  const invalidCount = selectedVideos.value.length - validVideos.length

  if (validVideos.length === 0) {
    ElMessage.warning('没有可下载的视频（请检查视频是否已完成）')
    return
  }

  ElMessage.info(`准备打包 ${validVideos.length} 个视频...`)

  try {
    const zip = new JSZip()
    let successCount = 0
    let failedCount = 0

    // 并行下载所有视频
    const downloadPromises = validVideos.map(video =>
      fetch(video.videoUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.blob()
        })
        .then(blob => {
          const fileName = `${video.title || 'video'}-${video.id}.mp4`
          zip.file(fileName, blob)
          successCount++
        })
        .catch(error => {
          console.error(`下载视频失败: ${video.title}`, error)
          failedCount++
        })
    )

    // 等待所有下载完成
    await Promise.all(downloadPromises)

    // 生成 ZIP 文件
    ElMessage.info('正在生成压缩包...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // 下载 ZIP 文件
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `videos-${new Date().getTime()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    if (successCount > 0) {
      ElMessage.success(`成功打包并下载 ${successCount} 个视频`)
    }
    if (failedCount > 0) {
      ElMessage.warning(`${failedCount} 个视频下载失败`)
    }
    if (invalidCount > 0) {
      ElMessage.info(`${invalidCount} 个视频跳过（未完成或无URL）`)
    }
  } catch (error) {
    console.error('ZIP打包失败:', error)
    ElMessage.error('打包文件失败，请重试')
  }
}

// 批量下载音频
const batchDownloadAudios = async () => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning('请先选择要下载的视频')
    return
  }

  const validVideos = selectedVideos.value.filter(v => v.taskStatus === '5' && v.baseVoiceUrl)
  const invalidCount = selectedVideos.value.length - validVideos.length

  if (validVideos.length === 0) {
    ElMessage.warning('没有可下载的音频（请检查视频是否已完成）')
    return
  }

  ElMessage.info(`准备打包 ${validVideos.length} 个音频...`)

  try {
    const zip = new JSZip()
    let successCount = 0
    let failedCount = 0

    // 并行下载所有音频
    const downloadPromises = validVideos.map(video =>
      fetch(video.baseVoiceUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.blob()
        })
        .then(blob => {
          const fileName = `${video.title || 'audio'}-${video.id}.mp3`
          zip.file(fileName, blob)
          successCount++
        })
        .catch(error => {
          console.error(`下载音频失败: ${video.title}`, error)
          failedCount++
        })
    )

    // 等待所有下载完成
    await Promise.all(downloadPromises)

    // 生成 ZIP 文件
    ElMessage.info('正在生成压缩包...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // 下载 ZIP 文件
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audios-${new Date().getTime()}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    if (successCount > 0) {
      ElMessage.success(`成功打包并下载 ${successCount} 个音频`)
    }
    if (failedCount > 0) {
      ElMessage.warning(`${failedCount} 个音频下载失败`)
    }
    if (invalidCount > 0) {
      ElMessage.info(`${invalidCount} 个音频跳过（未完成或无URL）`)
    }
  } catch (error) {
    console.error('ZIP打包失败:', error)
    ElMessage.error('打包文件失败，请重试')
  }
}

// --- 数字人选择器 ---
const openHumanSelector = async () => {
  humanSelectorDialog.visible = true
  // 重置分页
  humanSelectorDialog.allList = []
  humanSelectorDialog.displayList = []
  humanSelectorDialog.page = 1
  humanSelectorDialog.search = ''
  humanSelectorDialog.hasMore = true
  if (humanSelectorDialog.displayList.length === 0) {
    await loadMoreHumans()
  }
}

const loadMoreHumans = async () => {
  humanSelectorDialog.loading = true
  try {
    // 使用已有的 humanOptions 数据
    const allHumans = humanOptions.value
    const start = (humanSelectorDialog.page - 1) * humanSelectorDialog.pageSize
    const end = start + humanSelectorDialog.pageSize
    
    if (start >= allHumans.length) {
      humanSelectorDialog.hasMore = false
      humanSelectorDialog.loading = false
      return
    }
    
    const newItems = allHumans.slice(start, end)
    humanSelectorDialog.allList.push(...newItems)
    humanSelectorDialog.displayList = humanSelectorDialog.allList.slice(0, humanSelectorDialog.page * humanSelectorDialog.pageSize)
    humanSelectorDialog.page++
    
    if (end >= allHumans.length) {
      humanSelectorDialog.hasMore = false
    }
  } catch (error) {
    console.error('加载数字人失败:', error)
    ElMessage.error('加载数字人失败')
  } finally {
    humanSelectorDialog.loading = false
  }
}

// 滚动到底部时自动加载
const handleHumanScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  // 距离底部小于 100px 时自动加载
  if (scrollHeight - scrollTop - clientHeight < 100 && humanSelectorDialog.hasMore && !humanSelectorDialog.loading) {
    loadMoreHumans()
  }
}

const selectHuman = (item: any) => {
  videoForm.digitalHuman = item.name
  videoForm.previewImg = item.img
  humanSelectorDialog.visible = false
  ElMessage.success('已选择数字人')
}

// --- 配音选择器 ---
const openVoiceSelector = async () => {
  voiceSelectorDialog.visible = true
  // 重置分页
  voiceSelectorDialog.allList = []
  voiceSelectorDialog.displayList = []
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.search = ''
  voiceSelectorDialog.hasMore = true
  if (voiceSelectorDialog.displayList.length === 0) {
    await loadMoreVoices()
  }
}

const loadMoreVoices = async () => {
  voiceSelectorDialog.loading = true
  try {
    const allVoices = voiceOptions.value
    const start = (voiceSelectorDialog.page - 1) * voiceSelectorDialog.pageSize
    const end = start + voiceSelectorDialog.pageSize
    
    if (start >= allVoices.length) {
      voiceSelectorDialog.hasMore = false
      voiceSelectorDialog.loading = false
      return
    }
    
    const newItems = allVoices.slice(start, end)
    voiceSelectorDialog.allList.push(...newItems)
    voiceSelectorDialog.displayList = voiceSelectorDialog.allList.slice(0, voiceSelectorDialog.page * voiceSelectorDialog.pageSize)
    voiceSelectorDialog.page++
    
    if (end >= allVoices.length) {
      voiceSelectorDialog.hasMore = false
    }
  } catch (error) {
    console.error('加载配音失败:', error)
    ElMessage.error('加载配音失败')
  } finally {
    voiceSelectorDialog.loading = false
  }
}

// 滚动到底部时自动加载
const handleVoiceScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && voiceSelectorDialog.hasMore && !voiceSelectorDialog.loading) {
    loadMoreVoices()
  }
}

const selectVoice = (item: any) => {
  videoForm.voice = item.name
  voiceSelectorDialog.visible = false
  ElMessage.success('已选择配音')
}

// --- 快捷预设选择器 ---
const openRelSelector = async () => {
  relSelectorDialog.visible = true
  // 重置分页和搜索
  relSelectorDialog.allList = []
  relSelectorDialog.displayList = []
  relSelectorDialog.page = 1
  relSelectorDialog.search = ''
  relSelectorDialog.hasMore = true
  if (relSelectorDialog.displayList.length === 0) {
    await loadMoreRels()
  }
}

const loadMoreRels = async () => {
  relSelectorDialog.loading = true
  try {
    const allRels = relList.value
    const start = (relSelectorDialog.page - 1) * relSelectorDialog.pageSize
    const end = start + relSelectorDialog.pageSize
    
    if (start >= allRels.length) {
      relSelectorDialog.hasMore = false
      relSelectorDialog.loading = false
      return
    }
    
    const newItems = allRels.slice(start, end)
    relSelectorDialog.allList.push(...newItems)
    relSelectorDialog.displayList = relSelectorDialog.allList.slice(0, relSelectorDialog.page * relSelectorDialog.pageSize)
    relSelectorDialog.page++
    
    if (end >= allRels.length) {
      relSelectorDialog.hasMore = false
    }
  } catch (error) {
    console.error('加载预设失败:', error)
    ElMessage.error('加载预设失败')
  } finally {
    relSelectorDialog.loading = false
  }
}

// 滚动到底部时自动加载
const handleRelScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && relSelectorDialog.hasMore && !relSelectorDialog.loading) {
    loadMoreRels()
  }
}

const selectRel = (item: any) => {
  if (item.id) {
    videoForm.relId = item.id
    relName.value = item.name
    handleRelChange(item.id)
  } else {
    videoForm.relId = ''
    relName.value = ''
  }
  relSelectorDialog.visible = false
  ElMessage.success('已选择预设')
}

// 清空预设选择
const clearRelSelection = () => {
  videoForm.relId = ''
  relName.value = ''
  relSelectorDialog.visible = false
  ElMessage.success('已清空预设')
}

// 监听搜索框变化
watch(() => humanSelectorDialog.search, (newVal) => {
  const filtered = humanOptions.value.filter(item => 
    item.name.toLowerCase().includes(newVal.toLowerCase())
  )
  humanSelectorDialog.allList = filtered
  humanSelectorDialog.displayList = filtered.slice(0, humanSelectorDialog.pageSize)
  humanSelectorDialog.page = 1
  humanSelectorDialog.hasMore = filtered.length > humanSelectorDialog.pageSize
})

watch(() => voiceSelectorDialog.search, (newVal) => {
  const filtered = voiceOptions.value.filter(item => 
    item.name.toLowerCase().includes(newVal.toLowerCase())
  )
  voiceSelectorDialog.allList = filtered
  voiceSelectorDialog.displayList = filtered.slice(0, voiceSelectorDialog.pageSize)
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = filtered.length > voiceSelectorDialog.pageSize
})

watch(() => relSelectorDialog.search, (newVal) => {
  const filtered = relList.value.filter(item => 
    item.name.toLowerCase().includes(newVal.toLowerCase())
  )
  relSelectorDialog.allList = filtered
  relSelectorDialog.displayList = filtered.slice(0, relSelectorDialog.pageSize)
  relSelectorDialog.page = 1
  relSelectorDialog.hasMore = filtered.length > relSelectorDialog.pageSize
})

</script>

<style scoped>
.script-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  background-color: #fcfcfc;
  padding: 15px;
  line-height: 1.6;
  font-size: 14px;
  transition: all 0.3s;
}

.script-input :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* 搜索框优化 */
.search-input :deep(.el-input__wrapper) {
  background-color: #f0f9ff;
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.2);
}

.search-input :deep(.el-input__inner) {
  font-size: 14px;
  color: #374151;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.video-preview-dialog) {
  background: transparent;
  box-shadow: none;
}
:deep(.video-preview-dialog .el-dialog__header) {
  background: white;
  border-radius: 12px 12px 0 0;
  margin-right: 0;
}
:deep(.video-preview-dialog .el-dialog__body) {
  background: #000;
  padding: 0;
  border-radius: 0 0 12px 12px;
}
</style>
