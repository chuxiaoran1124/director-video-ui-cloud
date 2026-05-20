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

      <!-- 数字人管理 -->
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

      <!-- 横幅管理 Tab（临时隐藏）
      <el-tab-pane label="横幅管理" name="banner">
        <div class="p-5 bg-white rounded-b-lg">
          <template v-if="bannerMode === 'list'">
            <div class="flex items-center justify-between mb-4">
              <div class="text-base font-semibold text-gray-700">横幅图片列表</div>
              <el-button type="primary" icon="ElIconPlus" @click="openCreateBanner">新建横幅</el-button>
            </div>

            <el-table :data="bannerList" border stripe :header-cell-style="{ background: '#f8f9fb', color: '#606266' }">
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="name" label="横幅名称" min-width="140" align="center" />
              <el-table-column label="数字人" min-width="160" align="center">
                <template #default="scope">
                  <div class="flex items-center justify-center gap-2">
                    <el-avatar :size="24" shape="square" :src="scope.row.dhCoverUrl" />
                    <span>{{ scope.row.dhName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="横幅图" min-width="160" align="center">
                <template #default="scope">
                  <img :src="scope.row.imageUrl" class="w-28 h-12 object-cover rounded-md border border-gray-200" />
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

            <el-empty v-if="bannerList.length === 0" description="暂无横幅，点击右上角新建" :image-size="86" />
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
                  <el-input v-model="bannerName" maxlength="30" show-word-limit placeholder="请输入横幅名称" />
                </div>

                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div class="text-sm font-semibold text-gray-700 mb-3">① 选择数字人</div>
                  <el-select
                    v-model="bannerSelectedDH"
                    placeholder="请选择数字人"
                    filterable
                    clearable
                    style="width: 100%"
                    @change="onBannerDHChange"
                  >
                    <el-option
                      v-for="dh in digitalHumans"
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
                      <span class="text-xs text-gray-500">横幅高度</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerHeight }}px</span>
                    </div>
                    <el-slider v-model="bannerHeight" :min="20" :max="400" :step="1" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">横幅宽度</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerWidth }}%</span>
                    </div>
                    <el-slider v-model="bannerWidth" :min="20" :max="100" :step="1" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">垂直位置（距底部 %）</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerY }}%</span>
                    </div>
                    <el-slider v-model="bannerY" :min="0" :max="100" :step="1" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-500">横幅透明度</span>
                      <span class="text-xs text-blue-600 font-medium">{{ bannerOpacity }}%</span>
                    </div>
                    <el-slider v-model="bannerOpacity" :min="10" :max="100" :step="5" />
                  </div>
                </div>

                <div class="flex gap-2">
                  <el-button style="flex:1" @click="resetBanner">重置</el-button>
                  <el-button type="primary" style="flex:1" @click="saveBanner">保存配置</el-button>
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
                    v-if="bannerDHCoverUrl"
                    :src="bannerDHCoverUrl"
                    class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <el-icon style="font-size:48px;margin-bottom:8px"><user /></el-icon>
                    <span class="text-xs">请先选择数字人</span>
                  </div>

                  <div
                    v-if="bannerImageUrl"
                    class="absolute left-1/2 cursor-move overflow-hidden"
                    :style="bannerOverlayStyle"
                    @mousedown.self="startBannerDrag"
                  >
                    <img
                      :src="bannerImageUrl"
                      draggable="false"
                      class="w-full h-full object-cover pointer-events-none"
                    />
                    <div
                      class="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center cursor-s-resize"
                      style="background:rgba(0,0,0,0.3)"
                      @mousedown.stop="startBannerResize"
                    >
                      <div style="width:32px;height:2px;background:rgba(255,255,255,0.7);border-radius:2px" />
                    </div>
                  </div>
                  <div v-else-if="bannerSelectedDH" class="absolute bottom-0 left-0 right-0 text-center text-xs pb-3" style="color:rgba(255,255,255,0.5)">
                    请上传横幅图片
                  </div>

                  <div class="absolute top-2 right-2 text-[10px] rounded px-1.5 py-0.5" style="color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.3)">
                    预览 360×640
                  </div>
                </div>
                <div class="mt-3 text-xs text-gray-400 text-center">
                  可在预览区拖拽横幅调整位置 · 底部手柄可拖拽调节高度
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>
      -->

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

        <!-- 数字人编辑 -->
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
        <!-- 左侧选择器 -->
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
              <el-table ref="voiceTableRef" :data="filteredAddVoices" height="100%" size="mini" @selection-change="handleVoiceSelectionChange" class="flex-1">
                <el-table-column type="selection" width="35" />
                <el-table-column prop="voiceName" label="名称" show-overflow-tooltip />
              </el-table>
            </div>

            <!-- 数字人选择 -->
            <div class="flex-1 flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="p-2 bg-green-50 border-b font-medium text-xs flex justify-between">
                <span>2. 选择数字人</span>
                <span class="text-green-600">{{ selectedDHs.length }} 个</span>
              </div>
              <div class="p-2">
                <el-input v-model="searchAddDH" placeholder="搜索数字人..." size="mini" prefix-icon="ElIconSearch" />
              </div>
              <el-table ref="dhTableRef" :data="filteredAddDHs" height="100%" size="mini" @selection-change="handleDHSelectionChange" class="flex-1">
                <el-table-column type="selection" width="35" />
                <el-table-column prop="digitalHumanName" label="名称" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </div>

        <!-- 右侧：关系配置 -->
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
                将生成 <span class="font-bold text-blue-900">{{ selectedVoices.length * selectedDHs.length }}</span> 条绑定项。
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addRelVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!selectedVoices.length || !selectedDHs.length" @click="saveRelations">确认生成</el-button>
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
            <div>· 单击标签 — 选中/取消选中</div>
            <div>· 双击标签 — 编辑名称</div>
            <div>· 点 + — 新建标签</div>
          </div>
        </div>
        <div class="w-[400px] flex-shrink-0">
          <TagManager ref="relTagManagerRef" :initial-tags="editRelForm.tags" />
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
import { defineComponent, ref, onMounted, computed, reactive, nextTick, watch } from 'vue'
import TagManager from '/@/components/TagManager/index.vue'
import { getDigitalHumanPaginateList, updateDigitalHuman, updateVoice, deleteVoice, deleteDigitalHuman, getVoicePaginateList, getBindingList, createBinding, updateBinding, deleteBinding } from '/@/api/material/index'
import { ElMessage, ElMessageBox } from 'element-plus'

export default defineComponent({
  name: 'MaterialManagement',
  components: {
    TagManager
  },
  setup() {
    const activeName = ref('voice')
    const voices = ref([])
    const digitalHumans = ref([])
    const digitalHumansTotal = ref(0) // 数字人总数
    const voicesTotal = ref(0) // 声音总数
    const relations = ref([])
    const relationsTotal = ref(0)

    // ── 横幅管理 ──────────────────────────────────────────────
    const bannerMode = ref<'list' | 'edit'>('list')
    const bannerEditingId = ref<number | null>(null)
    const bannerIdSeed = ref(1)

    const bannerList = ref<any[]>([])
    const bannerName = ref('')
    const bannerSelectedDH = ref<number | null>(null)
    const bannerSelectedDHName = ref('')
    const bannerDHCoverUrl = ref('')
    const bannerImageUrl = ref('')
    const bannerHeight = ref(80)
    const bannerWidth = ref(100)
    const bannerY = ref(10)          // 距底部百分比
    const bannerOpacity = ref(100)   // 0-100

    // 预览区 DOM 引用（拖拽时用于换算坐标）
    const bannerPreviewRef = ref<HTMLElement | null>(null)

    // 当前拖拽/缩放状态
    let _bannerDragState: {
      startMouseY: number; startBannerY: number
    } | null = null
    let _bannerResizeState: {
      startMouseY: number; startHeight: number
    } | null = null

    // 横幅叠层 style（基于预览容器 640px 高）
    const bannerOverlayStyle = computed(() => {
      const containerH = 640
      const h = bannerHeight.value
      // bottomPct 表示距底部百分比，转换为 top = containerH - h - bottomPx
      const bottomPx = (bannerY.value / 100) * containerH
      const topPx = Math.max(0, containerH - h - bottomPx)
      return {
        top: `${topPx}px`,
        height: `${h}px`,
        width: `${bannerWidth.value}%`,
        transform: 'translateX(-50%)',
        opacity: String(bannerOpacity.value / 100)
      }
    })

    function onBannerDHChange(id: number | null) {
      if (!id) {
        bannerSelectedDHName.value = ''
        bannerDHCoverUrl.value = ''
        return
      }
      const dh = (digitalHumans.value as any[]).find((d: any) => d.id === id)
      bannerSelectedDHName.value = dh?.digitalHumanName ?? ''
      bannerDHCoverUrl.value = dh?.coverUrl ?? ''
    }

    function onBannerImageChange(file: any) {
      if (file?.raw) {
        bannerImageUrl.value = URL.createObjectURL(file.raw)
      }
    }

    function startBannerDrag(e: MouseEvent) {
      const preview = bannerPreviewRef.value
      if (!preview) return
      _bannerDragState = { startMouseY: e.clientY, startBannerY: bannerY.value }
      const containerH = preview.offsetHeight

      const onMove = (ev: MouseEvent) => {
        if (!_bannerDragState) return
        const deltaY = ev.clientY - _bannerDragState.startMouseY
        // 向下拖 → bottomPx 减小（距底更近）
        const deltaPct = (deltaY / containerH) * 100
        const newY = Math.max(0, Math.min(100, _bannerDragState.startBannerY - deltaPct))
        bannerY.value = Math.round(newY)
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
      _bannerResizeState = { startMouseY: e.clientY, startHeight: bannerHeight.value }
      const onMove = (ev: MouseEvent) => {
        if (!_bannerResizeState) return
        const deltaY = ev.clientY - _bannerResizeState.startMouseY
        bannerHeight.value = Math.max(20, Math.min(400, _bannerResizeState.startHeight + deltaY))
      }
      const onUp = () => {
        _bannerResizeState = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    function resetBanner() {
      bannerSelectedDH.value = null
      bannerSelectedDHName.value = ''
      bannerDHCoverUrl.value = ''
      bannerName.value = ''
      bannerImageUrl.value = ''
      bannerHeight.value = 80
      bannerWidth.value = 100
      bannerY.value = 10
      bannerOpacity.value = 100
    }

    function openCreateBanner() {
      bannerEditingId.value = null
      resetBanner()
      bannerMode.value = 'edit'
    }

    function cancelBannerEdit() {
      bannerMode.value = 'list'
    }

    function editBanner(row: any) {
      bannerEditingId.value = row.id
      bannerName.value = row.name || ''
      bannerSelectedDH.value = row.dhId || null
      bannerSelectedDHName.value = row.dhName || ''
      bannerDHCoverUrl.value = row.dhCoverUrl || ''
      bannerImageUrl.value = row.imageUrl || ''
      bannerHeight.value = row.height || 80
      bannerWidth.value = row.width || 100
      bannerY.value = row.y || 10
      bannerOpacity.value = row.opacity || 100
      bannerMode.value = 'edit'
    }

    function deleteBanner(row: any) {
      bannerList.value = bannerList.value.filter((item: any) => item.id !== row.id)
      ElMessage.success('横幅已删除')
    }

    function saveBanner() {
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

      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

      const payload = {
        id: bannerEditingId.value || bannerIdSeed.value++,
        name: bannerName.value.trim(),
        dhId: bannerSelectedDH.value,
        dhName: bannerSelectedDHName.value,
        dhCoverUrl: bannerDHCoverUrl.value,
        imageUrl: bannerImageUrl.value,
        height: bannerHeight.value,
        width: bannerWidth.value,
        y: bannerY.value,
        opacity: bannerOpacity.value,
        updateTime
      }

      const editIdx = bannerList.value.findIndex((item: any) => item.id === payload.id)
      if (editIdx >= 0) {
        bannerList.value.splice(editIdx, 1, payload)
      } else {
        bannerList.value.unshift(payload)
      }

      bannerMode.value = 'list'
      ElMessage.success('横幅配置已保存')
    }
    // ── 横幅管理 end ──────────────────────────────────────────
    
    // 音频播放相关
    const audioPlayer = ref(null as HTMLAudioElement | null)
    const currentPlayingVoice = ref(null as any)
    
    // 搜索数据初始化
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
    const selectedVoices = ref<any[]>([])
    const selectedDHs = ref<any[]>([])
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
            // 注：API返回的数据中没有type字段，可以根据实际字段调整
            return nameMatch
        })
    })

    // 分页截取逻辑
    const paginatedVoices = computed(() => {
      // 声音数据已经是分页查询的结果，直接返回
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

    const fetchData = async () => {
      try {
        await fetchRelations()
        
        // 声音和数字人都使用分页查询
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
        // 传递搜索条件到API
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
        // 传递搜索条件到API
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
        console.log('Fetching all voices for dialog')
        const res = await getVoicePaginateList(1, 999)
        if (res.data.code === 200 && res.data.data) {
          voicesForDialog.value = res.data.data.data || []
          console.log('Voices loaded:', voicesForDialog.value.length)
        }
      } catch (error) {
        console.error('Failed to fetch voices for dialog:', error)
      }
    }

    const fetchDigitalHumansForDialog = async () => {
      try {
        console.log('Fetching all digital humans for dialog')
        const res = await getDigitalHumanPaginateList(1, 999)
        if (res.data.code === 200 && res.data.data) {
          digitalHumansForDialog.value = res.data.data.data || []
          console.log('Digital humans loaded:', digitalHumansForDialog.value.length)
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
      selectedVoices.value = []
      selectedDHs.value = []
      isAddRelTag.value = false
      bulkRelTags.value = []
      bulkTagInput.value = ''
      
      voicesForDialog.value = []
      digitalHumansForDialog.value = []
      
      // 一次加载所有数据（最多999条）
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

    const handleVoiceSelectionChange = (val: any[]) => {
      selectedVoices.value = val
    }

    const handleDHSelectionChange = (val: any[]) => {
      selectedDHs.value = val
    }

    const saveRelations = async () => {
      if (selectedVoices.value.length === 0 || selectedDHs.value.length === 0) return
      
      const sharedTags = isAddRelTag.value ? `|${bulkRelTags.value.join('|')}|` : ''
      
      try {
        let successCount = 0
        // 笛卡尔积生成并创建
        for (const v of selectedVoices.value) {
          for (const d of selectedDHs.value) {
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

        // 创建完成后重新请求分页接口刷新
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

    const saveEditRel = async () => {
      const row = editRelForm.originalRow
      
      try {
        const selectedTags = (relTagManagerRef.value as any)?.getSelectedTags() ?? editRelForm.tags
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
    const playVoice = (voice: any) => {
      let url = voice.url

      // 处理 "['https://...']" 格式
      if (url && !url.startsWith('http')) {
        const match = url.match(/https?:\/\/[^'"\]\)\s]+/)
        if (match) url = match[0]
      }

      if (!url) {
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
      if (audioPlayer.value) {
        ;(audioPlayer.value as any)._aborted = true
        audioPlayer.value.pause()
        audioPlayer.value.src = ''
        audioPlayer.value = null
      }
      currentPlayingVoice.value = voice

      const audio = new Audio()
      audioPlayer.value = audio

      audio.addEventListener('error', () => {
        if ((audio as any)._aborted) return
        ElMessage.error('音频播放失败，请检查文件地址')
        audioPlayer.value = null
        currentPlayingVoice.value = null
      })

      audio.src = url
      audio.play().catch(error => {
        ElMessage.error('音频播放失败: ' + (error.message || ''))
        audioPlayer.value = null
        currentPlayingVoice.value = null
      })

      audio.onended = () => {
        audioPlayer.value = null
        currentPlayingVoice.value = null
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
        ElMessage.warning(`最多只能添加${limit}个标签`)
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
          // 更新数字人
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
          // 判断是否是关系记录（有voiceId和digitalHumanId）
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
              // 重新加载声音和关系管理列表
              await Promise.all([
                fetchVoices(),
                fetchData()
              ])
            }
          } else if (activeName.value === 'digitalHuman') {
            // 删除数字人素材
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

    // 监听对话框打开/关闭，管理滚动监听
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

    // 监听数字人分页变化
    watch(() => [dhPage.currentPage, dhPage.pageSize], () => {
      fetchDigitalHumans()
    }, { deep: true })
    
    // 监听声音分页变化
    watch(() => [voicePage.currentPage, voicePage.pageSize], () => {
      fetchVoices()
    }, { deep: true })
    
    // 监听搜索条件变化
    watch(() => searchDH.value, () => {
      dhPage.currentPage = 1 // 重置到第一页
      fetchDigitalHumans()
    })
    
    // 监听声音搜索条件变化
    watch(() => searchVoice.value, () => {
      voicePage.currentPage = 1 // 重置到第一页
      fetchVoices()
    })
    
    // 监听标签搜索条件变化
    watch(() => filterDHTag.value, () => {
      dhPage.currentPage = 1 // 重置到第一页
      fetchDigitalHumans()
    })
    
    // 监听声音标签搜索条件变化
    watch(() => filterVoiceTag.value, () => {
      voicePage.currentPage = 1 // 重置到第一页
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
      handleVoiceSelectionChange,
      handleDHSelectionChange,
      saveRelations,
      handleEditRel,
      saveEditRel,
      playVoice,
      // 横幅管理
      bannerMode,
      bannerEditingId,
      bannerList,
      bannerName,
      bannerSelectedDH,
      bannerDHCoverUrl,
      bannerImageUrl,
      bannerHeight,
      bannerWidth,
      bannerY,
      bannerOpacity,
      bannerPreviewRef,
      bannerOverlayStyle,
      onBannerDHChange,
      onBannerImageChange,
      startBannerDrag,
      startBannerResize,
      resetBanner,
      openCreateBanner,
      cancelBannerEdit,
      editBanner,
      deleteBanner,
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
</style>
