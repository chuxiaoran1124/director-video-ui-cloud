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
          <div class="flex items-center gap-3 flex-1">
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
            <el-input
              v-model="searchLabel"
              placeholder="搜索标签..."
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
          <el-table-column label="标签" min-width="180" align="center">
            <template #default="scope">
              <div class="flex flex-wrap gap-1 justify-center">
                <el-tag
                  v-for="tag in splitLabel(scope.row.label)"
                  :key="`${scope.row.id}-${tag}`"
                  size="small"
                  effect="plain"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="splitLabel(scope.row.label).length === 0" class="text-gray-400 text-xs">无</span>
              </div>
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

        <!-- 分页 -->
        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="videoTaskPage"
            v-model:page-size="videoTaskPageSize"
            :total="videoTaskTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="loadVideoTasks"
            @size-change="() => { videoTaskPage = 1; loadVideoTasks() }"
          />
        </div>
      </div>
    </div>

    <!-- 创建/编辑页面 -->
    <div v-else class="max-w-[1400px] mx-auto">
      <!-- 顶部标题 -->
      <div class="bg-white px-5 py-3 rounded-xl shadow-sm relative border border-gray-100 mb-4">
        <div class="w-full">
          <el-button @click="showCreate = false" icon="el-icon-arrow-left" class="mb-2">返回列表</el-button>
          <div class="text-center">
            <h2 class="text-xl font-bold text-gray-800">视频单次生成</h2>
            <p class="text-xs text-gray-400 mt-0.5">快速配置并制作单个高质量视频素材</p>
          </div>
        </div>
      </div>

      <div class="flex gap-6">
      <!-- 左侧制作区 -->
      <div class="flex-1 space-y-4">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-full">
          <el-form :model="videoForm" label-width="100px" label-position="top">
                        <!-- 渠道与配置方式 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item class="!mb-2">
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-sm text-gray-700 font-medium whitespace-nowrap"><span class="text-red-500">*</span> 生成渠道</span>
                    <el-radio-group v-model="videoForm.channel" size="small">
                      <el-radio value="A2E">默认</el-radio>
                    </el-radio-group>
                    <span class="text-sm text-gray-700 font-medium whitespace-nowrap ml-4">视频方向</span>
                    <el-radio-group v-model="videoForm.videoType" size="small">
                      <el-radio :label="0">竖版</el-radio>
                      <el-radio :label="1">横版</el-radio>
                    </el-radio-group>
                    <template v-if="videoForm.mode === 0">
                      <span class="text-sm text-gray-700 font-medium whitespace-nowrap ml-4">视频语言 <span class="text-xs text-gray-400 font-normal">（语言配置仅适用于视频文案配置）</span></span>
                      <el-radio-group v-model="videoForm.language">
                        <el-radio :label="'zh'" size="large">中文</el-radio>
                        <el-radio :label="'th'" size="large">泰语</el-radio>
                      </el-radio-group>
                    </template>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 配置方式 -->
            <el-row :gutter="20" class="mt-2">
              <el-col :span="24">
                <el-form-item class="!mb-2">
                  <template #label><span class="text-gray-700"><span class="text-red-500">*</span> 配置方式</span></template>
                  <el-radio-group v-model="videoForm.mode">
                    <el-radio :label="0" size="large" border>视频文案配置</el-radio>
                    <el-radio :label="1" size="large" border>音频驱动视频</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="mt-2">
              <el-col :span="12">
                <el-form-item class="!mb-2">
                  <!-- 数字人选择器 -->
                  <div class="flex items-center gap-2">
                    <span class="text-red-500 text-base leading-none">*</span>
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
                  </div>
                </el-form-item>
              </el-col>
                            <el-col :span="12">
                <el-form-item class="!mb-2">
                  <!-- 配音选择器 -->
                  <div class="flex gap-2">
                    <span class="text-red-500 text-base leading-none self-center">*</span>
                    <el-input 
                      v-model="videoForm.voice" 
                      placeholder="点击搜索选择配音"
                      readonly
                      style="cursor: pointer;"
                      clearable
                      @clear="videoForm.voice = ''"
                      @click="openVoiceSelector"
                      class="flex-1"
                      :disabled="videoForm.mode === 1"
                    >
                      <template #prepend>选择配音</template>
                      <template #append>
                        <el-button icon="el-icon-search" @click.stop="openVoiceSelector" :disabled="videoForm.mode === 1" />
                      </template>
                    </el-input>
                    <el-button v-if="videoForm.voice && videoForm.voiceUrl && videoForm.mode === 0" type="primary" plain icon="el-icon-headset" @click="playVoice(videoForm.voiceUrl, videoForm.voice)">试听</el-button>
                  </div>
                  <span v-if="videoForm.mode === 1" class="text-xs text-gray-400 ml-2">音频驱动模式下无需选择配音，系统将使用您上传的音频</span>
                </el-form-item>
              </el-col>
            </el-row>

                        <el-row v-if="videoForm.mode === 0" :gutter="20" class="mt-2">
              <el-col :span="24">
                <el-form-item class="!mb-2">
                  <!-- 快捷预设选择器 -->
                  <div class="flex items-center gap-2">
                    <span class="text-transparent text-base leading-none">*</span>
                    <el-input 
                      v-model="relName" 
                      placeholder="点击搜索选择预设" 
                      readonly 
                      style="cursor: pointer;"
                      clearable
                      @clear="videoForm.relId = ''; relName = ''; videoForm.label = ''"
                      @click="openRelSelector"
                      class="flex-1"
                    >
                      <template #prepend>选择预设</template>
                      <template #append>
                        <el-button icon="el-icon-search" @click.stop="openRelSelector" />
                      </template>
                    </el-input>
                    <span class="text-xs text-gray-400 whitespace-nowrap">（绑定关系，即同时选择数字人形象和配音声音）</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="videoForm.mode === 0" :gutter="20" class="mt-2">
                                      <el-col :span="12">
                                        <el-form-item class="!mb-2">
                                          <template #label><span class="text-gray-700">启用字幕</span></template>
                                          <el-switch 
                                            v-model="videoForm.subtitleSelector" 
                                            :active-value="1" 
                                            :inactive-value="0"
                                :disabled="videoForm.videoType === 1 || videoForm.language === 'th'"
                                active-text="开启"
                                inactive-text="关闭"
                              />
                              <span v-if="videoForm.videoType === 1" class="text-xs text-gray-400 ml-2">横版模式下不支持字幕</span>
                              <span v-if="videoForm.language === 'th'" class="text-xs text-gray-400 ml-2">泰语暂不支持字幕</span>
                            </el-form-item>
                          </el-col>
                        </el-row>

            <!-- 角标选择 -->
                        <el-row :gutter="20" class="mt-2" v-if="videoForm.videoType !== 1 && (videoForm.mode === 0 ? videoForm.subtitleSelector === 1 : true)">
              <el-col :span="24">
                <el-form-item class="!mb-2">
                                    <div class="flex items-start gap-3">
                    <div class="flex items-center gap-2 flex-1">
                      <span v-if="videoForm.mode === 0 && videoForm.subtitleSelector === 1" class="text-red-500 text-base leading-none self-center">*</span>
                      <el-input
                        :model-value="currentCornerMarkName"
                        placeholder="点击搜索选择角标"
                        readonly
                        style="cursor: pointer;"
                        clearable
                        @clear="videoForm.cornerMark = ''"
                        @click="openCornerMarkSelector"
                        class="flex-1"
                      >
                        <template #prepend>选择角标</template>
                        <template #append>
                          <el-button icon="el-icon-search" @click.stop="openCornerMarkSelector" />
                        </template>
                      </el-input>
                    </div>
                    <!-- 近期快速选择 -->
                    <div v-if="recentCornerMarks.length > 0" class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs text-gray-400 whitespace-nowrap">近期：</span>
                      <el-tooltip
                        v-for="recent in recentCornerMarks"
                        :key="recent.id"
                        :content="recent.name"
                        placement="top"
                        :show-after="300"
                      >
                        <div
                          class="flex items-center gap-1 px-2 py-1 rounded border cursor-pointer transition-all text-xs"
                          :class="videoForm.cornerMark === recent.id
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:bg-blue-50'"
                          @click="videoForm.cornerMark = recent.id"
                        >
                          <span class="max-w-[80px] truncate">{{ recent.name }}</span>
                        </div>
                      </el-tooltip>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

                        <el-row>
              <el-col :span="24">
                <div class="text-[11px] text-gray-400 mb-2 italic">
                    <i class="el-icon-info"></i> 说明：选择预设后将自动覆盖上方的形象和配音选择。
                </div>
              </el-col>
            </el-row>

            <!-- 标题部分 -->
            <div class="mt-2">
              <el-form-item class="!mb-2">
                <template #label>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-700"><span class="text-red-500">*</span> 视频标题</span>
                    <el-button size="small" plain @click="fillDefaultTitle">默认</el-button>
                    <span class="text-xs text-gray-400">默认以"数字人+配音+时间戳"命名</span>
                  </div>
                </template>
                <el-input 
                  v-model="videoForm.title" 
                  placeholder="留空点击「默认」自动生成标题"
                  maxlength="100"
                  show-word-limit
                  clearable
                />
              </el-form-item>
            </div>

            <!-- 上传文件夹 -->
                        <div class="mt-2">
                          <el-form-item class="!mb-2">
                            <template #label><span class="text-gray-700">视频上传文件夹 <span class="text-xs text-gray-400">（共享文件夹存储路径）</span></span></template>
                            <el-input
                              v-model="videoForm.filename"
                              placeholder="请输入文件夹名称，留空则使用默认路径"
                              clearable
                            />
                          </el-form-item>
                        </div>

                        <!-- 文案模式：文案部分 -->
                        <div v-if="videoForm.mode === 0" class="mt-2">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600 text-sm font-bold flex items-center gap-1">
                              视频文案内容 <span class="text-red-500">*</span>
                              <span v-if="videoForm.language === 'th'" class="text-xs text-gray-400 font-normal">（您已选择泰语，请输入泰语文字）</span>
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
                            :rows="8"
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

                        <!-- 音频模式：上传音频 -->
                        <div v-if="videoForm.mode === 1" class="mt-2">
                          <el-form-item class="!mb-2">
                            <template #label><span class="text-gray-700"><span class="text-red-500">*</span> 上传音频文件</span></template>
                            <el-upload
                              ref="audioUploadRef"
                              :auto-upload="false"
                              :limit="1"
                              accept="audio/*"
                              :on-change="handleAudioChange"
                              :on-remove="handleAudioRemove"
                            >
                              <el-button size="small" type="primary" icon="el-icon-upload2">选择音频文件</el-button>
                              <template #tip>
                                <div class="text-[11px] text-gray-400 mt-1">支持 MP3、WAV、M4A 等常见音频格式</div>
                              </template>
                            </el-upload>
                            <div v-if="audioFileName" class="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <i class="el-icon-headset text-blue-500"></i>
                              <span>{{ audioFileName }}</span>
                              <el-button size="mini" type="danger" text @click="clearAudioFile">移除</el-button>
                            </div>
                          </el-form-item>
                        </div>

            <div class="mt-4 flex flex-col items-center border-t border-gray-50 pt-4 gap-4">
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
      <div class="w-[440px] space-y-4">
                <!-- 预览效果 -->
        <!-- 文案竖版：字幕预览（即时渲染） -->
                <div v-if="videoForm.mode === 0 && videoForm.subtitleSelector === 1 && videoForm.videoType === 0" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="el-icon-picture-outline text-orange-500"></i>预览效果
                  </h3>
                  <SubtitlePreview
                    ref="subtitlePreviewRef"
                    :frame-base64="subtitlePreviewFrameBase64"
                    :script-text="videoForm.script"
                    :corner-mark-url="currentCornerMarkUrl"
                    @update:config="handleSubtitleConfigUpdate"
                  />
                </div>
                <!-- 其他情况（横版 / 音频模式 / 竖版未开字幕）：直接显示数字人封面图 -->
                <div v-if="!(videoForm.mode === 0 && videoForm.subtitleSelector === 1 && videoForm.videoType === 0)" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="el-icon-picture-outline text-orange-500"></i>预览效果
                  </h3>
                  <div class="w-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50" style="height: 300px;">
                    <img v-if="currentDigitalHumanImg" :key="'prev-' + videoForm.mode + '-' + videoForm.digitalHuman" :src="currentDigitalHumanImg" class="w-full h-full object-contain" alt="数字人预览" @error="(e: any) => { e.target.style.display = 'none' }">
                    <span v-else class="text-gray-300 text-sm">尚未选择形象</span>
                  </div>
                  <p v-if="videoForm.digitalHuman" class="text-xs text-gray-400 mt-2 text-center">{{ videoForm.digitalHuman }}</p>
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
          class="grid grid-cols-5 gap-x-5 gap-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[800px] overflow-y-auto"
          @scroll="handleHumanScroll"
        >
          <div 
            v-for="item in humanSelectorDialog.displayList" 
            :key="item.name"
            class="relative cursor-pointer group text-center"
            @click="selectHuman(item)"
          >
            <div 
              class="aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all shadow-sm w-3/4 mx-auto"
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

    <!-- 角标选择器 -->
    <el-dialog title="选择角标" v-model="cornerMarkSelectorDialog.visible" width="900px" append-to-body>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <el-input placeholder="搜索角标..." v-model="cornerMarkSelectorDialog.search" size="small" style="width: 300px;" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
          <span v-if="pinnedCornerMarkIds.length > 0" class="text-xs text-amber-500 flex items-center gap-1">
            <i class="el-icon-s-flag"></i>{{ pinnedCornerMarkIds.length }} 个已置顶
          </span>
        </div>
        <div 
          class="grid grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[700px] overflow-y-auto"
        >
          <div 
            v-for="item in sortedCornerMarkOptions" 
            :key="item.id"
            class="relative cursor-pointer group text-center"
            @click="selectCornerMark(item)"
          >
            <!-- 置顶角标标识 -->
            <div v-if="pinnedCornerMarkIds.includes(item.id)" class="absolute top-2 left-2 z-10">
              <el-tag type="warning" size="small" effect="dark" class="!px-1.5 !text-[10px] !h-5 leading-5 shadow">
                <i class="el-icon-s-flag mr-0.5"></i>置顶
              </el-tag>
            </div>
            <div 
              class="aspect-auto rounded-lg overflow-hidden border-2 transition-all shadow-sm p-2 bg-white h-[400px] flex items-center justify-center"
              :class="videoForm.cornerMark === item.id 
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
            <div v-if="videoForm.cornerMark === item.id" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
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
          ref="voiceScrollRef"
          class="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[400px] overflow-y-auto"
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
              @click.stop="playVoice(item.url, item.name)"
            ></el-button>
            <i v-if="videoForm.voice === item.name" class="el-icon-check text-blue-500 text-sm ml-1"></i>
          </div>
          <!-- 加载更多占位（必须在grid内撑开整行） -->
          <div v-if="voiceSelectorDialog.loading" class="col-span-3 text-center py-4 text-gray-400 text-sm">
            加载中...
          </div>
          <div v-else-if="!voiceSelectorDialog.hasMore && voiceSelectorDialog.displayList.length > 0" class="col-span-3 text-center py-3 text-gray-400 text-xs">
            已全部加载
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 快捷预设选择器 -->
    <el-dialog title="选择快捷预设" v-model="relSelectorDialog.visible" width="1000px" append-to-body>
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
          class="grid grid-cols-5 gap-x-5 gap-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[800px] overflow-y-auto"
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
            <div v-if="item.digitalHumanCoverUrl" class="w-3/4 mx-auto aspect-[3/4] overflow-hidden bg-gray-200 relative">
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
                <el-button type="text" size="small" icon="el-icon-headset" class="!text-blue-500 !p-0" @click.stop="playVoice(item.voiceUrl, item.voice)">试听</el-button>
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
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as ElIcon from '@element-plus/icons-vue'
import { Search } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import { useTaskStore } from '/@/store/modules/task'
import { createVideoTask, createAudioVideoTask, getVideoTaskList, deleteVideoTask, getVoiceList, getVoicePaginateList, getDigitalHumanList, getDigitalHumanPaginateList, getVideoTaskDetail, getBindingList, getScriptPaginateList, getScriptHistoryList, createScript, getCornerMarkList, toTopCornerMark, getSubtitlePreviewFrame, getRecentCornerMarks, recordRecentCornerMark, downloadFileByProxy } from '/@/api/material'
import SubtitlePreview from '/@/components/SubtitlePreview/index.vue'

// --- 数据定义 ---
const taskStore = useTaskStore()

// 页面状态
const showCreate = ref(false)

// 任务列表
const videoTaskList = ref<any[]>([])
const searchKeyword = ref('')
const searchLabel = ref('')
const selectedVideos = ref<any[]>([])
const videoTaskPage = ref(1)
const videoTaskPageSize = ref(20)
const videoTaskTotal = ref(0)
const filteredVideoList = computed(() => {
  return videoTaskList.value
})

const splitLabel = (labelValue: string | string[] | null | undefined) => {
  if (!labelValue) return []
  if (Array.isArray(labelValue)) return labelValue.filter((t: string) => !!String(t).trim())
  return String(labelValue).split('|').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
}

const videoForm = reactive({
  title: '',
  channel: 'A2E',
  relId: '',
  digitalHuman: '',
  digitalHumanExternalId: '',  // 数字人 externalId
  voice: '',
  voiceExternalId: '',  // 配音 externalId
  voiceUrl: '',  // 添加音频URL字段
  script: '',
  language: 'zh',
  subtitleSelector: 1,  // 字幕启用状态，默认开启（值为 1）
  subtitleColor: 'yellow',  // 字幕颜色，直接默认使用黄色
  videoType: 0 as 0 | 1,  // 0=竖版 9:16, 1=横版 16:9
  mode: 0 as 0 | 1,  // 0=视频文案配置, 1=直接上传音频
  cornerMark: '',  // 角标ID，可选
  previewImg: '',  // 预设选择时的预览图
  filename: '',   // 视频上传文件夹（共享文件夹存储路径）
    label: ''  // 标签（由预设 title 回填）
})

// 上传音频模式相关
const audioUploadRef = ref<any>(null)
const audioFile = ref<File | null>(null)
const audioFileName = ref('')

const handleAudioChange = (uploadFile: any) => {
  audioFile.value = uploadFile.raw
  audioFileName.value = uploadFile.name
  return false  // 阻止自动上传
}

const handleAudioRemove = () => {
  audioFile.value = null
  audioFileName.value = ''
}

const clearAudioFile = () => {
  audioFile.value = null
  audioFileName.value = ''
  if (audioUploadRef.value) {
    audioUploadRef.value.clearFiles()
  }
}

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

// 角标选项列表（从API获取）
const cornerMarkOptions = ref<any[]>([])
// 近期使用的角标（后端接口就绪后赋值）
const recentCornerMarks = ref<any[]>([])

// 将后端返回的 {id, name} 列表与本地 cornerMarkOptions 合并，补充 photoUrl
const enrichRecentCornerMarks = async (list: { id: number | string; name: string }[]) => {
  return list.map((recent: any) => {
    const local = cornerMarkOptions.value.find((o: any) => String(o.id) === String(recent.id))
    return {
      id: recent.id,
      name: recent.name,
      photoUrl: local?.photoUrl || ''
    }
  })
}

// 加载近期角标列表
const loadRecentCornerMarks = async () => {
  try {
    const res = await getRecentCornerMarks()
    const list = res.data?.data || res.data || []
    recentCornerMarks.value = await enrichRecentCornerMarks(list)
  } catch (e) {
    console.error('加载近期角标失败:', e)
  }
}

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

// 获取角标列表
const fetchCornerMarks = async () => {
  try {
    const result = await getCornerMarkList()
    console.log('角标列表API响应:', result)
    
    const cornerMarkData = result.data?.data || result.data || []
    cornerMarkOptions.value = cornerMarkData.map((item: any) => ({
      id: item.id,
      name: item.photoName,
      photoUrl: item.photoUrl,
      photoName: item.photoName,
      sort: item.sort ?? null
    }))
    // 初始化置顶列表：sort不为null的按sort倒序
    pinnedCornerMarkIds.value = cornerMarkOptions.value
      .filter((i: any) => i.sort !== null && i.sort !== undefined)
      .sort((a: any, b: any) => b.sort - a.sort)
      .map((i: any) => i.id)
    console.log('加载的角标列表:', cornerMarkOptions.value)
  } catch (error) {
    console.error('获取角标列表失败:', error)
    ElMessage.error('加载角标列表失败')
  }
}

// --- 状态控制 ---
const isPlaying = ref(false)
let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl = ''
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

// 配音选择器滚动容器ref
const voiceScrollRef = ref<HTMLElement | null>(null)

// 字幕预览相关
const subtitlePreviewRef = ref<InstanceType<typeof SubtitlePreview> | null>(null)
const subtitlePreviewFrameBase64 = ref('')
const subtitleConfig = reactive({
  font_size: 18,
  margin_v: 74,
  primary_colour: '#FFFF00',
  outline: 1,
  outline_colour: '#000000',
  bold: 1,
  blur_subtitles: false,
  blur_strength: 15
})

/**
 * 通过后端代理将图片URL转 base64（绕过浏览器CORS）
 */
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  console.log('[getFrameBase64] 代理拉取封面:', url)
  const res = await downloadFileByProxy(url)
  console.log('[getFrameBase64] 代理返回 blob size:', (res.data as Blob)?.size)
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const b64 = reader.result as string
      console.log('[getFrameBase64] 转 base64 成功, 长度:', b64.length)
      resolve(b64)
    }
    reader.onerror = reject
    reader.readAsDataURL(res.data as Blob)
  })
}

/**
 * 优先用封面图URL转 base64；若无封面或失败，则提取视频首帧
 */
const getFrameBase64 = async (coverUrl: string, videoUrl: string): Promise<string> => {
  console.log('[getFrameBase64] coverUrl:', coverUrl, 'videoUrl:', videoUrl)
  if (coverUrl) {
    try {
      const b64 = await fetchImageAsBase64(coverUrl)
      if (b64) return b64
    } catch (e) {
      console.warn('[getFrameBase64] 封面转换失败，尝试视频首帧', e)
    }
  }
  if (videoUrl) {
    console.log('[getFrameBase64] 走视频首帧路径')
    return await extractVideoFirstFrame(videoUrl)
  }
  console.warn('[getFrameBase64] 两者均为空，返回空字符串')
  return ''
}

// 获取当前选中的数字人视频URL
const currentDigitalHumanVideoUrl = computed(() => {
  if (videoForm.digitalHuman) {
    const human = humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)
    if (human?.videoUrl) return human.videoUrl
    // 兜底：弹窗分页滚动加载出来的形象可能不在 humanOptions（首页）中
    const humanFromDialog = humanSelectorDialog.allList.find((h: any) => h.name === videoForm.digitalHuman)
    if (humanFromDialog?.videoUrl) return humanFromDialog.videoUrl
  }
  if (videoForm.relId) {
    const rel = relList.value.find((r: any) => r.id === videoForm.relId)
    if (rel?.digitalHumanUrl) return rel.digitalHumanUrl
  }
  return ''
})

// 获取当前选中数字人的封面图（横版预览用）
const currentDigitalHumanImg = computed(() => {
  if (videoForm.digitalHuman) {
    const human = humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)
    if (human?.coverUrl) return human.coverUrl
    if (human?.img) return human.img
    const humanFromDialog = humanSelectorDialog.allList.find((h: any) => h.name === videoForm.digitalHuman)
    if (humanFromDialog?.coverUrl) return humanFromDialog.coverUrl
    if (humanFromDialog?.img) return humanFromDialog.img
  }
  if (videoForm.relId) {
    const rel = relList.value.find((r: any) => r.id === videoForm.relId)
    if (rel?.digitalHumanCoverUrl) return rel.digitalHumanCoverUrl
  }
  return ''
})

// 获取当前选中角标的 URL（供预览组件实时叠加）
const currentCornerMarkUrl = computed(() => {
  if (!videoForm.cornerMark) return ''
  return cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)?.photoUrl || ''
})

const currentCornerMarkName = computed(() => {
  if (!videoForm.cornerMark) return ''
  return cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)?.name || ''
})

// 字幕配置更新回调
const handleSubtitleConfigUpdate = (newConfig: any) => {
  Object.assign(subtitleConfig, newConfig)
}

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

// 角标选择器状态
const cornerMarkSelectorDialog = reactive({
  visible: false,
  search: ''
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
    const res = await toTopCornerMark(id)
    // 重新拉取列表以获取最新 sort 值
    await fetchCornerMarks()
    const isPinned = pinnedCornerMarkIds.value.includes(id)
    ElMessage.success(isPinned ? '已置顶，排在最前' : '已取消置顶')
  } catch (error) {
    console.error('置顶操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

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

const buildVideoTaskSearch = () => {
  const keyword = searchKeyword.value.trim()
  const label = searchLabel.value.trim()
  const search: any = {}
  if (keyword) search.title = keyword
  if (label) search.label = label
  return Object.keys(search).length > 0 ? search : undefined
}

// 加载视频任务列表
const loadVideoTasks = async () => {
  try {
    const response = await getVideoTaskList(videoTaskPage.value, videoTaskPageSize.value, buildVideoTaskSearch())
    console.log('API返回数据:', response)
    
    // 处理API返回的数据结构：response.data.data.data 是任务列表数组
    let tasks = []
    if (response.data && response.data.data) {
      const data = response.data.data
      // API返回格式：{ page, pageSize, total, data: [...] }
      if (Array.isArray(data.data)) {
        tasks = data.data
        videoTaskTotal.value = data.total || 0
      } else if (Array.isArray(data)) {
        tasks = data
        videoTaskTotal.value = data.length || 0
      }
    }
    
    // 映射字段到前端格式
    videoTaskList.value = tasks.map((task: any) => ({
      id: task.id,
      script: task.msg || task.title || '',
      title: task.title || '',
      label: task.label || '',
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
  }, 5000)
}

const stopVideoTaskAutoRefresh = () => {
  if (videoTaskRefreshTimer.value) {
    clearInterval(videoTaskRefreshTimer.value)
    videoTaskRefreshTimer.value = null
  }
}

// 加载数字人列表（仅加载第一页）
const loadDigitalHumanList = async (searchName?: string) => {
  try {
    const response = await getDigitalHumanPaginateList(1, 20, searchName ? { name: searchName } : {})
    console.log('数字人列表API返回:', response)
    
    // 处理API返回的数据结构：response.data.data.data 是数字人列表数组
    if (response.data && response.data.data) {
      const data = response.data.data
      const humanList = data.data || data || []
      
      // 映射API返回的数据到前端格式
      humanOptions.value = humanList.map((digital: any) => ({
        name: digital.digitalHumanName || digital.name,
        externalId: digital.externalId,
        img: digital.coverUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        coverUrl: digital.coverUrl || '',   // 原始封面URL，用于字幕预览frame
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

// 加载配音列表（仅加载第一页）
const loadVoiceList = async (searchName?: string) => {
  try {
    // 搜索时传入 language 参数，中文传 'zh'，泰语传 'th'
    const searchParams: any = {}
    if (searchName) searchParams.name = searchName
    searchParams.language = videoForm.language
    const response = await getVoicePaginateList(1, 20, searchParams)
    console.log('配音列表API返回, language:', videoForm.language)
    
    // 处理API返回的数据结构：response.data.data.data 是配音列表数组
    if (response.data && response.data.data) {
      const data = response.data.data
      const voiceList = data.data || data || []
      
      // 映射API返回的数据到前端格式
      voiceOptions.value = voiceList.map((voice: any) => {
        // 尝试多个字段名来获取音频URL，然后提取真实URL
        const rawUrl = voice.url || voice.audio || voice.voiceUrl || voice.voice_url || voice.audioUrl || ''
        const audioUrl = extractAudioUrl(rawUrl)
        console.log(`配音 ${voice.voiceName || voice.name} 的原始URL:`, rawUrl, '-> 提取后:', audioUrl)
        return {
          name: voice.voiceName || voice.name,
          externalId: voice.externalId,
          url: audioUrl,
          language: voice.language || videoForm.language,
          // 保留原始数据以备后续使用
          ...voice
        }
      })
      console.log('加载的配音列表:', voiceOptions.value)
    }
  } catch (error) {
    console.error('加载配音列表失败:', error)
    // 如果加载失败，使用默认配音列表
    voiceOptions.value = [
      { name: '甜美女声', url: '' },
      { name: '磁性男声', url: '' },
      { name: '活力少女', url: '' },
      { name: '成熟稳重', url: '' }
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
    // 传入语言参数
    searchObj.language = videoForm.language
    
    const response = await getBindingList(1, 50, searchObj)
    console.log('绑定关系列表API返回:', response)
    
    // 处理API返回的数据结构
    if (response.data && response.data.data && response.data.data.data) {
      const bindingData = response.data.data.data
      
      // 映射API返回的数据到前端格式
      relList.value = bindingData.map((binding: any) => {
        // 尝试多个字段名来获取音频URL
        const voiceUrl = binding.voiceUrl || binding.voice_url || binding.url || binding.audio || ''
        return {
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
          voiceUrl: voiceUrl,
          // 保留原始数据
          ...binding
        }
      })
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
    videoForm.label = ''
  }
})

watch(() => videoForm.voice, (newVal, oldVal) => {
  if (newVal && oldVal && videoForm.relId) {
    // 配音发生改变且预设被选中，说明是手动改变，清空预设
    videoForm.relId = ''
    videoForm.previewImg = ''
    videoForm.label = ''
  }
})

// 组件挂载时加载任务列表、数字人列表、配音列表和绑定关系列表
onMounted(() => {
  loadVideoTasks()
  loadDigitalHumanList()
  loadVoiceList()
  loadBindingList()
  fetchCornerMarks()
  loadRecentCornerMarks()
  startVideoTaskAutoRefresh()
})

onUnmounted(() => {
  stopVideoTaskAutoRefresh()
})

// 当切换为横版时自动关闭字幕
watch(() => videoForm.videoType, (val) => {
  if (val === 1) {
    videoForm.subtitleSelector = 0
  }
})

// 监听 mode 切换：清空数字人选择、预览图
// 当切换为泰语时自动关闭字幕
watch(() => videoForm.language, (val) => {
  if (val === 'th') {
    videoForm.subtitleSelector = 0
  }
})

// 监听 mode 切换：清空数字人选择、预览图
watch(() => videoForm.mode, () => {
  videoForm.digitalHuman = ''
  videoForm.digitalHumanExternalId = ''
  videoForm.previewImg = ''
  subtitlePreviewFrameBase64.value = ''
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

const fillDefaultTitle = () => {
  const human = videoForm.digitalHuman || '未选形象'
  const voice = videoForm.voice || '未选配音'
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/[-: ]/g, '').substring(0, 14)
  videoForm.title = `${human}_${voice}_${ts}`
}

const resetForm = () => {
  videoForm.title = ''
  videoForm.channel = 'A2E'
  videoForm.relId = ''
  videoForm.digitalHuman = ''
  videoForm.digitalHumanExternalId = ''
  videoForm.voice = ''
  videoForm.voiceExternalId = ''
  videoForm.voiceUrl = ''
  videoForm.script = ''
  videoForm.language = 'zh'
  videoForm.subtitleSelector = 1
  videoForm.subtitleColor = 'yellow'
  videoForm.cornerMark = ''
  videoForm.filename = ''
    videoForm.label = ''
    videoForm.videoType = 0
  videoForm.mode = 0
  audioFile.value = null
  audioFileName.value = ''
  if (audioUploadRef.value) {
    audioUploadRef.value.clearFiles()
  }
  resultVideo.value = ''
  genProgress.value = 0
}

const getHumanImg = (name: string) => humanOptions.value.find((h: any) => h.name === name)?.img || ''

const handleRelChange = async (val: any, selectedRel?: any) => {
  if (!val) {
    // 清空预设选择
    videoForm.relId = ''
    relName.value = ''
    videoForm.previewImg = ''
    videoForm.label = ''
    return
  }
  
  // 优先使用当前弹窗点击项（支持滚动分页后选中），避免仅依赖 relList 前 50 条
  const rel = selectedRel || relList.value.find((r: any) => r.id === val)
  if (rel) {
    relName.value = rel.name
    videoForm.digitalHuman = rel.human || rel.digitalHumanName
    videoForm.voice = rel.voice || rel.voiceName
    videoForm.label = rel.title || ''
    videoForm.digitalHumanExternalId = rel.digitalHumanExternalId || ''
    videoForm.voiceExternalId = rel.voiceExternalId || ''
    
    // 字幕预览：优先封面图URL，其次视频URL，通过后端代理转 base64
    if (videoForm.subtitleSelector === 1) {
      const coverUrl = rel.digitalHumanCoverUrl !== rel.digitalHumanUrl ? rel.digitalHumanCoverUrl : ''
      subtitlePreviewFrameBase64.value = await getFrameBase64(coverUrl, rel.digitalHumanUrl || '')
    }
    // 表单缩略图（同样通过代理取视频首帧）
    if (rel.digitalHumanUrl) {
      videoForm.previewImg = await extractVideoFirstFrame(rel.digitalHumanUrl)
    }
    
    ElMessage.success(`已应用联动配置: ${rel.digitalHumanName || rel.human} & ${rel.voiceName || rel.voice}`)
  }
}

const playVoice = (audioUrl: string, voiceName: string = '') => {
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
    ElMessage.success(`正在试听: ${voiceName || '配音'}`)
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
  
        if (!videoForm.title || !videoForm.digitalHuman) {
    return ElMessage.warning('请先完整配置标题和数字人')
  }
  
  // 文案模式还需要配音
  if (videoForm.mode === 0 && !videoForm.voice) {
    return ElMessage.warning('请选择配音')
  }
  
  // 文案模式校验文案，音频模式校验音频
  if (videoForm.mode === 0 && !videoForm.script) {
    return ElMessage.warning('请输入视频文案内容')
  }
  if (videoForm.mode === 1 && !audioFile.value) {
    return ElMessage.warning('请上传音频文件')
  }
  
    // 竖屏文案模式且开启字幕时校验角标必填
  if (videoForm.videoType !== 1 && videoForm.mode === 0 && videoForm.subtitleSelector === 1 && !videoForm.cornerMark) {
    return ElMessage.warning('请选择角标')
  }

  isGenerating.value = true
  resultVideo.value = ''
  genProgress.value = 0
  genStage.value = '正在上传素材...'

  try {
        let digitalHumanId: string
    let voiceId: string = ''

    if (videoForm.mode === 0) {
      if (videoForm.relId) {
        // 使用绑定预设：直接从 relList 取 voiceExternalId / digitalHumanExternalId
        const rel = relList.value.find((r: any) => r.id === videoForm.relId)
        digitalHumanId = rel?.digitalHumanExternalId || videoForm.digitalHumanExternalId || videoForm.digitalHuman
        voiceId = rel?.voiceExternalId || videoForm.voiceExternalId || videoForm.voice
        console.log('[提交-绑定预设] rel:', rel?.name, '| digitalHumanExternalId:', digitalHumanId, '| voiceExternalId:', voiceId)
      } else {
        // 单独选择：取各自列表的 externalId
        digitalHumanId = videoForm.digitalHumanExternalId || humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)?.externalId || videoForm.digitalHuman
        voiceId = videoForm.voiceExternalId || voiceOptions.value.find((voice: any) => voice.name === videoForm.voice)?.externalId || videoForm.voice
        console.log('[提交-单独选择] digitalHuman:', videoForm.digitalHuman, '| externalId:', digitalHumanId, '| voice:', videoForm.voice, '| externalId:', voiceId)
      }
    } else {
      // 音频模式：只取数字人 ID
      digitalHumanId = videoForm.digitalHumanExternalId || humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)?.externalId || videoForm.digitalHuman
      console.log('[提交-音频模式] digitalHuman:', videoForm.digitalHuman, '| externalId:', digitalHumanId)
    }
    
    // 确定语言（如果是自动，则默认zh）
    const language = videoForm.language
    
        // 创建FormData对象
    const formData = new FormData()
    
    // 添加视频方向参数
    formData.append('type', String(videoForm.videoType))
    
    // 映射表单字段到API参数（使用snake_case）
    formData.append('title', videoForm.title)
    if (videoForm.label) formData.append('label', videoForm.label)
    
    // 文案模式传 msg，音频模式传音频文件
    if (videoForm.mode === 0) {
      formData.append('msg', videoForm.script)
    } else if (audioFile.value) {
      formData.append('file', audioFile.value)
    }
    
        if (videoForm.filename) formData.append('filename', videoForm.filename)
    // 文案模式传配音ID，音频模式不传
    if (videoForm.mode === 0 && voiceId) {
      formData.append('voice_id', voiceId)
    }
    formData.append('digital_human_id', digitalHumanId)
    formData.append('language', language)
    formData.append('speechRate', '1')
    
    // 横版模式下强制关闭字幕
    const effectiveSubtitle = videoForm.videoType === 1 ? 0 : (videoForm.mode === 1 ? 0 : videoForm.subtitleSelector)
    formData.append('subtitleSelector', String(effectiveSubtitle))
    if (effectiveSubtitle === 1) {
      formData.append('colour', 'yellow')
      
      // 只有开启字幕时才添加角标参数
      if (videoForm.cornerMark) {
        formData.append('corner_mark_id', videoForm.cornerMark)
        const selectedCornerMark = cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)
        if (selectedCornerMark && selectedCornerMark.photoUrl) {
          formData.append('corner_mark_url', selectedCornerMark.photoUrl)
        }
      }

      // 附加字幕样式配置
      formData.append('subtitle_config', JSON.stringify({
        font_name: subtitleConfig.font_name,
        font_size: subtitleConfig.font_size,
        margin_v: subtitleConfig.margin_v,
        primary_colour: subtitleConfig.primary_colour,
        outline: subtitleConfig.outline,
        outline_colour: subtitleConfig.outline_colour,
        bold: subtitleConfig.bold,
        bg_mode: subtitleConfig.bg_mode,
        bg_height: subtitleConfig.bg_height,
        bg_colour: subtitleConfig.bg_colour,
        blur_subtitles: subtitleConfig.blur_subtitles,
        blur_strength: subtitleConfig.blur_strength
      }))
    }

    console.log('提交的表单数据：', {
      title: videoForm.title,
      label: videoForm.label,
      msg: videoForm.script,
      voice_id: voiceId,
      digital_human_id: digitalHumanId,
      language: language,
      speechRate: '1',
      subtitleSelector: videoForm.subtitleSelector,
      colour: videoForm.subtitleSelector === 1 ? 'yellow' : undefined,
      corner_mark_id: (videoForm.subtitleSelector === 1 && videoForm.cornerMark) || undefined,
      corner_mark_url: (videoForm.subtitleSelector === 1 && videoForm.cornerMark && cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)?.photoUrl) || undefined,
      subtitle_config: videoForm.subtitleSelector === 1 ? { ...subtitleConfig } : undefined
    })

        // 同步到全局通知中心（暂未启用）
    // taskStore.addTask({
    //   taskType: 'VIDEO_TASK',
    //   subTitle: `正在制作：${videoForm.title}`,
    //   status: 'running',
    //   image: getHumanImg(videoForm.digitalHuman)
    // })

    let response
    if (videoForm.mode === 0) {
      // 文案模式：调用原创建视频任务接口
      response = await createVideoTask(formData)
      console.log('文案模式提交完成:', response)
    } else {
      // 音频文件已在上面 formData 中传了 audioFile，无需重复上传
      const lang = videoForm.language === 'zh' ? 'zh-CN' : 'th-TH'
      formData.append('language', lang)
      // 竖屏音频模式可传角标
      if (videoForm.videoType !== 1 && videoForm.cornerMark) {
        const selectedCornerMark = cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)
        if (selectedCornerMark?.photoUrl) {
          formData.append('corner_mark_url', selectedCornerMark.photoUrl)
        }
      }
      console.log('音频模式提交数据:', Object.fromEntries(formData.entries()))
      response = await createAudioVideoTask(formData)
      console.log('音频模式提交完成:', response)
    }
    
    if (response && response.data) {
      // 提交成功，立即返回列表并清空表单
      ElMessage.success('任务已提交，请在列表中查看生成进度')
      isGenerating.value = false
      resetForm()
      showCreate.value = false
    } else {
      throw new Error('任务创建失败')
    }
  } catch (error) {
    isGenerating.value = false
    console.error('视频生成失败:', error)
    ElMessage.error(`视频生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
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
    videoTaskPage.value = 1
    await loadVideoTasks()
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请重试')
  }
}

// 将 TOS 外部地址转成代理路径，解决 CORS
const toProxyUrl = (url: string) => {
  if (url && url.includes('tos-cn-beijing.volces.com')) {
    return url.replace(/^https?:\/\/[^/]+/, '/tos-proxy')
  }
  return url
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
      fetch(toProxyUrl(video.videoUrl))
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
      fetch(toProxyUrl(video.baseVoiceUrl))
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

    if (successCount === 0) {
      ElMessage.error('所有音频下载失败，请检查网络或文件地址')
      return
    }

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
    // 从API加载下一页数字人数据，传入视频方向参数
    const searchParams: any = {}
    if (humanSelectorDialog.search) searchParams.name = humanSelectorDialog.search
    searchParams.type = videoForm.videoType
    searchParams.language = videoForm.language
    const response = await getDigitalHumanPaginateList(humanSelectorDialog.page, humanSelectorDialog.pageSize, searchParams)
    
    if (response.data && response.data.data) {
      const data = response.data.data
      const humanList = data.data || []
      
      // 如果本页没有数据，说明没有更多内容
      if (humanList.length === 0) {
        humanSelectorDialog.hasMore = false
        humanSelectorDialog.loading = false
        return
      }
      
      // 映射API返回的数据到前端格式
      const newItems = humanList.map((digital: any) => ({
        name: digital.digitalHumanName || digital.name,
        externalId: digital.externalId,
        img: digital.coverUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        coverUrl: digital.coverUrl || '',   // 原始封面URL，用于字幕预览frame
        videoUrl: digital.videoUrl,
        gender: digital.gender
      }))
      
      humanSelectorDialog.allList.push(...newItems)
      humanSelectorDialog.displayList = humanSelectorDialog.allList
      humanSelectorDialog.page++
      
      // 如果本页获取的数据少于pageSize，说明已经到底了
      if (humanList.length < humanSelectorDialog.pageSize) {
        humanSelectorDialog.hasMore = false
      }
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

const selectHuman = async (item: any) => {
  console.log('[selectHuman] item:', item)
  videoForm.digitalHuman = item.name
  videoForm.digitalHumanExternalId = item.externalId || ''
  videoForm.previewImg = item.img
  // 统一刷新预览
  refreshPreview(item)
  humanSelectorDialog.visible = false
  ElMessage.success('已选择数字人')
}

/**
 * 统一刷新预览效果
 * - 文案竖版开字幕：后端即时渲染（SubtitlePreview）
 * - 其他情况：直接显示封面图
 */
const refreshPreview = async (item?: any) => {
  const digitalHuman = item || humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)
  if (!digitalHuman) return
  
  // 文案竖版且开启字幕时，请求后端即时渲染
  if (videoForm.mode === 0 && videoForm.subtitleSelector === 1 && videoForm.videoType === 0) {
    subtitlePreviewFrameBase64.value = await getFrameBase64(digitalHuman.coverUrl || '', digitalHuman.videoUrl || '')
  }
  // 其他情况封面预览依赖 currentDigitalHumanImg 计算属性自动更新，无需额外操作
}

// --- 角标选择器 ---
const openCornerMarkSelector = () => {
  cornerMarkSelectorDialog.visible = true
  cornerMarkSelectorDialog.search = ''
}

const selectCornerMark = async (item: any) => {
  videoForm.cornerMark = item.id
  cornerMarkSelectorDialog.visible = false
  ElMessage.success(`已选择角标: ${item.name}`)
  try {
    await recordRecentCornerMark(item.id)
    await loadRecentCornerMarks()
  } catch (e) {
    console.error('记录角标使用失败:', e)
  }
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
    // 加载配音时传入 language 参数
    const searchParams: any = {}
    if (voiceSelectorDialog.search) searchParams.name = voiceSelectorDialog.search
    searchParams.language = videoForm.language
    const response = await getVoicePaginateList(voiceSelectorDialog.page, voiceSelectorDialog.pageSize, searchParams)
    
    if (response.data && response.data.data) {
      const data = response.data.data
      const voiceList = data.data || []
      
      if (voiceList.length === 0) {
        voiceSelectorDialog.hasMore = false
        voiceSelectorDialog.loading = false
        return
      }
      
      const newItems = voiceList.map((voice: any) => {
        const rawUrl = voice.url || voice.audio || voice.voiceUrl || voice.voice_url || voice.audioUrl || ''
        const audioUrl = extractAudioUrl(rawUrl)
        return {
          name: voice.voiceName || voice.name,
          externalId: voice.externalId,
          url: audioUrl,
          language: voice.language || videoForm.language,
          ...voice
        }
      })
      
      voiceSelectorDialog.allList.push(...newItems)
      voiceSelectorDialog.displayList = voiceSelectorDialog.allList
      voiceSelectorDialog.page++
      
      if (voiceList.length < voiceSelectorDialog.pageSize) {
        voiceSelectorDialog.hasMore = false
      }
    }
  } catch (error) {
    console.error('加载配音失败:', error)
    ElMessage.error('加载配音失败')
  } finally {
    voiceSelectorDialog.loading = false
  }
}

// 滚动到底部时自动加载更多配音
const handleVoiceScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && voiceSelectorDialog.hasMore && !voiceSelectorDialog.loading) {
    loadMoreVoices()
  }
}

const selectVoice = (item: any) => {
  console.log('[selectVoice] item:', item)
  videoForm.voice = item.name
  videoForm.voiceExternalId = item.externalId || ''
  videoForm.voiceUrl = item.url || ''
  voiceSelectorDialog.visible = false
  ElMessage.success('已选择配音')
}

// --- 快捷预设选择器 ---
const openRelSelector = async () => {
  relSelectorDialog.visible = true
  // 重置分页
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
    // 加载预设时传入 language 参数
    const searchParams: any = {}
    if (relSelectorDialog.search) {
      searchParams.title = relSelectorDialog.search
    }
    searchParams.language = videoForm.language
    const response = await getBindingList(relSelectorDialog.page, relSelectorDialog.pageSize, searchParams)
    
    if (response.data && response.data.data) {
      const data = response.data.data
      const bindingList = data.data || []
      
      if (bindingList.length === 0) {
        relSelectorDialog.hasMore = false
        relSelectorDialog.loading = false
        return
      }
      
      const newItems = bindingList.map((binding: any) => {
        const voiceUrl = binding.voiceUrl || binding.voice_url || binding.url || binding.audio || ''
        return {
          id: binding.id,
          name: `${binding.voiceName} + ${binding.digitalHumanName}`,
          voice: binding.voiceName,
          human: binding.digitalHumanName,
          voiceName: binding.voiceName,
          digitalHumanName: binding.digitalHumanName,
          voiceId: binding.voiceId,
          digitalHumanId: binding.digitalHumanId,
          title: binding.title,
          digitalHumanUrl: binding.digitalHumanUrl,
          digitalHumanCoverUrl: binding.digitalHumanCoverUrl || binding.coverUrl || binding.digitalHumanUrl,
          voiceUrl: voiceUrl,
          language: binding.language || videoForm.language,
          ...binding
        }
      })
      
      relSelectorDialog.allList.push(...newItems)
      relSelectorDialog.displayList = relSelectorDialog.allList
      relSelectorDialog.page++
      
      if (bindingList.length < relSelectorDialog.pageSize) {
        relSelectorDialog.hasMore = false
      }
    }
  } catch (error) {
    console.error('加载预设失败:', error)
    ElMessage.error('加载预设失败')
  } finally {
    relSelectorDialog.loading = false
  }
}

// 滚动到底部时自动加载更多预设
const handleRelScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && relSelectorDialog.hasMore && !relSelectorDialog.loading) {
    loadMoreRels()
  }
}

const selectRel = async (item: any) => {
  console.log('[selectRel] item:', item)
  // 调用 handleRelChange 处理预设选择逻辑
  await handleRelChange(item.id, item)
  relSelectorDialog.visible = false
}

const clearRelSelection = () => {
  videoForm.relId = ''
  relName.value = ''
  videoForm.previewImg = ''
  videoForm.label = ''
  relSelectorDialog.search = ''
  ElMessage.success('已清空预设选择')
}

// 监听搜索框变化
watch(() => humanSelectorDialog.search, (newVal) => {
  // 重置分页，重新从API加载搜索结果
  humanSelectorDialog.allList = []
  humanSelectorDialog.displayList = []
  humanSelectorDialog.page = 1
  humanSelectorDialog.hasMore = true
  loadMoreHumans()
})

watch(() => voiceSelectorDialog.search, (newVal) => {
  // 重置分页，重新从API加载搜索结果
  voiceSelectorDialog.allList = []
  voiceSelectorDialog.displayList = []
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = true
  loadMoreVoices()
})

watch(() => relSelectorDialog.search, (newVal) => {
  // 重置分页，重新从API加载搜索结果
  relSelectorDialog.allList = []
  relSelectorDialog.displayList = []
  relSelectorDialog.page = 1
  relSelectorDialog.hasMore = true
  loadMoreRels()
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
