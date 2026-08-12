<template>
  <div class="batch-plan-page">
    <section class="page-hero">
      <div>
        <div class="eyebrow">内容生成 / 批量数字人生成</div>
        <h1>生成计划管理</h1>
        <p>先创建计划，再进入详情逐个配置数字人执行项。</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建批量计划
      </el-button>
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
      <el-button :loading="listLoading" @click="loadPlanList">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </section>

    <section class="table-card">
      <el-table
        v-loading="listLoading"
        :data="planList"
        row-key="id"
        fit
        style="width: 100%"
        :header-cell-style="tableHeaderStyle"
      >
        <el-table-column label="计划名称" min-width="135" show-overflow-tooltip>
          <template #default="{ row }">
            <button class="plan-name" type="button" @click="openDetail(row)">{{ row.name || `计划 #${row.id}` }}</button>
            <div class="plan-id">ID: {{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="脚本" min-width="145" show-overflow-tooltip>
          <template #default="{ row }"><span class="script-cell">{{ truncate(row.script?.content || '', 62) }}</span></template>
        </el-table-column>
        <el-table-column label="执行方式" min-width="85" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :type="row.scheduleMode === 'overnight' ? 'warning' : 'info'">{{ scheduleModeLabel(row.scheduleMode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="72" align="center">
          <template #default="{ row }"><el-tag size="small" :type="statusType(row.statusKey)">{{ statusLabel(row.statusKey) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="任务进度" min-width="88" align="center">
          <template #default="{ row }">
            <div class="progress-cell">
              <span>{{ row.completedCount }}/{{ row.totalCount }}</span>
              <el-progress :percentage="row.totalCount ? Math.round(row.completedCount / row.totalCount * 100) : 0" :show-text="false" :stroke-width="7" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="115" align="center"><template #default="{ row }"><span class="time-cell">{{ formatTime(row.createTime) }}</span></template></el-table-column>
        <el-table-column label="任务开始时间" min-width="115" align="center"><template #default="{ row }"><span class="time-cell">{{ formatTime(row.startTime) }}</span></template></el-table-column>
        <el-table-column label="完成时间" min-width="115" align="center"><template #default="{ row }"><span class="time-cell">{{ formatTime(row.endTime) }}</span></template></el-table-column>
        <el-table-column label="操作" min-width="190" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openDetail(row)">{{ row.statusKey === 'draft' ? '继续配置' : '任务详情' }}</el-button>
              <el-button v-if="row.statusKey === 'draft'" link type="danger" @click="deletePlan(row)">删除</el-button>
              <el-button v-if="canCancelPlan(row)" link type="warning" @click="cancelPlan(row)">取消</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无批量数字人生成计划" /></template>
      </el-table>
      <div class="pagination-bar">
        <span>共 {{ planTotal }} 个计划</span>
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

    <el-dialog v-model="createDialog.visible" title="新建批量数字人生成计划" width="72%" append-to-body destroy-on-close>
      <el-form ref="createFormRef" :model="planForm" :rules="createRules" label-position="top" class="create-form">
        <div class="form-grid form-grid-two">
          <el-form-item label="计划名称" prop="planName">
            <el-input v-model="planForm.planName" maxlength="80" show-word-limit placeholder="例如：8月新品批量数字人生成" />
          </el-form-item>
          <el-form-item label="执行方式" prop="scheduleMode">
            <el-radio-group v-model="planForm.scheduleMode">
              <el-radio-button label="immediate">立即执行</el-radio-button>
              <el-radio-button label="scheduled">指定时间</el-radio-button>
              <el-radio-button label="overnight">夜间预排</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item v-if="planForm.scheduleMode === 'scheduled'" label="计划执行时间" prop="scheduledAt">
          <el-date-picker v-model="planForm.scheduledAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" class="w-full" :disabled-date="disablePastDate" />
        </el-form-item>

        <section class="create-section">
          <div class="section-heading-row">
            <div><strong>脚本内容 <span class="required">*</span></strong></div>
            <div class="script-actions">
              <el-button plain @click="openScriptSelector('library')">脚本库</el-button>
              <el-button plain @click="openScriptSelector('history')">历史记录</el-button>
            </div>
          </div>
          <el-form-item prop="scriptContent" class="script-form-item">
            <el-input v-model="planForm.scriptContent" type="textarea" :rows="8" maxlength="2000" show-word-limit placeholder="请直接输入本次所有视频共用的脚本内容" @input="markScriptManual" />
          </el-form-item>
          <div v-if="planForm.scriptSource !== 'manual'" class="selected-script-source">
            已从{{ planForm.scriptSource === 'library' ? '脚本库' : '历史记录' }}选入，可继续在上方修改；修改后按手工脚本保存。
          </div>
        </section>

        <section class="create-section">
          <div class="section-heading-row">
            <div><strong>需要的增强能力</strong><p>只选择本计划需要的能力；具体样式在第一个执行项中配置。</p></div>
          </div>
          <el-checkbox-group v-model="planForm.processTypes" class="feature-checkboxes">
            <el-checkbox label="subtitle" border>字幕</el-checkbox>
            <el-checkbox label="corner_mark" border>角标</el-checkbox>
            <el-checkbox label="banner_overlay" border>横幅</el-checkbox>
          </el-checkbox-group>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="createDialog.submitting" @click="createDraftPlan">创建任务并配置数字人</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detail.visible" title="批量数字人生成详情" size="96%" destroy-on-close @closed="closeDetail">
      <div v-if="detail.plan" class="detail-page">
        <div class="detail-title-row">
          <div>
            <div class="eyebrow">批量计划 #{{ detail.plan.id }}</div>
            <h2>{{ detail.plan.name }}</h2>
            <p>{{ scheduleModeLabel(detail.plan.scheduleMode) }} · {{ statusLabel(detail.plan.statusKey) }}</p>
          </div>
          <div class="detail-actions">
            <el-button :loading="detail.loading" @click="refreshDetail"><el-icon><Refresh /></el-icon>刷新</el-button>
            <template v-if="detail.plan.statusKey === 'draft'">
              <el-button :loading="detail.saving" @click="saveDraftConfiguration(true)">保存草稿</el-button>
              <el-button type="success" :loading="detail.starting" @click="saveAndStartPlan">保存并提交执行</el-button>
              <el-button type="warning" plain @click="cancelPlan(detail.plan)">取消计划</el-button>
            </template>
            <el-button v-else-if="canCancelPlan(detail.plan)" type="warning" plain @click="cancelPlan(detail.plan)">取消计划</el-button>
          </div>
        </div>

        <div class="plan-summary">
          <div class="summary-card script-summary">
            <span class="summary-title">脚本</span>
            <p>{{ detail.plan.script?.content }}</p>
          </div>
          <div class="summary-card plan-settings-summary">
            <div class="summary-setting-block">
              <span class="summary-title">增强能力</span>
              <el-checkbox-group v-if="detail.plan.statusKey === 'draft'" v-model="planForm.processTypes" class="summary-feature-checkboxes">
                <el-checkbox label="subtitle" border>字幕</el-checkbox>
                <el-checkbox label="corner_mark" border>角标</el-checkbox>
                <el-checkbox label="banner_overlay" border>横幅</el-checkbox>
              </el-checkbox-group>
              <div v-else class="summary-tags"><el-tag v-for="type in detail.plan.processTypes" :key="type" size="small" effect="plain">{{ processTypeLabel(type) }}</el-tag><em v-if="!detail.plan.processTypes.length">无</em></div>
            </div>
            <div class="summary-setting-block">
              <span class="summary-title">执行方式</span>
              <template v-if="detail.plan.statusKey === 'draft'">
                <el-radio-group v-model="planForm.scheduleMode" class="summary-schedule-mode">
                  <el-radio-button label="immediate">立即执行</el-radio-button>
                  <el-radio-button label="scheduled">指定时间</el-radio-button>
                  <el-radio-button label="overnight">夜间预排</el-radio-button>
                </el-radio-group>
                <el-date-picker
                  v-if="planForm.scheduleMode === 'scheduled'"
                  v-model="planForm.scheduledAt"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择计划执行时间"
                  :disabled-date="disablePastDate"
                />
              </template>
              <p v-else>{{ scheduleModeLabel(detail.plan.scheduleMode) }}<template v-if="detail.plan.scheduleMode === 'scheduled'"> · {{ formatTime(detail.plan.scheduledAt) }}</template></p>
            </div>
          </div>
          <div class="summary-card time-summary">
            <span class="summary-title">任务时间</span>
            <div class="time-summary-grid">
              <div><small>创建时间</small><strong>{{ formatTime(detail.plan.createTime) }}</strong></div>
              <div><small>计划执行</small><strong>{{ detail.plan.scheduleMode === 'scheduled' ? formatTime(detail.plan.scheduledAt) : scheduleModeLabel(detail.plan.scheduleMode) }}</strong></div>
              <div><small>任务开始</small><strong>{{ formatTime(detail.plan.startTime) }}</strong></div>
              <div><small>任务完成</small><strong>{{ formatTime(detail.plan.endTime) }}</strong></div>
            </div>
          </div>
        </div>

        <template v-if="detail.plan.statusKey === 'draft'">
          <div class="draft-workspace">
            <aside class="performer-sidebar">
              <div class="sidebar-heading">
                <div><strong>数字人执行项</strong><span>{{ planForm.performerConfigs.length }}/15</span></div>
                <el-button size="small" type="primary" plain :disabled="planForm.performerConfigs.length >= 15" @click="addPerformer"><el-icon><Plus /></el-icon>添加</el-button>
              </div>
              <button
                v-for="(config, index) in planForm.performerConfigs"
                :key="config.key"
                class="performer-nav-item"
                :class="{ active: activePerformerIndex === index }"
                type="button"
                @click="activePerformerIndex = index"
              >
                <img v-if="performerCover(config)" :src="performerCover(config)" alt="" />
                <span v-else class="nav-placeholder"><el-icon><Picture /></el-icon></span>
                <span class="nav-main"><strong>执行项 {{ index + 1 }}</strong><small>{{ performerSummary(config) }}</small></span>
                <el-icon v-if="performerReady(config)" class="ready-icon"><CircleCheck /></el-icon>
              </button>
              <el-button v-if="planForm.performerConfigs.length > 1" class="remove-active" link type="danger" @click="removePerformer(activePerformerIndex)">移除当前执行项</el-button>
            </aside>

            <main v-if="activePerformer" class="performer-editor">
              <div class="editor-heading">
                <div><span class="step-badge">{{ activePerformerIndex + 1 }}</span><div><h3>配置执行项 {{ activePerformerIndex + 1 }}</h3><p>脚本已经自动带入，只需要选择人和声音并完成必要细调。</p></div></div>
                <el-switch v-if="activePerformerIndex > 0" v-model="activePerformer.inheritFromFirst" active-text="沿用第1项设置" @change="handleInheritanceChange" />
              </div>

              <div class="editor-layout">
                <section class="editor-form-panel">
                  <div class="config-block">
                    <div class="block-title"><strong>数字人与声音 <span class="required">*</span></strong><span>与单条数字人生成一致</span></div>
                    <el-radio-group v-model="activePerformer.selectionMode" @change="resetPerformerSelection(activePerformer)">
                      <el-radio-button label="binding">选择绑定关系</el-radio-button>
                      <el-radio-button label="custom">单独选择形象和声音</el-radio-button>
                    </el-radio-group>
                    <div v-if="activePerformer.selectionMode === 'binding'" class="picker-row single-picker">
                      <el-input :model-value="selectedBinding(activePerformer)?.name || ''" readonly placeholder="点击选择绑定关系" @click="openAssetPicker('binding')">
                        <template #prepend>绑定关系</template><template #append><el-button :icon="Search" @click.stop="openAssetPicker('binding')" /></template>
                      </el-input>
                    </div>
                    <div v-else class="picker-row">
                      <el-input :model-value="selectedHuman(activePerformer)?.name || ''" readonly placeholder="点击选择数字人" @click="openAssetPicker('human')">
                        <template #prepend>选择形象</template><template #append><el-button :icon="Search" @click.stop="openAssetPicker('human')" /></template>
                      </el-input>
                      <el-input :model-value="selectedVoice(activePerformer)?.name || ''" readonly placeholder="点击选择声音" @click="openAssetPicker('voice')">
                        <template #prepend>选择配音</template><template #append><el-button :icon="Search" @click.stop="openAssetPicker('voice')" /></template>
                      </el-input>
                    </div>
                    <div v-if="performerReady(activePerformer)" class="selection-preview-strip">
                      <img v-if="performerCover(activePerformer)" :src="performerCover(activePerformer)" alt="数字人封面" />
                      <span>{{ performerSummary(activePerformer) }}</span>
                      <el-button v-if="performerVoiceUrl(activePerformer)" link type="primary" @click="playVoice(performerVoiceUrl(activePerformer), performerSummary(activePerformer))"><el-icon><Headset /></el-icon>试听</el-button>
                    </div>
                  </div>

                  <div class="config-block">
                    <div class="block-title"><strong>视频参数</strong><span v-if="activePerformerIndex > 0 && activePerformer.inheritFromFirst">已沿用第1项</span></div>
                    <div class="form-grid form-grid-two">
                      <label>语言<el-select v-model="activePerformer.videoOptions.language" :disabled="activePerformerIndex > 0 && activePerformer.inheritFromFirst"><el-option label="中文" value="zh" /></el-select></label>
                      <label>视频方向<el-radio-group v-model="activePerformer.videoOptions.videoType" :disabled="activePerformerIndex > 0 && activePerformer.inheritFromFirst"><el-radio :label="0">竖版</el-radio><el-radio :label="1">横版</el-radio></el-radio-group></label>
                    </div>
                  </div>

                  <div v-if="planForm.processTypes.length" class="config-block">
                    <div class="block-title enhancement-block-title"><strong>增强设置</strong><span>{{ activePerformerIndex === 0 ? '第1项必须完成，后续默认沿用' : '可取消沿用后微调' }}</span></div>
                    <div v-if="planForm.processTypes.includes('corner_mark')" class="enhancement-row">
                      <span class="enhancement-label">角标 <em>*</em></span>
                      <div class="enhancement-control">
                        <el-select v-model="activePerformer.postProcessConfig.cornerMarkId" filterable clearable placeholder="选择角标" :disabled="activePerformerIndex > 0 && activePerformer.inheritFromFirst">
                          <el-option v-for="item in cornerMarkOptions" :key="item.id" :label="item.name" :value="item.id" />
                        </el-select>
                        <small v-if="!cornerMarkOptions.length" class="asset-empty-warning">当前团队暂无可用角标，请先在素材管理中创建。</small>
                      </div>
                    </div>
                    <div v-if="planForm.processTypes.includes('banner_overlay')" class="enhancement-row">
                      <span class="enhancement-label">横幅 <em>*</em></span>
                      <div class="enhancement-control">
                        <el-select v-model="activePerformer.postProcessConfig.bannerOverlayId" filterable clearable placeholder="选择横幅" :disabled="activePerformerIndex > 0 && activePerformer.inheritFromFirst">
                          <el-option v-for="item in bannerOverlayOptions" :key="item.id" :label="item.name" :value="item.id" />
                        </el-select>
                        <small v-if="!bannerOverlayOptions.length" class="asset-empty-warning">当前团队暂无可用横幅，请先在素材管理中创建。</small>
                      </div>
                    </div>
                    <div v-if="planForm.processTypes.includes('subtitle')" class="subtitle-note">
                      字幕样式在右侧预览区调整，配置会随当前执行项保存。
                    </div>
                  </div>

                  <div class="config-block script-readonly-block">
                    <div class="block-title"><strong>本项脚本</strong><span>由父计划统一填入</span></div>
                    <el-input :model-value="planForm.scriptContent" type="textarea" :rows="5" readonly />
                  </div>
                </section>

                <aside class="preview-panel">
                  <div class="preview-heading"><strong>预览效果</strong><span>{{ performerSummary(activePerformer) }}</span></div>
                  <SubtitlePreview
                    v-if="activePreviewProcessTypes.length"
                    :key="activePerformer.key"
                    :frame-base64="activePreviewFrame"
                    :script-text="planForm.scriptContent"
                    :corner-mark-url="activeCornerMarkUrl"
                    :banner-overlay-base64="activeBannerBase64"
                    :process-types="activePreviewProcessTypes"
                    :enable-subtitle="planForm.processTypes.includes('subtitle')"
                    :initial-config="activePerformer.postProcessConfig.subtitleConfig"
                    @update:config="updateActiveSubtitleConfig"
                  />
                  <div v-else class="cover-preview" :class="{ landscape: activePerformer.videoOptions.videoType === 1 }">
                    <img v-if="performerCover(activePerformer)" :src="performerCover(activePerformer)" alt="数字人预览" />
                    <div v-else><el-icon><Picture /></el-icon><span>选择数字人后显示封面预览</span></div>
                  </div>
                  <p class="preview-help">这里只加载数字人封面；不会提前下载或播放完整视频。</p>
                </aside>
              </div>
            </main>
          </div>
        </template>

        <section v-else class="child-table-card">
          <div class="section-heading-row"><div><strong>视频子任务</strong><p>点击预览时才加载结果视频。</p></div><el-tag>{{ detail.children.length }} 条</el-tag></div>
          <el-table :data="detail.children" row-key="id" fit style="width:100%" :header-cell-style="tableHeaderStyle">
            <el-table-column label="#" min-width="55" align="center"><template #default="{ row }">{{ row.seqNo }}</template></el-table-column>
            <el-table-column label="封面" min-width="90" align="center"><template #default="{ row }"><img v-if="row.coverUrl" :src="row.coverUrl" class="child-cover" alt="" /><span v-else>-</span></template></el-table-column>
            <el-table-column label="数字人 / 声音" min-width="210"><template #default="{ row }"><strong>{{ row.digitalHumanName || row.performerName || '-' }}</strong><p>{{ row.voiceName || '-' }}</p></template></el-table-column>
            <el-table-column label="状态" min-width="100" align="center"><template #default="{ row }"><el-tag :type="statusType(row.statusKey)">{{ statusLabel(row.statusKey) }}</el-tag></template></el-table-column>
            <el-table-column label="开始时间" min-width="155" align="center"><template #default="{ row }">{{ formatTime(row.startTime) }}</template></el-table-column>
            <el-table-column label="完成时间" min-width="155" align="center"><template #default="{ row }">{{ formatTime(row.endTime) }}</template></el-table-column>
            <el-table-column label="操作" min-width="190" align="center">
              <template #default="{ row }">
                <el-button v-if="row.videoUrl" link type="primary" @click="openVideoPreview(row)">预览</el-button>
                <el-button v-if="row.videoUrl" link type="success" @click="downloadChild(row)">下载</el-button>
                <el-button v-if="row.retryable" link type="warning" @click="retryChild(row)">失败重试</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>
      <el-skeleton v-else :rows="8" animated />
    </el-drawer>

    <el-dialog v-model="scriptSelector.visible" title="选择脚本" width="76%" append-to-body>
      <el-tabs v-model="scriptSelector.mode" @tab-change="handleScriptTabChange">
        <el-tab-pane label="脚本库" name="library" />
        <el-tab-pane label="历史记录" name="history" />
      </el-tabs>
      <el-input v-model="scriptSelector.search" class="selector-search" clearable placeholder="查找脚本内容或标签">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-table :data="filteredScriptOptions" height="420" border :header-cell-style="tableHeaderStyle">
        <template v-if="scriptSelector.mode === 'library'">
          <el-table-column prop="title" label="标题" min-width="150" />
          <el-table-column label="标签" min-width="160"><template #default="{ row }"><el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag></template></el-table-column>
          <el-table-column prop="content" label="内容" min-width="360" show-overflow-tooltip />
        </template>
        <template v-else>
          <el-table-column prop="createTime" label="生成时间" min-width="170"><template #default="{ row }">{{ formatTime(row.createTime) }}</template></el-table-column>
          <el-table-column prop="content" label="内容片段" min-width="500" show-overflow-tooltip />
        </template>
        <el-table-column label="操作" width="100" align="center" fixed="right"><template #default="{ row }"><el-button type="primary" @click="selectScript(row)">选入</el-button></template></el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="assetPicker.visible" :title="assetPickerTitle" width="82%" append-to-body>
      <el-input v-model="assetPicker.search" class="selector-search" clearable :placeholder="`搜索${assetPickerTitle}`"><template #prefix><el-icon><Search /></el-icon></template></el-input>
      <div v-if="assetPicker.type !== 'voice'" class="asset-grid">
        <button v-for="item in filteredAssetOptions" :key="item.id" class="asset-card" type="button" @click="selectAsset(item)">
          <img v-if="assetCover(item)" :src="assetCover(item)" alt="" />
          <span v-else class="asset-card-placeholder"><el-icon><Picture /></el-icon></span>
          <strong>{{ assetTitle(item) }}</strong>
          <small>{{ assetSubtitle(item) }}</small>
          <el-button type="primary" size="small">选入</el-button>
        </button>
      </div>
      <el-table v-else :data="filteredAssetOptions" height="440" border :header-cell-style="tableHeaderStyle">
        <el-table-column prop="name" label="声音名称" min-width="220" />
        <el-table-column prop="language" label="语言" min-width="120" />
        <el-table-column label="试听" min-width="120" align="center"><template #default="{ row }"><el-button v-if="row.url" link type="primary" @click="playVoice(row.url, row.name)"><el-icon><Headset /></el-icon>试听</el-button></template></el-table-column>
        <el-table-column label="操作" width="100" align="center"><template #default="{ row }"><el-button type="primary" @click="selectAsset(row)">选入</el-button></template></el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="preview.visible" :title="preview.title" width="72%" append-to-body @closed="stopPreview">
      <div class="video-preview-wrap"><el-skeleton v-if="preview.loading" :rows="5" animated /><video v-else-if="preview.url" ref="previewVideo" :src="preview.url" controls autoplay playsinline /></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Headset, Picture, Plus, Refresh, Search } from '@element-plus/icons-vue'
import SubtitlePreview from '/@/components/SubtitlePreview/index.vue'
import {
  cancelVideoBatchPlan,
  createVideoBatchPlan,
  deleteVideoBatchPlan,
  downloadFileByProxy,
  getBannerOverlayList,
  getBindingList,
  getCornerMarkList,
  getDigitalHumanList,
  getScriptHistoryList,
  getScriptPaginateList,
  getVideoBatchPlanDetail,
  getVideoBatchPlanList,
  getVoiceList,
  retryVideoBatchChild,
  startVideoBatchPlan,
  updateVideoBatchPlan
} from '/@/api/material'

type ScheduleMode = 'immediate' | 'scheduled' | 'overnight'
type ScriptSource = 'manual' | 'library' | 'history'
type StatusKey = 'draft' | 'waiting' | 'running' | 'completed' | 'partial_failed' | 'failed' | 'cancelled'
type AssetPickerType = 'binding' | 'human' | 'voice'

interface ScriptOption { id: string | number; title: string; content: string; tags: string[]; createTime?: string }
interface AssetOption { id: string | number; name: string; coverUrl?: string; url?: string; videoUrl?: string; language?: string }
interface BindingOption { id: string | number; name: string; digitalHumanName: string; voiceName: string; coverUrl?: string; voiceUrl?: string }
interface PerformerConfig {
  key: string
  selectionMode: 'binding' | 'custom'
  bindingId: string | number | null
  digitalHumanId: string | number | null
  voiceId: string | number | null
  inheritFromFirst: boolean
  videoOptions: { language: string; videoType: 0 | 1 }
  postProcessConfig: { processTypes: string[]; subtitleSelector: number; subtitleConfig: Record<string, any>; cornerMarkId: string | number | null; bannerOverlayId: string | number | null }
}
interface BatchChild {
  id: string | number; seqNo: number; bindingId?: string | number; selectionMode?: 'binding' | 'custom'; digitalHumanId?: string | number | null; voiceId?: string | number | null
  bindingName: string; performerName?: string; digitalHumanName: string; voiceName: string; statusKey: StatusKey; createTime?: string; startTime?: string; endTime?: string
  errorMessage?: string; videoUrl?: string; coverUrl?: string; videoTaskId?: string | number; retryable?: boolean; postProcessConfig?: Record<string, any>; videoOptions?: Record<string, any>
}
interface BatchPlan {
  id: string | number; name: string; statusKey: StatusKey; scheduleMode: ScheduleMode; scheduledAt?: string; createTime?: string; startTime?: string; endTime?: string
  totalCount: number; completedCount: number; failedCount: number; script?: { source: ScriptSource; sourceId?: string | number | null; title?: string; content?: string }
  processTypes: string[]; cornerMarkId?: string | number | null; bannerOverlayId?: string | number | null; videoOptions?: Record<string, any>; children: BatchChild[]
}

const DEFAULT_SUBTITLE_CONFIG = {
  font_name: 'Microsoft YaHei', font_size: 10, margin_v: 45, primary_colour: '#FFFFFF', outline_colour: '#000000', outline: 2,
  bold: 0, bg_mode: 'none', bg_height: 60, blur_strength: 15, bg_colour: 'rgba(0,0,0,0.5)', blur_subtitles: false
}
const tableHeaderStyle = { background: '#f7f9fc', color: '#536174', fontWeight: '600' }
const listLoading = ref(false)
const planList = ref<BatchPlan[]>([])
const planPage = ref(1)
const planPageSize = ref(20)
const planTotal = ref(0)
const searchKeyword = ref('')
const createFormRef = ref<any>()
const activePerformerIndex = ref(0)
const activePreviewFrame = ref('')
const activeBannerBase64 = ref('')
const previewVideo = ref<HTMLVideoElement | null>(null)
let previewObjectUrl = ''
let voiceAudio: HTMLAudioElement | null = null
let previewLoadSequence = 0

const planForm = reactive({
  id: null as string | number | null,
  planName: '', scriptSource: 'manual' as ScriptSource, scriptId: null as string | number | null, historyId: null as string | number | null, scriptContent: '',
  performerConfigs: [] as PerformerConfig[], scheduleMode: 'immediate' as ScheduleMode, scheduledAt: '', processTypes: [] as string[]
})
const createDialog = reactive({ visible: false, submitting: false })
const detail = reactive({ visible: false, loading: false, saving: false, starting: false, retryingId: null as string | number | null, plan: null as BatchPlan | null, children: [] as BatchChild[] })
const scriptSelector = reactive({ visible: false, mode: 'library' as 'library' | 'history', search: '' })
const assetPicker = reactive({ visible: false, type: 'binding' as AssetPickerType, search: '' })
const preview = reactive({ visible: false, loading: false, url: '', title: '', downloadingId: null as string | number | null })
const scriptOptions = ref<ScriptOption[]>([])
const historyOptions = ref<ScriptOption[]>([])
const bindingOptions = ref<BindingOption[]>([])
const digitalHumanOptions = ref<AssetOption[]>([])
const voiceOptions = ref<AssetOption[]>([])
const cornerMarkOptions = ref<Array<{ id: string | number; name: string; url?: string }>>([])
const bannerOverlayOptions = ref<Array<{ id: string | number; name: string; url?: string }>>([])
const resourcesLoaded = reactive({ scripts: false, history: false, bindings: false, humans: false, voices: false, corners: false, banners: false })

const createRules = {
  planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  scriptContent: [{ validator: (_rule: any, value: string, callback: (error?: Error) => void) => value?.trim() ? callback() : callback(new Error('请输入脚本内容')), trigger: 'blur' }],
  scheduleMode: [{ required: true, message: '请选择执行方式', trigger: 'change' }],
  scheduledAt: [{ validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (planForm.scheduleMode !== 'scheduled') return callback()
    if (!value) return callback(new Error('请选择计划执行时间'))
    if (new Date(value.replace(' ', 'T')).getTime() <= Date.now()) return callback(new Error('指定时间必须晚于当前时间'))
    callback()
  }, trigger: 'change' }]
}

const activePerformer = computed(() => planForm.performerConfigs[activePerformerIndex.value] || null)
const activeCornerMarkUrl = computed(() => cornerMarkOptions.value.find(item => String(item.id) === String(activePerformer.value?.postProcessConfig.cornerMarkId))?.url || '')
const activePreviewProcessTypes = computed(() => planForm.processTypes.filter((type) => {
  if (type === 'subtitle') return true
  if (type === 'corner_mark') return Boolean(activeCornerMarkUrl.value)
  if (type === 'banner_overlay') return Boolean(activeBannerBase64.value)
  return false
}))
const assetPickerTitle = computed(() => ({ binding: '选择绑定关系', human: '选择数字人形象', voice: '选择配音声音' }[assetPicker.type]))
const filteredScriptOptions = computed(() => {
  const source = scriptSelector.mode === 'library' ? scriptOptions.value : historyOptions.value
  const keyword = scriptSelector.search.trim().toLowerCase()
  if (!keyword) return source
  return source.filter(item => `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase().includes(keyword))
})
const filteredAssetOptions = computed<any[]>(() => {
  const source = assetPicker.type === 'binding' ? bindingOptions.value : assetPicker.type === 'human' ? digitalHumanOptions.value : voiceOptions.value
  const keyword = assetPicker.search.trim().toLowerCase()
  if (!keyword) return source
  return source.filter((item: any) => `${item.name} ${item.digitalHumanName || ''} ${item.voiceName || ''} ${item.language || ''}`.toLowerCase().includes(keyword))
})

function deepClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) }
function getResponseData(response: any): any { return response?.data?.data ?? response?.data ?? {} }
function getPageData(response: any): { items: any[]; total: number } {
  const data = getResponseData(response)
  if (Array.isArray(data)) return { items: data, total: data.length }
  const items = data?.data || data?.items || data?.results || []
  return { items: Array.isArray(items) ? items : [], total: Number(data?.total ?? data?.count ?? items.length) }
}
function responseId(response: any): string | number | null { const data = getResponseData(response); return data?.id ?? data?.planId ?? data?.plan?.id ?? null }
function normalizeStatus(value: any, fallback: StatusKey = 'waiting'): StatusKey {
  const raw = String(value ?? '').trim().toLowerCase()
  if (['draft', 'unsubmitted', '未执行', '草稿'].includes(raw)) return 'draft'
  if (['running', 'processing', 'in_progress', 'post_processing', 'subtitle_processing', 'video_generating', '执行中', '生成中'].includes(raw)) return 'running'
  if (['completed', 'success', 'succeeded', 'done', '已完成', '5', '2'].includes(raw)) return 'completed'
  if (['partial_failed', 'partial-failed', '部分失败'].includes(raw)) return 'partial_failed'
  if (['failed', 'fail', '失败', '执行失败', '-1'].includes(raw)) return 'failed'
  if (['cancelled', 'canceled', '已取消'].includes(raw)) return 'cancelled'
  if (['waiting', 'pending', 'queued', 'submitted', '等待中', '待执行', '0', '1'].includes(raw)) return 'waiting'
  return fallback
}
function normalizeScheduleMode(value: any): ScheduleMode { const raw = String(value ?? '').toLowerCase(); return raw === 'scheduled' ? 'scheduled' : raw === 'overnight' ? 'overnight' : 'immediate' }
function normalizeChild(item: any, index: number): BatchChild {
  const snapshot = item.bindingSnapshot || item.binding_snapshot || {}
  const rawStatus = item.taskStatus ?? item.status ?? item.state
  return {
    id: item.id ?? index, seqNo: Number(item.seqNo ?? item.child_seq ?? index + 1), bindingId: item.bindingId ?? item.binding_id,
    selectionMode: item.selectionMode || snapshot.selectionMode || (item.bindingId ? 'binding' : 'custom'),
    digitalHumanId: snapshot.digitalHumanId ?? snapshot.human?.id ?? null, voiceId: snapshot.voiceId ?? snapshot.voice?.id ?? null,
    bindingName: snapshot.title || `${snapshot.digitalHumanName || '数字人'} + ${snapshot.voiceName || '配音'}`,
    performerName: snapshot.digitalHumanName || '', digitalHumanName: snapshot.digitalHumanName || '', voiceName: snapshot.voiceName || '', statusKey: normalizeStatus(rawStatus),
    createTime: item.createTime || item.create_time, startTime: item.startTime || item.start_time, endTime: item.endTime || item.end_time,
    errorMessage: item.errorMessage || item.error_message || '', videoUrl: item.videoUrl || item.video_url || '',
    coverUrl: item.videoCoverUrl || item.digitalHumanCoverUrl || snapshot.digitalHumanCoverUrl || snapshot.human?.coverUrl || '', videoTaskId: item.videoTaskId,
    retryable: Boolean(item.retryable ?? normalizeStatus(rawStatus) === 'failed'), postProcessConfig: item.postProcessConfig || {}, videoOptions: item.videoOptions || {}
  }
}
function normalizePlan(item: any): BatchPlan {
  const source = item?.plan || item?.detail || item || {}
  const childSource = source.children || item?.children || source.items || []
  const children = childSource.map(normalizeChild).sort((a: BatchChild, b: BatchChild) => a.seqNo - b.seqNo)
  const post = source.postProcessConfig || source.post_process_config || source.postProcessSnapshot || {}
  const script = source.script || source.scriptSnapshot || source.script_snapshot || {}
  return {
    id: source.id ?? source.planId, name: source.planName || source.name || '', statusKey: normalizeStatus(source.taskStatus ?? source.status ?? source.state),
    scheduleMode: normalizeScheduleMode(source.scheduleMode ?? source.dispatchMode), scheduledAt: source.scheduledAt || source.eligibleAt || '',
    createTime: source.createTime || source.created_at, startTime: source.startTime || source.start_time, endTime: source.endTime || source.end_time,
    totalCount: Number(source.totalCount ?? source.childCount ?? children.length), completedCount: Number(source.completedCount ?? source.successCount ?? 0), failedCount: Number(source.failedCount ?? 0),
    script: { source: script.source || 'manual', sourceId: script.sourceId ?? script.id ?? null, title: script.title || '', content: script.content || '' },
    processTypes: post.processTypes || post.process_types || [], cornerMarkId: post.cornerMarkId ?? null, bannerOverlayId: post.bannerOverlayId ?? null, videoOptions: source.videoOptions || {}, children
  }
}

function statusLabel(status: StatusKey) { return ({ draft: '未执行', waiting: '等待中', running: '执行中', completed: '已完成', partial_failed: '部分失败', failed: '失败', cancelled: '已取消' } as Record<StatusKey, string>)[status] }
function statusType(status: StatusKey): 'success' | 'warning' | 'danger' | 'info' | '' { return ({ draft: 'info', waiting: 'info', running: 'warning', completed: 'success', partial_failed: 'danger', failed: 'danger', cancelled: '' } as Record<StatusKey, any>)[status] }
function scheduleModeLabel(mode: ScheduleMode) { return ({ immediate: '立即执行', scheduled: '指定时间', overnight: '夜间预排' } as Record<ScheduleMode, string>)[mode] }
function processTypeLabel(type: string) { return ({ subtitle: '字幕', corner_mark: '角标', banner_overlay: '横幅' } as Record<string, string>)[type] || type }
function formatTime(value?: string | number | null) { if (!value) return '-'; const raw = String(value); if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) return raw.replace('T', ' ').slice(0, 19); const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : date.toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-') }
function truncate(value: string, length: number) { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > length ? `${text.slice(0, length)}…` : text || '-' }
function disablePastDate(date: Date) { return date.getTime() < Date.now() - 60000 }
function canCancelPlan(plan: BatchPlan) { return ['draft', 'waiting', 'running'].includes(plan.statusKey) }
function scheduledTimestamp(value: string) { return value ? new Date(value.includes('T') ? value : value.replace(' ', 'T')).getTime() : Number.NaN }
function scheduledAtPayload() {
  if (planForm.scheduleMode !== 'scheduled' || !planForm.scheduledAt) return null
  const timestamp = scheduledTimestamp(planForm.scheduledAt)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}
function validateScheduleForSubmission() {
  if (planForm.scheduleMode !== 'scheduled') return true
  if (!planForm.scheduledAt) { ElMessage.warning('请选择计划执行时间'); return false }
  const timestamp = scheduledTimestamp(planForm.scheduledAt)
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) { ElMessage.warning('计划执行时间已过，请重新选择晚于当前时间的时间'); return false }
  return true
}

function createPerformerConfig(inherit = false): PerformerConfig {
  const first = planForm.performerConfigs[0]
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, selectionMode: 'binding', bindingId: null, digitalHumanId: null, voiceId: null, inheritFromFirst: inherit,
    videoOptions: first && inherit ? deepClone(first.videoOptions) : { language: 'zh', videoType: 0 },
    postProcessConfig: first && inherit ? deepClone(first.postProcessConfig) : { processTypes: [...planForm.processTypes], subtitleSelector: planForm.processTypes.includes('subtitle') ? 1 : 0, subtitleConfig: deepClone(DEFAULT_SUBTITLE_CONFIG), cornerMarkId: null, bannerOverlayId: null }
  }
}
function selectedBinding(config: PerformerConfig) { return bindingOptions.value.find(item => String(item.id) === String(config.bindingId)) }
function selectedHuman(config: PerformerConfig) { return digitalHumanOptions.value.find(item => String(item.id) === String(config.digitalHumanId)) }
function selectedVoice(config: PerformerConfig) { return voiceOptions.value.find(item => String(item.id) === String(config.voiceId)) }
function performerCover(config: PerformerConfig) { return config.selectionMode === 'binding' ? selectedBinding(config)?.coverUrl || '' : selectedHuman(config)?.coverUrl || '' }
function performerVoiceUrl(config: PerformerConfig) { return config.selectionMode === 'binding' ? selectedBinding(config)?.voiceUrl || '' : selectedVoice(config)?.url || '' }
function performerSummary(config: PerformerConfig) { const binding = selectedBinding(config); return config.selectionMode === 'binding' ? binding ? `${binding.digitalHumanName} + ${binding.voiceName}` : '未选择绑定关系' : `${selectedHuman(config)?.name || '未选形象'} + ${selectedVoice(config)?.name || '未选声音'}` }
function performerReady(config: PerformerConfig) { return config.selectionMode === 'binding' ? Boolean(config.bindingId) : Boolean(config.digitalHumanId && config.voiceId) }
function assetCover(item: any) { return item.coverUrl || '' }
function assetTitle(item: any) { return item.name || item.digitalHumanName || '未命名' }
function assetSubtitle(item: any) { return assetPicker.type === 'binding' ? `${item.digitalHumanName} + ${item.voiceName}` : item.language || '' }

function resetPlanForm() {
  Object.assign(planForm, { id: null, planName: '', scriptSource: 'manual', scriptId: null, historyId: null, scriptContent: '', performerConfigs: [], scheduleMode: 'immediate', scheduledAt: '', processTypes: [] })
  activePerformerIndex.value = 0
  createFormRef.value?.clearValidate?.()
}
function openCreateDialog() { resetPlanForm(); createDialog.visible = true }
function markScriptManual() { planForm.scriptSource = 'manual'; planForm.scriptId = null; planForm.historyId = null }
function openScriptSelector(mode: 'library' | 'history') { scriptSelector.mode = mode; scriptSelector.search = ''; scriptSelector.visible = true; mode === 'library' ? loadScripts() : loadHistory() }
function handleScriptTabChange(name: string | number) { scriptSelector.mode = String(name) as 'library' | 'history'; scriptSelector.search = ''; scriptSelector.mode === 'library' ? loadScripts() : loadHistory() }
function selectScript(script: ScriptOption) { planForm.scriptSource = scriptSelector.mode; planForm.scriptId = scriptSelector.mode === 'library' ? script.id : null; planForm.historyId = scriptSelector.mode === 'history' ? script.id : null; planForm.scriptContent = script.content; scriptSelector.visible = false; ElMessage.success('脚本已选入') }

async function createDraftPlan() {
  const valid = await createFormRef.value?.validate?.().catch(() => false)
  if (!valid) return
  createDialog.submitting = true
  try {
    const sourceId = planForm.scriptSource === 'library' ? planForm.scriptId : planForm.scriptSource === 'history' ? planForm.historyId : null
    const response = await createVideoBatchPlan({
      planName: planForm.planName.trim(), script: { source: planForm.scriptSource, sourceId, title: '', content: planForm.scriptContent.trim() }, performerConfigs: [],
      scheduleMode: planForm.scheduleMode, scheduledAt: planForm.scheduleMode === 'scheduled' ? new Date(planForm.scheduledAt.replace(' ', 'T')).toISOString() : null,
      videoOptions: { language: 'zh', videoType: 0 },
      postProcessConfig: { processTypes: [...planForm.processTypes] }
    })
    const id = responseId(response)
    if (id === null) throw new Error('创建成功但未返回计划 ID')
    createDialog.visible = false
    await loadPlanList()
    await openDetail({ id } as BatchPlan)
    ElMessage.success('计划已创建，请配置数字人执行项')
  } catch (error: any) { ElMessage.error(error?.message || '计划创建失败') } finally { createDialog.submitting = false }
}

function fillPlanForm(plan: BatchPlan) {
  planForm.id = plan.id; planForm.planName = plan.name; planForm.scriptSource = plan.script?.source || 'manual'; planForm.scriptId = plan.script?.source === 'library' ? plan.script.sourceId ?? null : null; planForm.historyId = plan.script?.source === 'history' ? plan.script.sourceId ?? null : null; planForm.scriptContent = plan.script?.content || ''
  planForm.scheduleMode = plan.scheduleMode; planForm.scheduledAt = plan.scheduledAt ? String(plan.scheduledAt).replace('T', ' ').slice(0, 19) : ''; planForm.processTypes = [...plan.processTypes]
  planForm.performerConfigs = plan.children.map((child) => ({
    key: String(child.id), selectionMode: child.selectionMode || (child.bindingId ? 'binding' : 'custom'), bindingId: child.bindingId ?? null, digitalHumanId: child.digitalHumanId ?? null, voiceId: child.voiceId ?? null,
    inheritFromFirst: false, videoOptions: { language: 'zh', videoType: Number(child.videoOptions?.video_type ?? child.videoOptions?.videoType ?? 0) === 1 ? 1 : 0 },
    postProcessConfig: { processTypes: [...plan.processTypes], subtitleSelector: plan.processTypes.includes('subtitle') ? 1 : 0, subtitleConfig: deepClone(child.postProcessConfig?.subtitleConfig || child.postProcessConfig?.subtitle_config || DEFAULT_SUBTITLE_CONFIG), cornerMarkId: child.postProcessConfig?.cornerMarkId ?? child.postProcessConfig?.corner_mark_id ?? null, bannerOverlayId: child.postProcessConfig?.bannerOverlayId ?? child.postProcessConfig?.banner_overlay_id ?? null }
  }))
  const first = planForm.performerConfigs[0]
  planForm.performerConfigs.forEach((config, index) => {
    if (index === 0 || !first) return
    config.inheritFromFirst = JSON.stringify(config.videoOptions) === JSON.stringify(first.videoOptions)
      && JSON.stringify(config.postProcessConfig) === JSON.stringify(first.postProcessConfig)
  })
  if (!planForm.performerConfigs.length) planForm.performerConfigs = [createPerformerConfig(false)]
  activePerformerIndex.value = 0
}
function addPerformer() { if (planForm.performerConfigs.length >= 15) return; planForm.performerConfigs.push(createPerformerConfig(true)); activePerformerIndex.value = planForm.performerConfigs.length - 1 }
function removePerformer(index: number) { if (planForm.performerConfigs.length <= 1) return; planForm.performerConfigs.splice(index, 1); activePerformerIndex.value = Math.max(0, Math.min(index, planForm.performerConfigs.length - 1)) }
function resetPerformerSelection(config: PerformerConfig) { config.bindingId = null; config.digitalHumanId = null; config.voiceId = null }
function handleInheritanceChange(value: string | number | boolean) { if (value && activePerformer.value && planForm.performerConfigs[0]) { activePerformer.value.videoOptions = deepClone(planForm.performerConfigs[0].videoOptions); activePerformer.value.postProcessConfig = deepClone(planForm.performerConfigs[0].postProcessConfig) } }
function updateActiveSubtitleConfig(value: any) {
  if (!activePerformer.value || (activePerformerIndex.value > 0 && activePerformer.value.inheritFromFirst)) return
  const nextConfig = deepClone(value)
  const currentConfig = activePerformer.value.postProcessConfig.subtitleConfig || {}
  // 预览成功后子组件会回传当前配置；内容未变化时不能替换对象，
  // 否则 initialConfig 监听会再次渲染，形成连续预览请求。
  if (JSON.stringify(currentConfig) === JSON.stringify(nextConfig)) return
  activePerformer.value.postProcessConfig.subtitleConfig = nextConfig
}

function validateDraft() {
  if (planForm.scheduleMode === 'scheduled' && !planForm.scheduledAt) { ElMessage.warning('请选择计划执行时间'); return false }
  if (planForm.scheduleMode === 'scheduled' && !Number.isFinite(scheduledTimestamp(planForm.scheduledAt))) { ElMessage.warning('计划执行时间格式不正确，请重新选择'); return false }
  if (!planForm.performerConfigs.length || planForm.performerConfigs.length > 15) { ElMessage.warning('请配置 1～15 个数字人执行项'); return false }
  const missing = planForm.performerConfigs.findIndex(config => !performerReady(config))
  if (missing >= 0) { activePerformerIndex.value = missing; ElMessage.warning(`请完整选择执行项 ${missing + 1} 的数字人和声音`); return false }
  const first = planForm.performerConfigs[0]
  if (planForm.processTypes.includes('subtitle') && !Object.keys(first.postProcessConfig.subtitleConfig || {}).length) { activePerformerIndex.value = 0; ElMessage.warning('请先完成第1项字幕设置'); return false }
  if (planForm.processTypes.includes('corner_mark') && !first.postProcessConfig.cornerMarkId) { activePerformerIndex.value = 0; ElMessage.warning('请先为第1项选择角标'); return false }
  if (planForm.processTypes.includes('corner_mark') && !cornerMarkOptions.value.find(item => String(item.id) === String(first.postProcessConfig.cornerMarkId))?.url) { activePerformerIndex.value = 0; ElMessage.warning('所选角标缺少图片地址，请重新上传角标'); return false }
  if (planForm.processTypes.includes('banner_overlay') && !first.postProcessConfig.bannerOverlayId) { activePerformerIndex.value = 0; ElMessage.warning('请先为第1项选择横幅'); return false }
  if (planForm.processTypes.includes('banner_overlay') && !bannerOverlayOptions.value.find(item => String(item.id) === String(first.postProcessConfig.bannerOverlayId))?.url) { activePerformerIndex.value = 0; ElMessage.warning('所选横幅缺少图片地址，请重新生成横幅'); return false }
  return true
}
function buildDraftPayload() {
  const first = planForm.performerConfigs[0]
  const configs = planForm.performerConfigs.map((config, index) => {
    const effectiveVideo = index > 0 && config.inheritFromFirst ? deepClone(first.videoOptions) : deepClone(config.videoOptions)
    const effectivePost = index > 0 && config.inheritFromFirst ? deepClone(first.postProcessConfig) : deepClone(config.postProcessConfig)
    effectivePost.processTypes = [...planForm.processTypes]
    return config.selectionMode === 'binding'
      ? { selectionMode: 'binding', bindingId: config.bindingId, videoOptions: effectiveVideo, postProcessConfig: effectivePost }
      : { selectionMode: 'custom', digitalHumanId: config.digitalHumanId, voiceId: config.voiceId, videoOptions: effectiveVideo, postProcessConfig: effectivePost }
  })
  return {
    performerConfigs: configs,
    videoOptions: deepClone(first.videoOptions),
    postProcessConfig: { processTypes: [...planForm.processTypes] },
    scheduleMode: planForm.scheduleMode,
    scheduledAt: scheduledAtPayload()
  }
}
async function saveDraftConfiguration(notify = true) {
  if (!detail.plan || !validateDraft()) return false
  detail.saving = true
  try { await updateVideoBatchPlan(detail.plan.id, buildDraftPayload()); if (notify) ElMessage.success('草稿配置已保存'); await refreshDetail(); await loadPlanList(); return true } catch (error: any) { ElMessage.error(error?.message || '草稿保存失败'); return false } finally { detail.saving = false }
}
async function saveAndStartPlan() {
  if (!detail.plan || !validateScheduleForSubmission()) return
  detail.starting = true
  try {
    const saved = await saveDraftConfiguration(false)
    if (!saved) return
    await ElMessageBox.confirm(`将提交 ${planForm.performerConfigs.length} 个视频任务，是否继续？`, '提交执行', { type: 'warning', confirmButtonText: '提交', cancelButtonText: '返回配置' })
    if (!validateScheduleForSubmission()) return
    await startVideoBatchPlan(detail.plan.id); ElMessage.success('计划已提交执行'); await refreshDetail(); await loadPlanList()
  } catch (error: any) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '提交执行失败') } finally { detail.starting = false }
}

async function loadPlanList() { listLoading.value = true; try { const response = await getVideoBatchPlanList(planPage.value, planPageSize.value, searchKeyword.value.trim() ? { planName: searchKeyword.value.trim() } : {}); const page = getPageData(response); planList.value = page.items.map(normalizePlan); planTotal.value = page.total } catch (error: any) { ElMessage.error(error?.message || '计划加载失败') } finally { listLoading.value = false } }
async function openDetail(row: BatchPlan) { detail.visible = true; detail.loading = true; detail.plan = null; try { const response = await getVideoBatchPlanDetail(row.id); const plan = normalizePlan(getResponseData(response)); detail.plan = plan; detail.children = plan.children; if (plan.statusKey === 'draft') { await loadResources(true); fillPlanForm(plan); await nextTick(); refreshActivePreview() } } catch (error: any) { detail.visible = false; ElMessage.error(error?.message || '计划详情加载失败') } finally { detail.loading = false } }
async function refreshDetail() { if (detail.plan) await openDetail(detail.plan) }
function closeDetail() { activePreviewFrame.value = ''; activeBannerBase64.value = ''; previewLoadSequence += 1; voiceAudio?.pause() }
async function cancelPlan(row: BatchPlan) { try { await ElMessageBox.confirm(row.statusKey === 'draft' ? '取消后，该草稿将不能继续配置或提交。' : '取消后，尚未投递的子任务不会再进入通道。', '取消计划', { type: 'warning' }); await cancelVideoBatchPlan(row.id); ElMessage.success('计划已取消'); await loadPlanList(); if (detail.visible) await refreshDetail() } catch (error: any) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '取消失败') } }
async function deletePlan(row: BatchPlan) { try { await ElMessageBox.confirm('删除未提交计划后不可恢复。', '删除计划', { type: 'warning' }); await deleteVideoBatchPlan(row.id); ElMessage.success('计划已删除'); await loadPlanList() } catch (error: any) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '删除失败') } }
async function retryChild(row: BatchChild) { try { await retryVideoBatchChild(row.id); ElMessage.success('失败任务已重新进入队列'); await refreshDetail() } catch (error: any) { ElMessage.error(error?.message || '重试失败') } }

async function loadScripts() { if (resourcesLoaded.scripts) return; const response = await getScriptPaginateList(1, 200); const { items } = getPageData(response); scriptOptions.value = items.map((item: any) => ({ id: item.scriptId ?? item.id, title: item.scriptTitle || item.title || '未命名脚本', content: item.scriptContent || item.content || '', tags: Array.isArray(item.scriptTags || item.tags) ? item.scriptTags || item.tags : String(item.scriptTags || item.tags || '').split('|').filter(Boolean), createTime: item.createTime || item.create_time })); resourcesLoaded.scripts = true }
async function loadHistory() { if (resourcesLoaded.history) return; const response = await getScriptHistoryList(1, 200); const { items } = getPageData(response); historyOptions.value = items.map((item: any) => ({ id: item.taskId ?? item.id, title: '', content: item.taskContent || item.content || '', tags: [], createTime: item.usedTime || item.createTime || item.create_time })); resourcesLoaded.history = true }
async function loadBindings() { if (resourcesLoaded.bindings) return; const response = await getBindingList(1, 200); const { items } = getPageData(response); bindingOptions.value = items.map((item: any) => ({ id: item.id ?? item.bindingId, name: item.title || item.name || `${item.digitalHumanName || '数字人'} + ${item.voiceName || '配音'}`, digitalHumanName: item.digitalHumanName || '', voiceName: item.voiceName || '', coverUrl: item.digitalHumanCoverUrl || item.coverUrl || '', voiceUrl: item.voiceUrl || '' })).filter((item: any) => item.id != null); resourcesLoaded.bindings = true }
async function loadHumans() { if (resourcesLoaded.humans) return; const response = await getDigitalHumanList(); const data = getResponseData(response); const items = Array.isArray(data) ? data : data?.data || data?.items || []; digitalHumanOptions.value = items.map((item: any) => ({ id: item.id ?? item.digitalHumanId, name: item.digitalHumanName || item.name || '未命名数字人', coverUrl: item.coverUrl || item.imageUrl || '', videoUrl: item.videoUrl || '' })).filter((item: any) => item.id != null); resourcesLoaded.humans = true }
async function loadVoices() { if (resourcesLoaded.voices) return; const response = await getVoiceList(); const data = getResponseData(response); const items = Array.isArray(data) ? data : data?.data || data?.items || []; voiceOptions.value = items.map((item: any) => ({ id: item.id ?? item.voiceId, name: item.voiceName || item.name || '未命名声音', url: item.voiceUrl || item.url || '', language: item.language || '' })).filter((item: any) => item.id != null); resourcesLoaded.voices = true }
async function loadCorners(force = false) { if (resourcesLoaded.corners && !force) return; const response = await getCornerMarkList(); const data = getResponseData(response); const items = Array.isArray(data) ? data : data?.data || data?.items || []; cornerMarkOptions.value = items.map((item: any) => ({ id: item.id ?? item.cornerMarkId, name: item.name || item.title || '未命名角标', url: item.photoUrl || item.photo_url || item.imageUrl || item.image_url || item.url || '' })).filter((item: any) => item.id != null); resourcesLoaded.corners = true }
async function loadBanners(force = false) { if (resourcesLoaded.banners && !force) return; const response = await getBannerOverlayList(1, 200); const { items } = getPageData(response); bannerOverlayOptions.value = items.map((item: any) => ({ id: item.id ?? item.bannerOverlayId, name: item.name || item.title || '未命名横幅', url: item.outputUrl || item.output_url || item.overlayUrl || item.overlay_url || item.imageUrl || item.image_url || '' })).filter((item: any) => item.id != null); resourcesLoaded.banners = true }
async function loadResources(refreshEnhancements = false) { await Promise.all([loadScripts(), loadHistory(), loadBindings(), loadHumans(), loadVoices(), loadCorners(refreshEnhancements), loadBanners(refreshEnhancements)]) }

function openAssetPicker(type: AssetPickerType) { assetPicker.type = type; assetPicker.search = ''; assetPicker.visible = true; if (type === 'binding') loadBindings(); else if (type === 'human') loadHumans(); else loadVoices() }
function selectAsset(item: any) { if (!activePerformer.value) return; if (assetPicker.type === 'binding') activePerformer.value.bindingId = item.id; else if (assetPicker.type === 'human') activePerformer.value.digitalHumanId = item.id; else activePerformer.value.voiceId = item.id; assetPicker.visible = false; refreshActivePreview() }
function playVoice(url: string, name: string) { if (!url) return; voiceAudio?.pause(); voiceAudio = new Audio(url); voiceAudio.play().catch(() => ElMessage.info(`无法试听${name || '该声音'}`)) }
async function blobToDataUrl(blob: Blob) { return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(String(reader.result || '')); reader.onerror = reject; reader.readAsDataURL(blob) }) }
async function loadImageBase64(url: string) { if (!url) return ''; const response = await downloadFileByProxy(url); const blob = response?.data instanceof Blob ? response.data : null; return blob ? await blobToDataUrl(blob) : '' }
async function refreshActivePreview() { const sequence = ++previewLoadSequence; activePreviewFrame.value = ''; activeBannerBase64.value = ''; const config = activePerformer.value; if (!config) return; const cover = performerCover(config); const bannerUrl = bannerOverlayOptions.value.find(item => String(item.id) === String(config.postProcessConfig.bannerOverlayId))?.url || ''; const [frame, banner] = await Promise.all([cover ? loadImageBase64(cover).catch(() => '') : Promise.resolve(''), bannerUrl ? loadImageBase64(bannerUrl).catch(() => '') : Promise.resolve('')]); if (sequence === previewLoadSequence) { activePreviewFrame.value = frame; activeBannerBase64.value = banner } }

async function getVideoBlob(child: BatchChild) { if (!child.videoUrl) throw new Error('视频尚未生成'); const response = await downloadFileByProxy(child.videoUrl, child.videoTaskId || child.id, 'video'); const blob = response?.data instanceof Blob ? response.data : null; if (!blob) throw new Error('视频代理未返回有效文件'); return blob }
async function openVideoPreview(child: BatchChild) { stopPreview(); preview.visible = true; preview.loading = true; preview.title = `${child.digitalHumanName || '数字人'} · 视频预览`; try { const blob = await getVideoBlob(child); previewObjectUrl = URL.createObjectURL(blob); preview.url = previewObjectUrl } catch (error: any) { preview.visible = false; ElMessage.error(error?.message || '视频预览失败') } finally { preview.loading = false } }
async function downloadChild(child: BatchChild) { try { const blob = await getVideoBlob(child); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${child.digitalHumanName || '数字人'}-${child.seqNo}.mp4`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) } catch (error: any) { ElMessage.error(error?.message || '下载失败') } }
function stopPreview() { previewVideo.value?.pause(); if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = ''; preview.url = '' }
function handlePageSizeChange(size: number) { planPageSize.value = size; planPage.value = 1; loadPlanList() }

watch(activePerformerIndex, () => refreshActivePreview())
watch(() => activePerformer.value?.postProcessConfig.cornerMarkId, () => refreshActivePreview())
watch(() => activePerformer.value?.postProcessConfig.bannerOverlayId, () => refreshActivePreview())
watch(() => planForm.processTypes, (types) => { planForm.performerConfigs.forEach(config => { config.postProcessConfig.processTypes = [...types]; config.postProcessConfig.subtitleSelector = types.includes('subtitle') ? 1 : 0 }) }, { deep: true })
onMounted(loadPlanList)
onUnmounted(() => { stopPreview(); voiceAudio?.pause(); voiceAudio = null })
</script>

<style scoped>
.batch-plan-page { width: 100%; min-height: 100%; box-sizing: border-box; padding: clamp(16px, 2vw, 28px); background: #f5f7fb; color: #26364d; }
.page-hero, .filter-card, .table-card, .child-table-card { width: 100%; box-sizing: border-box; background: #fff; border: 1px solid #e7edf5; border-radius: 14px; box-shadow: 0 5px 18px rgba(38,55,88,.04); }
.page-hero { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:clamp(20px,3vw,32px); }
.eyebrow { color:#7b8aa1; font-size:12px; letter-spacing:.08em; }
h1, .detail-title-row h2 { margin:7px 0 0; color:#1f2d43; font-size:clamp(22px,2vw,29px); }
.page-hero p, .detail-title-row p { margin:7px 0 0; color:#8c9ab0; font-size:13px; }
.filter-card { margin-top:16px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.search-input { width:min(100%, 360px); }
.table-card { margin-top:16px; overflow:hidden; }
.plan-name { border:0; padding:0; background:transparent; color:#177ddc; cursor:pointer; font:inherit; font-weight:700; }
.plan-id { color:#9ba8ba; font-size:12px; margin-top:3px; }
.script-cell { color:#69788e; }
.time-cell { display:inline-block; color:#596a80; font-size:12px; line-height:1.45; }
.progress-cell { display:grid; gap:6px; min-width:90px; }
.row-actions { display:flex; align-items:center; justify-content:center; flex-wrap:nowrap; gap:12px; white-space:nowrap; }
.row-actions :deep(.el-button) { margin-left:0; }
.pagination-bar { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:16px; color:#7b8aa1; }
.create-form { max-height:72vh; overflow:auto; padding-right:8px; }
.form-grid { display:grid; gap:16px; }
.form-grid-two { grid-template-columns:repeat(2,minmax(0,1fr)); }
.w-full { width:100%; }
.create-section { margin-top:12px; padding:18px; border:1px solid #e5ebf4; border-radius:12px; background:#fbfcfe; }
.section-heading-row { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:14px; }
.section-heading-row p, .block-title span { margin:4px 0 0; color:#8a98ac; font-size:12px; }
.required, .enhancement-label em { color:#f56c6c; font-style:normal; }
.script-actions { display:flex; gap:8px; }
.script-form-item { margin:0; }
.selected-script-source { margin-top:10px; color:#67916d; font-size:12px; }
.feature-checkboxes { display:flex; flex-wrap:wrap; gap:10px; }
.detail-page { padding:0 8px 24px; }
.detail-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; padding-bottom:18px; border-bottom:1px solid #edf1f6; }
.detail-actions { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
.plan-summary { display:grid; grid-template-columns:minmax(0,1fr) minmax(420px,1.35fr); gap:14px; margin:16px 0; }
.summary-card { min-width:0; padding:16px 18px; background:#f7f9fc; border:1px solid #edf1f6; border-radius:12px; }
.summary-title { display:block; color:#8290a4; font-size:12px; font-weight:600; }
.plan-summary p { margin:8px 0 0; line-height:1.7; max-height:78px; overflow:auto; }
.plan-settings-summary { display:grid; grid-template-columns:minmax(220px,.8fr) minmax(320px,1.2fr); align-items:start; gap:22px; }
.summary-setting-block { min-width:0; display:grid; gap:10px; }
.summary-feature-checkboxes { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
.summary-feature-checkboxes :deep(.el-checkbox) { margin-right:0; }
.summary-schedule-mode { display:flex; flex-wrap:wrap; }
.summary-setting-block :deep(.el-date-editor) { width:100%; }
.time-summary { grid-column:1/-1; }
.time-summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:10px; }
.time-summary-grid>div { min-width:0; padding:12px 14px; border:1px solid #e5eaf2; border-radius:9px; background:#fff; display:grid; gap:6px; }
.time-summary-grid small { color:#8a98ac; font-size:12px; }
.time-summary-grid strong { color:#35465d; font-size:13px; font-weight:500; line-height:1.5; overflow-wrap:anywhere; }
.summary-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }.summary-tags em{color:#9ba8ba;font-style:normal;}
.draft-workspace { display:grid; grid-template-columns:minmax(210px,18%) minmax(0,82%); gap:16px; min-height:650px; }
.performer-sidebar, .performer-editor { border:1px solid #e3e9f2; border-radius:12px; background:#fff; }
.performer-sidebar { padding:12px; align-self:start; max-height:calc(100vh - 250px); overflow:auto; }
.sidebar-heading { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:4px 2px 12px; }
.sidebar-heading>div { display:grid; gap:2px; }.sidebar-heading span{font-size:12px;color:#8492a6;}
.performer-nav-item { width:100%; display:grid; grid-template-columns:42px minmax(0,1fr) 18px; align-items:center; gap:10px; padding:10px; margin-bottom:8px; border:1px solid #e4eaf3; border-radius:10px; background:#fff; text-align:left; cursor:pointer; }
.performer-nav-item.active { border-color:#409eff; background:#f0f7ff; box-shadow:0 0 0 2px rgba(64,158,255,.08); }
.performer-nav-item img, .nav-placeholder { width:42px; height:52px; border-radius:7px; object-fit:cover; background:#edf1f6; display:flex; align-items:center; justify-content:center; color:#aab5c4; }
.nav-main { min-width:0; display:grid; gap:4px; }.nav-main small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#7f8da1;}.ready-icon{color:#26a269;}.remove-active{width:100%;}
.performer-editor { min-width:0; padding:18px; }
.editor-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-bottom:16px; border-bottom:1px solid #edf1f6; }
.editor-heading>div { display:flex; align-items:center; gap:12px; }.editor-heading h3{margin:0;}.editor-heading p{margin:4px 0 0;color:#8b98aa;font-size:12px;}
.step-badge { width:36px; height:36px; border-radius:50%; background:#409eff; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
.editor-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(300px,34%); gap:18px; margin-top:18px; align-items:start; }
.editor-form-panel { min-width:0; display:grid; gap:14px; }
.config-block, .preview-panel { padding:16px; border:1px solid #e5ebf3; border-radius:11px; background:#fbfcfe; }
.block-title, .preview-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
.picker-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:14px; }.single-picker{grid-template-columns:1fr;}
.selection-preview-strip { display:flex; align-items:center; gap:10px; margin-top:12px; padding:9px 10px; border-radius:9px; background:#f0f7ff; }
.selection-preview-strip img { width:38px; height:48px; object-fit:cover; border-radius:6px; }.selection-preview-strip span{min-width:0;flex:1;}
.form-grid label { display:grid; gap:7px; color:#64748b; font-size:12px; }
.enhancement-block-title { display:grid; justify-content:start; gap:4px; }
.enhancement-block-title span { margin:0; line-height:1.6; }
.enhancement-row { display:grid; gap:8px; margin-top:16px; }
.enhancement-row + .enhancement-row { padding-top:16px; border-top:1px dashed #dfe6ef; }
.enhancement-label { color:#44546a; font-size:13px; font-weight:600; line-height:1.5; }
.enhancement-control { display:grid; gap:7px; width:100%; }
.enhancement-control .el-select { width:100%; }
.asset-empty-warning { display:block; color:#8a98ac; font-size:12px; line-height:1.6; }
.subtitle-note { margin-top:16px; padding-top:14px; border-top:1px dashed #dfe6ef; color:#6d7d92; font-size:12px; line-height:1.7; }
.preview-panel { position:sticky; top:0; background:#fff; }.preview-heading span{color:#8592a5;font-size:12px;}
.cover-preview { width:min(100%,310px); aspect-ratio:9/16; margin:0 auto; border-radius:10px; overflow:hidden; background:#eef2f6; display:flex; align-items:center; justify-content:center; }.cover-preview.landscape{aspect-ratio:16/9;width:100%;}.cover-preview img{width:100%;height:100%;object-fit:cover;}.cover-preview>div{display:grid;place-items:center;gap:10px;color:#9aa7b8;}.cover-preview .el-icon{font-size:42px;}.preview-help{text-align:center;color:#98a5b6;font-size:11px;margin:12px 0 0;}
.selector-search { width:min(100%,360px); margin-bottom:14px; }.asset-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;max-height:60vh;overflow:auto;padding:4px;}.asset-card{min-width:0;padding:10px;border:1px solid #e1e8f1;border-radius:10px;background:#fff;display:grid;gap:8px;text-align:left;cursor:pointer;}.asset-card:hover{border-color:#409eff;box-shadow:0 5px 16px rgba(64,158,255,.12);}.asset-card img,.asset-card-placeholder{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;background:#eef2f6;display:flex;align-items:center;justify-content:center;color:#a7b2c1;font-size:34px;}.asset-card strong,.asset-card small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.asset-card small{color:#8390a3;}.asset-card .el-button{justify-self:start;}
.child-table-card { padding:16px; }.child-cover{width:52px;height:66px;object-fit:cover;border-radius:7px;}.video-preview-wrap video{width:100%;max-height:72vh;object-fit:contain;background:#000;}
@media (max-width:1280px){.editor-layout{grid-template-columns:minmax(0,1fr) minmax(280px,38%)}.asset-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.plan-summary{grid-template-columns:1fr}.time-summary{grid-column:auto}}
@media (max-width:980px){.draft-workspace{grid-template-columns:1fr}.performer-sidebar{display:flex;gap:8px;overflow:auto;max-height:none}.sidebar-heading{min-width:150px}.performer-nav-item{min-width:210px}.editor-layout{grid-template-columns:1fr}.preview-panel{position:static}.form-grid-two,.form-grid-three,.plan-settings-summary{grid-template-columns:1fr}.time-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.asset-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
