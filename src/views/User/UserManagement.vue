<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='成员协作'
            title='成员管理'
            description='把团队成员、账号开通、身份调整和停用操作收在一个更顺手的后台工作台里，方便管理员快速处理协作权限。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='loadUserList'>刷新列表</el-button>
                <el-button type='primary' class='workspace-primary-btn' @click='openCreateDialog'>新增成员</el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>当前团队</span>
                    <strong>{{ currentTenantName }}</strong>
                    <small>切换团队后，成员和身份会同步刷新</small>
                </div>
                <div class='metric-card'>
                    <span>成员总数</span>
                    <strong>{{ totalUsers }}</strong>
                    <small>包含当前列表中的全部账号</small>
                </div>
                <div class='metric-card'>
                    <span>启用账号</span>
                    <strong>{{ activeUsers }}</strong>
                    <small>当前仍可正常登录和操作的成员</small>
                </div>
                <div class='metric-card'>
                    <span>身份种类</span>
                    <strong>{{ roleOptions.length }}</strong>
                    <small>可分配给本团队成员的身份数量</small>
                </div>
            </template>
        </WorkspaceHero>

        <el-card shadow='never' class='workspace-panel workspace-panel--filters'>
            <div class='workspace-toolbar'>
                <div class='workspace-toolbar__group'>
                    <el-select
                        v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
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
                        placeholder='搜索账号 / 姓名 / 邮箱 / 手机号'
                        clearable
                        @keyup.enter='loadUserList'
                    />
                    <el-select v-model='search.status' clearable placeholder='状态' class='workspace-toolbar__status'>
                        <el-option label='启用' value='active' />
                        <el-option label='停用' value='inactive' />
                    </el-select>
                </div>
                <div class='workspace-toolbar__group'>
                    <el-button @click='resetSearch'>重置</el-button>
                    <el-button type='primary' class='workspace-primary-btn' @click='loadUserList'>查询</el-button>
                </div>
            </div>
        </el-card>

        <el-card shadow='never' class='workspace-panel'>
            <template #header>
                <div class='workspace-panel__header'>
                    <div>
                        <h3>成员列表</h3>
                        <p>可以直接查看成员当前身份、状态，并在这里完成升级、停用或移除。</p>
                    </div>
                </div>
            </template>

            <el-table :data='userList' stripe class='workspace-table'>
                <el-table-column label='成员信息' min-width='260'>
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
                <el-table-column prop='email' label='邮箱' min-width='220' />
                <el-table-column prop='phone' label='手机号' min-width='150' />
                <el-table-column label='成员身份' min-width='220'>
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
                <el-table-column prop='status' label='状态' width='110'>
                    <template #default='{ row }'>
                        <el-tag :type="row.status === 'active' ? 'success' : 'info'" effect='light'>
                            {{ formatStatusLabel(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label='操作' width='210' fixed='right'>
                    <template #default='{ row }'>
                        <div class='action-group'>
                            <el-button type='primary' link @click='openEditDialog(row)'>编辑</el-button>
                            <el-button type='danger' link @click='handleDelete(row)'>移除</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog v-model='createDialogVisible' title='新增成员' width='580px' destroy-on-close>
            <el-form ref='createFormRef' :model='createForm' :rules='rules' label-position='top'>
                <el-form-item label='所属团队' prop='tenantId'>
                    <el-select v-if='layoutStore.getUserInfo.isPlatformSuperAdmin' v-model='createForm.tenantId' placeholder='请选择团队' filterable @change='loadCreateRoleOptions'>
                        <el-option
                            v-for='tenant in tenantList'
                            :key='tenant.id'
                            :label='tenant.tenantName'
                            :value='tenant.id'
                        />
                    </el-select>
                    <el-input v-else :model-value='currentTenantName' disabled />
                </el-form-item>
                <el-form-item label='登录账号' prop='username'>
                    <el-input v-model='createForm.username' placeholder='请输入用户名' />
                </el-form-item>
                <el-form-item label='初始密码' prop='password'>
                    <el-input v-model='createForm.password' placeholder='请输入密码' show-password />
                </el-form-item>
                <el-form-item label='姓名' prop='name'>
                    <el-input v-model='createForm.name' placeholder='请输入姓名' />
                </el-form-item>
                <el-form-item label='邮箱' prop='email'>
                    <el-input v-model='createForm.email' placeholder='请输入邮箱' />
                </el-form-item>
                <el-form-item label='手机号' prop='phone'>
                    <el-input v-model='createForm.phone' placeholder='请输入手机号' />
                </el-form-item>
                <el-form-item label='成员身份' prop='tenantRoleCode'>
                    <el-select v-model='createForm.tenantRoleCode' placeholder='请选择成员身份'>
                        <el-option
                            v-for='role in roleOptions'
                            :key='role.id'
                            :label='formatRoleLabel(role.roleName)'
                            :value='role.roleCode'
                        />
                    </el-select>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='createDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='creating' @click='submitCreate'>确认创建</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model='editDialogVisible' title='编辑成员' width='580px' destroy-on-close>
            <el-form ref='editFormRef' :model='editForm' :rules='editRules' label-position='top'>
                <el-form-item label='所属团队'>
                    <el-input :model-value='currentTenantName' disabled />
                </el-form-item>
                <el-form-item label='登录账号' prop='username'>
                    <el-input v-model='editForm.username' placeholder='请输入用户名' />
                </el-form-item>
                <el-form-item label='姓名' prop='name'>
                    <el-input v-model='editForm.name' placeholder='请输入姓名' />
                </el-form-item>
                <el-form-item label='邮箱' prop='email'>
                    <el-input v-model='editForm.email' placeholder='请输入邮箱' />
                </el-form-item>
                <el-form-item label='手机号' prop='phone'>
                    <el-input v-model='editForm.phone' placeholder='请输入手机号' />
                </el-form-item>
                <el-form-item label='成员身份' prop='tenantRoleCode'>
                    <el-select v-model='editForm.tenantRoleCode' placeholder='请选择成员身份'>
                        <el-option
                            v-for='role in roleOptions'
                            :key='role.id'
                            :label='formatRoleLabel(role.roleName)'
                            :value='role.roleCode'
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label='账号状态' prop='status'>
                    <el-radio-group v-model='editForm.status'>
                        <el-radio-button label='active'>启用</el-radio-button>
                        <el-radio-button label='inactive'>停用</el-radio-button>
                    </el-radio-group>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='editDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='updating' @click='submitEdit'>保存修改</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
    createUser,
    deleteUser,
    getRoleList,
    getUserList,
    IUserListItem,
    IUserRoleItem,
    updateUser
} from '/@/api/user'
import { getTenantList, ITenantListItem } from '/@/api/tenant'
import { useLayoutStore } from '/@/store/modules/layout'
import { getRoleDisplayName, getStatusDisplayName } from '/@/utils/productLabels'
import WorkspaceHero from '/@/views/User/components/WorkspaceHero.vue'

const layoutStore = useLayoutStore()
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const tenantList = ref<ITenantListItem[]>([])
const roleOptions = ref<IUserRoleItem[]>([])
const userList = ref<IUserListItem[]>([])
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const creating = ref(false)
const updating = ref(false)

const selectedTenantId = ref<number | undefined>(layoutStore.getCurrentTenant?.id)
const search = reactive({
    keyword: '',
    status: ''
})

const createForm = reactive({
    tenantId: layoutStore.getCurrentTenant?.id,
    username: '',
    password: 'Cloud@123456',
    name: '',
    email: '',
    phone: '',
    tenantRoleCode: ''
})

const editForm = reactive({
    userId: 0,
    username: '',
    name: '',
    email: '',
    phone: '',
    tenantRoleCode: '',
    status: 'active'
})

const rules = reactive<FormRules>({
    tenantId: [{ required: true, message: '请选择团队', trigger: 'change' }],
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    tenantRoleCode: [{ required: true, message: '请选择成员身份', trigger: 'change' }]
})

const editRules = reactive<FormRules>({
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    tenantRoleCode: [{ required: true, message: '请选择成员身份', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const currentTenantId = computed(() => selectedTenantId.value || layoutStore.getCurrentTenant?.id)
const currentTenantName = computed(() => {
    return tenantList.value.find((item) => item.id === currentTenantId.value)?.tenantName || layoutStore.getCurrentTenant?.tenantName || '当前团队'
})
const totalUsers = computed(() => userList.value.length)
const activeUsers = computed(() => userList.value.filter((item) => item.status === 'active').length)

const formatRoleLabel = (roleName: string) => getRoleDisplayName(roleName)
const formatStatusLabel = (status: string) => getStatusDisplayName(status)

const buildNameInitial = (value: string) => value.trim().slice(0, 1).toUpperCase()

const getPreferredRoleCode = (roleList: IUserRoleItem[]) => {
    return roleList.find((item) => item.roleCode === 'tenant_user')?.roleCode || roleList[0]?.roleCode || ''
}

const resetCreateForm = () => {
    createForm.tenantId = currentTenantId.value
    createForm.username = ''
    createForm.password = 'Cloud@123456'
    createForm.name = ''
    createForm.email = ''
    createForm.phone = ''
    createForm.tenantRoleCode = ''
}

const resetEditForm = () => {
    editForm.userId = 0
    editForm.username = ''
    editForm.name = ''
    editForm.email = ''
    editForm.phone = ''
    editForm.tenantRoleCode = ''
    editForm.status = 'active'
}

const loadTenantOptions = async() => {
    const response = await getTenantList({
        page: 1,
        pageSize: 50,
        search: {}
    })
    tenantList.value = response.data.data.data || []
    if (!selectedTenantId.value && tenantList.value.length) {
        selectedTenantId.value = tenantList.value[0].id
    }
}

const loadRoleOptions = async(tenantId?: number) => {
    const response = await getRoleList(tenantId || currentTenantId.value)
    roleOptions.value = response.data.data || []
}

const loadCreateRoleOptions = async() => {
    await loadRoleOptions(createForm.tenantId)
    if (!roleOptions.value.some((item) => item.roleCode === createForm.tenantRoleCode)) {
        createForm.tenantRoleCode = getPreferredRoleCode(roleOptions.value)
    }
}

const loadUserList = async() => {
    const response = await getUserList({
        page: 1,
        pageSize: 100,
        tenantId: currentTenantId.value,
        search: {
            keyword: search.keyword,
            status: search.status
        }
    })
    userList.value = response.data.data.data || []
}

const handleTenantChange = async() => {
    resetCreateForm()
    resetEditForm()
    await loadRoleOptions(currentTenantId.value)
    await loadUserList()
}

const resetSearch = async() => {
    search.keyword = ''
    search.status = ''
    await loadUserList()
}

const openCreateDialog = async() => {
    resetCreateForm()
    createDialogVisible.value = true
    await loadCreateRoleOptions()
}

const openEditDialog = async(row: IUserListItem) => {
    await loadRoleOptions(currentTenantId.value)
    editForm.userId = row.userId
    editForm.username = row.username
    editForm.name = row.name || ''
    editForm.email = row.email || ''
    editForm.phone = row.phone || ''
    editForm.status = row.status
    editForm.tenantRoleCode = row.tenantRoleCodes[0] || getPreferredRoleCode(roleOptions.value)
    editDialogVisible.value = true
}

const submitCreate = async() => {
    if (!createFormRef.value) {
        return
    }
    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    creating.value = true
    try {
        await createUser({ ...createForm })
        ElMessage.success('成员创建成功')
        createDialogVisible.value = false
        resetCreateForm()
        await loadUserList()
    } finally {
        creating.value = false
    }
}

const submitEdit = async() => {
    if (!editFormRef.value) {
        return
    }
    const valid = await editFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    updating.value = true
    try {
        await updateUser({
            tenantId: currentTenantId.value,
            userId: editForm.userId,
            username: editForm.username,
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            tenantRoleCode: editForm.tenantRoleCode,
            status: editForm.status
        })
        ElMessage.success('成员信息更新成功')
        editDialogVisible.value = false
        resetEditForm()
        await loadUserList()
    } finally {
        updating.value = false
    }
}

const handleDelete = async(row: IUserListItem) => {
    await ElMessageBox.confirm(
        `移除成员后，${row.name || row.username} 将无法继续使用当前团队功能，是否继续？`,
        '移除成员',
        {
            type: 'warning',
            confirmButtonText: '确认移除',
            cancelButtonText: '取消'
        }
    )
    await deleteUser({
        tenantId: currentTenantId.value,
        userId: row.userId
    })
    ElMessage.success('成员已移除')
    await loadUserList()
}

onMounted(async() => {
    await loadTenantOptions()
    await loadRoleOptions(currentTenantId.value)
    await loadUserList()
})
</script>

<style lang='postcss' scoped>
.workspace-page {
    display: grid;
    gap: 18px;
}

.workspace-panel {
    border: 1px solid rgba(141, 163, 196, 0.16);
    border-radius: 24px;
    box-shadow: 0 18px 48px rgba(36, 66, 130, 0.08);
    background: rgba(255, 255, 255, 0.98);
}

.workspace-panel--filters {
    backdrop-filter: blur(10px);
}

.workspace-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
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

.workspace-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.workspace-toolbar__group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
}

.workspace-toolbar__tenant {
    min-width: 220px;
}

.workspace-toolbar__search {
    min-width: min(420px, 72vw);
}

.workspace-toolbar__status {
    min-width: 140px;
}

.workspace-primary-btn {
    border-radius: 12px;
    background: linear-gradient(135deg, #2f6bff, #4b8dff);
    border: none;
    box-shadow: 0 12px 30px rgba(57, 110, 242, 0.22);
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
    line-height: 1.1;
}

.metric-card small {
    display: block;
    margin-top: 6px;
    color: #8b97ab;
    line-height: 1.6;
}

.member-cell {
    display: flex;
    align-items: center;
    gap: 14px;
}

.member-cell__avatar {
    width: 42px;
    height: 42px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: #1c3f92;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(97, 156, 255, 0.18), rgba(76, 123, 255, 0.12));
}

.member-cell__meta {
    display: grid;
    gap: 4px;
}

.member-cell__meta strong {
    color: #132039;
}

.member-cell__meta span {
    color: #7c8aa2;
    font-size: 12px;
}

.role-chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.role-chip {
    border-radius: 999px;
    border-color: rgba(73, 123, 255, 0.16);
    background: rgba(238, 244, 255, 0.75);
    color: #2450a7;
}

.action-group {
    display: flex;
    gap: 10px;
}

.workspace-table :deep(.el-table__row) {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
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

@media (max-width: 980px) {
    .workspace-toolbar,
    .workspace-toolbar__group {
        align-items: stretch;
    }

    .workspace-toolbar__tenant,
    .workspace-toolbar__search,
    .workspace-toolbar__status {
        width: 100%;
        min-width: 0;
    }
}
</style>
