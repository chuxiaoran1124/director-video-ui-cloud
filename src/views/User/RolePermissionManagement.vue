<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='身份配置'
            title='账号能力配置'
            description='把团队会用到的身份体系、功能范围和操作权限放在一处维护。你可以先建身份，再把页面入口和操作按钮按岗位配好。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='loadRoleList'>刷新身份</el-button>
                <el-button type='primary' class='workspace-primary-btn' @click='openCreateDialog'>新增身份</el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>当前团队</span>
                    <strong>{{ currentTenantName }}</strong>
                    <small>平台管理员可切换团队检查身份配置</small>
                </div>
                <div class='metric-card'>
                    <span>身份数量</span>
                    <strong>{{ roleList.length }}</strong>
                    <small>含系统内置身份和自定义身份</small>
                </div>
                <div class='metric-card'>
                    <span>当前选中</span>
                    <strong>{{ currentRoleDisplayName }}</strong>
                    <small>右侧保存时会同步这个身份的功能范围</small>
                </div>
            </template>
        </WorkspaceHero>

        <el-card shadow='never' class='workspace-panel workspace-panel--toolbar'>
            <div class='toolbar'>
                <el-select
                    v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                    v-model='selectedTenantId'
                    placeholder='选择团队'
                    filterable
                    class='toolbar__tenant'
                    @change='loadRoleList'
                >
                    <el-option
                        v-for='tenant in tenantList'
                        :key='tenant.id'
                        :label='tenant.tenantName'
                        :value='tenant.id'
                    />
                </el-select>
                <el-alert
                    type='info'
                    :closable='false'
                    show-icon
                    :title='`当前团队：${currentTenantName}`'
                />
                <div class='toolbar__actions'>
                    <el-button
                        class='workspace-ghost-btn'
                        :disabled='!selectedRole || selectedRole.isSystem'
                        @click='openEditDialog'
                    >
                        编辑身份
                    </el-button>
                    <el-button
                        type='danger'
                        plain
                        :disabled='!selectedRole || selectedRole.isSystem'
                        @click='handleDeleteRole'
                    >
                        删除身份
                    </el-button>
                </div>
            </div>
        </el-card>

        <RoleRoutePermissionEditor
            :tenant-id='selectedTenantId'
            :role-list='roleList'
            @role-change='handleRoleChange'
        />

        <el-dialog v-model='createDialogVisible' title='新增身份' width='620px' destroy-on-close>
            <el-form ref='createFormRef' :model='roleForm' :rules='roleRules' label-position='top'>
                <el-form-item label='身份名称' prop='roleName'>
                    <el-input v-model='roleForm.roleName' placeholder='例如：内容质检员' />
                </el-form-item>
                <el-form-item label='身份描述' prop='description'>
                    <el-input v-model='roleForm.description' placeholder='简单描述这个身份的职责' />
                </el-form-item>
                <el-form-item label='可见范围' prop='dataScope'>
                    <el-select v-model='roleForm.dataScope'>
                        <el-option label='仅本人内容' value='self' />
                        <el-option label='团队全部内容' value='tenant_all' />
                    </el-select>
                </el-form-item>
                <el-form-item label='身份优先级' prop='roleLevel'>
                    <el-input-number v-model='roleForm.roleLevel' :min='1' :max='999' />
                </el-form-item>
                <el-form-item label='管理能力'>
                    <el-checkbox v-model='roleForm.canManageUsers'>可管理成员</el-checkbox>
                    <el-checkbox v-model='roleForm.canManageRoles'>可管理身份</el-checkbox>
                    <el-checkbox v-model='roleForm.canManageRolePermissions'>可配置功能范围</el-checkbox>
                    <el-checkbox v-if='layoutStore.getUserInfo.isPlatformSuperAdmin' v-model='roleForm.canManageTenantRoutes'>可维护团队功能范围</el-checkbox>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='createDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='saving' @click='submitCreate'>确认创建</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model='editDialogVisible' title='编辑身份' width='620px' destroy-on-close>
            <el-form ref='editFormRef' :model='roleForm' :rules='roleRules' label-position='top'>
                <el-form-item label='身份名称' prop='roleName'>
                    <el-input v-model='roleForm.roleName' placeholder='例如：内容质检员' />
                </el-form-item>
                <el-form-item label='身份描述' prop='description'>
                    <el-input v-model='roleForm.description' placeholder='简单描述这个身份的职责' />
                </el-form-item>
                <el-form-item label='可见范围' prop='dataScope'>
                    <el-select v-model='roleForm.dataScope'>
                        <el-option label='仅本人内容' value='self' />
                        <el-option label='团队全部内容' value='tenant_all' />
                    </el-select>
                </el-form-item>
                <el-form-item label='身份优先级' prop='roleLevel'>
                    <el-input-number v-model='roleForm.roleLevel' :min='1' :max='999' />
                </el-form-item>
                <el-form-item label='管理能力'>
                    <el-checkbox v-model='roleForm.canManageUsers'>可管理成员</el-checkbox>
                    <el-checkbox v-model='roleForm.canManageRoles'>可管理身份</el-checkbox>
                    <el-checkbox v-model='roleForm.canManageRolePermissions'>可配置功能范围</el-checkbox>
                    <el-checkbox v-if='layoutStore.getUserInfo.isPlatformSuperAdmin' v-model='roleForm.canManageTenantRoutes'>可维护团队功能范围</el-checkbox>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='editDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='saving' @click='submitEdit'>保存修改</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { createRole, deleteRole, getRoleList, IUserRoleItem, updateRole } from '/@/api/user'
import { getTenantList, ITenantListItem } from '/@/api/tenant'
import { useLayoutStore } from '/@/store/modules/layout'
import { getRoleDisplayName } from '/@/utils/productLabels'
import RoleRoutePermissionEditor from '/@/views/User/components/RoleRoutePermissionEditor.vue'
import WorkspaceHero from '/@/views/User/components/WorkspaceHero.vue'

const layoutStore = useLayoutStore()
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const tenantList = ref<ITenantListItem[]>([])
const roleList = ref<IUserRoleItem[]>([])
const selectedTenantId = ref<number | undefined>(layoutStore.getCurrentTenant?.id)
const selectedRole = ref<IUserRoleItem>()
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const saving = ref(false)

const roleForm = reactive({
    roleName: '',
    description: '',
    dataScope: 'self',
    roleLevel: 99,
    canManageUsers: false,
    canManageRoles: false,
    canManageRolePermissions: false,
    canManageTenantRoutes: false
})

const roleRules = reactive<FormRules>({
    roleName: [{ required: true, message: '请输入身份名称', trigger: 'blur' }],
    dataScope: [{ required: true, message: '请选择可见范围', trigger: 'change' }],
    roleLevel: [{ required: true, message: '请输入优先级', trigger: 'change' }]
})

const currentTenantName = computed(() => {
    return tenantList.value.find((item) => item.id === selectedTenantId.value)?.tenantName || layoutStore.getCurrentTenant?.tenantName || '未选择团队'
})

const currentRoleDisplayName = computed(() => {
    return selectedRole.value ? getRoleDisplayName(selectedRole.value.roleName) : '未选择身份'
})

function resetRoleForm() {
    roleForm.roleName = ''
    roleForm.description = ''
    roleForm.dataScope = 'self'
    roleForm.roleLevel = 99
    roleForm.canManageUsers = false
    roleForm.canManageRoles = false
    roleForm.canManageRolePermissions = false
    roleForm.canManageTenantRoutes = false
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

const loadRoleList = async() => {
    const response = await getRoleList(selectedTenantId.value)
    roleList.value = response.data.data || []
    if (selectedRole.value) {
        selectedRole.value = roleList.value.find((item) => item.id === selectedRole.value?.id) || roleList.value[0]
    } else {
        selectedRole.value = roleList.value[0]
    }
}

const handleRoleChange = (role?: IUserRoleItem) => {
    selectedRole.value = role
}

const openCreateDialog = () => {
    resetRoleForm()
    createDialogVisible.value = true
}

const openEditDialog = () => {
    if (!selectedRole.value) {
        return
    }
    roleForm.roleName = selectedRole.value.roleName
    roleForm.description = selectedRole.value.description || ''
    roleForm.dataScope = selectedRole.value.dataScope
    roleForm.roleLevel = selectedRole.value.roleLevel
    roleForm.canManageUsers = selectedRole.value.canManageUsers
    roleForm.canManageRoles = selectedRole.value.canManageRoles
    roleForm.canManageRolePermissions = selectedRole.value.canManageRolePermissions
    roleForm.canManageTenantRoutes = selectedRole.value.canManageTenantRoutes
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
    saving.value = true
    try {
        const response = await createRole({
            tenantId: selectedTenantId.value,
            ...roleForm
        })
        ElMessage.success(response.data.message || '身份创建成功')
        createDialogVisible.value = false
        await loadRoleList()
        selectedRole.value = roleList.value.find((item) => item.id === response.data.data.id)
    } finally {
        saving.value = false
    }
}

const submitEdit = async() => {
    if (!editFormRef.value || !selectedRole.value) {
        return
    }
    const valid = await editFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }
    saving.value = true
    try {
        await updateRole(selectedRole.value.id, {
            tenantId: selectedTenantId.value,
            ...roleForm
        })
        ElMessage.success('身份更新成功')
        editDialogVisible.value = false
        await loadRoleList()
        selectedRole.value = roleList.value.find((item) => item.id === selectedRole.value?.id)
    } finally {
        saving.value = false
    }
}

const handleDeleteRole = async() => {
    if (!selectedRole.value) {
        return
    }
    await ElMessageBox.confirm(
        `删除 ${getRoleDisplayName(selectedRole.value.roleName)} 后，这个自定义身份将无法继续分配，是否继续？`,
        '删除身份',
        {
            type: 'warning',
            confirmButtonText: '确认删除',
            cancelButtonText: '取消'
        }
    )
    await deleteRole(selectedRole.value.id, {
        tenantId: selectedTenantId.value
    })
    ElMessage.success('身份已删除')
    selectedRole.value = undefined
    await loadRoleList()
}

onMounted(async() => {
    await loadTenantOptions()
    await loadRoleList()
})
</script>

<style lang='postcss' scoped>
.workspace-page {
    display: grid;
    gap: 18px;
    width: min(1480px, 100%);
    margin: 0 auto;
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

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
}

.toolbar__tenant {
    min-width: 260px;
}

.toolbar__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-left: auto;
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

@media (max-width: 1180px) {
    .toolbar {
        align-items: stretch;
    }

    .toolbar__tenant {
        width: 100%;
        min-width: 0;
    }

    .toolbar__actions {
        margin-left: 0;
        width: 100%;
    }
}
</style>
