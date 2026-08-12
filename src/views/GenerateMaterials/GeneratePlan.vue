<template>
  <div class="batch-plan-page">
    <section class="page-hero">
      <div>
        <div class="eyebrow">内容生成 / 批量数字人生成</div>
        <h1>生成计划管理</h1>
        <p>一份脚本搭配 1～15 个数字人执行项，统一进入视频通道排队。</p>
      </div>
      <div class="hero-actions">
        <el-tag type="info" effect="plain">1 个脚本 × 1～15 个数字人执行项</el-tag>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建批量计划
        </el-button>
      </div>
    </section>

    <section class="filter-card">
      <el-input
        v-model="searchKeyword"
        class="search-input"
        clearable
        placeholder="搜索计划名称"
        @keyup.enter="loadPlanList"
        @clear="loadPlanList"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <div class="filter-actions">
        <span class="filter-note">批量父计划不占用效率统计，实际视频子任务按队列执行。</span>
        <el-button :loading="listLoading" @click="loadPlanList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </section>

    <section class="dispatch-card">
      <div class="dispatch-card__header">
        <div>
          <div class="eyebrow">统一视频通道</div>
          <h2>任务排序</h2>
          <p v-if="dispatchOrderMode === 'free'">自由搭配模式：拖动会重排 P，P 数字越小越先执行；需要并行时可把多个组设为同一 P，同一 P 仍按创建时间 FIFO 和任务组轮转。</p>
          <p v-else>时间顺序模式：批量、单条和数字人顶层任务先按创建时间进入，同层按任务组轮转。</p>
        </div>
        <div class="dispatch-card__actions">
          <el-tag :type="dispatchOrderMode === 'free' ? 'warning' : 'info'" effect="plain">{{ orderModeLabel(dispatchOrderMode) }}</el-tag>
          <el-button :loading="dispatchLoading" @click="loadDispatchGroups"><el-icon><Refresh /></el-icon>刷新</el-button>
          <el-button v-if="dispatchOrderMode === 'free'" type="primary" :loading="dispatchSaving" @click="saveDispatchOrder">保存优先级</el-button>
        </div>
      </div>
      <div v-if="dispatchState === 'loading'" class="dispatch-state"><el-skeleton :rows="3" animated /></div>
      <div v-else-if="dispatchState === 'error'" class="dispatch-state dispatch-state-error">
        <el-empty :image-size="54" :description="dispatchError || '任务排序加载失败'"><el-button type="primary" @click="loadDispatchGroups">重新加载</el-button></el-empty>
      </div>
      <div v-else-if="dispatchGroups.length" class="dispatch-list">
        <div
          v-for="(group, index) in dispatchGroups"
          :key="group.id"
          class="dispatch-item"
          :class="{ locked: !group.canReorder, dragging: draggedDispatchIndex === index }"
          :draggable="dispatchOrderMode === 'free' && group.canReorder"
          @dragstart="startDispatchDrag(index)"
          @dragover.prevent
          @drop="dropDispatchGroup(index)"
          @dragend="draggedDispatchIndex = null"
        >
          <div class="dispatch-handle"><el-icon><Rank /></el-icon></div>
          <div class="dispatch-main">
            <strong>{{ group.title }}</strong>
            <span>{{ group.groupTypeLabel }} · {{ formatTime(group.createdAt) }} · 待排 {{ group.waitingItemCount }}/{{ group.activeItemCount }}</span>
          </div>
          <el-tag size="small" effect="plain" :type="group.dispatchMode === 'overnight' ? 'warning' : 'info'">
            {{ group.dispatchMode === 'overnight' ? '夜间预排' : '普通任务' }}
          </el-tag>
          <label v-if="dispatchOrderMode === 'free'" class="priority-editor">
            <span>优先级</span>
            <el-input-number v-model="group.priorityLevel" :min="1" :max="99" :disabled="!group.canReorder" controls-position="right" />
          </label>
          <el-tag v-if="!group.canReorder" size="small" type="info">已开始，已锁定</el-tag>
        </div>
      </div>
      <el-empty v-else :image-size="68" description="当前没有等待中的视频任务组" />
    </section>

    <section class="table-card">
      <el-table
        :data="planList"
        row-key="id"
        fit
        style="width: 100%"
        :header-cell-style="tableHeaderStyle"
        v-loading="listLoading"
      >
        <el-table-column label="计划名称" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <button class="plan-name" type="button" @click="openDetail(row)">{{ row.name || `计划 #${row.id}` }}</button>
            <div class="plan-id">ID: {{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="执行方式" min-width="125" align="center">
          <template #default="{ row }">
            <div class="schedule-cell">
              <el-tag size="small" effect="plain" :type="row.scheduleMode === 'overnight' ? 'warning' : 'info'">
                {{ scheduleModeLabel(row.scheduleMode) }}
              </el-tag>
              <span v-if="row.scheduledAt" class="schedule-time">{{ formatTime(row.scheduledAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="statusType(row.statusKey)">{{ statusLabel(row.statusKey) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务进度" min-width="125" align="center">
          <template #default="{ row }">
            <div class="progress-cell">
              <span>{{ row.completedCount }}/{{ row.totalCount }}</span>
              <el-progress
                :percentage="row.totalCount ? Math.round((row.completedCount / row.totalCount) * 100) : 0"
                :show-text="false"
                :stroke-width="7"
                :status="row.statusKey === 'completed' ? 'success' : undefined"
              />
              <span v-if="row.failedCount" class="failed-count">失败 {{ row.failedCount }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="155" align="center" sortable prop="createTime">
          <template #default="{ row }"><span class="time-text">{{ formatTime(row.createTime) }}</span></template>
        </el-table-column>
        <el-table-column label="任务开始时间" min-width="155" align="center">
          <template #default="{ row }"><span class="time-text">{{ formatTime(row.startTime) }}</span></template>
        </el-table-column>
        <el-table-column label="完成时间" min-width="155" align="center">
          <template #default="{ row }"><span class="time-text">{{ formatTime(row.endTime) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" min-width="235" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openDetail(row)">任务详情</el-button>
              <el-button v-if="canEditPlan(row)" link type="primary" @click="editPlan(row)">编辑</el-button>
              <el-button v-if="canStartPlan(row)" link type="success" @click="startPlan(row)">提交执行</el-button>
              <el-button v-if="canCancelPlan(row)" link type="warning" @click="cancelPlan(row)">取消</el-button>
              <el-button v-if="canDeletePlan(row)" link type="danger" @click="deletePlan(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无批量数字人生成计划" />
        </template>
      </el-table>

      <div class="pagination-bar">
        <span class="pagination-total">共 {{ planTotal }} 个计划</span>
        <el-pagination
          v-model:current-page="planPage"
          v-model:page-size="planPageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          :total="planTotal"
          @current-change="loadPlanList"
          @size-change="handlePageSizeChange"
        />
      </div>
    </section>

    <el-drawer v-model="detail.visible" title="批量数字人生成详情" size="min(100%, 1180px)" destroy-on-close>
      <div v-if="detail.plan" class="detail-page">
        <div class="detail-title-row">
          <div>
            <div class="eyebrow">批量计划 #{{ detail.plan.id }}</div>
            <h2>{{ detail.plan.name || '未命名计划' }}</h2>
            <p class="detail-subtitle">{{ detail.plan.totalCount }} 个视频子任务 · {{ scheduleModeLabel(detail.plan.scheduleMode) }}</p>
          </div>
          <div class="detail-actions">
            <el-button @click="refreshDetail" :loading="detail.loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button v-if="canStartPlan(detail.plan)" type="success" @click="startPlan(detail.plan)">提交执行</el-button>
            <el-button v-if="canCancelPlan(detail.plan)" type="warning" plain @click="cancelPlan(detail.plan)">取消计划</el-button>
          </div>
        </div>

        <div class="detail-summary-grid">
          <div class="summary-item"><span>状态</span><el-tag :type="statusType(detail.plan.statusKey)">{{ statusLabel(detail.plan.statusKey) }}</el-tag></div>
          <div class="summary-item"><span>总任务数</span><strong>{{ detail.plan.totalCount }}</strong></div>
          <div class="summary-item"><span>已完成</span><strong class="success-text">{{ detail.plan.completedCount }}</strong></div>
          <div class="summary-item"><span>失败</span><strong class="danger-text">{{ detail.plan.failedCount }}</strong></div>
        </div>

        <div class="time-grid">
          <div><span>创建时间</span><strong>{{ formatTime(detail.plan.createTime) }}</strong></div>
          <div><span>任务开始时间</span><strong>{{ formatTime(detail.plan.startTime) }}</strong></div>
          <div><span>完成时间</span><strong>{{ formatTime(detail.plan.endTime) }}</strong></div>
        </div>

        <div class="detail-tip">
          <el-icon><Rank /></el-icon>
          <span>统一排序：{{ orderModeLabel(detail.plan.taskOrderMode) }}。同一层按顶层任务组轮转，计划内子任务按序号先进先出。</span>
        </div>

        <div class="child-table-card">
          <div class="section-heading">
            <div><h3>视频子任务</h3><span>打开详情只加载封面；点击预览或下载时才通过后端代理取视频。</span></div>
            <el-tag type="info" effect="plain">{{ detail.children.length }} 条</el-tag>
          </div>
          <el-table :data="detail.children" row-key="id" fit style="width: 100%" :header-cell-style="tableHeaderStyle">
            <el-table-column label="#" min-width="55" align="center"><template #default="{ row }">{{ row.seqNo }}</template></el-table-column>
            <el-table-column label="视频封面" min-width="125" align="center">
              <template #default="{ row }">
                <button class="cover-button" type="button" :disabled="!row.coverUrl" @click="openVideoPreview(row)">
                  <img v-if="row.coverUrl" :src="row.coverUrl" class="child-cover" alt="视频封面" />
                  <span v-else class="cover-placeholder"><el-icon><Picture /></el-icon></span>
                  <span v-if="row.videoUrl" class="cover-play"><el-icon><VideoPlay /></el-icon></span>
                </button>
              </template>
            </el-table-column>
            <el-table-column label="数字人执行项" min-width="210" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="binding-name">{{ row.performerName || row.bindingName || `执行项 #${row.seqNo}` }}</div>
                <div class="binding-subtitle">{{ row.digitalHumanName || '-' }} · {{ row.voiceName || '-' }}<span v-if="row.bindingId"> · 绑定关系</span></div>
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="100" align="center">
              <template #default="{ row }"><el-tag size="small" :type="statusType(row.statusKey)">{{ statusLabel(row.statusKey) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="150" align="center"><template #default="{ row }"><span class="time-text">{{ formatTime(row.createTime) }}</span></template></el-table-column>
            <el-table-column label="任务开始时间" min-width="150" align="center"><template #default="{ row }"><span class="time-text">{{ formatTime(row.startTime) }}</span></template></el-table-column>
            <el-table-column label="完成时间" min-width="150" align="center"><template #default="{ row }"><span class="time-text">{{ formatTime(row.endTime) }}</span></template></el-table-column>
            <el-table-column label="操作" min-width="190" align="center">
              <template #default="{ row }">
                <el-button v-if="isFailed(row)" type="warning" link :loading="detail.retryingId === row.id" @click="retryChild(row)">手动重试</el-button>
                <el-button v-if="row.videoUrl" type="primary" link :loading="preview.loading && preview.childId === row.id" @click="openVideoPreview(row)">预览</el-button>
                <el-button v-if="row.videoUrl" type="primary" link :loading="preview.downloadingId === row.id" @click="downloadChild(row)">下载</el-button>
                <span v-if="!isFailed(row) && !row.videoUrl" class="muted-text">视频完成后可预览/下载</span>
              </template>
            </el-table-column>
            <template #empty><el-empty description="暂无子任务" :image-size="72" /></template>
          </el-table>
        </div>
      </div>
      <el-skeleton v-else :rows="8" animated />
    </el-drawer>

    <el-dialog
      v-model="planDialog.visible"
      :title="planDialog.isEdit ? '编辑批量数字人计划' : '新建批量数字人计划'"
      width="min(1080px, 94vw)"
      destroy-on-close
      append-to-body
    >
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-position="top" class="plan-form">
        <div class="form-grid">
          <el-form-item label="计划名称" prop="planName">
            <el-input v-model="planForm.planName" maxlength="80" show-word-limit placeholder="例如：8月新品批量数字人生成" />
          </el-form-item>
          <el-form-item label="执行方式" prop="scheduleMode">
            <el-radio-group v-model="planForm.scheduleMode" class="schedule-radio-group">
              <el-radio-button label="immediate">立即执行</el-radio-button>
              <el-radio-button label="scheduled">指定时间</el-radio-button>
              <el-radio-button label="overnight">夜间预排</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <section class="form-section">
          <div class="form-section-title"><strong>1. 配置脚本</strong><span>一份计划只使用一份脚本，支持手工输入、脚本库或历史脚本。</span></div>
          <el-radio-group v-model="planForm.scriptSource" class="source-tabs">
            <el-radio-button label="manual">手工输入</el-radio-button>
            <el-radio-button label="library">脚本库</el-radio-button>
            <el-radio-button label="history">历史脚本</el-radio-button>
          </el-radio-group>
          <div v-if="planForm.scriptSource === 'manual'" class="script-editor-wrap">
            <el-input v-model="planForm.scriptTitle" placeholder="脚本标题（可选）" maxlength="80" />
            <el-input v-model="planForm.scriptContent" type="textarea" :rows="6" maxlength="2000" show-word-limit placeholder="输入本次批量生成使用的脚本内容" />
          </div>
          <el-select v-else-if="planForm.scriptSource === 'library'" v-model="planForm.scriptId" class="w-full" filterable clearable placeholder="选择脚本库中的脚本" @visible-change="handleScriptSelectVisible">
            <el-option v-for="script in scriptOptions" :key="script.id" :label="script.title" :value="script.id">
              <div class="select-option-main">{{ script.title }}</div>
              <div class="select-option-sub">{{ truncate(script.content, 100) }}</div>
            </el-option>
          </el-select>
          <el-select v-else v-model="planForm.historyId" class="w-full" filterable clearable placeholder="选择历史脚本" @visible-change="handleHistorySelectVisible">
            <el-option v-for="script in historyOptions" :key="script.id" :label="script.title" :value="script.id">
              <div class="select-option-main">{{ script.title }}</div>
              <div class="select-option-sub">{{ truncate(script.content, 100) }}</div>
            </el-option>
          </el-select>
          <div v-if="selectedScriptContent" class="script-preview"><span>{{ planForm.scriptTitle || '当前脚本' }}</span><p>{{ truncate(selectedScriptContent, 260) }}</p></div>
        </section>

        <section class="form-section">
          <div class="form-section-title"><strong>2. 配置数字人执行项</strong><span>每项可选择绑定关系，也可以单独组合数字人与声音；共 {{ planForm.performerConfigs.length }}/15 项。</span></div>
          <div class="performer-list">
            <article v-for="(config, index) in planForm.performerConfigs" :key="config.key" class="performer-card">
              <div class="performer-card__header">
                <span class="performer-index">执行项 {{ index + 1 }}</span>
                <el-button v-if="planForm.performerConfigs.length > 1" link type="danger" @click="removePerformer(index)">移除</el-button>
              </div>
              <el-radio-group v-model="config.selectionMode" size="small" @change="resetPerformerSelection(config)">
                <el-radio-button label="binding">选择绑定关系</el-radio-button>
                <el-radio-button label="custom">单独选择数字人+声音</el-radio-button>
              </el-radio-group>
              <div v-if="config.selectionMode === 'binding'" class="performer-fields">
                <el-select v-model="config.bindingId" class="w-full" filterable clearable placeholder="选择绑定关系" @visible-change="handleBindingSelectVisible">
                  <el-option v-for="binding in bindingOptions" :key="binding.id" :label="binding.name" :value="binding.id">
                    <div class="binding-option"><span>{{ binding.name }}</span><small>{{ binding.digitalHumanName || '-' }} · {{ binding.voiceName || '-' }}</small></div>
                  </el-option>
                </el-select>
                <div v-if="selectedBinding(config)" class="performer-preview-row">
                  <img v-if="selectedBinding(config)?.coverUrl" :src="selectedBinding(config)?.coverUrl" class="performer-cover" alt="数字人封面" />
                  <span>{{ selectedBinding(config)?.digitalHumanName }} · {{ selectedBinding(config)?.voiceName }}</span>
                  <el-button v-if="selectedBinding(config)?.voiceUrl" link type="primary" @click="playVoice(selectedBinding(config)?.voiceUrl || '', selectedBinding(config)?.voiceName || '')"><el-icon><Headset /></el-icon>试听</el-button>
                </div>
              </div>
              <div v-else class="performer-fields custom-performer-fields">
                <el-select v-model="config.digitalHumanId" filterable clearable placeholder="选择数字人" @visible-change="handleDigitalHumanSelectVisible">
                  <el-option v-for="human in digitalHumanOptions" :key="human.id" :label="human.name" :value="human.id">
                    <div class="asset-option"><img v-if="human.coverUrl" :src="human.coverUrl" alt="" /><span>{{ human.name }}</span></div>
                  </el-option>
                </el-select>
                <el-select v-model="config.voiceId" filterable clearable placeholder="选择声音" @visible-change="handleVoiceSelectVisible">
                  <el-option v-for="voice in voiceOptions" :key="voice.id" :label="voice.name" :value="voice.id">
                    <div class="binding-option"><span>{{ voice.name }}</span><small>{{ voice.language || '默认语言' }}</small></div>
                  </el-option>
                </el-select>
                <div v-if="selectedHuman(config) || selectedVoice(config)" class="performer-preview-row">
                  <img v-if="selectedHuman(config)?.coverUrl" :src="selectedHuman(config)?.coverUrl" class="performer-cover" alt="数字人封面" />
                  <span>{{ selectedHuman(config)?.name || '未选数字人' }} · {{ selectedVoice(config)?.name || '未选声音' }}</span>
                  <el-button v-if="selectedVoice(config)?.url" link type="primary" @click="playVoice(selectedVoice(config)?.url || '', selectedVoice(config)?.name || '')"><el-icon><Headset /></el-icon>试听</el-button>
                </div>
              </div>
            </article>
          </div>
          <el-button class="add-performer-button" plain type="primary" :disabled="planForm.performerConfigs.length >= 15" @click="addPerformer"><el-icon><Plus /></el-icon>添加数字人执行项</el-button>
          <div class="selection-summary">将创建 <strong>{{ planForm.performerConfigs.length }}</strong> 个实际视频子任务；批量父计划不占用任务效率统计。</div>
        </section>

        <section class="form-section">
          <div class="form-section-title"><strong>3. 视频参数与后处理</strong><span>与单条数字人生成保持同一组基础参数。</span></div>
          <div class="form-grid form-grid-three">
            <el-form-item label="语言"><el-select v-model="planForm.videoOptions.language" class="w-full"><el-option label="中文" value="zh" /><el-option label="泰语" value="th" /></el-select></el-form-item>
            <el-form-item label="视频方向"><el-radio-group v-model="planForm.videoOptions.videoType"><el-radio :label="0">竖版</el-radio><el-radio :label="1">横版</el-radio></el-radio-group></el-form-item>
            <el-form-item label="语速"><el-input-number v-model="planForm.videoOptions.speechRate" :min="0.5" :max="2" :step="0.1" controls-position="right" /></el-form-item>
          </div>
          <el-checkbox-group v-model="planForm.processTypes">
            <el-checkbox label="subtitle">字幕</el-checkbox>
            <el-checkbox label="corner_mark">角标</el-checkbox>
            <el-checkbox label="banner_overlay">横幅</el-checkbox>
          </el-checkbox-group>
          <div class="form-grid form-grid-two mt-2">
            <el-select v-if="planForm.processTypes.includes('corner_mark')" v-model="planForm.cornerMarkId" class="w-full" clearable filterable placeholder="选择角标素材"><el-option v-for="mark in cornerMarkOptions" :key="mark.id" :label="mark.name" :value="mark.id" /></el-select>
            <el-select v-if="planForm.processTypes.includes('banner_overlay')" v-model="planForm.bannerOverlayId" class="w-full" clearable filterable placeholder="选择横幅素材"><el-option v-for="banner in bannerOverlayOptions" :key="banner.id" :label="banner.name" :value="banner.id" /></el-select>
          </div>
          <div class="form-help">实际视频封面由后端生成并写回；本页创建计划时只提交素材 ID，不提前请求视频。</div>
        </section>

        <el-form-item v-if="planForm.scheduleMode === 'scheduled'" label="计划执行时间" prop="scheduledAt">
          <el-date-picker v-model="planForm.scheduledAt" class="w-full" type="datetime" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" :disabled-date="disablePastDate" placeholder="选择未来的执行时间" />
        </el-form-item>
        <div v-if="planForm.scheduleMode === 'overnight'" class="form-help">夜间预排保留原始创建时间；进入视频通道时仍按顶层任务 FIFO 和同层组轮转。</div>
      </el-form>

      <template #footer>
        <el-button @click="planDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="planDialog.submitting" @click="submitPlan">{{ planDialog.isEdit ? '保存修改' : '创建并提交' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="preview.visible" :title="preview.title || '视频预览'" width="min(820px, 92vw)" append-to-body @closed="stopPreview">
      <div class="video-preview-wrap">
        <el-skeleton v-if="preview.loading" :rows="5" animated />
        <video v-else-if="preview.url" ref="previewVideo" :src="preview.url" controls autoplay playsinline class="preview-video" />
        <el-empty v-else description="暂无可预览的视频" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Headset, Picture, Plus, Rank, Refresh, Search, VideoPlay } from '@element-plus/icons-vue'
import {
  cancelVideoBatchPlan,
  createVideoBatchPlan,
  deleteVideoBatchPlan,
  downloadFileByProxy,
  getBannerOverlayList,
  getBindingList,
  getCornerMarkList,
  getDigitalHumanList,
  getScriptPaginateList,
  getScriptHistoryList,
  getVoiceList,
  getVideoBatchPlanDetail,
  getVideoBatchPlanList,
  getVideoDispatchGroups,
  reorderVideoDispatchGroups,
  retryVideoBatchChild,
  startVideoBatchPlan,
  updateVideoBatchPlan
} from '/@/api/material'
import { useLayoutStore } from '/@/store/modules/layout'

type ScheduleMode = 'immediate' | 'scheduled' | 'overnight'
type ScriptSource = 'manual' | 'library' | 'history'
type StatusKey = 'draft' | 'waiting' | 'running' | 'completed' | 'partial_failed' | 'failed' | 'cancelled'

interface ScriptOption {
  id: string | number
  title: string
  content: string
}

interface PerformerConfig {
  key: string
  selectionMode: 'binding' | 'custom'
  bindingId: string | number | null
  digitalHumanId: string | number | null
  voiceId: string | number | null
}

interface AssetOption {
  id: string | number
  name: string
  coverUrl?: string
  url?: string
  language?: string
}

interface BindingOption {
  id: string | number
  name: string
  digitalHumanName: string
  voiceName: string
  digitalHumanExternalId?: string
  voiceExternalId?: string
  coverUrl?: string
  voiceUrl?: string
}

interface BatchChild {
  id: string | number
  seqNo: number
  bindingId?: string | number
  selectionMode?: 'binding' | 'custom'
  digitalHumanId?: string | number | null
  voiceId?: string | number | null
  bindingName: string
  performerName?: string
  digitalHumanName: string
  voiceName: string
  statusKey: StatusKey
  createTime?: string
  startTime?: string
  endTime?: string
  errorMessage?: string
  videoUrl?: string
  coverUrl?: string
  videoTaskId?: string | number
  videoDurationSeconds?: number | null
  retryable?: boolean
  attemptNo?: number
}

interface BatchPlan {
  id: string | number
  name: string
  statusKey: StatusKey
  taskOrderMode?: string
  scheduleMode: ScheduleMode
  scheduledAt?: string
  createTime?: string
  startTime?: string
  endTime?: string
  totalCount: number
  completedCount: number
  failedCount: number
  bindingIds: Array<string | number>
  scriptId?: string | number
  script?: { source: ScriptSource; sourceId?: string | number | null; id?: string | number | null; title?: string; content?: string }
  processTypes: string[]
  cornerMarkId?: string | number | null
  bannerOverlayId?: string | number | null
  videoOptions?: {
    language?: string
    videoType?: number
    video_type?: number
    speechRate?: number | string
    speech_rate?: number | string
    anchorType?: number
    anchor_type?: number
    isSkipRs?: boolean | number
    is_skip_rs?: boolean | number
  }
  children: BatchChild[]
}

interface DispatchGroup {
  id: string | number
  title: string
  groupTypeLabel: string
  dispatchMode: string
  priorityLevel: number
  priorityRank: number
  canReorder: boolean
  waitingItemCount: number
  activeItemCount: number
  createdAt?: string
}

const layoutStore = useLayoutStore()
const isPlatformSuperAdmin = computed(() => Boolean(layoutStore.getUserInfo.isPlatformSuperAdmin))
const tableHeaderStyle = { background: '#f7f9fc', color: '#536174', fontWeight: '600' }

const listLoading = ref(false)
const planList = ref<BatchPlan[]>([])
const planPage = ref(1)
const planPageSize = ref(20)
const planTotal = ref(0)
const searchKeyword = ref('')
const dispatchLoading = ref(false)
const dispatchSaving = ref(false)
const dispatchOrderMode = ref('chronological')
const dispatchGroups = ref<DispatchGroup[]>([])
const dispatchState = ref<'loading' | 'error' | 'empty' | 'ready'>('loading')
const dispatchError = ref('')
const draggedDispatchIndex = ref<number | null>(null)

const planFormRef = ref<any>()
const planForm = reactive({
  id: null as string | number | null,
  planName: '',
  scriptSource: 'manual' as ScriptSource,
  scriptId: null as string | number | null,
  historyId: null as string | number | null,
  scriptTitle: '',
  scriptContent: '',
  performerConfigs: [] as PerformerConfig[],
  scheduleMode: 'immediate' as ScheduleMode,
  scheduledAt: '',
  processTypes: [] as string[],
  cornerMarkId: null as string | number | null,
  bannerOverlayId: null as string | number | null,
  videoOptions: {
    language: 'zh',
    videoType: 0 as 0 | 1,
    speechRate: 1,
    anchorType: 1,
    isSkipRs: false
  }
})

const planDialog = reactive({ visible: false, isEdit: false, submitting: false })
const detail = reactive({
  visible: false,
  loading: false,
  retryingId: null as string | number | null,
  plan: null as BatchPlan | null,
  children: [] as BatchChild[]
})
const preview = reactive({ visible: false, loading: false, url: '', title: '', childId: null as string | number | null, downloadingId: null as string | number | null })
const previewVideo = ref<HTMLVideoElement | null>(null)
let previewObjectUrl = ''
let voiceAudio: HTMLAudioElement | null = null

const scriptOptions = ref<ScriptOption[]>([])
const historyOptions = ref<ScriptOption[]>([])
const bindingOptions = ref<BindingOption[]>([])
const digitalHumanOptions = ref<AssetOption[]>([])
const voiceOptions = ref<AssetOption[]>([])
const cornerMarkOptions = ref<Array<{ id: string | number; name: string }>>([])
const bannerOverlayOptions = ref<Array<{ id: string | number; name: string }>>([])
const resourcesLoaded = reactive({ scripts: false, history: false, bindings: false, digitalHumans: false, voices: false, cornerMarks: false, banners: false })

const planRules = {
  planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  scriptContent: [{ validator: (_rule: any, _value: string, callback: (error?: Error) => void) => {
    if (planForm.scriptSource === 'manual' && !planForm.scriptContent.trim()) return callback(new Error('请输入脚本内容'))
    if (planForm.scriptSource === 'library' && !planForm.scriptId) return callback(new Error('请选择脚本库脚本'))
    if (planForm.scriptSource === 'history' && !planForm.historyId) return callback(new Error('请选择历史脚本'))
    callback()
  }, trigger: 'change' }],
  scheduleMode: [{ required: true, message: '请选择执行方式', trigger: 'change' }],
  scheduledAt: [{ validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (planForm.scheduleMode !== 'scheduled') return callback()
    if (!value) return callback(new Error('请选择计划执行时间'))
    if (new Date(value.replace(' ', 'T')).getTime() <= Date.now()) return callback(new Error('指定时间必须晚于当前时间'))
    callback()
  }, trigger: 'change' }]
}

function getResponseData(response: any): any {
  return response?.data?.data ?? response?.data ?? {}
}

function getPageData(response: any): { items: any[]; total: number } {
  const data = getResponseData(response)
  if (Array.isArray(data)) return { items: data, total: data.length }
  const items = data?.data || data?.items || data?.results || []
  return { items: Array.isArray(items) ? items : [], total: Number(data?.total ?? data?.count ?? items.length) }
}

function responseId(response: any): string | number | null {
  const data = getResponseData(response)
  return data?.id ?? data?.planId ?? data?.plan?.id ?? null
}

function normalizeStatus(value: any, fallback: StatusKey = 'waiting'): StatusKey {
  const raw = String(value ?? '').trim().toLowerCase()
  if (['draft', 'unsubmitted', '未执行', '草稿'].includes(raw)) return 'draft'
  if (['running', 'processing', 'in_progress', '执行中', '生成中'].includes(raw)) return 'running'
  if (['completed', 'success', 'succeeded', 'done', '已完成', '5', '2'].includes(raw)) return 'completed'
  if (['partial_failed', 'partial-failed', '部分失败'].includes(raw)) return 'partial_failed'
  if (['failed', 'fail', '失败', '执行失败', '-1'].includes(raw)) return 'failed'
  if (['cancelled', 'canceled', '已取消'].includes(raw)) return 'cancelled'
  if (['waiting', 'pending', 'queued', 'submitted', '等待中', '待执行', '0', '1'].includes(raw)) return 'waiting'
  return fallback
}

function normalizeScheduleMode(value: any): ScheduleMode {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'scheduled' || raw === '2' || raw === '指定时间') return 'scheduled'
  if (raw === 'overnight' || raw === 'night' || raw === '夜间预排') return 'overnight'
  return 'immediate'
}

function extractChildren(raw: any): any[] {
  const data = raw?.plan || raw?.detail || raw || {}
  return data?.children || raw?.children || data?.tasks || data?.items || data?.subTasks || []
}

function normalizeChild(item: any, index: number): BatchChild {
  const snapshot = item.bindingSnapshot || item.binding_snapshot || {}
  const performer = item.performerSnapshot || item.performer_snapshot || item.configSnapshot || item.config_snapshot || {}
  const video = item.video || item.videoTask || item.video_task || {}
  const rawStatus = item.taskStatus ?? item.status ?? item.state
  return {
    id: item.id ?? item.taskId ?? item.videoTaskId ?? index,
    seqNo: Number(item.seqNo ?? item.seq_no ?? item.childSeq ?? item.child_seq ?? index + 1),
    bindingId: item.bindingId ?? item.binding_id,
    selectionMode: item.selectionMode || item.selection_mode || snapshot.selectionMode || (item.bindingId ?? item.binding_id ? 'binding' : 'custom'),
    digitalHumanId: item.digitalHumanId ?? item.digital_human_id ?? snapshot.digitalHumanId ?? snapshot.human?.id ?? null,
    voiceId: item.voiceId ?? item.voice_id ?? snapshot.voiceId ?? snapshot.voice?.id ?? null,
    bindingName: item.bindingName || item.binding_name || snapshot.name || `${item.digitalHumanName || snapshot.digitalHumanName || '数字人'} + ${item.voiceName || snapshot.voiceName || '配音'}`,
    performerName: item.performerName || item.performer_name || performer.name || '',
    digitalHumanName: item.digitalHumanName || item.digital_human_name || snapshot.digitalHumanName || snapshot.digital_human_name || '',
    voiceName: item.voiceName || item.voice_name || snapshot.voiceName || snapshot.voice_name || '',
    statusKey: normalizeStatus(rawStatus, 'waiting'),
    createTime: item.createTime || item.create_time,
    startTime: item.startTime || item.start_time,
    endTime: item.endTime || item.end_time,
    errorMessage: item.errorMessage || item.error_message || '',
    videoUrl: item.videoUrl || item.video_url || video.videoUrl || video.video_url || '',
    coverUrl: item.coverUrl || item.cover_url || item.digitalHumanCoverUrl || item.digital_human_cover_url || snapshot.digitalHumanCoverUrl || snapshot.human?.coverUrl || item.videoCoverUrl || item.video_cover_url || video.coverUrl || video.cover_url || '',
    videoTaskId: item.videoTaskId || item.video_task_id || video.id,
    videoDurationSeconds: Number(item.videoDurationSeconds ?? item.video_duration_seconds ?? item.videoDuration ?? video.duration ?? 0) || null,
    retryable: Boolean(item.retryable ?? normalizeStatus(rawStatus) === 'failed'),
    attemptNo: Number(item.attemptNo ?? item.attempt_no ?? 0)
  }
}

function normalizePlan(item: any): BatchPlan {
  const source = item?.plan || item?.detail || item || {}
  const children = extractChildren(item).map(normalizeChild).sort((a, b) => a.seqNo - b.seqNo || String(a.id).localeCompare(String(b.id)))
  const statusValue = source.taskStatus ?? source.status ?? source.state
  const failedCount = Number(source.failedCount ?? source.failed_count ?? children.filter(child => isFailed(child)).length)
  const completedCount = Number(source.completedCount ?? source.completed_count ?? children.filter(child => child.statusKey === 'completed').length)
  const totalCount = Number(source.totalCount ?? source.total_count ?? source.childCount ?? source.child_count ?? source.size ?? children.length)
  return {
    id: source.id ?? source.planId,
    name: source.planName || source.name || '',
    statusKey: normalizeStatus(statusValue, failedCount > 0 && completedCount > 0 ? 'partial_failed' : 'waiting'),
    taskOrderMode: source.taskOrderMode || source.task_order_mode || source.orderMode || '',
    scheduleMode: normalizeScheduleMode(source.scheduleMode ?? source.schedule_mode ?? source.dispatchMode),
    scheduledAt: source.scheduledAt || source.scheduled_at || source.eligibleAt || source.eligible_at || '',
    createTime: source.createTime || source.create_time,
    startTime: source.startTime || source.start_time,
    endTime: source.endTime || source.end_time,
    totalCount,
    completedCount,
    failedCount,
    bindingIds: Array.isArray(source.bindingIds) ? source.bindingIds : Array.isArray(source.binding_ids) ? source.binding_ids : children.map(child => child.bindingId).filter(Boolean) as Array<string | number>,
    scriptId: source.scriptId ?? source.script_id ?? source.scriptSnapshot?.scriptId,
    script: source.script || source.scriptSnapshot || undefined,
    processTypes: Array.isArray(source.postProcessConfig?.processTypes) ? source.postProcessConfig.processTypes : Array.isArray(source.processTypes) ? source.processTypes : [],
    cornerMarkId: source.postProcessConfig?.cornerMarkId ?? source.cornerMarkId ?? source.corner_mark_id ?? null,
    bannerOverlayId: source.postProcessConfig?.bannerOverlayId ?? source.bannerOverlayId ?? source.banner_overlay_id ?? null,
    videoOptions: source.videoOptions || source.video_options || {},
    children
  }
}

function statusLabel(status: StatusKey): string {
  return ({ draft: '未执行', waiting: '等待中', running: '执行中', completed: '已完成', partial_failed: '部分失败', failed: '失败', cancelled: '已取消' } as Record<StatusKey, string>)[status]
}

function statusType(status: StatusKey): 'success' | 'warning' | 'danger' | 'info' | '' {
  return ({ draft: 'info', waiting: 'info', running: 'warning', completed: 'success', partial_failed: 'danger', failed: 'danger', cancelled: '' } as Record<StatusKey, 'success' | 'warning' | 'danger' | 'info' | ''>)[status]
}

function scheduleModeLabel(mode: ScheduleMode): string {
  return ({ immediate: '立即执行', scheduled: '指定时间', overnight: '夜间预排' } as Record<ScheduleMode, string>)[mode]
}

function orderModeLabel(mode?: string): string {
  return String(mode || '').toLowerCase() === 'free' ? '自由搭配' : '时间顺序'
}

function formatTime(value?: string | number | null): string {
  if (!value) return '-'
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) return raw.replace('T', ' ').slice(0, 19)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
}

function truncate(value: string, length: number): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > length ? `${text.slice(0, length)}…` : text || '暂无脚本内容'
}

function isFailed(row: Pick<BatchChild, 'statusKey'> | any): boolean {
  return normalizeStatus(row?.statusKey ?? row?.taskStatus ?? row?.status) === 'failed'
}

function canEditPlan(row: BatchPlan): boolean {
  return row.statusKey === 'draft'
}

function canStartPlan(row: BatchPlan): boolean {
  return row.statusKey === 'draft'
}

function canCancelPlan(row: BatchPlan): boolean {
  return !['completed', 'failed', 'partial_failed', 'cancelled'].includes(row.statusKey)
}

function canDeletePlan(row: BatchPlan): boolean {
  return row.statusKey === 'draft'
}

function disablePastDate(date: Date): boolean {
  return date.getTime() < Date.now() - 60 * 1000
}

async function loadPlanList() {
  listLoading.value = true
  try {
    const search = searchKeyword.value.trim() ? { planName: searchKeyword.value.trim() } : {}
    const response = await getVideoBatchPlanList(planPage.value, planPageSize.value, search)
    const pageData = getPageData(response)
    planList.value = pageData.items.map(normalizePlan)
    planTotal.value = pageData.total
  } catch (error: any) {
    ElMessage.error(error?.message || '批量计划加载失败')
  } finally {
    listLoading.value = false
  }
}

async function loadDispatchGroups() {
  if (dispatchLoading.value) return
  dispatchLoading.value = true
  dispatchState.value = 'loading'
  dispatchError.value = ''
  try {
    const response = await getVideoDispatchGroups()
    const data = getResponseData(response)
    dispatchOrderMode.value = String(data.orderMode || data.order_mode || 'chronological')
    const groups = findDispatchGroups(data)
    dispatchGroups.value = groups.map((item: any, index: number) => ({
      id: item.id ?? item.groupId ?? item.group_id ?? index,
      title: item.title || `任务组 #${item.id}`,
      groupTypeLabel: item.groupTypeLabel || item.group_type_label || item.groupType || '视频任务',
      dispatchMode: item.dispatchMode || item.dispatch_mode || 'immediate',
      priorityLevel: Math.max(1, Number(item.priorityLevel ?? item.priority_level ?? 1)),
      priorityRank: Math.max(0, Number(item.priorityRank ?? item.priority_rank ?? index)),
      canReorder: Boolean(item.canReorder ?? item.can_reorder),
      waitingItemCount: Number(item.waitingItemCount ?? item.waiting_item_count ?? 0),
      activeItemCount: Number(item.activeItemCount ?? item.active_item_count ?? 0),
      createdAt: item.createdAt || item.created_at
    }))
    dispatchState.value = dispatchGroups.value.length ? 'ready' : 'empty'
  } catch (error: any) {
    dispatchError.value = error?.message || '统一任务排序加载失败'
    dispatchState.value = 'error'
  } finally {
    dispatchLoading.value = false
  }
}

function findDispatchGroups(data: any): any[] {
  const candidates = [data?.groups, data?.items, data?.results, data?.waitingGroups, data?.waiting_groups, data?.data?.groups, data?.data?.items, data?.data?.results]
  return candidates.find(Array.isArray) || []
}

function startDispatchDrag(index: number) {
  if (dispatchOrderMode.value !== 'free' || !dispatchGroups.value[index]?.canReorder) return
  draggedDispatchIndex.value = index
}

function dropDispatchGroup(targetIndex: number) {
  const sourceIndex = draggedDispatchIndex.value
  draggedDispatchIndex.value = null
  if (sourceIndex === null || sourceIndex === targetIndex) return
  const moving = dispatchGroups.value[sourceIndex]
  const target = dispatchGroups.value[targetIndex]
  if (!moving?.canReorder || !target?.canReorder) {
    ElMessage.info('已经开始的任务组已锁定，不能参与拖动')
    return
  }
  const next = [...dispatchGroups.value]
  next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moving)
  let nextPriority = 1
  next.forEach(group => {
    if (group.canReorder) group.priorityLevel = nextPriority++
  })
  dispatchGroups.value = next
}

async function saveDispatchOrder() {
  if (dispatchOrderMode.value !== 'free' || dispatchSaving.value) return
  dispatchSaving.value = true
  try {
    const groups = dispatchGroups.value.filter(group => group.canReorder).map((group, index) => ({
      id: group.id,
      priorityLevel: Math.max(1, Number(group.priorityLevel || 1)),
      priorityRank: index
    }))
    if (!groups.length) {
      ElMessage.info('当前没有可调整的未开始任务组')
      return
    }
    await reorderVideoDispatchGroups(groups)
    ElMessage.success('任务优先级已保存')
    await loadDispatchGroups()
  } catch (error: any) {
    ElMessage.error(error?.message || '任务优先级保存失败')
  } finally {
    dispatchSaving.value = false
  }
}

async function loadResources() {
  await Promise.all([loadScripts(), loadHistory(), loadBindings(), loadDigitalHumans(), loadVoices(), loadCornerMarks(), loadBanners()])
}

async function loadScripts() {
  if (resourcesLoaded.scripts) return
  try {
    const response = await getScriptPaginateList(1, 200)
    const { items } = getPageData(response)
    scriptOptions.value = items.map((item: any) => ({
      id: item.scriptId ?? item.id,
      title: item.scriptTitle || item.title || '未命名脚本',
      content: item.scriptContent || item.content || ''
    })).filter((item: ScriptOption) => item.id !== undefined && item.id !== null)
    resourcesLoaded.scripts = true
  } catch (error) {
    console.warn('加载脚本列表失败', error)
  }
}

async function loadHistory() {
  if (resourcesLoaded.history) return
  try {
    const response = await getScriptHistoryList(1, 200)
    const { items } = getPageData(response)
    historyOptions.value = items.map((item: any) => ({
      id: item.taskId ?? item.id,
      title: item.taskTitle || item.title || item.name || '未命名历史脚本',
      content: item.taskContent || item.scriptContent || item.content || item.msg || ''
    })).filter((item: ScriptOption) => item.id !== undefined && item.id !== null)
    resourcesLoaded.history = true
  } catch (error) {
    console.warn('加载历史脚本失败', error)
  }
}

async function loadBindings() {
  if (resourcesLoaded.bindings) return
  try {
    const response = await getBindingList(1, 200)
    const { items } = getPageData(response)
    bindingOptions.value = items.map((item: any) => ({
      id: item.id ?? item.bindingId,
      name: item.title || item.name || `${item.digitalHumanName || item.human || '数字人'} + ${item.voiceName || item.voice || '配音'}`,
      digitalHumanName: item.digitalHumanName || item.human || '',
      voiceName: item.voiceName || item.voice || '',
      digitalHumanExternalId: item.digitalHumanExternalId || item.digital_human_external_id || '',
      voiceExternalId: item.voiceExternalId || item.voice_external_id || '',
      coverUrl: item.digitalHumanCoverUrl || item.coverUrl || '',
      voiceUrl: item.voiceUrl || item.voice_url || ''
    })).filter((item: BindingOption) => item.id !== undefined && item.id !== null)
    resourcesLoaded.bindings = true
  } catch (error) {
    console.warn('加载绑定关系列表失败', error)
  }
}

async function loadDigitalHumans() {
  if (resourcesLoaded.digitalHumans) return
  try {
    const response = await getDigitalHumanList()
    const data = getResponseData(response)
    const items = Array.isArray(data) ? data : data?.data || data?.items || data?.results || []
    digitalHumanOptions.value = items.map((item: any) => ({
      id: item.id ?? item.digitalHumanId ?? item.digital_human_id,
      name: item.digitalHumanName || item.name || item.title || '未命名数字人',
      coverUrl: item.coverUrl || item.cover_url || item.imageUrl || item.image_url || item.img || ''
    })).filter((item: AssetOption) => item.id !== undefined && item.id !== null)
    resourcesLoaded.digitalHumans = true
  } catch (error) {
    console.warn('加载数字人列表失败', error)
  }
}

async function loadVoices() {
  if (resourcesLoaded.voices) return
  try {
    const response = await getVoiceList()
    const data = getResponseData(response)
    const items = Array.isArray(data) ? data : data?.data || data?.items || data?.results || []
    voiceOptions.value = items.map((item: any) => ({
      id: item.id ?? item.voiceId ?? item.voice_id,
      name: item.voiceName || item.name || item.title || '未命名声音',
      url: item.voiceUrl || item.voice_url || item.url || item.audio || '',
      language: item.language || item.lang || ''
    })).filter((item: AssetOption) => item.id !== undefined && item.id !== null)
    resourcesLoaded.voices = true
  } catch (error) {
    console.warn('加载声音列表失败', error)
  }
}

async function loadCornerMarks() {
  if (resourcesLoaded.cornerMarks) return
  try {
    const response = await getCornerMarkList()
    const data = getResponseData(response)
    const items = Array.isArray(data) ? data : data?.data || data?.items || []
    cornerMarkOptions.value = items.map((item: any) => ({ id: item.id ?? item.cornerMarkId, name: item.name || item.title || '未命名角标' }))
    resourcesLoaded.cornerMarks = true
  } catch (error) {
    console.warn('加载角标列表失败', error)
  }
}

async function loadBanners() {
  if (resourcesLoaded.banners) return
  try {
    const response = await getBannerOverlayList(1, 200)
    const { items } = getPageData(response)
    bannerOverlayOptions.value = items.map((item: any) => ({ id: item.id ?? item.bannerOverlayId ?? item.banner_overlay_id, name: item.name || item.title || '未命名横幅' })).filter((item: any) => item.id !== undefined && item.id !== null)
    resourcesLoaded.banners = true
  } catch (error) {
    console.warn('加载横幅列表失败', error)
  }
}

function handleScriptSelectVisible(visible: boolean) {
  if (visible) loadScripts()
}

function handleHistorySelectVisible(visible: boolean) {
  if (visible) loadHistory()
}

function handleBindingSelectVisible(visible: boolean) {
  if (visible) loadBindings()
}

function handleDigitalHumanSelectVisible(visible: boolean) {
  if (visible) loadDigitalHumans()
}

function handleVoiceSelectVisible(visible: boolean) {
  if (visible) loadVoices()
}

function resetPlanForm() {
  planForm.id = null
  planForm.planName = ''
  planForm.scriptSource = 'manual'
  planForm.scriptId = null
  planForm.historyId = null
  planForm.scriptTitle = ''
  planForm.scriptContent = ''
  planForm.performerConfigs = [createPerformerConfig()]
  planForm.scheduleMode = 'immediate'
  planForm.scheduledAt = ''
  planForm.processTypes = []
  planForm.cornerMarkId = null
  planForm.bannerOverlayId = null
  Object.assign(planForm.videoOptions, { language: 'zh', videoType: 0, speechRate: 1, anchorType: 1, isSkipRs: false })
  planFormRef.value?.clearValidate?.()
}

function createPerformerConfig(): PerformerConfig {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, selectionMode: 'binding', bindingId: null, digitalHumanId: null, voiceId: null }
}

function addPerformer() {
  if (planForm.performerConfigs.length >= 15) return
  planForm.performerConfigs.push(createPerformerConfig())
}

function removePerformer(index: number) {
  if (planForm.performerConfigs.length <= 1) return
  planForm.performerConfigs.splice(index, 1)
}

function resetPerformerSelection(config: PerformerConfig) {
  config.bindingId = null
  config.digitalHumanId = null
  config.voiceId = null
}

function selectedBinding(config: PerformerConfig): BindingOption | undefined {
  return bindingOptions.value.find(item => String(item.id) === String(config.bindingId))
}

function selectedHuman(config: PerformerConfig): AssetOption | undefined {
  return digitalHumanOptions.value.find(item => String(item.id) === String(config.digitalHumanId))
}

function selectedVoice(config: PerformerConfig): AssetOption | undefined {
  return voiceOptions.value.find(item => String(item.id) === String(config.voiceId))
}

const selectedScriptContent = computed(() => {
  if (planForm.scriptSource === 'manual') return planForm.scriptContent
  const list = planForm.scriptSource === 'library' ? scriptOptions.value : historyOptions.value
  const id = planForm.scriptSource === 'library' ? planForm.scriptId : planForm.historyId
  const selected = list.find(item => String(item.id) === String(id))
  if (selected) {
    planForm.scriptTitle = selected.title
    planForm.scriptContent = selected.content
  }
  return selected?.content || planForm.scriptContent
})

function openCreateDialog() {
  resetPlanForm()
  planDialog.isEdit = false
  planDialog.visible = true
  loadResources()
}

function fillPlanForm(plan: BatchPlan) {
  planForm.id = plan.id
  planForm.planName = plan.name
  const script = plan.script || {}
  planForm.scriptSource = script.source || (plan.scriptId ? 'library' : 'manual')
  planForm.scriptId = plan.scriptId ?? script.sourceId ?? script.id ?? null
  planForm.historyId = planForm.scriptSource === 'history' ? script.sourceId ?? script.id ?? plan.scriptId ?? null : null
  planForm.scriptTitle = script.title || ''
  planForm.scriptContent = script.content || ''
  planForm.performerConfigs = plan.children.length ? plan.children.map(child => ({
    key: `${child.id}`,
    selectionMode: child.selectionMode || (child.bindingId ? 'binding' : 'custom'),
    bindingId: child.bindingId ?? null,
    digitalHumanId: child.digitalHumanId ?? null,
    voiceId: child.voiceId ?? null
  })) : [createPerformerConfig()]
  planForm.scheduleMode = plan.scheduleMode
  planForm.scheduledAt = plan.scheduledAt ? String(plan.scheduledAt).replace('T', ' ').slice(0, 19) : ''
  planForm.processTypes = [...plan.processTypes]
  planForm.cornerMarkId = plan.cornerMarkId ?? null
  planForm.bannerOverlayId = plan.bannerOverlayId ?? null
  const options = plan.videoOptions || {}
  Object.assign(planForm.videoOptions, {
    language: options.language || 'zh',
    videoType: Number(options.videoType ?? options.video_type ?? 0) === 1 ? 1 : 0,
    speechRate: Number(options.speechRate ?? options.speech_rate ?? 1) || 1,
    anchorType: Number(options.anchorType ?? options.anchor_type ?? 1) || 1,
    isSkipRs: Boolean(options.isSkipRs ?? options.is_skip_rs ?? false)
  })
}

async function editPlan(row: BatchPlan) {
  try {
    const response = await getVideoBatchPlanDetail(row.id)
    const plan = normalizePlan(getResponseData(response))
    fillPlanForm(plan)
    planDialog.isEdit = true
    planDialog.visible = true
    await loadResources()
  } catch (error: any) {
    ElMessage.error(error?.message || '计划详情加载失败')
  }
}

function buildPlanPayload() {
  const processTypes = [...new Set(planForm.processTypes)]
  const scriptId = planForm.scriptSource === 'library' ? planForm.scriptId : planForm.scriptSource === 'history' ? planForm.historyId : null
  const bindingIds = planForm.performerConfigs.filter(item => item.selectionMode === 'binding' && item.bindingId !== null).map(item => item.bindingId as string | number)
  return {
    planName: planForm.planName.trim(),
    script: {
      source: planForm.scriptSource,
      sourceId: scriptId,
      title: planForm.scriptTitle.trim(),
      content: selectedScriptContent.value.trim()
    },
    performerConfigs: planForm.performerConfigs.map(item => item.selectionMode === 'binding'
      ? { selectionMode: 'binding' as const, bindingId: item.bindingId }
      : { selectionMode: 'custom' as const, digitalHumanId: item.digitalHumanId, voiceId: item.voiceId }),
    videoOptions: { ...planForm.videoOptions },
    scriptId,
    bindingIds: [...new Set(bindingIds)],
    scheduleMode: planForm.scheduleMode,
    scheduledAt: planForm.scheduleMode === 'scheduled' && planForm.scheduledAt ? new Date(planForm.scheduledAt.replace(' ', 'T')).toISOString() : null,
    postProcessConfig: {
      processTypes,
      subtitleSelector: processTypes.includes('subtitle') ? 1 : 0,
      cornerMarkId: processTypes.includes('corner_mark') ? planForm.cornerMarkId : null,
      bannerOverlayId: processTypes.includes('banner_overlay') ? planForm.bannerOverlayId : null
    }
  }
}

async function submitPlan() {
  const valid = await planFormRef.value?.validate?.().catch(() => false)
  if (!valid) return
  if (planForm.performerConfigs.length < 1 || planForm.performerConfigs.length > 15) {
    ElMessage.warning('数字人执行项数量必须是 1～15 个')
    return
  }
  if (planForm.performerConfigs.some(item => item.selectionMode === 'binding' ? !item.bindingId : !item.digitalHumanId || !item.voiceId)) {
    ElMessage.warning('请完整配置每个数字人执行项的绑定关系或数字人与声音')
    return
  }
  if (!selectedScriptContent.value.trim()) {
    ElMessage.warning('请先配置脚本内容')
    return
  }
  if (planForm.scheduleMode === 'scheduled' && !planForm.scheduledAt) {
    ElMessage.warning('请选择计划执行时间')
    return
  }

  planDialog.submitting = true
  try {
    const payload = buildPlanPayload()
    let planId = planForm.id
    if (planDialog.isEdit && planId !== null) {
      await updateVideoBatchPlan(planId, payload)
      ElMessage.success('计划修改已保存')
    } else {
      const response = await createVideoBatchPlan(payload)
      planId = responseId(response)
      if (planId === null) throw new Error('创建成功但未返回计划 ID')
      await startVideoBatchPlan(planId)
      ElMessage.success('批量计划已创建并提交执行')
    }
    planDialog.visible = false
    await loadPlanList()
    await loadDispatchGroups()
    if (detail.visible && detail.plan?.id === planId) await openDetail({ id: planId } as BatchPlan)
  } catch (error: any) {
    ElMessage.error(error?.message || '批量计划保存失败')
  } finally {
    planDialog.submitting = false
  }
}

async function startPlan(row: BatchPlan) {
  try {
    await ElMessageBox.confirm('提交后将按统一视频通道规则排队，是否继续？', '提交执行', { type: 'warning', confirmButtonText: '提交', cancelButtonText: '取消' })
    await startVideoBatchPlan(row.id)
    ElMessage.success('计划已提交执行')
    await loadPlanList()
    await loadDispatchGroups()
    if (detail.visible && detail.plan?.id === row.id) await refreshDetail()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '提交执行失败')
  }
}

async function cancelPlan(row: BatchPlan) {
  try {
    await ElMessageBox.confirm('只会阻止尚未投递的子任务，已经调用第三方的任务不会被强制抢占。是否取消？', '取消计划', { type: 'warning', confirmButtonText: '取消计划', cancelButtonText: '返回' })
    await cancelVideoBatchPlan(row.id)
    ElMessage.success('计划已取消')
    await loadPlanList()
    await loadDispatchGroups()
    if (detail.visible && detail.plan?.id === row.id) await refreshDetail()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '取消计划失败')
  }
}

async function deletePlan(row: BatchPlan) {
  try {
    await ElMessageBox.confirm('仅删除尚未提交的计划，删除后不可恢复，是否继续？', '删除计划', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deleteVideoBatchPlan(row.id)
    ElMessage.success('计划已删除')
    await loadPlanList()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除计划失败')
  }
}

async function openDetail(row: BatchPlan) {
  detail.visible = true
  detail.loading = true
  detail.plan = null
  detail.children = []
  try {
    const response = await getVideoBatchPlanDetail(row.id)
    const plan = normalizePlan(getResponseData(response))
    detail.plan = plan
    detail.children = plan.children
  } catch (error: any) {
    detail.visible = false
    ElMessage.error(error?.message || '批量计划详情加载失败')
  } finally {
    detail.loading = false
  }
}

async function refreshDetail() {
  if (!detail.plan) return
  await openDetail(detail.plan)
}

async function retryChild(child: BatchChild) {
  if (!isFailed(child) || detail.retryingId !== null) return
  detail.retryingId = child.id
  try {
    await retryVideoBatchChild(child.id)
    ElMessage.success('失败子任务已重新进入队列')
    await refreshDetail()
    await loadPlanList()
    await loadDispatchGroups()
  } catch (error: any) {
    ElMessage.error(error?.message || '手动重试失败')
  } finally {
    detail.retryingId = null
  }
}

async function getVideoBlob(child: BatchChild): Promise<Blob> {
  if (!child.videoUrl) throw new Error('视频尚未生成')
  const response = await downloadFileByProxy(child.videoUrl, child.videoTaskId || child.id, 'video')
  const blob = response?.data instanceof Blob ? response.data : response instanceof Blob ? response : null
  if (!blob) throw new Error('视频代理未返回有效文件')
  return blob
}

async function openVideoPreview(child: BatchChild) {
  if (!child.videoUrl || preview.loading) return
  stopPreview()
  preview.childId = child.id
  preview.title = `${child.performerName || child.digitalHumanName || '数字人'} · 视频预览`
  preview.loading = true
  preview.visible = true
  try {
    const blob = await getVideoBlob(child)
    previewObjectUrl = URL.createObjectURL(blob)
    preview.url = previewObjectUrl
  } catch (error: any) {
    preview.visible = false
    ElMessage.error(error?.message || '视频预览加载失败')
  } finally {
    preview.loading = false
  }
}

async function downloadChild(child: BatchChild) {
  if (!child.videoUrl || preview.downloadingId !== null) return
  preview.downloadingId = child.id
  try {
    const blob = await getVideoBlob(child)
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${(child.performerName || child.digitalHumanName || '数字人')}-${child.seqNo}.mp4`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch (error: any) {
    ElMessage.error(error?.message || '视频下载失败')
  } finally {
    preview.downloadingId = null
  }
}

function playVoice(url: string, name: string) {
  if (!url) return
  voiceAudio?.pause()
  voiceAudio = new Audio(url)
  voiceAudio.play().catch(() => ElMessage.info(`无法试听${name || '该声音'}`))
}

function stopPreview() {
  if (previewVideo.value) {
    previewVideo.value.pause()
    previewVideo.value.currentTime = 0
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = ''
  preview.url = ''
  preview.loading = false
  preview.childId = null
}

function handlePageSizeChange(size: number) {
  planPageSize.value = size
  planPage.value = 1
  loadPlanList()
}

onMounted(async () => {
  resetPlanForm()
  await Promise.all([loadPlanList(), loadDispatchGroups()])
})

onUnmounted(() => {
  stopPreview()
  voiceAudio?.pause()
  voiceAudio = null
})
</script>

<style scoped>
.batch-plan-page {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: clamp(16px, 2vw, 28px);
  background: #f5f7fb;
}

.page-hero,
.filter-card,
.dispatch-card,
.table-card,
.child-table-card {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  box-shadow: 0 5px 18px rgba(38, 55, 88, 0.04);
}

.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: clamp(20px, 3vw, 32px);
}

.eyebrow {
  color: #7b8aa1;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-hero h1,
.detail-title-row h2 {
  margin: 7px 0 0;
  color: #1f2d43;
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 700;
}

.page-hero p,
.detail-subtitle {
  margin: 7px 0 0;
  color: #8c9ab0;
  font-size: 13px;
}

.hero-actions,
.filter-actions,
.row-actions,
.detail-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-actions {
  justify-content: flex-end;
}

.filter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 14px 16px;
}

.search-input {
  width: min(360px, 100%);
}
.search-input :deep(.el-input__prefix),
.search-input :deep(.el-input__prefix-inner) { display: flex; height: 100%; align-items: center; }

.filter-note,
.form-help,
.section-heading span {
  color: #93a0b2;
  font-size: 12px;
}

.table-card {
  margin-top: 16px;
  overflow: hidden;
}

.dispatch-card {
  margin-top: 16px;
  padding: 18px;
}

.dispatch-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.dispatch-card__header h2 { margin: 4px 0 6px; color: #26384f; font-size: 18px; }
.dispatch-card__header p { margin: 0; color: #8290a4; font-size: 12px; line-height: 1.7; }
.dispatch-card__actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 9px; }
.dispatch-list { display: grid; gap: 9px; margin-top: 16px; }
.dispatch-state { min-height: 150px; padding: 24px 8px 8px; }
.dispatch-state-error :deep(.el-empty) { padding: 10px 0; }
.dispatch-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 11px 13px;
  border: 1px solid #e7ecf3;
  border-radius: 10px;
  background: #fbfcff;
}
.dispatch-item[draggable='true'] { cursor: grab; }
.dispatch-item.dragging { opacity: .55; border-color: #8db6ee; }
.dispatch-item.locked { background: #f7f8fa; }
.dispatch-handle { display: grid; place-items: center; color: #8da0b8; }
.dispatch-main { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; }
.dispatch-main strong { overflow: hidden; color: #34445b; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.dispatch-main span { color: #8b99ac; font-size: 11px; }
.priority-editor { display: flex; align-items: center; gap: 7px; color: #748399; font-size: 12px; }
.priority-editor :deep(.el-input-number) { width: 102px; }

.plan-name {
  display: block;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: #2b6cb0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 650;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-name:hover { color: #1d4ed8; }
.plan-id,
.binding-subtitle,
.select-option-sub,
.plan-id { color: #9aa7b8; font-size: 11px; margin-top: 4px; }

.schedule-cell,
.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.schedule-time { color: #8b98aa; font-size: 11px; white-space: nowrap; }
.progress-cell :deep(.el-progress) { width: 100%; }
.failed-count { color: #e56b6f; font-size: 11px; }
.time-text { color: #68778b; font-size: 12px; white-space: nowrap; }
.muted-text { color: #aab4c1; font-size: 12px; }
.success-text { color: #22a06b; }
.danger-text { color: #e35d6a; }

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-top: 1px solid #eff2f7;
}

.pagination-total { color: #91a0b2; font-size: 12px; }

.detail-page { padding-bottom: 24px; }
.detail-title-row { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
.detail-summary-grid,
.time-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.summary-item,
.time-grid > div { min-width: 0; padding: 14px; border: 1px solid #edf1f6; border-radius: 10px; background: #fbfcfe; }
.summary-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.summary-item span,
.time-grid span { color: #8c9ab0; font-size: 12px; }
.summary-item strong,
.time-grid strong { color: #34445b; font-size: 15px; }
.time-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.time-grid > div { display: flex; flex-direction: column; gap: 7px; }
.detail-tip { display: flex; align-items: center; gap: 8px; margin: 18px 0; padding: 11px 13px; border-radius: 9px; background: #f0f7ff; color: #4f78a8; font-size: 12px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid #edf1f6; }
.section-heading h3 { margin: 0 0 5px; color: #33445b; font-size: 15px; }
.binding-name { color: #3b4b60; font-size: 13px; font-weight: 600; }
.cover-button { position: relative; display: inline-flex; width: 88px; height: 58px; align-items: center; justify-content: center; padding: 0; overflow: hidden; border: 1px solid #e4eaf2; border-radius: 8px; background: #f4f6f9; cursor: pointer; }
.cover-button:disabled { cursor: default; }
.child-cover { width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { display: grid; width: 100%; height: 100%; place-items: center; color: #aeb9c8; }
.cover-play { position: absolute; right: 5px; bottom: 4px; display: grid; width: 22px; height: 22px; place-items: center; border-radius: 50%; background: rgba(25, 45, 74, .76); color: #fff; }

.plan-form { padding: 2px 4px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.form-grid-three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.form-grid-two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.form-section { margin-top: 20px; padding: 16px; border: 1px solid #e8edf5; border-radius: 12px; background: #fbfcff; }
.form-section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; color: #33445b; }
.form-section-title span { color: #93a0b2; font-size: 12px; }
.source-tabs { margin-bottom: 12px; }
.script-editor-wrap { display: grid; gap: 10px; }
.script-preview { margin-top: 10px; padding: 10px 12px; border-radius: 8px; background: #f1f6fd; color: #4c6f9c; font-size: 12px; }
.script-preview p { margin: 5px 0 0; color: #71839b; line-height: 1.6; }
.performer-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.performer-card { min-width: 0; padding: 13px; border: 1px solid #e5ebf3; border-radius: 10px; background: #fff; }
.performer-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.performer-index { color: #3a5575; font-size: 13px; font-weight: 650; }
.performer-fields { display: grid; gap: 9px; margin-top: 11px; }
.custom-performer-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.performer-preview-row { display: flex; min-width: 0; align-items: center; gap: 8px; color: #68788e; font-size: 12px; }
.performer-cover { width: 36px; height: 36px; flex: none; border-radius: 7px; object-fit: cover; }
.asset-option { display: flex; align-items: center; gap: 8px; }
.asset-option img { width: 28px; height: 28px; border-radius: 5px; object-fit: cover; }
.add-performer-button { margin-top: 13px; }
.schedule-radio-group { display: flex; flex-wrap: wrap; }
.selection-summary { margin-top: 8px; color: #7c8da3; font-size: 12px; }
.selection-summary strong { color: #2864b7; }
.selection-summary.warning { color: #d97706; }
.binding-option { display: flex; flex-direction: column; gap: 2px; line-height: 1.35; }
.binding-option small { color: #9aa7b8; font-size: 11px; }
.select-option-main { font-size: 13px; }
.select-option-sub { max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.video-preview-wrap { display: flex; align-items: center; justify-content: center; min-height: 340px; padding: 12px; border-radius: 10px; background: #101827; }
.preview-video { max-width: 100%; max-height: 70vh; border-radius: 6px; object-fit: contain; }

:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) { padding: 10px 8px; }
:deep(.el-table .cell) { min-width: 0; }
:deep(.el-drawer__body) { overflow-x: hidden; }
:deep(.el-drawer__header) { margin-bottom: 0; padding-bottom: 16px; border-bottom: 1px solid #edf1f6; }
:deep(.el-form-item__label) { color: #55657a; font-weight: 600; }

@media (max-width: 900px) {
  .page-hero,
  .filter-card,
  .dispatch-card__header,
  .detail-title-row { align-items: flex-start; flex-direction: column; }
  .hero-actions,
  .filter-actions,
  .dispatch-card__actions { width: 100%; justify-content: space-between; }
  .detail-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .batch-plan-page { padding: 12px; }
  .form-grid,
  .time-grid { grid-template-columns: 1fr; }
  .performer-list,
  .form-grid-three,
  .form-grid-two,
  .custom-performer-fields { grid-template-columns: 1fr; }
  .filter-note { display: none; }
  .dispatch-item { align-items: flex-start; flex-wrap: wrap; }
  .dispatch-main { flex-basis: calc(100% - 34px); }
  .pagination-bar { align-items: flex-start; flex-direction: column; }
}
</style>
