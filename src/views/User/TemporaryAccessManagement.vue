<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='外部协作'
            title='临时访问分发'
            description='平台管理员可以在这里给指定团队成员分发短期访问链接，让对方在约定时间和约定网络地址下直接进入系统。'
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
                            <p>账号创建仍走原有成员管理流程，这里只负责给已有账号分发临时访问链接。</p>
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
                            <p>链接只能在允许的 IP 下进入系统，撤销后当前临时会话也会立即失效。</p>
                        </div>
                    </div>
                </template>

                <el-table :data='linkList' stripe class='workspace-table' v-loading='loadingLinks'>
                    <el-table-column label='分发对象' min-width='220'>
                        <template #default='{ row }'>
                            <div class='link-user-cell'>
                                <strong>{{ row.user?.name || row.user?.username || '未知成员' }}</strong>
                                <span>{{ row.user?.username || '-' }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label='允许 IP' min-width='220'>
                        <template #default='{ row }'>
                            <div class='ip-list'>
                                <el-tag
                                    v-for='ip in row.allowedIps'
                                    :key='`${row.linkId}-${ip}`'
                                    size='small'
                                    effect='plain'
                                >
                                    {{ ip }}
                                </el-tag>
                            </div>
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
                    <el-table-column label='操作' width='120' fixed='right'>
                        <template #default='{ row }'>
                            <el-button
                                v-if='row.status === "active"'
                                type='danger'
                                link
                                @click='handleRevoke(row)'
                            >
                                撤销
                            </el-button>
                            <span v-else class='link-action__disabled'>-</span>
                        </template>
                    </el-table-column>
                </el-table>
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
                <el-form-item label='允许访问 IP' prop='allowedIpsText'>
                    <el-input
                        v-model='createForm.allowedIpsText'
                        type='textarea'
                        :rows='4'
                        placeholder='请输入允许访问的公网 IP，一行一个，或用英文逗号分隔'
                    />
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

        <el-dialog v-model='resultDialogVisible' title='临时访问链接已生成' width='640px' destroy-on-close>
            <div class='result-card'>
                <p>请把下面这条地址发给目标成员，对方在允许的 IP 下打开后即可直接进入系统。</p>
                <el-input :model-value='generatedAccessUrl' type='textarea' :rows='4' readonly />
                <div class='result-card__meta'>
                    <span>链接有效期：{{ generatedLinkExpireAt || '-' }}</span>
                    <span>允许 IP：{{ generatedAllowedIpsText || '-' }}</span>
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
import { createTemporaryAccessLink, getTemporaryAccessLinkList, getUserList, IUserListItem, ITemporaryAccessLinkItem, revokeTemporaryAccessLink } from '/@/api/user'
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
const resultDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const currentTargetUser = ref<IUserListItem | null>(null)

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

const generatedAccessUrl = ref('')
const generatedLinkExpireAt = ref('')
const generatedAllowedIpsText = ref('')

const createRules = reactive<FormRules>({
    expiresInDays: [
        { required: true, message: '请设置有效期', trigger: 'change' }
    ],
    allowedIpsText: [
        {
            validator: (_rule, value, callback) => {
                if (!String(value || '').trim()) {
                    callback(new Error('至少需要填写一个允许访问的 IP'))
                    return
                }
                callback()
            },
            trigger: 'blur'
        }
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

const parseAllowedIps = () => {
    return createForm.allowedIpsText
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

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

const openCreateDialog = (row: IUserListItem) => {
    currentTargetUser.value = row
    resetCreateForm()
    createDialogVisible.value = true
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
        generatedAccessUrl.value = response.data.data.accessUrl || ''
        generatedLinkExpireAt.value = response.data.data.expiresAt || ''
        generatedAllowedIpsText.value = (response.data.data.allowedIps || []).join('、')
        createDialogVisible.value = false
        resultDialogVisible.value = true
        ElMessage.success('临时访问链接已生成')
        await loadLinks()
    } finally {
        creating.value = false
    }
}

const copyGeneratedUrl = async() => {
    if (!generatedAccessUrl.value) {
        return
    }
    try {
        await navigator.clipboard.writeText(generatedAccessUrl.value)
        ElMessage.success('链接已复制到剪贴板')
    } catch {
        ElMessage.warning('当前浏览器不支持自动复制，请手动复制弹窗中的链接')
    }
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
    await loadLinks()
}

onMounted(async() => {
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

.role-chip {
    border-radius: 999px;
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
