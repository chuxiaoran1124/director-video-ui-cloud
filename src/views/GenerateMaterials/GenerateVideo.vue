<template>
  <div class="generate-video p-6 bg-gray-50 min-h-full">
    <!-- 鍒楄〃椤甸潰 -->
    <div v-if="!showCreate" class="max-w-[1500px] mx-auto">
      <!-- 椤堕儴鏍囬 -->
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

      <!-- 浠诲姟鍒楄〃 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <!-- 鎼滅储鍜屾壒閲忔搷浣?-->
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
        </div>

        <!-- 鍒嗛〉 -->
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

    <!-- 鍒涘缓/缂栬緫椤甸潰 -->
    <div v-else class="max-w-[1400px] mx-auto">
      <!-- 椤堕儴鏍囬 -->
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
      <!-- 宸︿晶鍒朵綔鍖?-->
      <div class="flex-1 space-y-4">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-full">
          <el-form :model="videoForm" label-width="100px" label-position="top">
                        <!-- 娓犻亾涓庨厤缃柟寮?-->
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
                  <!-- 鏁板瓧浜洪€夋嫨鍣?-->
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
                  <!-- 閰嶉煶閫夋嫨鍣?-->
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
                  <!-- 蹇嵎棰勮閫夋嫨鍣?-->
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

            <!-- 瑙掓爣閫夋嫨 -->
                        <el-row :gutter="20" class="mt-2" v-if="videoForm.videoType !== 1">
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
                    <!-- 杩戞湡蹇€熼€夋嫨 -->
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

            <el-row :gutter="20" class="mt-2" v-if="videoForm.videoType !== 1">
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

            <!-- 鏍囬閮ㄥ垎 -->
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

            <!-- 涓婁紶鏂囦欢澶?-->
                        <div class="mt-2">
                          <el-form-item class="!mb-2">
                            <template #label><span class="text-gray-700">视频上传文件夹<span class="text-xs text-gray-400">（共享文件夹存储路径）</span></span></template>
                            <el-input
                              v-model="videoForm.filename"
                              placeholder="请输入文件夹名称，留空则使用默认路径"
                              clearable
                            />
                          </el-form-item>
                        </div>

                        <!-- 鏂囨妯″紡锛氭枃妗堥儴鍒?-->
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

                        <!-- 闊抽妯″紡锛氫笂浼犻煶棰?-->
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

      <!-- 鍙充晶棰勮涓庣粨鏋滃尯 -->
      <div class="w-[440px] space-y-4">
                <!-- 预览效果 -->
        <!-- 鏂囨竖版锛氬瓧骞曢瑙堬紙鍗虫椂娓叉煋锛?-->
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
                <!-- 鍏朵粬鎯呭喌锛堟í鐗?/ 闊抽妯″紡 / 竖版鏈紑瀛楀箷锛夛細鐩存帴鏄剧ず鏁板瓧浜哄皝闈㈠浘 -->
                <div v-if="!shouldShowSubtitlePreview" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="el-icon-picture-outline text-orange-500"></i>预览效果
                  </h3>
                  <div class="w-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50" style="height: 300px;">
                    <img v-if="currentDigitalHumanImg" :key="'prev-' + videoForm.mode + '-' + videoForm.digitalHuman" :src="currentDigitalHumanImg" class="w-full h-full object-contain" alt="数字人预览" @error="(e) => { e.target.style.display = 'none' }">
                    <span v-else class="text-gray-300 text-sm">尚未选择形象</span>
                  </div>
                  <p v-if="videoForm.digitalHuman" class="text-xs text-gray-400 mt-2 text-center">{{ videoForm.digitalHuman }}</p>
                </div>

        <!-- 浠诲姟鐘舵€佷笌鍘嗗彶 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
           <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <el-icon class="text-green-500"><el-icon-clock /></el-icon>执行状态          </h3>
          
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

    <!-- 鏂囨搴?鍘嗗彶璁板綍閫夋嫨鍣?-->
    <el-dialog :title="scriptSelector.title" v-model="scriptSelector.visible" width="900px" append-to-body @open="onDialogOpen">
      <!-- 搴撴ā寮?-->
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

      <!-- 鍘嗗彶妯″紡 -->
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

    <!-- 保存至文案库寮圭獥 -->
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

    <!-- 鏁板瓧浜哄舰璞￠€夋嫨鍣?-->
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

    <!-- 瑙掓爣閫夋嫨鍣?-->
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
            <!-- 置顶瑙掓爣鏍囪瘑 -->
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

    <!-- 閰嶉煶閫夋嫨鍣?-->
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
              <img :src="item.overlayUrl || item.outputUrl" class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" :alt="item.name">
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
          <!-- 鍔犺浇鏇村鍗犱綅锛堝繀椤诲湪grid鍐呮拺寮€鏁磋锛?-->
          <div v-if="voiceSelectorDialog.loading" class="col-span-3 text-center py-4 text-gray-400 text-sm">
            加载中...
          </div>
          <div v-else-if="!voiceSelectorDialog.hasMore && voiceSelectorDialog.displayList.length > 0" class="col-span-3 text-center py-3 text-gray-400 text-xs">
            已全部加载          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 蹇嵎棰勮閫夋嫨鍣?-->
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
            <!-- 鏁板瓧浜哄皝闈㈠浘 -->
            <div v-if="item.digitalHumanCoverUrl" class="w-3/4 mx-auto aspect-[3/4] overflow-hidden bg-gray-200 relative">
              <img 
                :src="item.digitalHumanCoverUrl" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                @error="(e) => e.target.src = 'https://via.placeholder.com/150x200?text=Error'"
              >
            </div>
            <!-- 棰勮鍚嶇О鍜岃瘯鍚?-->
            <div class="p-3 bg-white">
              <p class="text-xs text-gray-700 font-medium line-clamp-2 mb-2">{{ item.name }}</p>
              <div class="flex items-center justify-center pt-2 border-t border-blue-200">
                <el-button type="text" size="small" icon="el-icon-headset" class="!text-blue-500 !p-0" @click.stop="playVoice(item.voiceUrl, item.voice)">试听</el-button>
              </div>
            </div>
            <!-- 閫変腑鏍囪 -->
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

    <!-- 瑙嗛鎾斁寮圭獥 -->
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
          
          <!-- 棰勮鍥?-->
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
               <audio :src="videoPreview.voiceUrl" controls class="w-full h-10"></audio>
             </div>
          </div>
       </div>
       
       <!-- 瀵硅瘽妗嗗簳閮ㄦ寜閽?-->
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
import request from '/@/utils/request'
import SubtitlePreview from '/@/components/SubtitlePreview/index.vue'

// --- 鏁版嵁瀹氫箟 ---
const taskStore = useTaskStore()

// 页面状态
const showCreate = ref(false)

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
  filename: '',
  label: ''
})

// 涓婁紶闊抽妯″紡鐩稿叧
const audioUploadRef = ref<any>(null)
const audioFile = ref<File | null>(null)
const audioFileName = ref('')

const handleAudioChange = (uploadFile: any) => {
  audioFile.value = uploadFile.raw
  audioFileName.value = uploadFile.name
  return false  // 闃绘鑷姩涓婁紶
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

// 妯℃嫙鏁版嵁 - 濡傛灉闇€瑕佷繚鐣欓粯璁ら€夐」
const defaultRelList = [
  { id: 1, name: '夏季服装场景（小美 + 甜美女声）', human: '小美', voice: '甜美女声' },
  { id: 2, name: '专业测评场景（阿强 + 磁性男声）', human: '阿强', voice: '磁性男声' }
]

// 数字人选项列表（从 API 获取）
const humanOptions = ref<any[]>([])
const humanSearch = ref('')  // 鏁板瓧浜烘悳绱㈡

// 配音选项列表（从 API 获取）
const voiceOptions = ref<any[]>([])
const voiceSearch = ref('')  // 閰嶉煶鎼滅储妗?
// 角标选项列表（从 API 获取）
const cornerMarkOptions = ref<any[]>([])
// 杩戞湡浣跨敤鐨勮鏍囷紙鍚庣鎺ュ彛灏辩华鍚庤祴鍊硷級
const recentCornerMarks = ref<any[]>([])

// 灏嗗悗绔繑鍥炵殑 {id, name} 鍒楄〃涓庢湰鍦?cornerMarkOptions 鍚堝苟锛岃ˉ鍏?photoUrl
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

// 鍔犺浇杩戞湡瑙掓爣鍒楄〃
const loadRecentCornerMarks = async () => {
  try {
    const res = await getRecentCornerMarks()
    const list = res.data?.data || res.data || []
    recentCornerMarks.value = await enrichRecentCornerMarks(list)
  } catch (e) {
    console.error('鍔犺浇杩戞湡瑙掓爣澶辫触:', e)
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
    console.error('鑾峰彇鑴氭湰搴撳け璐?', error)
  }
}

// 鑾峰彇鍘嗗彶鑴氭湰鏁版嵁
const fetchScriptHistory = async () => {
  try {
    const res = await getScriptHistoryList(1, 100)
    if (res.data) {
      const data = res.data.data?.data || res.data.data || []
      // 鐩存帴杩囨护锛屽幓鎺夐噸澶嶇殑 taskId
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
    console.error('鑾峰彇鍘嗗彶鑴氭湰澶辫触:', error)
  }
}

// 鑾峰彇瑙掓爣鍒楄〃
const fetchCornerMarks = async () => {
  try {
    const result = await getCornerMarkList()
    console.log('瑙掓爣鍒楄〃API鍝嶅簲:', result)
    
    const cornerMarkData = result.data?.data || result.data || []
    cornerMarkOptions.value = cornerMarkData.map((item: any) => ({
      id: item.id,
      name: item.photoName,
      photoUrl: item.photoUrl,
      photoName: item.photoName,
      sort: item.sort ?? null
    }))
    // 鍒濆鍖栫疆椤跺垪琛細sort涓嶄负null鐨勬寜sort鍊掑簭
    pinnedCornerMarkIds.value = cornerMarkOptions.value
      .filter((i: any) => i.sort !== null && i.sort !== undefined)
      .sort((a: any, b: any) => b.sort - a.sort)
      .map((i: any) => i.id)
    console.log('鍔犺浇鐨勮鏍囧垪琛?', cornerMarkOptions.value)
  } catch (error) {
    console.error('鑾峰彇瑙掓爣鍒楄〃澶辫触:', error)
    ElMessage.error('加载角标列表失败')
  }
}

// --- 鐘舵€佹帶鍒?---
const isPlaying = ref(false)
let currentAudio: HTMLAudioElement | null = null
let currentAudioUrl = ''
const isGenerating = ref(false)
const genProgress = ref(0)
const genStage = ref('鍑嗗灏辩华')
const resultVideo = ref('')

const scriptSelector = reactive({
  visible: false,
  title: '鏂囨搴撻€夋嫨',
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

// 閰嶉煶閫夋嫨鍣ㄦ粴鍔ㄥ鍣╮ef
const voiceScrollRef = ref<HTMLElement | null>(null)

// 瀛楀箷棰勮鐩稿叧
const subtitlePreviewRef = ref<InstanceType<typeof SubtitlePreview> | null>(null)
const subtitlePreviewFrameBase64 = ref('')
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
 * 閫氳繃鍚庣浠ｇ悊灏嗗浘鐗嘦RL杞?base64锛堢粫杩囨祻瑙堝櫒CORS锛? */
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  console.log('[getFrameBase64] 浠ｇ悊鎷夊彇灏侀潰:', url)
  const res = await downloadFileByProxy(url)
  console.log('[getFrameBase64] 浠ｇ悊杩斿洖 blob size:', (res.data as Blob)?.size)
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const b64 = reader.result as string
      console.log('[getFrameBase64] 杞?base64 鎴愬姛, 闀垮害:', b64.length)
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
 * 浼樺厛鐢ㄥ皝闈㈠浘URL杞?base64锛涜嫢无犲皝闈㈡垨澶辫触锛屽垯鎻愬彇瑙嗛棣栧抚
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

// 鑾峰彇褰撳墠閫変腑鐨勬暟瀛椾汉瑙嗛URL
const currentDigitalHumanVideoUrl = computed(() => {
  if (videoForm.digitalHuman) {
    const human = humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)
    if (human?.videoUrl) return human.videoUrl
    // 兜底：弹窗分页加载出的形象可能不在 humanOptions（首页）中
    const humanFromDialog = humanSelectorDialog.allList.find((h: any) => h.name === videoForm.digitalHuman)
    if (humanFromDialog?.videoUrl) return humanFromDialog.videoUrl
  }
  if (videoForm.relId) {
    const rel = relList.value.find((r: any) => r.id === videoForm.relId)
    if (rel?.digitalHumanUrl) return rel.digitalHumanUrl
  }
  return ''
})

// 鑾峰彇褰撳墠閫変腑鏁板瓧浜虹殑灏侀潰鍥撅紙横版棰勮鐢級
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

const shouldApplySubtitle = computed(() => {
  if (videoForm.mode !== 0 || videoForm.videoType !== 0 || videoForm.language === 'th') return false
  return videoForm.subtitleSelector === 1
})

const shouldEnableSubtitlePipeline = computed(() => {
  if (videoForm.mode !== 0 || videoForm.videoType !== 0 || videoForm.language === 'th') return false
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

// 瀛楀箷閰嶇疆鏇存柊鍥炶皟
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

// 蹇嵎棰勮鏄剧ず鍚嶇О
const relName = ref('')

// 角标选择器状态
const cornerMarkSelectorDialog = reactive({
  visible: false,
  search: ''
})

// 置顶鐨勮鏍?ID锛堟寜 sort 鍊掑簭锛宻ort 瓒婂ぇ瓒婇潬鍓嶏級
const pinnedCornerMarkIds = ref<(string | number)[]>([])

// 置顶鎺掑簭鍚庣殑瑙掓爣鍒楄〃
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
    console.error('置顶操作澶辫触:', error)
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

// 鐩戝惉鍏抽敭閰嶇疆鍙樺寲锛岄噸缃厤闊崇姸鎬?// --- 閫昏緫澶勭悊 ---

const buildVideoTaskSearch = () => {
  const keyword = searchKeyword.value.trim()
  const label = searchLabel.value.trim()
  const search: any = {}
  if (keyword) search.title = keyword
  if (label) search.label = label
  return Object.keys(search).length > 0 ? search : undefined
}

// 鍔犺浇瑙嗛浠诲姟鍒楄〃
const loadVideoTasks = async () => {
  try {
    const response = await getVideoTaskList(videoTaskPage.value, videoTaskPageSize.value, buildVideoTaskSearch())
    console.log('API杩斿洖鏁版嵁:', response)
    
    // 处理 API 返回的数据结构：response.data.data.data 是任务列表数组
    let tasks = []
    if (response.data && response.data.data) {
      const data = response.data.data
      // API杩斿洖鏍煎紡锛歿 page, pageSize, total, data: [...] }
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

    const availableIds = new Set(videoTaskList.value.map((item: any) => item.id))
    const offPageSelections = selectedVideos.value.filter((item: any) => !availableIds.has(item.id))
    selectedVideos.value = [
      ...offPageSelections,
      ...videoTaskList.value.filter((item: any) => selectedVideoIds.value.includes(item.id)),
    ]
    await restoreVideoSelection()
    
    console.log('鍔犺浇鐨勪换鍔″垪琛?', videoTaskList.value)
  } catch (error) {
    console.error('鍔犺浇瑙嗛浠诲姟鍒楄〃澶辫触:', error)
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

// 鍔犺浇鏁板瓧浜哄垪琛紙浠呭姞杞界涓€椤碉級
const loadDigitalHumanList = async (searchName?: string) => {
  try {
    const response = await getDigitalHumanPaginateList(1, 20, searchName ? { name: searchName } : {})
    console.log('鏁板瓧浜哄垪琛ˋPI杩斿洖:', response)
    
    // 澶勭悊API杩斿洖鐨勬暟鎹粨鏋勶細response.data.data.data 鏄暟瀛椾汉鍒楄〃鏁扮粍
    if (response.data && response.data.data) {
      const data = response.data.data
      const humanList = data.data || data || []
      
      // 鏄犲皠API杩斿洖鐨勬暟鎹埌鍓嶇鏍煎紡
      humanOptions.value = humanList.map((digital: any) => ({
        name: digital.digitalHumanName || digital.name,
        externalId: digital.externalId,
        img: digital.coverUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        coverUrl: digital.coverUrl || '',   // 鍘熷灏侀潰URL锛岀敤浜庡瓧骞曢瑙坒rame
        videoUrl: digital.videoUrl,
        gender: digital.gender
      }))
      console.log('鍔犺浇鐨勬暟瀛椾汉鍒楄〃:', humanOptions.value)
    }
  } catch (error) {
    console.error('鍔犺浇鏁板瓧浜哄垪琛ㄥけ璐?', error)
    // 濡傛灉鍔犺浇澶辫触锛屼娇鐢ㄩ粯璁ゆ暟瀛椾汉鍒楄〃
    humanOptions.value = [
      { name: '灏忕編', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { name: '闃垮己', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { name: '闇茶タ', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
      { name: '澶х櫧', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }
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

// 閰嶉煶鎼滅储澶勭悊鍑芥暟锛堥槻鎶栵級
const handleVoiceSearch = () => {
  if (voiceSearchTimer) clearTimeout(voiceSearchTimer)
  voiceSearchTimer = setTimeout(() => {
    loadVoiceList(voiceSearch.value || undefined)
  }, 300)
}

// 鎻愬彇闊抽URL 杈呭姪鍑芥暟 - 澶勭悊澶氱鏍煎紡
const extractAudioUrl = (urlString: string): string => {
  if (!urlString) return ''
  
  // 澶勭悊涓€鑸瓧绗︿覆URL
  if (typeof urlString === 'string' && urlString.startsWith('http')) {
    return urlString
  }
  
  // 处理 "['https://...']" 或 "[\"https://...\"]" 的格式
  if (urlString.includes('[') || urlString.includes('(')) {
    // 浣跨敤姝ｅ垯鎻愬彇 https 鎴?http 寮€澶寸殑URL
    const match = urlString.match(/https?:\/\/[^'"\]\)\s]+/)
    if (match && match[0]) {
      console.log('浠庢暟缁勫瓧绗︿覆涓彁鍙朥RL:', match[0])
      return match[0]
    }
  }
  
  // 浣滀负鏈€鍚庣殑姝ｅ垯妯″紡鎻愬彇
  const match = urlString.match(/https?:\/\/[^\s'"]+/)
  if (match && match[0]) {
    return match[0]
  }
  
  return urlString
}

// 鍔犺浇閰嶉煶鍒楄〃锛堜粎鍔犺浇绗竴椤碉級
const loadVoiceList = async (searchName?: string) => {
  try {
    // 鎼滅储无朵紶鍏?language 鍙傛暟锛屼腑鏂囦紶 'zh'锛屾嘲璇紶 'th'
    const searchParams: any = {}
    if (searchName) searchParams.name = searchName
    searchParams.language = videoForm.language
    const response = await getVoicePaginateList(1, 20, searchParams)
    console.log('閰嶉煶鍒楄〃API杩斿洖, language:', videoForm.language)
    
    // 处理 API 返回的数据结构：response.data.data.data 为配音列表数组
    if (response.data && response.data.data) {
      const data = response.data.data
      const voiceList = data.data || data || []
      
      // 鏄犲皠API杩斿洖鐨勬暟鎹埌鍓嶇鏍煎紡
      voiceOptions.value = voiceList.map((voice: any) => {
        // 灏濊瘯澶氫釜瀛楁鍚嶆潵鑾峰彇闊抽URL锛岀劧鍚庢彁鍙栫湡瀹濽RL
        const rawUrl = voice.url || voice.audio || voice.voiceUrl || voice.voice_url || voice.audioUrl || ''
        const audioUrl = extractAudioUrl(rawUrl)
        console.log(`閰嶉煶 ${voice.voiceName || voice.name} 鐨勫師濮婾RL:`, rawUrl, '-> 鎻愬彇鍚?', audioUrl)
        return {
          name: voice.voiceName || voice.name,
          externalId: voice.externalId,
          url: audioUrl,
          language: voice.language || videoForm.language,
          // 淇濈暀鍘熷鏁版嵁浠ュ鍚庣画浣跨敤
          ...voice
        }
      })
      console.log('鍔犺浇鐨勯厤闊冲垪琛?', voiceOptions.value)
    }
  } catch (error) {
    console.error('鍔犺浇閰嶉煶鍒楄〃澶辫触:', error)
    // 如果加载失败，使用默认配音列表
    voiceOptions.value = [
      { name: '甜美女声', url: '' },
      { name: '磁性男声', url: '' },
      { name: '活力少女', url: '' },
      { name: '成熟稳重', url: '' }
    ]
  }
}

// 鍔犺浇缁戝畾鍏崇郴鍒楄〃
const loadBindingList = async (voiceName?: string, digitalHumanName?: string) => {
  try {
    const searchObj: any = {}
    // 鏀寔閫氳繃voiceName鍜宒igitalHumanName鍒嗗埆妯＄硦鏌ヨ
    if (voiceName) {
      searchObj.voiceName = voiceName
    }
    if (digitalHumanName) {
      searchObj.digitalHumanName = digitalHumanName
    }
    // 浼犲叆璇█鍙傛暟
    searchObj.language = videoForm.language
    
    const response = await getBindingList(1, 50, searchObj)
    console.log('缁戝畾鍏崇郴鍒楄〃API杩斿洖:', response)
    
    // 处理 API 返回的数据结构
    if (response.data && response.data.data && response.data.data.data) {
      const bindingData = response.data.data.data
      
      // 鏄犲皠API杩斿洖鐨勬暟鎹埌鍓嶇鏍煎紡
      relList.value = bindingData.map((binding: any) => {
        // 灏濊瘯澶氫釜瀛楁鍚嶆潵鑾峰彇闊抽URL
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
          digitalHumanUrl: binding.digitalHumanUrl,  // 淇濆瓨瑙嗛URL
          digitalHumanCoverUrl: binding.digitalHumanCoverUrl || binding.coverUrl || binding.digitalHumanUrl,  // 鏁板瓧浜哄皝闈㈠浘
          voiceUrl: voiceUrl,
          // 淇濈暀鍘熷鏁版嵁
          ...binding
        }
      })
      console.log('鍔犺浇鐨勭粦瀹氬叧绯诲垪琛?', relList.value)
    }
  } catch (error) {
    console.error('鍔犺浇缁戝畾鍏崇郴鍒楄〃澶辫触:', error)
    // 失败时使用默认数据
    relList.value = defaultRelList
  }
}

// 缁戝畾鍏崇郴鎼滅储澶勭悊鍑芥暟
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

// 缁勪欢鎸傝浇无跺姞杞戒换鍔″垪琛ㄣ€佹暟瀛椾汉鍒楄〃銆侀厤闊冲垪琛ㄥ拰缁戝畾鍏崇郴鍒楄〃
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

// 切换为横版时自动关闭字幕
watch(() => videoForm.videoType, (val) => {
  if (val === 1) {
    videoForm.subtitleSelector = 0
  }
})

// 切换为泰语时自动关闭字幕
watch(() => videoForm.language, (val) => {
  if (val === 'th') {
    videoForm.subtitleSelector = 0
  }
})

watch(() => shouldShowSubtitlePreview.value, async (val) => {
  if (val) {
    await refreshPreview()
  } else {
    subtitlePreviewFrameBase64.value = ''
  }
})

// 鐩戝惉 mode 鍒囨崲锛氭竻绌烘暟瀛椾汉閫夋嫨銆侀瑙堝浘
watch(() => videoForm.mode, () => {
  videoForm.digitalHuman = ''
  videoForm.digitalHumanExternalId = ''
  videoForm.previewImg = ''
  subtitlePreviewFrameBase64.value = ''
})

watch(showCreate, (val) => {
  if (val) {
    stopVideoTaskAutoRefresh()
    loadRecentSubtitleConfig()
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

// 获取任务状态标签
const getStatusLabel = (status: string | number) => {
  const statusMap: { [key: string]: string } = {
    '0': '等待中',
    '1': '上传中',
    '2': '配音生成中',
    '3': '视频预备中',
    '4': '视频生成中',
    '5': '已完成',
    '-1': '澶辫触'
  }
  return statusMap[String(status)] || '未知'
}

// 获取任务状态类型（用于 tag 颜色）
const getStatusType = (status: string | number): 'success' | 'danger' | 'warning' | 'info' => {
  const statusStr = String(status)
  if (statusStr === '5') return 'success'           // 宸插畬鎴?- 缁胯壊
  if (statusStr === '-1') return 'danger'           // 澶辫触 - 绾㈣壊
  if (statusStr === '0') return 'info'              // 绛夊緟涓?- 鐏拌壊
  if (statusStr === '4') return 'warning'           // 瑙嗛鐢熸垚涓?- 姗欒壊
  return 'info'                                      // 鍏朵粬 - 鐏拌壊
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
  selectedBannerOverlayId.value = ''
  selectedBannerOverlayBase64.value = ''
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
    // 娓呯┖棰勮閫夋嫨
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
    
    // 瀛楀箷棰勮锛氫紭鍏堝皝闈㈠浘URL锛屽叾娆¤棰慤RL锛岄€氳繃鍚庣浠ｇ悊杞?base64
    if (shouldShowSubtitlePreview.value) {
      const coverUrl = rel.digitalHumanCoverUrl !== rel.digitalHumanUrl ? rel.digitalHumanCoverUrl : ''
      subtitlePreviewFrameBase64.value = await getFrameBase64(coverUrl, rel.digitalHumanUrl || '')
    }
    // 琛ㄥ崟缂╃暐鍥撅紙鍚屾牱閫氳繃浠ｇ悊鍙栬棰戦甯э級
    if (rel.digitalHumanUrl) {
      videoForm.previewImg = await extractVideoFirstFrame(rel.digitalHumanUrl)
    }
    
    ElMessage.success(`已应用联动配置： ${rel.digitalHumanName || rel.human} & ${rel.voiceName || rel.voice}`)
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

  // 鍚屼竴涓煶棰戯細鍒囨崲鎾斁/鏆傚仠
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

  // 涓嶅悓闊抽锛氬仠姝㈠綋鍓嶏紝鎾斁鏂扮殑
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

// 浠庤棰戦甯ф彁鍙栭瑙堝浘
const extractVideoFirstFrame = (videoUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    // 澶勭悊URL涓彲鑳藉寘鍚殑鏁扮粍鏍囪
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
      video.currentTime = Math.min(1, video.duration * 0.1)  // 鍙?绉掓垨瑙嗛鐨?0%浣嶇疆
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
  scriptSelector.title = mode === 'library' ? '浠庢枃妗堝簱导入' : '浠庡巻鍙茶褰曢€夋嫨'
  scriptSelector.search = '' // 閲嶇疆鎼滅储妗?  // 鏍规嵁 mode 鍔犺浇鏁版嵁
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

// 褰撳墠鏄剧ず鐨勫舰璞★紙computed锛岀‘淇濆疄无跺搷搴旓級
const currentDisplayImg = computed(() => {
  // 濡傛灉鏈?relId锛堥璁捐閫変腑锛夛紝鏄剧ず棰勮鐨勯瑙堝浘
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
  
  // 鏍规嵁妯″紡鎼滅储
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
  // 鎵撳紑鍚庨噸鏂板姞杞借剼鏈簱
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
    // 閲嶆柊鍔犺浇鑴氭湰搴?    await fetchScriptLibrary()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

// A2E 娴佺▼澶勭悊
// 娓叉煋娴佺▼妯℃嫙
const startGeneration = async () => {
  // 闃叉閲嶅鐐瑰嚮
  if (isGenerating.value) {
    return
  }
  
        if (!videoForm.title || !videoForm.digitalHuman) {
    return ElMessage.warning('请先完整配置标题和数字人')
  }
  
  // 文案模式需要配音
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
  
  isGenerating.value = true
  resultVideo.value = ''
  genProgress.value = 0
  genStage.value = '姝ｅ湪涓婁紶绱犳潗...'

  try {
        let digitalHumanId: string
    let voiceId: string = ''

    if (videoForm.mode === 0) {
      if (videoForm.relId) {
        // 浣跨敤缁戝畾棰勮锛氱洿鎺ヤ粠 relList 鍙?voiceExternalId / digitalHumanExternalId
        const rel = relList.value.find((r: any) => r.id === videoForm.relId)
        digitalHumanId = rel?.digitalHumanExternalId || videoForm.digitalHumanExternalId || videoForm.digitalHuman
        voiceId = rel?.voiceExternalId || videoForm.voiceExternalId || videoForm.voice
        console.log('[鎻愪氦-缁戝畾棰勮] rel:', rel?.name, '| digitalHumanExternalId:', digitalHumanId, '| voiceExternalId:', voiceId)
      } else {
        // 鍗曠嫭閫夋嫨锛氬彇鍚勮嚜鍒楄〃鐨?externalId
        digitalHumanId = videoForm.digitalHumanExternalId || humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)?.externalId || videoForm.digitalHuman
        voiceId = videoForm.voiceExternalId || voiceOptions.value.find((voice: any) => voice.name === videoForm.voice)?.externalId || videoForm.voice
        console.log('[鎻愪氦-鍗曠嫭閫夋嫨] digitalHuman:', videoForm.digitalHuman, '| externalId:', digitalHumanId, '| voice:', videoForm.voice, '| externalId:', voiceId)
      }
    } else {
      // 闊抽妯″紡锛氬彧鍙栨暟瀛椾汉 ID
      digitalHumanId = videoForm.digitalHumanExternalId || humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)?.externalId || videoForm.digitalHuman
      console.log('[鎻愪氦-闊抽妯″紡] digitalHuman:', videoForm.digitalHuman, '| externalId:', digitalHumanId)
    }
    
    // 确定语言（自动时默认 zh）
    const language = videoForm.language
    
        // 鍒涘缓FormData瀵硅薄
    const formData = new FormData()
    
    // 添加视频方向鍙傛暟
    formData.append('type', String(videoForm.videoType))
    
    // 映射表单字段到 API 参数（snake_case）
    formData.append('title', videoForm.title)
    if (videoForm.label) formData.append('label', videoForm.label)
    
    // 鏂囨妯″紡浼?msg锛岄煶棰戞ā寮忎紶闊抽鏂囦欢
    if (videoForm.mode === 0) {
      formData.append('msg', videoForm.script)
    } else if (audioFile.value) {
      formData.append('file', audioFile.value)
    }
    
        if (videoForm.filename) formData.append('filename', videoForm.filename)
    // 文案模式传配音 ID，音频模式不传
    if (videoForm.mode === 0 && voiceId) {
      formData.append('voice_id', voiceId)
    }
    formData.append('digital_human_id', digitalHumanId)
    formData.append('language', language)
    formData.append('speechRate', '1')
    const selectedBannerOverlay = bannerOverlayOptions.value.find((item: any) => String(item.id) === String(selectedBannerOverlayId.value))
    const bannerOverlayUrl = selectedBannerOverlay?.outputUrl || ''
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

    console.log('鎻愪氦鐨勮〃鍗曟暟鎹細', {
      title: videoForm.title,
      label: videoForm.label,
      msg: videoForm.script,
      voice_id: voiceId,
      digital_human_id: digitalHumanId,
      language: language,
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

        // 鍚屾鍒板叏灞€閫氱煡涓績锛堟殏鏈惎鐢級
    // taskStore.addTask({
    //   taskType: 'VIDEO_TASK',
    //   subTitle: `姝ｅ湪鍒朵綔锛?{videoForm.title}`,
    //   status: 'running',
    //   image: getHumanImg(videoForm.digitalHuman)
    // })

    let response
    if (videoForm.mode === 0) {
      // 鏂囨妯″紡锛氳皟鐢ㄥ師创建视频浠诲姟鎺ュ彛
      response = await createVideoTask(formData)
      console.log('鏂囨妯″紡鎻愪氦瀹屾垚:', response)
    } else {
      // 闊抽鏂囦欢宸插湪涓婇潰 formData 涓紶浜?audioFile锛屾棤闇€閲嶅涓婁紶
      const lang = videoForm.language === 'zh' ? 'zh-CN' : 'th-TH'
      formData.append('language', lang)
      // 绔栧睆闊抽妯″紡鍙紶瑙掓爣
      if (videoForm.videoType !== 1 && videoForm.cornerMark) {
        const selectedCornerMark = cornerMarkOptions.value.find((item: any) => item.id === videoForm.cornerMark)
        if (selectedCornerMark?.photoUrl) {
          formData.append('corner_mark_url', selectedCornerMark.photoUrl)
        }
      }
      console.log('闊抽妯″紡鎻愪氦鏁版嵁:', Object.fromEntries(formData.entries()))
      response = await createAudioVideoTask(formData)
      console.log('闊抽妯″紡鎻愪氦瀹屾垚:', response)
    }
    
    if (response && response.data) {
      // 鎻愪氦鎴愬姛锛岀珛鍗宠繑鍥炲垪琛ㄥ苟娓呯┖琛ㄥ崟
      ElMessage.success('任务已提交，请在列表中查看生成进度')
      isGenerating.value = false
      resetForm()
      showCreate.value = false
    } else {
      throw new Error('浠诲姟鍒涘缓澶辫触')
    }
  } catch (error) {
    isGenerating.value = false
    console.error('瑙嗛鐢熸垚澶辫触:', error)
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
    console.log('寮€濮嬩笅杞借棰?', videoPreview.url)
    
    // 鏂规硶1锛氬皾璇曠敤fetch涓嬭浇
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
        throw new Error('fetch杩斿洖闈?00鐘舵€佺爜')
      }
    } catch (fetchError) {
      console.log('fetch澶辫触锛屽皾璇曠洿鎺ヨ烦杞笅杞?', fetchError)
      // 鏂规硶2锛氱洿鎺ョ敤window.location.href璺宠浆涓嬭浇
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
    console.error('下载视频澶辫触:', error)
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
    console.log('寮€濮嬩笅杞介煶棰?', videoPreview.voiceUrl)
    
    // 鏂规硶1锛氬皾璇曠敤fetch涓嬭浇
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
        throw new Error('fetch杩斿洖闈?00鐘舵€佺爜')
      }
    } catch (fetchError) {
      console.log('fetch澶辫触锛屽皾璇曠洿鎺ヨ烦杞笅杞?', fetchError)
      // 鏂规硶2锛氱洿鎺ョ敤window.location.href璺宠浆涓嬭浇
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
    console.error('下载音频澶辫触:', error)
    ElMessage.error('下载失败，请重试')
  }
}

const downloadResult = () => {
  ElMessage.success('正在导出视频文件...')
}

// 鎼滅储瑙嗛
const handleSearch = async () => {
  try {
    videoTaskPage.value = 1
    await loadVideoTasks()
  } catch (error) {
    console.error('鎼滅储澶辫触:', error)
    ElMessage.error('搜索失败，请重试')
  }
}

// 灏?TOS 澶栭儴鍦板潃杞垚浠ｇ悊璺緞锛岃В鍐?CORS
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
          console.error(`下载视频澶辫触: ${video.title}`, error)
          failedCount++
        })
    )

    // 等待所有下载完成
    await Promise.all(downloadPromises)

    // 鐢熸垚 ZIP 鏂囦欢
    ElMessage.info('正在生成压缩包...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // 涓嬭浇 ZIP 鏂囦欢
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
    console.error('ZIP鎵撳寘澶辫触:', error)
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
          console.error(`下载音频澶辫触: ${video.title}`, error)
          failedCount++
        })
    )

    // 等待所有下载完成
    await Promise.all(downloadPromises)

    if (successCount === 0) {
      ElMessage.error('所有音频下载失败，请检查网络或文件地址')
      return
    }

    // 鐢熸垚 ZIP 鏂囦欢
    ElMessage.info('正在生成压缩包...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // 涓嬭浇 ZIP 鏂囦欢
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
    console.error('ZIP鎵撳寘澶辫触:', error)
    ElMessage.error('打包文件失败，请重试')
  }
}

// --- 鏁板瓧浜洪€夋嫨鍣?---
const openHumanSelector = async () => {
  humanSelectorDialog.visible = true
  // 閲嶇疆鍒嗛〉
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
      
      // 鏄犲皠API杩斿洖鐨勬暟鎹埌鍓嶇鏍煎紡
      const newItems = humanList.map((digital: any) => ({
        name: digital.digitalHumanName || digital.name,
        externalId: digital.externalId,
        img: digital.coverUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        coverUrl: digital.coverUrl || '',   // 鍘熷灏侀潰URL锛岀敤浜庡瓧骞曢瑙坒rame
        videoUrl: digital.videoUrl,
        gender: digital.gender
      }))
      
      humanSelectorDialog.allList.push(...newItems)
      humanSelectorDialog.displayList = humanSelectorDialog.allList
      humanSelectorDialog.page++
      
      // 濡傛灉鏈〉鑾峰彇鐨勬暟鎹皯浜巔ageSize锛岃鏄庡凡缁忓埌搴曚簡
      if (humanList.length < humanSelectorDialog.pageSize) {
        humanSelectorDialog.hasMore = false
      }
    }
  } catch (error) {
    console.error('鍔犺浇鏁板瓧浜哄け璐?', error)
    ElMessage.error('加载数字人失败')
  } finally {
    humanSelectorDialog.loading = false
  }
}

// 婊氬姩鍒板簳閮ㄦ椂鑷姩鍔犺浇
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
  // 缁熶竴鍒锋柊棰勮
  refreshPreview(item)
  humanSelectorDialog.visible = false
  ElMessage.success('已选择数字人')
}

/**
 * 缁熶竴鍒锋柊预览效果
 * - 鏂囨竖版寮€瀛楀箷锛氬悗绔嵆无舵覆鏌擄紙SubtitlePreview锛? * - 鍏朵粬鎯呭喌锛氱洿鎺ユ樉绀哄皝闈㈠浘
 */
const refreshPreview = async (item?: any) => {
  const digitalHuman = item || humanOptions.value.find((h: any) => h.name === videoForm.digitalHuman)
  if (!digitalHuman) return
  
  // 文案竖版且启用了字幕能力时，请求后端即时渲染
  if (shouldShowSubtitlePreview.value) {
    subtitlePreviewFrameBase64.value = await getFrameBase64(digitalHuman.coverUrl || '', digitalHuman.videoUrl || '')
  }
  // 鍏朵粬鎯呭喌灏侀潰棰勮渚濊禆 currentDigitalHumanImg 璁＄畻灞炴€ц嚜鍔ㄦ洿鏂帮紝无犻渶棰濆操作
}

// --- 瑙掓爣閫夋嫨鍣?---
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
    console.error('璁板綍瑙掓爣浣跨敤澶辫触:', e)
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
      name: item.title || item.name || `妯箙#${item.id}`,
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
    console.error('妯箙杞琤ase64澶辫触:', error)
    selectedBannerOverlayBase64.value = ''
    ElMessage.error('横幅读取失败，请重试')
  }
}

// --- 閰嶉煶閫夋嫨鍣?---
const openVoiceSelector = async () => {
  voiceSelectorDialog.visible = true
  // 閲嶇疆鍒嗛〉
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
    // 鍔犺浇閰嶉煶无朵紶鍏?language 鍙傛暟
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

// 婊氬姩鍒板簳閮ㄦ椂鑷姩鍔犺浇鏇村閰嶉煶
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

// --- 蹇嵎棰勮閫夋嫨鍣?---
const openRelSelector = async () => {
  relSelectorDialog.visible = true
  // 閲嶇疆鍒嗛〉
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
    // 鍔犺浇棰勮无朵紶鍏?language 鍙傛暟
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

// 婊氬姩鍒板簳閮ㄦ椂鑷姩鍔犺浇鏇村棰勮
const handleRelScroll = (e: any) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 100 && relSelectorDialog.hasMore && !relSelectorDialog.loading) {
    loadMoreRels()
  }
}

const selectRel = async (item: any) => {
  console.log('[selectRel] item:', item)
  // 璋冪敤 handleRelChange 澶勭悊棰勮閫夋嫨閫昏緫
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
  // 閲嶇疆鍒嗛〉锛岄噸鏂颁粠API鍔犺浇鎼滅储缁撴灉
  humanSelectorDialog.allList = []
  humanSelectorDialog.displayList = []
  humanSelectorDialog.page = 1
  humanSelectorDialog.hasMore = true
  loadMoreHumans()
})

watch(() => voiceSelectorDialog.search, (newVal) => {
  // 閲嶇疆鍒嗛〉锛岄噸鏂颁粠API鍔犺浇鎼滅储缁撴灉
  voiceSelectorDialog.allList = []
  voiceSelectorDialog.displayList = []
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = true
  loadMoreVoices()
})

watch(() => relSelectorDialog.search, (newVal) => {
  // 閲嶇疆鍒嗛〉锛岄噸鏂颁粠API鍔犺浇鎼滅储缁撴灉
  relSelectorDialog.allList = []
  relSelectorDialog.displayList = []
  relSelectorDialog.page = 1
  relSelectorDialog.hasMore = true
  loadMoreRels()
})

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

/* 鎼滅储妗嗕紭鍖?*/
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








