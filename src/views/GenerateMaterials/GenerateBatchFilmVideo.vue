<template>
  <div class="generate-batch-film p-6 bg-gray-50 min-h-full">

    <!-- 顶部标题 -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-800">批量/多段生成</h2>
        <p class="text-xs text-gray-400 mt-1">智能多段视频自动剪辑拼接，支持生成段与拼接段灵活组合</p>
      </div>
    </div>

    <!-- 主体 Tabs -->
    <el-tabs v-model="activeTab" class="rounded-xl overflow-hidden">
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
                <el-table-column label="计划名称" min-width="140" show-overflow-tooltip>
                  <template #default="scope">
                    <span
                      class="font-bold text-gray-700 cursor-pointer hover:text-blue-500 transition-colors"
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
                    <span class="text-gray-600 font-medium text-xs">{{ scope.row.segments?.length || 0 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right" align="center">
                  <template #default="scope">
                    <div class="flex items-center justify-center gap-1">
                      <el-button type="primary" size="small" class="!px-1.5 !text-[11px]" @click="handleSelectPlan(scope.row)">编辑模板</el-button>
                      <el-button size="small" class="!px-1.5 !text-[11px]" @click="handleEditPlan(scope.row)">编辑</el-button>
                      <el-button type="danger" size="small" plain class="!px-1.5 !text-[11px]" @click="handleDeletePlan(scope.row)">删除</el-button>
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
                  <span class="font-bold text-gray-800">框架模板</span>
                  <el-tag type="info" size="small" effect="plain">{{ currentPlan.name }}</el-tag>
                </div>

                <!-- 优先级模式 -->
                <el-select v-model="currentPlan.priorityMode" placeholder="首段优先" size="small" style="width: 130px">
                  <el-option label="首段优先" value="first" />
                  <el-option label="末段优先" value="last" />
                  <el-option label="均衡分配" value="balance" />
                  <el-option label="随机轮次" value="random" />
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
                      <span class="font-medium text-gray-800">{{ seg.scriptCount }}（先定{{ seg.scriptFixed }}）</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">配置预设数：</span>
                      <span class="text-yellow-500">***</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">生成总条数：</span>
                      <span>
                        <span class="text-gray-800">{{ seg.generateTotal ?? 'x' }}/</span>
                        <span class="text-green-500 text-[11px]">{{ seg.generatedDone ?? 'y' }}（已生成）</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-1">
                      <span class="text-gray-400 shrink-0">自动存储路径：</span>
                      <span class="text-gray-800 truncate text-right">{{ seg.savePath || '*/*/' }}</span>
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
                      <span class="text-gray-800 truncate text-right">{{ seg.folderPath || '*/*/' }}</span>
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
              <div class="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 self-center" style="min-height: 200px">
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

          <!-- 未选中计划时占位 -->
          <div
            v-if="!currentPlan"
            class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-3"
          >
            <el-icon class="text-5xl text-gray-300"><Document /></el-icon>
            <p class="text-sm text-gray-400">请先新建或点击计划名称，进入框架模板配置</p>
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
              <el-button size="small" @click="handleCopyTemplate">复制模板</el-button>
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
                          <el-dropdown-item @click.stop="handleDeleteFolder(folder)" class="!text-red-500">删除</el-dropdown-item>
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
                  <el-button size="small" @click="handleEditFolder(selectedTreeNode.folderData!)">编辑</el-button>
                  <el-button size="small" type="primary" @click="handleBatchGenerateToFolder(selectedTreeNode.folderData!)">
                    <el-icon class="mr-1"><VideoCamera /></el-icon>批量生成至此
                  </el-button>
                  <el-input v-model="folderSearch" placeholder="搜索视频..." size="small" style="width: 160px" clearable />
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
                  :data="filteredFolderVideos"
                  style="width: 100%"
                  size="small"
                  :header-cell-style="{ background: '#f8fafc', color: '#606266' }"
                >
                  <el-table-column label="预览" width="80" align="center">
                    <template #default="scope">
                      <div class="w-12 h-8 bg-gray-100 rounded overflow-hidden cursor-pointer mx-auto" @click="previewVideo(scope.row)">
                        <img v-if="scope.row.coverUrl" :src="scope.row.coverUrl" class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-[9px]">无预览</div>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="文件名" prop="name" min-width="200" show-overflow-tooltip />
                  <el-table-column label="时长" prop="duration" width="75" align="center">
                    <template #default="scope"><span class="text-xs">{{ scope.row.duration }}</span></template>
                  </el-table-column>
                  <el-table-column label="大小" prop="size" width="80" align="center">
                    <template #default="scope"><span class="text-xs">{{ scope.row.size }}</span></template>
                  </el-table-column>
                  <el-table-column label="来源" width="80" align="center">
                    <template #default="scope">
                      <el-tag :type="scope.row.source === 'generated' ? 'success' : 'info'" size="small" effect="light">
                        {{ scope.row.source === 'generated' ? '已生成' : '已上传' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="创建时间" prop="createTime" width="125" align="center">
                    <template #default="scope"><span class="text-xs text-gray-500">{{ scope.row.createTime }}</span></template>
                  </el-table-column>
                  <el-table-column label="操作" width="75" align="center" fixed="right">
                    <template #default="scope">
                      <el-button type="danger" size="small" plain @click="handleDeleteFolderVideo(scope.row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div v-if="!currentFolderVideos.length" class="py-10 text-center text-gray-400">
                  <el-icon class="text-4xl mb-2"><VideoPlay /></el-icon>
                  <p class="text-sm">该文件夹暂无视频，可通过「批量生成」或直接上传添加</p>
                </div>

                <div v-if="currentFolderVideos.length" class="flex justify-end mt-3">
                  <el-pagination
                    v-model:current-page="folderVideoPage"
                    v-model:page-size="folderVideoPageSize"
                    :total="folderVideoTotal"
                    layout="total, prev, pager, next"
                    background small
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

    <!-- 新建/编辑任务 -->
    <el-dialog
      :title="planDialog.isEdit ? '编辑任务' : '新建任务'"
      v-model="planDialog.visible"
      width="480px"
      append-to-body
    >
      <el-form :model="planForm" label-width="90px">
        <el-form-item label="任务名称" required>
          <el-input v-model="planForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="选择模板" required>
          <el-select v-model="planForm.templateId" placeholder="请选择框架模板" class="w-full">
            <el-option v-for="tpl in templateList" :key="tpl.id" :label="tpl.name" :value="tpl.id">
              <div class="flex items-center justify-between">
                <span>{{ tpl.name }}</span>
                <span class="text-gray-400 text-xs ml-3">{{ tpl.segments?.length || 0 }}个段</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
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
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="配置文案数" required>
                  <el-input-number v-model="segDialog.seg.scriptCount" :min="1" class="w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="先定文案数">
                  <el-input-number v-model="segDialog.seg.scriptFixed" :min="1" class="w-full" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="自动存储路径" required>
              <el-select
                v-model="segDialog.seg.folderId"
                placeholder="选择剪辑文件夹"
                class="w-full"
                @change="handleFolderChange"
              >
                <el-option v-for="f in folderList" :key="f.id" :label="f.name" :value="f.id">
                  <div class="flex items-center justify-between">
                    <span>{{ f.name }}</span>
                    <span class="text-gray-400 text-xs ml-3">{{ f.path }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="任务用途">
              <el-radio-group v-model="segDialog.seg.taskPurpose" size="small">
                <el-radio-button v-for="opt in taskPurposeOptions" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-radio-button>
              </el-radio-group>
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
                <span class="text-xs text-gray-400">每个可单独配置数字人形象、配音和脚本内容</span>
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
                      <span class="text-gray-400">脚本内容</span>
                      <span class="font-medium truncate" :class="cfg.script ? 'text-gray-700' : 'text-red-400'">{{ cfg.script ? cfg.script.substring(0, 15) + '...' : '未配置' }}</span>
                    </div>
                  </div>
                  <el-button size="small" type="primary" plain class="!text-xs flex-shrink-0" @click="openSingleGenDialog(ci)">编辑</el-button>
                </div>
                <div v-if="!segDialog.seg?.genConfigs?.length" class="py-6 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                  请先设置创建数量
                </div>
              </div>
            </div>
          </el-form>
        </template>

        <!-- 拼接段 -->
        <template v-else>
          <el-form :model="segDialog.seg" label-width="110px">
            <el-form-item label="剪辑文件夹" required>
              <el-select
                v-model="segDialog.seg.folderId"
                placeholder="选择剪辑文件夹"
                class="w-full"
                @change="handleSpliceFolderChange"
              >
                <el-option v-for="f in folderList" :key="f.id" :label="f.name" :value="f.id">
                  <div class="flex items-center justify-between">
                    <span>{{ f.name }}</span>
                    <span class="text-gray-400 text-xs ml-3">{{ f.path }}</span>
                  </div>
                </el-option>
              </el-select>
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
        <el-form-item label="存储路径" required>
          <el-input v-model="folderForm.path" placeholder="如：/videos/clip/my-folder/" />
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
                <el-option v-for="h in humanOptions" :key="h.value" :label="h.label" :value="h.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="配音选择" required>
              <el-select v-model="batchGenForm.voice" placeholder="选择配音" class="w-full" filterable>
                <el-option v-for="v in voiceOptions" :key="v.value" :label="v.label" :value="v.value" />
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
          配置该条视频的数字人形象、配音和脚本内容，与单条生成配置一致
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
            <el-select
              v-model="singleGenDialog.form.digitalHuman"
              placeholder="选择数字人形象"
              class="w-full"
              filterable
              @change="onSingleHumanChange"
            >
              <el-option v-for="h in humanOptions" :key="h.value" :label="h.label" :value="h.value">
                <div class="flex items-center gap-2">
                  <span>{{ h.label }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="text-[11px] text-gray-400 mt-1">{{ humanOptions.length }} 个可选形象</div>
          </el-form-item>

          <!-- 配音选择 -->
          <el-form-item label="配音选择" required>
            <el-select
              v-model="singleGenDialog.form.voice"
              placeholder="选择配音"
              class="w-full"
              filterable
              @change="onSingleVoiceChange"
            >
              <el-option v-for="v in voiceOptions" :key="v.value" :label="v.label" :value="v.value" />
            </el-select>
            <div class="text-[11px] text-gray-400 mt-1">{{ voiceOptions.length }} 个可选配音</div>
          </el-form-item>

          <!-- 快捷预设说明 -->
          <el-form-item label="快捷预设">
            <div class="flex gap-2 flex-wrap">
              <el-tag
                v-for="h in humanOptions.slice(0, 4)" :key="h.value"
                size="small" effect="plain"
                class="cursor-pointer hover:bg-blue-50"
                @click="singleGenDialog.form.digitalHuman = h.value; onSingleHumanChange(h.value)"
              >{{ h.label.split('（')[0] }}</el-tag>
            </div>
            <div class="text-[11px] text-gray-400 mt-1">点击快捷选择数字人</div>
          </el-form-item>

          <!-- 脚本内容 -->
          <el-form-item label="脚本内容" required>
            <el-input
              type="textarea"
              v-model="singleGenDialog.form.script"
              :rows="9"
              placeholder="请输入视频解说文案（建议 300-500 字以获得最佳生成效果）"
            />
            <div class="flex justify-between items-center mt-1 text-[11px] text-gray-400">
              <span>当前字数：<span class="text-blue-500 font-bold">{{ singleGenDialog.form.script.length }}</span> / 2000</span>
              <span>建议 300-500 字</span>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="singleGenDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSingleGenConfig">保存此条配置</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, VideoPlay, VideoPause, VideoCamera, Connection, Folder, FolderOpened,
  Document, DArrowRight, Tickets, MoreFilled, ArrowLeft, QuestionFilled, InfoFilled,
  Search, User,
} from '@element-plus/icons-vue'

// ===== 类型定义 =====
interface SegmentError {
  message: string
  code: string
  reason: string
  suggestion: string
}

interface GenConfig {
  id: string
  digitalHuman?: string
  digitalHumanName?: string
  voice?: string
  voiceName?: string
  script?: string
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
  status: number
  statusText: string
  multiplier: number
  priorityMode?: string
  templateId?: number | string
  segments: Segment[]
}

interface ClipFolder {
  id: number | string
  name: string
  path: string
  videoCount: number
  generatedCount: number
  size: string
  updateTime: string
  remark?: string
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
  coverUrl?: string
  duration?: string
  size?: string
  source: 'generated' | 'uploaded'
  createTime: string
}

// ===== 常量 =====
const taskPurposeOptions = [
  { label: '现有直接拼接', value: 'direct' },
  { label: '仅新生成拼接', value: 'new' },
  { label: '新+旧均拼接', value: 'all' },
]

// ===== Tab =====
const activeTab = ref('autoEdit')

// ===== 计划管理 =====
const planList = ref<Plan[]>([
  {
    id: 1,
    name: '双十一主推爆款计划',
    createTime: '2026-04-10',
    startTime: '2026-04-12 09:00:00',
    endTime: '2026-04-20 18:00:00',
    status: 1,
    statusText: '执行中',
    multiplier: 3,
    segments: [
      {
        id: 'seg-1', type: 'generate', index: 1,
        scriptCount: 3, scriptFixed: 1, generateTotal: 12, generatedDone: 9,
        savePath: '/videos/main/', folderId: 1, taskPurpose: 'new',
        genChannel: 'a2e', digitalHuman: 'human-a', voice: 'voice-a', genCount: 12,
        script: '这款产品专为忙碌的现代人设计，轻薄便携，续航超长，一次充电用一周。',
      },
      {
        id: 'seg-2', type: 'splice', index: 1,
        folderPath: '/videos/backup/', videoCount: 18, folderId: 2,
      },
      {
        id: 'seg-3', type: 'generate', index: 2,
        scriptCount: 2, scriptFixed: 1, generateTotal: 8, generatedDone: 8,
        savePath: '/videos/new-product/', folderId: 3, taskPurpose: 'all',
        genChannel: 'jichuang', digitalHuman: 'human-b', voice: 'voice-b', genCount: 8,
        script: '限时特惠，今天下单立减200元，还有精美礼品相送，数量有限先到先得！',
      },
      {
        id: 'seg-4', type: 'splice', index: 2,
        folderPath: '/videos/seasonal/', videoCount: 25, folderId: 4,
      },
      {
        id: 'seg-5', type: 'generate', index: 3,
        scriptCount: 1, scriptFixed: 1, generateTotal: 5, generatedDone: 3,
        savePath: '/videos/main/', folderId: 1, taskPurpose: 'direct',
        hasError: true, error: { message: '文件夹路径无效', code: 'ERR_PATH_404', reason: '指定路径 /videos/main/ 不存在或无访问权限', suggestion: '请检查路径配置是否正确，或联系管理员授权' },
      },
    ],
  },
  {
    id: 2,
    name: '日常带货-护肤品系列',
    createTime: '2026-04-08',
    startTime: '2026-04-09 10:00:00',
    endTime: '2026-04-15 22:00:00',
    status: 2,
    statusText: '已完成',
    multiplier: 2,
    segments: [
      {
        id: 'seg-2-1', type: 'generate', index: 1,
        scriptCount: 5, scriptFixed: 2, generateTotal: 20, generatedDone: 20,
        savePath: '/videos/skincare/', folderId: 5, taskPurpose: 'new',
        genChannel: 'a2e', digitalHuman: 'human-c', voice: 'voice-c', genCount: 20,
      },
      {
        id: 'seg-2-2', type: 'splice', index: 1,
        folderPath: '/videos/main/', videoCount: 45, folderId: 1,
      },
    ],
  },
  {
    id: 3,
    name: '新品发布-秋冬服装',
    createTime: '2026-04-15',
    startTime: '',
    endTime: '',
    status: 0,
    statusText: '待执行',
    multiplier: 4,
    segments: [
      {
        id: 'seg-3-1', type: 'generate', index: 1,
        scriptCount: 2, scriptFixed: 1, generateTotal: 0, generatedDone: 0,
        savePath: '/videos/fashion/', folderId: 6, taskPurpose: 'new',
      },
      {
        id: 'seg-3-2', type: 'splice', index: 1,
        folderPath: '/videos/backup/', videoCount: 18, folderId: 2,
      },
      {
        id: 'seg-3-3', type: 'generate', index: 2,
        scriptCount: 1, scriptFixed: 1, generateTotal: 0, generatedDone: 0,
        savePath: '/videos/seasonal/', folderId: 4, taskPurpose: 'all',
      },
    ],
  },
  {
    id: 4,
    name: '竞品对比-数码3C专场',
    createTime: '2026-04-18',
    startTime: '2026-04-19 08:30:00',
    endTime: '2026-04-25 20:00:00',
    status: 3,
    statusText: '已暂停',
    multiplier: 3,
    segments: [
      {
        id: 'seg-4-1', type: 'splice', index: 1,
        folderPath: '/videos/tech/', videoCount: 33, folderId: 7,
      },
      {
        id: 'seg-4-2', type: 'generate', index: 1,
        scriptCount: 4, scriptFixed: 2, generateTotal: 15, generatedDone: 6,
        savePath: '/videos/tech/', folderId: 7, taskPurpose: 'all',
        genChannel: 'a2e', digitalHuman: 'human-d', voice: 'voice-d', genCount: 15,
      },
    ],
  },
])

const planPage = ref(1)
const planPageSize = ref(10)
const planTotal = ref(4)
const currentPlan = ref<Plan | null>(null)

const getPlanStatusType = (status: number) => {
  const map: Record<number, string> = { 0: '', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] ?? ''
}

const getSegmentLabel = (idx: number) => String.fromCharCode(65 + idx) + '段'

const getSegmentFormula = () => {
  if (!currentPlan.value?.segments?.length) return ''
  return currentPlan.value.segments
    .map((_, i) => `${getSegmentLabel(i)}（填入数）`)
    .join(' * ') + ` * ${currentPlan.value.multiplier}（*N）`
}

const loadPlanList = () => {
  // TODO: 调用 API 拉取计划列表
}

// 模板管理
interface TplSegment { id: string; type: 'generate' | 'splice' }

const templateList = ref<Template[]>([
  { id: 1, name: '默认模板（生成+拼接）', remark: '生成段1+拼接段1组合', createTime: '2026-04-10', segments: [
    { id: 'tpl-1-1', type: 'generate', index: 1 },
    { id: 'tpl-1-2', type: 'splice', index: 1 },
  ] as Segment[] },
  { id: 2, name: '双生成夹拼接', remark: '生1拼1生2拼2组合', createTime: '2026-04-15', segments: [
    { id: 'tpl-2-1', type: 'generate', index: 1 },
    { id: 'tpl-2-2', type: 'splice', index: 1 },
    { id: 'tpl-2-3', type: 'generate', index: 2 },
    { id: 'tpl-2-4', type: 'splice', index: 2 },
  ] as Segment[] },
])

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
  currentTemplate.value = tpl
}

const handleDeleteTemplate = (tpl: Template) => {
  ElMessageBox.confirm(`确定删除模板「${tpl.name}」？`, '提示', { type: 'warning' })
    .then(() => {
      const idx = templateList.value.findIndex(t => t.id === tpl.id)
      if (idx > -1) templateList.value.splice(idx, 1)
      if (currentTemplate.value?.id === tpl.id) currentTemplate.value = null
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const submitTemplate = () => {
  if (!templateForm.name.trim()) return ElMessage.warning('请输入模板名称')
  if (templateDialog.isEdit && templateDialog.editId != null) {
    const tpl = templateList.value.find(t => t.id === templateDialog.editId)
    if (tpl) { tpl.name = templateForm.name; tpl.remark = templateForm.remark }
  } else {
    const newTpl: Template = {
      id: Date.now(), name: templateForm.name, remark: templateForm.remark,
      createTime: new Date().toLocaleDateString('zh-CN'), segments: [],
    }
    templateList.value.push(newTpl)
    currentTemplate.value = newTpl
  }
  templateDialog.visible = false
  ElMessage.success('保存成功')
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
  ElMessageBox.confirm(`确定删除计划「${row.name}」？删除后不可恢复`, '提示', { type: 'warning' })
    .then(() => {
      const idx = planList.value.findIndex(p => p.id === row.id)
      if (idx > -1) planList.value.splice(idx, 1)
      if (currentPlan.value?.id === row.id) currentPlan.value = null
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const handleSelectPlan = (row: Plan) => {
  currentPlan.value = row
}

const submitPlan = () => {
  if (!planForm.name.trim()) return ElMessage.warning('请输入任务名称')
  if (planDialog.isEdit && planDialog.editId != null) {
    const plan = planList.value.find(p => p.id === planDialog.editId)
    if (plan) {
      plan.name = planForm.name
      plan.startTime = planForm.startTime
      plan.templateId = planForm.templateId ?? undefined
    }
  } else {
    // 从模板复制段落
    const tpl = templateList.value.find(t => t.id === planForm.templateId)
    const newPlan: Plan = {
      id: Date.now(),
      name: planForm.name,
      createTime: new Date().toLocaleDateString('zh-CN'),
      startTime: planForm.startTime,
      endTime: '',
      status: 0,
      statusText: '待执行',
      multiplier: 3,
      priorityMode: 'first',
      templateId: planForm.templateId ?? undefined,
      segments: tpl ? JSON.parse(JSON.stringify(tpl.segments)).map((s: Segment, i: number) => ({ ...s, id: `seg-${Date.now()}-${i}` })) : [],
    }
    planList.value.unshift(newPlan)
    planTotal.value++
    currentPlan.value = newPlan
  }
  planDialog.visible = false
  ElMessage.success('保存成功')
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
  segDialog.visible = true
}

const submitSegment = () => {
  if (!currentPlan.value || segDialog.idx === -1 || !segDialog.seg) return
  currentPlan.value.segments[segDialog.idx] = segDialog.seg
  segDialog.visible = false
  ElMessage.success('保存成功')
}

const handleFolderChange = (folderId: number | string) => {
  const folder = folderList.value.find(f => f.id === folderId)
  if (folder && segDialog.seg) {
    segDialog.seg.savePath = folder.path
  }
}

const handleSpliceFolderChange = (folderId: number | string) => {
  const folder = folderList.value.find(f => f.id === folderId)
  if (folder && segDialog.seg) {
    segDialog.seg.folderPath = folder.path
    segDialog.seg.videoCount = folder.videoCount
  }
}

const getFolderName = (folderId?: number | string) => {
  if (!folderId) return '未配置'
  return folderList.value.find(f => f.id === folderId)?.name ?? '未配置'
}

const handleCopyTemplate = () => {
  ElMessage.success('模板配置已复制')
}

const handleStartGenerate = () => {
  if (!currentPlan.value?.segments?.length) return ElMessage.warning('请先添加段落')
  ElMessageBox.confirm('确定开始执行本计划的生成/拼接任务？', '确认', { type: 'info' })
    .then(() => {
      ElMessage.success('任务已提交，请稍候...')
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
    digitalHuman: '',
    digitalHumanName: '',
    voice: '',
    voiceName: '',
    script: '',
  },
})

const openSingleGenDialog = (cfgIdx: number) => {
  if (!segDialog.seg?.genConfigs) return
  const cfg = segDialog.seg.genConfigs[cfgIdx]
  singleGenDialog.cfgIdx = cfgIdx
  singleGenDialog.form.digitalHuman = cfg.digitalHuman || ''
  singleGenDialog.form.digitalHumanName = cfg.digitalHumanName || ''
  singleGenDialog.form.voice = cfg.voice || ''
  singleGenDialog.form.voiceName = cfg.voiceName || ''
  singleGenDialog.form.script = cfg.script || ''
  singleGenDialog.visible = true
}

const onSingleHumanChange = (val: string) => {
  const h = humanOptions.value.find(h => h.value === val)
  singleGenDialog.form.digitalHumanName = h?.label || val
}

const onSingleVoiceChange = (val: string) => {
  const v = voiceOptions.value.find(v => v.value === val)
  singleGenDialog.form.voiceName = v?.label || val
}

const saveSingleGenConfig = () => {
  if (!segDialog.seg?.genConfigs || singleGenDialog.cfgIdx < 0) return
  const cfg = segDialog.seg.genConfigs[singleGenDialog.cfgIdx]
  Object.assign(cfg, { ...singleGenDialog.form })
  singleGenDialog.visible = false
  ElMessage.success('保存成功')
}

// ===== 假视频数据映射（按文件夹ID） =====
const mockVideosByFolder: Record<number | string, FolderVideo[]> = {
  1: [
    { id: 'v1-1', name: 'main_001_爆款开场白_张雯.mp4', duration: '0:32', size: '128 MB', source: 'generated', createTime: '2026-04-12 10:23' },
    { id: 'v1-2', name: 'main_002_产品展示_李明.mp4', duration: '0:45', size: '213 MB', source: 'generated', createTime: '2026-04-12 11:05' },
    { id: 'v1-3', name: 'main_003_价格对比_张雯.mp4', duration: '0:28', size: '98 MB', source: 'generated', createTime: '2026-04-13 09:12' },
    { id: 'v1-4', name: 'main_004_用户评价合集.mp4', duration: '1:10', size: '356 MB', source: 'uploaded', createTime: '2026-04-10 14:30' },
    { id: 'v1-5', name: 'main_005_促销倒计时_李明.mp4', duration: '0:15', size: '54 MB', source: 'generated', createTime: '2026-04-13 16:40' },
    { id: 'v1-6', name: 'main_006_功能演示.mp4', duration: '2:05', size: '512 MB', source: 'uploaded', createTime: '2026-04-09 11:20' },
    { id: 'v1-7', name: 'main_007_开箱体验_张雯.mp4', duration: '0:55', size: '267 MB', source: 'generated', createTime: '2026-04-14 08:55' },
    { id: 'v1-8', name: 'main_008_品牌背书.mp4', duration: '0:20', size: '72 MB', source: 'uploaded', createTime: '2026-04-11 17:00' },
  ],
  2: [
    { id: 'v2-1', name: 'backup_001_备用开场.mp4', duration: '0:18', size: '65 MB', source: 'uploaded', createTime: '2026-04-05 09:30' },
    { id: 'v2-2', name: 'backup_002_产品特写_王芳.mp4', duration: '0:30', size: '115 MB', source: 'generated', createTime: '2026-04-06 14:20' },
    { id: 'v2-3', name: 'backup_003_场景演示.mp4', duration: '1:20', size: '398 MB', source: 'uploaded', createTime: '2026-04-04 10:10' },
    { id: 'v2-4', name: 'backup_004_限时优惠_王芳.mp4', duration: '0:22', size: '80 MB', source: 'generated', createTime: '2026-04-07 15:45' },
    { id: 'v2-5', name: 'backup_005_品质保障.mp4', duration: '0:40', size: '185 MB', source: 'uploaded', createTime: '2026-04-03 11:00' },
  ],
  3: [
    { id: 'v3-1', name: 'newprod_001_新品亮相_陈晨.mp4', duration: '0:35', size: '142 MB', source: 'generated', createTime: '2026-04-01 10:00' },
    { id: 'v3-2', name: 'newprod_002_技术解析.mp4', duration: '1:45', size: '480 MB', source: 'uploaded', createTime: '2026-03-30 14:00' },
    { id: 'v3-3', name: 'newprod_003_上市预热_陈晨.mp4', duration: '0:28', size: '96 MB', source: 'generated', createTime: '2026-04-02 09:30' },
  ],
  4: [
    { id: 'v4-1', name: 'seasonal_001_春季上新.mp4', duration: '0:42', size: '198 MB', source: 'uploaded', createTime: '2026-03-25 10:00' },
    { id: 'v4-2', name: 'seasonal_002_换季推荐_刘倩.mp4', duration: '0:33', size: '134 MB', source: 'generated', createTime: '2026-03-26 11:30' },
    { id: 'v4-3', name: 'seasonal_003_清仓特卖.mp4', duration: '0:25', size: '89 MB', source: 'uploaded', createTime: '2026-03-28 15:00' },
  ],
  5: [
    { id: 'v5-1', name: 'skincare_001_成分讲解_孙丽.mp4', duration: '1:00', size: '290 MB', source: 'generated', createTime: '2026-04-09 10:30' },
    { id: 'v5-2', name: 'skincare_002_使用教程_孙丽.mp4', duration: '1:30', size: '420 MB', source: 'generated', createTime: '2026-04-09 12:00' },
    { id: 'v5-3', name: 'skincare_003_效果对比.mp4', duration: '0:50', size: '230 MB', source: 'uploaded', createTime: '2026-04-08 16:00' },
    { id: 'v5-4', name: 'skincare_004_明星同款_孙丽.mp4', duration: '0:38', size: '162 MB', source: 'generated', createTime: '2026-04-10 09:00' },
  ],
  6: [],
  7: [
    { id: 'v7-1', name: 'tech_001_参数对比_赵强.mp4', duration: '2:10', size: '620 MB', source: 'generated', createTime: '2026-04-19 08:45' },
    { id: 'v7-2', name: 'tech_002_实测跑分.mp4', duration: '3:00', size: '890 MB', source: 'uploaded', createTime: '2026-04-18 17:00' },
    { id: 'v7-3', name: 'tech_003_颜值展示_赵强.mp4', duration: '0:45', size: '215 MB', source: 'generated', createTime: '2026-04-19 10:20' },
  ],
}

// ===== 剪辑文件夹 - 产品树形结构 =====
const accountProducts = ref<ClipProduct[]>([
  {
    id: 'p1', name: '熊宝堂',
    folders: [
      { id: 1, name: '主力素材库', path: '/videos/xiongbao/main/', videoCount: 45, generatedCount: 32, size: '12.3 GB', updateTime: '2026-04-14' },
      { id: 2, name: '备用素材库', path: '/videos/xiongbao/backup/', videoCount: 18, generatedCount: 10, size: '5.1 GB', updateTime: '2026-04-07' },
      { id: 3, name: '新品推广-Q2', path: '/videos/xiongbao/new-product/', videoCount: 8, generatedCount: 8, size: '2.3 GB', updateTime: '2026-04-02' },
    ],
  },
  {
    id: 'p2', name: '龙牙',
    folders: [
      { id: 4, name: '换季专题素材', path: '/videos/longya/seasonal/', videoCount: 25, generatedCount: 12, size: '6.8 GB', updateTime: '2026-03-28' },
      { id: 5, name: '护肤品系列', path: '/videos/longya/skincare/', videoCount: 20, generatedCount: 20, size: '7.2 GB', updateTime: '2026-04-10' },
    ],
  },
  {
    id: 'p3', name: '秋冬时尚',
    folders: [
      { id: 6, name: '秋冬服装新品', path: '/videos/fashion/new/', videoCount: 0, generatedCount: 0, size: '0 MB', updateTime: '2026-04-15' },
      { id: 7, name: '数码3C专场', path: '/videos/fashion/tech/', videoCount: 33, generatedCount: 6, size: '9.5 GB', updateTime: '2026-04-19' },
    ],
  },
])

// 所有文件夹的扁平化（用于 el-select 下拉 等）
const folderList = computed(() =>
  accountProducts.value.flatMap(p => p.folders)
)

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
      children: p.folders.map(f => ({
        id: `folder-${f.id}`,
        label: f.name,
        type: 'folder' as const,
        productId: p.id,
        folderData: f,
        children: [],
      })),
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
      children: prod.folders.map(f => ({ id: `folder-${f.id}`, label: f.name, type: 'folder', folderData: f, children: [] })),
    }
    selectedProductId.value = productId
  }
}

// 点击产品概览中的文件夹卡片
const handleSelectFolder = (folder: ClipFolder) => {
  const node: ClipTreeNode = { id: `folder-${folder.id}`, label: folder.name, type: 'folder', folderData: folder, children: [] }
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

const filteredFolderVideos = computed(() => {
  if (!folderSearch.value) return currentFolderVideos.value
  return currentFolderVideos.value.filter(v => v.name.includes(folderSearch.value))
})

const handleViewFolder = (folder: ClipFolder) => {
  folderSearch.value = ''
  currentFolderVideos.value = mockVideosByFolder[folder.id] ?? []
  folderVideoTotal.value = currentFolderVideos.value.length
}

const previewVideo = (_video: FolderVideo) => {
  // TODO: 视频预览弹窗
}

const handleDeleteFolderVideo = (video: FolderVideo) => {
  ElMessageBox.confirm(`确定删除视频「${video.name}」？`, '提示', { type: 'warning' })
    .then(() => {
      const idx = currentFolderVideos.value.findIndex(v => v.id === video.id)
      if (idx > -1) currentFolderVideos.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }).catch(() => {})
}

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

const handleDeleteFolder = (folder: ClipFolder) => {
  ElMessageBox.confirm(`确定删除文件夹「${folder.name}」？此操作不会删除实际文件`, '提示', { type: 'warning' })
    .then(() => {
      for (const prod of accountProducts.value) {
        const idx = prod.folders.findIndex(f => f.id === folder.id)
        if (idx > -1) { prod.folders.splice(idx, 1); break }
      }
      if (selectedTreeNode.value?.folderData?.id === folder.id) selectedTreeNode.value = null
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const submitFolder = () => {
  if (!folderForm.productId) return ElMessage.warning('请选择所属产品')
  if (!folderForm.name.trim()) return ElMessage.warning('请输入文件夹名称')
  if (!folderForm.path.trim()) return ElMessage.warning('请输入存储路径')
  const prod = accountProducts.value.find(p => p.id === folderForm.productId)
  if (!prod) return ElMessage.warning('找不到对应产品')
  if (folderDialog.isEdit && folderDialog.editId != null) {
    const folder = prod.folders.find(f => f.id === folderDialog.editId) ??
      accountProducts.value.flatMap(p => p.folders).find(f => f.id === folderDialog.editId)
    if (folder) { folder.name = folderForm.name; folder.path = folderForm.path; folder.remark = folderForm.remark }
  } else {
    prod.folders.push({
      id: Date.now(),
      name: folderForm.name,
      path: folderForm.path,
      videoCount: 0,
      generatedCount: 0,
      size: '0 MB',
      updateTime: new Date().toLocaleDateString('zh-CN'),
      remark: folderForm.remark,
    })
  }
  folderDialog.visible = false
  ElMessage.success('保存成功')
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

// ===== 选项数据（TODO: 从 API 获取）=====
const humanOptions = ref([
  { label: '张雯（女·职场风）', value: 'human-a' },
  { label: '李明（男·沉稳型）', value: 'human-b' },
  { label: '王芳（女·亲和力）', value: 'human-c' },
  { label: '陈晨（男·年轻活力）', value: 'human-d' },
  { label: '孙丽（女·专业感）', value: 'human-e' },
  { label: '赵强（男·科技风）', value: 'human-f' },
  { label: '刘倩（女·时尚感）', value: 'human-g' },
])

const voiceOptions = ref([
  { label: '晓晓（普通话·女·温柔）', value: 'voice-a' },
  { label: '云扬（普通话·男·沉稳）', value: 'voice-b' },
  { label: '云希（普通话·女·活泼）', value: 'voice-c' },
  { label: '云健（普通话·男·磁性）', value: 'voice-d' },
  { label: '晓梦（粤语·女）', value: 'voice-e' },
  { label: '云龙（粤语·男）', value: 'voice-f' },
  { label: '晓秋（普通话·女·播音腔）', value: 'voice-g' },
])
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
