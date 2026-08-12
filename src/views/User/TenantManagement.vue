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
                    <el-table-column prop='roleCount' label='岗位数' width='100' />
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
                                <span>岗位数量</span>
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
                                    <el-tag :type="tenantDetail.runtimeConfig.enableAudioDrive ? 'success' : 'info'" effect='plain'>音频驱动</el-tag>
                                    <el-tag :type="tenantDetail.runtimeConfig.enablePostProcessPipeline ? 'success' : 'info'" effect='plain'>增强成片</el-tag>
                                </div>
                            </section>

                            <section class='capability-card capability-card--editable'>
                                <header>
                                    <h4>音频驱动开关</h4>
                                    <span>关闭后，这个团队在单条视频页将不再显示“音频驱动视频”入口。</span>
                                </header>
                                <div class='toggle-panel'>
                                    <el-switch
                                        v-model='audioDriveEnabled'
                                        :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingAudioDriveConfig'
                                        active-text='已开放'
                                        inactive-text='未开放'
                                    />
                                    <el-button
                                        v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                                        type='primary'
                                        class='workspace-primary-btn'
                                        :loading='savingAudioDriveConfig'
                                        @click='saveAudioDriveConfig'
                                    >
                                        保存设置
                                    </el-button>
                                    <span v-else class='toggle-panel__hint'>仅平台管理员可调整此团队的音频驱动能力。</span>
                                </div>
                            </section>

                            <section class='capability-card capability-card--editable'>
                                <header>
                                    <h4>素材使用范围</h4>
                                    <span>团队共享覆盖数字人、声音和绑定关系，成员仍只能维护自己创建的素材。</span>
                                </header>
                                <div class='priority-panel'>
                                    <el-radio-group
                                        v-model='digitalHumanScope'
                                        class='priority-panel__group'
                                        :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingDigitalHumanScope'
                                    >
                                        <el-radio-button label='self'>仅本人使用</el-radio-button>
                                        <el-radio-button label='tenant'>团队成员共享</el-radio-button>
                                    </el-radio-group>
                                    <div class='priority-panel__footer'>
                                        <p class='priority-panel__description'>
                                            {{ digitalHumanScope === 'tenant'
                                                ? '成员可以选择本团队其他人创建的数字人、声音和绑定关系，但不能编辑或删除。'
                                                : '普通成员只能查看和使用自己创建的数字人、声音和绑定关系。' }}
                                        </p>
                                        <el-button
                                            v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                                            type='primary'
                                            class='workspace-primary-btn'
                                            :loading='savingDigitalHumanScope'
                                            @click='saveDigitalHumanScope'
                                        >
                                            保存设置
                                        </el-button>
                                        <span v-else class='toggle-panel__hint'>仅平台管理员可调整素材使用范围。</span>
                                    </div>
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
                                    <span>统一管理单条视频、快速任务和数字人克隆三个功能的处理顺序。</span>
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
                                        {{ schedulerPriorityMode === 'balanced' ? '执行规则' : '当前优先级' }}：{{ currentPriorityOrderText }}
                                    </div>
                                    <div v-if='schedulerPriorityMode === "free"' class='function-priority-list'>
                                        <div v-for='item in schedulerFunctionOptions' :key='item.value' class='function-priority-row'>
                                            <div>
                                                <strong>{{ item.label }}</strong>
                                                <small>{{ item.description }}</small>
                                            </div>
                                            <el-select
                                                v-model='schedulerFunctionPriorities[item.value]'
                                                class='function-priority-select'
                                                :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingSchedulerPriorityConfig'
                                            >
                                                <el-option v-for='level in [1, 2, 3]' :key='level' :label='`P${level}${level === 1 ? "（最高）" : ""}`' :value='level' />
                                            </el-select>
                                        </div>
                                        <p>先比较功能优先级；同优先级时严格按可执行任务的创建时间先后处理。</p>
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

                            <section
                                v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                                class='capability-card capability-card--editable'
                            >
                                <header>
                                    <h4>夜间执行开关</h4>
                                    <span>开启后，这个团队白天提交的任务会继续显示等待中，并在 22:00 至次日 08:00 的窗口内按原等待顺序开始执行。</span>
                                </header>
                                <div class='priority-panel'>
                                    <div class='toggle-panel'>
                                        <el-switch
                                            v-model='schedulerNightDispatchOnly'
                                            :disabled='savingSchedulerNightDispatchConfig'
                                            active-text='仅夜间执行'
                                            inactive-text='即时执行'
                                        />
                                        <el-button
                                            type='primary'
                                            class='workspace-primary-btn'
                                            :loading='savingSchedulerNightDispatchConfig'
                                            @click='saveSchedulerNightDispatchConfig'
                                        >
                                            保存设置
                                        </el-button>
                                    </div>
                                    <p class='priority-panel__description'>
                                        关闭后，当前还在等待中的任务会立刻恢复正常调度，不需要重新提交。
                                    </p>
                                </div>
                            </section>

                            <section class='capability-card capability-card--editable'>
                                <header>
                                    <h4>处理额度</h4>
                                    <span>用于控制复杂任务进入、视频线程占用和音频处理并发。</span>
                                </header>
                                <div class='quota-panel'>
                                    <div class='quota-field'>
                                        <span>复杂任务线程</span>
                                        <el-input-number
                                            v-model='schedulerComplexWorkers'
                                            :min='1'
                                            :max='100'
                                            :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingSchedulerQuotaConfig'
                                        />
                                        <small>决定有多少条复杂任务可以同时进入执行态。</small>
                                    </div>
                                    <div class='quota-field'>
                                        <span>视频线程</span>
                                        <el-input-number
                                            v-model='schedulerVideoSlots'
                                            :min='1'
                                            :max='100'
                                            :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingSchedulerQuotaConfig'
                                        />
                                        <small>限制真正进入第三方视频服务的并发数量。</small>
                                    </div>
                                    <div class='quota-field'>
                                        <span>音频线程</span>
                                        <el-input-number
                                            v-model='schedulerAudioWorkers'
                                            :min='1'
                                            :max='100'
                                            :disabled='!layoutStore.getUserInfo.isPlatformSuperAdmin || savingSchedulerQuotaConfig'
                                        />
                                        <small>控制快速任务里的音频克隆并发。</small>
                                    </div>
                                    <div class='priority-panel__footer'>
                                        <el-button
                                            v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                                            type='primary'
                                            class='workspace-primary-btn'
                                            :loading='savingSchedulerQuotaConfig'
                                            @click='saveSchedulerQuotaConfig'
                                        >
                                            保存额度
                                        </el-button>
                                        <span v-else class='toggle-panel__hint'>仅平台管理员可调整团队的处理额度。</span>
                                    </div>
                                </div>
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
                <el-divider content-position='left'>首个团队管理员账号</el-divider>
                <el-alert
                    type='info'
                    :closable='false'
                    show-icon
                    title='团队创建完成后，这个账号就是该团队的第一个管理员。若当前不启用，它将无法直接登录。'
                    class='create-form__alert'
                />
                <el-form-item label='登录账号' prop='adminUsername'>
                    <el-input v-model='createForm.adminUsername' placeholder='例如：huadong_admin' />
                </el-form-item>
                <el-form-item label='登录密码' prop='adminPassword'>
                    <el-input v-model='createForm.adminPassword' type='password' show-password placeholder='至少 6 位' />
                </el-form-item>
                <el-form-item label='管理员姓名'>
                    <el-input v-model='createForm.adminName' placeholder='选填，便于识别负责人' />
                </el-form-item>
                <el-form-item label='管理员电话'>
                    <el-input v-model='createForm.adminPhone' placeholder='选填' />
                </el-form-item>
                <el-form-item label='管理员邮箱'>
                    <el-input v-model='createForm.adminEmail' placeholder='选填' />
                </el-form-item>
                <el-form-item label='账号状态'>
                    <el-switch
                        v-model='createForm.adminEnabled'
                        active-text='创建后立即启用'
                        inactive-text='先创建，暂不启用'
                    />
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
    updateTenantAudioDriveConfig,
    updateTenantDigitalHumanScope,
    updateTenantSchedulerNightDispatchConfig,
    updateTenantRuntimeConfig,
    updateTenantSchedulerPriorityConfig,
    updateTenantSchedulerQuotaConfig
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
const audioDriveEnabled = ref(false)
const digitalHumanScope = ref<'self' | 'tenant'>('self')
const schedulerPriorityMode = ref<'balanced' | 'free'>('balanced')
const schedulerFunctionPriorities = reactive<Record<string, number>>({
    video_realtime: 1,
    decompose_quick: 1,
    avatar_clone_not_voice: 1
})
const schedulerNightDispatchOnly = ref(false)
const schedulerComplexWorkers = ref(1)
const schedulerVideoSlots = ref(1)
const schedulerAudioWorkers = ref(1)
const savingRuntimeConfig = ref(false)
const savingAudioDriveConfig = ref(false)
const savingDigitalHumanScope = ref(false)
const savingSchedulerPriorityConfig = ref(false)
const savingSchedulerNightDispatchConfig = ref(false)
const savingSchedulerQuotaConfig = ref(false)
const createDialogVisible = ref(false)
const creatingTenant = ref(false)
const schedulerPriorityOptions = [
    {
        value: 'balanced',
        label: '均衡模式',
        description: '三个功能不区分优先级，严格按可执行任务的创建时间先后处理。'
    },
    {
        value: 'free',
        label: '自由模式',
        description: '分别设置三个功能的优先级；同优先级仍严格按任务创建时间处理。'
    }
]
const schedulerFunctionOptions = [
    { value: 'video_realtime', label: '单条视频', description: '包含批量数字人生成的实际视频子任务' },
    { value: 'decompose_quick', label: '快速任务', description: '有配音快速训练的顶层任务' },
    { value: 'avatar_clone_not_voice', label: '数字人克隆', description: '仅数字人训练的顶层任务' }
]

const createForm = reactive<ICreateTenantPayload>({
    tenantCode: '',
    tenantName: '',
    tenantShortName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    remark: '',
    adminUsername: '',
    adminPassword: '',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    adminEnabled: true
})

const createRules = reactive<FormRules>({
    tenantName: [{ required: true, message: '请输入团队名称', trigger: 'blur' }],
    tenantCode: [{ required: true, message: '请输入团队编码', trigger: 'blur' }],
    adminUsername: [{ required: true, message: '请输入首个团队管理员账号', trigger: 'blur' }],
    adminPassword: [
        { required: true, message: '请输入首个团队管理员密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' }
    ]
})

const activeTenantCount = computed(() => tenantList.value.filter((item) => item.status === 'active').length)
const totalUserCount = computed(() => tenantList.value.reduce((total, item) => total + Number(item.userCount || 0), 0))
const currentPriorityOption = computed(() => (
    schedulerPriorityOptions.find((item) => item.value === schedulerPriorityMode.value) || schedulerPriorityOptions[0]
))
const currentPriorityDescription = computed(() => currentPriorityOption.value.description)
const currentPriorityOrderText = computed(() => {
    if (schedulerPriorityMode.value === 'balanced') {
        return '三个功能严格按任务创建时间 FIFO'
    }
    const grouped = new Map<number, string[]>()
    schedulerFunctionOptions.forEach((item) => {
        const level = Number(schedulerFunctionPriorities[item.value] || 1)
        grouped.set(level, [...(grouped.get(level) || []), item.label])
    })
    return [...grouped.entries()]
        .sort(([left], [right]) => left - right)
        .map(([level, labels]) => `P${level} ${labels.join('、')}`)
        .join(' > ')
})

const syncSchedulerPriorityState = (detail?: ITenantDetailResponse | null) => {
    schedulerPriorityMode.value = detail?.schedulerConfig?.priorityMode === 'free' ? 'free' : 'balanced'
    const priorities = detail?.schedulerConfig?.functionPriorities || {}
    schedulerFunctionOptions.forEach((item) => {
        const level = Number(priorities[item.value] || 1)
        schedulerFunctionPriorities[item.value] = Math.min(3, Math.max(1, level))
    })
}

const formatStatusLabel = (status: string) => getStatusDisplayName(status)
const formatDeployModeLabel = (mode: string) => getDeployModeDisplayName(mode)
const formatStorageProviderLabel = (provider: string) => getStorageProviderDisplayName(provider)

const buildTenantInitial = (tenantName: string) => tenantName.trim().slice(0, 1).toUpperCase()
const syncSchedulerQuotaState = (detail?: ITenantDetailResponse | null) => {
    schedulerNightDispatchOnly.value = Boolean(detail?.schedulerConfig?.nightDispatchOnly)
    schedulerComplexWorkers.value = Number(detail?.schedulerConfig?.maxConcurrency || 1)
    schedulerVideoSlots.value = Number(detail?.schedulerConfig?.maxVideoTaskConcurrency || 1)
    schedulerAudioWorkers.value = Number(detail?.schedulerConfig?.maxFastTaskConcurrency || 1)
}

const resetCreateForm = () => {
    createForm.tenantCode = ''
    createForm.tenantName = ''
    createForm.tenantShortName = ''
    createForm.contactName = ''
    createForm.contactPhone = ''
    createForm.contactEmail = ''
    createForm.remark = ''
    createForm.adminUsername = ''
    createForm.adminPassword = ''
    createForm.adminName = ''
    createForm.adminPhone = ''
    createForm.adminEmail = ''
    createForm.adminEnabled = true
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
    audioDriveEnabled.value = Boolean(response.data.data?.runtimeConfig?.enableAudioDrive)
    digitalHumanScope.value = response.data.data?.runtimeConfig?.digitalHumanScope === 'tenant' ? 'tenant' : 'self'
    syncSchedulerPriorityState(response.data.data)
    syncSchedulerQuotaState(response.data.data)
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
        syncSchedulerQuotaState(response.data.data)
        ElMessage.success(postProcessPipelineEnabled.value ? '该团队已开放增强成片能力' : '该团队已关闭增强成片能力')
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingRuntimeConfig.value = false
    }
}

const saveAudioDriveConfig = async() => {
    if (!tenantDetail.value?.id) {
        return
    }
    savingAudioDriveConfig.value = true
    try {
        const response = await updateTenantAudioDriveConfig({
            tenantId: tenantDetail.value.id,
            enableAudioDrive: audioDriveEnabled.value
        })
        tenantDetail.value = response.data.data
        audioDriveEnabled.value = Boolean(response.data.data?.runtimeConfig?.enableAudioDrive)
        syncSchedulerQuotaState(response.data.data)
        ElMessage.success(audioDriveEnabled.value ? '该团队已开放音频驱动能力' : '该团队已关闭音频驱动能力')
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingAudioDriveConfig.value = false
    }
}

const saveDigitalHumanScope = async() => {
    if (!tenantDetail.value?.id) {
        return
    }
    savingDigitalHumanScope.value = true
    try {
        const response = await updateTenantDigitalHumanScope({
            tenantId: tenantDetail.value.id,
            digitalHumanScope: digitalHumanScope.value
        })
        tenantDetail.value = response.data.data
        digitalHumanScope.value = response.data.data?.runtimeConfig?.digitalHumanScope === 'tenant' ? 'tenant' : 'self'
        syncSchedulerQuotaState(response.data.data)
        ElMessage.success(digitalHumanScope.value === 'tenant' ? '该团队已开放素材共享使用' : '该团队素材已恢复仅本人使用')
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingDigitalHumanScope.value = false
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
            priorityMode: schedulerPriorityMode.value,
            functionPriorities: { ...schedulerFunctionPriorities }
        })
        tenantDetail.value = response.data.data
        syncSchedulerPriorityState(response.data.data)
        syncSchedulerQuotaState(response.data.data)
        ElMessage.success(`该团队已切换为${response.data.data?.schedulerConfig?.priorityModeLabel || '当前模式'}`)
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingSchedulerPriorityConfig.value = false
    }
}

const saveSchedulerNightDispatchConfig = async() => {
    if (!tenantDetail.value?.id) {
        return
    }
    savingSchedulerNightDispatchConfig.value = true
    try {
        const response = await updateTenantSchedulerNightDispatchConfig({
            tenantId: tenantDetail.value.id,
            nightDispatchOnly: schedulerNightDispatchOnly.value
        })
        tenantDetail.value = response.data.data
        syncSchedulerQuotaState(response.data.data)
        ElMessage.success(
            schedulerNightDispatchOnly.value
                ? '该团队已切换为夜间执行模式'
                : '该团队已恢复即时执行模式'
        )
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingSchedulerNightDispatchConfig.value = false
    }
}

const saveSchedulerQuotaConfig = async() => {
    if (!tenantDetail.value?.id) {
        return
    }
    savingSchedulerQuotaConfig.value = true
    try {
        const response = await updateTenantSchedulerQuotaConfig({
            tenantId: tenantDetail.value.id,
            maxConcurrency: schedulerComplexWorkers.value,
            maxVideoTaskConcurrency: schedulerVideoSlots.value,
            maxFastTaskConcurrency: schedulerAudioWorkers.value
        })
        tenantDetail.value = response.data.data
        syncSchedulerQuotaState(response.data.data)
        ElMessage.success('该团队的处理额度已更新')
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败，请稍后重试')
    } finally {
        savingSchedulerQuotaConfig.value = false
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
        const initialAdmin = response.data.data?.initialAdmin
        if (initialAdmin?.username) {
            const statusText = initialAdmin.enabled ? '已启用' : '已创建但未启用'
            ElMessage.success(`团队创建成功，首个管理员账号：${initialAdmin.username}（${statusText}）`)
        } else {
            ElMessage.success(response.data.message || '团队创建成功')
        }
        await loadTenants()
        await layoutStore.syncTenantList()
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

.function-priority-list {
    display: grid;
    gap: 10px;
    padding: 13px;
    border: 1px solid #e4eaf3;
    border-radius: 10px;
    background: #f8faff;
}

.function-priority-row { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:10px 0; border-bottom:1px solid #e8edf5; }
.function-priority-row > div { min-width:0; display:grid; gap:4px; }
.function-priority-row strong { color:#33445d; font-size:13px; }
.function-priority-row small { color:#7b889d; font-size:12px; line-height:1.5; }
.function-priority-row:last-of-type { border-bottom:0; }
.function-priority-select { flex:0 0 132px; width:132px; }
.function-priority-list p { margin:2px 0 0; color:#728097; font-size:12px; line-height:1.65; }

.priority-panel__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.quota-panel {
    display: grid;
    gap: 14px;
}

.quota-field {
    display: grid;
    gap: 8px;
}

.quota-field span {
    color: #223250;
    font-size: 14px;
    font-weight: 600;
}

.quota-field small {
    color: #7f8ea7;
    line-height: 1.6;
}

.workspace-ghost-btn {
    border-radius: 12px;
    border-color: rgba(78, 110, 178, 0.18);
}

.create-form__alert {
    margin-bottom: 18px;
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
