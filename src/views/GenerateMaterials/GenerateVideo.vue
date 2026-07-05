<template>
  <div class="generate-video p-6 bg-gray-50 min-h-full">
    <!-- 列表页面 -->
    <div v-if="!showCreate" class="max-w-[1500px] mx-auto">
      <!-- 顶部标题 -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-800">数字人生成</h2>
          <p class="text-xs text-gray-400 mt-1">快速配置并制作单个高质量数字人视频</p>
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
            <div class="queue-hint">
              <div class="text-xs text-gray-400">今日排队</div>
              <div v-if="videoWaitingInfo.waitingTotal > 0" class="text-sm font-semibold text-gray-700">
                当前还有 <span class="text-amber-600">{{ videoWaitingInfo.waitingTotal }}</span> 个等待任务
              </div>
              <div v-else class="text-sm font-semibold text-gray-700">当前没有等待任务</div>
            </div>
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

        <div class="overflow-x-auto">
        <el-table 
          ref="videoTableRef"
          :data="filteredVideoList" 
          row-key="id"
          border 
          style="width: 100%"
          class="min-w-[1350px]"
          header-cell-class-name="bg-gray-50 font-bold text-gray-700"
          @selection-change="handleVideoSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />
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
                <div class="min-w-0">
                  <div class="font-bold text-gray-800">
                    <OverflowTooltipText :text="getVideoInfoTitle(scope.row)" :max-chars="60" />
                  </div>
                  <div class="text-xs text-gray-400">ID: {{ scope.row.id }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="任务状态" width="140" align="center">
            <template #default="scope">
              <div class="flex flex-col items-center gap-1">
                <el-tag :type="getStatusType(scope.row.taskStatus)" :effect="scope.row.taskStatus === '5' ? 'light' : 'plain'">
                  {{ getStatusLabel(scope.row.taskStatus) }}
                </el-tag>
                <span
                  v-if="scope.row.taskStatus === '5'"
                  class="text-xs"
                  :class="scope.row.isDownloaded === 1 ? 'text-green-600' : 'text-gray-400'"
                >
                  {{ scope.row.isDownloaded === 1 ? '已导出到本地' : '未导出到本地' }}
                </span>
              </div>
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
              <span v-if="scope.row.taskStatus === '5'" class="text-sm">{{ scope.row.endTime || scope.row.updateTime }}</span>
              <span v-else class="text-gray-400 text-sm">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="210" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" plain @click="handleViewVideo(scope.row)">查看</el-button>
              <el-button v-if="isFailedVideoTask(scope.row)" type="warning" size="small" plain @click="handleRetryVideo(scope.row)">重推</el-button>
              <el-button type="danger" size="small" plain @click="handleDeleteVideo(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        </div>

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

    <!-- 数字人生成页面 -->
    <div v-else class="max-w-[1400px] mx-auto">
      <!-- 顶部标题 -->
      <div class="bg-white px-5 py-3 rounded-xl shadow-sm relative border border-gray-100 mb-4">
        <div class="w-full">
          <el-button @click="handleBackToList" icon="el-icon-arrow-left" class="mb-2">返回列表</el-button>
          <div class="text-center">
            <h2 class="text-xl font-bold text-gray-800">数字人生成</h2>
            <p class="text-xs text-gray-400 mt-0.5">快速配置并制作单个高质量视频素材</p>
          </div>
        </div>
      </div>

      <div class="flex gap-6">
      <div class="flex-1 space-y-4">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-full">
          <el-form :model="videoForm" label-width="100px" label-position="top">
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
                    <el-radio v-if="enableAudioDrive" :label="1" size="large" border>音频驱动视频</el-radio>
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
                  <span v-if="videoForm.mode === 1" class="text-xs text-gray-400 ml-2">音频驱动模式下无需选择配音，系统将使用你上传的音频</span>
                </el-form-item>
              </el-col>
            </el-row>

                        <el-row v-if="videoForm.mode === 0" :gutter="20" class="mt-2">
              <el-col :span="24">
                <el-form-item class="!mb-2">
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

            <el-row v-if="enableAdvancedPostProcess && videoForm.mode === 0" :gutter="20" class="mt-2">
                                      <el-col :span="12">
                                        <el-form-item class="!mb-2">
                                          <template #label><span class="text-gray-700">启用字幕</span></template>
                                          <el-switch 
                                            v-model="videoForm.subtitleSelector" 
                                            :active-value="1" 
                                            :inactive-value="0"
                                :disabled="videoForm.videoType === 1"
                                active-text="开启"
                                inactive-text="关闭"
                              />
                              <span v-if="videoForm.videoType === 1" class="text-xs text-gray-400 ml-2">横版模式下不支持字幕</span>
                            </el-form-item>
                          </el-col>
                        </el-row>

            <!-- 角标选择 -->
            <el-row :gutter="20" class="mt-2" v-if="enableAdvancedPostProcess && videoForm.videoType !== 1">
              <el-col :span="24">
                <el-form-item class="!mb-2">
                                    <div class="flex items-start gap-3">
                    <div class="flex items-center gap-2 flex-1">
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

            <el-row :gutter="20" class="mt-2" v-if="enableAdvancedPostProcess && videoForm.videoType !== 1">
              <el-col :span="24">
                <el-form-item class="!mb-2">
                  <div class="flex items-start gap-3">
                    <div class="flex items-center gap-2 flex-1">
                      <el-input
                        :model-value="currentBannerOverlayName"
                        placeholder="点击搜索选择横幅"
                        readonly
                        style="cursor: pointer;"
                        clearable
                        @clear="selectedBannerOverlayId = ''; selectedBannerOverlayBase64 = ''"
                        @click="openBannerOverlaySelector"
                        class="flex-1"
                      >
                        <template #prepend>选择横幅</template>
                        <template #append>
                          <el-button icon="el-icon-search" @click.stop="openBannerOverlaySelector" />
                        </template>
                      </el-input>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

                        <el-row>
              <el-col :span="24">
                <div class="text-[11px] text-gray-400 mb-2 italic">
                    <i class="el-icon-info"></i> 说明：选择预设后将自动覆盖上方的形象和配音选择。                </div>
              </el-col>
            </el-row>

            <!-- 标题部分 -->
            <div class="mt-2">
              <el-form-item class="!mb-2">
                <template #label>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-700"><span class="text-red-500">*</span> 视频标题</span>
                    <el-button size="small" plain @click="fillDefaultTitle">默认</el-button>
                    <span class="text-xs text-gray-400">默认以“数字人+配音+时间戳”命名</span>
                  </div>
                </template>
                <el-input 
                  v-model="videoForm.title" 
                  placeholder="留空点击“默认”自动生成标题"
                  maxlength="100"
                  show-word-limit
                  clearable
                />
              </el-form-item>
            </div>

                        <!-- 文案模式：文案部分 -->
                        <div v-if="videoForm.mode === 0" class="mt-2">
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
                            <div
                              v-if="videoForm.mode === 1 && audioUploadState.visible"
                              class="mt-3 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3"
                            >
                              <div class="flex items-start justify-between gap-3">
                                <div>
                                  <div class="text-sm font-semibold text-slate-700">{{ audioUploadStatusText }}</div>
                                  <div class="mt-1 text-xs text-slate-500">{{ audioUploadDetailText }}</div>
                                </div>
                                <el-button
                                  v-if="audioUploadState.canRetry"
                                  size="small"
                                  type="primary"
                                  plain
                                  :disabled="isGenerating || !audioFile"
                                  @click="retryAudioUpload"
                                >
                                  重新上传
                                </el-button>
                              </div>
                              <el-progress
                                class="mt-3"
                                :percentage="audioUploadState.progress"
                                :status="audioUploadProgressStatus"
                                :stroke-width="10"
                              />
                            </div>
                          </el-form-item>
                        </div>

            <div class="mt-4 flex flex-col items-center border-t border-gray-50 pt-4 gap-3">
               <div class="flex items-center gap-4">
                 <el-button 
                   type="primary" 
                   size="large" 
                   class="!w-48 !h-12 !font-bold rounded-xl shadow-lg shadow-blue-100"
                   :loading="isGenerating && submitDispatchMode === 'immediate'"
                   :disabled="isGenerating"
                   icon="el-icon-video-play"
                   @click="startGeneration('immediate')"
                 >
                   {{ generationButtonText }}
                 </el-button>
                 <el-button
                   v-if="enableOvernightDispatch"
                   size="large"
                   class="!w-48 !h-12 !font-bold rounded-xl border-orange-300 text-orange-500 hover:!text-orange-600 hover:!border-orange-400"
                   :loading="isGenerating && submitDispatchMode === 'overnight'"
                   :disabled="isGenerating"
                   @click="startGeneration('overnight')"
                 >
                   {{ overnightGenerationButtonText }}
                 </el-button>
               </div>
               <p v-if="enableOvernightDispatch" class="text-xs text-gray-400">通宵预排会在每日 22:00 至次日 09:00 窗口内进入生成，用于分流。</p>
            </div>
          </el-form>
        </div>
      </div>

      <!-- 右侧预览与结果区 -->
      <div class="w-[440px] space-y-4">
        <!-- 预览效果 -->
        <div v-if="shouldShowSubtitlePreview" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="el-icon-picture-outline text-orange-500"></i>预览效果
                  </h3>
                  <SubtitlePreview
                    ref="subtitlePreviewRef"
                    :frame-base64="subtitlePreviewFrameBase64"
                    :script-text="videoForm.script"
                    :corner-mark-url="currentCornerMarkUrl"
                    :banner-overlay-base64="selectedBannerOverlayBase64"
                    :process-types="previewProcessTypes"
                    :enable-subtitle="shouldApplySubtitle"
                    :initial-config="subtitleConfig"
                    @update:config="handleSubtitleConfigUpdate"
                  />
        </div>
        <div v-else class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="el-icon-picture-outline text-orange-500"></i>预览效果
                  </h3>
                  <div class="mx-auto w-[270px] h-[480px] rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
                    <img v-if="currentDigitalHumanImg" :key="'prev-' + videoForm.mode + '-' + videoForm.digitalHuman" :src="currentDigitalHumanImg" class="w-full h-full object-cover" alt="数字人预览" @error="(e) => { e.target.style.display = 'none' }">
                    <span v-else class="text-gray-300 text-sm">尚未选择形象</span>
                  </div>
                  <p v-if="videoForm.digitalHuman" class="text-xs text-gray-400 mt-2 text-center">{{ videoForm.digitalHuman }}</p>
        </div>

        <!-- 任务状态与历史 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
           <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <el-icon class="text-green-500"><el-icon-clock /></el-icon>执行状态          </h3>
          
          <div v-if="isGenerating" class="py-10 text-center animate-fade-in">
             <template v-if="videoForm.mode === 1">
               <div class="mx-auto max-w-md rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-left">
                 <div class="flex items-start justify-between gap-4">
                   <div>
                     <p class="text-sm font-bold text-slate-700">{{ audioUploadStatusText }}</p>
                     <p class="mt-1 text-xs text-slate-500">{{ audioUploadDetailText }}</p>
                   </div>
                   <div class="text-2xl font-bold text-blue-600">{{ audioUploadState.progress }}%</div>
                 </div>
                 <el-progress
                   class="mt-4"
                   :percentage="audioUploadState.progress"
                   :status="audioUploadProgressStatus"
                   :stroke-width="12"
                 />
                 <p class="text-xs text-gray-400 mt-3">{{ generationProgressHint }}</p>
               </div>
             </template>
             <template v-else>
               <el-progress type="circle" :percentage="genProgress" status="success" :stroke-width="10"></el-progress>
               <p class="mt-4 text-sm font-bold text-gray-600">{{ genStage }}</p>
               <p class="text-xs text-gray-400 mt-2">{{ generationProgressHint }}</p>
             </template>
          </div>

          <div v-else-if="resultVideo" class="animate-fade-in">
             <div class="bg-green-50 border border-green-100 rounded-xl p-5 mb-4">
                <div class="flex items-center gap-3 text-green-700">
                   <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                      <i class="el-icon-check"></i>
                   </div>
                   <div>
                      <h4 class="font-bold text-sm">视频生成成功</h4>
                      <p class="text-[10px] opacity-70">生成耗时：约 15 秒</p>
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
             <p class="mt-4 text-xs">配置后点击下方生成按钮开始制作</p>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 文案库/历史记录选择器-->
    <el-dialog :title="scriptSelector.title" v-model="scriptSelector.visible" width="900px" append-to-body @open="onDialogOpen">
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

    <!-- 保存至文案库弹窗 -->
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
                @error="(e) => e.target.src = 'https://via.placeholder.com/150x200?text=Error'"
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

    <!-- 角标选择器-->
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
    <el-dialog title="选择横幅" v-model="bannerOverlaySelectorDialog.visible" width="900px" append-to-body>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <el-input placeholder="搜索横幅..." v-model="bannerOverlaySelectorDialog.search" size="small" style="width: 300px;" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div class="grid grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[700px] overflow-y-auto" @scroll="handleBannerOverlayScroll">
          <div v-for="item in bannerOverlaySelectorDialog.displayList" :key="item.id" class="relative cursor-pointer group text-center" @click="selectBannerOverlay(item)">
            <div class="aspect-auto rounded-lg overflow-hidden border-2 transition-all shadow-sm p-2 bg-white h-[260px] flex items-center justify-center"
                 :class="String(selectedBannerOverlayId) === String(item.id) ? 'border-blue-500 shadow-lg shadow-blue-300/50' : 'border-blue-300 group-hover:border-blue-400 group-hover:shadow-md'">
              <img :src="item.outputUrl || item.overlayUrl" class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" :alt="item.name">
            </div>
            <div class="mt-3">
              <p class="text-sm text-gray-700 font-medium truncate text-center">{{ item.name }}</p>
            </div>
            <div v-if="String(selectedBannerOverlayId) === String(item.id)" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
          <div v-if="bannerOverlaySelectorDialog.loading" class="col-span-3 text-center py-4 text-gray-400 text-sm">加载中...</div>
          <div v-else-if="!bannerOverlaySelectorDialog.hasMore && bannerOverlaySelectorDialog.displayList.length > 0" class="col-span-3 text-center py-3 text-gray-400 text-xs">已全部加载</div>
        </div>
      </div>
    </el-dialog>

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
          <!-- 加载更多占位（必须在 grid 内撑开整行）-->
          <div v-if="voiceSelectorDialog.loading" class="col-span-3 text-center py-4 text-gray-400 text-sm">
            加载中...
          </div>
          <div v-else-if="!voiceSelectorDialog.hasMore && voiceSelectorDialog.displayList.length > 0" class="col-span-3 text-center py-3 text-gray-400 text-xs">
            已全部加载          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 快捷预设选择器 -->
    <el-dialog title="选择快捷预设" v-model="relSelectorDialog.visible" width="1000px" append-to-body>
      <div class="space-y-4">
        <div class="flex gap-2 flex-wrap">
            <el-input
              v-model="relSelectorDialog.voiceSearch"
              placeholder="输入声音名称搜索"
              style="width: 220px"
              clearable
            >
              <template #prepend>声音</template>
            </el-input>

            <el-input
              v-model="relSelectorDialog.digitalHumanSearch"
              placeholder="输入数字人名称搜索"
              style="width: 220px"
              clearable
            >
              <template #prepend>数字人</template>
            </el-input>

            <el-input
              v-model="relSelectorDialog.tagSearch"
              placeholder="输入标签搜索"
              style="width: 220px"
              clearable
            >
              <template #prepend>标签</template>
            </el-input>

            <el-button type="danger" plain @click="clearRelSelection">
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
            <div class="w-3/4 mx-auto aspect-[3/4] overflow-hidden bg-gray-200 relative flex items-center justify-center">
              <img 
                v-if="item.digitalHumanCoverUrl"
                :src="item.digitalHumanCoverUrl" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                @error="handleRelCoverError(item)"
              >
              <video
                v-else-if="item.digitalHumanUrl"
                :src="item.digitalHumanUrl"
                class="w-full h-full object-cover"
                muted
                preload="metadata"
                playsinline
              />
              <span v-else class="text-xs text-gray-400">暂无封面</span>
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
                  <span class="text-blue-500">▶</span>视频内容
               </h4>
               <el-button type="primary" size="small" @click="downloadVideo" :icon="ElIcon.Download">
                 下载视频
               </el-button>
             </div>
             <div class="bg-black flex items-center justify-center rounded-lg overflow-hidden h-[500px] border-2 border-blue-100">
                <video :src="videoPreview.url" controls autoplay class="max-w-full max-h-full"></video>
             </div>
          </div>
          
          <!-- 预览鍥 -->
          <div v-if="videoPreview.coverUrl" class="space-y-3">
             <h4 class="font-bold text-gray-800 text-base flex items-center gap-2">
                <span class="text-yellow-500">🖼</span>视频封面
             </h4>
             <img :src="videoPreview.coverUrl" class="w-full max-h-[300px] object-contain rounded-lg border-2 border-yellow-100">
          </div>
          
          <!-- 配音试听 -->
          <div v-if="videoPreview.voiceUrl" class="space-y-3">
             <div class="flex items-center justify-between">
               <h4 class="font-bold text-gray-800 text-base flex items-center gap-2">
                  <span class="text-green-500">🎧</span>配音试听
               </h4>
               <el-button type="success" size="small" @click="downloadAudio" :icon="ElIcon.Download">
                 下载音频
               </el-button>
             </div>
             <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-100">
               <audio :src="resolveAssetUrl(videoPreview.voiceUrl)" controls class="w-full h-10"></audio>
             </div>
          </div>
       </div>
       
       <!-- 对话框底部按閽 -->
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
import { ElMessage, ElMessageBox } from 'element-plus'
import * as ElIcon from '@element-plus/icons-vue'
import { Search } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import { getTenantDetail } from '/@/api/tenant'
import { useLayoutStore } from '/@/store/modules/layout'
import { useTaskStore } from '/@/store/modules/task'
import { createVideoTask, createAudioVideoTask, getVideoTaskList, getVideoTaskWaiting, deleteVideoTask, retryVideoTask, getVoiceList, getVoicePaginateList, getDigitalHumanList, getDigitalHumanPaginateList, getVideoTaskDetail, getBindingList, getScriptPaginateList, getScriptHistoryList, createScript, createScriptHistory, getCornerMarkList, toTopCornerMark, getSubtitlePreviewFrame, getRecentCornerMarks, recordRecentCornerMark, downloadFileByProxy } from '/@/api/material'
import request from '/@/utils/request'
import SubtitlePreview from '/@/components/SubtitlePreview/index.vue'
import OverflowTooltipText from '/@/components/OverflowTooltipText.vue'
import { downloadProxyFile, fetchProxyBlob, normalizeAssetUrl } from '/@/utils/download'

// --- 数据定义 ---
const layoutStore = useLayoutStore()
const taskStore = useTaskStore()
const GENERIC_REQUEST_ERROR_MESSAGE = '请求失败，请联系管理员'

// 页面状态
const showCreate = ref(false)

// 任务列表
// 浠诲姟鍒楄〃
const videoTableRef = ref<any>(null)
const videoTaskList = ref<any[]>([])
const searchKeyword = ref('')
const searchLabel = ref('')
const selectedVideos = ref<any[]>([])
const selectedVideoIds = ref<Array<string | number>>([])
const videoTaskPage = ref(1)
const videoTaskPageSize = ref(20)
const videoTaskTotal = ref(0)
const videoWaitingInfo = reactive({
  waitingTotal: 0,
  waitingBefore: 0
})
const filteredVideoList = computed(() => {
  return videoTaskList.value
})

const splitLabel = (labelValue: string | string[] | null | undefined) => {
  if (!labelValue) return []
  if (Array.isArray(labelValue)) return labelValue.filter((t: string) => !!String(t).trim())
  return String(labelValue).split('|').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
}

const handleVideoSelectionChange = (rows: any[]) => {
  const currentPageIds = new Set(videoTaskList.value.map((item: any) => item.id))
  const nextSelectedIds = selectedVideoIds.value.filter((id) => !currentPageIds.has(id))
  const pageSelectedIds = rows.map((item: any) => item.id)
  selectedVideoIds.value = [...nextSelectedIds, ...pageSelectedIds]

  const selectedIdSet = new Set(selectedVideoIds.value)
  selectedVideos.value = [
    ...selectedVideos.value.filter((item: any) => !currentPageIds.has(item.id) && selectedIdSet.has(item.id)),
    ...videoTaskList.value.filter((item: any) => selectedIdSet.has(item.id)),
  ]
}

const restoreVideoSelection = async () => {
  await nextTick()
  const table = videoTableRef.value
  if (!table) return

  const selectedIdSet = new Set(selectedVideoIds.value)
  table.clearSelection()
  videoTaskList.value.forEach((item: any) => {
    if (selectedIdSet.has(item.id)) {
      table.toggleRowSelection(item, true)
    }
  })
  selectedVideos.value = videoTaskList.value.filter((item: any) => selectedIdSet.has(item.id))
}

const videoForm = reactive({
  title: '',
  channel: 'A2E',
  relId: '',
  digitalHuman: '',
  digitalHumanExternalId: '',
  voice: '',
  voiceExternalId: '',
  voiceUrl: '',
  script: '',
  language: 'zh',
  subtitleSelector: 1,
  subtitleColor: 'yellow',
  videoType: 0 as 0 | 1,
  mode: 0 as 0 | 1,
  cornerMark: '',
  previewImg: '',
  label: ''
})

// 上传音频模式相关
const audioUploadRef = ref<any>(null)
const audioFile = ref<File | null>(null)
const audioFileName = ref('')
const AUDIO_UPLOAD_REQUEST_TIMEOUT = 180000
type AudioUploadStage = 'idle' | 'uploading' | 'timeout' | 'failed' | 'success'
const audioUploadState = reactive({
  visible: false,
  progress: 0,
  stage: 'idle' as AudioUploadStage,
  canRetry: false,
  lastDispatchMode: 'immediate' as 'immediate' | 'overnight',
  errorMessage: ''
})

const resetAudioUploadState = () => {
  audioUploadState.visible = false
  audioUploadState.progress = 0
  audioUploadState.stage = 'idle'
  audioUploadState.canRetry = false
  audioUploadState.lastDispatchMode = 'immediate'
  audioUploadState.errorMessage = ''
}

const startAudioUploadTracking = (dispatchMode: 'immediate' | 'overnight') => {
  audioUploadState.visible = true
  audioUploadState.progress = 0
  audioUploadState.stage = 'uploading'
  audioUploadState.canRetry = false
  audioUploadState.lastDispatchMode = dispatchMode
  audioUploadState.errorMessage = ''
}

const updateAudioUploadProgress = (loaded: number, total?: number) => {
  if (!audioUploadState.visible) {
    audioUploadState.visible = true
  }
  audioUploadState.stage = 'uploading'
  audioUploadState.canRetry = false
  const nextProgress = total && total > 0
    ? Math.min(95, Math.max(1, Math.round((loaded / total) * 95)))
    : Math.min(95, Math.max(audioUploadState.progress, 15))
  audioUploadState.progress = nextProgress
  genProgress.value = nextProgress
  genStage.value = '音频正在上传，请稍等...'
}

const markAudioUploadSuccess = (dispatchMode: 'immediate' | 'overnight') => {
  audioUploadState.visible = true
  audioUploadState.stage = 'success'
  audioUploadState.canRetry = false
  audioUploadState.progress = 100
  audioUploadState.errorMessage = ''
  genProgress.value = 100
  genStage.value = dispatchMode === 'overnight'
    ? '音频上传完成，预排任务已创建'
    : '音频上传完成，任务已进入队列'
}

const markAudioUploadFailure = (message: string, isTimeout: boolean) => {
  audioUploadState.visible = true
  audioUploadState.stage = isTimeout ? 'timeout' : 'failed'
  audioUploadState.canRetry = true
  audioUploadState.errorMessage = message
}

const audioUploadStatusText = computed(() => {
  switch (audioUploadState.stage) {
    case 'uploading':
      return '音频正在上传，请稍等'
    case 'timeout':
      return '音频上传超时，请重新上传'
    case 'failed':
      return '音频上传失败，请重新上传'
    case 'success':
      return '音频上传完成'
    default:
      return '等待上传音频'
  }
})

const audioUploadDetailText = computed(() => {
  if (audioUploadState.stage === 'timeout') {
    return '当前进度已保留在超时时刻，请直接点击“重新上传”再次提交。'
  }
  if (audioUploadState.stage === 'failed') {
    return audioUploadState.errorMessage || '音频提交未完成，请重新上传后再试。'
  }
  if (audioUploadState.stage === 'success') {
    return '音频源已经写入 A2E，可继续进入后续视频生成队列。'
  }
  return '文件上传完成并收到平台成功响应前，请不要关闭页面。'
})

const audioUploadProgressStatus = computed(() => {
  if (audioUploadState.stage === 'timeout' || audioUploadState.stage === 'failed') {
    return 'exception'
  }
  if (audioUploadState.stage === 'success') {
    return 'success'
  }
  return undefined
})

const handleAudioChange = (uploadFile: any) => {
  audioFile.value = uploadFile.raw
  audioFileName.value = uploadFile.name
  resetAudioUploadState()
  return false  // 闃绘鑷姩上传
}

const handleAudioRemove = () => {
  audioFile.value = null
  audioFileName.value = ''
  resetAudioUploadState()
}

const clearAudioFile = () => {
  audioFile.value = null
  audioFileName.value = ''
  resetAudioUploadState()
  if (audioUploadRef.value) {
    audioUploadRef.value.clearFiles()
  }
}

const relList = ref<any[]>([])
const voiceSearchInput = ref('')  // 配音搜索框
const digitalHumanSearchInput = ref('')  // 数字人搜索框

// 模拟数据 - 如果需要保留默认选项
const defaultRelList = [
  { id: 1, name: '夏季服装场景（小美 + 甜美女声）', human: '小美', voice: '甜美女声' },
  { id: 2, name: '专业测评场景（阿强 + 磁性男声）', human: '阿强', voice: '磁性男声' }
]

// 数字人选项列表（从 API 获取）
const humanOptions = ref<any[]>([])
const humanSearch = ref('')  // 数字人搜索框

// 配音选项列表（从 API 获取）
const voiceOptions = ref<any[]>([])
const voiceSearch = ref('')  // 配音搜索框
// 角标选项列表（从 API 获取）
const cornerMarkOptions = ref<any[]>([])
// 近期使用的角标（后端接口就绪后赋值）
const recentCornerMarks = ref<any[]>([])

// 将后端返回的 {id, name} 列表与本地 cornerMarkOptions 合并，补全 photoUrl
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

let humanSearchTimer: NodeJS.Timeout
let voiceSearchTimer: NodeJS.Timeout

const scriptLibrary = ref<any[]>([])
const scriptHistory = ref<any[]>([])
const videoTaskRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)

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
    // 初始化置顶列表：sort不为null的按sort鍊掑簭
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
const submitDispatchMode = ref<'immediate' | 'overnight'>('immediate')
const generationButtonText = computed(() => {
  if (!isGenerating.value || submitDispatchMode.value !== 'immediate') {
    return videoForm.mode === 1 ? '上传音频并创建视频' : '立即生成视频'
  }
  return videoForm.mode === 1 ? '上传音频并创建中...' : '正在生成视频...'
})
const overnightGenerationButtonText = computed(() => {
  if (!isGenerating.value || submitDispatchMode.value !== 'overnight') {
    return '通宵预排'
  }
  return videoForm.mode === 1 ? '加入通宵预排中...' : '创建通宵预排中...'
})
const generationProgressHint = computed(() => {
  if (submitDispatchMode.value === 'overnight') {
    return videoForm.mode === 1
      ? '音频上传中 -> 创建预排任务 -> 夜间窗口入队'
      : '任务创建中 -> 进入通宵预排 -> 夜间窗口入队'
  }
  return videoForm.mode === 1
    ? '音频上传中 -> 创建任务 -> 队列处理'
    : '素材上传中 -> 逻辑合成 -> 最终渲染'
})

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

// 配音选择器滚动容器 ref
const voiceScrollRef = ref<HTMLElement | null>(null)

// 字幕预览相关
const subtitlePreviewRef = ref<InstanceType<typeof SubtitlePreview> | null>(null)
const subtitlePreviewFrameBase64 = ref('')
let previewRefreshSeq = 0
const DEFAULT_SUBTITLE_CONFIG = {
  font_size: 18,
  margin_v: 74,
  primary_colour: '#FFFF00',
  outline: 1,
  outline_colour: '#000000',
  bold: 1,
  font_name: '竹言体',
  bg_mode: 'none',
  bg_height: 60,
  bg_colour: 'rgba(0,0,0,0.5)',
  blur_subtitles: false,
  blur_strength: 15
}
const subtitleConfig = reactive({ ...DEFAULT_SUBTITLE_CONFIG })

const getRecentSubtitleConfig = () => {
  return request({
    url: '/api/material/video/subtitle-config/recent/',
    method: 'get',
  })
}

/**
 * 通过后端代理将图片 URL 转 base64（绕过浏览器 CORS） */
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

const bannerOverlayPaginateRequest = (page: number = 1, pageSize: number = 10, search: any = {}) => {
  return request({
    url: '/api/material/banner-overlay/paginate/',
    method: 'post',
    data: {
      page,
      pageSize,
      ...(search && { search })
    },
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })
}

/**
 * 优先使用封面图 URL 转 base64；若无封面或失败，则提取视频首帧
 */
const getFrameBase64 = async (coverUrl: string, videoUrl: string): Promise<string> => {
  console.log('[getFrameBase64] coverUrl:', coverUrl, 'videoUrl:', videoUrl)
  if (coverUrl) {
    try {
      const b64 = await fetchImageAsBase64(coverUrl)
      if (b64) return b64
    } catch (e) {
      console.warn('[getFrameBase64] 封面转换失败，尝试提取视频首帧', e)
    }
  }
  if (videoUrl) {
  console.log('[getFrameBase64] 走视频首帧路径')
    return await extractVideoFirstFrame(videoUrl)
  }
  console.warn('[getFrameBase64] cover 和 video 都为空，返回空字符串')
  return ''
}

const findCurrentDigitalHuman = (item?: any) => {
  if (item) return item

  const currentExternalId = String(videoForm.digitalHumanExternalId || '')
  const currentName = String(videoForm.digitalHuman || '')
  const candidateList = [...humanOptions.value, ...humanSelectorDialog.allList]

  const matchedByExternalId = currentExternalId
    ? candidateList.find((human: any) => String(human.externalId || '') === currentExternalId)
    : null
  if (matchedByExternalId) return matchedByExternalId

  const matchedByName = currentName
    ? candidateList.find((human: any) => String(human.name || '') === currentName)
    : null
  if (matchedByName) return matchedByName

  if (videoForm.relId) {
    const rel = relSelectorDialog.allList.find((entry: any) => String(entry.id) === String(videoForm.relId))
      || relList.value.find((entry: any) => String(entry.id) === String(videoForm.relId))
    if (rel) {
      return {
        name: rel.human || rel.digitalHumanName || currentName,
        externalId: rel.digitalHumanExternalId || rel.externalId || '',
        img: rel.digitalHumanCoverUrl || rel.coverUrl || '',
        coverUrl: rel.digitalHumanCoverUrl || rel.coverUrl || '',
        videoUrl: rel.digitalHumanUrl || ''
      }
    }
  }

  return null
}

// 获取当前选中的数字人视频URL
const currentDigitalHumanVideoUrl = computed(() => {
  return findCurrentDigitalHuman()?.videoUrl || ''
})

// 获取当前选中数字人的封面图（横版预览用）
const currentDigitalHumanImg = computed(() => {
  const currentHuman = findCurrentDigitalHuman()
  return currentHuman?.coverUrl || currentHuman?.img || ''
})

// 获取当前选中角标 URL（供预览组件实时叠加）
const currentCornerMarkUrl = computed(() => {
  if (!videoForm.cornerMark) return ''
  return cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)?.photoUrl || ''
})

const currentCornerMarkName = computed(() => {
  if (!videoForm.cornerMark) return ''
  return cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)?.name || ''
})

const selectedBannerOverlayId = ref<string | number | ''>('')
const selectedBannerOverlayBase64 = ref('')
const bannerOverlayOptions = ref<any[]>([])
const bannerOverlaySelectorDialog = reactive({
  visible: false,
  search: '',
  allList: [] as any[],
  displayList: [] as any[],
  page: 1,
  pageSize: 12,
  loading: false,
  hasMore: true
})

const currentBannerOverlayName = computed(() => {
  if (!selectedBannerOverlayId.value) return ''
  return bannerOverlayOptions.value.find((item: any) => String(item.id) === String(selectedBannerOverlayId.value))?.name || ''
})

const currentBannerOverlaySubmitUrl = computed(() => {
  if (!selectedBannerOverlayId.value) return ''
  const selected = bannerOverlayOptions.value.find((item: any) => String(item.id) === String(selectedBannerOverlayId.value))
  return selected?.outputUrl || selected?.overlayUrl || ''
})

const shouldApplySubtitle = computed(() => {
  if (!enableAdvancedPostProcess.value) return false
  if (videoForm.mode !== 0 || videoForm.videoType !== 0 || videoForm.language === 'th') return false
  return videoForm.subtitleSelector === 1
})

const shouldEnableSubtitlePipeline = computed(() => {
  if (!enableAdvancedPostProcess.value) return false
  if (videoForm.videoType !== 0) return false
  return shouldApplySubtitle.value || !!videoForm.cornerMark || !!selectedBannerOverlayId.value
})

const effectiveSubtitleSelector = computed(() => (shouldEnableSubtitlePipeline.value ? 1 : 0))

const shouldShowSubtitlePreview = computed(() => shouldEnableSubtitlePipeline.value)

const previewProcessTypes = computed(() => {
  const processTypes: string[] = []
  if (shouldApplySubtitle.value) processTypes.push('subtitle')
  if (videoForm.cornerMark) processTypes.push('corner_mark')
  if (selectedBannerOverlayId.value) processTypes.push('banner_overlay')
  return processTypes
})

// 字幕配置更新回调
const handleSubtitleConfigUpdate = (newConfig: any) => {
  Object.assign(subtitleConfig, newConfig)
}

const loadRecentSubtitleConfig = async () => {
  try {
    const res = await getRecentSubtitleConfig()
    const data = res.data?.data ?? res.data
    if (data && typeof data === 'object') {
      Object.assign(subtitleConfig, { ...DEFAULT_SUBTITLE_CONFIG, ...data })
      await nextTick()
      await (subtitlePreviewRef.value as any)?.setConfig?.({ ...subtitleConfig })
      return
    }
  } catch (error) {
    console.error('加载最近字幕配置失败:', error)
  }
  Object.assign(subtitleConfig, DEFAULT_SUBTITLE_CONFIG)
  await nextTick()
  await (subtitlePreviewRef.value as any)?.setConfig?.({ ...subtitleConfig })
}

const resetPostProcessSelections = () => {
  videoForm.subtitleSelector = 0
  videoForm.cornerMark = ''
  selectedBannerOverlayId.value = ''
  selectedBannerOverlayBase64.value = ''
  previewRefreshSeq += 1
  subtitlePreviewFrameBase64.value = ''
  Object.assign(subtitleConfig, DEFAULT_SUBTITLE_CONFIG)
}

const loadTenantRuntimeConfig = async () => {
  if (!currentTenantId.value) {
    tenantRuntimeConfig.enablePostProcessPipeline = false
    tenantRuntimeConfig.enableAudioDrive = false
    tenantRuntimeConfig.enableSubtitlePostProcess = false
    tenantRuntimeConfig.enableCornerMarkPostProcess = false
    tenantRuntimeConfig.enableBannerOverlayPostProcess = false
    resetPostProcessSelections()
    return
  }

  try {
    const response = await getTenantDetail(currentTenantId.value)
    const runtimeConfig = response.data?.data?.runtimeConfig || {}
    tenantRuntimeConfig.enablePostProcessPipeline = Boolean(runtimeConfig.enablePostProcessPipeline)
    tenantRuntimeConfig.enableAudioDrive = runtimeConfig.enableAudioDrive !== false
    tenantRuntimeConfig.enableSubtitlePostProcess = Boolean(runtimeConfig.enableSubtitlePostProcess)
    tenantRuntimeConfig.enableCornerMarkPostProcess = Boolean(runtimeConfig.enableCornerMarkPostProcess)
    tenantRuntimeConfig.enableBannerOverlayPostProcess = Boolean(runtimeConfig.enableBannerOverlayPostProcess)
  } catch (error) {
    console.error('加载团队增强成片配置失败:', error)
    tenantRuntimeConfig.enablePostProcessPipeline = false
    tenantRuntimeConfig.enableAudioDrive = false
    tenantRuntimeConfig.enableSubtitlePostProcess = false
    tenantRuntimeConfig.enableCornerMarkPostProcess = false
    tenantRuntimeConfig.enableBannerOverlayPostProcess = false
  }

  if (!tenantRuntimeConfig.enablePostProcessPipeline) {
    resetPostProcessSelections()
  } else if (videoForm.subtitleSelector !== 1) {
    videoForm.subtitleSelector = 1
  }

  if (!tenantRuntimeConfig.enableAudioDrive && videoForm.mode === 1) {
    videoForm.mode = 0
  }
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
  voiceSearch: '',
  digitalHumanSearch: '',
  tagSearch: '',
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

// 置顶鎺掑簭后的角标列表
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

// 切换置顶状态（调用后端接口，同时处理置顶和取消置顶）
const togglePinCornerMark = async (id: string | number) => {
  try {
    const res = await toTopCornerMark(id)
    // 重新拉取列表以获取最新 sort 值
    await fetchCornerMarks()
    const isPinned = pinnedCornerMarkIds.value.includes(id)
    ElMessage.success(isPinned ? '已取消置顶' : '已置顶，排在最前')
  } catch (error) {
    console.error('置顶操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

const saveScriptDialog = reactive({
  visible: false,
  form: { title: '', tags: [] as string[], newTag: '' }
})

const tenantRuntimeConfig = reactive({
  enablePostProcessPipeline: false,
  enableAudioDrive: false,
  enableSubtitlePostProcess: false,
  enableCornerMarkPostProcess: false,
  enableBannerOverlayPostProcess: false,
})

const currentTenantId = computed(() => Number(layoutStore.getCurrentTenant?.id || 0))
const enableAdvancedPostProcess = computed(() => tenantRuntimeConfig.enablePostProcessPipeline)
const enableAudioDrive = computed(() => tenantRuntimeConfig.enableAudioDrive)
// 第一阶段只开放即时生成，通宵预排入口暂不对前端开放。
const enableOvernightDispatch = false

const videoPreview = reactive({
  visible: false,
  taskId: null as number | null,
  url: '',
  coverUrl: '',
  voiceUrl: '',
  title: '',
  isDownloaded: 0,
})

const resolveAssetUrl = (rawUrl: string) => normalizeAssetUrl(rawUrl)

// 监听关键配置变化，重置配音状鎬?// --- 閫昏緫处理 ---

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
    
    // 处理 API 返回的数据结构：response.data.data.data 是任务列表数组
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
      endTime: task.endTime ? new Date(task.endTime).toLocaleString('zh-CN') : '',
      videoUrl: resolveAssetUrl(task.videoUrl || task.video_url || ''),
      videoCoverUrl: task.videoCoverUrl || task.video_cover_url || '',
      taskStatus: task.taskStatus || '0',
      baseVoiceUrl: resolveAssetUrl(task.baseVoiceUrl || task.base_voice_url || ''),
      isDownloaded: Number(task.isDownloaded ?? task.is_downloaded ?? 0),
    }))

    const availableIds = new Set(videoTaskList.value.map((item: any) => item.id))
    const offPageSelections = selectedVideos.value.filter((item: any) => !availableIds.has(item.id))
    selectedVideos.value = [
      ...offPageSelections,
      ...videoTaskList.value.filter((item: any) => selectedVideoIds.value.includes(item.id)),
    ]
    await restoreVideoSelection()
    
    console.log('加载的任务列表:', videoTaskList.value)
  } catch (error) {
    console.error('加载视频任务列表失败:', error)
  }
}

const loadVideoWaitingInfo = async () => {
  try {
    const res = await getVideoTaskWaiting()
    if (res.data?.code === 200 && res.data?.data) {
      const data = res.data.data
      videoWaitingInfo.waitingTotal = Number(data.waitingTotal || data.waiting_total || 0)
      videoWaitingInfo.waitingBefore = Number(data.waitingBefore || data.waiting_before || 0)
    }
  } catch (error) {
    console.error('加载视频等待任务数失败:', error)
  }
}

const startVideoTaskAutoRefresh = () => {
  if (videoTaskRefreshTimer.value) return
  videoTaskRefreshTimer.value = setInterval(() => {
    if (!showCreate.value) {
      loadVideoTasks()
      loadVideoWaitingInfo()
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
    console.log('数字人列琛ˋPI返回:', response)
    
    // 处理API返回的数据结构：response.data.data.data 是数字人列表数组
    if (response.data && response.data.data) {
      const data = response.data.data
      const humanList = data.data || data || []
      
      // 映射API返回的数据到前端格式
      humanOptions.value = humanList.map((digital: any) => ({
        name: digital.digitalHumanName || digital.name,
        externalId: digital.externalId,
        img: digital.coverUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        coverUrl: digital.coverUrl || '',   // 原始封面 URL，用于字幕预览 frame
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
      { name: '闃垮己', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
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

// 提取音频 URL 辅助函数 - 处理多种格式
const extractAudioUrl = (urlString: string): string => {
  if (!urlString) return ''
  
  // 处理一般字符串 URL
  if (typeof urlString === 'string' && urlString.startsWith('http')) {
    return urlString
  }
  
  // 处理 "['https://...']" 或 "[\"https://...\"]" 的格式
  if (urlString.includes('[') || urlString.includes('(')) {
    // 使用正则提取 https 或 http 开头的 URL
    const match = urlString.match(/https?:\/\/[^'"\]\)\s]+/)
    if (match && match[0]) {
      console.log('从数组字符串中提取 URL:', match[0])
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

const isVideoLikeUrl = (url: string) => {
  return /\.(mp4|mov|m4v|avi|mkv|webm)(\?|#|$)/i.test(url || '')
}

const isImageLikeUrl = (url: string) => {
  return /^data:image\//i.test(url || '') || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url || '')
}

const getBindingCoverUrl = (binding: any) => {
  const coverCandidates = [
    binding.digitalHumanCoverUrl,
    binding.digital_human_cover_url,
    binding.coverUrl,
    binding.cover_url,
    binding.imageUrl,
    binding.image_url,
    binding.img
  ]
  const coverUrl = coverCandidates.find((url: string) => url && !isVideoLikeUrl(url))
  if (coverUrl) return coverUrl

  const digitalHumanUrl = binding.digitalHumanUrl || binding.digital_human_url || ''
  return isImageLikeUrl(digitalHumanUrl) ? digitalHumanUrl : ''
}

const getBindingVideoUrl = (binding: any) => {
  return binding.digitalHumanUrl || binding.digital_human_url || binding.videoUrl || binding.video_url || ''
}

const handleRelCoverError = (item: any) => {
  item.digitalHumanCoverUrl = ''
}

// 加载配音列表（仅加载第一页）
const loadVoiceList = async (searchName?: string) => {
  try {
    // 搜索时传入 language 参数，中文传 'zh'，泰语传 'th'
    const searchParams: any = {}
    if (searchName) searchParams.name = searchName
    searchParams.language = videoForm.language
    const response = await getVoicePaginateList(1, 20, searchParams)
    console.log('配音列表 API 返回, language:', videoForm.language)
    
    // 处理 API 返回的数据结构：response.data.data.data 为配音列表数组
    if (response.data && response.data.data) {
      const data = response.data.data
      const voiceList = data.data || data || []
      
      // 映射API返回的数据到前端格式
      voiceOptions.value = voiceList.map((voice: any) => {
        // 尝试多个字段名来获取音频 URL，然后提取真实URL
        const rawUrl = voice.url || voice.audio || voice.voiceUrl || voice.voice_url || voice.audioUrl || ''
        const audioUrl = extractAudioUrl(rawUrl)
        console.log(`配音 ${voice.voiceName || voice.name} 的原始 URL:`, rawUrl, '-> 提取后', audioUrl)
        return {
          name: voice.voiceName || voice.name,
          externalId: voice.externalId,
          url: audioUrl,
          language: voice.language || videoForm.language,
          // 淇濈暀鍘熷数据以备后续使用
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
    // 支持通过 voiceName 和 digitalHumanName 分别模糊查询
    if (voiceName) {
      searchObj.voiceName = voiceName
    }
    if (digitalHumanName) {
      searchObj.digitalHumanName = digitalHumanName
    }
    // 传入语言参数
    searchObj.language = videoForm.language
    
    const response = await getBindingList(1, 50, searchObj)
    console.log('绑定关系列表 API 返回:', response)
    
    // 处理 API 返回的数据结构
    if (response.data && response.data.data && response.data.data.data) {
      const bindingData = response.data.data.data
      
      // 映射API返回的数据到前端格式
      relList.value = bindingData.map((binding: any) => {
        // 尝试多个字段名来获取音频 URL
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
          // 保留原始数据
          ...binding,
          digitalHumanUrl: getBindingVideoUrl(binding),  // 保存视频 URL
          digitalHumanCoverUrl: getBindingCoverUrl(binding),  // 数字人封面图
          voiceUrl: voiceUrl
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
  loadTenantRuntimeConfig()
  loadVideoTasks()
  loadVideoWaitingInfo()
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

// 切换为横版时自动关闭字幕
watch(() => videoForm.videoType, (val) => {
  if (val === 1) {
    videoForm.subtitleSelector = 0
  }
})

// 当前云上版暂不开放泰语，若旧状态带入则自动回落为中文
watch(() => videoForm.language, (val) => {
  if (val === 'th') {
    videoForm.subtitleSelector = 0
    videoForm.language = 'zh'
  }
})

watch(() => shouldShowSubtitlePreview.value, async (val) => {
  if (val) {
    await refreshPreview()
  } else {
    previewRefreshSeq += 1
    subtitlePreviewFrameBase64.value = ''
  }
})

// 监听 mode 切换：清空模式相关残留，避免预设/配音跨模式遗留
watch(() => videoForm.mode, () => {
  videoForm.relId = ''
  relName.value = ''
  videoForm.voice = ''
  videoForm.voiceExternalId = ''
  videoForm.voiceUrl = ''
  videoForm.digitalHuman = ''
  videoForm.digitalHumanExternalId = ''
  videoForm.previewImg = ''
  videoForm.label = ''
  previewRefreshSeq += 1
  subtitlePreviewFrameBase64.value = ''
  resetAudioUploadState()
})

watch(showCreate, (val) => {
  if (val) {
    stopVideoTaskAutoRefresh()
    if (enableAdvancedPostProcess.value) {
      loadRecentSubtitleConfig()
    } else {
      Object.assign(subtitleConfig, DEFAULT_SUBTITLE_CONFIG)
    }
  } else {
    loadVideoTasks()
    loadVideoWaitingInfo()
    startVideoTaskAutoRefresh()
  }
})

watch(currentTenantId, () => {
  loadTenantRuntimeConfig()
})

watch(enableAdvancedPostProcess, (enabled) => {
  if (!enabled) {
    resetPostProcessSelections()
  }
})

watch(enableAudioDrive, (enabled) => {
  if (!enabled && videoForm.mode === 1) {
    videoForm.mode = 0
  }
})

const handleCreateNew = () => {
  resetForm()
  showCreate.value = true
}

const handleBackToList = () => {
  resetForm()
  showCreate.value = false
}

const handleViewVideo = (video: any) => {
  videoPreview.taskId = Number(video.id ?? 0) || null
  videoPreview.url = resolveAssetUrl(video.videoUrl)
  videoPreview.coverUrl = video.videoCoverUrl
  videoPreview.voiceUrl = resolveAssetUrl(video.baseVoiceUrl)
  videoPreview.title = video.title
  videoPreview.isDownloaded = Number(video.isDownloaded ?? 0)
  videoPreview.visible = true
}

const handleDeleteVideo = async (id: any) => {
  try {
    // 调用 API 删除视频任务
    await deleteVideoTask(id)
    ElMessage.success('视频已删除')
    selectedVideoIds.value = selectedVideoIds.value.filter((selectedId) => selectedId !== id)
    selectedVideos.value = selectedVideos.value.filter((item: any) => item.id !== id)
    // 从列表中移除
    videoTaskList.value = videoTaskList.value.filter(v => v.id !== id)
    await restoreVideoSelection()
  } catch (error) {
    ElMessage.error('删除视频失败')
    console.error('删除视频任务失败:', error)
  }
}

const isFailedVideoTask = (row: any) => String(row?.taskStatus) === '-1'

const handleRetryVideo = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要重推该单条视频任务吗？', '重推确认', {
      confirmButtonText: '重推',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res = await retryVideoTask(row.id)
    if (res.data?.code === 200 || res.data?.success) {
      ElMessage.success('任务已重新加入队列')
      await loadVideoTasks()
      await loadVideoWaitingInfo()
    } else {
      ElMessage.error(res.data?.message || '重推失败，请稍后重试')
    }
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '重推失败，请稍后重试')
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
    '8': '等待中',
    '9': '等待中',
    '-1': '失败'
  }
  return statusMap[String(status)] || '未知'
}

// 获取任务状态类型（用于 tag 颜色）
const getStatusType = (status: string | number): 'success' | 'danger' | 'warning' | 'info' => {
  const statusStr = String(status)
  if (statusStr === '5') return 'success'           // 已完成 - 绿色
  if (statusStr === '-1') return 'danger'           // 失败 - 红色
  if (statusStr === '0') return 'info'              // 等待中 - 灰色
  if (statusStr === '8') return 'info'              // 夜间等待 - 灰色
  if (statusStr === '9') return 'info'              // 夜间等待 - 灰色
  if (statusStr === '4') return 'warning'           // 视频生成中 - 橙色
  return 'info'                                     // 其他 - 灰色
}

const getVideoInfoTitle = (row: any) => {
  return String(row?.title || row?.script || '').trim()
}

const markVideoDownloadedLocally = (taskId?: number | null) => {
  if (!taskId) return

  videoTaskList.value = videoTaskList.value.map((item: any) =>
    Number(item.id) === Number(taskId)
      ? { ...item, isDownloaded: 1 }
      : item
  )

  selectedVideos.value = selectedVideos.value.map((item: any) =>
    Number(item.id) === Number(taskId)
      ? { ...item, isDownloaded: 1 }
      : item
  )

  if (Number(videoPreview.taskId) === Number(taskId)) {
    videoPreview.isDownloaded = 1
  }
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
  relName.value = ''
  videoForm.digitalHuman = ''
  videoForm.digitalHumanExternalId = ''
  videoForm.previewImg = ''
  videoForm.voice = ''
  videoForm.voiceExternalId = ''
  videoForm.voiceUrl = ''
  videoForm.script = ''
  videoForm.language = 'zh'
  videoForm.subtitleSelector = enableAdvancedPostProcess.value ? 1 : 0
  videoForm.subtitleColor = 'yellow'
  videoForm.cornerMark = ''
  selectedBannerOverlayId.value = ''
  selectedBannerOverlayBase64.value = ''
  previewRefreshSeq += 1
  subtitlePreviewFrameBase64.value = ''
  videoForm.label = ''
  videoForm.videoType = 0
  videoForm.mode = 0
  audioFile.value = null
  audioFileName.value = ''
  scriptSelector.visible = false
  scriptSelector.search = ''
  saveScriptDialog.visible = false
  saveScriptDialog.form.title = ''
  saveScriptDialog.form.tags = []
  saveScriptDialog.form.newTag = ''
  humanSelectorDialog.visible = false
  humanSelectorDialog.search = ''
  humanSelectorDialog.allList = []
  humanSelectorDialog.displayList = []
  humanSelectorDialog.page = 1
  humanSelectorDialog.hasMore = true
  voiceSelectorDialog.visible = false
  voiceSelectorDialog.search = ''
  voiceSelectorDialog.allList = []
  voiceSelectorDialog.displayList = []
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = true
  relSelectorDialog.visible = false
  relSelectorDialog.voiceSearch = ''
  relSelectorDialog.digitalHumanSearch = ''
  relSelectorDialog.tagSearch = ''
  relSelectorDialog.allList = []
  relSelectorDialog.displayList = []
  relSelectorDialog.page = 1
  relSelectorDialog.hasMore = true
  cornerMarkSelectorDialog.visible = false
  cornerMarkSelectorDialog.search = ''
  bannerOverlaySelectorDialog.visible = false
  bannerOverlaySelectorDialog.search = ''
  bannerOverlaySelectorDialog.allList = []
  bannerOverlaySelectorDialog.displayList = []
  bannerOverlaySelectorDialog.page = 1
  bannerOverlaySelectorDialog.hasMore = true
  if (audioUploadRef.value) {
    audioUploadRef.value.clearFiles()
  }
  resultVideo.value = ''
  genProgress.value = 0
  genStage.value = '准备就绪'
  submitDispatchMode.value = 'immediate'
  resetAudioUploadState()
}

const getHumanImg = (name: string) => {
  const human = [...humanOptions.value, ...humanSelectorDialog.allList].find((item: any) => item.name === name)
  return human?.img || human?.coverUrl || ''
}

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
    // 记录当前选中的预设，确保提交流程能按预设模式取外部 ID。
    videoForm.relId = rel.id
    relName.value = rel.name
    videoForm.digitalHuman = rel.human || rel.digitalHumanName
    videoForm.voice = rel.voice || rel.voiceName
    videoForm.label = rel.title || ''
    videoForm.digitalHumanExternalId = rel.digitalHumanExternalId || ''
    videoForm.voiceExternalId = rel.voiceExternalId || ''
    videoForm.previewImg = rel.digitalHumanCoverUrl || rel.coverUrl || ''

    ElMessage.success(`已应用联动配置： ${rel.digitalHumanName || rel.human} & ${rel.voiceName || rel.voice}`)

    // 预览属于附加体验，异步补齐，避免阻塞预设选择弹窗关闭。
    const currentRelId = String(rel.id)
    void (async () => {
      try {
        if (shouldShowSubtitlePreview.value) {
          const coverUrl = rel.digitalHumanCoverUrl !== rel.digitalHumanUrl ? rel.digitalHumanCoverUrl : ''
          const previewBase64 = await getFrameBase64(coverUrl, rel.digitalHumanUrl || '')
          if (String(videoForm.relId) === currentRelId) {
            subtitlePreviewFrameBase64.value = previewBase64
          }
        }

        if (!videoForm.previewImg && rel.digitalHumanUrl) {
          const previewImg = await extractVideoFirstFrame(rel.digitalHumanUrl)
          if (String(videoForm.relId) === currentRelId && previewImg) {
            videoForm.previewImg = previewImg
          }
        }
      } catch (error) {
        console.error('联动预设预览补齐失败:', error)
      }
    })()
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
      video.currentTime = Math.min(1, video.duration * 0.1)  // 取 1 秒或视频的 10% 位置
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
  scriptSelector.search = '' // 重置搜索 // 根据 mode 加载数据
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

// 获取所有唯一标签
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
  
  // 文案库按标签搜索，历史文案可按所有字段搜索
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
  // 如果鏈?relId（预设被选中），显示预设的预览图
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

const saveCurrentScriptToHistory = async () => {
  if (videoForm.mode !== 0 || !videoForm.script?.trim()) {
    return
  }

  try {
    await createScriptHistory({
      task_content: videoForm.script.trim(),
      task_tags: []
    })
  } catch (error) {
    console.error('写入历史文案失败:', error)
  }
}

const openSaveScriptDialog = () => {
  saveScriptDialog.form.title = ''
  saveScriptDialog.form.tags = []
  saveScriptDialog.form.newTag = ''
  saveScriptDialog.visible = true
  // 鎵撳紑后重新加载脚本库
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

// A2E 
// 渲染流程模拟
const startGeneration = async (dispatchMode: 'immediate' | 'overnight' = 'immediate') => {
  // 重复点击
  if (isGenerating.value) {
    return
  }

  const effectiveDispatchMode = dispatchMode === 'overnight' && !enableOvernightDispatch
    ? 'immediate'
    : dispatchMode

  const selectedRel = videoForm.relId
    ? (relSelectorDialog.allList.find((item: any) => String(item.id) === String(videoForm.relId))
      || relList.value.find((item: any) => String(item.id) === String(videoForm.relId)))
    : null
  const effectiveHumanName = videoForm.digitalHuman || selectedRel?.digitalHumanName || selectedRel?.human || ''
  const effectiveVoiceName = videoForm.voice || selectedRel?.voiceName || selectedRel?.voice || ''

  if (!videoForm.title || !effectiveHumanName) {
    return ElMessage.warning('请先完整配置标题和数字人')
  }
  
  // 文案模式需要配音
  if (videoForm.mode === 0 && !effectiveVoiceName) {
    return ElMessage.warning('请选择配音')
  }
  
  // 文案模式校验文案，音频模式校验音频
  if (videoForm.mode === 0 && !videoForm.script) {
    return ElMessage.warning('请输入视频文案内容')
  }
  if (videoForm.mode === 1 && !audioFile.value) {
    return ElMessage.warning('请上传音频文件')
  }
  
  submitDispatchMode.value = effectiveDispatchMode
  isGenerating.value = true
  resultVideo.value = ''
  genProgress.value = 0
  genStage.value = effectiveDispatchMode === 'overnight'
    ? (videoForm.mode === 1 ? '正在上传音频并加入通宵预排...' : '正在创建通宵预排任务...')
    : (videoForm.mode === 1 ? '正在上传音频并创建任务...' : '正在上传素材...')

  try {
        let digitalHumanId: string
    let voiceId: string = ''

    if (videoForm.mode === 0) {
      if (videoForm.relId) {
        // 使用绑定预设：直接从 relList 取 voiceExternalId / digitalHumanExternalId
        const rel = selectedRel
        digitalHumanId = rel?.digitalHumanExternalId || videoForm.digitalHumanExternalId || effectiveHumanName
        voiceId = rel?.voiceExternalId || videoForm.voiceExternalId || effectiveVoiceName
        console.log('[提交-绑定预设] rel:', rel?.name, '| digitalHumanExternalId:', digitalHumanId, '| voiceExternalId:', voiceId)
      } else {
        // 单独选择：取各自列表externalId
        digitalHumanId = videoForm.digitalHumanExternalId || humanOptions.value.find((h: any) => h.name === effectiveHumanName)?.externalId || effectiveHumanName
        voiceId = videoForm.voiceExternalId || voiceOptions.value.find((voice: any) => voice.name === effectiveVoiceName)?.externalId || effectiveVoiceName
        console.log('[提交-单独选择] digitalHuman:', effectiveHumanName, '| externalId:', digitalHumanId, '| voice:', effectiveVoiceName, '| externalId:', voiceId)
      }
    } else {
      // 音频模式：只取数字人 ID
      digitalHumanId = videoForm.digitalHumanExternalId || humanOptions.value.find((h: any) => h.name === effectiveHumanName)?.externalId || effectiveHumanName
      console.log('[提交-音频模式] digitalHuman:', effectiveHumanName, '| externalId:', digitalHumanId)
    }
    
    // 确定语言（自动时默认 zh）
    const submitLanguage = videoForm.mode === 1
      ? (videoForm.language === 'zh' ? 'zh-CN' : 'th-TH')
      : videoForm.language
    
        // 创建FormData对象
    const formData = new FormData()
    
    // 添加视频方向参数
    formData.append('type', String(videoForm.videoType))
    
    // 映射表单字段到 API 参数（snake_case）
    formData.append('title', videoForm.title)
    if (videoForm.label) formData.append('label', videoForm.label)
    
    // 文案模式传 msg，音频模式传音频文件
    if (videoForm.mode === 0) {
      formData.append('msg', videoForm.script)
    } else if (audioFile.value) {
      formData.append('file', audioFile.value)
    }
    
    // 文案模式传配音 ID，音频模式不传
    if (videoForm.mode === 0 && voiceId) {
      formData.append('voice_id', voiceId)
    }
    formData.append('digital_human_id', digitalHumanId)
    formData.append('language', submitLanguage)
    formData.append('speechRate', '1')
    formData.append('dispatch_mode', effectiveDispatchMode)
    const bannerOverlayUrl = currentBannerOverlaySubmitUrl.value
    if (bannerOverlayUrl) {
      formData.append('banner_overlay_url', bannerOverlayUrl)
    }
    
    const processTypes: string[] = []
    if (shouldApplySubtitle.value) processTypes.push('subtitle')
    if (videoForm.cornerMark) processTypes.push('corner_mark')
    if (bannerOverlayUrl) processTypes.push('banner_overlay')

    // 字幕开关 / 角标 / 横幅 三者只要任一配置，即走统一后处理能力
    const effectiveSubtitle = effectiveSubtitleSelector.value
    formData.append('subtitleSelector', String(effectiveSubtitle))
    if (effectiveSubtitle === 1) {
      formData.append('colour', 'yellow')
      
      // 角标与字幕不再强绑定，只要选择了就提交
      if (videoForm.cornerMark) {
        formData.append('corner_mark_id', videoForm.cornerMark)
        const selectedCornerMark = cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)
        if (selectedCornerMark && selectedCornerMark.photoUrl) {
          formData.append('corner_mark_url', selectedCornerMark.photoUrl)
        }
      }

      // 附加字幕样式配置
      const subtitlePayload = shouldApplySubtitle.value ? {
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
      } : null

      formData.append('subtitle_config', JSON.stringify({
        process_types: processTypes,
        subtitle_config: subtitlePayload
      }))
    }

    console.log('提交的表单数据：', {
      title: videoForm.title,
      label: videoForm.label,
      msg: videoForm.script,
      voice_id: voiceId,
      digital_human_id: digitalHumanId,
      language: submitLanguage,
      speechRate: '1',
      subtitleSelector: effectiveSubtitle,
      process_types: processTypes,
      colour: effectiveSubtitle === 1 ? 'yellow' : undefined,
      corner_mark_id: videoForm.cornerMark || undefined,
      corner_mark_url: (videoForm.cornerMark && cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)?.photoUrl) || undefined,
      subtitle_config: effectiveSubtitle === 1 ? {
        process_types: processTypes,
        subtitle_config: shouldApplySubtitle.value ? { ...subtitleConfig } : null
      } : undefined
      ,
      banner_overlay_url: bannerOverlayUrl || undefined
    })

        // 同步到全局通知中心（暂未启用）
    // taskStore.addTask({
    //   taskType: 'VIDEO_TASK',
    //   subTitle: `正在制作）{videoForm.title}`,
    //   status: 'running',
    //   image: getHumanImg(videoForm.digitalHuman)
    // })

    let response
    if (videoForm.mode === 0) {
      // 文案模式：调用原创建视频任务接口
      genProgress.value = effectiveDispatchMode === 'overnight' ? 15 : 20
      genStage.value = effectiveDispatchMode === 'overnight' ? '正在提交通宵预排任务...' : '正在提交文案任务...'
      response = await createVideoTask(formData)
      console.log('文案模式提交完成:', response)
    } else {
      startAudioUploadTracking(effectiveDispatchMode)
      // 音频文件已在上面 formData 中传入 audioFile，无需重复上传
      // 竖屏音频模式可传角标
      if (videoForm.videoType !== 1 && videoForm.cornerMark) {
        const selectedCornerMark = cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)
        if (selectedCornerMark?.photoUrl) {
          formData.append('corner_mark_url', selectedCornerMark.photoUrl)
        }
      }
      genProgress.value = effectiveDispatchMode === 'overnight' ? 25 : 35
      genStage.value = effectiveDispatchMode === 'overnight' ? '正在上传音频并创建预排，请稍候...' : '正在上传音频，请稍候...'
      console.log('音频模式提交数据:', Object.fromEntries(formData.entries()))
      response = await createAudioVideoTask(formData, {
        hideLoading: true,
        silentError: true,
        timeout: AUDIO_UPLOAD_REQUEST_TIMEOUT,
        onUploadProgress: (event: any) => {
          if (event?.loaded) {
            updateAudioUploadProgress(Number(event.loaded), Number(event.total || 0))
          }
        }
      })
      console.log('音频模式提交完成:', response)
    }
    
    if (response && response.data) {
      await saveCurrentScriptToHistory()
      if (videoForm.mode === 1) {
        markAudioUploadSuccess(effectiveDispatchMode)
      }
      genProgress.value = 100
      genStage.value = effectiveDispatchMode === 'overnight'
        ? '任务已加入通宵预排队列'
        : (videoForm.mode === 1 ? '音频上传完成，任务已进入队列' : '任务已提交，正在进入队列')
      // 提交成功，立即返回列表并清空表单
      if (effectiveDispatchMode === 'overnight') {
        ElMessage.success('任务已加入通宵预排队列，将在 22:00-09:00 窗口内开始生成')
      } else {
        ElMessage.success(videoForm.mode === 1 ? '音频上传成功，任务已创建并进入队列' : '任务已提交，请在列表中查看生成进度')
      }
      isGenerating.value = false
      resetForm()
      showCreate.value = false
    } else {
      throw new Error('任务创建失败')
    }
  } catch (error) {
    isGenerating.value = false
    submitDispatchMode.value = 'immediate'
    console.error('视频生成失败:', error)
    const rawErrorMessage = extractRequestErrorMessage(error)
    const isAudioUploadTimeout = videoForm.mode === 1 && /timeout|timed out|超时/i.test(rawErrorMessage)
    if (videoForm.mode === 1) {
      markAudioUploadFailure(
        isAudioUploadTimeout
          ? '音频上传超时，请重新上传后再试。'
          : '音频上传未完成，请重新上传后再试。',
        isAudioUploadTimeout,
      )
      genStage.value = isAudioUploadTimeout ? '音频上传超时，请重新上传' : '音频上传失败，请重新上传'
    }
    const errorMessage = layoutStore.getUserInfo.isPlatformSuperAdmin ? rawErrorMessage : GENERIC_REQUEST_ERROR_MESSAGE
    if (errorMessage === GENERIC_REQUEST_ERROR_MESSAGE) {
      ElMessage.error(errorMessage)
    } else if (videoForm.mode === 1 && /上传|A2E|音频|timeout|超时/i.test(errorMessage)) {
      ElMessage.error(`音频上传失败: ${errorMessage}`)
    } else {
      ElMessage.error(`视频生成失败: ${errorMessage}`)
    }
  }
}

const extractRequestErrorMessage = (error: unknown) => {
  const err = error as any
  return err?.rawMessage || err?.response?.data?.message || err?.response?.data?.msg || err?.message || '未知错误'
}

const retryAudioUpload = () => {
  if (isGenerating.value || !audioFile.value) {
    return
  }
  startGeneration(audioUploadState.lastDispatchMode)
}

const previewResult = () => {
  videoPreview.taskId = null
  videoPreview.url = resultVideo.value
  videoPreview.isDownloaded = 0
  videoPreview.visible = true
}

// 下载视频
const downloadVideo = async () => {
  const targetUrl = resolveAssetUrl(videoPreview.url)
  if (!targetUrl) {
    ElMessage.warning('视频URL不可用')
    console.log('videoPreview:', videoPreview)
    return
  }
  
  try {
    await downloadProxyFile(targetUrl, {
      taskId: videoPreview.taskId,
      assetType: 'video',
      fallbackBaseName: `${videoPreview.title || 'video'}-${videoPreview.taskId || new Date().getTime()}`,
      defaultExtension: '.mp4'
    })
    markVideoDownloadedLocally(videoPreview.taskId)
    ElMessage.success('下载已开始')
  } catch (error) {
    console.error('下载视频失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

// 下载音频
const downloadAudio = async () => {
  const targetUrl = resolveAssetUrl(videoPreview.voiceUrl)
  if (!targetUrl) {
    ElMessage.warning('音频URL不可用')
    console.log('videoPreview:', videoPreview)
    return
  }
  
  try {
    await downloadProxyFile(targetUrl, {
      taskId: videoPreview.taskId,
      assetType: 'audio',
      fallbackBaseName: `${videoPreview.title || 'audio'}-${videoPreview.taskId || new Date().getTime()}`,
      defaultExtension: '.mp3'
    })
    ElMessage.success('下载已开始')
  } catch (error) {
    console.error('下载音频失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

const downloadResult = () => {
  downloadVideo()
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
      fetchProxyBlob(video.videoUrl, {
        taskId: video.id,
        assetType: 'video',
        fallbackBaseName: `${video.title || 'video'}-${video.id}`,
        defaultExtension: '.mp4'
      })
        .then(response => response.blob)
        .then(blob => {
          const fileName = `${video.title || 'video'}-${video.id}.mp4`
          zip.file(fileName, blob)
          markVideoDownloadedLocally(video.id)
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

  const validVideos = selectedVideos.value.filter(v => v.taskStatus === '5' && resolveAssetUrl(v.baseVoiceUrl))
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
      fetchProxyBlob(video.baseVoiceUrl, {
        taskId: video.id,
        assetType: 'audio',
        fallbackBaseName: `${video.title || 'audio'}-${video.id}`,
        defaultExtension: '.mp3'
      })
        .then(response => response.blob)
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

// --- 数字人选择器---
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
    // 从 API 加载下一页数字人数据，并传入视频方向参数
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
        coverUrl: digital.coverUrl || '',   // 原始封面 URL，用于字幕预览 frame
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
 * - 文案竖版开字幕：前端即时渲染（SubtitlePreview） * - 其他情况：直接显示封面图
 */
const refreshPreview = async (item?: any) => {
  const currentSeq = ++previewRefreshSeq
  const digitalHuman = findCurrentDigitalHuman(item)
  if (!digitalHuman) {
    if (currentSeq === previewRefreshSeq) {
      subtitlePreviewFrameBase64.value = ''
    }
    return
  }
  
  // 文案竖版且启用了字幕能力时，请求后端即时渲染
  if (shouldShowSubtitlePreview.value) {
    subtitlePreviewFrameBase64.value = ''
    const nextFrameBase64 = await getFrameBase64(
      digitalHuman.coverUrl || digitalHuman.img || '',
      digitalHuman.videoUrl || ''
    )
    if (currentSeq !== previewRefreshSeq) return
    subtitlePreviewFrameBase64.value = nextFrameBase64
  }
  // 其他情况封面预览依赖 currentDigitalHumanImg 计算属性自动更新，无需额外操作
}

// --- 角标选择器---
const openCornerMarkSelector = () => {
  cornerMarkSelectorDialog.visible = true
  cornerMarkSelectorDialog.search = ''
}

const openBannerOverlaySelector = async () => {
  bannerOverlaySelectorDialog.visible = true
  bannerOverlaySelectorDialog.allList = []
  bannerOverlaySelectorDialog.displayList = []
  bannerOverlaySelectorDialog.page = 1
  bannerOverlaySelectorDialog.search = ''
  bannerOverlaySelectorDialog.hasMore = true
  await loadMoreBannerOverlays()
}

const selectCornerMark = async (item: any) => {
  videoForm.cornerMark = item.id
  cornerMarkSelectorDialog.visible = false
  ElMessage.success(`已选择角标: ${item.name}`)
  if (shouldShowSubtitlePreview.value) {
    await refreshPreview()
  }
  try {
    await recordRecentCornerMark(item.id)
    await loadRecentCornerMarks()
  } catch (e) {
    console.error('记录角标使用失败:', e)
  }
}

const loadMoreBannerOverlays = async () => {
  bannerOverlaySelectorDialog.loading = true
  try {
    const searchParams: any = {}
    if (bannerOverlaySelectorDialog.search) searchParams.title = bannerOverlaySelectorDialog.search
    const response = await bannerOverlayPaginateRequest(
      bannerOverlaySelectorDialog.page,
      bannerOverlaySelectorDialog.pageSize,
      searchParams
    )
    const root = response?.data?.data ?? {}
    const records = Array.isArray(root?.records) ? root.records : (Array.isArray(root?.data) ? root.data : [])
    if (records.length === 0) {
      bannerOverlaySelectorDialog.hasMore = false
      return
    }
    const newItems = records.map((item: any) => ({
      id: item.id,
      name: item.title || item.name || `横幅#${item.id}`,
      overlayUrl: item.overlayUrl || item.overlay_url || '',
      outputUrl: item.outputUrl || item.output_url || '',
      ...item
    }))
    bannerOverlaySelectorDialog.allList.push(...newItems)
    bannerOverlaySelectorDialog.displayList = bannerOverlaySelectorDialog.allList
    bannerOverlayOptions.value = bannerOverlaySelectorDialog.allList
    bannerOverlaySelectorDialog.page++
    if (records.length < bannerOverlaySelectorDialog.pageSize) {
      bannerOverlaySelectorDialog.hasMore = false
    }
  } catch (error) {
    console.error('加载横幅失败:', error)
    ElMessage.error('加载横幅失败')
  } finally {
    bannerOverlaySelectorDialog.loading = false
  }
}

const handleBannerOverlayScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && bannerOverlaySelectorDialog.hasMore && !bannerOverlaySelectorDialog.loading) {
    loadMoreBannerOverlays()
  }
}

const selectBannerOverlay = async (item: any) => {
  selectedBannerOverlayId.value = item.id
  bannerOverlaySelectorDialog.visible = false
  const pickedUrl = item.outputUrl || item.overlayUrl || ''
  if (!pickedUrl) {
    selectedBannerOverlayBase64.value = ''
    ElMessage.warning('该横幅缺少可用图片地址')
    return
  }
  try {
    selectedBannerOverlayBase64.value = await fetchImageAsBase64(pickedUrl)
    if (shouldShowSubtitlePreview.value) {
      await refreshPreview()
    }
    ElMessage.success('已选择横幅')
  } catch (error) {
    console.error('横幅转base64失败:', error)
    selectedBannerOverlayBase64.value = ''
    ElMessage.error('横幅读取失败，请重试')
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

const openRelSelector = async () => {
  relSelectorDialog.visible = true
  relSelectorDialog.allList = []
  relSelectorDialog.displayList = []
  relSelectorDialog.page = 1
  relSelectorDialog.voiceSearch = ''
  relSelectorDialog.digitalHumanSearch = ''
  relSelectorDialog.tagSearch = ''
  relSelectorDialog.hasMore = true
  await loadMoreRels()
}

const loadMoreRels = async () => {
  if (relSelectorDialog.loading || !relSelectorDialog.hasMore) return

  relSelectorDialog.loading = true
  try {
    const searchParams: any = {}

    if (relSelectorDialog.voiceSearch) {
      searchParams.voiceName = relSelectorDialog.voiceSearch
    }

    if (relSelectorDialog.digitalHumanSearch) {
      searchParams.digitalHumanName = relSelectorDialog.digitalHumanSearch
    }

    if (relSelectorDialog.tagSearch) {
      searchParams.title = relSelectorDialog.tagSearch
    }

    searchParams.language = videoForm.language

    const response = await getBindingList(
      relSelectorDialog.page,
      relSelectorDialog.pageSize,
      searchParams
    )

    if (response.data && response.data.data) {
      const data = response.data.data
      const bindingList = data.data || []

      if (bindingList.length === 0) {
        relSelectorDialog.hasMore = false
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
          ...binding,
          digitalHumanUrl: getBindingVideoUrl(binding),
          digitalHumanCoverUrl: getBindingCoverUrl(binding),
          voiceUrl,
          language: binding.language || videoForm.language
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

// 底部时自动加载更多预设
const handleRelScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && relSelectorDialog.hasMore && !relSelectorDialog.loading) {
    loadMoreRels()
  }
}

const selectRel = async (item: any) => {
  console.log('[selectRel] item:', item)
  // handleRelChange 处理预设选择逻辑
  await handleRelChange(item.id, item)
  relSelectorDialog.visible = false
}

const clearRelSelection = () => {
  videoForm.relId = ''
  relName.value = ''
  videoForm.previewImg = ''
  videoForm.label = ''

  relSelectorDialog.voiceSearch = ''
  relSelectorDialog.digitalHumanSearch = ''
  relSelectorDialog.tagSearch = ''

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

watch(
  () => [
    relSelectorDialog.voiceSearch,
    relSelectorDialog.digitalHumanSearch,
    relSelectorDialog.tagSearch
  ],
  () => {
    relSelectorDialog.allList = []
    relSelectorDialog.displayList = []
    relSelectorDialog.page = 1
    relSelectorDialog.hasMore = true
    loadMoreRels()
  }
)

watch(() => bannerOverlaySelectorDialog.search, () => {
  bannerOverlaySelectorDialog.allList = []
  bannerOverlaySelectorDialog.displayList = []
  bannerOverlaySelectorDialog.page = 1
  bannerOverlaySelectorDialog.hasMore = true
  loadMoreBannerOverlays()
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

/* 搜索框*/
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

.queue-hint {
  min-width: 188px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  line-height: 1.4;
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








