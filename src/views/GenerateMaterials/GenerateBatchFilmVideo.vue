<template>
  <div class="generate-batch-film p-6 bg-gray-50 min-h-full">

    <!-- 顶部标题 -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">批量/多段生成</h2>
        <p class="text-xs text-gray-400 mt-1">智能多段视频自动剪辑拼接，支持生成段与拼接段灵活组合</p>
      </div>
    </div>

    <div v-if="showResultPage && currentPlan" class="max-w-[1400px] mx-auto">
      <div class="bg-white px-5 py-3 rounded-xl shadow-sm relative border border-gray-100 mb-4">
        <div class="w-full">
          <el-button @click="showResultPage = false" icon="el-icon-arrow-left" class="mb-2">返回计划列表</el-button>
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 class="text-xl font-bold text-gray-800">执行结果</h2>
              <p class="text-xs text-gray-400 mt-1">查看计划执行后的生成结果与拼接成片</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <el-tag size="small" type="success" effect="plain">计划：{{ currentPlan.name }}</el-tag>
              <el-tag size="small" type="info" effect="plain">批次 {{ currentPlan.batchNo || '-' }}</el-tag>
              <el-button size="small" @click="handleViewPlanResults(currentPlan)">刷新结果</el-button>
            </div>
          </div>
        </div>
      </div>

      <div ref="resultPanelRef" class="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-emerald-100 bg-emerald-50/40">
          <div class="flex items-center gap-2">
            <el-icon class="text-emerald-500 text-lg"><DataLine /></el-icon>
            <span class="font-bold text-gray-800">结果总览</span>
          </div>
          <el-tag :type="getPlanStatusType(currentPlan.status)" size="small">{{ currentPlan.statusText }}</el-tag>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 pt-4">
          <div class="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div class="text-xs text-gray-500">生成结果</div>
            <div class="mt-1 text-lg font-bold text-blue-600">{{ currentPlanSummary.generateSuccess }}/{{ currentPlanSummary.generateTotal }}</div>
            <div class="text-[11px] text-gray-400">成功 / 总数</div>
          </div>
          <div class="rounded-xl border border-red-100 bg-red-50/40 p-3">
            <div class="text-xs text-gray-500">生成失败</div>
            <div class="mt-1 text-lg font-bold text-red-500">{{ currentPlanSummary.generateFailed }}</div>
            <div class="text-[11px] text-gray-400">本批次失败条数</div>
          </div>
          <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <div class="text-xs text-gray-500">拼接成片</div>
            <div class="mt-1 text-lg font-bold text-emerald-600">{{ currentPlanSummary.spliceSuccess }}/{{ currentPlanSummary.spliceTotal }}</div>
            <div class="text-[11px] text-gray-400">成功 / 总数</div>
          </div>
          <div class="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <div class="text-xs text-gray-500">计划状态</div>
            <div class="mt-1 flex items-center gap-2">
              <el-tag :type="getPlanStatusType(currentPlan.status)" size="small">{{ currentPlan.statusText }}</el-tag>
            </div>
            <div class="text-[11px] text-gray-400 truncate">{{ currentPlan.errorMessage || '当前无错误信息' }}</div>
          </div>
        </div>

        <div class="px-5 py-4">
          <div class="font-bold text-gray-700 mb-3">生成结果</div>
          <div v-if="currentGenerateTasks.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="task in currentGenerateTasks"
              :key="`gen-page-${task.id}`"
              class="rounded-xl border border-gray-100 p-4 bg-gray-50/50"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-medium text-gray-800">{{ task.outputFileName || task.inputPayload?.title || `生成结果-${task.id}` }}</div>
                  <div class="text-[11px] text-gray-400 mt-1">
                    数字人：{{ task.inputPayload?.digital_human_name || '-' }} ｜ 配音：{{ task.inputPayload?.voice_name || '-' }}
                  </div>
                </div>
                <el-tag :type="getTaskStatusType(task.taskStatus)" size="small">{{ getTaskStatusText(task.taskStatus) }}</el-tag>
              </div>
              <div class="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                <span>序号 {{ task.inputPayload?.seq_no || '-' }}</span>
                <span>时长 {{ formatVideoDuration(task.outputDuration) }}</span>
                <span>大小 {{ formatFileSize(task.outputFileSize) }}</span>
              </div>
              <div class="mt-3 rounded-lg overflow-hidden border border-gray-100 bg-black/5">
                <video
                  v-if="task.outputFileUrl"
                  :src="task.outputFileUrl"
                  :poster="task.outputPreviewUrl || ''"
                  controls
                  preload="metadata"
                  class="w-full h-[220px] object-cover bg-black"
                />
                <img v-else-if="task.outputPreviewUrl" :src="task.outputPreviewUrl" class="w-full h-[220px] object-cover" alt="生成结果封面" />
                <div v-else class="w-full h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无预览</div>
              </div>
              <div v-if="task.errorMessage" class="mt-2 text-[11px] text-red-500">失败原因：{{ task.errorMessage }}</div>
              <div class="mt-3 flex gap-2">
                <el-button size="small" type="primary" plain :disabled="!task.outputFileUrl" @click="openResultVideo(task.outputFileUrl)">查看视频</el-button>
                <el-button size="small" :disabled="!task.outputFileUrl" @click="copyResultUrl(task.outputFileUrl)">复制链接</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="当前还没有生成结果" :image-size="90" />
        </div>

        <div class="px-5 pb-5">
          <div class="font-bold text-gray-700 mb-3">拼接成片</div>
          <div v-if="currentSpliceResults.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              v-for="result in currentSpliceResults"
              :key="`splice-page-${result.id}`"
              class="rounded-xl border border-gray-100 p-4 bg-gray-50/50"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-medium text-gray-800">{{ result.outputFileName || `拼接成片-${result.resultNo || result.id}` }}</div>
                  <div class="text-[11px] text-gray-400 mt-1">
                    成片序号：{{ result.resultNo || '-' }} ｜ 素材数：{{ result.inputFileIds?.length || 0 }}
                  </div>
                </div>
                <el-tag :type="getTaskStatusType(result.resultStatus)" size="small">{{ getTaskStatusText(result.resultStatus) }}</el-tag>
              </div>
              <div class="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                <span>时长 {{ formatVideoDuration(result.outputDuration) }}</span>
                <span>大小 {{ formatFileSize(result.outputFileSize) }}</span>
              </div>
              <div class="mt-3 rounded-lg overflow-hidden border border-gray-100 bg-black/5">
                <video
                  v-if="result.outputUrl"
                  :src="result.outputUrl"
                  :poster="result.outputPreviewUrl || ''"
                  controls
                  preload="metadata"
                  class="w-full h-[220px] object-cover bg-black"
                />
                <img v-else-if="result.outputPreviewUrl" :src="result.outputPreviewUrl" class="w-full h-[220px] object-cover" alt="拼接结果封面" />
                <div v-else class="w-full h-[220px] flex items-center justify-center text-gray-400 text-sm">暂无预览</div>
              </div>
              <div v-if="result.errorMessage" class="mt-2 text-[11px] text-red-500">失败原因：{{ result.errorMessage }}</div>
              <div class="mt-3 flex gap-2">
                <el-button size="small" type="success" plain :disabled="!result.outputUrl" @click="openResultVideo(result.outputUrl)">查看成片</el-button>
                <el-button size="small" :disabled="!result.outputUrl" @click="copyResultUrl(result.outputUrl)">复制链接</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="当前还没有拼接成片" :image-size="90" />
        </div>
      </div>
    </div>

    <!-- 主体 Tabs -->
    <el-tabs v-else v-model="activeTab" class="rounded-xl overflow-hidden">
      <!-- ===================== Tab1: 自动剪辑 ===================== -->
      <el-tab-pane label="自动剪辑" name="autoEdit">
        <div class="space-y-4">

          <!-- 生成计划管理区 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 class="text-base font-bold text-gray-800">生成计划管理</h3>
              <el-button type="primary" size="small" @click="handleAddPlan">
                <el-icon class="mr-1"><Plus /></el-icon>新建计划
              </el-button>
            </div>

            <!-- 说明区 -->
            <div class="mx-5 mt-4 text-[11px] text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100 leading-[22px]">
              <div>1、"ABCD...段"为模板内段落的先后顺序；"生成段123.../拼接段123..."为该顺序段的任务属性</div>
              <div>2、基础条件："A段"不论是"生成段"还是"拼接段"，"A段"里的视频条数有X条；选择"*3"，则最终总拼接数为A段内视频条数X*3</div>
              <div>3、"*3"，既是总生成条数的被乘数，也是"首段"所拼接的后续各段的"随机轮次"，如B段边有n条视频，第一轮随机备选为n条，第二轮机备选为n-1...</div>
              <div>4、本次任务用途：现有直接拼接：文件夹内现有的参与拼接，不进行生成；仅新生成拼接：文件夹内现有的不参与拼接；新+旧均拼接：生成的+现有的都参与拼接</div>
              <div>5、报错：出问题单元框颜色改红色，在"编辑"按钮下方给出一个尾巴</div>
            </div>

            <!-- 计划列表 -->
            <div class="px-5 pb-4 mt-3">
              <el-table
                :data="planList"
                style="width: 100%"
                size="small"
                :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: 'bold' }"
              >
                <el-table-column label="计划名称" min-width="260" show-overflow-tooltip>
                  <template #default="scope">
                    <span
                      class="font-bold text-gray-700 cursor-pointer hover:text-blue-500 transition-colors inline-block max-w-[240px] truncate align-middle"
                      @click="handleSelectPlan(scope.row)"
                    >{{ scope.row.name }}</span>
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
                    <el-tag :type="getPlanStatusType(scope.row.status)" size="small" effect="light">
                      {{ scope.row.statusText }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="任务数" width="70" align="center">
                  <template #default="scope">
                    <span class="text-gray-600 font-medium text-xs">{{ getPlanGenerateTaskCount(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="380" fixed="right" align="center">
                  <template #default="scope">
                    <div class="flex items-center justify-center gap-1.5 flex-wrap">
                      <el-button size="small" type="success" plain class="!px-2 !text-[11px] whitespace-nowrap" @click="handleViewPlanResults(scope.row)">查看结果</el-button>
                      <el-button type="primary" size="small" class="!px-2 !text-[11px] whitespace-nowrap" @click="handleSelectPlan(scope.row)">编辑计划</el-button>
                      <el-button size="small" class="!px-2 !text-[11px] whitespace-nowrap" @click="handleEditPlan(scope.row)">编辑</el-button>
                      <el-button type="danger" size="small" plain class="!px-2 !text-[11px] whitespace-nowrap" @click="handleDeletePlan(scope.row)">删除</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <div class="flex justify-end mt-3">
                <el-pagination
                  v-model:current-page="planPage"
                  v-model:page-size="planPageSize"
                  :total="planTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next"
                  background
                  small
                  @current-change="loadPlanList"
                  @size-change="() => { planPage = 1; loadPlanList() }"
                />
              </div>
            </div>
          </div>

          <!-- 框架模板编辑器 -->
          <div v-if="currentPlan" class="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <!-- 模板头部 -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-blue-100 bg-blue-50/40 flex-wrap gap-2">
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <el-icon class="text-blue-500 text-lg"><Tickets /></el-icon>
                  <span class="font-bold text-gray-800">计划框架</span>
                  <el-tag type="info" size="small" effect="plain">{{ currentPlan.name }}</el-tag>
                </div>

                <!-- 优先级模式 -->
                <el-select v-model="currentPlan.priorityMode" placeholder="首段优先" size="small" style="width: 130px">
                  <el-option label="首段优先" value="first" />
                </el-select>

                <!-- 乘数选择 -->
                <div class="flex items-center gap-0.5 bg-white rounded-lg border border-gray-200 p-0.5">
                  <span v-for="n in [1,2,3,4]" :key="n"
                    class="inline-flex items-center justify-center w-7 h-6 text-xs rounded cursor-pointer transition-colors select-none"
                    :class="currentPlan.multiplier === n
                      ? 'bg-blue-500 text-white font-bold'
                      : 'text-gray-600 hover:bg-gray-100'"
                    @click="currentPlan.multiplier = n"
                  >*{{ n }}</span>
                </div>

                <!-- 拼接公式说明 -->
                <span class="text-[11px] text-gray-400 hidden lg:inline">
                  拼接乘关系：{{ getSegmentFormula() }} = 总拼接条数
                </span>
              </div>

              <div class="flex items-center gap-2">
                <el-button size="small" @click="handleCopyTemplate">复制模板</el-button>
                <el-button size="small" type="success" @click="handleStartGenerate">
                  <el-icon class="mr-1"><VideoPlay /></el-icon>立即开始生成-拼接
                </el-button>
              </div>
            </div>

            <!-- 提示：点击前进一位排序 -->
            <div class="px-5 pt-2 text-[11px] text-gray-400">
              <span>↑点击前进一位排序</span>
            </div>

            <!-- 段落卡片滚动区 -->
            <div class="flex gap-3 px-5 py-4 overflow-x-auto items-start">

              <!-- 空状态 -->
              <div
                v-if="!currentPlan.segments?.length"
                class="flex-shrink-0 w-[220px] h-[340px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                @click="openAddSegDialog(-1)"
              >
                <el-icon class="text-4xl text-gray-300"><Plus /></el-icon>
                <span class="text-sm text-gray-400">点击添加首段</span>
              </div>

              <!-- 段落卡片 -->
              <template
                v-for="(seg, idx) in currentPlan.segments"
                :key="seg.id"
              >
              <div
                class="flex-shrink-0 w-[220px] min-h-[300px] rounded-xl border bg-white shadow-sm flex flex-col transition-shadow hover:shadow-md"
                :class="seg.hasError ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'"
              >
                <!-- 卡片头 -->
                <div
                  class="flex items-center justify-between px-3 py-2 rounded-t-xl"
                  :class="seg.type === 'generate' ? 'bg-blue-50 border-b border-blue-100' : 'bg-cyan-50 border-b border-cyan-100'"
                >
                  <span class="text-sm font-bold text-gray-800">
                    {{ getSegmentLabel(idx) }}：{{ seg.type === 'generate' ? '生成段' : '拼接段' }}{{ seg.index }}
                  </span>
                  <div class="flex items-center gap-1">
                    <el-icon class="text-yellow-400 text-base cursor-pointer hover:scale-110 transition-transform"><VideoPause /></el-icon>
                    <el-icon class="text-green-500 text-base cursor-pointer hover:scale-110 transition-transform"><VideoPlay /></el-icon>
                  </div>
                </div>

                <!-- 卡片内容 -->
                <div class="p-3 flex-1 text-xs text-gray-600 space-y-1.5">
                  <!-- 生成段 -->
                  <template v-if="seg.type === 'generate'">
                    <div class="flex justify-between">
                      <span class="text-gray-400">配置文案数：</span>
                      <span class="font-medium text-gray-800">1</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">配置预设数：</span>
                      <span class="font-medium text-gray-800">{{ seg.genConfigCount || seg.genConfigs?.length || 1 }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">生成总条数：</span>
                      <span class="text-gray-800">{{ getSegmentPlannedGenerateCount(seg) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">已生成条数：</span>
                      <span class="text-green-500 text-[11px]">{{ seg.generatedDone ?? 0 }}（已生成）</span>
                    </div>
                    <div class="flex justify-between gap-1">
                      <span class="text-gray-400 shrink-0">自动存储路径：</span>
                      <span class="text-gray-800 truncate text-right">{{ getGenerateStorageText(seg) }}</span>
                    </div>
                    <div class="pt-1">
                      <div class="text-gray-400 mb-1">通用脚本内容：</div>
                      <div class="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5 text-gray-700 leading-5 line-clamp-3">
                        {{ seg.script || '未填写脚本内容' }}
                      </div>
                    </div>

                    <!-- 任务用途 -->
                    <div class="mt-2 pt-2 border-t border-gray-100">
                      <div class="text-gray-400 mb-1">该段本次任务用途：</div>
                      <div class="space-y-1">
                        <div
                          v-for="opt in taskPurposeOptions" :key="opt.value"
                          class="px-2 py-1 rounded text-[11px] cursor-pointer transition-colors text-center"
                          :class="seg.taskPurpose === opt.value
                            ? 'bg-cyan-500 text-white font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                          @click="seg.taskPurpose = opt.value"
                        >{{ opt.label }}</div>
                      </div>
                    </div>
                  </template>

                  <!-- 拼接段 -->
                  <template v-else>
                    <div class="flex items-center gap-1 mb-1">
                      <el-icon class="text-cyan-500"><FolderOpened /></el-icon>
                      <span class="font-medium text-gray-700 truncate">{{ getFolderName(seg.folderId) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">文件夹视频数：</span>
                      <span class="font-medium text-gray-800">{{ seg.videoCount ?? '-' }}</span>
                    </div>
                    <div class="flex justify-between gap-1">
                      <span class="text-gray-400 shrink-0">路径：</span>
                      <span class="text-gray-800 truncate text-right">{{ getSegmentFolderPath(seg) || '*/*/' }}</span>
                    </div>
                  </template>
                </div>

                <!-- 错误信息 -->
                <div v-if="seg.hasError" class="mx-3 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-[11px]">
                  <div class="text-red-600 font-medium mb-1">错误：{{ seg.error?.message }}</div>
                  <div>错误代码：<span class="text-red-500">{{ seg.error?.code }}</span></div>
                  <div>错误原因：<span class="text-red-500">{{ seg.error?.reason }}</span></div>
                  <div>建议：<span class="text-orange-500">{{ seg.error?.suggestion }}</span></div>
                  <el-button size="small" class="mt-2 w-full !text-[11px]" @click="copyErrorInfo(seg)">复制内容</el-button>
                </div>

                <!-- 卡片底部 -->
                <div class="px-3 pb-3 space-y-1.5">
                  <div class="flex gap-1">
                    <el-button size="small" type="danger" plain class="flex-1 !text-[11px] !px-1" @click="handleDeleteSegment(idx)">删除</el-button>
                    <el-button size="small" class="flex-1 !text-[11px] !px-1" @click="handleEditSegment(seg, idx)">编辑</el-button>
                  </div>
                </div>
              </div>

              <!-- 段间/末尾 +生成/+拼接 按钮（居中于卡片右侧） -->
              <div class="flex-shrink-0 min-w-[64px] flex flex-col items-center gap-1.5 self-start pt-[112px]">
                <el-button size="small" type="primary" class="!text-[11px] !px-2" @click="openAddSegDialog(idx, 'generate')">+生成</el-button>
                <el-button size="small" class="!text-[11px] !px-2 !bg-cyan-500 !text-white !border-cyan-500 hover:!bg-cyan-600" @click="openAddSegDialog(idx, 'splice')">+拼接</el-button>
              </div>
            </template>
            </div>

            <!-- 底部说明 -->
            <div class="px-5 pb-3 text-[11px] text-gray-400 flex justify-between">
              <div>
                点击编辑，进入/使用「单条生成」的弹窗/交互†&nbsp;&nbsp;
                「段」间均有这两选项†&nbsp;&nbsp;
                +生成：在模板中增加1个「生成段」&nbsp;&nbsp;
                +拼接：点了、弹窗、选择文件夹填入路径、仅支持公盘路径
              </div>
              <div class="ml-4 shrink-0">†删除均需弹窗确认</div>
            </div>
          </div>

          <div v-if="false && currentPlan" ref="resultPanelRef" class="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3 border-b border-emerald-100 bg-emerald-50/40">
              <div class="flex items-center gap-2">
                <el-icon class="text-emerald-500 text-lg"><DataLine /></el-icon>
                <span class="font-bold text-gray-800">执行结果</span>
                <el-tag size="small" type="success" effect="plain">批次 {{ currentPlan.batchNo || '-' }}</el-tag>
              </div>
              <el-button size="small" @click="handleSelectPlan(currentPlan)">刷新结果</el-button>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 pt-4">
              <div class="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                <div class="text-xs text-gray-500">生成结果</div>
                <div class="mt-1 text-lg font-bold text-blue-600">{{ currentPlanSummary.generateSuccess }}/{{ currentPlanSummary.generateTotal }}</div>
                <div class="text-[11px] text-gray-400">成功 / 总数</div>
              </div>
              <div class="rounded-xl border border-red-100 bg-red-50/40 p-3">
                <div class="text-xs text-gray-500">生成失败</div>
                <div class="mt-1 text-lg font-bold text-red-500">{{ currentPlanSummary.generateFailed }}</div>
                <div class="text-[11px] text-gray-400">本批次失败条数</div>
              </div>
              <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <div class="text-xs text-gray-500">拼接成片</div>
                <div class="mt-1 text-lg font-bold text-emerald-600">{{ currentPlanSummary.spliceSuccess }}/{{ currentPlanSummary.spliceTotal }}</div>
                <div class="text-[11px] text-gray-400">成功 / 总数</div>
              </div>
              <div class="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <div class="text-xs text-gray-500">计划状态</div>
                <div class="mt-1 flex items-center gap-2">
                  <el-tag :type="getPlanStatusType(currentPlan.status)" size="small">{{ currentPlan.statusText }}</el-tag>
                </div>
                <div class="text-[11px] text-gray-400 truncate">{{ currentPlan.errorMessage || '当前无错误信息' }}</div>
              </div>
            </div>

            <div class="px-5 py-4">
              <div class="font-bold text-gray-700 mb-3">生成结果</div>
              <div v-if="currentGenerateTasks.length" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div
                  v-for="task in currentGenerateTasks"
                  :key="`gen-${task.id}`"
                  class="rounded-xl border border-gray-100 p-3 bg-gray-50/50"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="font-medium text-gray-800">{{ task.outputFileName || task.inputPayload?.title || `生成结果-${task.id}` }}</div>
                      <div class="text-[11px] text-gray-400 mt-1">
                        数字人：{{ task.inputPayload?.digital_human_name || '-' }} ｜ 配音：{{ task.inputPayload?.voice_name || '-' }}
                      </div>
                    </div>
                    <el-tag :type="getTaskStatusType(task.taskStatus)" size="small">{{ getTaskStatusText(task.taskStatus) }}</el-tag>
                  </div>
                  <div class="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                    <span>序号 {{ task.inputPayload?.seq_no || '-' }}</span>
                    <span>时长 {{ formatVideoDuration(task.outputDuration) }}</span>
                    <span>大小 {{ formatFileSize(task.outputFileSize) }}</span>
                  </div>
                  <div v-if="task.outputPreviewUrl" class="mt-3">
                    <img :src="task.outputPreviewUrl" class="w-full h-[140px] object-cover rounded-lg border border-gray-100" alt="生成结果封面" />
                  </div>
                  <div v-if="task.errorMessage" class="mt-2 text-[11px] text-red-500">失败原因：{{ task.errorMessage }}</div>
                  <div class="mt-3 flex gap-2">
                    <el-button size="small" type="primary" plain :disabled="!task.outputFileUrl" @click="openResultVideo(task.outputFileUrl)">查看视频</el-button>
                    <el-button size="small" :disabled="!task.outputFileUrl" @click="copyResultUrl(task.outputFileUrl)">复制链接</el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="当前还没有生成结果" :image-size="90" />
            </div>

            <div class="px-5 pb-5">
              <div class="font-bold text-gray-700 mb-3">拼接成片</div>
              <div v-if="currentSpliceResults.length" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div
                  v-for="result in currentSpliceResults"
                  :key="`splice-${result.id}`"
                  class="rounded-xl border border-gray-100 p-3 bg-gray-50/50"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="font-medium text-gray-800">{{ result.outputFileName || `拼接成片-${result.resultNo || result.id}` }}</div>
                      <div class="text-[11px] text-gray-400 mt-1">
                        成片序号：{{ result.resultNo || '-' }} ｜ 素材数：{{ result.inputFileIds?.length || 0 }}
                      </div>
                    </div>
                    <el-tag :type="getTaskStatusType(result.resultStatus)" size="small">{{ getTaskStatusText(result.resultStatus) }}</el-tag>
                  </div>
                  <div class="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                    <span>时长 {{ formatVideoDuration(result.outputDuration) }}</span>
                    <span>大小 {{ formatFileSize(result.outputFileSize) }}</span>
                  </div>
                  <div v-if="result.outputPreviewUrl" class="mt-3">
                    <img :src="result.outputPreviewUrl" class="w-full h-[140px] object-cover rounded-lg border border-gray-100" alt="拼接结果封面" />
                  </div>
                  <div v-if="result.errorMessage" class="mt-2 text-[11px] text-red-500">失败原因：{{ result.errorMessage }}</div>
                  <div class="mt-3 flex gap-2">
                    <el-button size="small" type="success" plain :disabled="!result.outputUrl" @click="openResultVideo(result.outputUrl)">查看成片</el-button>
                    <el-button size="small" :disabled="!result.outputUrl" @click="copyResultUrl(result.outputUrl)">复制链接</el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="当前还没有拼接成片" :image-size="90" />
            </div>
          </div>

          <!-- 未选中计划时占位 -->
          <div
            v-if="!currentPlan"
            class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-3"
          >
            <el-icon class="text-5xl text-gray-300"><Document /></el-icon>
            <p class="text-sm text-gray-400">请先新建或点击计划名称，进入计划框架配置</p>
            <el-button type="primary" @click="handleAddPlan">新建计划</el-button>
          </div>

        </div>
      </el-tab-pane>

      <!-- ===================== Tab2: 模板管理 ===================== -->
      <el-tab-pane label="模板管理" name="templateManage">
        <div class="space-y-4">
          <!-- 标题操作栏 -->
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-700">框架模板管理</h3>
            <el-button type="primary" size="small" @click="handleAddTemplate">
              <el-icon class="mr-1"><Plus /></el-icon>新建模板
            </el-button>
          </div>

          <!-- 模板列表 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="tpl in templateList"
              :key="tpl.id"
              class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group"
              :class="currentTemplate?.id === tpl.id ? 'ring-2 ring-blue-400 border-blue-300' : ''"
              @click="handleSelectTemplate(tpl)"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="font-bold text-gray-800 text-sm">{{ tpl.name }}</div>
                <el-dropdown @click.stop trigger="click">
                  <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mt-1 ml-1 shrink-0"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click.stop="handleEditTemplate(tpl)">编辑</el-dropdown-item>
                      <el-dropdown-item @click.stop="handleDeleteTemplate(tpl)" class="!text-red-500">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="text-xs text-gray-400 mb-3">{{ tpl.remark || '暂无备注' }}</div>
              <div class="flex gap-1 flex-wrap">
                <el-tag v-for="(seg, i) in tpl.segments" :key="i"
                  :type="seg.type === 'generate' ? '' : 'info'"
                  size="small" effect="light"
                >{{ String.fromCharCode(65+i) }}段·{{ seg.type === 'generate' ? '生成' : '拼接' }}</el-tag>
              </div>
              <div class="text-[11px] text-gray-400 mt-2">{{ tpl.createTime }} 创建</div>
            </div>

            <!-- 新建模板 -->
            <div
              class="bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center h-[160px] cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              @click="handleAddTemplate"
            >
              <el-icon class="text-4xl text-gray-300 mb-2"><Plus /></el-icon>
              <span class="text-sm text-gray-400">新建框架模板</span>
            </div>
          </div>

          <!-- 模板段落编辑器 -->
          <div v-if="currentTemplate" class="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3 border-b border-blue-100 bg-blue-50/40">
              <div class="flex items-center gap-2">
                <el-icon class="text-blue-500 text-lg"><Tickets /></el-icon>
                <span class="font-bold text-gray-800">{{ currentTemplate.name }}</span>
                <el-tag type="info" size="small" effect="plain">框架模板</el-tag>
              </div>
              <div class="flex items-center gap-2">
                <el-button size="small" @click="handleCopyTemplate">复制模板</el-button>
                <el-button size="small" type="primary" @click="handleSaveTemplateConfig">保存模板配置</el-button>
              </div>
            </div>
            <div class="flex gap-3 px-5 py-4 overflow-x-auto items-center">
              <div
                v-if="!currentTemplate.segments?.length"
                class="flex-shrink-0 w-[220px] h-[200px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                @click="openAddTplSegDialog(-1)"
              >
                <el-icon class="text-4xl text-gray-300"><Plus /></el-icon>
                <span class="text-sm text-gray-400">点击添加首段</span>
              </div>
              <template v-for="(seg, idx) in currentTemplate.segments" :key="seg.id">
                <div
                  class="flex-shrink-0 w-[180px] min-h-[120px] rounded-xl border bg-white shadow-sm flex flex-col"
                  :class="seg.type === 'generate' ? 'border-blue-200' : 'border-cyan-200'"
                >
                  <div class="px-3 py-2 rounded-t-xl text-sm font-bold text-gray-800"
                    :class="seg.type === 'generate' ? 'bg-blue-50 border-b border-blue-100' : 'bg-cyan-50 border-b border-cyan-100'"
                  >
                    {{ String.fromCharCode(65+idx) }}段：{{ seg.type === 'generate' ? '生成段' : '拼接段' }}
                  </div>
                  <div class="p-3 text-xs text-gray-500 flex-1">
                    <div v-if="seg.type === 'generate'">生成段</div>
                    <div v-else>拼接段</div>
                  </div>
                  <div class="px-3 pb-3">
                    <el-button size="small" type="danger" plain class="w-full !text-[11px]" @click="handleDeleteTplSegment(idx)">删除</el-button>
                  </div>
                </div>
                <!-- 段间插入按钮（居中对齐） -->
                <div class="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 self-center">
                  <el-button size="small" type="primary" class="!text-[11px] !px-2" @click="openAddTplSegDialog(idx, 'generate')">+生成</el-button>
                  <el-button size="small" class="!text-[11px] !px-2 !bg-cyan-500 !text-white !border-cyan-500 hover:!bg-cyan-600" @click="openAddTplSegDialog(idx, 'splice')">+拼接</el-button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===================== Tab3: 剪辑文件夹 ===================== -->
      <el-tab-pane label="剪辑文件夹" name="clipFolders">
        <div class="flex gap-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" style="min-height: 560px">

          <!-- ===== 左侧树形导航 ===== -->
          <div class="w-64 shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/60">
            <!-- 左侧标题栏 -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
              <span class="text-sm font-bold text-gray-700">文件夹目录</span>
              <el-dropdown trigger="click" @command="handleTreeCommand">
                <el-button size="small" type="primary" plain>
                  <el-icon class="mr-1"><Plus /></el-icon>新建
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="addProduct">新建产品</el-dropdown-item>
                    <el-dropdown-item command="addFolder" :disabled="!selectedProductId">新建文件夹</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 搜索框 -->
            <div class="px-3 py-2 border-b border-gray-100 bg-white">
              <el-input v-model="treeSearch" placeholder="搜索..." size="small" clearable>
                <template #prefix><el-icon class="text-gray-400"><Search /></el-icon></template>
              </el-input>
            </div>

            <!-- 树形控件 -->
            <div class="flex-1 overflow-y-auto py-2">
              <el-tree
                ref="clipTreeRef"
                :data="clipTreeData"
                :props="{ children: 'children', label: 'label' }"
                :filter-node-method="filterTreeNode"
                node-key="id"
                default-expand-all
                highlight-current
                @node-click="handleTreeNodeClick"
              >
                <template #default="{ node, data }">
                  <div class="flex items-center gap-1.5 w-full pr-2 py-0.5 min-w-0">
                    <!-- 账户节点 -->
                    <template v-if="data.type === 'account'">
                      <el-icon class="text-indigo-500 shrink-0 text-base"><User /></el-icon>
                      <span class="text-sm font-bold text-gray-800 truncate flex-1">{{ data.label }}</span>
                      <el-tag size="small" effect="plain" class="shrink-0 !text-[10px]">{{ data.children?.length ?? 0 }} 产品</el-tag>
                    </template>
                    <!-- 产品节点 -->
                    <template v-else-if="data.type === 'product'">
                      <el-icon class="text-orange-400 shrink-0"><Tickets /></el-icon>
                      <span class="text-sm text-gray-700 truncate flex-1">{{ data.label }}</span>
                      <span class="text-[10px] text-gray-400 shrink-0">{{ data.children?.length ?? 0 }} 个</span>
                    </template>
                    <!-- 文件夹节点 -->
                    <template v-else>
                      <el-icon class="text-blue-400 shrink-0"><Folder /></el-icon>
                      <span class="text-xs text-gray-700 truncate flex-1">{{ data.label }}</span>
                      <span class="text-[10px] text-gray-400 shrink-0">{{ data.folderData?.videoCount ?? 0 }}</span>
                    </template>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>

          <!-- ===== 右侧内容区 ===== -->
          <div class="flex-1 min-w-0 flex flex-col">

            <!-- 未选中状态 -->
            <div v-if="!selectedTreeNode" class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <el-icon class="text-5xl text-gray-200"><FolderOpened /></el-icon>
              <p class="text-sm">请在左侧选择产品或文件夹</p>
            </div>

            <!-- 产品概览（点击产品节点） -->
            <div v-else-if="selectedTreeNode.type === 'product'" class="flex-1 p-5 overflow-y-auto">
              <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-3">
                  <el-icon class="text-orange-400 text-xl"><Tickets /></el-icon>
                  <h3 class="text-base font-bold text-gray-800">{{ selectedTreeNode.label }}</h3>
                  <el-tag type="warning" size="small" effect="plain">产品</el-tag>
                </div>
                <div class="flex items-center gap-2">
                  <el-button size="small" @click="handleEditProduct(selectedTreeNode)">编辑产品</el-button>
                  <el-button size="small" type="primary" @click="handleTreeCommand('addFolder')">
                    <el-icon class="mr-1"><Plus /></el-icon>新建文件夹
                  </el-button>
                  <el-button size="small" type="danger" plain @click="handleDeleteProduct(selectedTreeNode)">删除产品</el-button>
                </div>
              </div>

              <!-- 该产品下的文件夹卡片网格 -->
              <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="folder in selectedProductFolders"
                  :key="folder.id"
                  class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group"
                  @click="handleSelectFolder(folder)"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <el-icon class="text-blue-500 text-lg"><Folder /></el-icon>
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-gray-800 text-sm truncate">{{ folder.name }}</div>
                        <div class="text-[10px] text-gray-400 truncate">{{ folder.path }}</div>
                      </div>
                    </div>
                    <el-dropdown @click.stop trigger="click">
                      <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mt-1 ml-1 shrink-0"><MoreFilled /></el-icon>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click.stop="handleEditFolder(folder)">编辑</el-dropdown-item>
                          <el-dropdown-item @click.stop="handleBatchGenerateToFolder(folder)">批量生成至此</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                  <div class="grid grid-cols-3 gap-1 mb-2">
                    <div class="bg-gray-50 rounded-lg py-1.5 text-center">
                      <div class="text-base font-bold text-blue-600">{{ folder.videoCount }}</div>
                      <div class="text-[9px] text-gray-500">总数</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg py-1.5 text-center">
                      <div class="text-base font-bold text-green-600">{{ folder.generatedCount }}</div>
                      <div class="text-[9px] text-gray-500">已生成</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg py-1.5 text-center">
                      <div class="text-base font-bold text-orange-500">{{ folder.videoCount - folder.generatedCount }}</div>
                      <div class="text-[9px] text-gray-500">已上传</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                    <span>{{ folder.size }}</span>
                    <span>{{ folder.updateTime }}</span>
                  </div>
                  <el-progress
                    :percentage="folder.videoCount > 0 ? Math.round(folder.generatedCount / folder.videoCount * 100) : 0"
                    :show-text="false" :stroke-width="3" color="#22c55e"
                  />
                </div>

                <!-- 新建文件夹卡 -->
                <div
                  class="bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center min-h-[140px] cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  @click="handleTreeCommand('addFolder')"
                >
                  <el-icon class="text-3xl text-gray-300 mb-1.5"><Plus /></el-icon>
                  <span class="text-xs text-gray-400">新建文件夹</span>
                </div>
              </div>
            </div>

            <!-- 文件夹视频列表（点击文件夹节点） -->
            <template v-else-if="selectedTreeNode.type === 'folder'">
              <!-- 顶栏 -->
              <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shrink-0">
                <div class="flex items-center gap-2">
                  <el-icon class="text-blue-500"><Folder /></el-icon>
                  <span class="font-bold text-gray-800 text-sm">{{ selectedTreeNode.label }}</span>
                  <el-tag type="info" size="small" effect="plain">{{ selectedTreeNode.folderData?.path }}</el-tag>
                </div>
                <div class="flex items-center gap-2">
                  <el-button
                    size="small"
                    :loading="syncingFolderId === selectedTreeNode.folderData?.id"
                    @click="handleSyncFolderVideos"
                  >
                    <el-icon class="mr-1"><Connection /></el-icon>同步
                  </el-button>
                  <el-input
                    v-model="folderSearch"
                    placeholder="搜索视频..."
                    size="small"
                    style="width: 180px"
                    clearable
                  />
                </div>
              </div>

              <!-- 统计行 -->
              <div class="flex items-center gap-6 px-5 py-2 border-b border-gray-50 bg-gray-50/60 text-xs text-gray-500 shrink-0">
                <span>总数 <b class="text-blue-600">{{ selectedTreeNode.folderData?.videoCount ?? 0 }}</b></span>
                <span>已生成 <b class="text-green-600">{{ selectedTreeNode.folderData?.generatedCount ?? 0 }}</b></span>
                <span>已上传 <b class="text-orange-500">{{ (selectedTreeNode.folderData?.videoCount ?? 0) - (selectedTreeNode.folderData?.generatedCount ?? 0) }}</b></span>
                <span>大小 <b class="text-gray-700">{{ selectedTreeNode.folderData?.size }}</b></span>
                <span>更新 <b class="text-gray-700">{{ selectedTreeNode.folderData?.updateTime }}</b></span>
              </div>

              <!-- 视频表格 -->
              <div class="flex-1 p-4 overflow-y-auto">
                <el-table
                  :data="currentFolderVideos"
                  style="width: 100%"
                  size="small"
                  :header-cell-style="{ background: '#f8fafc', color: '#606266' }"
                >
                  <el-table-column label="文件名" prop="name" min-width="200" show-overflow-tooltip />
                  <el-table-column label="时长" prop="duration" width="75" align="center">
                    <template #default="scope"><span class="text-xs">{{ scope.row.duration }}</span></template>
                  </el-table-column>
                  <el-table-column label="大小" prop="size" width="100" align="center">
                    <template #default="scope"><span class="text-xs">{{ scope.row.size }}</span></template>
                  </el-table-column>
                  <el-table-column label="创建时间" prop="createTime" width="125" align="center">
                    <template #default="scope"><span class="text-xs text-gray-500">{{ scope.row.createTime }}</span></template>
                  </el-table-column>
                </el-table>

                <div v-if="!currentFolderVideos.length" class="py-10 text-center text-gray-400">
                  <el-icon class="text-4xl mb-2"><VideoPlay /></el-icon>
                  <p class="text-sm">该文件夹暂无视频，可通过「同步」或直接上传添加</p>
                </div>

                <div v-if="currentFolderVideos.length" class="flex justify-end mt-3">
                  <el-pagination
                    v-model:current-page="folderVideoPage"
                    v-model:page-size="folderVideoPageSize"
                    :total="folderVideoTotal"
                    layout="total, sizes, prev, pager, next"
                    :page-sizes="[10, 20, 50, 100]"
                    background small
                    @current-change="loadCurrentFolderVideos"
                    @size-change="handleFolderPageSizeChange"
                  />
                </div>
              </div>
            </template>

            <!-- 账户节点概览 -->
            <div v-else-if="selectedTreeNode.type === 'account'" class="flex-1 p-5">
              <div class="flex items-center gap-3 mb-5">
                <el-icon class="text-indigo-500 text-xl"><User /></el-icon>
                <h3 class="text-base font-bold text-gray-800">{{ selectedTreeNode.label }}</h3>
                <el-tag size="small" effect="plain">{{ accountProducts.length }} 个产品</el-tag>
              </div>
              <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="prod in accountProducts"
                  :key="prod.id"
                  class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                  @click="handleSelectProductById(prod.id)"
                >
                  <div class="flex items-center gap-2 mb-3">
                    <el-icon class="text-orange-400 text-lg"><Tickets /></el-icon>
                    <span class="font-bold text-gray-800">{{ prod.name }}</span>
                  </div>
                  <div class="text-xs text-gray-500">{{ prod.folders.length }} 个文件夹</div>
                  <div class="text-xs text-gray-400 mt-1">
                    视频总数：{{ prod.folders.reduce((s, f) => s + f.videoCount, 0) }}
                  </div>
                </div>
                <div
                  class="bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  @click="handleTreeCommand('addProduct')"
                >
                  <el-icon class="text-3xl text-gray-300 mb-1"><Plus /></el-icon>
                  <span class="text-xs text-gray-400">新建产品</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 弹窗集合 ==================== -->

    <!-- 新建/编辑计划 -->
    <el-dialog
      :title="planDialog.isEdit ? '编辑计划' : '新建计划'"
      v-model="planDialog.visible"
      width="480px"
      append-to-body
    >
      <el-form :model="planForm" label-width="90px">
        <el-form-item label="计划名称" required>
          <el-input v-model="planForm.name" placeholder="请输入计划名称" />
        </el-form-item>
          <el-form-item label="计划框架" required>
            <el-select v-model="planForm.templateId" placeholder="请选择计划框架" class="w-full">
            <el-option v-for="tpl in templateList" :key="tpl.id" :label="tpl.name" :value="tpl.id">
              <div class="flex items-center justify-between">
                <span>{{ tpl.name }}</span>
                <span class="text-gray-400 text-xs ml-3">{{ tpl.segments?.length || 0 }}个段</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="false" label="开始时间">
          <el-date-picker
            v-model="planForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            class="w-full"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑模板 -->
    <el-dialog
      :title="templateDialog.isEdit ? '编辑模板' : '新建模板'"
      v-model="templateDialog.visible"
      width="420px"
      append-to-body
    >
      <el-form :model="templateForm" label-width="80px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="templateForm.remark" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitTemplate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 选择段类型 -->
    <el-dialog title="选择段类型" v-model="addSegTypeDialog.visible" width="420px" append-to-body>
      <div class="flex gap-4">
        <div
          class="flex-1 border-2 rounded-xl p-5 text-center cursor-pointer transition-all"
          :class="addSegTypeDialog.type === 'generate'
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'"
          @click="addSegTypeDialog.type = 'generate'"
        >
          <el-icon class="text-3xl text-blue-500 mb-2"><VideoCamera /></el-icon>
          <div class="font-bold text-gray-800 mb-1">生成段</div>
          <div class="text-xs text-gray-400">配置批量生成任务，结果自动存入剪辑文件夹</div>
        </div>
        <div
          class="flex-1 border-2 rounded-xl p-5 text-center cursor-pointer transition-all"
          :class="addSegTypeDialog.type === 'splice'
            ? 'border-cyan-500 bg-cyan-50 shadow-sm'
            : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30'"
          @click="addSegTypeDialog.type = 'splice'"
        >
          <el-icon class="text-3xl text-cyan-500 mb-2"><Connection /></el-icon>
          <div class="font-bold text-gray-800 mb-1">拼接段</div>
          <div class="text-xs text-gray-400">从剪辑文件夹直接取视频参与拼接</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="addSegTypeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddSegment">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 编辑段 -->
    <el-dialog
      :title="segDialog.seg?.type === 'generate' ? '编辑生成段' : '编辑拼接段'"
      v-model="segDialog.visible"
      width="700px"
      append-to-body
    >
      <template v-if="segDialog.seg">
        <!-- 生成段 -->
        <template v-if="segDialog.seg.type === 'generate'">
          <el-form :model="segDialog.seg" label-width="110px">
            <el-form-item label="自动存储路径" required>
              <div class="w-full flex items-center gap-2">
                <el-input :model-value="getFolderDisplayText(segDialog.seg.folderId, 'generate')" placeholder="请选择剪辑文件夹" readonly />
                <el-button type="primary" plain @click="openFolderPicker('generate')">选择文件夹</el-button>
              </div>
            </el-form-item>
            <el-form-item label="任务用途">
              <el-radio-group v-model="segDialog.seg.taskPurpose" size="small">
                <el-radio-button v-for="opt in taskPurposeOptions" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="脚本内容" required>
              <div class="w-full">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-gray-400">该生成段的所有视频统一使用这一份脚本</span>
                  <div class="flex gap-2">
                    <el-button size="small" plain @click="openScriptSelector('library')">文案库导入</el-button>
                    <el-button size="small" plain @click="openScriptSelector('history')">历史文案</el-button>
                  </div>
                </div>
                <el-input
                  v-model="segDialog.seg.script"
                  type="textarea"
                  :rows="6"
                  maxlength="2000"
                  show-word-limit
                  placeholder="请输入这一整个生成段共用的脚本内容"
                />
              </div>
            </el-form-item>

            <!-- 内嵌批量生成配置 -->
            <div
              class="border rounded-xl p-4 mt-2 transition-colors"
              :class="needsGenConfig(segDialog.seg) ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 bg-gray-50/40'"
            >
              <div class="flex items-center gap-2 mb-3">
                <el-icon class="text-blue-500"><VideoCamera /></el-icon>
                <span class="font-bold text-sm text-gray-700">批量生成配置</span>
                <el-tag v-if="needsGenConfig(segDialog.seg)" type="danger" size="small" effect="light">必填</el-tag>
                <el-tag v-else size="small" effect="plain">可选</el-tag>
                <el-tooltip content="选择「仅新生成拼接」或「新+旧均拼接」时，需配置生成参数" placement="top">
                  <el-icon class="text-gray-400 cursor-pointer"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>

              <!-- 创建数量 -->
              <div class="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <span class="text-sm text-gray-700 font-medium whitespace-nowrap">创建几个：</span>
                <el-input-number
                  v-model="segDialog.seg.genConfigCount"
                  :min="1" :max="50"
                  class="!w-32"
                  @change="syncGenConfigs"
                />
                <span class="text-xs text-gray-400">每个视频可单独配置数字人、配音或绑定关系，脚本统一使用上面的通用脚本</span>
              </div>

              <!-- 配置列表 -->
              <div class="space-y-2 max-h-[280px] overflow-y-auto">
                <div
                  v-for="(cfg, ci) in segDialog.seg.genConfigs"
                  :key="cfg.id"
                  class="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3 hover:border-blue-200 transition-colors"
                >
                  <div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {{ ci + 1 }}
                  </div>
                  <div class="flex-1 grid grid-cols-3 gap-3 text-xs min-w-0">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-gray-400">数字人形象</span>
                      <span class="font-medium truncate" :class="cfg.digitalHumanName ? 'text-gray-700' : 'text-red-400'">{{ cfg.digitalHumanName || '未配置' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-gray-400">配音选择</span>
                      <span class="font-medium truncate" :class="cfg.voiceName ? 'text-gray-700' : 'text-red-400'">{{ cfg.voiceName || '未配置' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-gray-400">绑定关系</span>
                      <span class="font-medium truncate" :class="cfg.relationName ? 'text-gray-700' : 'text-gray-400'">{{ cfg.relationName || '未使用绑定关系' }}</span>
                    </div>
                  </div>
                  <el-button size="small" type="primary" plain class="!text-xs flex-shrink-0" @click="openSingleGenDialog(ci)">编辑</el-button>
                </div>
                <div v-if="!segDialog.seg?.genConfigs?.length" class="py-6 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                  暂无配置项，请先设置创建数量
                </div>
              </div>
            </div>
          </el-form>
        </template>

        <!-- 拼接段 -->
        <template v-else>
          <el-form :model="segDialog.seg" label-width="110px">
            <el-form-item label="剪辑文件夹" required>
              <div class="w-full flex items-center gap-2">
                <el-input :model-value="getFolderDisplayText(segDialog.seg.folderId, 'splice')" placeholder="请选择剪辑文件夹" readonly />
                <el-button type="primary" plain @click="openFolderPicker('splice')">选择文件夹</el-button>
              </div>
            </el-form-item>
            <el-form-item label="文件夹路径">
              <el-input v-model="segDialog.seg.folderPath" placeholder="选择文件夹后自动填入" />
            </el-form-item>
            <el-form-item label="视频数量">
              <el-tag type="info">当前文件夹共 {{ segDialog.seg.videoCount ?? 0 }} 个视频</el-tag>
            </el-form-item>
          </el-form>
        </template>
      </template>
      <template #footer>
        <el-button @click="segDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitSegment">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑文件夹 -->
    <el-dialog
      :title="folderDialog.isEdit ? '编辑剪辑文件夹' : '新建剪辑文件夹'"
      v-model="folderDialog.visible"
      width="480px"
      append-to-body
    >
      <el-form :model="folderForm" label-width="90px">
        <el-form-item label="所属产品" required>
          <el-select v-model="folderForm.productId" placeholder="请选择所属产品" class="w-full">
            <el-option v-for="p in accountProducts" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件夹名称" required>
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
        <el-form-item label="存储路径">
          <el-input v-model="folderForm.path" placeholder="由后端自动维护" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="folderForm.remark" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑产品 -->
    <el-dialog
      :title="productDialog.isEdit ? '编辑产品' : '新建产品'"
      v-model="productDialog.visible"
      width="420px"
      append-to-body
    >
      <el-form :model="productForm" label-width="80px">
        <el-form-item label="产品名称" required>
          <el-input v-model="productForm.name" placeholder="如：熊宝堂、龙牙" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="productForm.remark" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成至文件夹 -->
    <el-dialog
      title="批量生成至文件夹"
      v-model="batchGenDialog.visible"
      width="680px"
      append-to-body
    >
      <div class="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100 flex items-center gap-2">
        <el-icon class="text-blue-500 shrink-0"><InfoFilled /></el-icon>
        生成完成后，视频将自动存入「{{ batchGenDialog.folder?.name }}」文件夹，可在自动剪辑任务的生成段中被引用。
      </div>
      <el-form :model="batchGenForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="生成渠道" required>
              <el-select v-model="batchGenForm.channel" placeholder="选择渠道" class="w-full">
                <el-option label="A2E" value="a2e" />
                <el-option label="即创" value="jichuang" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数字人形象" required>
              <el-select v-model="batchGenForm.digitalHuman" placeholder="选择数字人" class="w-full" filterable>
                <el-option v-for="h in humanOptions" :key="h.externalId || h.name" :label="h.name" :value="h.externalId || h.name" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="配音选择" required>
              <el-select v-model="batchGenForm.voice" placeholder="选择配音" class="w-full" filterable>
                <el-option v-for="v in voiceOptions" :key="v.externalId || v.name" :label="v.name" :value="v.externalId || v.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生成数量" required>
              <el-input-number v-model="batchGenForm.count" :min="1" :max="200" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="脚本内容" required>
          <el-input
            type="textarea"
            v-model="batchGenForm.script"
            :rows="6"
            placeholder="输入脚本内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchGenDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchGenerate">开始生成</el-button>
      </template>
    </el-dialog>

    <!-- 单条生成参数配置弹窗 -->
    <el-dialog
      :title="`配置生成参数 — 第 ${singleGenDialog.cfgIdx + 1} 条`"
      v-model="singleGenDialog.visible"
      width="860px"
      append-to-body
      destroy-on-close
    >
      <div class="p-1">
        <!-- 提示条 -->
        <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-600 flex items-center gap-2">
          <el-icon class="text-blue-500 shrink-0"><InfoFilled /></el-icon>
          配置该条视频的数字人形象、配音或绑定关系；脚本内容统一使用生成段里填写的通用脚本
        </div>

        <el-form :model="singleGenDialog.form" label-width="100px" label-position="left">
          <!-- 渠道 -->
          <el-form-item label="生成渠道">
            <div class="flex gap-2 p-1 bg-gray-50 rounded-lg w-fit">
              <div class="px-4 py-1.5 rounded-md cursor-pointer border-2 bg-white border-blue-500 shadow-sm text-blue-600 text-sm font-bold">默认</div>
            </div>
          </el-form-item>

          <!-- 数字人形象 -->
          <el-form-item label="数字人形象" required>
            <div class="w-full flex items-center gap-2">
              <el-input v-model="singleGenDialog.form.digitalHumanName" placeholder="点击选择数字人形象" readonly />
              <el-button type="primary" plain @click="openHumanSelectorForSegment">选择形象</el-button>
            </div>
          </el-form-item>

          <!-- 配音选择 -->
          <el-form-item label="配音选择" required>
            <div class="w-full flex items-center gap-2">
              <el-input v-model="singleGenDialog.form.voiceName" placeholder="点击选择配音" readonly />
              <el-button type="primary" plain @click="openVoiceSelectorForSegment">选择配音</el-button>
            </div>
          </el-form-item>

          <el-form-item label="绑定关系">
            <div class="w-full space-y-2">
              <div class="flex items-center gap-2">
                <el-input v-model="singleGenDialog.form.relationName" placeholder="可选：直接选择已绑定的数字人+配音组合" readonly />
                <el-button type="success" plain @click="openBindingSelectorForSegment">选择绑定</el-button>
                <el-button v-if="singleGenDialog.form.relationName" plain @click="clearSegmentBinding">清空绑定</el-button>
              </div>
              <div class="text-[11px] text-gray-400">选择绑定关系后，会直接覆盖上方的数字人和配音</div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="singleGenDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSingleGenConfig">保存此条配置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="folderPickerDialog.visible" title="选择剪辑文件夹" width="720px" append-to-body>
      <div class="flex gap-4 min-h-[360px]">
        <div class="w-[300px] border border-gray-100 rounded-lg p-3 overflow-y-auto">
          <el-tree
            :data="folderPickerTreeData"
            node-key="id"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            @node-click="handleFolderPickerNodeClick"
          >
            <template #default="{ data }">
              <div class="flex items-center justify-between w-full pr-2">
                <span class="truncate">{{ data.label }}</span>
                <span class="text-[11px] text-gray-400 ml-2">{{ data.videoCount || 0 }}</span>
              </div>
            </template>
          </el-tree>
        </div>
        <div class="flex-1 border border-gray-100 rounded-lg p-4 bg-gray-50/50">
          <div class="text-sm font-medium text-gray-700 mb-3">当前选择</div>
          <template v-if="folderPickerDialog.selectedFolder">
            <div class="space-y-3 text-sm">
              <div><span class="text-gray-400">文件夹：</span><span class="text-gray-700 font-medium">{{ folderPickerDialog.selectedFolder.name }}</span></div>
              <div><span class="text-gray-400">路径：</span><span class="text-gray-700 break-all">{{ folderPickerDialog.selectedFolder.path }}</span></div>
              <div><span class="text-gray-400">视频数：</span><span class="text-gray-700">{{ folderPickerDialog.selectedFolder.videoCount || 0 }}</span></div>
            </div>
          </template>
          <div v-else class="text-sm text-gray-400">请从左侧树中选择一个文件夹</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="folderPickerDialog.visible = false">取消</el-button>
        <el-button type="primary" :disabled="!folderPickerDialog.selectedFolder" @click="confirmFolderPicker">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="humanSelectorDialog.visible" title="选择数字人形象" width="1000px" append-to-body>
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <el-input v-model="humanSelectorDialog.search" placeholder="搜索数字人形象" clearable @keyup.enter="reloadHumanOptions">
            <template #append>
              <el-button @click="reloadHumanOptions">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div ref="humanScrollRef" class="grid grid-cols-5 gap-x-5 gap-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[800px] overflow-y-auto" @scroll.passive="handleHumanScroll">
          <div
            v-for="item in humanSelectorDialog.displayList"
            :key="item.externalId || item.name"
            class="relative cursor-pointer group text-center"
            @click="selectHumanForSegment(item)"
          >
            <div
              class="aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all shadow-sm w-3/4 mx-auto"
              :class="singleGenDialog.form.digitalHumanName === item.name ? 'border-blue-500 shadow-lg shadow-blue-300/50' : 'border-blue-300 group-hover:border-blue-400 group-hover:shadow-md'"
            >
              <img v-if="item.coverUrl" :src="item.coverUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="数字人封面" />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xs bg-gray-100">暂无封面</div>
            </div>
            <div class="mt-2">
              <p class="text-xs text-gray-700 font-medium truncate">{{ item.name }}</p>
            </div>
            <div v-if="singleGenDialog.form.digitalHumanName === item.name" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
          <div v-if="humanSelectorDialog.loading" class="col-span-5 text-center py-4 text-gray-400 text-sm">加载中...</div>
          <div v-else-if="!humanSelectorDialog.hasMore && humanSelectorDialog.displayList.length > 0" class="col-span-5 text-center py-3 text-gray-400 text-xs">已全部加载</div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="voiceSelectorDialog.visible" title="选择配音" width="800px" append-to-body>
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <el-input v-model="voiceSelectorDialog.search" placeholder="搜索配音" clearable @keyup.enter="reloadVoiceOptions">
            <template #append>
              <el-button @click="reloadVoiceOptions">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div ref="voiceScrollRef" class="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[400px] overflow-y-auto" @scroll.passive="handleVoiceScroll">
          <div
            v-for="item in voiceSelectorDialog.displayList"
            :key="item.externalId || item.name"
            class="p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between"
            :class="singleGenDialog.form.voiceName === item.name ? 'border-blue-500 bg-blue-100 shadow-md' : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50'"
            @click="selectVoiceForSegment(item)"
          >
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <i class="el-icon-headset text-blue-500"></i>
              <p class="text-xs text-gray-700 font-medium truncate">{{ item.name }}</p>
            </div>
            <el-button type="text" icon="el-icon-headset" size="small" class="!text-blue-500 flex-shrink-0" @click.stop="playVoice(item.voiceUrl, item.name)"></el-button>
            <i v-if="singleGenDialog.form.voiceName === item.name" class="el-icon-check text-blue-500 text-sm ml-1"></i>
          </div>
          <div v-if="voiceSelectorDialog.loading" class="col-span-3 text-center py-4 text-gray-400 text-sm">加载中...</div>
          <div v-else-if="!voiceSelectorDialog.hasMore && voiceSelectorDialog.displayList.length > 0" class="col-span-3 text-center py-3 text-gray-400 text-xs">已全部加载</div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="bindingSelectorDialog.visible" title="选择绑定关系" width="1000px" append-to-body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <el-input v-model="bindingSelectorDialog.humanSearch" placeholder="搜索数字人名称" clearable @keyup.enter="reloadBindingOptions" />
          <el-input v-model="bindingSelectorDialog.voiceSearch" placeholder="搜索配音名称" clearable @keyup.enter="reloadBindingOptions">
            <template #append>
              <el-button @click="reloadBindingOptions">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div class="grid grid-cols-5 gap-x-5 gap-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-[800px] overflow-y-auto" @scroll="handleBindingScroll">
          <div
            v-for="item in bindingSelectorDialog.displayList"
            :key="item.id || item.name"
            class="rounded-lg border-2 cursor-pointer transition-all overflow-hidden flex flex-col justify-between relative group"
            :class="singleGenDialog.form.relationId === String(item.id || '') ? 'border-blue-500 shadow-lg shadow-blue-300/50' : 'border-blue-300 hover:border-blue-400 hover:shadow-md'"
            @click="selectBindingForSegment(item)"
          >
            <div v-if="item.coverUrl" class="w-3/4 mx-auto aspect-[3/4] overflow-hidden bg-gray-200 relative">
              <img :src="item.coverUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="绑定关系封面" />
            </div>
            <div v-else class="w-3/4 mx-auto aspect-[3/4] flex items-center justify-center bg-gray-100 text-gray-300 text-xs">暂无封面</div>
            <div class="p-3 bg-white">
              <p class="text-xs text-gray-700 font-medium line-clamp-2 mb-2">{{ item.name }}</p>
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] text-gray-400 truncate">{{ item.voiceName }}</span>
                <el-button type="text" size="small" icon="el-icon-headset" class="!text-blue-500 !p-0" @click.stop="playVoice(item.voiceUrl, item.voiceName || '')">试听</el-button>
              </div>
            </div>
            <div v-if="singleGenDialog.form.relationId === String(item.id || '')" class="absolute top-2 right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md">
              <i class="el-icon-check text-white text-sm"></i>
            </div>
          </div>
          <div v-if="bindingSelectorDialog.loading" class="col-span-5 text-center py-4 text-gray-400 text-sm">加载中...</div>
          <div v-else-if="!bindingSelectorDialog.hasMore && bindingSelectorDialog.displayList.length > 0" class="col-span-5 text-center py-3 text-gray-400 text-xs">已全部加载</div>
        </div>
      </div>
    </el-dialog>

    <el-dialog :title="scriptSelector.title" v-model="scriptSelector.visible" width="900px" append-to-body>
      <div v-if="scriptSelector.mode === 'library'" class="space-y-4">
        <div class="mb-4 flex items-center gap-4">
          <el-input placeholder="按标签搜索..." v-model="scriptSelector.search" size="small" style="width: 320px" clearable>
            <template #prefix><i class="el-icon-search"></i></template>
          </el-input>
          <div class="flex gap-2 flex-wrap">
            <el-tag v-for="tag in allScriptTags" :key="tag" size="mini" effect="plain" class="cursor-pointer hover:bg-blue-50" @click="scriptSelector.search = tag">{{ tag }}</el-tag>
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
      <div v-else class="space-y-4">
        <div class="mb-4">
          <el-input placeholder="按标题、内容或标签搜索..." v-model="scriptSelector.search" size="small" style="width: 320px" clearable>
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

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '/@/utils/request'
import { getBindingList, getDigitalHumanPaginateList, getScriptHistoryList, getScriptPaginateList, getVoicePaginateList } from '/@/api/material'
import {
  Plus, VideoPlay, VideoPause, VideoCamera, Connection, Folder, FolderOpened,
  Document, DArrowRight, Tickets, MoreFilled, ArrowLeft, QuestionFilled, InfoFilled,
  Search, User,
} from '@element-plus/icons-vue'
import { syncWindowsShareFolder } from '/@/api/material'
// ===== 类型定义 =====
interface SegmentError {
  message: string
  code: string
  reason: string
  suggestion: string
}

interface GenConfig {
  id: string
  digitalHumanExternalId?: string
  digitalHumanLocalId?: string | number
  digitalHuman?: string
  digitalHumanName?: string
  voiceExternalId?: string
  voiceLocalId?: string | number
  voice?: string
  voiceName?: string
  relationId?: number | string
  relationName?: string
  coverUrl?: string
  voiceUrl?: string
}

interface Segment {
  id: string
  type: 'generate' | 'splice'
  index: number
  // 生成段专属
  scriptCount?: number
  scriptFixed?: number
  generateTotal?: number
  generatedDone?: number
  savePath?: string
  folderId?: number | string
  taskPurpose?: 'direct' | 'new' | 'all'
  genChannel?: string
  digitalHuman?: string
  voice?: string
  genCount?: number
  script?: string
  genConfigCount?: number
  genConfigs?: GenConfig[]
  // 拼接段专属
  folderPath?: string
  videoCount?: number
  // 错误
  hasError?: boolean
  error?: SegmentError
}

interface Template {
  id: number | string
  name: string
  remark?: string
  createTime: string
  segments: Segment[]
}

interface Plan {
  id: number | string
  name: string
  createTime: string
  startTime?: string
  endTime?: string
  status: number | string
  statusText: string
  multiplier: number
  priorityMode?: string
  templateId?: number | string
  outputFolderId?: number | string
  batchNo?: string
  errorMessage?: string
  segments: Segment[]
  tasks: PlanTask[]
  results: PlanResult[]
}

interface PlanTask {
  id: number | string
  planNodeId?: number | string
  taskType: string
  taskStatus: string
  taskNo?: string
  batchNo?: string
  outputFileId?: number | string
  outputFileUrl?: string
  outputFileName?: string
  outputPreviewUrl?: string
  outputDuration?: number
  outputFileSize?: number
  errorMessage?: string
  createTime?: string
  finishedAt?: string
  inputPayload?: any
}

interface PlanResult {
  id: number | string
  taskId?: number | string
  resultNo?: number
  resultStatus: string
  outputFileId?: number | string
  outputUrl?: string
  outputFileName?: string
  outputPreviewUrl?: string
  outputDuration?: number
  outputFileSize?: number
  inputFileIds?: Array<number | string>
  inputFileUrls?: string[]
  errorMessage?: string
  createTime?: string
}

interface ClipFolder {
  id: number | string
  parentId?: number | string
  name: string
  path: string
  rawPath?: string
  videoCount: number
  generatedCount: number
  size: string
  updateTime: string
  remark?: string
  children?: ClipFolder[]
}

interface ClipProduct {
  id: number | string
  name: string
  remark?: string
  folders: ClipFolder[]
}

interface ClipTreeNode {
  id: string
  label: string
  type: 'account' | 'product' | 'folder'
  productId?: number | string
  folderData?: ClipFolder
  children?: ClipTreeNode[]
}

interface FolderVideo {
  id: number | string
  name: string
  duration?: string
  size?: string
  createTime: string
  fileUrl?: string
}

interface SelectOptionItem {
  id?: number | string
  name: string
  externalId?: string
  coverUrl?: string
  videoUrl?: string
  voiceUrl?: string
  digitalHumanName?: string
  voiceName?: string
  digitalHumanId?: string
  voiceId?: string
  digitalHumanExternalId?: string
  voiceExternalId?: string
  digitalHumanLocalId?: string | number
  voiceLocalId?: string | number
}

// ===== 常量 =====
const taskPurposeOptions = [
  { label: '现有直接拼接', value: 'direct' },
  { label: '仅新生成拼接', value: 'new' },
  { label: '新+旧均拼接', value: 'all' },
]

const planStatusTextMap: Record<string, string> = {
  draft: '待执行',
  running_generate: '生成中',
  waiting_splice: '待拼接',
  running_splice: '拼接中',
  completed: '已完成',
  failed: '失败',
  paused: '已暂停',
}

const taskPurposeToApiMap: Record<string, string> = {
  direct: 'existing_only',
  new: 'new_only',
  all: 'all',
}

const apiUseModeToPurposeMap: Record<string, Segment['taskPurpose']> = {
  existing_only: 'direct',
  new_only: 'new',
  all: 'all',
}

const getResponseData = (res: any) => res?.data?.data

const formatDateTime = (raw?: string) => {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString('zh-CN', { hour12: false })
}

const formatFileSize = (size?: number | string | null) => {
  const value = Number(size ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '0 MB'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value >= 10 * 1024 ? 0 : 1)} KB`
  return `${(value / (1024 * 1024)).toFixed(value >= 100 * 1024 * 1024 ? 0 : 1)} MB`
}

const formatVideoDuration = (duration?: number | string | null) => {
  const seconds = Number(duration ?? 0)
  if (!Number.isFinite(seconds) || seconds <= 0) return '-'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}h ${remainMinutes}m ${remainSeconds}s`
}

const getPlanStatusText = (status?: string | number) => {
  const key = String(status ?? 'draft')
  return planStatusTextMap[key] ?? key
}

const getTaskStatusText = (status?: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    running: '执行中',
    processing: '执行中',
    success: '成功',
    finished: '成功',
    failed: '失败',
  }
  return map[String(status || '')] || String(status || '-')
}

const getTaskStatusType = (status?: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    processing: 'warning',
    success: 'success',
    finished: 'success',
    failed: 'danger',
  }
  return map[String(status || '')] || 'info'
}

const buildErrorFromNode = (node: any): SegmentError | undefined => {
  const message = node.errorMessage || node.error_message
  if (!message) return undefined
  return {
    message,
    code: node.errorCode || node.error_code || '-',
    reason: node.errorReason || node.error_reason || message,
    suggestion: node.errorSuggestion || node.error_suggestion || '\u8bf7\u68c0\u67e5\u8be5\u6bb5\u914d\u7f6e\u6216\u67e5\u770b\u540e\u7aef\u4efb\u52a1\u65e5\u5fd7',
  }
}

const normalizeSegmentDefaults = (seg: Segment): Segment => {
  const genConfigCount = Number(seg.genConfigCount || seg.genConfigs?.length || seg.generateTotal || 1)
  return {
    ...seg,
    taskPurpose: seg.type === 'generate' ? (seg.taskPurpose || 'new') : (seg.taskPurpose || 'direct'),
    genConfigCount: seg.type === 'generate' ? genConfigCount : (seg.genConfigCount || 0),
    generateTotal: seg.type === 'generate' ? Number(seg.generateTotal || genConfigCount || 1) : Number(seg.generateTotal || 0),
  }
}

const mapNodeToSegment = (node: any): Segment => {
  const role = node.nodeRole || node.node_role || 'splice'
  const generateRule = node.generateRuleJson || node.generate_rule_json || {}
  const spliceRule = node.spliceRuleJson || node.splice_rule_json || {}
  const folderId = node.folderId ?? node.folder_id
  const folderPath = node.folderPathSnapshot || node.folder_path_snapshot || ''
  const error = buildErrorFromNode(node)
  return normalizeSegmentDefaults({
    id: String(node.id ?? `seg-${Date.now()}-${node.nodeOrder || node.node_order || 0}`),
    type: role === 'generate' ? 'generate' : 'splice',
    index: Number(node.nodeOrder || node.node_order || 1),
    folderId,
    folderPath,
    savePath: folderPath,
    videoCount: Number(node.baseVideoCountSnapshot ?? node.base_video_count_snapshot ?? spliceRule.videoCount ?? spliceRule.video_count ?? 0),
    scriptCount: 1,
    scriptFixed: 1,
    generateTotal: Number(node.generateTotal ?? node.generate_total ?? generateRule.generateCount ?? generateRule.generate_count ?? generateRule.videoCount ?? generateRule.video_count ?? 0),
    generatedDone: Number(node.generatedDone ?? node.generated_done ?? 0),
    taskPurpose: apiUseModeToPurposeMap[node.generateUseMode || node.generate_use_mode || 'new_only'] ?? 'new',
    genChannel: generateRule.channel || generateRule.genChannel || generateRule.gen_channel || 'a2e',
    script: generateRule.script || generateRule.msg || generateRule.content || generateRule.configs?.[0]?.script || '',
    genConfigCount: Number(generateRule.generateCount ?? generateRule.generate_count ?? generateRule.videoCount ?? generateRule.video_count ?? generateRule.configCount ?? generateRule.config_count ?? (generateRule.configs?.length || 1)),
    genConfigs: Array.isArray(generateRule.configs)
      ? generateRule.configs.map((cfg: any, cfgIdx: number) => ({
          id: cfg.id || `cfg-${node.id || 'node'}-${cfgIdx}`,
          digitalHumanExternalId: cfg.digitalHumanExternalId || cfg.digitalHumanId || cfg.digital_human_external_id || cfg.digital_human_id || '',
          digitalHumanLocalId: cfg.digitalHumanLocalId || cfg.digital_human_local_id || '',
          digitalHuman: cfg.digitalHuman || cfg.digitalHumanExternalId || cfg.digitalHumanId || '',
          digitalHumanName: cfg.digitalHumanName || cfg.digital_human_name || '',
          voiceExternalId: cfg.voiceExternalId || cfg.voiceId || cfg.voice_external_id || cfg.voice_id || '',
          voiceLocalId: cfg.voiceLocalId || cfg.voice_local_id || '',
          voice: cfg.voice || cfg.voiceExternalId || cfg.voiceId || '',
          voiceName: cfg.voiceName || cfg.voice_name || '',
          relationId: cfg.relationId || cfg.relation_id || '',
          relationName: cfg.relationName || cfg.relation_name || '',
          coverUrl: cfg.coverUrl || cfg.cover_url || '',
          voiceUrl: cfg.voiceUrl || cfg.voice_url || '',
        }))
      : [],
    hasError: !!error,
    error,
  })
}

const mapSegmentToNodePayload = (seg: Segment, idx: number) => {
  const folder = folderList.value.find(f => String(f.id) === String(seg.folderId))
  const generateConfigs = (seg.genConfigs || []).map((cfg, cfgIdx) => ({
    id: cfg.id || `cfg-${idx}-${cfgIdx}`,
    seqNo: cfgIdx + 1,
    digitalHumanExternalId: cfg.digitalHumanExternalId || '',
    digitalHumanLocalId: cfg.digitalHumanLocalId || '',
    digitalHuman: cfg.digitalHuman || '',
    digitalHumanName: cfg.digitalHumanName || '',
    voiceExternalId: cfg.voiceExternalId || '',
    voiceLocalId: cfg.voiceLocalId || '',
    voice: cfg.voice || '',
    voiceName: cfg.voiceName || '',
    relationId: cfg.relationId || '',
    relationName: cfg.relationName || '',
    coverUrl: cfg.coverUrl || '',
    voiceUrl: cfg.voiceUrl || '',
    script: seg.script || '',
  }))
  const generateCount = seg.type === 'generate'
    ? Number(seg.genConfigCount || generateConfigs.length || seg.genCount || 1)
    : 0
  return {
    nodeOrder: idx + 1,
    nodeRole: seg.type,
    folderId: seg.folderId || null,
    folderNameSnapshot: folder?.name || '',
    folderPathSnapshot: folder?.path || seg.folderPath || seg.savePath || '',
    generateUseMode: taskPurposeToApiMap[seg.taskPurpose || 'new'] || 'new_only',
    generateRuleJson: seg.type === 'generate' ? {
      channel: seg.genChannel || 'a2e',
      scriptCount: 1,
      scriptFixed: 1,
      generateCount,
      videoCount: generateCount,
      script: seg.script || '',
      configs: generateConfigs,
    } : {},
    spliceRuleJson: seg.type === 'splice' ? {
      videoCount: seg.videoCount || folder?.videoCount || 0,
    } : {},
    sortNo: idx + 1,
  }
}

const mapTemplateFromApi = (item: any): Template => ({
  id: item.id,
  name: item.templateName || item.template_name || item.name || `\u6a21\u677f-${item.id}`,
  remark: item.remark || '',
  createTime: formatDateTime(item.createTime || item.create_time),
  segments: (item.nodes || []).map(mapNodeToSegment),
})

const getPlanSegmentsFromApi = (item: any): Segment[] => {
  const nodes = Array.isArray(item?.nodes) ? item.nodes : []
  if (nodes.length) return nodes.map(mapNodeToSegment)
  const templateId = item?.templateId ?? item?.template_id
  if (!templateId) return []
  const matchedTemplate = templateList.value.find(t => String(t.id) === String(templateId))
  return matchedTemplate
    ? JSON.parse(JSON.stringify(matchedTemplate.segments || [])).map((seg: Segment) => normalizeSegmentDefaults(seg))
    : []
}

const mapPlanFromApi = (item: any): Plan => ({
  id: item.id,
  name: item.planName || item.plan_name || item.name || `\u8ba1\u5212-${item.id}`,
  createTime: formatDateTime(item.createTime || item.create_time),
  startTime: formatDateTime(item.runTime || item.run_time),
  endTime: formatDateTime(item.endTime || item.end_time),
  status: item.planStatus || item.plan_status || 'draft',
  statusText: getPlanStatusText(item.planStatus || item.plan_status),
  multiplier: Number(item.multiplier || 1),
  priorityMode: item.priorityMode || item.priority_mode || 'first',
  templateId: item.templateId ?? item.template_id,
  outputFolderId: item.outputFolderId ?? item.output_folder_id,
  segments: getPlanSegmentsFromApi(item),
  batchNo: item.batchNo || item.batch_no || '',
  errorMessage: item.errorMessage || item.error_message || '',
  tasks: Array.isArray(item.tasks) ? item.tasks.map((task: any) => ({
    id: task.id,
    planNodeId: task.planNodeId ?? task.plan_node_id,
    taskType: task.taskType || task.task_type || '',
    taskStatus: task.taskStatus || task.task_status || 'pending',
    taskNo: task.taskNo || task.task_no || '',
    batchNo: task.batchNo || task.batch_no || '',
    outputFileId: task.outputFileId ?? task.output_file_id,
    outputFileUrl: task.outputFileUrl || task.output_file_url || '',
    outputFileName: task.outputFileName || task.output_file_name || '',
    outputPreviewUrl: task.outputPreviewUrl || task.output_preview_url || '',
    outputDuration: Number(task.outputDuration ?? task.output_duration ?? 0),
    outputFileSize: Number(task.outputFileSize ?? task.output_file_size ?? 0),
    errorMessage: task.errorMessage || task.error_message || '',
    createTime: formatDateTime(task.createTime || task.create_time),
    finishedAt: formatDateTime(task.finishedAt || task.finished_at),
    inputPayload: task.inputPayload || task.input_payload || {},
  })) : [],
  results: Array.isArray(item.results) ? item.results.map((result: any) => ({
    id: result.id,
    taskId: result.taskId ?? result.task_id,
    resultNo: Number(result.resultNo ?? result.result_no ?? 0),
    resultStatus: result.resultStatus || result.result_status || 'pending',
    outputFileId: result.outputFileId ?? result.output_file_id,
    outputUrl: result.outputUrl || result.output_url || '',
    outputFileName: result.outputFileName || result.output_file_name || '',
    outputPreviewUrl: result.outputPreviewUrl || result.output_preview_url || '',
    outputDuration: Number(result.outputDuration ?? result.output_duration ?? result.duration ?? 0),
    outputFileSize: Number(result.outputFileSize ?? result.output_file_size ?? 0),
    inputFileIds: result.inputFileIds || result.input_file_ids || [],
    inputFileUrls: result.inputFileUrls || result.input_file_urls || [],
    errorMessage: result.errorMessage || result.error_message || '',
    createTime: formatDateTime(result.createTime || result.create_time),
  })) : [],
})

const buildTemplatePayload = (tpl: Template) => ({
  id: typeof tpl.id === 'number' ? tpl.id : undefined,
  templateName: tpl.name,
  remark: tpl.remark || '',
  status: 'enabled',
  nodes: (tpl.segments || []).map(mapSegmentToNodePayload),
})

const buildPlanPayload = (plan: Plan) => ({
  id: typeof plan.id === 'number' ? plan.id : undefined,
  planName: plan.name,
  templateId: plan.templateId,
  multiplier: plan.multiplier || 1,
  priorityMode: plan.priorityMode || 'first',
  outputFolderId: plan.outputFolderId || plan.segments?.find(seg => seg.folderId)?.folderId || null,
  nodes: (plan.segments || []).map(mapSegmentToNodePayload),
})

// ===== Tab =====
const activeTab = ref('autoEdit')

// ===== 计划管理 =====
const planList = ref<Plan[]>([])

const planPage = ref(1)
const planPageSize = ref(10)
const planTotal = ref(0)
const currentPlan = ref<Plan | null>(null)
const showResultPage = ref(false)
const resultPanelRef = ref<HTMLElement | null>(null)

const currentGenerateTasks = computed(() =>
  (currentPlan.value?.tasks || [])
    .filter(task => task.taskType === 'generate')
    .sort((a, b) => Number(a.id) - Number(b.id)),
)

const getSegmentPlannedGenerateCount = (seg: Segment) => {
  const configCount = Number(seg.genConfigCount ?? seg.genConfigs?.length ?? 0)
  if (Number.isFinite(configCount) && configCount > 0) return configCount
  const totalCount = Number(seg.generateTotal ?? 0)
  if (Number.isFinite(totalCount) && totalCount > 0) return totalCount
  return 1
}

const getPlanGenerateTaskCount = (plan: Plan) => {
  const segments = plan.segments || []
  const total = segments.reduce((sum, seg) => {
    if (seg.type !== 'generate') return sum
    return sum + getSegmentPlannedGenerateCount(seg)
  }, 0)
  return total
}

const currentSpliceResults = computed(() =>
  (currentPlan.value?.results || [])
    .sort((a, b) => Number(a.resultNo || 0) - Number(b.resultNo || 0)),
)

const currentPlanSummary = computed(() => {
  const generateTasks = currentGenerateTasks.value
  const spliceResults = currentSpliceResults.value
  return {
    generateTotal: generateTasks.length,
    generateSuccess: generateTasks.filter(task => task.taskStatus === 'success').length,
    generateFailed: generateTasks.filter(task => task.taskStatus === 'failed').length,
    spliceTotal: spliceResults.length,
    spliceSuccess: spliceResults.filter(result => result.resultStatus === 'success').length,
    spliceFailed: spliceResults.filter(result => result.resultStatus === 'failed').length,
  }
})

const openResultVideo = (url?: string) => {
  if (!url) return ElMessage.warning('当前结果暂无可查看链接')
  window.open(url, '_blank')
}

const copyResultUrl = async (url?: string) => {
  if (!url) return ElMessage.warning('当前结果暂无链接')
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch (error) {
    console.error('copyResultUrl failed:', error)
    ElMessage.error('复制失败')
  }
}

const scrollToResultPanel = () => {
  nextTick(() => {
    if (showResultPage.value || !resultPanelRef.value) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    resultPanelRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const getPlanStatusType = (status: number | string) => {
  const map: Record<string, string> = {
    draft: '',
    running_generate: 'warning',
    waiting_splice: 'warning',
    running_splice: 'warning',
    completed: 'success',
    failed: 'danger',
    paused: 'info',
    '0': '',
    '1': 'warning',
    '2': 'success',
    '3': 'danger',
  }
  return map[String(status)] ?? ''
}

const getSegmentLabel = (idx: number) => String.fromCharCode(65 + idx) + '\u6bb5'

const getSegmentFormula = () => {
  if (!currentPlan.value?.segments?.length) return ''
  return currentPlan.value.segments
    .map((_, i) => `${getSegmentLabel(i)}\uff08\u586b\u5165\u6570\uff09`)
    .join(' * ') + ` * ${currentPlan.value.multiplier}\uff08*N\uff09`
}

const loadPlanList = async () => {
  try {
    const res = await request({
      url: '/api/material/workflow/concatenation/plan/paginate/',
      method: 'post',
      data: { page: planPage.value, pageSize: planPageSize.value, search: {} },
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    })
    const pageData = getResponseData(res) || {}
    planList.value = (pageData.data || []).map(mapPlanFromApi)
    planTotal.value = Number(pageData.total || 0)
    if (currentPlan.value) {
      const latest = planList.value.find(item => item.id === currentPlan.value?.id)
      if (latest) {
        currentPlan.value = {
          ...latest,
          segments: latest.segments?.length ? latest.segments : currentPlan.value.segments,
        }
      }
    }
  } catch (error) {
    console.error('loadPlanList failed:', error)
    ElMessage.error('\u52a0\u8f7d\u8ba1\u5212\u5217\u8868\u5931\u8d25')
  }
}

// 模板管理
interface TplSegment { id: string; type: 'generate' | 'splice' }

const templateList = ref<Template[]>([])

const currentTemplate = ref<Template | null>(null)
const templateDialog = reactive({ visible: false, isEdit: false, editId: null as number | string | null })
const templateForm = reactive({ name: '', remark: '' })

const handleAddTemplate = () => {
  templateDialog.isEdit = false
  templateDialog.editId = null
  templateForm.name = ''
  templateForm.remark = ''
  templateDialog.visible = true
}

const handleEditTemplate = (tpl: Template) => {
  templateDialog.isEdit = true
  templateDialog.editId = tpl.id
  templateForm.name = tpl.name
  templateForm.remark = tpl.remark ?? ''
  templateDialog.visible = true
}

const handleSelectTemplate = (tpl: Template) => {
  currentTemplate.value = JSON.parse(JSON.stringify(tpl))
}

const loadTemplateList = async () => {
  try {
    const res = await request({
      url: '/api/material/workflow/concatenation/template/paginate/',
      method: 'post',
      data: { page: 1, pageSize: 100, search: {} },
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    })
    const pageData = getResponseData(res) || {}
    templateList.value = (pageData.data || []).map(mapTemplateFromApi)
    if (currentTemplate.value) {
      const latest = templateList.value.find(item => item.id === currentTemplate.value?.id)
      if (latest) currentTemplate.value = JSON.parse(JSON.stringify(latest))
    }
  } catch (error) {
    console.error('loadTemplateList failed:', error)
    ElMessage.error('\u52a0\u8f7d\u6a21\u677f\u5217\u8868\u5931\u8d25')
  }
}

const handleDeleteTemplate = (tpl: Template) => {
  ElMessageBox.confirm(`\u786e\u5b9a\u5220\u9664\u6a21\u677f\u300c${tpl.name}\u300d\uff1f`, '\u63d0\u793a', { type: 'warning' })
    .then(async () => {
      await request({
        url: `/api/material/workflow/concatenation/template/delete/${tpl.id}/`,
        method: 'delete',
      })
      await loadTemplateList()
      if (currentTemplate.value?.id === tpl.id) currentTemplate.value = null
      ElMessage.success('\u5220\u9664\u6210\u529f')
    }).catch(() => {})
}

const saveTemplate = async (tpl: Template) => {
  const res = await request({
    url: '/api/material/workflow/concatenation/template/create/',
    method: 'post',
    data: buildTemplatePayload(tpl),
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  })
  const data = getResponseData(res) || {}
  if (data.id) tpl.id = data.id
  await loadTemplateList()
  const latest = templateList.value.find(item => item.id === (data.id || tpl.id))
  if (latest) currentTemplate.value = JSON.parse(JSON.stringify(latest))
  return data.id || tpl.id
}

const handleSaveTemplateConfig = async () => {
  if (!currentTemplate.value) return
  if (!currentTemplate.value.name.trim()) return ElMessage.warning('\u8bf7\u8f93\u5165\u6a21\u677f\u540d\u79f0')
  try {
    await saveTemplate(currentTemplate.value)
    ElMessage.success('\u6a21\u677f\u914d\u7f6e\u5df2\u4fdd\u5b58')
  } catch (error) {
    console.error('handleSaveTemplateConfig failed:', error)
    ElMessage.error('\u4fdd\u5b58\u6a21\u677f\u914d\u7f6e\u5931\u8d25')
  }
}

const submitTemplate = async () => {
  if (!templateForm.name.trim()) return ElMessage.warning('\u8bf7\u8f93\u5165\u6a21\u677f\u540d\u79f0')
  try {
    let tpl: Template
    if (templateDialog.isEdit && templateDialog.editId != null) {
      const exists = templateList.value.find(t => t.id === templateDialog.editId) || currentTemplate.value
      tpl = {
        id: templateDialog.editId,
        name: templateForm.name,
        remark: templateForm.remark,
        createTime: exists?.createTime || '',
        segments: exists?.segments || [],
      }
    } else {
      tpl = {
        id: `tpl-${Date.now()}`,
        name: templateForm.name,
        remark: templateForm.remark,
        createTime: new Date().toLocaleDateString('zh-CN'),
        segments: [],
      }
    }
    await saveTemplate(tpl)
    templateDialog.visible = false
    ElMessage.success('\u4fdd\u5b58\u6210\u529f')
  } catch (error) {
    console.error('submitTemplate failed:', error)
    ElMessage.error('\u4fdd\u5b58\u5931\u8d25')
  }
}

const addTplSegTypeDialog = reactive({ visible: false, type: 'generate' as 'generate' | 'splice', afterIdx: -1 })

const openAddTplSegDialog = (afterIdx: number, defaultType?: 'generate' | 'splice') => {
  if (!currentTemplate.value) return
  addTplSegTypeDialog.afterIdx = afterIdx
  addTplSegTypeDialog.type = defaultType ?? 'generate'
  confirmAddTplSegment()
}

const confirmAddTplSegment = () => {
  if (!currentTemplate.value) return
  const segs = currentTemplate.value.segments
  const newSeg: Segment = { id: `tpl-seg-${Date.now()}`, type: addTplSegTypeDialog.type, index: 0 }
  if (addTplSegTypeDialog.afterIdx === -1) segs.push(newSeg)
  else segs.splice(addTplSegTypeDialog.afterIdx + 1, 0, newSeg)
  reindexTplSegments()
}

const reindexTplSegments = () => {
  if (!currentTemplate.value) return
  let g = 1, s = 1
  currentTemplate.value.segments.forEach(seg => {
    if (seg.type === 'generate') seg.index = g++
    else seg.index = s++
  })
}

const handleDeleteTplSegment = (idx: number) => {
  if (!currentTemplate.value) return
  ElMessageBox.confirm('确定删除该段？', '提示', { type: 'warning' })
    .then(() => { currentTemplate.value!.segments.splice(idx, 1); reindexTplSegments(); ElMessage.success('删除成功') }).catch(() => {})
}

// 计划弹窗
const planDialog = reactive({ visible: false, isEdit: false, editId: null as number | string | null })
const planForm = reactive({ name: '', startTime: '', templateId: null as number | string | null })

const handleAddPlan = () => {
  planDialog.isEdit = false
  planDialog.editId = null
  planForm.name = ''
  planForm.startTime = ''
  planForm.templateId = null
  planDialog.visible = true
}

const handleEditPlan = (row: Plan) => {
  planDialog.isEdit = true
  planDialog.editId = row.id
  planForm.name = row.name
  planForm.startTime = row.startTime || ''
  planForm.templateId = row.templateId ?? null
  planDialog.visible = true
}

const handleDeletePlan = (row: Plan) => {
  ElMessageBox.confirm(`\u786e\u5b9a\u5220\u9664\u8ba1\u5212\u300c${row.name}\u300d\uff1f\u5220\u9664\u540e\u4e0d\u53ef\u6062\u590d`, '\u63d0\u793a', { type: 'warning' })
    .then(async () => {
      await request({
        url: `/api/material/workflow/concatenation/plan/delete/${row.id}/`,
        method: 'delete',
      })
      await loadPlanList()
      if (currentPlan.value?.id === row.id) currentPlan.value = null
      ElMessage.success('\u5220\u9664\u6210\u529f')
    }).catch(() => {})
}

const handleSelectPlan = async (row: Plan) => {
  try {
    const res = await request({
      url: `/api/material/workflow/concatenation/plan/${row.id}/`,
      method: 'get',
    })
    currentPlan.value = mapPlanFromApi(getResponseData(res) || row)
    showResultPage.value = false
  } catch (error) {
    console.error('handleSelectPlan failed:', error)
    currentPlan.value = row
    showResultPage.value = false
  }
}

const handleViewPlanResults = async (row: Plan) => {
  await handleSelectPlan(row)
  showResultPage.value = true
  scrollToResultPanel()
}

const saveCurrentPlanConfig = async () => {
  if (!currentPlan.value) throw new Error('\u8bf7\u5148\u9009\u62e9\u8ba1\u5212')
  const res = await request({
    url: '/api/material/workflow/concatenation/plan/create/',
    method: 'post',
    data: buildPlanPayload(currentPlan.value),
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  })
  const data = getResponseData(res) || {}
  if (data.id) {
    const detailRes = await request({
      url: `/api/material/workflow/concatenation/plan/${data.id}/`,
      method: 'get',
    })
    currentPlan.value = mapPlanFromApi(getResponseData(detailRes) || currentPlan.value)
  }
  return data.id || currentPlan.value.id
}

const submitPlan = async () => {
  if (!planForm.name.trim()) return ElMessage.warning('\u8bf7\u8f93\u5165\u4efb\u52a1\u540d\u79f0')
  if (!planForm.templateId && !planDialog.isEdit) return ElMessage.warning('\u8bf7\u9009\u62e9\u6846\u67b6\u6a21\u677f')
  try {
    if (planDialog.isEdit && planDialog.editId != null) {
      const plan = planList.value.find(p => p.id === planDialog.editId)
      if (plan) {
        plan.name = planForm.name
        plan.startTime = planForm.startTime
        plan.templateId = planForm.templateId ?? undefined
        currentPlan.value = plan
        await saveCurrentPlanConfig()
      }
    } else {
      const res = await request({
        url: '/api/material/workflow/concatenation/plan/create/',
        method: 'post',
        data: {
          planName: planForm.name,
          templateId: planForm.templateId,
          multiplier: 1,
          priorityMode: 'first',
        },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      })
      const id = getResponseData(res)?.id
      if (id) await handleSelectPlan({ id } as Plan)
    }
    await loadPlanList()
    planDialog.visible = false
    ElMessage.success('\u4fdd\u5b58\u6210\u529f')
  } catch (error) {
    console.error('submitPlan failed:', error)
    ElMessage.error('\u4fdd\u5b58\u5931\u8d25')
  }
}

// ===== 段落管理 =====
const addSegTypeDialog = reactive({
  visible: false,
  type: 'generate' as 'generate' | 'splice',
  afterIdx: -1,
})

const openAddSegDialog = (afterIdx: number, defaultType?: 'generate' | 'splice') => {
  if (!currentPlan.value) return
  addSegTypeDialog.afterIdx = afterIdx
  addSegTypeDialog.type = defaultType ?? 'generate'
  addSegTypeDialog.visible = true
}

const reindexSegments = () => {
  if (!currentPlan.value) return
  let genIdx = 1
  let spliceIdx = 1
  currentPlan.value.segments.forEach(s => {
    if (s.type === 'generate') s.index = genIdx++
    else s.index = spliceIdx++
  })
}

const confirmAddSegment = () => {
  if (!currentPlan.value) return
  const segs = currentPlan.value.segments
  const newSeg: Segment = {
    id: `seg-${Date.now()}`,
    type: addSegTypeDialog.type,
    index: 0,
    scriptCount: 1,
    scriptFixed: 1,
    generateTotal: 0,
    generatedDone: 0,
    savePath: '*/*/',
    taskPurpose: 'new',
    folderPath: '*/*/',
    videoCount: 0,
    genConfigCount: 1,
    genConfigs: [],
  }
  if (addSegTypeDialog.afterIdx === -1) {
    segs.push(newSeg)
  } else {
    segs.splice(addSegTypeDialog.afterIdx + 1, 0, newSeg)
  }
  reindexSegments()
  addSegTypeDialog.visible = false
  // 直接进入编辑
  const insertedIdx = addSegTypeDialog.afterIdx === -1 ? segs.length - 1 : addSegTypeDialog.afterIdx + 1
  handleEditSegment(segs[insertedIdx], insertedIdx)
}

const handleDeleteSegment = (idx: number) => {
  if (!currentPlan.value) return
  ElMessageBox.confirm('确定删除该段？', '提示', { type: 'warning' })
    .then(() => {
      currentPlan.value!.segments.splice(idx, 1)
      reindexSegments()
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const segDialog = reactive({
  visible: false,
  seg: null as Segment | null,
  idx: -1,
})

const handleEditSegment = (seg: Segment, idx: number) => {
  segDialog.seg = JSON.parse(JSON.stringify(seg))
  segDialog.idx = idx
  const folder = getFolderById(segDialog.seg?.folderId)
  if (folder && segDialog.seg) {
    if (segDialog.seg.type === 'generate') {
      segDialog.seg.savePath = folder.path
    } else {
      segDialog.seg.folderPath = folder.path
      segDialog.seg.videoCount = folder.videoCount
    }
  }
  if (segDialog.seg?.type === 'generate') {
    segDialog.seg.genConfigCount = Number(segDialog.seg.genConfigCount || segDialog.seg.genConfigs?.length || 1)
    syncGenConfigs()
  }
  segDialog.visible = true
}

const submitSegment = async () => {
  if (!currentPlan.value || segDialog.idx === -1 || !segDialog.seg) return
  if (!segDialog.seg.folderId) return ElMessage.warning('请选择文件夹')
  if (segDialog.seg.type === 'generate' && !segDialog.seg.script?.trim()) return ElMessage.warning('请填写生成段脚本内容')
  currentPlan.value.segments[segDialog.idx] = segDialog.seg
  try {
    await saveCurrentPlanConfig()
    segDialog.visible = false
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('submitSegment save failed:', error)
    ElMessage.error('保存失败')
  }
}

const getFolderById = (folderId?: number | string) => {
  if (!folderId) return undefined
  return folderList.value.find(f => String(f.id) === String(folderId))
}

const getFolderDisplayText = (folderId?: number | string, mode: 'generate' | 'splice' = 'splice') => {
  const folder = getFolderById(folderId)
  if (!folder) return ''
  return folder.name
}

const getGenerateStorageText = (seg: Segment) => {
  const folder = getFolderById(seg.folderId)
  return folder?.name || '未配置'
}

const getSegmentFolderPath = (seg: Segment) => {
  const folder = getFolderById(seg.folderId)
  return folder?.path || seg.folderPath || seg.savePath || ''
}

const handleFolderChange = (folderId: number | string) => {
  const folder = getFolderById(folderId)
  if (folder && segDialog.seg) {
    segDialog.seg.savePath = folder.path
  }
}

const handleSpliceFolderChange = (folderId: number | string) => {
  const folder = getFolderById(folderId)
  if (folder && segDialog.seg) {
    segDialog.seg.folderPath = folder.path
    segDialog.seg.videoCount = folder.videoCount
  }
}

const getFolderName = (folderId?: number | string) => {
  if (!folderId) return '未配置'
  return getFolderById(folderId)?.name ?? '未配置'
}

const handleCopyTemplate = () => {
  ElMessage.success('模板配置已复制')
}

const handleStartGenerate = () => {
  if (!currentPlan.value?.segments?.length) return ElMessage.warning('\u8bf7\u5148\u6dfb\u52a0\u6bb5\u843d')
  ElMessageBox.confirm('\u786e\u5b9a\u5f00\u59cb\u6267\u884c\u672c\u8ba1\u5212\u7684\u751f\u6210/\u62fc\u63a5\u4efb\u52a1\uff1f\u542f\u52a8\u524d\u4f1a\u5148\u4fdd\u5b58\u5f53\u524d\u6bb5\u843d\u914d\u7f6e\u3002', '\u786e\u8ba4', { type: 'info' })
    .then(async () => {
      try {
        const planId = await saveCurrentPlanConfig()
        await request({
          url: `/api/material/workflow/concatenation/plan/start/${planId}/`,
          method: 'post',
        })
        ElMessage.success('\u4efb\u52a1\u5df2\u63d0\u4ea4\uff0c\u8bf7\u7a0d\u5019...')
        await loadPlanList()
        if (currentPlan.value) await handleSelectPlan(currentPlan.value)
      } catch (error) {
        console.error('handleStartGenerate failed:', error)
        ElMessage.error('\u63d0\u4ea4\u4efb\u52a1\u5931\u8d25')
      }
    }).catch(() => {})
}

const copyErrorInfo = (seg: Segment) => {
  if (!seg.error) return
  const text = `错误：${seg.error.message}\n错误代码：${seg.error.code}\n错误原因：${seg.error.reason}\n建议：${seg.error.suggestion}`
  navigator.clipboard?.writeText(text).then(() => ElMessage.success('已复制'))
}

// ===== 批量生成配置 =====
const needsGenConfig = (seg: Segment | null) => {
  return seg?.type === 'generate' && (seg.taskPurpose === 'new' || seg.taskPurpose === 'all')
}

const syncGenConfigs = () => {
  if (!segDialog.seg) return
  const count = segDialog.seg.genConfigCount ?? 1
  const current = segDialog.seg.genConfigs ?? []
  while (current.length < count) {
    current.push({ id: `cfg-${Date.now()}-${current.length}` })
  }
  while (current.length > count) {
    current.pop()
  }
  segDialog.seg.genConfigs = current
}

const singleGenDialog = reactive({
  visible: false,
  cfgIdx: -1,
  form: {
    digitalHumanExternalId: '',
    digitalHumanLocalId: '',
    digitalHuman: '',
    digitalHumanName: '',
    voiceExternalId: '',
    voiceLocalId: '',
    voice: '',
    voiceName: '',
    relationId: '',
    relationName: '',
    coverUrl: '',
    voiceUrl: '',
  },
})

const scriptLibrary = ref<any[]>([])
const scriptHistory = ref<any[]>([])
const scriptSelector = reactive({
  visible: false,
  title: '从文案库导入',
  mode: 'library' as 'library' | 'history',
  search: '',
})

let currentPreviewAudio: HTMLAudioElement | null = null

const openSingleGenDialog = (cfgIdx: number) => {
  if (!segDialog.seg?.genConfigs) return
  const cfg = segDialog.seg.genConfigs[cfgIdx]
  singleGenDialog.cfgIdx = cfgIdx
  singleGenDialog.form.digitalHumanExternalId = cfg.digitalHumanExternalId || ''
  singleGenDialog.form.digitalHumanLocalId = String(cfg.digitalHumanLocalId || '')
  singleGenDialog.form.digitalHuman = cfg.digitalHuman || ''
  singleGenDialog.form.digitalHumanName = cfg.digitalHumanName || ''
  singleGenDialog.form.voiceExternalId = cfg.voiceExternalId || ''
  singleGenDialog.form.voiceLocalId = String(cfg.voiceLocalId || '')
  singleGenDialog.form.voice = cfg.voice || ''
  singleGenDialog.form.voiceName = cfg.voiceName || ''
  singleGenDialog.form.relationId = String(cfg.relationId || '')
  singleGenDialog.form.relationName = cfg.relationName || ''
  singleGenDialog.form.coverUrl = cfg.coverUrl || ''
  singleGenDialog.form.voiceUrl = cfg.voiceUrl || ''
  singleGenDialog.visible = true
}

const clearSegmentBinding = () => {
  singleGenDialog.form.relationId = ''
  singleGenDialog.form.relationName = ''
}

const saveSingleGenConfig = async () => {
  if (!segDialog.seg?.genConfigs || singleGenDialog.cfgIdx < 0) return
  if (!singleGenDialog.form.digitalHumanName) return ElMessage.warning('请选择数字人形象')
  if (!singleGenDialog.form.voiceName) return ElMessage.warning('请选择配音')
  const cfg = segDialog.seg.genConfigs[singleGenDialog.cfgIdx]
  Object.assign(cfg, { ...singleGenDialog.form })
  if (currentPlan.value && segDialog.idx > -1 && segDialog.seg) {
    currentPlan.value.segments[segDialog.idx] = JSON.parse(JSON.stringify(segDialog.seg))
  }
  try {
    await saveCurrentPlanConfig()
    singleGenDialog.visible = false
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('saveSingleGenConfig failed:', error)
    ElMessage.error('保存失败')
  }
}

const fetchScriptLibrary = async () => {
  try {
    const res = await getScriptPaginateList(1, 100)
    const data = getResponseData(res) || {}
    const list = data.data || data || []
    scriptLibrary.value = list.map((item: any) => ({
      id: item.scriptId || item.id,
      title: item.scriptTitle || item.title || '未命名文案',
      content: item.scriptContent || item.content || '',
      tags: Array.isArray(item.scriptTags)
        ? item.scriptTags
        : (item.scriptTags ? String(item.scriptTags).split('|').filter(Boolean) : []),
    }))
  } catch (error) {
    console.error('fetchScriptLibrary failed:', error)
    ElMessage.error('加载文案库失败')
  }
}

const fetchScriptHistory = async () => {
  try {
    const res = await getScriptHistoryList(1, 100)
    const data = getResponseData(res) || {}
    const list = data.data || data || []
    const seen = new Set()
    scriptHistory.value = list
      .filter((item: any) => {
        const key = item.taskId || item.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((item: any) => ({
        id: item.taskId || item.id,
        title: (item.taskContent || item.content || '').substring(0, 50) || '历史文案',
        content: item.taskContent || item.content || '',
        tags: Array.isArray(item.taskTags) ? item.taskTags : [],
      }))
  } catch (error) {
    console.error('fetchScriptHistory failed:', error)
    ElMessage.error('加载历史文案失败')
  }
}

const openScriptSelector = async (mode: 'library' | 'history') => {
  scriptSelector.mode = mode
  scriptSelector.title = mode === 'library' ? '从文案库导入' : '从历史文案导入'
  scriptSelector.search = ''
  if (mode === 'library') {
    await fetchScriptLibrary()
  } else {
    await fetchScriptHistory()
  }
  scriptSelector.visible = true
}

const allScriptTags = computed(() => {
  const source = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  const tags = new Set<string>()
  source.forEach((item: any) => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => tags.add(tag))
    }
  })
  return Array.from(tags)
})

const currentScripts = computed(() => {
  const source = scriptSelector.mode === 'library' ? scriptLibrary.value : scriptHistory.value
  const keyword = scriptSelector.search.trim().toLowerCase()
  if (!keyword) return source
  if (scriptSelector.mode === 'library') {
    return source.filter((item: any) => Array.isArray(item.tags) && item.tags.some((tag: string) => tag.toLowerCase().includes(keyword)))
  }
  return source.filter((item: any) =>
    String(item.title || '').toLowerCase().includes(keyword)
    || String(item.content || '').toLowerCase().includes(keyword)
    || (Array.isArray(item.tags) && item.tags.some((tag: string) => tag.toLowerCase().includes(keyword))),
  )
})

const selectScript = (script: any) => {
  if (!segDialog.seg) return
  segDialog.seg.script = script.content || ''
  scriptSelector.visible = false
  ElMessage.success('已导入文案')
}

const playVoice = (audioUrl?: string, voiceName: string = '') => {
  if (!audioUrl) {
    ElMessage.warning('当前配音没有可试听地址')
    return
  }
  try {
    if (currentPreviewAudio) {
      currentPreviewAudio.pause()
      currentPreviewAudio = null
    }
    currentPreviewAudio = new Audio(audioUrl)
    currentPreviewAudio.play()
    ElMessage.success(`正在试听：${voiceName || '配音'}`)
  } catch (error) {
    console.error('playVoice failed:', error)
    ElMessage.error('配音试听失败')
  }
}

// ===== 剪辑文件夹 - 产品树形结构 =====
const ROOT_PRODUCT_ID = 'material-root'
const accountProducts = ref<ClipProduct[]>([
  { id: ROOT_PRODUCT_ID, name: '媒体库剪辑文件夹', folders: [] },
])

// 所有文件夹的扁平化（用于 el-select 下拉 等），子文件夹也必须能被选中。
const flattenFolders = (folders: ClipFolder[]): ClipFolder[] =>
  folders.flatMap(folder => [folder, ...flattenFolders(folder.children || [])])

const folderList = computed(() =>
  accountProducts.value.flatMap(p => flattenFolders(p.folders))
)

const folderPickerTreeData = computed(() =>
  folderList.value.length
    ? accountProducts.value.flatMap(product =>
        (product.folders || []).map(folder => ({
          id: `picker-${folder.id}`,
          label: folder.name,
          folder,
          videoCount: folder.videoCount || 0,
          children: mapFolderTreeChildren(folder.children || []),
        })),
      )
    : []
)

function mapFolderTreeChildren(children: ClipFolder[]) {
  return children.map(folder => ({
    id: `picker-${folder.id}`,
    label: folder.name,
    folder,
    videoCount: folder.videoCount || 0,
    children: mapFolderTreeChildren(folder.children || []),
  }))
}

const folderPickerDialog = reactive({
  visible: false,
  target: 'generate' as 'generate' | 'splice',
  selectedFolder: null as ClipFolder | null,
})

const openFolderPicker = (target: 'generate' | 'splice') => {
  folderPickerDialog.target = target
  folderPickerDialog.selectedFolder = getFolderById(segDialog.seg?.folderId) || null
  folderPickerDialog.visible = true
}

const handleFolderPickerNodeClick = (data: any) => {
  folderPickerDialog.selectedFolder = data.folder || null
}

const confirmFolderPicker = () => {
  const folder = folderPickerDialog.selectedFolder
  if (!folder || !segDialog.seg) return
  segDialog.seg.folderId = folder.id
  if (folderPickerDialog.target === 'generate') {
    segDialog.seg.savePath = folder.path
  } else {
    segDialog.seg.folderPath = folder.path
    segDialog.seg.videoCount = folder.videoCount
  }
  folderPickerDialog.visible = false
}

const mapFolderFromApi = (item: any, parentDisplayPath = ''): ClipFolder => {
  const name = item.folderName || item.folder_name || `文件夹-${item.id}`
  const displayPath = `${parentDisplayPath}/${name}/`.replace(/\/+/g, '/')
  return {
    id: item.id,
    parentId: item.parentId ?? item.parent_id,
    name,
    path: displayPath,
    rawPath: item.folderPath || item.folder_path || '/',
    videoCount: Number(item.videoCount ?? item.video_count ?? 0),
    generatedCount: Number(item.generatedCount ?? item.generated_count ?? 0),
    size: item.size || '0 MB',
    updateTime: formatDateTime(item.updateTime || item.update_time || item.createTime || item.create_time),
    remark: item.remark || '',
    children: Array.isArray(item.children) ? item.children.map((child: any) => mapFolderFromApi(child, displayPath.replace(/\/$/, ''))) : [],
  }
}

const loadMaterialFolders = async () => {
  try {
    const res = await request({
      url: '/api/material/folder/tree/',
      method: 'get',
    })
    const data = Array.isArray(res?.data?.data) ? res.data.data : []
    const folders = data.map(item => mapFolderFromApi(item))
    accountProducts.value = [{
      id: ROOT_PRODUCT_ID,
      name: '媒体库剪辑文件夹',
      folders,
    }]
    if (!selectedProductId.value) selectedProductId.value = ROOT_PRODUCT_ID
  } catch (error) {
    console.error('loadMaterialFolders failed:', error)
    ElMessage.error('加载剪辑文件夹失败')
  }
}

const mapFolderToTreeNode = (folder: ClipFolder, productId: number | string): ClipTreeNode => ({
  id: `folder-${folder.id}`,
  label: folder.name,
  type: 'folder',
  productId,
  folderData: folder,
  children: (folder.children || []).map(child => mapFolderToTreeNode(child, productId)),
})

// 树形控件数据
const clipTreeData = computed<ClipTreeNode[]>(() => [
  {
    id: 'account-root',
    label: '我的账户',
    type: 'account',
    children: accountProducts.value.map(p => ({
      id: `product-${p.id}`,
      label: p.name,
      type: 'product' as const,
      productId: p.id,
      children: p.folders.map(f => mapFolderToTreeNode(f, p.id)),
    })),
  },
])

// 树形相关状态
const clipTreeRef = ref()
const treeSearch = ref('')
const selectedTreeNode = ref<ClipTreeNode | null>(null)
const selectedProductId = ref<number | string | null>(null)

watch(treeSearch, val => {
  clipTreeRef.value?.filter(val)
})

const filterTreeNode = (value: string, data: ClipTreeNode) => {
  if (!value) return true
  return data.label.includes(value)
}

const handleTreeNodeClick = (data: ClipTreeNode) => {
  selectedTreeNode.value = data
  if (data.type === 'product') {
    selectedProductId.value = data.productId ?? null
  } else if (data.type === 'folder' && data.folderData) {
    selectedProductId.value = data.productId ?? null
    handleViewFolder(data.folderData)
  } else if (data.type === 'account') {
    selectedProductId.value = null
  }
}

// 点击产品卡片跳到对应产品节点
const handleSelectProductById = (productId: number | string) => {
  const nodeId = `product-${productId}`
  clipTreeRef.value?.setCurrentKey(nodeId)
  const prod = accountProducts.value.find(p => p.id === productId)
  if (prod) {
    selectedTreeNode.value = {
      id: nodeId,
      label: prod.name,
      type: 'product',
      productId: prod.id,
      children: prod.folders.map(f => mapFolderToTreeNode(f, prod.id)),
    }
    selectedProductId.value = productId
  }
}

// 点击产品概览中的文件夹卡片
const handleSelectFolder = (folder: ClipFolder) => {
  const node = mapFolderToTreeNode(folder, selectedProductId.value || ROOT_PRODUCT_ID)
  selectedTreeNode.value = node
  clipTreeRef.value?.setCurrentKey(`folder-${folder.id}`)
  handleViewFolder(folder)
}

// 当前产品下的文件夹列表
const selectedProductFolders = computed(() => {
  if (!selectedTreeNode.value || selectedTreeNode.value.type !== 'product') return []
  const prod = accountProducts.value.find(p => p.id === selectedTreeNode.value!.productId)
  return prod?.folders ?? []
})

// 树形操作命令
const handleTreeCommand = (cmd: string) => {
  if (cmd === 'addProduct') {
    productDialog.isEdit = false
    productDialog.editId = null
    productForm.name = ''
    productForm.remark = ''
    productDialog.visible = true
  } else if (cmd === 'addFolder') {
    folderDialog.isEdit = false
    folderDialog.editId = null
    folderForm.name = ''
    folderForm.path = ''
    folderForm.remark = ''
    folderForm.productId = selectedProductId.value ?? (accountProducts.value[0]?.id ?? null)
    folderDialog.visible = true
  }
}

// 产品弹窗
const productDialog = reactive({ visible: false, isEdit: false, editId: null as number | string | null })
const productForm = reactive({ name: '', remark: '' })

const handleEditProduct = (node: ClipTreeNode) => {
  const prod = accountProducts.value.find(p => p.id === node.productId)
  if (!prod) return
  productDialog.isEdit = true
  productDialog.editId = prod.id
  productForm.name = prod.name
  productForm.remark = prod.remark ?? ''
  productDialog.visible = true
}

const handleDeleteProduct = (node: ClipTreeNode) => {
  const prod = accountProducts.value.find(p => p.id === node.productId)
  if (!prod) return
  ElMessageBox.confirm(`确定删除产品「${prod.name}」及其下所有文件夹记录？`, '提示', { type: 'warning' })
    .then(() => {
      const idx = accountProducts.value.findIndex(p => p.id === prod.id)
      if (idx > -1) accountProducts.value.splice(idx, 1)
      selectedTreeNode.value = null
      selectedProductId.value = null
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const submitProduct = () => {
  if (!productForm.name.trim()) return ElMessage.warning('请输入产品名称')
  if (productDialog.isEdit && productDialog.editId != null) {
    const prod = accountProducts.value.find(p => p.id === productDialog.editId)
    if (prod) { prod.name = productForm.name; prod.remark = productForm.remark }
    if (selectedTreeNode.value?.productId === productDialog.editId) {
      selectedTreeNode.value = { ...selectedTreeNode.value, label: productForm.name }
    }
  } else {
    accountProducts.value.push({ id: `p-${Date.now()}`, name: productForm.name, remark: productForm.remark, folders: [] })
  }
  productDialog.visible = false
  ElMessage.success('保存成功')
}

// 文件夹视频
const currentFolderVideos = ref<FolderVideo[]>([])
const folderSearch = ref('')
const folderVideoPage = ref(1)
const folderVideoPageSize = ref(10)
const folderVideoTotal = ref(0)
let folderSearchTimer: ReturnType<typeof setTimeout> | null = null

const currentViewingFolderId = ref<number | string | null>(null)

const loadCurrentFolderVideos = async () => {
  if (currentViewingFolderId.value == null) return
  try {
    const res = await request({
      url: '/api/material/file/list/',
      method: 'get',
      params: {
        folderId: currentViewingFolderId.value,
        page: folderVideoPage.value,
        pageSize: folderVideoPageSize.value,
        search: JSON.stringify({
          file_name: folderSearch.value.trim(),
        }),
      },
    })
    const payload = getResponseData(res) || {}
    const list = Array.isArray(payload?.list) ? payload.list : []
    currentFolderVideos.value = list.map((item: any) => ({
      id: item.id,
      name: item.fileName || item.file_name || `文件-${item.id}`,
      duration: formatVideoDuration(item.duration),
      size: formatFileSize(item.fileSize || item.file_size),
      createTime: formatDateTime(item.createTime || item.create_time || item.updateTime || item.update_time),
      fileUrl: item.fileUrl || item.file_url || '',
    }))
    folderVideoTotal.value = Number(payload?.total ?? currentFolderVideos.value.length)
    if (selectedTreeNode.value?.folderData) {
      selectedTreeNode.value.folderData.size = formatFileSize(payload?.totalSize ?? payload?.total_size)
    }
  } catch (error) {
    console.error('loadCurrentFolderVideos failed:', error)
    currentFolderVideos.value = []
    folderVideoTotal.value = 0
    ElMessage.error('加载文件夹视频失败')
  }
}

const handleViewFolder = async (folder: ClipFolder) => {
  if (!folder?.id) {
    currentFolderVideos.value = []
    folderVideoTotal.value = 0
    return ElMessage.warning('请先选择文件夹')
  }
  folderSearch.value = ''
  folderVideoPage.value = 1
  currentViewingFolderId.value = folder.id
  await loadCurrentFolderVideos()
}

const handleFolderPageSizeChange = () => {
  folderVideoPage.value = 1
  loadCurrentFolderVideos()
}

const syncingFolderId = ref<number | string | null>(null)

const handleSyncFolderVideos = async () => {
  const folder = selectedTreeNode.value?.folderData

  if (!folder?.id) {
    return ElMessage.warning('请先选择要同步的文件夹')
  }

  try {
    syncingFolderId.value = folder.id

    await syncWindowsShareFolder({
      folder_id: folder.id,
      folder_real_path: folder.rawPath || folder.path,
    })

    ElMessage.success('同步成功')

    await loadMaterialFolders()

    currentViewingFolderId.value = folder.id
    folderVideoPage.value = 1
    await loadCurrentFolderVideos()
  } catch (error) {
    console.error('sync folder failed:', error)
    ElMessage.error('同步失败')
  } finally {
    syncingFolderId.value = null
  }
}

watch(folderSearch, () => {
  if (folderSearchTimer) clearTimeout(folderSearchTimer)
  folderSearchTimer = setTimeout(() => {
    folderVideoPage.value = 1
    loadCurrentFolderVideos()
  }, 300)
})

// 文件夹弹窗
const folderDialog = reactive({ visible: false, isEdit: false, editId: null as number | string | null })
const folderForm = reactive({ name: '', path: '', remark: '', productId: null as number | string | null })

const handleAddFolder = () => {
  folderDialog.isEdit = false
  folderDialog.editId = null
  folderForm.name = ''
  folderForm.path = ''
  folderForm.remark = ''
  folderForm.productId = selectedProductId.value
  folderDialog.visible = true
}

const handleEditFolder = (folder: ClipFolder) => {
  folderDialog.isEdit = true
  folderDialog.editId = folder.id
  folderForm.name = folder.name
  folderForm.path = folder.path
  folderForm.remark = folder.remark ?? ''
  // 找到该文件夹所属产品
  const prod = accountProducts.value.find(p => p.folders.some(f => f.id === folder.id))
  folderForm.productId = prod?.id ?? null
  folderDialog.visible = true
}

const submitFolder = () => {
  if (!folderForm.productId) return ElMessage.warning('请选择所属产品')
  if (!folderForm.name.trim()) return ElMessage.warning('请输入文件夹名称')
  const doSubmit = async () => {
    if (folderDialog.isEdit && folderDialog.editId != null) {
      await request({
        url: '/api/material/folder/rename/',
        method: 'post',
        data: { id: folderDialog.editId, folderName: folderForm.name },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      })
    } else {
      await request({
        url: '/api/material/folder/create/',
        method: 'post',
        data: { parentId: 0, folderName: folderForm.name },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      })
    }
    await loadMaterialFolders()
    folderDialog.visible = false
    ElMessage.success('保存成功')
  }
  doSubmit().catch((error) => {
    console.error('submitFolder failed:', error)
    ElMessage.error('保存文件夹失败')
  })
}

// ===== 批量生成至文件夹 =====
const batchGenDialog = reactive({ visible: false, folder: null as ClipFolder | null })
const batchGenForm = reactive({ channel: '', digitalHuman: '', voice: '', count: 10, script: '' })

const handleBatchGenerateToFolder = (folder: ClipFolder) => {
  batchGenDialog.folder = folder
  batchGenForm.channel = ''
  batchGenForm.digitalHuman = ''
  batchGenForm.voice = ''
  batchGenForm.count = 10
  batchGenForm.script = ''
  batchGenDialog.visible = true
}

const submitBatchGenerate = () => {
  if (!batchGenForm.channel) return ElMessage.warning('请选择生成渠道')
  if (!batchGenForm.digitalHuman) return ElMessage.warning('请选择数字人形象')
  if (!batchGenForm.voice) return ElMessage.warning('请选择配音')
  if (!batchGenForm.script.trim()) return ElMessage.warning('请输入脚本内容')
  // TODO: 调用 API 提交批量生成任务
  ElMessage.success(`批量生成任务已提交，完成后将自动存入「${batchGenDialog.folder?.name}」`)
  batchGenDialog.visible = false
}

onMounted(async () => {
  loadMaterialFolders()
  await loadTemplateList()
  await loadPlanList()
  await Promise.all([loadHumanOptions(), loadVoiceOptions()])
})

const humanOptions = ref<SelectOptionItem[]>([])
const voiceOptions = ref<SelectOptionItem[]>([])
const bindingOptions = ref<SelectOptionItem[]>([])
const humanScrollRef = ref<HTMLElement | null>(null)
const voiceScrollRef = ref<HTMLElement | null>(null)

const humanSelectorDialog = reactive({
  visible: false,
  search: '',
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true,
  total: 0,
  allList: [] as SelectOptionItem[],
  displayList: [] as SelectOptionItem[],
})

const voiceSelectorDialog = reactive({
  visible: false,
  search: '',
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true,
  total: 0,
  allList: [] as SelectOptionItem[],
  displayList: [] as SelectOptionItem[],
})

const bindingSelectorDialog = reactive({
  visible: false,
  humanSearch: '',
  voiceSearch: '',
  page: 1,
  pageSize: 12,
  loading: false,
  hasMore: true,
  allList: [] as SelectOptionItem[],
  displayList: [] as SelectOptionItem[],
})

const resetHumanOptions = () => {
  humanSelectorDialog.page = 1
  humanSelectorDialog.hasMore = true
  humanSelectorDialog.allList = []
  humanSelectorDialog.displayList = []
}

const loadHumanOptions = async () => {
  if (humanSelectorDialog.loading || !humanSelectorDialog.hasMore) return
  try {
    humanSelectorDialog.loading = true
    const search: any = {}
    if (humanSelectorDialog.search) search.name = humanSelectorDialog.search
    const res = await getDigitalHumanPaginateList(humanSelectorDialog.page, humanSelectorDialog.pageSize, search)
    const pageData = getResponseData(res) || {}
    const list = pageData.data || []
    const newItems = list.map((item: any) => ({
      id: item.id || '',
      name: item.digitalHumanName || item.name || '未命名数字人',
      externalId: item.externalId || item.id || '',
      coverUrl: item.coverUrl || '',
      videoUrl: item.videoUrl || '',
    }))
    humanSelectorDialog.allList.push(...newItems)
    humanSelectorDialog.displayList = humanSelectorDialog.allList
    humanOptions.value = humanSelectorDialog.allList
    humanSelectorDialog.total = Number(pageData.total || humanSelectorDialog.total || 0)
    humanSelectorDialog.page += 1
    if (!newItems.length) {
      humanSelectorDialog.hasMore = false
    } else if (humanSelectorDialog.total > 0 && humanSelectorDialog.allList.length >= humanSelectorDialog.total) {
      humanSelectorDialog.hasMore = false
    }
    await nextTick()
    const scroller = humanScrollRef.value
    if (scroller && scroller.scrollHeight <= scroller.clientHeight + 8 && humanSelectorDialog.hasMore) {
      await loadHumanOptions()
    }
  } catch (error) {
    console.error('loadHumanOptions failed:', error)
    ElMessage.error('加载数字人形象失败')
  } finally {
    humanSelectorDialog.loading = false
  }
}

const reloadHumanOptions = async () => {
  resetHumanOptions()
  await loadHumanOptions()
}

const handleHumanScroll = (event: Event) => {
  const target = event.currentTarget as HTMLElement
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
    loadHumanOptions()
  }
}

const resetVoiceOptions = () => {
  voiceSelectorDialog.page = 1
  voiceSelectorDialog.hasMore = true
  voiceSelectorDialog.allList = []
  voiceSelectorDialog.displayList = []
}

const loadVoiceOptions = async () => {
  if (voiceSelectorDialog.loading || !voiceSelectorDialog.hasMore) return
  try {
    voiceSelectorDialog.loading = true
    const search: any = {}
    if (voiceSelectorDialog.search) search.name = voiceSelectorDialog.search
    const res = await getVoicePaginateList(voiceSelectorDialog.page, voiceSelectorDialog.pageSize, search)
    const pageData = getResponseData(res) || {}
    const list = pageData.data || []
    const newItems = list.map((item: any) => ({
      id: item.id || '',
      name: item.voiceName || item.name || '未命名配音',
      externalId: item.externalId || item.id || '',
      voiceUrl: item.url || item.audio || item.voiceUrl || item.voice_url || '',
    }))
    voiceSelectorDialog.allList.push(...newItems)
    voiceSelectorDialog.displayList = voiceSelectorDialog.allList
    voiceOptions.value = voiceSelectorDialog.allList
    voiceSelectorDialog.total = Number(pageData.total || voiceSelectorDialog.total || 0)
    voiceSelectorDialog.page += 1
    if (!newItems.length) {
      voiceSelectorDialog.hasMore = false
    } else if (voiceSelectorDialog.total > 0 && voiceSelectorDialog.allList.length >= voiceSelectorDialog.total) {
      voiceSelectorDialog.hasMore = false
    }
    await nextTick()
    const scroller = voiceScrollRef.value
    if (scroller && scroller.scrollHeight <= scroller.clientHeight + 8 && voiceSelectorDialog.hasMore) {
      await loadVoiceOptions()
    }
  } catch (error) {
    console.error('loadVoiceOptions failed:', error)
    ElMessage.error('加载配音失败')
  } finally {
    voiceSelectorDialog.loading = false
  }
}

const reloadVoiceOptions = async () => {
  resetVoiceOptions()
  await loadVoiceOptions()
}

const handleVoiceScroll = (event: Event) => {
  const target = event.currentTarget as HTMLElement
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
    loadVoiceOptions()
  }
}

const resetBindingOptions = () => {
  bindingSelectorDialog.page = 1
  bindingSelectorDialog.hasMore = true
  bindingSelectorDialog.allList = []
  bindingSelectorDialog.displayList = []
}

const loadBindingOptions = async () => {
  if (bindingSelectorDialog.loading || !bindingSelectorDialog.hasMore) return
  try {
    bindingSelectorDialog.loading = true
    const search: any = {}
    if (bindingSelectorDialog.humanSearch) search.digitalHumanName = bindingSelectorDialog.humanSearch
    if (bindingSelectorDialog.voiceSearch) search.voiceName = bindingSelectorDialog.voiceSearch
    const res = await getBindingList(bindingSelectorDialog.page, bindingSelectorDialog.pageSize, search)
    const pageData = getResponseData(res) || {}
    const list = pageData.data || []
    const newItems = list.map((item: any) => ({
      id: item.id,
      name: `${item.digitalHumanName || item.human || '-'} + ${item.voiceName || item.voice || '-'}`,
      digitalHumanName: item.digitalHumanName || item.human || '',
      voiceName: item.voiceName || item.voice || '',
      digitalHumanLocalId: item.digitalHumanId || '',
      voiceLocalId: item.voiceId || '',
      digitalHumanExternalId: item.digitalHumanExternalId || item.digitalHumanExternalId || '',
      voiceExternalId: item.voiceExternalId || item.voiceExternalId || '',
      coverUrl: item.digitalHumanCoverUrl || item.coverUrl || item.digitalHumanUrl || '',
      voiceUrl: item.voiceUrl || item.voice_url || item.url || item.audio || '',
    }))
    bindingSelectorDialog.allList.push(...newItems)
    bindingSelectorDialog.displayList = bindingSelectorDialog.allList
    bindingOptions.value = bindingSelectorDialog.allList
    bindingSelectorDialog.page += 1
    if (newItems.length < bindingSelectorDialog.pageSize) bindingSelectorDialog.hasMore = false
  } catch (error) {
    console.error('loadBindingOptions failed:', error)
    ElMessage.error('加载绑定关系失败')
  } finally {
    bindingSelectorDialog.loading = false
  }
}

const reloadBindingOptions = async () => {
  resetBindingOptions()
  await loadBindingOptions()
}

const handleBindingScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
    loadBindingOptions()
  }
}

const openHumanSelectorForSegment = async () => {
  humanSelectorDialog.visible = true
  await reloadHumanOptions()
}

const openVoiceSelectorForSegment = async () => {
  voiceSelectorDialog.visible = true
  await reloadVoiceOptions()
}

const openBindingSelectorForSegment = async () => {
  bindingSelectorDialog.visible = true
  await reloadBindingOptions()
}

const selectHumanForSegment = (item: SelectOptionItem) => {
  singleGenDialog.form.digitalHumanExternalId = String(item.externalId || '')
  singleGenDialog.form.digitalHumanLocalId = String((item as any).id || '')
  singleGenDialog.form.digitalHuman = String(item.externalId || item.name)
  singleGenDialog.form.digitalHumanName = item.name
  singleGenDialog.form.coverUrl = item.coverUrl || ''
  singleGenDialog.form.relationId = ''
  singleGenDialog.form.relationName = ''
  humanSelectorDialog.visible = false
}

const selectVoiceForSegment = (item: SelectOptionItem) => {
  singleGenDialog.form.voiceExternalId = String(item.externalId || '')
  singleGenDialog.form.voiceLocalId = String((item as any).id || '')
  singleGenDialog.form.voice = String(item.externalId || item.name)
  singleGenDialog.form.voiceName = item.name
  singleGenDialog.form.voiceUrl = item.voiceUrl || ''
  singleGenDialog.form.relationId = ''
  singleGenDialog.form.relationName = ''
  voiceSelectorDialog.visible = false
}

const selectBindingForSegment = (item: SelectOptionItem) => {
  singleGenDialog.form.relationId = String(item.id || '')
  singleGenDialog.form.relationName = item.name
  singleGenDialog.form.digitalHumanExternalId = String((item as any).digitalHumanExternalId || '')
  singleGenDialog.form.digitalHumanLocalId = String((item as any).digitalHumanLocalId || '')
  singleGenDialog.form.digitalHuman = String((item as any).digitalHumanExternalId || item.digitalHumanName || '')
  singleGenDialog.form.digitalHumanName = item.digitalHumanName || ''
  singleGenDialog.form.voiceExternalId = String((item as any).voiceExternalId || '')
  singleGenDialog.form.voiceLocalId = String((item as any).voiceLocalId || '')
  singleGenDialog.form.voice = String((item as any).voiceExternalId || item.voiceName || '')
  singleGenDialog.form.voiceName = item.voiceName || ''
  singleGenDialog.form.coverUrl = item.coverUrl || ''
  singleGenDialog.form.voiceUrl = item.voiceUrl || ''
  bindingSelectorDialog.visible = false
}
</script>

<style scoped>
.generate-batch-film :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.generate-batch-film :deep(.el-tabs__header) {
  margin: 0;
  background: #fff;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 0.75rem 0.75rem 0 0;
}
.generate-batch-film :deep(.el-tabs__content) {
  padding: 20px;
  background: transparent;
}
.generate-batch-film :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 16px;
  height: 46px;
  line-height: 46px;
}
</style>
