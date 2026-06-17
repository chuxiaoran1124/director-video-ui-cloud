<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='协作空间'
            title='团队管理'
            description='把每个合作团队的接入方式、成员规模、处理额度和存储策略收在一个统一视图里，方便平台侧快速巡检当前配置状态。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='loadTenants'>刷新概览</el-button>
                <el-button
                    v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                    type='primary'
                    class='workspace-primary-btn'
                    @click='openCreateDialog'
                >
                    新增团队
                </el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>团队数量</span>
                    <strong>{{ tenantList.length }}</strong>
                    <small>当前可查看的全部团队空间</small>
                </div>
                <div class='metric-card'>
                    <span>启用团队</span>
                    <strong>{{ activeTenantCount }}</strong>
                    <small>仍处于正常运行状态的团队</small>
                </div>
                <div class='metric-card'>
                    <span>成员总量</span>
                    <strong>{{ totalUserCount }}</strong>
                    <small>用于快速感知当前协作规模</small>
                </div>
                <div class='metric-card'>
                    <span>当前查看</span>
                    <strong>{{ tenantDetail?.tenantName || '未选择' }}</strong>
                    <small>右侧详情会随左侧选中团队同步切换</small>
                </div>
            </template>
        </WorkspaceHero>

        <el-card shadow='never' class='workspace-panel workspace-panel--toolbar'>
            <div class='toolbar'>
                <div class='toolbar__group'>
                    <el-input
                        v-model='search.keyword'
                        class='toolbar__search'
                        placeholder='搜索团队编码或名称'
                        clearable
                        @keyup.enter='loadTenants'
                    />
                    <el-select v-model='search.status' clearable placeholder='状态' class='toolbar__status'>
                        <el-option label='启用' value='active' />
                        <el-option label='停用' value='inactive' />
                    </el-select>
                </div>
                <div class='toolbar__group'>
                    <el-button @click='resetSearch'>重置</el-button>
                    <el-button type='primary' class='workspace-primary-btn' @click='loadTenants'>查询</el-button>
                </div>
            </div>
        </el-card>

        <div class='workspace-grid'>
            <el-card shadow='never' class='workspace-panel'>
                <template #header>
                    <div class='workspace-panel__header'>
                        <div>
                            <h3>团队列表</h3>
                            <p>选择左侧团队后，右侧会展示当前环境能力、资源额度和接入配置。</p>
                        </div>
                    </div>
                </template>

                <el-table
                    :data='tenantList'
                    highlight-current-row
                    row-key='id'
                    class='workspace-table'
                    @current-change='handleCurrentChange'
                >
                    <el-table-column label='团队' min-width='240'>
                        <template #default='{ row }'>
                            <button class='tenant-card-button' type='button' @click='loadTenantDetail(row.id)'>
                                <div class='tenant-card'>
                                    <div class='tenant-card__badge'>{{ buildTenantInitial(row.tenantName) }}</div>
                                    <div class='tenant-card__meta'>
                                        <strong>{{ row.tenantName }}</strong>
                                        <span>{{ row.tenantCode }}</span>
                                    </div>
                                </div>
                            </button>
                        </template>
                    </el-table-column>
                    <el-table-column prop='userCount' label='成员数' width='100' />
                    <el-table-column prop='roleCount' label='身份数' width='100' />
                    <el-table-column prop='status' label='状态' width='120'>
                        <template #default='{ row }'>
                            <el-tag :type="row.status === 'active' ? 'success' : 'info'" effect='light'>
                                {{ formatStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>

            <div class='workspace-side'>
                <el-card shadow='never' class='workspace-panel'>
                    <template #header>
                        <div class='workspace-panel__header'>
                            <div>
                                <h3>团队详情</h3>
                                <p>用于快速确认团队当前接入方式、成员规模和运行边界。</p>
                            </div>
                        </div>
                    </template>

                    <el-empty v-if='!tenantDetail' description='请选择团队后查看详情' />
                    <div v-else class='detail-stack'>
                        <div class='detail-head'>
                            <div>
                                <strong>{{ tenantDetail.tenantName }}</strong>
                                <span>{{ tenantDetail.tenantCode }}</span>
                            </div>
                            <el-tag :type="tenantDetail.status === 'active' ? 'success' : 'info'" effect='plain'>
                                {{ formatStatusLabel(tenantDetail.status) }}
                            </el-tag>
                        </div>

                        <div class='detail-metric-grid'>
                            <div class='detail-metric'>
                                <span>接入方式</span>
                                <strong>{{ formatDeployModeLabel(tenantDetail.deployMode) }}</strong>
                            </div>
                            <div class='detail-metric'>
                                <span>成员规模</span>
                                <strong>{{ tenantDetail.userCount }}</strong>
                            </div>
                            <div class='detail-metric'>
                                <span>身份数量</span>
                                <strong>{{ tenantDetail.roleCount }}</strong>
                            </div>
                        </div>

                        <div class='capability-grid'>
                            <section class='capability-card'>
                                <header>
                                    <h4>功能开关</h4>
                                    <span>当前业务开放项</span>
                                </header>
                                <div class='capability-tags'>
                                    <el-tag :type="tenantDetail.runtimeConfig.enableFastTask ? 'success' : 'info'" effect='plain'>快速任务</el-tag>
                                    <el-tag :type="tenantDetail.runtimeConfig.enableVideoTask ? 'success' : 'info'" effect='plain'>单条视频</el-tag>
                                    <el-tag :type="tenantDetail.runtimeConfig.enablePostProcessPipeline ? 'success' : 'info'" effect='plain'>增强成片</el-tag>
                                </div>
                            </section>

                            <section class='capability-card capability-card--editable'>
                                <header>
                                    <h4>增强成片开关</h4>
                                    <span>关闭后该团队无法使用字幕、角标、横幅能力。</span>
                                </header>
                                <div class='toggle-panel'>
                                    <el-switch
                                        v-model='postProcessPipelineEnabled'
                                        :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingRuntimeConfig'
                                        active-text='已开放'
                                        inactive-text='未开放'
                                    />
                                    <el-button
                                        v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                                        type='primary'
                                        class='workspace-primary-btn'
                                        :loading='savingRuntimeConfig'
                                        @click='saveRuntimeConfig'
                                    >
                                        保存设置
                                    </el-button>
                                    <span v-else class='toggle-panel__hint'>仅平台管理员可调整此团队的增强成片能力。</span>
                                </div>
                            </section>

                            <section class='capability-card capability-card--editable'>
                                <header>
                                    <h4>任务处理偏好</h4>
                                    <span>根据团队当前阶段，决定更偏向先出成片还是先补素材。</span>
                                </header>
                                <div class='priority-panel'>
                                    <el-radio-group
                                        v-model='schedulerPriorityMode'
                                        class='priority-panel__group'
                                        :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingSchedulerPriorityConfig'
                                    >
                                        <el-radio-button
                                            v-for='option in schedulerPriorityOptions'
                                            :key='option.value'
                                            :label='option.value'
                                        >
                                            {{ option.label }}
                                        </el-radio-button>
                                    </el-radio-group>
                                    <p class='priority-panel__description'>{{ currentPriorityDescription }}</p>
                                    <div class='priority-panel__order'>
                                        当前顺序：{{ currentPriorityOrderText }}
                                    </div>
                                    <div class='priority-panel__footer'>
                                        <el-button
                                            v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                                            type='primary'
                                            class='workspace-primary-btn'
                                            :loading='savingSchedulerPriorityConfig'
                                            @click='saveSchedulerPriorityConfig'
                                        >
                                            保存偏好
                                        </el-button>
                                        <span v-else class='toggle-panel__hint'>仅平台管理员可调整团队的任务处理偏好。</span>
                                    </div>
                                </div>
                            </section>

                            <section class='capability-card'>
                                <header>
                                    <h4>处理额度</h4>
                                    <span>帮助判断调度资源边界</span>
                                </header>
                                <ul class='capability-list'>
                                    <li>同时处理上限：{{ tenantDetail.schedulerConfig.maxConcurrency }}</li>
                                    <li>视频任务上限：{{ tenantDetail.schedulerConfig.maxVideoTaskConcurrency }}</li>
                                    <li>快速任务上限：{{ tenantDetail.schedulerConfig.maxFastTaskConcurrency }}</li>
                                    <li>后处理上限：{{ tenantDetail.schedulerConfig.maxPostProcessConcurrency }}</li>
                                </ul>
                            </section>

                            <section class='capability-card'>
                                <header>
                                    <h4>文件存放</h4>
                                    <span>用于确认环境级的上传落点</span>
                                </header>
                                <ul class='capability-list'>
                                    <li>存放方式：{{ formatStorageProviderLabel(tenantDetail.storageConfig.provider) }}</li>
                                    <li>存储空间：{{ tenantDetail.storageConfig.bucketName || '未配置' }}</li>
                                    <li>目录前缀：{{ tenantDetail.storageConfig.basePrefix || '/' }}</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>

        <el-dialog v-model='createDialogVisible' title='新增团队' width='620px' destroy-on-close>
            <el-form ref='createFormRef' :model='createForm' :rules='createRules' label-position='top'>
                <el-form-item label='团队名称' prop='tenantName'>
                    <el-input v-model='createForm.tenantName' placeholder='例如：华东内容中心' />
                </el-form-item>
                <el-form-item label='团队编码' prop='tenantCode'>
                    <el-input v-model='createForm.tenantCode' placeholder='例如：east_content_center' />
                </el-form-item>
                <el-form-item label='团队简称'>
                    <el-input v-model='createForm.tenantShortName' placeholder='选填，便于内部识别' />
                </el-form-item>
                <el-form-item label='联系人'>
                    <el-input v-model='createForm.contactName' placeholder='选填' />
                </el-form-item>
                <el-form-item label='联系电话'>
                    <el-input v-model='createForm.contactPhone' placeholder='选填' />
                </el-form-item>
                <el-form-item label='联系邮箱'>
                    <el-input v-model='createForm.contactEmail' placeholder='选填' />
                </el-form-item>
                <el-form-item label='备注'>
                    <el-input v-model='createForm.remark' type='textarea' :rows='3' placeholder='可记录接入说明或业务备注' />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='createDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='creatingTenant' @click='submitCreateTenant'>确认创建</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
    createTenant,
    getTenantDetail,
    getTenantList,
    ICreateTenantPayload,
    ITenantDetailResponse,
    ITenantListItem,
    updateTenantRuntimeConfig,
    updateTenantSchedulerPriorityConfig
} from '/@/api/tenant'
import {
    getDeployModeDisplayName,
    getStatusDisplayName,
    getStorageProviderDisplayName
} from '/@/utils/productLabels'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useLayoutStore } from '/@/store/modules/layout'
import WorkspaceHero from '/@/views/User/components/WorkspaceHero.vue'

const layoutStore = useLayoutStore()
const createFormRef = ref<FormInstance>()

const search = reactive({
    keyword: '',
    status: ''
})

const tenantList = ref<ITenantListItem[]>([])
const tenantDetail = ref<ITenantDetailResponse | null>(null)
const postProcessPipelineEnabled = ref(false)
const schedulerPriorityMode = ref('balanced')
const savingRuntimeConfig = ref(false)
const savingSchedulerPriorityConfig = ref(false)
const createDialogVisible = ref(false)
const creatingTenant = ref(false)
const schedulerPriorityOptions = [
    {
        value: 'video_first',
        label: '视频优先',
        description: '单条视频会优先进入处理链路，适合交付高峰期。'
    },
    {
        value: 'balanced',
        label: '均衡模式',
        description: '素材准备和成片生成一起兼顾，适合作为日常默认。'
    },
    {
        value: 'asset_first',
        label: '素材优先',
        description: '会先补声音、数字人和快速克隆，适合集中扩素材阶段。'
    }
]
const schedulerPriorityOrderMap: Record<string, string[]> = {
    video_first: ['单条视频', '数字人克隆', '快速克隆'],
    balanced: ['数字人克隆', '单条视频', '快速克隆'],
    asset_first: ['快速克隆', '数字人克隆', '单条视频']
}

const createForm = reactive<ICreateTenantPayload>({
    tenantCode: '',
    tenantName: '',
    tenantShortName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    remark: ''
})

const createRules = reactive<FormRules>({
    tenantName: [{ required: true, message: '请输入团队名称', trigger: 'blur' }],
    tenantCode: [{ required: true, message: '请输入团队编码', trigger: 'blur' }]
})

const activeTenantCount = computed(() => tenantList.value.filter((item) => item.status === 'active').length)
const totalUserCount = computed(() => tenantList.value.reduce((total, item) => total + Number(item.userCount || 0), 0))
const currentPriorityOption = computed(() => (
    schedulerPriorityOptions.find((item) => item.value === schedulerPriorityMode.value) || schedulerPriorityOptions[1]
))
const currentPriorityDescription = computed(() => currentPriorityOption.value.description)
const currentPriorityOrderText = computed(() => {
    const labels = schedulerPriorityOrderMap[schedulerPriorityMode.value] || tenantDetail.value?.schedulerConfig?.commonQueueOrderLabels || []
    if (!Array.isArray(labels) || !labels.length) {
        return '快速克隆 > 数字人克隆 > 单条视频'
    }
    return labels.join(' > ')
})

const formatStatusLabel = (status: string) => getStatusDisplayName(status)
const formatDeployModeLabel = (mode: string) => getDeployModeDisplayName(mode)
const formatStorageProviderLabel = (provider: string) => getStorageProviderDisplayName(provider)

const buildTenantInitial = (tenantName: string) => tenantName.trim().slice(0, 1).toUpperCase()

const resetCreateForm = () => {
    createForm.tenantCode = ''
    createForm.tenantName = ''
    createForm.tenantShortName = ''
    createForm.contactName = ''
    createForm.contactPhone = ''
    createForm.contactEmail = ''
    createForm.remark = ''
}

const loadTenants = async() => {
    const response = await getTenantList({
        page: 1,
        pageSize: 50,
        search: {
            keyword: search.keyword,
            status: search.status
        }
    })
    tenantList.value = response.data.data.data || []
    if (tenantList.value.length) {
        const nextTenantId = tenantDetail.value?.id && tenantList.value.some((item) => item.id === tenantDetail.value?.id)
            ? tenantDetail.value.id
            : tenantList.value[0].id
        await loadTenantDetail(nextTenantId)
    } else {
        tenantDetail.value = null
    }
}

const loadTenantDetail = async(tenantId: number) => {
    const response = await getTenantDetail(tenantId)
    tenantDetail.value = response.data.data
    postProcessPipelineEnabled.value = Boolean(response.data.data?.runtimeConfig?.enablePostProcessPipeline)
    schedulerPriorityMode.value = response.data.data?.schedulerConfig?.priorityMode || 'balanced'
}

const openCreateDialog = () => {
    resetCreateForm()
    createDialogVisible.value = true
}

const handleCurrentChange = async(row: ITenantListItem) => {
    if (row?.id) {
        await loadTenantDetail(row.id)
    }
}

const resetSearch = async() => {
    search.keyword = ''
    search.status = ''
    await loadTenants()
}

const saveRuntimeConfig = async() => {
    if (!tenantDetail.value?.id) {
        return
    }
    savingRuntimeConfig.value = true
    try {
        const response = await updateTenantRuntimeConfig({
            tenantId: tenantDetail.value.id,
            enablePostProcessPipeline: postProcessPipelineEnabled.value
        })
        tenantDetail.value = response.data.data
        postProcessPipelineEnabled.value = Boolean(response.data.data?.runtimeConfig?.enablePostProcessPipeline)
        ElMessage.success(postProcessPipelineEnabled.value ? '该团队已开放增强成片能力' : '该团队已关闭增强成片能力')
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingRuntimeConfig.value = false
    }
}

const saveSchedulerPriorityConfig = async() => {
    if (!tenantDetail.value?.id) {
        return
    }
    savingSchedulerPriorityConfig.value = true
    try {
        const response = await updateTenantSchedulerPriorityConfig({
            tenantId: tenantDetail.value.id,
            priorityMode: schedulerPriorityMode.value
        })
        tenantDetail.value = response.data.data
        schedulerPriorityMode.value = response.data.data?.schedulerConfig?.priorityMode || schedulerPriorityMode.value
        ElMessage.success(`该团队已切换为${response.data.data?.schedulerConfig?.priorityModeLabel || '当前'}模式`)
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingSchedulerPriorityConfig.value = false
    }
}

const submitCreateTenant = async() => {
    if (!createFormRef.value) {
        return
    }
    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    creatingTenant.value = true
    try {
        const response = await createTenant({ ...createForm })
        createDialogVisible.value = false
        ElMessage.success(response.data.message || '团队创建成功')
        await loadTenants()
        if (response.data.data?.id) {
            await loadTenantDetail(response.data.data.id)
        }
    } finally {
        creatingTenant.value = false
    }
}

onMounted(loadTenants)
</script>

<style lang='postcss' scoped>
.workspace-page {
    display: grid;
    gap: 18px;
}

.workspace-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
    gap: 18px;
}

.workspace-side {
    display: grid;
    gap: 18px;
}

.workspace-panel {
    border: 1px solid rgba(141, 163, 196, 0.16);
    border-radius: 24px;
    box-shadow: 0 18px 48px rgba(36, 66, 130, 0.08);
    background: rgba(255, 255, 255, 0.98);
}

.workspace-panel--toolbar {
    backdrop-filter: blur(10px);
}

.workspace-panel__header h3 {
    margin: 0;
    font-size: 18px;
    color: #132039;
}

.workspace-panel__header p {
    margin: 6px 0 0;
    color: #6c7991;
    font-size: 13px;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.toolbar__group {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.toolbar__search {
    min-width: min(420px, 72vw);
}

.toolbar__status {
    min-width: 140px;
}

.workspace-primary-btn {
    border-radius: 12px;
    background: linear-gradient(135deg, #2f6bff, #4b8dff);
    border: none;
    box-shadow: 0 12px 30px rgba(57, 110, 242, 0.22);
}

.capability-card--editable {
    gap: 16px;
}

.toggle-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
}

.toggle-panel__hint {
    color: #6c7991;
    font-size: 12px;
}

.priority-panel {
    display: grid;
    gap: 12px;
}

.priority-panel__group {
    width: fit-content;
}

.priority-panel__description,
.priority-panel__order {
    margin: 0;
    color: #5f6e89;
    font-size: 13px;
    line-height: 1.7;
}

.priority-panel__order {
    color: #1f4f9e;
    font-weight: 600;
}

.priority-panel__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.workspace-ghost-btn {
    border-radius: 12px;
    border-color: rgba(78, 110, 178, 0.18);
}

.metric-card {
    padding: 16px 18px;
    border-radius: 20px;
    background: rgba(245, 249, 255, 0.86);
    border: 1px solid rgba(159, 182, 220, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
    animation: liftIn 0.55s ease both;
}

.metric-card span {
    display: block;
    color: #6f7e96;
    font-size: 12px;
}

.metric-card strong {
    display: block;
    margin-top: 10px;
    color: #11203b;
    font-size: 24px;
}

.metric-card small {
    display: block;
    margin-top: 6px;
    color: #8b97ab;
    line-height: 1.6;
}

.tenant-card-button {
    padding: 0;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    cursor: pointer;
}

.tenant-card {
    display: flex;
    gap: 14px;
    align-items: center;
}

.tenant-card__badge {
    width: 42px;
    height: 42px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: #1c3f92;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(97, 156, 255, 0.18), rgba(76, 123, 255, 0.12));
}

.tenant-card__meta {
    display: grid;
    gap: 4px;
}

.tenant-card__meta strong {
    color: #132039;
}

.tenant-card__meta span {
    color: #7c8aa2;
    font-size: 12px;
}

.detail-stack {
    display: grid;
    gap: 18px;
}

.detail-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.detail-head strong {
    display: block;
    color: #132039;
    font-size: 20px;
}

.detail-head span {
    display: block;
    margin-top: 6px;
    color: #6c7991;
    font-size: 12px;
}

.detail-metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.detail-metric {
    padding: 16px;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(248, 251, 255, 0.95), rgba(242, 247, 255, 0.92));
    border: 1px solid rgba(192, 210, 240, 0.3);
}

.detail-metric span {
    display: block;
    color: #7f8ea7;
    font-size: 12px;
}

.detail-metric strong {
    display: block;
    margin-top: 8px;
    color: #14233f;
    font-size: 18px;
}

.capability-grid {
    display: grid;
    gap: 12px;
}

.capability-card {
    padding: 18px;
    border-radius: 20px;
    background: rgba(249, 251, 255, 0.92);
    border: 1px solid rgba(177, 197, 228, 0.24);
}

.capability-card header {
    display: grid;
    gap: 4px;
    margin-bottom: 12px;
}

.capability-card h4 {
    margin: 0;
    color: #132039;
    font-size: 16px;
}

.capability-card header span {
    color: #7f8ea7;
    font-size: 12px;
}

.capability-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.capability-list {
    margin: 0;
    padding-left: 18px;
    color: #4c5b76;
    line-height: 1.9;
}

.workspace-table :deep(.el-table__row) {
    transition: transform 0.18s ease;
}

.workspace-table :deep(.el-table__row:hover) {
    transform: translateY(-1px);
}

@keyframes liftIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 1080px) {
    .workspace-grid,
    .detail-metric-grid {
        grid-template-columns: 1fr;
    }

    .toolbar,
    .toolbar__group {
        align-items: stretch;
    }

    .toolbar__search,
    .toolbar__status {
        width: 100%;
        min-width: 0;
    }
}
</style>
