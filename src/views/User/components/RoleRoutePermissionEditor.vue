<template>
    <div class='strategy-editor'>
        <aside class='strategy-editor__sidebar'>
            <div class='strategy-editor__section-head'>
                <div>
                    <span class='strategy-editor__eyebrow'>身份列表</span>
                    <h3>按岗位配置开放范围</h3>
                </div>
            </div>

            <div v-if='roleList.length' class='role-card-list'>
                <button
                    v-for='role in roleList'
                    :key='role.id'
                    type='button'
                    class='role-card'
                    :class="{ 'role-card--active': currentRoleId === role.id }"
                    @click='currentRoleId = role.id'
                >
                    <div class='role-card__head'>
                        <strong>{{ formatRoleName(role.roleName) }}</strong>
                        <el-tag size='small' effect='plain'>Lv.{{ role.roleLevel }}</el-tag>
                    </div>
                    <div class='role-card__meta'>
                        <span>{{ formatDataScopeLabel(role.dataScope) }}</span>
                        <span v-if='role.isSystem'>系统内置</span>
                        <span v-else>自定义身份</span>
                    </div>
                    <div class='role-card__caps'>
                        <el-tag v-if='role.canManageUsers' size='small' effect='light'>成员管理</el-tag>
                        <el-tag v-if='role.canManageRoles' size='small' effect='light'>身份维护</el-tag>
                        <el-tag v-if='role.canManageRolePermissions' size='small' effect='light'>能力配置</el-tag>
                        <el-tag v-if='role.canManageTenantRoutes' size='small' effect='light'>策略维护</el-tag>
                    </div>
                </button>
            </div>

            <el-empty v-else description='当前团队还没有可配置身份' />
        </aside>

        <section class='strategy-editor__main'>
            <el-card shadow='never' class='editor-summary-card'>
                <div class='editor-summary'>
                    <div>
                        <span class='strategy-editor__eyebrow'>当前焦点</span>
                        <h3>{{ currentRole ? formatRoleName(currentRole.roleName) : '请选择身份' }}</h3>
                        <p>先勾选左侧页面入口，再为当前页面配置可执行动作。保存后会直接影响这个身份在前端能看到和能操作的范围。</p>
                    </div>
                    <div class='editor-summary__actions'>
                        <div class='editor-summary__stats'>
                            <div>
                                <span>已选页面</span>
                                <strong>{{ checkedRouteIds.length }}</strong>
                            </div>
                            <div>
                                <span>动作字典</span>
                                <strong>{{ permissionList.length }}</strong>
                            </div>
                        </div>
                        <el-button
                            type='primary'
                            class='workspace-primary-btn'
                            :loading='saving || loadingPermissions'
                            :disabled='!currentRoleId || loadingPermissions'
                            @click='savePermissions'
                        >
                            保存设置
                        </el-button>
                    </div>
                </div>
            </el-card>

            <div class='editor-grid'>
                <el-card shadow='never' class='editor-panel'>
                    <template #header>
                        <div class='editor-panel__header'>
                            <div>
                                <h4>功能入口</h4>
                                <p>勾选后表示这个身份能在工作台里看到对应入口。</p>
                            </div>
                        </div>
                    </template>

                    <el-tree
                        ref='treeRef'
                        node-key='id'
                        show-checkbox
                        default-expand-all
                        :data='routeCatalog'
                        :props='treeProps'
                        @check='handleTreeCheck'
                        @node-click='handleNodeClick'
                    >
                        <template #default='{ data }'>
                            <div class='route-node'>
                                <div class='route-node__main'>
                                    <strong>{{ formatRouteTitle(data) }}</strong>
                                    <span>{{ data.path || '/' }}</span>
                                </div>
                            </div>
                        </template>
                    </el-tree>
                </el-card>

                <el-card shadow='never' class='editor-panel'>
                    <template #header>
                        <div class='editor-panel__header'>
                            <div>
                                <h4>可执行动作</h4>
                                <p>动作只会对当前选中的页面生效，未勾选页面时这里不会写入权限。</p>
                            </div>
                        </div>
                    </template>

                    <template v-if='activeRoute'>
                        <div class='permission-head'>
                            <strong>{{ formatRouteTitle(activeRoute) }}</strong>
                            <span>{{ isActiveRouteChecked ? '已开放入口' : '请先在左侧勾选入口' }}</span>
                        </div>
                        <el-checkbox-group
                            v-model='currentPermissionIds'
                            :disabled='!isActiveRouteChecked'
                            class='permission-grid'
                        >
                            <el-checkbox
                                v-for='permission in permissionList'
                                :key='permission.id'
                                :label='permission.id'
                                class='permission-card'
                            >
                                <span>{{ formatPermissionLabel(permission.name) }}</span>
                            </el-checkbox>
                        </el-checkbox-group>
                    </template>
                    <el-empty v-else description='请选择左侧功能后再设置动作' />
                </el-card>
            </div>
        </section>
    </div>
</template>

<script lang='ts' setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { ElTree } from 'element-plus'
import { IMenubarList } from '/@/type/store/layout'
import {
    getPermissionList,
    getRoleRoutePermissionList,
    getRouteCatalog,
    IPermissionOption,
    IUserRoleItem,
    updateRoleRoutePermission
} from '/@/api/user'
import {
    getDataScopeDisplayName,
    getPermissionDisplayName,
    getProductRouteTitle,
    getRoleDisplayName
} from '/@/utils/productLabels'

const props = defineProps<{
    tenantId?: number
    roleList: IUserRoleItem[]
}>()
const emit = defineEmits<{
    (event: 'role-change', role: IUserRoleItem | undefined): void
}>()

const treeRef = ref<InstanceType<typeof ElTree>>()
const routeCatalog = ref<IMenubarList[]>([])
const permissionList = ref<IPermissionOption[]>([])
const currentRoleId = ref<number>()
const activeRouteId = ref<number>()
const saving = ref(false)
const loadingPermissions = ref(false)
const rolePermissionRequestId = ref(0)

const checkedRouteIds = ref<number[]>([])
const routePermissionMap = reactive<Record<number, number[]>>({})

const treeProps = {
    children: 'children'
}

const currentRole = computed(() => props.roleList.find((item) => item.id === currentRoleId.value))

const flatRouteMap = computed(() => {
    const map = new Map<number, IMenubarList>()
    const walk = (routes: IMenubarList[]) => {
        routes.forEach((route) => {
            if (typeof route.id === 'number') {
                map.set(route.id, route)
            }
            if (route.children?.length) {
                walk(route.children)
            }
        })
    }
    walk(routeCatalog.value)
    return map
})

const activeRoute = computed(() => flatRouteMap.value.get(activeRouteId.value || 0))
const isActiveRouteChecked = computed(() => checkedRouteIds.value.includes(activeRouteId.value || -1))

const currentPermissionIds = computed<number[]>({
    get() {
        if (!activeRouteId.value) {
            return []
        }
        return routePermissionMap[activeRouteId.value] || []
    },
    set(value) {
        if (!activeRouteId.value) {
            return
        }
        routePermissionMap[activeRouteId.value] = value
    }
})

function formatDataScopeLabel(scope: string) {
    return getDataScopeDisplayName(scope)
}

function formatPermissionLabel(permissionName: string) {
    return getPermissionDisplayName(permissionName)
}

function formatRoleName(roleName: string) {
    return getRoleDisplayName(roleName)
}

function formatRouteTitle(route: IMenubarList) {
    return getProductRouteTitle(route.name, route.meta?.title || route.name)
}

function getDefaultViewPermissionId() {
    return permissionList.value.find((item) => item.name === 'view')?.id
}

async function loadBaseOptions() {
    const [routeResponse, permissionResponse] = await Promise.all([
        getRouteCatalog(),
        getPermissionList()
    ])
    routeCatalog.value = routeResponse.data.data || []
    permissionList.value = permissionResponse.data.data || []
}

function clearRolePermissionState() {
    checkedRouteIds.value = []
    activeRouteId.value = undefined
    Object.keys(routePermissionMap).forEach((key) => {
        delete routePermissionMap[Number(key)]
    })
}

async function loadRolePermissions() {
    const requestId = rolePermissionRequestId.value + 1
    rolePermissionRequestId.value = requestId
    loadingPermissions.value = true
    clearRolePermissionState()
    await nextTick()
    treeRef.value?.setCheckedKeys([])

    if (!currentRoleId.value) {
        if (requestId === rolePermissionRequestId.value) {
            loadingPermissions.value = false
        }
        return
    }

    try {
        const response = await getRoleRoutePermissionList(currentRoleId.value, props.tenantId)
        if (requestId !== rolePermissionRequestId.value) {
            return
        }
        const relationList = response.data.data || []

        relationList.forEach((item) => {
            checkedRouteIds.value.push(item.routeId)
            routePermissionMap[item.routeId] = [...item.permissionIds]
        })

        await nextTick()
        treeRef.value?.setCheckedKeys(checkedRouteIds.value)
        activeRouteId.value = checkedRouteIds.value[0]
    } finally {
        if (requestId === rolePermissionRequestId.value) {
            loadingPermissions.value = false
        }
    }
}

function handleTreeCheck(_: IMenubarList, options: { checkedKeys: Array<string | number> }) {
    if (loadingPermissions.value) {
        return
    }
    const nextCheckedKeys = options.checkedKeys.filter((item): item is number => typeof item === 'number')
    const defaultPermissionId = getDefaultViewPermissionId()

    checkedRouteIds.value = nextCheckedKeys
    nextCheckedKeys.forEach((routeId) => {
        if (!routePermissionMap[routeId]) {
            routePermissionMap[routeId] = defaultPermissionId ? [defaultPermissionId] : []
        }
    })

    Object.keys(routePermissionMap).forEach((routeId) => {
        if (!nextCheckedKeys.includes(Number(routeId))) {
            delete routePermissionMap[Number(routeId)]
        }
    })

    if (activeRouteId.value && !nextCheckedKeys.includes(activeRouteId.value)) {
        activeRouteId.value = nextCheckedKeys[0]
    }
}

function handleNodeClick(route: IMenubarList) {
    if (loadingPermissions.value) {
        return
    }
    if (typeof route.id === 'number') {
        activeRouteId.value = route.id
    }
}

async function savePermissions() {
    if (!currentRoleId.value) {
        ElMessage.warning('请先选择成员身份')
        return
    }

    saving.value = true
    try {
        await updateRoleRoutePermission({
            tenantId: props.tenantId,
            permissions: [
                {
                    roleId: currentRoleId.value,
                    routeId: checkedRouteIds.value,
                    routePermissions: checkedRouteIds.value.map((routeId) => ({
                        routeId,
                        permissionIds: routePermissionMap[routeId] || []
                    }))
                }
            ]
        })
        ElMessage.success('功能范围保存成功')
    } finally {
        saving.value = false
    }
}

watch(
    () => props.roleList,
    (roleList) => {
        if (!roleList.length) {
            currentRoleId.value = undefined
            clearRolePermissionState()
            return
        }
        if (!currentRoleId.value || !roleList.some((item) => item.id === currentRoleId.value)) {
            currentRoleId.value = roleList[0].id
        }
    },
    { immediate: true, deep: true }
)

watch(
    () => currentRoleId.value,
    async() => {
        emit('role-change', currentRole.value)
        await loadRolePermissions()
    }
)

watch(
    () => props.tenantId,
    async() => {
        await loadRolePermissions()
    }
)

onMounted(async() => {
    await loadBaseOptions()
    if (props.roleList.length && !currentRoleId.value) {
        currentRoleId.value = props.roleList[0].id
    }
})
</script>

<style lang='postcss' scoped>
.strategy-editor {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
}

.strategy-editor__sidebar {
    position: sticky;
    top: 18px;
    padding: 20px;
    border-radius: 24px;
    border: 1px solid rgba(141, 163, 196, 0.16);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.94)),
        linear-gradient(180deg, #f5f9ff, #ffffff);
    box-shadow: 0 18px 48px rgba(36, 66, 130, 0.08);
}

.strategy-editor__main {
    display: grid;
    gap: 18px;
}

.strategy-editor__section-head h3 {
    margin: 10px 0 0;
    color: #132039;
    font-size: 22px;
}

.strategy-editor__eyebrow {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    color: #2457d6;
    background: rgba(54, 110, 255, 0.08);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.role-card-list {
    display: grid;
    gap: 12px;
    margin-top: 18px;
}

.role-card {
    width: 100%;
    padding: 16px;
    border: 1px solid rgba(177, 197, 228, 0.26);
    border-radius: 20px;
    background: rgba(248, 251, 255, 0.92);
    text-align: left;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.role-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 36px rgba(43, 90, 186, 0.1);
}

.role-card--active {
    border-color: rgba(61, 119, 255, 0.38);
    background: linear-gradient(180deg, rgba(240, 246, 255, 0.98), rgba(247, 250, 255, 0.98));
    box-shadow: 0 20px 42px rgba(43, 90, 186, 0.14);
}

.role-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.role-card__head strong {
    flex: 1;
    min-width: 0;
    color: #132039;
    font-size: 16px;
    line-height: 1.5;
    word-break: break-word;
}

.role-card__head :deep(.el-tag) {
    flex-shrink: 0;
}

.role-card__meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
    color: #6c7991;
    font-size: 12px;
}

.role-card__caps {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
}

.editor-summary-card,
.editor-panel {
    border-radius: 24px;
    border: 1px solid rgba(141, 163, 196, 0.16);
    box-shadow: 0 18px 48px rgba(36, 66, 130, 0.08);
    background: rgba(255, 255, 255, 0.98);
}

.editor-summary {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    min-height: 138px;
}

.editor-summary h3 {
    margin: 12px 0 8px;
    color: #132039;
    font-size: 26px;
}

.editor-summary p {
    margin: 0;
    color: #6c7991;
    line-height: 1.8;
    font-size: 13px;
    max-width: 760px;
}

.editor-summary__actions {
    display: grid;
    gap: 14px;
    justify-items: end;
    align-content: center;
}

.editor-summary__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(110px, 1fr));
    gap: 12px;
}

.editor-summary__stats div {
    padding: 14px 16px;
    min-width: 120px;
    border-radius: 18px;
    background: rgba(245, 249, 255, 0.86);
    border: 1px solid rgba(159, 182, 220, 0.16);
}

.editor-summary__stats span {
    display: block;
    color: #6f7e96;
    font-size: 12px;
}

.editor-summary__stats strong {
    display: block;
    margin-top: 8px;
    color: #11203b;
    font-size: 22px;
}

.workspace-primary-btn {
    border-radius: 12px;
    background: linear-gradient(135deg, #2f6bff, #4b8dff);
    border: none;
    box-shadow: 0 12px 30px rgba(57, 110, 242, 0.22);
}

.editor-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
    gap: 18px;
    align-items: start;
}

.editor-panel__header h4 {
    margin: 0;
    color: #132039;
    font-size: 18px;
}

.editor-panel__header p {
    margin: 6px 0 0;
    color: #6c7991;
    font-size: 13px;
}

.route-node {
    width: 100%;
    padding: 8px 0;
}

.route-node__main {
    display: grid;
    gap: 4px;
}

.route-node__main strong {
    color: #17233b;
}

.route-node__main span {
    color: #7c8aa2;
    font-size: 12px;
}

.permission-head {
    display: grid;
    gap: 6px;
    margin-bottom: 16px;
}

.permission-head strong {
    color: #132039;
    font-size: 18px;
}

.permission-head span {
    color: #6c7991;
    font-size: 13px;
}

.permission-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: stretch;
}

.permission-card {
    display: flex;
    align-items: center;
    width: 100%;
    margin-right: 0;
    min-height: 54px;
    padding: 0 16px;
    border-radius: 18px;
    border: 1px solid rgba(177, 197, 228, 0.34);
    background: linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(243, 247, 255, 0.92));
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

:deep(.el-tree-node__content) {
    height: auto;
    min-height: 38px;
    padding: 6px 0;
    align-items: flex-start;
}

:deep(.el-tree-node__expand-icon) {
    margin-top: 8px;
}

:deep(.el-tree-node__children) {
    overflow: visible;
}

:deep(.permission-card .el-checkbox__label) {
    display: block;
    flex: 1;
    white-space: normal;
    line-height: 1.4;
    color: #2450a7;
    font-weight: 600;
}

:deep(.permission-card .el-checkbox__input) {
    margin-top: 0;
}

:deep(.permission-card .el-checkbox__inner) {
    border-radius: 7px;
}

:deep(.permission-card.is-checked) {
    border-color: rgba(78, 128, 255, 0.38);
    background: linear-gradient(180deg, rgba(239, 246, 255, 1), rgba(233, 242, 255, 0.94));
    box-shadow: 0 10px 24px rgba(68, 114, 224, 0.10);
}

@media (max-width: 1180px) {
    .strategy-editor,
    .editor-grid {
        grid-template-columns: 1fr;
    }

    .permission-grid {
        grid-template-columns: 1fr;
    }

    .strategy-editor__sidebar {
        position: static;
        top: auto;
    }

    .editor-summary {
        align-items: flex-start;
        flex-direction: column;
    }

    .editor-summary__actions {
        width: 100%;
        justify-items: stretch;
    }
}
</style>
