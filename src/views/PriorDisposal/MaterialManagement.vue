<template>
  <div class="material-management-container">
    <el-tabs v-model="activeName" class="custom-tabs">
      <!-- 声音管理 -->
      <el-tab-pane label="声音管理" name="voice">
        <div class="p-4 bg-white rounded-b-lg">
          <div class="filter-header mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-input 
                v-model="searchVoice" 
                placeholder="输入声音名称搜索" 
                size="default" 
                style="width: 260px" 
                clearable 
                prefix-icon="ElIconSearch"
                @change="fetchData"
              />
              <!-- <el-input v-model="filterVoiceTag" placeholder="输入标签关键字" size="default" style="width: 220px" clearable @change="fetchData" /> -->
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetVoiceSearch">重置条件</el-button>
              <el-button type="primary" size="default" icon="ElIconSearch" @click="fetchData">查询素材</el-button>
            </div>
          </div>

          <el-table :data="paginatedVoices" stripe border :header-cell-style="{background:'#f8f9fb', color:'#606266'}">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (voicePage.currentPage - 1) * voicePage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="voiceName" label="声音名称" min-width="120" show-overflow-tooltip>
              <template #default="scope">
                <span class="font-medium text-blue-600">{{ scope.row.voiceName }}</span>
              </template>
            </el-table-column>
            <!-- <el-table-column label="标签" min-width="150">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <span v-if="splitTags(scope.row.title).length === 0" class="text-gray-400 text-xs">暂无标签</span>
                  <el-tag v-for="tag in splitTags(scope.row.title)" :key="tag" size="mini" effect="plain" type="info">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column> -->
            <el-table-column label="试听" width="80" align="center">
              <template #default="scope">
                <el-button size="small" type="primary" icon="ElIconVideoPlay" @click="playVoice(scope.row)" circle />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="录入日期" width="160" align="center" />
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <div class="flex items-center justify-center gap-2">
                  <el-button type="primary" plain size="mini" @click="handleEdit(scope.row)">
                    <el-icon class="mr-1"><ElIconEdit /></el-icon>编辑
                  </el-button>
                  <el-button type="danger" plain size="mini" @click="handleDelete(scope.row)">
                    <el-icon class="mr-1"><ElIconDelete /></el-icon>删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="voicePage.currentPage"
              v-model:page-size="voicePage.pageSize"
              :total="voicesTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 鏁板瓧浜虹鐞?-->
      <el-tab-pane label="数字人管理" name="digitalHuman">
        <div class="p-4 bg-white rounded-b-lg">
          <div class="filter-header mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-input 
                v-model="searchDH" 
                placeholder="输入数字人名称搜索" 
                size="default" 
                style="width: 260px" 
                clearable 
                prefix-icon="ElIconSearch"
                @change="fetchData"
              />
              <!-- <el-input v-model="filterDHTag" placeholder="输入标签关键字" size="default" style="width: 220px" clearable @change="activeName === 'digitalHuman' ? fetchDigitalHumans() : fetchData()" /> -->
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetDHSearch">重置条件</el-button>
              <el-button type="primary" size="default" icon="ElIconSearch" @click="fetchDigitalHumans()">查询素材</el-button>
            </div>
          </div>

          <el-table :data="paginatedDigitalHumans" stripe border :header-cell-style="{background:'#f8f9fb', color:'#606266'}">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (dhPage.currentPage - 1) * dhPage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="预览" width="100" align="center">
              <template #default="scope">
                <el-avatar :size="50" shape="square" :src="scope.row.coverUrl" />
              </template>
            </el-table-column>
            <el-table-column prop="digitalHumanName" label="名称" min-width="120" />
            <!-- <el-table-column label="个性标签" min-width="150">
              <template #default="scope">
                <div class="flex flex-wrap gap-1">
                  <span v-if="!scope.row.title" class="text-gray-400 text-xs">暂无标签</span>
                  <el-tag v-for="tag in splitTags(scope.row.title)" :key="tag" size="mini" effect="plain" type="success">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column> -->
            <el-table-column prop="createTime" label="录入日期" width="160" align="center" />
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="scope">
                <div class="flex items-center justify-center gap-2">
                  <el-button v-if="scope.row.canManage !== false" type="primary" plain size="mini" @click="handleEdit(scope.row)">
                    <el-icon class="mr-1"><ElIconEdit /></el-icon>编辑
                  </el-button>
                  <el-button v-if="scope.row.canManage !== false" type="danger" plain size="mini" @click="handleDelete(scope.row)">
                    <el-icon class="mr-1"><ElIconDelete /></el-icon>删除
                  </el-button>
                  <el-tag v-if="scope.row.canManage === false" type="info" effect="plain" size="small">团队共享</el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="dhPage.currentPage"
              v-model:page-size="dhPage.pageSize"
              :total="digitalHumansTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 关系管理 -->
      <el-tab-pane label="关系管理" name="relation">
        <div class="p-4 bg-white rounded-b-lg">
          <div class="filter-header mb-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex items-center gap-4">
              <el-input
                v-model="searchRelVoice"
                placeholder="输入声音名称搜索"
                size="default"
                style="width: 220px"
                clearable
                prefix-icon="ElIconSearch"
              />
              <el-input
                v-model="searchRelDH"
                placeholder="输入数字人名称搜索"
                size="default"
                style="width: 220px"
                clearable
                prefix-icon="ElIconSearch"
              />
              <el-input
                v-model="searchRelTag"
                placeholder="输入标签搜索"
                size="default"
                style="width: 220px"
                clearable
                prefix-icon="ElIconSearch"
              />
            </div>
            <div class="flex items-center gap-3">
              <el-button size="default" @click="resetRelSearch">重置条件</el-button>
              <el-button type="primary" size="default" icon="ElIconSearch" @click="fetchRelations">查询关系</el-button>
              <el-button type="primary" icon="ElIconPlus" size="default" @click="openAddRelDialog">批量建立关系</el-button>
            </div>
          </div>
          <el-table :data="paginatedRelations" border stripe :header-cell-style="{background:'#f8f9fb', color:'#606266'}">
            <el-table-column label="序号" width="70" align="center">
              <template #default="scope">
                {{ (relPage.currentPage - 1) * relPage.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="绑定详情" min-width="300" align="center">
              <template #default="scope">
                <div class="flex items-center justify-center">
                  <span class="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-l-md border border-blue-200 border-r-0 text-xs">{{ scope.row.voiceName }}</span>
                  <div class="flex items-center justify-center w-6 h-6 bg-white border border-gray-200 z-10 -ml-px -mr-px rounded-full shadow-sm">
                    <el-icon class="text-gray-400 text-[10px]"><ElIconConnection /></el-icon>
                  </div>
                  <span class="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-r-md border border-green-200 border-l-0 text-xs">{{ scope.row.digitalHumanName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关系标签" min-width="150" align="center">
              <template #default="scope">
                <div class="flex flex-wrap gap-1 justify-center">
                  <el-tag v-for="tag in splitTags(scope.row.title)" :key="tag" size="mini" effect="plain" type="warning">{{ tag }}</el-tag>
                  <span v-if="splitTags(scope.row.title).length === 0" class="text-gray-300 text-xs">无</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="绑定时间" width="160" align="center" />
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="scope">
                <div class="flex items-center justify-center gap-2">
                  <el-button type="primary" plain size="mini" @click="handleEditRel(scope.row)">编辑</el-button>
                  <el-button type="danger" plain size="mini" @click="handleDelete(scope.row)">解除关联</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="relPage.currentPage"
              v-model:page-size="relPage.pageSize"
              :total="relationsTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 角标管理 -->
      <el-tab-pane label="角标管理" name="cornerMark">
        <MaterialCornerMarkPanel />
      </el-tab-pane>

      <!-- 横幅管理 Tab -->
      <el-tab-pane label="横幅管理" name="banner">
        <div class="p-5 bg-white rounded-b-lg">
          <template v-if="bannerMode === 'list'">
            <div class="flex items-center justify-between mb-4">
              <div class="text-base font-semibold text-gray-700">横幅图片列表</div>
              <el-button type="primary" icon="ElIconPlus" @click="openCreateBanner">新建横幅</el-button>
            </div>

            <el-table :data="bannerList" :loading="bannerPage.loading" border stripe :header-cell-style="{ background: '#f8f9fb', color: '#606266' }">
              <el-table-column label="序号" width="70" align="center">
                <template #default="scope">
                  {{ (bannerPage.currentPage - 1) * bannerPage.pageSize + scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column prop="name" label="横幅名称" min-width="140" align="center" />
              <el-table-column label="横幅图" min-width="160" align="center">
                <template #default="scope">
                  <div
                    v-if="scope.row.previewUrl || scope.row.imageUrl"
                    class="banner-thumb-bg w-28 h-12 rounded-md border border-gray-200 overflow-hidden cursor-pointer"
                    @click="openBannerPreview(scope.row)"
                  >
                    <img :src="scope.row.previewUrl || scope.row.imageUrl" class="w-full h-full object-contain bg-white" />
                  </div>
                  <span v-else class="text-xs text-gray-400">暂无横幅图</span>
                </template>
              </el-table-column>
              <el-table-column prop="updateTime" label="更新时间" width="180" align="center" />
              <el-table-column label="操作" width="180" align="center" fixed="right">
                <template #default="scope">
                  <el-button type="primary" plain size="mini" @click="editBanner(scope.row)">编辑</el-button>
                  <el-button type="danger" plain size="mini" @click="deleteBanner(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="flex justify-end mt-4" v-if="bannerPage.total > 0">
              <el-pagination
                v-model:current-page="bannerPage.currentPage"
                v-model:page-size="bannerPage.pageSize"
                :total="bannerPage.total"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                background
              />
            </div>

            <el-empty v-if="bannerList.length === 0" description="暂无横幅，点击右上角新建" :image-size="86" />

            <el-dialog title="横幅预览" v-model="bannerPreviewDialog.visible" width="860px" append-to-body>
              <div class="banner-preview-only">
                <img v-if="bannerPreviewDialog.url" :src="bannerPreviewDialog.url" class="banner-preview-image" />
              </div>
            </el-dialog>
          </template>

          <template v-else>
            <div class="flex items-center justify-between mb-4">
              <div class="text-base font-semibold text-gray-700">{{ bannerEditingId ? '编辑横幅' : '新建横幅' }}</div>
              <el-button @click="cancelBannerEdit">返回列表</el-button>
            </div>

            <div class="flex gap-6 items-start">
              <div class="w-80 flex-shrink-0 space-y-4">
                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div class="text-sm font-semibold text-gray-700 mb-2">横幅名称</div>
                  <el-input v-model="bannerName" maxlength="30" show-word-limit placeholder="请输入横幅名称" @blur="validateBannerName(true)" />
                  <div v-if="bannerNameCheckLoading" class="text-xs text-gray-400 mt-1">正在检查名称...</div>
                  <div v-else-if="bannerName && !bannerNameValid" class="text-xs text-red-500 mt-1">
                    标题已存在
                    <span v-if="bannerNameRecommended" class="ml-1">建议：{{ bannerNameRecommended }}</span>
                    <el-button v-if="bannerNameRecommended" link type="primary" size="small" @click="useRecommendedBannerName">使用推荐名</el-button>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div class="text-sm font-semibold text-gray-700 mb-3">① 选择数字人</div>
                  <el-select
                    v-model="bannerSelectedDH"
                    placeholder="请选择数字人"
                    filterable
                    remote
                    :remote-method="onBannerDHSearch"
                    :loading="bannerDHLoading"
                    clearable
                    popper-class="banner-dh-select-popper"
                    style="width: 100%"
                    @visible-change="onBannerDHVisibleChange"
                    @change="onBannerDHChange"
                  >
                    <el-option
                      v-for="dh in bannerDHOptions"
                      :key="dh.id"
                      :value="dh.id"
                      :label="dh.digitalHumanName"
                    >
                      <div class="flex items-center gap-2">
                        <el-avatar :size="24" shape="square" :src="dh.coverUrl" />
                        <span>{{ dh.digitalHumanName }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>

                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div class="text-sm font-semibold text-gray-700 mb-3">② 上传横幅图片</div>
                  <div class="banner-upload-wrap">
                    <el-upload
                      drag
                      action="#"
                      class="banner-upload"
                      :auto-upload="false"
                      :on-change="onBannerImageChange"
                      :show-file-list="false"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                    >
                      <div v-if="bannerImageUrl" class="relative w-full h-24 rounded-lg overflow-hidden">
                        <img :src="bannerImageUrl" class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">点击更换</div>
                      </div>
                      <div v-else class="flex flex-col items-center justify-center py-5 text-gray-400">
                        <el-icon class="text-3xl mb-1"><upload-filled /></el-icon>
                        <span class="text-xs">拖拽或点击上传横幅图</span>
                      </div>
                    </el-upload>
                  </div>
                </div>

                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <div class="text-sm font-semibold text-gray-700">③ 调节横幅参数</div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">X 坐标（像素）</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerX }}px</span>
                    </div>
                    <el-slider v-model="bannerX" :min="0" :max="bannerBgNaturalWidth" :step="1" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">Y 坐标（像素）</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerY }}px</span>
                    </div>
                    <el-slider v-model="bannerY" :min="0" :max="bannerBgNaturalHeight" :step="1" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">scale_x（宽度缩放）</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerScaleX.toFixed(2) }}</span>
                    </div>
                    <el-slider v-model="bannerScaleX" :min="0.1" :max="3" :step="0.01" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">scale_y（高度缩放）</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerScaleY.toFixed(2) }}</span>
                    </div>
                    <el-slider v-model="bannerScaleY" :min="0.1" :max="3" :step="0.01" />
                  </div>

                  <div class="text-xs text-gray-400">旋转功能已禁用</div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">横幅透明度</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerOpacity.toFixed(2) }}</span>
                    </div>
                    <el-slider v-model="bannerOpacity" :min="0" :max="1" :step="0.01" />
                  </div>
                </div>

                <div class="flex gap-2">
                  <el-button style="flex:1" @click="resetBanner">重置</el-button>
                  <el-button type="primary" style="flex:1" :loading="bannerSaving" @click="saveBanner">保存配置</el-button>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-700 mb-3">实时预览</div>
                <div
                  ref="bannerPreviewRef"
                  class="relative bg-gray-900 rounded-xl overflow-hidden mx-auto select-none"
                  style="width:360px;height:640px;"
                >
                  <img
                    v-if="bannerPreviewImageUrl"
                    :src="bannerPreviewImageUrl"
                    class="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                  <img
                    v-else-if="bannerDHCoverUrl"
                    :src="bannerDHCoverUrl"
                    class="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <el-icon style="font-size:48px;margin-bottom:8px"><user /></el-icon>
                    <span class="text-xs">请先选择数字人</span>
                  </div>

                  <div v-if="!bannerImageUrl && bannerSelectedDH" class="absolute bottom-0 left-0 right-0 text-center text-xs pb-3" style="color:rgba(255,255,255,0.5)">
                    璇蜂笂浼犳í骞呭浘鐗?                  </div>
                  <div
                    v-if="bannerImageUrl"
                    class="absolute cursor-move"
                    :style="bannerDragBoxStyle"
                    @mousedown.stop="startBannerDrag"
                  >
                    <div class="banner-resize-handle" @mousedown.stop.prevent="startBannerResize" />
                  </div>

                  <div class="absolute top-2 right-2 text-[10px] rounded px-1.5 py-0.5" style="color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.3)">
                    预览
                  </div>
                  <div v-if="bannerPreviewLoading" class="absolute inset-0 bg-black/25 flex items-center justify-center text-xs text-white">
                    预览生成中...
                  </div>
                </div>
                <div class="mt-3 text-xs text-gray-400 text-center">虚线框支持拖拽、右下角缩放</div>
                <div v-if="bannerPreviewError" class="mt-2 text-xs text-red-500 text-center">
                  {{ bannerPreviewError }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>

    </el-tabs>

    <!-- 编辑弹窗 (通用) -->
    <el-dialog
      v-model="dialogVisible"
      :title="activeName === 'voice' ? '编辑声音素材' : '编辑数字人素材'"
      width="500px"
      destroy-on-close
    >
        <!-- 声音编辑 -->
        <template v-if="activeName === 'voice'">
          <el-form :model="editForm" label-position="top" size="default">
            <el-form-item label="声音名称">
              <el-input v-model="editForm.name" placeholder="请输入声音名称" />
            </el-form-item>
          </el-form>
        </template>

        <!-- 鏁板瓧浜虹紪杈?-->
        <template v-else>
          <el-form :model="editForm" label-width="80px" size="default" class="mt-4">
            <el-form-item label="名称">
              <el-input v-model="editForm.name" placeholder="请输入素材名称" class="max-w-xs" />
            </el-form-item>
          </el-form>
        </template>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增绑定关系弹窗 (批量) -->
    <el-dialog
      v-model="addRelVisible"
      title="批量建立绑定关系"
      width="1000px"
      destroy-on-close
    >
      <div class="flex gap-6">
        <!-- 宸︿晶閫夋嫨鍣?-->
        <div class="flex-[3] flex flex-col gap-4">
          <div class="flex gap-4 h-[400px]">
             <!-- 声音选择 -->
            <div class="flex-1 flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="p-2 bg-blue-50 border-b font-medium text-xs flex justify-between">
                <span>1. 选择声音</span>
                <span class="text-blue-600">{{ selectedVoices.length }} 个</span>
              </div>
              <div class="p-2">
                <el-input v-model="searchAddVoice" placeholder="搜索声音..." size="mini" prefix-icon="ElIconSearch" />
              </div>
              <el-table
                ref="voiceTableRef"
                :data="filteredAddVoices"
                :row-key="getDialogRowKey"
                height="100%"
                size="mini"
                class="flex-1"
                @row-click="handleVoiceRowClick"
              >
                <el-table-column label="选中" width="60" align="center">
                  <template #default="{ row }">
                    <el-checkbox
                      :model-value="isVoiceSelected(row)"
                      @change="toggleVoiceSelection(row)"
                      @click.stop
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="voiceName" label="名称" show-overflow-tooltip />
              </el-table>
            </div>

            <!-- 鏁板瓧浜洪€夋嫨 -->
            <div class="flex-1 flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="p-2 bg-green-50 border-b font-medium text-xs flex justify-between">
                <span>2. 选择数字人</span>
                <span class="text-green-600">{{ selectedDHs.length }} 个</span>
              </div>
              <div class="p-2">
                <el-input v-model="searchAddDH" placeholder="搜索数字人..." size="mini" prefix-icon="ElIconSearch" />
              </div>
              <el-table
                ref="dhTableRef"
                :data="filteredAddDHs"
                :row-key="getDialogRowKey"
                height="100%"
                size="mini"
                class="flex-1"
                @row-click="handleDHRowClick"
              >
                <el-table-column label="选中" width="60" align="center">
                  <template #default="{ row }">
                    <el-checkbox
                      :model-value="isDHSelected(row)"
                      @change="toggleDHSelection(row)"
                      @click.stop
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="digitalHumanName" label="名称" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </div>

        <!-- 鍙充晶锛氬叧绯婚厤缃?-->
        <div class="flex-[1.2] flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="font-bold text-sm text-gray-700 mb-2">3. 关系配置</div>
          
          <div class="space-y-4">
            <div>
              <div class="text-[12px] text-gray-500 mb-2">是否为新关系添加标签？</div>
              <el-switch v-model="isAddRelTag" active-text="添加共有标签" />
            </div>

            <div v-if="isAddRelTag" class="tag-manager-box p-3 bg-white rounded border border-gray-200 shadow-inner">
              <div class="flex flex-wrap gap-2 mb-2">
                <el-tag v-for="(tag, index) in bulkRelTags" :key="index" closable size="mini" @close="bulkRelTags.splice(index, 1)">{{ tag }}</el-tag>
              </div>
              <div v-if="bulkRelTags.length < 5" class="flex gap-1">
                <el-input v-model="bulkTagInput" size="mini" placeholder="输入标签" @keyup.enter="addBulkRelTag" />
                <el-button size="mini" type="primary" plain @click="addBulkRelTag">添加</el-button>
              </div>
            </div>

            <div class="mt-auto pt-6 border-t border-gray-200">
              <div class="text-xs text-gray-400 mb-2">生成预览：</div>
              <div class="p-3 bg-blue-100 text-blue-800 rounded text-xs leading-5">
                将生成 <span class="font-bold text-blue-900">{{ selectedVoices.length * selectedDHs.length }}</span> 条绑定关系
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addRelVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRelations">确认生成</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑绑定关系弹窗 (单条修改) -->
    <el-dialog v-model="editRelVisible" title="编辑绑定关系" width="820px" destroy-on-close>
      <div class="flex gap-5 items-start">
        <div class="flex-1 min-w-0">
          <el-form label-position="top" size="default">
            <el-form-item label="声音">
              <el-input :model-value="editRelForm.voiceName" disabled />
            </el-form-item>
            <el-form-item label="数字人">
              <el-input :model-value="editRelForm.digitalHumanName" disabled />
            </el-form-item>
          </el-form>
          <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-600 leading-5">
            <div class="font-medium mb-1">操作说明</div>
            <div>· 单击标签：选中/取消选中</div>
            <div>· 双击标签：编辑名称</div>
            <div>· 点击 + ：新建标签</div>
          </div>
        </div>
        <div class="w-[400px] flex-shrink-0">
          <TagManager ref="relTagManagerRef" :initial-tags="editRelForm.tags" @change="handleEditRelTagsChange" />
        </div>
      </div>
      <template #footer>
        <el-button @click="editRelVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditRel">确认更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue'
import TagManager from '/@/components/TagManager/index.vue'
import MaterialCornerMarkPanel from '/@/views/PriorDisposal/components/MaterialCornerMarkPanel.vue'
import { getDigitalHumanPaginateList, updateDigitalHuman, updateVoice, deleteVoice, deleteDigitalHuman, getVoicePaginateList, getBindingList, createBinding, updateBinding, deleteBinding, bannerOverlayPreview, bannerOverlaySave, downloadFileByProxy } from '/@/api/material/index'
import { normalizeAssetUrl } from '/@/utils/download'
import request from '/@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

export default defineComponent({
  name: 'MaterialManagement',
  components: {
    TagManager,
    MaterialCornerMarkPanel
  },
  setup() {
    const activeName = ref('voice')
    const voices = ref([])
    const digitalHumans = ref([])
    const digitalHumansTotal = ref(0) // 鏁板瓧浜烘€绘暟
    const voicesTotal = ref(0) // 声音总数
    const relations = ref([])
    const relationsTotal = ref(0)

    // 鈹€鈹€ 妯箙绠＄悊 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    const bannerMode = ref<'list' | 'edit'>('list')
    const bannerEditingId = ref<number | null>(null)
    const bannerIdSeed = ref(1)

    const bannerList = ref<any[]>([])
    const bannerPage = reactive({ currentPage: 1, pageSize: 10, total: 0, loading: false })
    const bannerName = ref('')
    const bannerOriginalName = ref('')
    const bannerNameCheckLoading = ref(false)
    const bannerNameValid = ref(true)
    const bannerNameRecommended = ref('')
    const bannerSelectedDH = ref<number | null>(null)
    const bannerSelectedDHName = ref('')
    const bannerDHCoverUrl = ref('')
    const bannerDHVideoUrl = ref('')
    const bannerImageUrl = ref('')
    const bannerPreviewImageUrl = ref('')
    const bannerFallbackPreviewUrl = ref('')
    const bannerPreviewDialog = reactive({ visible: false, url: '' })
    const bannerPreviewLoading = ref(false)
    const bannerPreviewError = ref('')
    const bannerSaving = ref(false)
    const bannerBackgroundBase64 = ref('')
    const bannerOverlayBase64 = ref('')
    const bannerDHOptions = ref<any[]>([])
    const bannerDHPage = reactive({ page: 1, pageSize: 20, hasMore: true })
    const bannerDHLoading = ref(false)
    const bannerDHSearchKeyword = ref('')
    const bannerX = ref(0)
    const bannerY = ref(0)
    const bannerScaleX = ref(1)
    const bannerScaleY = ref(1)
    const bannerRotate = ref(0)
    const bannerOpacity = ref(1) // 0~1
    const bannerBgNaturalWidth = ref(360)
    const bannerBgNaturalHeight = ref(640)
    const bannerOverlayNaturalWidth = ref(300)
    const bannerOverlayNaturalHeight = ref(100)
    let bannerPreviewDebounceTimer: ReturnType<typeof setTimeout> | null = null
    let bannerPreviewRequestId = 0
    let bannerDHDropdownWrapEl: HTMLElement | null = null
    let bannerNameCheckTimer: ReturnType<typeof setTimeout> | null = null
    let bannerEditInitializing = false
    let bannerLoadedTransform: {
      x: number
      y: number
      scaleX: number
      scaleY: number
      rotate: number
      opacity: number
    } | null = null

    // 棰勮鍖?DOM 寮曠敤锛堟嫋鎷芥椂鐢ㄤ簬鎹㈢畻鍧愭爣锛?
    const bannerPreviewRef = ref<HTMLElement | null>(null)

    // 当前拖拽/缩放状态
    let _bannerDragState: {
      startMouseX: number; startMouseY: number; startDisplayX: number; startDisplayY: number
    } | null = null
    let _bannerResizeState: {
      startMouseX: number; startMouseY: number; startScaleX: number; startScaleY: number
    } | null = null
    let _bannerRotateState: {
      centerX: number
      centerY: number
      startAngleDeg: number
      startRotateDeg: number
      lockCenterXInImage: number
      lockCenterYInImage: number
    } | null = null

    const bannerDisplayLayout = computed(() => {
      const containerW = 360
      const containerH = 640
      const bgW = Math.max(1, bannerBgNaturalWidth.value)
      const bgH = Math.max(1, bannerBgNaturalHeight.value)
      const scale = Math.min(containerW / bgW, containerH / bgH)
      const displayW = bgW * scale
      const displayH = bgH * scale
      return {
        scale,
        offsetX: (containerW - displayW) / 2,
        offsetY: (containerH - displayH) / 2,
        displayW,
        displayH
      }
    })

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

    const bannerOverlayUpdateRequest = (data: any) => {
      return request({
        url: '/api/material/banner-overlay/update/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      })
    }

    const bannerOverlayDeleteRequest = (bannerOverlayId: number | string) => {
      return request({
        url: '/api/material/banner-overlay/delete/',
        method: 'post',
        data: { bannerOverlayId },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      })
    }

    const bannerOverlayValidateNameRequest = (name: string) => {
      return request({
        url: '/api/material/banner-overlay/validate-name/',
        method: 'post',
        data: { name },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      })
    }

    const normalizeBannerListItem = (item: any) => {
      return {
        id: Number(item?.id ?? 0),
        name: item?.title || item?.name || '',
        imageUrl: item?.overlayUrl || item?.overlay_url || '',
        previewUrl: item?.outputUrl || item?.output_url || item?.overlayUrl || item?.overlay_url || '',
        overlayUrl: item?.overlayUrl || item?.overlay_url || '',
        outputUrl: item?.outputUrl || item?.output_url || '',
        updateTime: item?.updateTime || item?.update_time || item?.createTime || item?.create_time || '',
        x: Number(item?.x ?? 0),
        y: Number(item?.y ?? 0),
        scaleX: Number(item?.scaleX ?? item?.scale_x ?? 1),
        scaleY: Number(item?.scaleY ?? item?.scale_y ?? 1),
        rotate: Number(item?.rotate ?? 0),
        opacity: Number(item?.opacity ?? 1),
        dhId: Number(item?.digitalHumanId ?? item?.digital_human_id ?? item?.dhId ?? 0) || null,
        dhName: item?.digitalHumanName || item?.dhName || '',
        dhCoverUrl: item?.backgroundUrl || item?.background_url || item?.dhCoverUrl || '',
        baseWidth: Number(item?.baseWidth ?? item?.base_width ?? 300),
        baseHeight: Number(item?.baseHeight ?? item?.base_height ?? 100)
      }
    }

    const fetchBannerList = async () => {
      bannerPage.loading = true
      try {
        const res = await bannerOverlayPaginateRequest(bannerPage.currentPage, bannerPage.pageSize)
        const root = res?.data?.data ?? {}
        const records = Array.isArray(root?.records)
          ? root.records
          : Array.isArray(root?.data)
            ? root.data
            : []
        bannerList.value = records.map((item: any) => normalizeBannerListItem(item))
        bannerPage.total = Number(root?.total ?? bannerList.value.length)
      } catch (error) {
        console.error('Fetch banner list failed:', error)
        bannerList.value = []
        bannerPage.total = 0
      } finally {
        bannerPage.loading = false
      }
    }

    const bannerDragBoxStyle = computed(() => {
      const layout = bannerDisplayLayout.value
      const { scaledWidth, scaledHeight, rotatedWidth, rotatedHeight } = getOverlayMetrics()
      const offsetXComp = (rotatedWidth - scaledWidth) / 2
      const offsetYComp = (rotatedHeight - scaledHeight) / 2
      const left = layout.offsetX + (bannerX.value - offsetXComp) * layout.scale
      const top = layout.offsetY + (bannerY.value - offsetYComp) * layout.scale
      const width = scaledWidth * layout.scale
      const height = scaledHeight * layout.scale
      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        transformOrigin: 'center center',
        transform: `rotate(${bannerRotate.value}deg)`,
        opacity: '1',
        border: '1px dashed rgba(255,255,255,0.85)',
        background: 'rgba(255,255,255,0.06)',
        boxSizing: 'border-box',
        zIndex: '5'
      }
    })

    const stripDataUrlPrefix = (base64: string) => {
      if (!base64) return ''
      const commaIndex = base64.indexOf(',')
      return commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64
    }

    const blobToDataUrl = (blob: Blob) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string) || '')
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    const getImageSizeByUrl = (src: string) => {
      return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
        img.onerror = reject
        img.src = src
      })
    }

    const trimTransparentPadding = async (src: string) => {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = src
      })

      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return { dataUrl: src, width, height, trimmed: false }
      }

      ctx.drawImage(img, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height).data

      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = imageData[(y * width + x) * 4 + 3]
          if (alpha > 8) {
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        return { dataUrl: canvas.toDataURL('image/png'), width, height, trimmed: false }
      }

      const cropWidth = maxX - minX + 1
      const cropHeight = maxY - minY + 1
      const unchanged = minX === 0 && minY === 0 && cropWidth === width && cropHeight === height
      if (unchanged) {
        return { dataUrl: canvas.toDataURL('image/png'), width, height, trimmed: false }
      }

      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = cropWidth
      cropCanvas.height = cropHeight
      const cropCtx = cropCanvas.getContext('2d')
      if (!cropCtx) {
        return { dataUrl: canvas.toDataURL('image/png'), width, height, trimmed: false }
      }
      cropCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
      return { dataUrl: cropCanvas.toDataURL('image/png'), width: cropWidth, height: cropHeight, trimmed: true }
    }

    const getImageBase64ByProxy = async (url: string) => {
      if (!url) return ''
      if (url.startsWith('data:image/')) return url
      if (url.startsWith('blob:')) {
        const blob = await fetch(url).then(r => r.blob())
        return await blobToDataUrl(blob)
      }
      const res = await downloadFileByProxy(url)
      return await blobToDataUrl(res.data as Blob)
    }

    const syncBannerBackgroundSize = async (src: string) => {
      if (!src) return
      const bgSize = await getImageSizeByUrl(src)
      bannerBgNaturalWidth.value = bgSize.width || 360
      bannerBgNaturalHeight.value = bgSize.height || 640
    }

    const extractVideoFrameByProxy = async (videoUrl: string) => {
      if (!videoUrl) {
        throw new Error('Missing banner background video url')
      }
      const res = await downloadFileByProxy(videoUrl)
      const videoBlob = res.data as Blob
      const objectUrl = URL.createObjectURL(videoBlob)
      try {
        return await new Promise<string>((resolve, reject) => {
          const video = document.createElement('video')
          const canvas = document.createElement('canvas')
          let settled = false

          const cleanup = () => {
            video.pause()
            video.removeAttribute('src')
            video.load()
          }

          const finish = (handler: () => void) => {
            if (settled) return
            settled = true
            cleanup()
            handler()
          }

          const captureFrame = () => {
            const width = Math.max(1, video.videoWidth || 360)
            const height = Math.max(1, video.videoHeight || 640)
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              finish(() => reject(new Error('Canvas context unavailable')))
              return
            }
            ctx.drawImage(video, 0, 0, width, height)
            finish(() => resolve(canvas.toDataURL('image/png')))
          }

          video.preload = 'auto'
          video.muted = true
          video.playsInline = true
          video.crossOrigin = 'anonymous'

          video.addEventListener('error', () => {
            finish(() => reject(new Error('Video frame extraction failed')))
          })

          video.addEventListener('loadedmetadata', () => {
            const targetTime = Number.isFinite(video.duration) && video.duration > 0.15 ? 0.1 : 0
            if (targetTime > 0) {
              try {
                video.currentTime = targetTime
              } catch (error) {
                console.warn('Seek video frame failed, fallback to first loaded frame:', error)
                if (video.readyState >= 2) {
                  captureFrame()
                }
              }
              return
            }
            if (video.readyState >= 2) {
              captureFrame()
            }
          })

          video.addEventListener('loadeddata', () => {
            if (!settled && video.currentTime === 0) {
              captureFrame()
            }
          })

          video.addEventListener('seeked', () => {
            if (!settled) {
              captureFrame()
            }
          })

          video.src = objectUrl
          video.load()
        })
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    const loadBannerBackgroundAsset = async (coverUrl: string, videoUrl: string = '') => {
      if (!coverUrl && !videoUrl) {
        bannerBackgroundBase64.value = ''
        return
      }

      try {
        if (coverUrl) {
          await syncBannerBackgroundSize(coverUrl)
        }
      } catch (error) {
        console.error('Load banner background size failed:', error)
      }

      try {
        if (coverUrl) {
          bannerBackgroundBase64.value = await getImageBase64ByProxy(coverUrl)
          return
        }
      } catch (error) {
        console.error('Load banner background base64 failed:', error)
      }

      if (!videoUrl) {
        bannerBackgroundBase64.value = ''
        throw new Error('Banner background cover unavailable and video url missing')
      }

      try {
        const frameBase64 = await extractVideoFrameByProxy(videoUrl)
        bannerBackgroundBase64.value = frameBase64
        await syncBannerBackgroundSize(frameBase64)
      } catch (error) {
        console.error('Load banner background fallback frame failed:', error)
        bannerBackgroundBase64.value = ''
        throw error
      }
    }

    const normalizePreviewImage = (raw: unknown) => {
      if (typeof raw !== 'string') return ''
      const value = raw.trim()
      if (!value) return ''
      if (value.startsWith('data:image/')) return value
      if (value.startsWith('http://') || value.startsWith('https://')) return value
      return `data:image/png;base64,${value}`
    }

    const extractPreviewImage = (res: any) => {
      const root = res?.data?.data ?? res?.data
      if (typeof root === 'string') return normalizePreviewImage(root)
      const candidates = [
        root?.frame_base64,
        root?.preview_base64,
        root?.image_base64,
        root?.result_base64,
        root?.base64,
        root?.image_url,
        root?.image,
        root?.result
      ]
      for (const item of candidates) {
        const normalized = normalizePreviewImage(item)
        if (normalized) return normalized
      }
      return ''
    }

    const clearBannerPreviewDebounce = () => {
      if (bannerPreviewDebounceTimer) {
        clearTimeout(bannerPreviewDebounceTimer)
        bannerPreviewDebounceTimer = null
      }
    }

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

    const normalizeAngle = (angle: number) => {
      let normalized = angle % 360
      if (normalized < 0) normalized += 360
      return normalized
    }

    const getBackendRotateAngle = () => 0

    const getScaledOverlaySize = () => {
      const scaledWidth = Math.max(1, Math.floor(bannerOverlayNaturalWidth.value * bannerScaleX.value))
      const scaledHeight = Math.max(1, Math.floor(bannerOverlayNaturalHeight.value * bannerScaleY.value))
      return { scaledWidth, scaledHeight }
    }

    const getRotatedBoundingSize = (width: number, height: number, angle: number) => {
      const normalized = normalizeAngle(angle)
      if (normalized === 0 || normalized === 180) {
        return { rotatedWidth: width, rotatedHeight: height }
      }
      if (normalized === 90 || normalized === 270) {
        return { rotatedWidth: height, rotatedHeight: width }
      }
      const angleRad = normalized * Math.PI / 180
      const rotatedWidth = Math.ceil(Math.abs(width * Math.cos(angleRad)) + Math.abs(height * Math.sin(angleRad)))
      const rotatedHeight = Math.ceil(Math.abs(width * Math.sin(angleRad)) + Math.abs(height * Math.cos(angleRad)))
      return { rotatedWidth: Math.max(1, rotatedWidth), rotatedHeight: Math.max(1, rotatedHeight) }
    }

    const getOverlayMetrics = () => {
      const backendRotate = getBackendRotateAngle()
      const { scaledWidth, scaledHeight } = getScaledOverlaySize()
      const { rotatedWidth, rotatedHeight } = getRotatedBoundingSize(scaledWidth, scaledHeight, backendRotate)
      return { scaledWidth, scaledHeight, rotatedWidth, rotatedHeight, backendRotate }
    }

    const clampBannerPosition = () => {
      const { scaledWidth, scaledHeight } = getOverlayMetrics()
      const maxX = Math.max(0, bannerBgNaturalWidth.value - scaledWidth)
      const maxY = Math.max(0, bannerBgNaturalHeight.value - scaledHeight)
      bannerX.value = clamp(bannerX.value, 0, maxX)
      bannerY.value = clamp(bannerY.value, 0, maxY)
    }

    const requestBannerPreview = async (force = false) => {
      clearBannerPreviewDebounce()

      if (!bannerSelectedDH.value || !bannerBackgroundBase64.value) {
        bannerPreviewImageUrl.value = bannerFallbackPreviewUrl.value || ''
        bannerPreviewLoading.value = false
        if (!bannerPreviewImageUrl.value && (bannerOverlayBase64.value || bannerImageUrl.value)) {
          bannerPreviewError.value = '请选择数字人后拉取预览'
        } else {
          bannerPreviewError.value = ''
        }
        return
      }

      if (!bannerBackgroundBase64.value || !bannerOverlayBase64.value) {
        bannerPreviewImageUrl.value = ''
        bannerPreviewLoading.value = false
        bannerPreviewError.value = ''
        return
      }

      const run = async () => {
        const currentRequestId = ++bannerPreviewRequestId
        bannerPreviewLoading.value = true
        bannerPreviewError.value = ''
        try {
          const { backendRotate } = getOverlayMetrics()
          const res = await bannerOverlayPreview({
            background_base64: stripDataUrlPrefix(bannerBackgroundBase64.value),
            overlay_base64: stripDataUrlPrefix(bannerOverlayBase64.value),
            x: Number(bannerX.value.toFixed(2)),
            y: Number(bannerY.value.toFixed(2)),
            scale_x: Number(bannerScaleX.value.toFixed(4)),
            scale_y: Number(bannerScaleY.value.toFixed(4)),
            rotate: Number(backendRotate.toFixed(2)),
            opacity: Number(bannerOpacity.value.toFixed(2))
          })

          if (currentRequestId !== bannerPreviewRequestId) return
          const previewImage = extractPreviewImage(res)
          if (previewImage) {
            bannerPreviewImageUrl.value = previewImage
          } else {
            bannerPreviewError.value = '预览接口未返回可展示图片'
          }
        } catch (error) {
          console.error('Banner preview failed:', error)
          if (currentRequestId !== bannerPreviewRequestId) return
          bannerPreviewError.value = '预览生成失败，请稍后重试'
        } finally {
          if (currentRequestId === bannerPreviewRequestId) {
            bannerPreviewLoading.value = false
          }
        }
      }

      if (force) {
        await run()
      } else {
        bannerPreviewDebounceTimer = setTimeout(() => {
          run()
        }, 350)
      }
    }

    const detachBannerDHDropdownScroll = () => {
      if (bannerDHDropdownWrapEl) {
        bannerDHDropdownWrapEl.removeEventListener('scroll', handleBannerDHDropdownScroll as any)
        bannerDHDropdownWrapEl = null
      }
    }

    const handleBannerDHDropdownScroll = () => {
      if (!bannerDHDropdownWrapEl || bannerDHLoading.value || !bannerDHPage.hasMore) return
      const { scrollTop, clientHeight, scrollHeight } = bannerDHDropdownWrapEl
      if (scrollHeight - scrollTop - clientHeight <= 80) {
        loadBannerDHOptions(false)
      }
    }

    const attachBannerDHDropdownScroll = () => {
      detachBannerDHDropdownScroll()
      nextTick(() => {
        const wrap = document.querySelector('.banner-dh-select-popper .el-select-dropdown__wrap') as HTMLElement | null
        if (!wrap) return
        bannerDHDropdownWrapEl = wrap
        wrap.addEventListener('scroll', handleBannerDHDropdownScroll as any)
      })
    }

    const loadBannerDHOptions = async (reset = false) => {
      if (bannerDHLoading.value) return
      if (reset) {
        bannerDHPage.page = 1
        bannerDHPage.hasMore = true
        bannerDHOptions.value = []
      }
      if (!bannerDHPage.hasMore) return

      bannerDHLoading.value = true
      try {
        const searchObj: any = {}
        const keyword = bannerDHSearchKeyword.value.trim()
        if (keyword) searchObj.digitalHumanName = keyword
        const res = await getDigitalHumanPaginateList(bannerDHPage.page, bannerDHPage.pageSize, searchObj)
        if (res.data.code === 200 && res.data.data) {
          const list = res.data.data.data || []
          const merged = reset ? list : [...bannerDHOptions.value, ...list]
          const map = new Map<string, any>()
          merged.forEach((item: any) => map.set(String(item.id), item))
          bannerDHOptions.value = Array.from(map.values())
          bannerDHPage.page += 1
          if (list.length < bannerDHPage.pageSize) {
            bannerDHPage.hasMore = false
          }
        } else {
          bannerDHPage.hasMore = false
        }
      } catch (error) {
        console.error('加载横幅数字人失败:', error)
        bannerDHPage.hasMore = false
      } finally {
        bannerDHLoading.value = false
      }
    }

    const onBannerDHSearch = (keyword: string) => {
      bannerDHSearchKeyword.value = keyword || ''
      loadBannerDHOptions(true)
    }

    const onBannerDHVisibleChange = (visible: boolean) => {
      if (visible) {
        if (bannerDHOptions.value.length === 0) {
          loadBannerDHOptions(true)
        }
        attachBannerDHDropdownScroll()
      } else {
        detachBannerDHDropdownScroll()
      }
    }

    async function onBannerDHChange(id: number | string | null) {
      const normalizedId = id === null || id === undefined || id === '' ? null : Number(id)
      const currentTransform = {
        x: Number(bannerX.value ?? 0),
        y: Number(bannerY.value ?? 0),
        scaleX: Number(bannerScaleX.value ?? 1),
        scaleY: Number(bannerScaleY.value ?? 1),
        rotate: Number(bannerRotate.value ?? 0),
        opacity: Number(bannerOpacity.value ?? 1)
      }
      if (!normalizedId) {
        bannerSelectedDHName.value = ''
        bannerDHCoverUrl.value = ''
        bannerDHVideoUrl.value = ''
        bannerBackgroundBase64.value = ''
        bannerPreviewImageUrl.value = bannerFallbackPreviewUrl.value || ''
        bannerPreviewError.value = (!bannerPreviewImageUrl.value && bannerImageUrl.value) ? '请选择数字人后拉取预览' : ''
        return
      }
      if (bannerSelectedDH.value !== normalizedId) {
        bannerSelectedDH.value = normalizedId
      }
      const dh = (bannerDHOptions.value as any[]).find((d: any) => Number(d.id) === normalizedId)
        || (digitalHumans.value as any[]).find((d: any) => Number(d.id) === normalizedId)
      bannerSelectedDHName.value = dh?.digitalHumanName ?? ''
      bannerDHCoverUrl.value = dh?.coverUrl ?? ''
      bannerDHVideoUrl.value = dh?.videoUrl ?? ''
      try {
        await loadBannerBackgroundAsset(bannerDHCoverUrl.value, bannerDHVideoUrl.value)
      } catch (error) {
        bannerBackgroundBase64.value = ''
        bannerPreviewError.value = '数字人预览底图读取失败，暂时无法预览'
      }
      const fixedTransform = bannerLoadedTransform || currentTransform
      bannerX.value = fixedTransform.x
      bannerY.value = fixedTransform.y
      bannerScaleX.value = fixedTransform.scaleX
      bannerScaleY.value = fixedTransform.scaleY
      bannerRotate.value = fixedTransform.rotate
      bannerOpacity.value = fixedTransform.opacity
      clampBannerPosition()
      await requestBannerPreview(true)
    }

    const ensureBannerDhSnapshotReady = async () => {
      if (!bannerSelectedDH.value) return
      if (bannerSelectedDHName.value && bannerDHVideoUrl.value) return

      let dh = (bannerDHOptions.value as any[]).find((item: any) => Number(item.id) === Number(bannerSelectedDH.value))
        || (digitalHumans.value as any[]).find((item: any) => Number(item.id) === Number(bannerSelectedDH.value))

      if (!dh) {
        const res = await getDigitalHumanPaginateList(1, 100, { digitalHumanId: bannerSelectedDH.value })
        const list = res?.data?.data?.data || []
        dh = list.find((item: any) => Number(item.id) === Number(bannerSelectedDH.value))
      }

      if (dh) {
        bannerSelectedDHName.value = dh.digitalHumanName || ''
        bannerDHCoverUrl.value = dh.coverUrl || ''
        bannerDHVideoUrl.value = dh.videoUrl || ''
      }
    }

    const ensureBannerAssetsReady = async () => {
      await ensureBannerDhSnapshotReady()

      if (!bannerBackgroundBase64.value && (bannerDHCoverUrl.value || bannerDHVideoUrl.value)) {
        try {
          await loadBannerBackgroundAsset(bannerDHCoverUrl.value, bannerDHVideoUrl.value)
        } catch (error) {
          console.error('Ensure banner background failed:', error)
        }
      }

      if (!bannerOverlayBase64.value && bannerImageUrl.value) {
        try {
          if (bannerImageUrl.value.startsWith('data:')) {
            bannerOverlayBase64.value = bannerImageUrl.value
          } else {
            bannerOverlayBase64.value = await getImageBase64ByProxy(bannerImageUrl.value)
          }
          const size = await getImageSizeByUrl(bannerImageUrl.value)
          if (size.width > 0 && size.height > 0) {
            bannerOverlayNaturalWidth.value = size.width
            bannerOverlayNaturalHeight.value = size.height
          }
        } catch (error) {
          console.error('Ensure banner overlay failed:', error)
        }
      }
    }

    async function onBannerImageChange(file: any) {
      if (!bannerSelectedDH.value) {
        ElMessage.warning('请选择数字人后拉取预览')
      }
      if (file?.raw) {
        const objectUrl = URL.createObjectURL(file.raw)
        try {
          const trimmed = await trimTransparentPadding(objectUrl)
          bannerImageUrl.value = trimmed.dataUrl
          bannerOverlayBase64.value = trimmed.dataUrl
          bannerOverlayNaturalWidth.value = Math.max(1, trimmed.width)
          bannerOverlayNaturalHeight.value = Math.max(1, trimmed.height)
          // 鏂板浘涓婁紶鏃堕噸缃彉鎹㈠弬鏁帮紝閬垮厤缁ф壙涓婁竴寮犲浘鐨勭姸鎬佸鑷村垵濮嬮敊浣?          bannerX.value = 0
          bannerY.value = 0
          bannerScaleX.value = 1
          bannerScaleY.value = 1
          bannerRotate.value = 0
          clampBannerPosition()
        } catch (error) {
          console.error('Read banner image size failed:', error)
          bannerOverlayBase64.value = await blobToDataUrl(file.raw)
          bannerImageUrl.value = bannerOverlayBase64.value
          const size = await getImageSizeByUrl(bannerImageUrl.value)
          if (size.width > 0 && size.height > 0) {
            bannerOverlayNaturalWidth.value = size.width
            bannerOverlayNaturalHeight.value = size.height
          }
          bannerX.value = 0
          bannerY.value = 0
          bannerScaleX.value = 1
          bannerScaleY.value = 1
          bannerRotate.value = 0
          clampBannerPosition()
        } finally {
          URL.revokeObjectURL(objectUrl)
        }
        await requestBannerPreview(true)
      }
    }

    function startBannerDrag(e: MouseEvent) {
      const preview = bannerPreviewRef.value
      if (!preview) return
      _bannerDragState = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startDisplayX: bannerX.value,
        startDisplayY: bannerY.value
      }

      const onMove = (ev: MouseEvent) => {
        if (!_bannerDragState) return
        const layout = bannerDisplayLayout.value
        const deltaXInImage = (ev.clientX - _bannerDragState.startMouseX) / layout.scale
        const deltaYInImage = (ev.clientY - _bannerDragState.startMouseY) / layout.scale
        bannerX.value = Math.round(_bannerDragState.startDisplayX + deltaXInImage)
        bannerY.value = Math.round(_bannerDragState.startDisplayY + deltaYInImage)
        clampBannerPosition()
      }
      const onUp = () => {
        _bannerDragState = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    function startBannerResize(e: MouseEvent) {
      _bannerResizeState = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startScaleX: bannerScaleX.value,
        startScaleY: bannerScaleY.value
      }

      const onMove = (ev: MouseEvent) => {
        if (!_bannerResizeState) return
        const layout = bannerDisplayLayout.value
        const deltaXInImage = (ev.clientX - _bannerResizeState.startMouseX) / layout.scale
        const deltaYInImage = (ev.clientY - _bannerResizeState.startMouseY) / layout.scale

        const nextScaleX = _bannerResizeState.startScaleX + deltaXInImage / Math.max(1, bannerOverlayNaturalWidth.value)
        const nextScaleY = _bannerResizeState.startScaleY + deltaYInImage / Math.max(1, bannerOverlayNaturalHeight.value)

        bannerScaleX.value = clamp(Number(nextScaleX.toFixed(4)), 0.1, 3)
        bannerScaleY.value = clamp(Number(nextScaleY.toFixed(4)), 0.1, 3)
        clampBannerPosition()
      }

      const onUp = () => {
        _bannerResizeState = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    function startBannerRotate(e: MouseEvent) {
      return
      const rect = (e.currentTarget as HTMLElement)?.parentElement?.getBoundingClientRect()
      if (!rect) return
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const startAngleDeg = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI
      const startBackendRotate = -bannerRotate.value
      const { scaledWidth, scaledHeight } = getScaledOverlaySize()
      const { rotatedWidth: startRotatedWidth, rotatedHeight: startRotatedHeight } = getRotatedBoundingSize(
        scaledWidth,
        scaledHeight,
        startBackendRotate
      )
      const lockCenterXInImage = bannerX.value + startRotatedWidth / 2
      const lockCenterYInImage = bannerY.value + startRotatedHeight / 2
      _bannerRotateState = {
        centerX,
        centerY,
        startAngleDeg,
        startRotateDeg: bannerRotate.value,
        lockCenterXInImage,
        lockCenterYInImage
      }

      const onMove = (ev: MouseEvent) => {
        if (!_bannerRotateState) return
        const currentAngleDeg = Math.atan2(ev.clientY - _bannerRotateState.centerY, ev.clientX - _bannerRotateState.centerX) * 180 / Math.PI
        const delta = currentAngleDeg - _bannerRotateState.startAngleDeg
        let nextRotate = _bannerRotateState.startRotateDeg + delta
        while (nextRotate > 180) nextRotate -= 360
        while (nextRotate < -180) nextRotate += 360
        bannerRotate.value = Number(nextRotate.toFixed(2))
        const nextBackendRotate = -bannerRotate.value
        const { scaledWidth: nextScaledWidth, scaledHeight: nextScaledHeight } = getScaledOverlaySize()
        const { rotatedWidth: nextRotatedWidth, rotatedHeight: nextRotatedHeight } = getRotatedBoundingSize(
          nextScaledWidth,
          nextScaledHeight,
          nextBackendRotate
        )
        bannerX.value = Number((_bannerRotateState.lockCenterXInImage - nextRotatedWidth / 2).toFixed(2))
        bannerY.value = Number((_bannerRotateState.lockCenterYInImage - nextRotatedHeight / 2).toFixed(2))
        clampBannerPosition()
      }

      const onUp = () => {
        _bannerRotateState = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    function resetBanner() {
      clearBannerPreviewDebounce()
      bannerSelectedDH.value = null
      bannerSelectedDHName.value = ''
      bannerDHCoverUrl.value = ''
      bannerDHVideoUrl.value = ''
      bannerName.value = ''
      bannerOriginalName.value = ''
      bannerNameValid.value = true
      bannerNameRecommended.value = ''
      bannerImageUrl.value = ''
      bannerPreviewImageUrl.value = ''
      bannerFallbackPreviewUrl.value = ''
      bannerPreviewError.value = ''
      bannerBackgroundBase64.value = ''
      bannerOverlayBase64.value = ''
      bannerX.value = 0
      bannerY.value = 0
      bannerScaleX.value = 1
      bannerScaleY.value = 1
      bannerRotate.value = 0
      bannerOpacity.value = 1
      bannerBgNaturalWidth.value = 360
      bannerBgNaturalHeight.value = 640
      bannerOverlayNaturalWidth.value = 300
      bannerOverlayNaturalHeight.value = 100
      bannerLoadedTransform = null
    }

    function openCreateBanner() {
      bannerEditingId.value = null
      resetBanner()
      bannerMode.value = 'edit'
    }

    function cancelBannerEdit() {
      bannerMode.value = 'list'
    }

    async function editBanner(row: any) {
      bannerEditInitializing = true
      bannerEditingId.value = row.id
      bannerName.value = row.name || ''
      bannerOriginalName.value = row.name || ''
      bannerSelectedDH.value = row.dhId || null
      bannerSelectedDHName.value = row.dhName || ''
      bannerDHCoverUrl.value = row.dhCoverUrl || ''
      bannerDHVideoUrl.value = row.dhVideoUrl || ''
      if ((!bannerDHCoverUrl.value || !bannerDHVideoUrl.value) && row.dhId) {
        const fallbackDh = (digitalHumans.value as any[]).find((d: any) => Number(d.id) === Number(row.dhId))
        if (fallbackDh) {
          bannerDHCoverUrl.value = bannerDHCoverUrl.value || fallbackDh.coverUrl || ''
          bannerDHVideoUrl.value = bannerDHVideoUrl.value || fallbackDh.videoUrl || ''
        } else {
          try {
            const dhRes = await getDigitalHumanPaginateList(1, 100)
            const dhList = dhRes?.data?.data?.data || []
            const remoteDh = dhList.find((d: any) => Number(d.id) === Number(row.dhId))
            if (remoteDh) {
              bannerDHCoverUrl.value = bannerDHCoverUrl.value || remoteDh.coverUrl || ''
              bannerDHVideoUrl.value = bannerDHVideoUrl.value || remoteDh.videoUrl || ''
            }
          } catch (e) {
            console.error('Fallback load DH cover failed:', e)
          }
        }
      }
      bannerImageUrl.value = row.overlayUrl || row.imageUrl || ''
      bannerFallbackPreviewUrl.value = row.outputUrl || row.imageUrl || ''
      bannerX.value = Number(row.x ?? 0)
      bannerY.value = Number(row.y ?? 0)
      bannerScaleX.value = Number(row.scaleX ?? row.scale_x ?? 1)
      bannerScaleY.value = Number(row.scaleY ?? row.scale_y ?? 1)
      bannerRotate.value = 0
      bannerOpacity.value = Number(row.opacity ?? 1)
      bannerLoadedTransform = {
        x: bannerX.value,
        y: bannerY.value,
        scaleX: bannerScaleX.value,
        scaleY: bannerScaleY.value,
        rotate: 0,
        opacity: bannerOpacity.value
      }
      bannerOverlayNaturalWidth.value = Number(row.baseWidth ?? 300)
      bannerOverlayNaturalHeight.value = Number(row.baseHeight ?? 100)
      bannerMode.value = 'edit'

      try {
        await loadBannerBackgroundAsset(bannerDHCoverUrl.value, bannerDHVideoUrl.value)
      } catch (error) {
        console.error('Load edit background base64 failed:', error)
        bannerBackgroundBase64.value = ''
      }
      try {
        bannerOverlayBase64.value = bannerImageUrl.value ? await getImageBase64ByProxy(bannerImageUrl.value) : ''
        if (bannerOverlayBase64.value) {
          const trimmed = await trimTransparentPadding(bannerOverlayBase64.value)
          bannerOverlayBase64.value = trimmed.dataUrl
          bannerImageUrl.value = trimmed.dataUrl
          bannerOverlayNaturalWidth.value = Math.max(1, trimmed.width)
          bannerOverlayNaturalHeight.value = Math.max(1, trimmed.height)
        }
      } catch (error) {
        console.error('Load edit overlay base64 failed:', error)
        bannerOverlayBase64.value = ''
      }
      if ((!row.baseWidth || !row.baseHeight) && bannerImageUrl.value) {
        try {
          const size = await getImageSizeByUrl(bannerImageUrl.value)
          bannerOverlayNaturalWidth.value = Math.max(1, Math.round(size.width))
          bannerOverlayNaturalHeight.value = Math.max(1, Math.round(size.height))
        } catch (error) {
          console.error('Load edit overlay size failed:', error)
        }
      }
      await nextTick()
      clampBannerPosition()
      bannerEditInitializing = false
      await requestBannerPreview(true)
    }

    const deleteBanner = (row: any) => {
      ElMessageBox.confirm('确定要删除该横幅吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await bannerOverlayDeleteRequest(row.id)
          const code = res?.data?.code
          if (code === 0 || code === 200) {
            ElMessage.success(res?.data?.message || '删除成功')
            if (bannerList.value.length === 1 && bannerPage.currentPage > 1) {
              bannerPage.currentPage -= 1
            }
            await fetchBannerList()
            return
          }
          ElMessage.error(res?.data?.message || '删除失败')
        } catch (error: any) {
          const message = error?.response?.data?.message || '删除失败，请稍后重试'
          ElMessage.error(message)
        }
      }).catch(() => {})
    }

    function openBannerPreview(row: any) {
      bannerPreviewDialog.url = row?.previewUrl || row?.outputUrl || row?.imageUrl || ''
      bannerPreviewDialog.visible = !!bannerPreviewDialog.url
    }

    const buildBannerFileName = (title: string) => {
      const base = title.trim().replace(/[\\/:*?"<>|]+/g, '_')
      const safe = base || 'banner_overlay'
      return safe.endsWith('.png') ? safe : `${safe}.png`
    }

    const useRecommendedBannerName = () => {
      if (!bannerNameRecommended.value) return
      bannerName.value = bannerNameRecommended.value
      bannerNameValid.value = true
      bannerNameRecommended.value = ''
    }

    const validateBannerName = async (immediate = false): Promise<boolean> => {
      const name = bannerName.value.trim()
      if (!name) {
        bannerNameValid.value = true
        bannerNameRecommended.value = ''
        return false
      }
      if (bannerEditingId.value && name === bannerOriginalName.value) {
        bannerNameValid.value = true
        bannerNameRecommended.value = ''
        return true
      }

      const run = async () => {
        bannerNameCheckLoading.value = true
        try {
          const res = await bannerOverlayValidateNameRequest(name)
          const data = res?.data?.data || {}
          bannerNameValid.value = !!data.is_valid
          bannerNameRecommended.value = data.recommended_name || ''
          return bannerNameValid.value
        } catch (error) {
          console.error('Validate banner name failed:', error)
          bannerNameValid.value = true
          bannerNameRecommended.value = ''
          return true
        } finally {
          bannerNameCheckLoading.value = false
        }
      }

      if (immediate) {
        if (bannerNameCheckTimer) {
          clearTimeout(bannerNameCheckTimer)
          bannerNameCheckTimer = null
        }
        return await run()
      }

      if (bannerNameCheckTimer) clearTimeout(bannerNameCheckTimer)
      bannerNameCheckTimer = setTimeout(() => {
        run()
      }, 300)
      return true
    }

    async function saveBanner() {
      if (!bannerName.value.trim()) {
        ElMessage.warning('请输入横幅名称')
        return
      }
      if (!bannerSelectedDH.value) {
        ElMessage.warning('请选择数字人')
        return
      }
      if (!bannerImageUrl.value) {
        ElMessage.warning('请上传横幅图片')
        return
      }

      await ensureBannerAssetsReady()

      if (!bannerBackgroundBase64.value || !bannerOverlayBase64.value) {
        ElMessage.warning('缺少底图或横幅图数据，无法保存')
        return
      }
      const passNameCheck = await validateBannerName(true)
      if (!passNameCheck) {
        ElMessage.warning('横幅名称重复，请修改后再保存')
        return
      }

      bannerSaving.value = true
      try {
        const isEdit = !!bannerEditingId.value
        const { backendRotate } = getOverlayMetrics()
        const title = bannerName.value.trim()
        const commonPayload: any = {
          title,
          x: Number(bannerX.value.toFixed(2)),
          y: Number(bannerY.value.toFixed(2)),
          scale_x: Number(bannerScaleX.value.toFixed(4)),
          scale_y: Number(bannerScaleY.value.toFixed(4)),
          rotate: Number(backendRotate.toFixed(2)),
          opacity: Number(bannerOpacity.value.toFixed(2))
        }

        let resp: any
        if (isEdit) {
          const updatePayload: any = {
            bannerOverlayId: Number(bannerEditingId.value),
            ...commonPayload
          }
          if (bannerBackgroundBase64.value) {
            updatePayload.background_base64 = stripDataUrlPrefix(bannerBackgroundBase64.value)
          }
          if (bannerOverlayBase64.value) {
            updatePayload.overlay_base64 = stripDataUrlPrefix(bannerOverlayBase64.value)
          }
          if (updatePayload.background_base64 || updatePayload.overlay_base64) {
            updatePayload.file_name = buildBannerFileName(title)
          }
          resp = await bannerOverlayUpdateRequest(updatePayload)
        } else {
          resp = await bannerOverlaySave({
            ...commonPayload,
            background_base64: stripDataUrlPrefix(bannerBackgroundBase64.value),
            overlay_base64: stripDataUrlPrefix(bannerOverlayBase64.value),
            file_name: buildBannerFileName(title),
            background_url: /^https?:\/\//.test(bannerDHCoverUrl.value) ? bannerDHCoverUrl.value : '',
            overlay_url: /^https?:\/\//.test(bannerImageUrl.value) ? bannerImageUrl.value : ''
          })
        }

        const root = resp?.data?.data ?? resp?.data ?? {}
        bannerEditingId.value = Number(root?.id ?? bannerEditingId.value ?? bannerIdSeed.value++)
        bannerPage.currentPage = 1
        await fetchBannerList()
        bannerMode.value = 'list'
        ElMessage.success(isEdit ? '横幅配置已更新' : '横幅配置已保存')
      } catch (error) {
        console.error('Save banner failed:', error)
        ElMessage.error('横幅保存失败，请稍后重试')
      } finally {
        bannerSaving.value = false
      }
    }
    // 鈹€鈹€ 妯箙绠＄悊 end 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    
    // 音频播放相关
    const audioPlayer = ref(null as HTMLAudioElement | null)
    const currentPlayingVoice = ref(null as any)
    const currentAudioObjectUrl = ref('')

    const revokeCurrentAudioObjectUrl = () => {
      if (!currentAudioObjectUrl.value) {
        return
      }
      URL.revokeObjectURL(currentAudioObjectUrl.value)
      currentAudioObjectUrl.value = ''
    }

    const resetAudioPlayer = () => {
      if (audioPlayer.value) {
        ;(audioPlayer.value as any)._aborted = true
        audioPlayer.value.pause()
        audioPlayer.value.removeAttribute('src')
        audioPlayer.value.load?.()
        audioPlayer.value = null
      }
      revokeCurrentAudioObjectUrl()
      currentPlayingVoice.value = null
    }

    const resolveVoicePreviewSource = async (voice: any): Promise<{ src: string; objectUrl: string }> => {
      const normalizedUrl = normalizeAssetUrl(voice?.url)
      if (!normalizedUrl) {
        return { src: '', objectUrl: '' }
      }

      try {
        const res = await downloadFileByProxy(normalizedUrl, voice?.id, 'audio')
        const blob = res.data as Blob
        if (blob instanceof Blob) {
          const objectUrl = URL.createObjectURL(blob)
          return {
            src: objectUrl,
            objectUrl,
          }
        }
      } catch (error) {
        console.warn('声音试听代理拉流失败，回退到原始地址播放', error)
      }

      return {
        src: normalizedUrl,
        objectUrl: '',
      }
    }
    
    // 鎼滅储鏁版嵁鍒濆鍖?
    const searchVoice = ref('')
    const searchDH = ref('')
    const filterVoiceTag = ref('')
    const filterDHTag = ref('')
    const searchRelVoice = ref('')
    const searchRelDH = ref('')
    const searchRelTag = ref('')

    // 分页数据
    const voicePage = reactive({ currentPage: 1, pageSize: 10 })
    const dhPage = reactive({ currentPage: 1, pageSize: 10 })
    const relPage = reactive({ currentPage: 1, pageSize: 10 })

    // 编辑弹窗相关
    const dialogVisible = ref(false)
    const tagInputVisible = ref(false)
    const tagInputRef = ref(null)
    const newTag = ref('')
    const editForm = reactive({
      id: null,
      name: '',
      tags: [] as string[],
      originalRow: null as any
    })

    // 关系新增相关
    const addRelVisible = ref(false)
    const editRelVisible = ref(false)
    const searchAddVoice = ref('')
    const searchAddDH = ref('')
    const selectedVoiceIds = ref<number[]>([])
    const selectedDHIds = ref<number[]>([])
    const voicesForDialog = ref<any[]>([])
    const digitalHumansForDialog = ref<any[]>([])
    const voiceDialogPage = reactive({ currentPage: 1, pageSize: 20, total: 0, loading: false })
    const dhDialogPage = reactive({ currentPage: 1, pageSize: 20, total: 0, loading: false })
    const voiceTableRef = ref(null)
    const dhTableRef = ref(null)
      const tagManagerRef = ref(null)
      const relTagManagerRef = ref(null)

    const isAddRelTag = ref(false)
    const bulkRelTags = ref<string[]>([])
    const bulkTagInput = ref('')

    const editRelForm = reactive<any>({
      id: null,
      voiceId: null,
      voiceName: '',
      digitalHumanId: null,
      digitalHumanName: '',
      tags: [],
      originalRow: null
    })

    const sourceMap: { [key: number]: string } = {
        1: 'a2e',
        2: '即创'
    }

    const splitTags = (tags: string | string[] | null | undefined) => {
      if (!tags) return []
      if (Array.isArray(tags)) {
        return tags.filter((t: string) => t && t.toString().trim() !== '')
      }
      return tags.split('|').map(t => t.trim()).filter(t => t !== '')
    }

    // 过滤逻辑
    const filteredVoices = computed(() => {
        return voices.value.filter((v: any) => {
            const nameMatch = v.name.toLowerCase().includes(searchVoice.value.toLowerCase())
            const tagMatch = !filterVoiceTag.value || v.type.toLowerCase().includes(filterVoiceTag.value.toLowerCase())
            return nameMatch && tagMatch
        })
    })

    const filteredDigitalHumans = computed(() => {
        return digitalHumans.value.filter((v: any) => {
            const nameMatch = v.digitalHumanName && v.digitalHumanName.toLowerCase().includes(searchDH.value.toLowerCase())
            // 娉細API杩斿洖鐨勬暟鎹腑娌℃湁type瀛楁锛屽彲浠ユ牴鎹疄闄呭瓧娈佃皟鏁?
            return nameMatch
        })
    })

    // 分页截取逻辑
    const paginatedVoices = computed(() => {
      // 澹伴煶鏁版嵁宸茬粡鏄垎椤垫煡璇㈢殑缁撴灉锛岀洿鎺ヨ繑鍥?
      return voices.value
    })

    const paginatedDigitalHumans = computed(() => {
      // 数字人数据已经是分页查询的结果，直接返回
      return digitalHumans.value
    })

    const paginatedRelations = computed(() => {
      return relations.value
    })

    // 弹窗内的过滤逻辑
    const filteredAddVoices = computed(() => {
      return voicesForDialog.value.filter((v: any) => 
        (v.voiceName || '').toLowerCase().includes(searchAddVoice.value.toLowerCase())
      )
    })

    const filteredAddDHs = computed(() => {
      return digitalHumansForDialog.value.filter((d: any) => 
        (d.digitalHumanName || '').toLowerCase().includes(searchAddDH.value.toLowerCase())
      )
    })

    const selectedVoices = computed(() => {
      const selectedIdSet = new Set(selectedVoiceIds.value)
      return voicesForDialog.value.filter((voice: any) => selectedIdSet.has(Number(voice?.id)))
    })

    const selectedDHs = computed(() => {
      const selectedIdSet = new Set(selectedDHIds.value)
      return digitalHumansForDialog.value.filter((digitalHuman: any) => selectedIdSet.has(Number(digitalHuman?.id)))
    })

    const fetchData = async () => {
      try {
        await fetchRelations()
        
        // 澹伴煶鍜屾暟瀛椾汉閮戒娇鐢ㄥ垎椤垫煡璇?
        await fetchVoices()
        await fetchDigitalHumans()
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    const fetchRelations = async () => {
      try {
        const searchObj: any = {}
        if (searchRelVoice.value) Object.assign(searchObj, { voiceName: searchRelVoice.value })
        if (searchRelDH.value) Object.assign(searchObj, { digitalHumanName: searchRelDH.value })
        if (searchRelTag.value) Object.assign(searchObj, { title: searchRelTag.value })

        const bRes = await getBindingList(relPage.currentPage, relPage.pageSize, searchObj)
        relations.value = bRes.data?.data?.data || []
        relationsTotal.value = bRes.data?.data?.total || 0
      } catch (error) {
        console.error('Failed to fetch relations:', error)
      }
    }

    const fetchVoices = async () => {
      try {
        const searchObj = {}
        // 浼犻€掓悳绱㈡潯浠跺埌API
        if (searchVoice.value) Object.assign(searchObj, { voiceName: searchVoice.value })
        if (filterVoiceTag.value) Object.assign(searchObj, { title: filterVoiceTag.value })
        
        const res = await getVoicePaginateList(voicePage.currentPage, voicePage.pageSize, searchObj)
        if (res.data.code === 200 && res.data.data) {
          voices.value = res.data.data.data || []
          voicesTotal.value = res.data.data.total || 0
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error)
      }
    }

    const fetchDigitalHumans = async () => {
      try {
        const searchObj = {}
        // 浼犻€掓悳绱㈡潯浠跺埌API
        if (searchDH.value) Object.assign(searchObj, { digitalHumanName: searchDH.value })
        if (filterDHTag.value) Object.assign(searchObj, { title: filterDHTag.value })
        
        const res = await getDigitalHumanPaginateList(dhPage.currentPage, dhPage.pageSize, searchObj)
        if (res.data.code === 200 && res.data.data) {
          digitalHumans.value = res.data.data.data || []
          digitalHumansTotal.value = res.data.data.total || 0
        }
      } catch (error) {
        console.error('Failed to fetch digital humans:', error)
      }
    }

    const resetVoiceSearch = () => {
      searchVoice.value = ''
      filterVoiceTag.value = ''
      voicePage.currentPage = 1
      fetchVoices()
    }

    const resetDHSearch = () => {
      searchDH.value = ''
      filterDHTag.value = ''
      dhPage.currentPage = 1
      fetchDigitalHumans()
    }

    const resetRelSearch = () => {
      searchRelVoice.value = ''
      searchRelDH.value = ''
      searchRelTag.value = ''
      relPage.currentPage = 1
      fetchRelations()
    }

    // 关系管理操作
    const fetchVoicesForDialog = async () => {
      try {
        const res = await getVoicePaginateList(1, 999)
        if (res.data.code === 200 && res.data.data) {
          voicesForDialog.value = res.data.data.data || []
        }
      } catch (error) {
        console.error('Failed to fetch voices for dialog:', error)
      }
    }

    const fetchDigitalHumansForDialog = async () => {
      try {
        const res = await getDigitalHumanPaginateList(1, 999)
        if (res.data.code === 200 && res.data.data) {
          digitalHumansForDialog.value = res.data.data.data || []
        }
      } catch (error) {
        console.error('Failed to fetch digital humans for dialog:', error)
      }
    }

    const handleVoiceTableScroll = () => {}
    const handleDHTableScroll = () => {}

    const attachScrollListeners = () => {}
    const detachScrollListeners = () => {}

    const handleSearchAddVoiceChange = () => {}

    const openAddRelDialog = async () => {
      searchAddVoice.value = ''
      searchAddDH.value = ''
      selectedVoiceIds.value = []
      selectedDHIds.value = []
      isAddRelTag.value = false
      bulkRelTags.value = []
      bulkTagInput.value = ''
      
      voicesForDialog.value = []
      digitalHumansForDialog.value = []
      
      // 涓€娆″姞杞芥墍鏈夋暟鎹紙鏈€澶?99鏉★級
      await Promise.all([
        fetchVoicesForDialog(),
        fetchDigitalHumansForDialog()
      ])
      
      addRelVisible.value = true
    }

    const addBulkRelTag = () => {
      const tag = bulkTagInput.value.trim()
      if (tag && !bulkRelTags.value.includes(tag) && bulkRelTags.value.length < 5) {
        bulkRelTags.value.push(tag)
        bulkTagInput.value = ''
      }
    }

    const getDialogRowKey = (row: any) => row?.id

    const normalizeDialogRowId = (row: any) => Number(row?.id || 0)

    const toggleSelectedIds = (selectedIds: number[], row: any) => {
      const targetId = normalizeDialogRowId(row)
      if (!targetId) return selectedIds
      return selectedIds.includes(targetId)
        ? selectedIds.filter(id => id !== targetId)
        : [...selectedIds, targetId]
    }

    const isVoiceSelected = (row: any) => {
      return selectedVoiceIds.value.includes(normalizeDialogRowId(row))
    }

    const isDHSelected = (row: any) => {
      return selectedDHIds.value.includes(normalizeDialogRowId(row))
    }

    const toggleVoiceSelection = (row: any) => {
      selectedVoiceIds.value = toggleSelectedIds(selectedVoiceIds.value, row)
    }

    const toggleDHSelection = (row: any) => {
      selectedDHIds.value = toggleSelectedIds(selectedDHIds.value, row)
    }

    const handleVoiceRowClick = (row: any) => {
      toggleVoiceSelection(row)
    }

    const handleDHRowClick = (row: any) => {
      toggleDHSelection(row)
    }

    const saveRelations = async () => {
      const resolvedVoices = selectedVoices.value
      const resolvedDHs = selectedDHs.value

      if (resolvedVoices.length === 0 || resolvedDHs.length === 0) return
      
      const sharedTags = isAddRelTag.value ? `|${bulkRelTags.value.join('|')}|` : ''
      
      try {
        let successCount = 0
        // 绗涘崱灏旂Н鐢熸垚骞跺垱寤?
        for (const v of resolvedVoices) {
          for (const d of resolvedDHs) {
            const bindingData = {
              voiceId: v.id,
              digitalHumanId: d.id,
              title: sharedTags
            }
            
            const res = await createBinding(bindingData)
            if (res.data.code === 200) {
              successCount++
            }
          }
        }

        // 鍒涘缓瀹屾垚鍚庨噸鏂拌姹傚垎椤垫帴鍙ｅ埛鏂?
        relPage.currentPage = 1
        await fetchRelations()

        addRelVisible.value = false
        ElMessage.success(`成功生成 ${successCount} 条绑定关系`)
      } catch (error) {
        console.error('创建绑定关系失败:', error)
        ElMessage.error('创建绑定关系失败，请重试')
      }
    }

    const handleEditRel = (row: any) => {
      editRelForm.id = row.id
      editRelForm.voiceId = row.voiceId
      editRelForm.voiceName = row.voiceName
      editRelForm.digitalHumanId = row.digitalHumanId
      editRelForm.digitalHumanName = row.digitalHumanName
      editRelForm.tags = splitTags(row.title)
      editRelForm.originalRow = row
      
      editRelVisible.value = true
    }

    const handleEditRelTagsChange = (tags: string[]) => {
      editRelForm.tags = Array.isArray(tags) ? [...tags] : []
    }

    const saveEditRel = async () => {
      const row = editRelForm.originalRow
      
      try {
        const selectedTags = Array.isArray(editRelForm.tags) ? editRelForm.tags : []
        const tagsStr = selectedTags.length ? `|${selectedTags.join('|')}|` : ''
        const updateData = {
          title: tagsStr
        }
        
        const res = await updateBinding(row.id, updateData)
        if (res.data.code === 200) {
          // 更新本地数据
          Object.assign(row, res.data.data)
          editRelVisible.value = false
          ElMessage.success('绑定关系更新成功')
        }
      } catch (error) {
        console.error('更新绑定关系失败:', error)
        ElMessage.error('更新绑定关系失败，请重试')
      }
    }

    // 音频播放功能
    const playVoice = async (voice: any) => {
      const normalizedUrl = normalizeAssetUrl(voice?.url)
      if (!normalizedUrl) {
        ElMessage.warning('该声音文件不存在')
        return
      }

      // 同一个音频：切换播放/暂停
      if (audioPlayer.value && currentPlayingVoice.value === voice) {
        if (audioPlayer.value.paused) {
          audioPlayer.value.play().catch(() => {})
        } else {
          audioPlayer.value.pause()
        }
        return
      }

      // 不同音频：停止当前，播放新的
      resetAudioPlayer()
      currentPlayingVoice.value = voice

      const { src, objectUrl } = await resolveVoicePreviewSource(voice)
      if (!src) {
        currentPlayingVoice.value = null
        ElMessage.warning('该声音文件不存在')
        return
      }

      if (currentPlayingVoice.value !== voice) {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
        return
      }

      if (objectUrl) {
        currentAudioObjectUrl.value = objectUrl
      }

      const audio = new Audio()
      audioPlayer.value = audio

      audio.addEventListener('error', () => {
        if ((audio as any)._aborted) return
        ElMessage.error('音频播放失败，请检查文件地址')
        resetAudioPlayer()
      })

      audio.src = src
      audio.play().catch(error => {
        ElMessage.error('音频播放失败: ' + (error.message || ''))
        resetAudioPlayer()
      })

      audio.onended = () => {
        resetAudioPlayer()
      }
    }

    const handleEdit = async (row: any) => {
      editForm.id = row.externalId || row.id
      // 根据当前标签页设置正确的字段
      if (activeName.value === 'digitalHuman') {
        editForm.name = row.digitalHumanName || ''
      } else {
        editForm.name = row.voiceName || ''
      }
      editForm.tags = splitTags(row.title)
      editForm.originalRow = row
      newTag.value = ''
      tagInputVisible.value = false
      dialogVisible.value = true
    }

    const showTagInput = () => {
      tagInputVisible.value = true
      nextTick(() => {
        ;(tagInputRef.value as any)?.focus()
      })
    }

    const hideTagInput = () => {
      tagInputVisible.value = false
      newTag.value = ''
    }

    const addTag = (targetForm: any, limit: number) => {
      const tag = newTag.value.trim()
      if (!tag) {
        hideTagInput()
        return
      }
      if (targetForm.tags.includes(tag)) {
        ElMessage.warning('标签已存在')
        return
      }
      if (targetForm.tags.length >= limit) {
        ElMessage.warning(`最多只能添加 ${limit} 个标签`)
        hideTagInput()
        return
      }
      targetForm.tags.push(tag)
      newTag.value = ''
      nextTick(() => {
        ;(tagInputRef.value as any)?.focus()
      })
    }

    const removeTag = (targetForm: any, index: number) => {
      targetForm.tags.splice(index, 1)
    }

    const saveEdit = async () => {
      if (!editForm.name.trim()) {
        return ElMessage.error('名称不能为空')
      }
      
      try {
          // 声音编辑时从 TagManager 读取选中标签
          const tagsStr = ''

          if (activeName.value === 'digitalHuman') {
          // 鏇存柊鏁板瓧浜?
          const row = editForm.originalRow
          const updateData = {
            digital_human_name: editForm.name,
            title: tagsStr,
            cover_url: row.coverUrl || '',
            language: row.language || '',
            gender: row.gender || ''
          }
          
          const res = await updateDigitalHuman(row.id, updateData)
          if (res.data.code === 200) {
            // 更新本地数据
            row.digitalHumanName = editForm.name
            row.title = tagsStr
            ElMessage.success('保存成功')
            dialogVisible.value = false
          }
        } else {
          // 更新声音
          const row = editForm.originalRow
          const updateData = {
            voice_name: editForm.name,
            title: tagsStr,
            url: row.url || ''
          }
          
          const res = await updateVoice(row.id, updateData)
          if (res.data.code === 200) {
            // 更新本地数据
            row.voiceName = editForm.name
            row.title = tagsStr
            ElMessage.success('保存成功')
            dialogVisible.value = false
          }
        }
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败，请重试')
      }
    }

    const handleDelete = (row: any) => {
      ElMessageBox.confirm('确定要删除该项吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 鍒ゆ柇鏄惁鏄叧绯昏褰曪紙鏈塿oiceId鍜宒igitalHumanId锛?
          if (row.voiceId !== undefined && row.digitalHumanId !== undefined) {
            // 删除绑定关系
            const res = await deleteBinding(row.id)
            if (res.data.code === 200) {
              // 从列表中移除
              const index = relations.value.findIndex((r: any) => r.id === row.id)
              if (index > -1) {
                relations.value.splice(index, 1)
              }
              ElMessage.success('绑定关系已删除')
            }
          } else if (activeName.value === 'voice') {
            // 删除声音素材
            const res = await deleteVoice(row.id)
            if (res.data.code === 200) {
              // 从列表中移除
              const index = voices.value.findIndex((v: any) => v.id === row.id)
              if (index > -1) {
                voices.value.splice(index, 1)
              }
              ElMessage.success('声音已删除')
              // 閲嶆柊鍔犺浇澹伴煶鍜屽叧绯荤鐞嗗垪琛?
              await Promise.all([
                fetchVoices(),
                fetchData()
              ])
            }
          } else if (activeName.value === 'digitalHuman') {
            // 鍒犻櫎鏁板瓧浜虹礌鏉?
            const res = await deleteDigitalHuman(row.id)
            if (res.data.code === 200) {
              // 从列表中移除
              const index = digitalHumans.value.findIndex((dh: any) => dh.id === row.id)
              if (index > -1) {
                digitalHumans.value.splice(index, 1)
              }
              ElMessage.success('数字人已删除')
              // 重新加载数字人和关系管理列表
              await Promise.all([
                fetchDigitalHumans(),
                fetchData()
              ])
            }
          } else {
            ElMessage.success('删除成功')
          }
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败，请重试')
        }
      })
    }

    // 鐩戝惉瀵硅瘽妗嗘墦寮€/鍏抽棴锛岀鐞嗘粴鍔ㄧ洃鍚?
    watch(() => addRelVisible.value, (newVal) => {
      if (newVal) {
        attachScrollListeners()
      } else {
        detachScrollListeners()
      }
    })

    onMounted(() => {
      fetchData()
    })

    onUnmounted(() => {
      detachBannerDHDropdownScroll()
      if (bannerNameCheckTimer) {
        clearTimeout(bannerNameCheckTimer)
        bannerNameCheckTimer = null
      }
      resetAudioPlayer()
    })

    // 鐩戝惉鏁板瓧浜哄垎椤靛彉鍖?
    watch(() => [dhPage.currentPage, dhPage.pageSize], () => {
      fetchDigitalHumans()
    }, { deep: true })
    
    // 监听声音分页变化
    watch(() => [voicePage.currentPage, voicePage.pageSize], () => {
      fetchVoices()
    }, { deep: true })
    
    // 监听搜索条件变化
    watch(() => searchDH.value, () => {
      dhPage.currentPage = 1 // 閲嶇疆鍒扮涓€椤?
      fetchDigitalHumans()
    })
    
    // 监听声音搜索条件变化
    watch(() => searchVoice.value, () => {
      voicePage.currentPage = 1 // 閲嶇疆鍒扮涓€椤?
      fetchVoices()
    })
    
    // 监听标签搜索条件变化
    watch(() => filterDHTag.value, () => {
      dhPage.currentPage = 1 // 閲嶇疆鍒扮涓€椤?
      fetchDigitalHumans()
    })
    
    // 监听声音标签搜索条件变化
    watch(() => filterVoiceTag.value, () => {
      voicePage.currentPage = 1 // 閲嶇疆鍒扮涓€椤?
      fetchVoices()
    })

    // 监听关系分页变化
    watch(() => [relPage.currentPage, relPage.pageSize], () => {
      fetchRelations()
    }, { deep: true })

    watch(() => [searchRelVoice.value, searchRelDH.value, searchRelTag.value], () => {
      relPage.currentPage = 1
      fetchRelations()
    })

    watch(() => activeName.value, (newTab) => {
      if (newTab === 'banner' && bannerMode.value === 'list') {
        fetchBannerList()
      }
    })

    watch(() => [bannerPage.currentPage, bannerPage.pageSize], () => {
      if (activeName.value === 'banner' && bannerMode.value === 'list') {
        fetchBannerList()
      }
    }, { deep: true })

    watch(() => bannerSelectedDH.value, (newVal, oldVal) => {
      if (newVal === oldVal) return
      onBannerDHChange(newVal as number | null)
    })

    watch(() => [bannerX.value, bannerY.value, bannerScaleX.value, bannerScaleY.value, bannerRotate.value, bannerOpacity.value], () => {
      if (bannerEditInitializing) return
      clampBannerPosition()
      requestBannerPreview()
    })

    watch(() => bannerName.value, () => {
      validateBannerName(false)
    })

    return {
      activeName,
      voices,
      digitalHumans,
      digitalHumansTotal,
      voicesTotal,
      relations,
      searchVoice,
      searchDH,
      filterVoiceTag,
      filterDHTag,
      searchRelVoice,
      searchRelDH,
      searchRelTag,
      sourceMap,
      splitTags,
      filteredVoices,
      filteredDigitalHumans,
      paginatedVoices,
      paginatedDigitalHumans,
      paginatedRelations,
      relationsTotal,
      voicePage,
      dhPage,
      relPage,
      dialogVisible,
      editRelVisible,
      editRelForm,
      handleEditRelTagsChange,
      isAddRelTag,
      bulkRelTags,
      bulkTagInput,
      editForm,
      newTag,
      tagInputVisible,
      tagInputRef,
      addRelVisible,
      searchAddVoice,
      searchAddDH,
      selectedVoices,
      selectedDHs,
      filteredAddVoices,
      filteredAddDHs,
      voicesForDialog,
      digitalHumansForDialog,
      voiceDialogPage,
      dhDialogPage,
      fetchData,
      fetchVoices,
      fetchDigitalHumans,
      resetVoiceSearch,
      resetDHSearch,
      resetRelSearch,
      fetchRelations,
      handleEdit,
      handleDelete,
      addTag,
      removeTag,
      saveEdit,
      showTagInput,
      hideTagInput,
      openAddRelDialog,
      fetchVoicesForDialog,
      fetchDigitalHumansForDialog,
      voiceTableRef,
        tagManagerRef,
        relTagManagerRef,
      dhTableRef,
      addBulkRelTag,
      handleVoiceRowClick,
      handleDHRowClick,
      isVoiceSelected,
      isDHSelected,
      toggleVoiceSelection,
      toggleDHSelection,
      getDialogRowKey,
      saveRelations,
      handleEditRel,
      saveEditRel,
      playVoice,
      // 横幅管理
      bannerMode,
      bannerEditingId,
      bannerList,
      bannerPage,
      bannerName,
      bannerNameCheckLoading,
      bannerNameValid,
      bannerNameRecommended,
      bannerSelectedDH,
      bannerDHOptions,
      bannerDHLoading,
      bannerDHCoverUrl,
      bannerImageUrl,
      bannerBgNaturalWidth,
      bannerBgNaturalHeight,
      bannerPreviewImageUrl,
      bannerPreviewDialog,
      bannerPreviewLoading,
      bannerPreviewError,
      bannerSaving,
      bannerX,
      bannerY,
      bannerScaleX,
      bannerScaleY,
      bannerRotate,
      bannerOpacity,
      bannerPreviewRef,
      bannerDragBoxStyle,
      validateBannerName,
      useRecommendedBannerName,
      onBannerDHSearch,
      onBannerDHVisibleChange,
      onBannerDHChange,
      onBannerImageChange,
      startBannerDrag,
      startBannerResize,
      startBannerRotate,
      resetBanner,
      openCreateBanner,
      cancelBannerEdit,
      editBanner,
      deleteBanner,
      openBannerPreview,
      saveBanner
    }
  }
})
</script>

<style scoped>
.material-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.custom-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.1);
}

.context-label {
  display: none;
}

.filter-header {
  transition: all 0.3s ease;
}

/* 标签管理样式优化 */
.tag-manager-box {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.button-new-tag {
  border-style: dashed;
  height: 24px;
  line-height: 22px;
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.el-tabs__header) {
  margin: 0;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  border-radius: 8px 8px 0 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
}

.banner-upload-wrap {
  width: 100%;
}

:deep(.banner-upload) {
  width: 100%;
}

:deep(.banner-upload .el-upload) {
  width: 100%;
}

:deep(.banner-upload .el-upload-dragger) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.banner-resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: #2f80ff;
  cursor: nwse-resize;
}

.banner-rotate-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  left: 50%;
  top: -16px;
  transform: translateX(-50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: #22c55e;
  cursor: grab;
}

.banner-thumb-bg {
  background-color: #f6f7fb;
  background-image:
    linear-gradient(45deg, #e6e8ef 25%, transparent 25%),
    linear-gradient(-45deg, #e6e8ef 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e6e8ef 75%),
    linear-gradient(-45deg, transparent 75%, #e6e8ef 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.banner-preview-only {
  width: min(48vw, 360px);
  height: min(78vh, 640px);
  margin: 0 auto;
  border: 2px solid #3b82f6;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}

.banner-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>

