<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='平台运维'
            title='旧版素材导出'
            description='平台管理员可以把云上某个成员名下的数字人、音频、绑定关系和个人脚本库导出成旧项目可直接执行的 SQL，用于同步回旧版环境。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='refreshAll'>刷新列表</el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>当前团队</span>
                    <strong>{{ currentTenantName }}</strong>
                    <small>切换团队后，成员列表会同步刷新</small>
                </div>
                <div class='metric-card'>
                    <span>成员数量</span>
                    <strong>{{ userTotal }}</strong>
                    <small>当前团队内可导出素材的成员账号</small>
                </div>
                <div class='metric-card'>
                    <span>导出内容</span>
                    <strong>4 类数据</strong>
                    <small>数字人、音频、绑定关系、个人脚本库</small>
                </div>
                <div class='metric-card'>
                    <span>导入方式</span>
                    <strong>SQL 文件</strong>
                    <small>下载后可直接导入旧项目 MySQL</small>
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
                        v-model='search.keyword'
                        class='workspace-toolbar__search'
                        placeholder='搜索账号 / 姓名 / 邮箱'
                        clearable
                        @keyup.enter='loadUsers'
                    />
                    <el-select
                        v-model='search.status'
                        clearable
                        placeholder='成员状态'
                        class='workspace-toolbar__status'
                    >
                        <el-option label='启用' value='active' />
                        <el-option label='停用' value='inactive' />
                    </el-select>
                </div>
                <div class='workspace-toolbar__group'>
                    <el-button @click='resetFilters'>重置</el-button>
                    <el-button type='primary' class='workspace-primary-btn' @click='loadUsers'>查询</el-button>
                </div>
            </div>
        </el-card>

        <el-card shadow='never' class='workspace-panel'>
            <template #header>
                <div class='workspace-panel__header'>
                    <div>
                        <h3>团队成员导出列表</h3>
                        <p>点击右侧“导出 SQL”后，填入旧项目里承接素材的用户 ID，系统会生成一份可直接导入旧项目的全量覆盖脚本。</p>
                    </div>
                </div>
            </template>

            <el-alert
                type='warning'
                :closable='false'
                class='mb-4'
                title='导出说明'
                description='导出的 SQL 会先删除旧项目里该 user_id 名下原有的数字人、音频、绑定关系和个人脚本库，再全量写入当前最新数据，不会携带主键 id。请确认旧项目承接账号 user_id 填写无误。'
            />

            <el-table :data='userList' stripe class='workspace-table' v-loading='loadingUsers'>
                <el-table-column label='成员信息' min-width='260'>
                    <template #default='{ row }'>
                        <div class='member-cell'>
                            <div class='member-cell__avatar'>{{ buildNameInitial(row.name || row.username) }}</div>
                            <div class='member-cell__meta'>
                                <strong>{{ row.name || row.username }}</strong>
                                <span>{{ row.username }}</span>
                                <small>ID: {{ row.userId }}</small>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label='当前身份' min-width='220'>
                    <template #default='{ row }'>
                        <div class='role-chip-group'>
                            <el-tag
                                v-for='roleName in row.tenantRoleNames'
                                :key='`${row.userId}-${roleName}`'
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
                <el-table-column label='联系方式' min-width='220'>
                    <template #default='{ row }'>
                        <div class='member-contact'>
                            <span>{{ row.email || '未填写邮箱' }}</span>
                            <span>{{ row.phone || '未填写手机号' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label='操作' width='150' fixed='right'>
                    <template #default='{ row }'>
                        <el-button type='primary' link @click='openExportDialog(row)'>导出 SQL</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model='exportDialogVisible' title='导出旧版导入 SQL' width='520px' destroy-on-close>
            <el-form ref='exportFormRef' :model='exportForm' :rules='exportRules' label-position='top'>
                <el-form-item label='来源团队'>
                    <el-input :model-value='currentTenantName' disabled />
                </el-form-item>
                <el-form-item label='来源账号'>
                    <el-input :model-value='currentUserLabel' disabled />
                </el-form-item>
                <el-form-item label='旧项目承接账号 user_id' prop='legacyUserId'>
                    <el-input-number
                        v-model='exportForm.legacyUserId'
                        :min='1'
                        :step='1'
                        controls-position='right'
                        class='!w-full'
                    />
                    <div class='temporary-access-tip'>
                        <span>这里填写旧项目里用于承接素材的账号 user_id。</span>
                        <span>导入时会先清空这个 user_id 名下本次导出范围内的旧数据，再写入最新导出结果。</span>
                    </div>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='exportDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='exporting' @click='submitExport'>
                    下载 SQL
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { getTenantList, ITenantListItem } from '/@/api/tenant'
import { exportLegacyMaterialSql, getUserList, IUserListItem } from '/@/api/user'
import { triggerBlobDownload } from '/@/utils/download'
import { getRoleDisplayName, getStatusDisplayName } from '/@/utils/productLabels'

const tenantList = ref<ITenantListItem[]>([])
const userList = ref<IUserListItem[]>([])
const selectedTenantId = ref<number>()
const userTotal = ref(0)
const loadingUsers = ref(false)
const exportDialogVisible = ref(false)
const exporting = ref(false)
const exportFormRef = ref<FormInstance>()
const currentTargetUser = ref<IUserListItem | null>(null)

const search = reactive({
    keyword: '',
    status: ''
})

const exportForm = reactive({
    legacyUserId: undefined as number | undefined
})

const exportRules = reactive<FormRules>({
    legacyUserId: [
        { required: true, message: '请填写旧项目承接账号 user_id', trigger: 'change' }
    ]
})

const currentTenantName = computed(() => {
    return tenantList.value.find((item) => item.id === selectedTenantId.value)?.tenantName || '未选择团队'
})

const currentUserLabel = computed(() => {
    if (!currentTargetUser.value) {
        return ''
    }
    return `${currentTargetUser.value.name || currentTargetUser.value.username}（${currentTargetUser.value.username} / ID: ${currentTargetUser.value.userId}）`
})

const buildNameInitial = (value: string) => String(value || '成').slice(0, 1).toUpperCase()
const formatRoleLabel = (roleName: string) => getRoleDisplayName(roleName)
const formatStatusLabel = (status: string) => getStatusDisplayName(status)

const parseFileName = (headerValue?: string) => {
    const normalized = String(headerValue || '')
    const utf8Match = normalized.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1])
    }
    const basicMatch = normalized.match(/filename="?([^";]+)"?/i)
    if (basicMatch?.[1]) {
        return basicMatch[1]
    }
    return `legacy-material-export-${Date.now()}.sql`
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
            pageSize: 200,
            tenantId: selectedTenantId.value,
            search: {
                keyword: search.keyword,
                status: search.status
            }
        })
        userList.value = response.data.data.data || []
        userTotal.value = response.data.data.total || 0
    } finally {
        loadingUsers.value = false
    }
}

const refreshAll = async() => {
    await loadUsers()
}

const handleTenantChange = async() => {
    await refreshAll()
}

const resetFilters = async() => {
    search.keyword = ''
    search.status = ''
    await refreshAll()
}

const openExportDialog = (row: IUserListItem) => {
    currentTargetUser.value = row
    exportForm.legacyUserId = undefined
    exportDialogVisible.value = true
}

const submitExport = async() => {
    if (!exportFormRef.value || !selectedTenantId.value || !currentTargetUser.value) {
        return
    }
    const valid = await exportFormRef.value.validate().catch(() => false)
    if (!valid || !exportForm.legacyUserId) {
        return
    }

    exporting.value = true
    try {
        const response = await exportLegacyMaterialSql({
            tenantId: selectedTenantId.value,
            sourceUserId: currentTargetUser.value.userId,
            legacyUserId: exportForm.legacyUserId
        })
        const fileName = parseFileName(response.headers?.['content-disposition'])
        triggerBlobDownload(response.data as Blob, fileName)
        exportDialogVisible.value = false
        ElMessage.success('旧版导入 SQL 已开始下载')
    } finally {
        exporting.value = false
    }
}

onMounted(async() => {
    await loadTenants()
    await refreshAll()
})
</script>

<style lang='postcss' scoped>
.member-cell {
    display: flex;
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

.member-cell__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #475569;
    font-size: 13px;
}

.member-cell__meta strong {
    color: #0f172a;
    font-size: 14px;
}

.member-cell__meta small {
    color: #94a3b8;
}

.role-chip-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.role-chip {
    border-radius: 999px;
}

.member-contact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #64748b;
    font-size: 13px;
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
</style>
