<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='外部协作'
            title='临时访问分发'
            description='平台管理员可以在这里给指定团队成员分发短期访问链接，让对方在约定时间内先完成访问校验，再输入账号密码进入系统。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='refreshAll'>刷新数据</el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>当前团队</span>
                    <strong>{{ currentTenantName }}</strong>
                    <small>切换团队后，成员和链接都会同步刷新</small>
                </div>
                <div class='metric-card'>
                    <span>可分发成员</span>
                    <strong>{{ userTotal }}</strong>
                    <small>当前团队内可用的普通业务账号</small>
                </div>
                <div class='metric-card'>
                    <span>有效链接</span>
                    <strong>{{ activeLinkCount }}</strong>
                    <small>当前仍可正常打开的临时访问链接</small>
                </div>
                <div class='metric-card'>
                    <span>已撤销链接</span>
                    <strong>{{ revokedLinkCount }}</strong>
                    <small>已手动失效，不可再进入系统</small>
                </div>
            </template>
        </WorkspaceHero>

        <el-card shadow='never' class='workspace-panel workspace-panel--filters'>
            <div class='workspace-toolbar'>
                <div class='workspace-toolbar__group'>
                    <el-select
                        v-model='selectedTenantId'
                        placeholder='选择团队'
                        filterable
                        class='workspace-toolbar__tenant'
                        @change='handleTenantChange'
                    >
                        <el-option
                            v-for='tenant in tenantList'
                            :key='tenant.id'
                            :label='tenant.tenantName'
                            :value='tenant.id'
                        />
                    </el-select>
                    <el-input
                        v-model='userSearch.keyword'
                        class='workspace-toolbar__search'
                        placeholder='搜索账号 / 姓名 / 邮箱'
                        clearable
                        @keyup.enter='loadUsers'
                    />
                    <el-select v-model='linkSearch.status' clearable placeholder='链接状态' class='workspace-toolbar__status'>
                        <el-option label='有效' value='active' />
                        <el-option label='已撤销' value='revoked' />
                        <el-option label='已过期' value='expired' />
                    </el-select>
                </div>
                <div class='workspace-toolbar__group'>
                    <el-button @click='resetFilters'>重置</el-button>
                    <el-button type='primary' class='workspace-primary-btn' @click='refreshAll'>查询</el-button>
                </div>
            </div>
        </el-card>

        <div class='workspace-grid workspace-grid--split'>
            <el-card shadow='never' class='workspace-panel'>
                <template #header>
                    <div class='workspace-panel__header'>
                        <div>
                            <h3>成员分发列表</h3>
                            <p>账号创建仍走原有成员管理流程；如果目标账号当前处于停用状态，这里生成链接时会临时启用，到期或撤销后再自动停用。</p>
                        </div>
                    </div>
                </template>

                <el-table :data='userList' stripe class='workspace-table' v-loading='loadingUsers'>
                    <el-table-column label='成员信息' min-width='240'>
                        <template #default='{ row }'>
                            <div class='member-cell'>
                                <div class='member-cell__avatar'>{{ buildNameInitial(row.name || row.username) }}</div>
                                <div class='member-cell__meta'>
                                    <strong>{{ row.name || row.username }}</strong>
                                    <span>{{ row.username }}</span>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label='当前身份' min-width='180'>
                        <template #default='{ row }'>
                            <div class='role-chip-group'>
                                <el-tag
                                    v-for='roleName in row.tenantRoleNames'
                                    :key='roleName'
                                    class='role-chip'
                                    effect='plain'
                                >
                                    {{ formatRoleLabel(roleName) }}
                                </el-tag>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop='status' label='账号状态' width='110'>
                        <template #default='{ row }'>
                            <el-tag :type="row.status === 'active' ? 'success' : 'info'" effect='light'>
                                {{ formatStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label='操作' width='130' fixed='right'>
                        <template #default='{ row }'>
                            <el-button type='primary' link @click='openCreateDialog(row)'>生成链接</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>

            <el-card shadow='never' class='workspace-panel'>
                <template #header>
                    <div class='workspace-panel__header'>
                        <div>
                            <h3>已分发链接</h3>
                            <p>当前暂未启用 IP 限制；已填写的 IP 会保留，后续开启限制时继续生效。</p>
                        </div>
                    </div>
                </template>

                <div class='link-table-scroll'>
                    <div class='link-table-scroll__inner'>
                    <el-table :data='linkList' stripe class='workspace-table workspace-table--links' v-loading='loadingLinks'>
                        <el-table-column label='分发对象' min-width='220'>
                            <template #default='{ row }'>
                                <div class='link-user-cell'>
                                    <strong>{{ row.user?.name || row.user?.username || '未知成员' }}</strong>
                                    <span>{{ row.user?.username || '-' }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label='保留 IP 配置' min-width='280'>
                            <template #default='{ row }'>
                                <div v-if='getBoundEntryIp(row) || getManualAllowedIps(row).length' class='ip-display'>
                                    <div v-if='getBoundEntryIp(row)' class='ip-display__line'>
                                        <span class='ip-display__label'>首次绑定</span>
                                        <el-tag size='small' type='success' effect='plain'>{{ getBoundEntryIp(row) }}</el-tag>
                                    </div>
                                    <div v-if='getManualAllowedIps(row).length' class='ip-display__line'>
                                        <span class='ip-display__label'>额外允许</span>
                                        <div class='ip-list'>
                                            <el-tag
                                                v-for='ip in getManualAllowedIps(row)'
                                                :key='`${row.linkId}-${ip}`'
                                                size='small'
                                                effect='plain'
                                            >
                                                {{ ip }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </div>
                                <span v-else class='ip-list__empty'>当前未限制 IP</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop='usedCount' label='使用次数' width='100' />
                        <el-table-column prop='expiresAt' label='到期时间' min-width='170' />
                        <el-table-column label='状态' width='110'>
                            <template #default='{ row }'>
                                <el-tag :type='getLinkStatusType(row.status)' effect='light'>
                                    {{ getLinkStatusLabel(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label='操作' width='280' fixed='right'>
                            <template #default='{ row }'>
                                <div class='link-action-group'>
                                    <el-button
                                        v-if='row.accessUrl'
                                        type='primary'
                                        link
                                        @click='handleCopyLink(row)'
                                    >
                                        复制链接
                                    </el-button>
                                    <el-button type='primary' link @click='openEditIpDialog(row)'>修改 IP</el-button>
                                    <el-button type='primary' link @click='openRenewDialog(row)'>续期</el-button>
                                    <el-button
                                        v-if='row.status === "active"'
                                        type='danger'
                                        link
                                        @click='handleRevoke(row)'
                                    >
                                        撤销
                                    </el-button>
                                    <el-button
                                        type='danger'
                                        link
                                        @click='handleDelete(row)'
                                    >
                                        删除记录
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                    </div>
                </div>
            </el-card>
        </div>

        <el-dialog v-model='createDialogVisible' title='生成临时访问链接' width='560px' destroy-on-close>
            <el-form ref='createFormRef' :model='createForm' :rules='createRules' label-position='top'>
                <el-form-item label='所属团队'>
                    <el-input :model-value='currentTenantName' disabled />
                </el-form-item>
                <el-form-item label='分发账号'>
                    <el-input :model-value='createTargetLabel' disabled />
                </el-form-item>
                <el-form-item label='有效期（天）' prop='expiresInDays'>
                    <el-input-number v-model='createForm.expiresInDays' :min='1' :max='30' controls-position='right' />
                </el-form-item>
                <el-form-item label='保留 IP 配置' prop='allowedIpsText'>
                    <el-input
                        v-model='createForm.allowedIpsText'
                        type='textarea'
                        :rows='4'
                        placeholder='可选：一行一个公网 IP，或用英文逗号分隔；当前暂不限制 IP，填写内容会保留备用'
                    />
                    <div class='temporary-access-tip'>
                        <span>当前已临时关闭 IP 绑定和校验；这里填写的 IP 仅作为后续恢复限制时的备用配置。</span>
                        <span v-if='currentDetectedIp'>当前系统识别到你本机的 IP：{{ currentDetectedIp }}</span>
                    </div>
                </el-form-item>
                <el-form-item label='备注'>
                    <el-input v-model='createForm.remark' type='textarea' :rows='3' placeholder='可选：记录这条链接给谁、用于什么场景' />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='createDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='creating' @click='submitCreate'>
                    生成链接
                </el-button>
            </template>
        </el-dialog>

        <el-dialog v-model='renewDialogVisible' title='续期临时访问链接' width='480px' destroy-on-close>
            <el-form ref='renewFormRef' :model='renewForm' :rules='renewRules' label-position='top'>
                <el-form-item label='分发账号'>
                    <el-input :model-value='renewTargetLabel' disabled />
                </el-form-item>
                <el-form-item label='当前到期时间'>
                    <el-input :model-value='renewCurrentExpireAt' disabled />
                </el-form-item>
                <el-form-item label='续期天数' prop='renewDays'>
                    <el-input-number v-model='renewForm.renewDays' :min='1' :max='30' controls-position='right' />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='renewDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='renewing' @click='submitRenew'>
                    确认续期
                </el-button>
            </template>
        </el-dialog>

        <el-dialog v-model='editIpDialogVisible' title='修改保留 IP 配置' width='560px' destroy-on-close>
            <el-form ref='editIpFormRef' :model='editIpForm' label-position='top'>
                <el-form-item label='分发账号'>
                    <el-input :model-value='editIpTargetLabel' disabled />
                </el-form-item>
                <el-form-item label='历史首次绑定 IP'>
                    <el-input :model-value='editIpBoundEntryIp || "当前未启用 IP 绑定"' disabled />
                </el-form-item>
                <el-form-item label='额外 IP 配置'>
                    <el-input
                        v-model='editIpForm.allowedIpsText'
                        type='textarea'
                        :rows='5'
                        placeholder='可选：一行一个公网 IP，或用英文逗号分隔。当前不会按 IP 拦截，仅保留配置。'
                    />
                    <div class='temporary-access-tip'>
                        <span>当前暂未启用 IP 限制，保存后不会影响用户访问。</span>
                        <span>后续如果重新打开限制，这里保留的 IP 会继续作为额外放行配置。</span>
                    </div>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='editIpDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='updatingIps' @click='submitEditIps'>
                    保存配置
                </el-button>
            </template>
        </el-dialog>

        <el-dialog v-model='resultDialogVisible' :title='resultDialogTitle' width='640px' destroy-on-close>
            <div class='result-card'>
                <p>请把下面这条地址发给目标成员。当前暂未启用 IP 限制，对方打开链接后即可进入登录流程。</p>
                <el-input :model-value='generatedAccessUrl' type='textarea' :rows='4' readonly />
                <div class='result-card__meta'>
                    <span>链接有效期：{{ generatedLinkExpireAt || '-' }}</span>
                    <span>保留 IP 配置：{{ generatedAllowedIpsText || '当前未限制 IP' }}</span>
                </div>
            </div>
            <template #footer>
                <el-button @click='resultDialogVisible = false'>关闭</el-button>
                <el-button type='primary' class='workspace-primary-btn' @click='copyGeneratedUrl'>复制链接</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { createTemporaryAccessLink, deleteTemporaryAccessLink, getTemporaryAccessCurrentIp, getTemporaryAccessLinkList, getUserList, IUserListItem, ITemporaryAccessLinkItem, renewTemporaryAccessLink, revokeTemporaryAccessLink, updateTemporaryAccessAllowedIps } from '/@/api/user'
import { getTenantList, ITenantListItem } from '/@/api/tenant'
import { getRoleDisplayName, getStatusDisplayName } from '/@/utils/productLabels'

const tenantList = ref<ITenantListItem[]>([])
const userList = ref<IUserListItem[]>([])
const linkList = ref<ITemporaryAccessLinkItem[]>([])

const selectedTenantId = ref<number>()
const userTotal = ref(0)
const loadingUsers = ref(false)
const loadingLinks = ref(false)
const createDialogVisible = ref(false)
const renewDialogVisible = ref(false)
const resultDialogVisible = ref(false)
const editIpDialogVisible = ref(false)
const creating = ref(false)
const renewing = ref(false)
const updatingIps = ref(false)
const createFormRef = ref<FormInstance>()
const renewFormRef = ref<FormInstance>()
const editIpFormRef = ref<FormInstance>()
const currentTargetUser = ref<IUserListItem | null>(null)
const currentRenewLink = ref<ITemporaryAccessLinkItem | null>(null)
const currentEditIpLink = ref<ITemporaryAccessLinkItem | null>(null)

const userSearch = reactive({
    keyword: ''
})

const linkSearch = reactive({
    status: ''
})

const createForm = reactive({
    expiresInDays: 14,
    allowedIpsText: '',
    remark: ''
})

const renewForm = reactive({
    renewDays: 7
})

const editIpForm = reactive({
    allowedIpsText: ''
})

const generatedAccessUrl = ref('')
const generatedLinkExpireAt = ref('')
const generatedAllowedIpsText = ref('')
const currentDetectedIp = ref('')
const resultDialogTitle = ref('临时访问链接已生成')

const createRules = reactive<FormRules>({
    expiresInDays: [
        { required: true, message: '请设置有效期', trigger: 'change' }
    ]
})

const renewRules = reactive<FormRules>({
    renewDays: [
        { required: true, message: '请设置续期天数', trigger: 'change' }
    ]
})

const currentTenantName = computed(() => {
    return tenantList.value.find((item) => item.id === selectedTenantId.value)?.tenantName || '未选择团队'
})

const createTargetLabel = computed(() => {
    if (!currentTargetUser.value) {
        return ''
    }
    return `${currentTargetUser.value.name || currentTargetUser.value.username}（${currentTargetUser.value.username}）`
})

const renewTargetLabel = computed(() => {
    if (!currentRenewLink.value) {
        return ''
    }
    const currentUser = currentRenewLink.value.user
    return `${currentUser?.name || currentUser?.username || '未知成员'}（${currentUser?.username || '-'}）`
})

const renewCurrentExpireAt = computed(() => currentRenewLink.value?.expiresAt || '')

const editIpTargetLabel = computed(() => {
    if (!currentEditIpLink.value) {
        return ''
    }
    const currentUser = currentEditIpLink.value.user
    return `${currentUser?.name || currentUser?.username || '未知成员'}（${currentUser?.username || '-'}）`
})

const editIpBoundEntryIp = computed(() => {
    if (!currentEditIpLink.value) {
        return ''
    }
    return getBoundEntryIp(currentEditIpLink.value)
})

const activeLinkCount = computed(() => linkList.value.filter((item) => item.status === 'active').length)
const revokedLinkCount = computed(() => linkList.value.filter((item) => item.status === 'revoked').length)

const buildNameInitial = (value: string) => String(value || '成').slice(0, 1).toUpperCase()
const formatRoleLabel = (roleName: string) => getRoleDisplayName(roleName)
const formatStatusLabel = (status: string) => getStatusDisplayName(status)

const getLinkStatusLabel = (status: string) => {
    if (status === 'active') {
        return '有效'
    }
    if (status === 'revoked') {
        return '已撤销'
    }
    if (status === 'expired') {
        return '已过期'
    }
    return status
}

const getLinkStatusType = (status: string) => {
    if (status === 'active') {
        return 'success'
    }
    if (status === 'revoked') {
        return 'danger'
    }
    return 'info'
}

const getBoundEntryIp = (row: ITemporaryAccessLinkItem) => {
    return String(row.boundEntryIp || row.firstEntryIp || row.lastUsedIp || '').trim()
}

const getManualAllowedIps = (row: ITemporaryAccessLinkItem) => {
    return (row.allowedIps || []).filter(Boolean)
}

const parseIpText = (text: string) => {
    return text
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

const parseAllowedIps = () => parseIpText(createForm.allowedIpsText)

const loadTenants = async() => {
    const response = await getTenantList({
        page: 1,
        pageSize: 200,
        search: {}
    })
    tenantList.value = response.data.data.data || []
    if (!selectedTenantId.value && tenantList.value.length) {
        selectedTenantId.value = tenantList.value[0].id
    }
}

const loadCurrentDetectedIp = async() => {
    try {
        const response = await getTemporaryAccessCurrentIp()
        currentDetectedIp.value = response.data.data.clientIp || ''
    } catch {
        currentDetectedIp.value = ''
    }
}

const loadUsers = async() => {
    if (!selectedTenantId.value) {
        return
    }
    loadingUsers.value = true
    try {
        const response = await getUserList({
            page: 1,
            pageSize: 100,
            tenantId: selectedTenantId.value,
            search: {
                keyword: userSearch.keyword
            }
        })
        userList.value = response.data.data.data || []
        userTotal.value = response.data.data.total || 0
    } finally {
        loadingUsers.value = false
    }
}

const loadLinks = async() => {
    if (!selectedTenantId.value) {
        return
    }
    loadingLinks.value = true
    try {
        const response = await getTemporaryAccessLinkList({
            page: 1,
            pageSize: 50,
            tenantId: selectedTenantId.value,
            status: linkSearch.status || undefined,
            keyword: userSearch.keyword || undefined
        })
        linkList.value = response.data.data.data || []
    } finally {
        loadingLinks.value = false
    }
}

const refreshAll = async() => {
    await Promise.all([loadUsers(), loadLinks()])
}

const handleTenantChange = async() => {
    await refreshAll()
}

const resetFilters = async() => {
    userSearch.keyword = ''
    linkSearch.status = ''
    await refreshAll()
}

const resetCreateForm = () => {
    createForm.expiresInDays = 14
    createForm.allowedIpsText = ''
    createForm.remark = ''
}

const resetRenewForm = () => {
    renewForm.renewDays = 7
}

const resetEditIpForm = (row: ITemporaryAccessLinkItem) => {
    editIpForm.allowedIpsText = getManualAllowedIps(row).join('\n')
}

const showResultDialog = (data: ITemporaryAccessLinkItem, title: string) => {
    resultDialogTitle.value = title
    generatedAccessUrl.value = data.accessUrl || ''
    generatedLinkExpireAt.value = data.expiresAt || ''
    generatedAllowedIpsText.value = (data.allowedIps || []).join('、')
    resultDialogVisible.value = true
}

const openCreateDialog = (row: IUserListItem) => {
    currentTargetUser.value = row
    resetCreateForm()
    createDialogVisible.value = true
}

const openRenewDialog = (row: ITemporaryAccessLinkItem) => {
    currentRenewLink.value = row
    resetRenewForm()
    renewDialogVisible.value = true
}

const openEditIpDialog = (row: ITemporaryAccessLinkItem) => {
    currentEditIpLink.value = row
    resetEditIpForm(row)
    editIpDialogVisible.value = true
}

const submitCreate = async() => {
    if (!createFormRef.value || !selectedTenantId.value || !currentTargetUser.value) {
        return
    }

    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    creating.value = true
    try {
        const allowedIps = parseAllowedIps()
        const entryBaseUrl = `${window.location.origin}${window.location.pathname}#/link-entry`
        const response = await createTemporaryAccessLink({
            tenantId: selectedTenantId.value,
            userId: currentTargetUser.value.userId,
            expiresInDays: createForm.expiresInDays,
            allowedIps,
            remark: createForm.remark,
            entryBaseUrl
        })
        createDialogVisible.value = false
        showResultDialog(response.data.data, '临时访问链接已生成')
        ElMessage.success('临时访问链接已生成')
        await refreshAll()
    } finally {
        creating.value = false
    }
}

const copyText = async(text: string, successMessage: string) => {
    if (!text) {
        return
    }
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success(successMessage)
    } catch {
        ElMessage.warning('当前浏览器不支持自动复制，请手动复制弹窗中的链接')
    }
}

const copyGeneratedUrl = async() => {
    await copyText(generatedAccessUrl.value, '链接已复制到剪贴板')
}

const handleCopyLink = async(row: ITemporaryAccessLinkItem) => {
    if (!row.accessUrl) {
        ElMessage.warning('该链接地址已归档清理，请重新生成或续期后再复制')
        return
    }
    await copyText(row.accessUrl, '链接已复制到剪贴板')
}

const handleRevoke = async(row: ITemporaryAccessLinkItem) => {
    await ElMessageBox.confirm(
        '撤销后，对方当前的临时访问会话也会立即失效，确定继续吗？',
        '撤销临时访问链接',
        {
            type: 'warning',
            confirmButtonText: '确认撤销',
            cancelButtonText: '取消'
        }
    )
    await revokeTemporaryAccessLink(row.linkId)
    ElMessage.success('临时访问链接已撤销')
    await refreshAll()
}

const handleDelete = async(row: ITemporaryAccessLinkItem) => {
    const isActiveLink = row.status === 'active'
    await ElMessageBox.confirm(
        isActiveLink
            ? '删除后，这条访问链接会立即失效，同时会从分发记录里彻底移除，确定继续吗？'
            : '删除后，这条分发记录会从列表里彻底移除，确定继续吗？',
        '删除临时访问记录',
        {
            type: 'warning',
            confirmButtonText: '确认删除',
            cancelButtonText: '取消'
        }
    )
    await deleteTemporaryAccessLink(row.linkId)
    ElMessage.success('临时访问记录已删除')
    await refreshAll()
}

const submitRenew = async() => {
    if (!renewFormRef.value || !currentRenewLink.value) {
        return
    }

    const valid = await renewFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    renewing.value = true
    try {
        const response = await renewTemporaryAccessLink({
            linkId: currentRenewLink.value.linkId,
            renewDays: renewForm.renewDays
        })
        renewDialogVisible.value = false
        showResultDialog(response.data.data, '临时访问链接已续期')
        ElMessage.success('临时访问链接已续期')
        await refreshAll()
    } finally {
        renewing.value = false
    }
}

const submitEditIps = async() => {
    if (!currentEditIpLink.value) {
        return
    }

    updatingIps.value = true
    try {
        const response = await updateTemporaryAccessAllowedIps({
            linkId: currentEditIpLink.value.linkId,
            allowedIps: parseIpText(editIpForm.allowedIpsText)
        })
        editIpDialogVisible.value = false
        currentEditIpLink.value = response.data.data
        ElMessage.success('可访问 IP 已更新')
        await refreshAll()
    } finally {
        updatingIps.value = false
    }
}

onMounted(async() => {
    await loadCurrentDetectedIp()
    await loadTenants()
    await refreshAll()
})
</script>

<style lang='postcss' scoped>
.workspace-grid--split {
    display: grid;
    grid-template-columns: minmax(420px, 1.15fr) minmax(380px, 1fr);
    gap: 20px;
}

.workspace-panel {
    min-width: 0;
}

.temporary-access-tip {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
}

.member-cell,
.link-user-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.member-cell {
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.member-cell__avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.16), rgba(14, 165, 233, 0.26));
    color: #1d4ed8;
    font-weight: 700;
}

.member-cell__meta,
.link-user-cell {
    color: #475569;
    font-size: 13px;
}

.member-cell__meta strong,
.link-user-cell strong {
    color: #0f172a;
    font-size: 14px;
}

.role-chip-group,
.ip-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.ip-display {
    display: grid;
    gap: 8px;
}

.ip-display__line {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.ip-display__label {
    flex: 0 0 64px;
    color: #64748b;
    font-size: 12px;
    line-height: 24px;
}

.ip-list__empty {
    color: #94a3b8;
    font-size: 13px;
}

.role-chip {
    border-radius: 999px;
}

.link-table-scroll {
    max-height: 620px;
    overflow: auto;
    padding-bottom: 4px;
}

.link-table-scroll__inner {
    min-width: 1040px;
}

.link-action-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.result-card {
    display: grid;
    gap: 14px;
}

.result-card p {
    margin: 0;
    color: #475569;
    line-height: 1.8;
}

.result-card__meta {
    display: grid;
    gap: 8px;
    color: #64748b;
    font-size: 13px;
}

.link-action__disabled {
    color: #94a3b8;
}

@media (max-width: 1180px) {
    .workspace-grid--split {
        grid-template-columns: 1fr;
    }
}
</style>
