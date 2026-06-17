<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='功能入口'
            title='功能导航'
            description='把团队会看到的工作入口、页面标题和操作字典放在同一个工作区里。平台管理员可以直接在这里维护入口结构。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='loadData'>刷新内容</el-button>
                <el-button
                    v-if='layoutStore.getUserInfo.isPlatformSuperAdmin'
                    type='primary'
                    class='workspace-primary-btn'
                    @click='openCreateDialog'
                >
                    新增入口
                </el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>目录节点</span>
                    <strong>{{ totalRoutes }}</strong>
                    <small>当前功能树里可维护的入口数量</small>
                </div>
                <div class='metric-card'>
                    <span>动作字典</span>
                    <strong>{{ permissionList.length }}</strong>
                    <small>页面内可配置的可执行操作种类</small>
                </div>
                <div class='metric-card'>
                    <span>当前模式</span>
                    <strong>{{ layoutStore.getUserInfo.isPlatformSuperAdmin ? '可编辑' : '只读' }}</strong>
                    <small>只有平台管理员可以新增或修改入口</small>
                </div>
            </template>
        </WorkspaceHero>

        <div class='workspace-grid'>
            <el-card shadow='never' class='workspace-panel'>
                <template #header>
                    <div class='workspace-panel__header'>
                        <div>
                            <h3>功能目录</h3>
                            <p>点击左侧节点可以查看入口详情，也可以继续维护标题和路径。</p>
                        </div>
                    </div>
                </template>
                <el-tree
                    :data='routeCatalog'
                    node-key='id'
                    default-expand-all
                    :props="{ children: 'children' }"
                    class='workspace-tree'
                    @node-click='handleRouteClick'
                >
                    <template #default='{ data }'>
                        <div class='menu-node'>
                            <div class='menu-node__title'>{{ formatRouteTitle(data) }}</div>
                            <div class='menu-node__path'>{{ buildDisplayPath(data) }}</div>
                        </div>
                    </template>
                </el-tree>
            </el-card>

            <div class='workspace-side'>
                <el-card shadow='never' class='workspace-panel'>
                    <template #header>
                        <div class='workspace-panel__header'>
                            <div>
                                <h3>入口详情</h3>
                                <p>右侧用于查看当前入口的名称、路径和维护动作。</p>
                            </div>
                        </div>
                    </template>

                    <el-empty v-if='!selectedRoute' description='选择左侧功能入口后查看详情' />
                    <div v-else class='route-detail'>
                        <div class='route-detail__head'>
                            <div>
                                <strong>{{ formatRouteTitle(selectedRoute) }}</strong>
                                <span>{{ selectedRoute.name }}</span>
                            </div>
                            <el-tag effect='plain'>{{ selectedRoute.children?.length ? '目录节点' : '页面节点' }}</el-tag>
                        </div>

                        <el-descriptions :column='1' border>
                            <el-descriptions-item label='页面标题'>{{ selectedRoute.meta?.title || selectedRoute.name }}</el-descriptions-item>
                            <el-descriptions-item label='访问路径'>{{ buildDisplayPath(selectedRoute) }}</el-descriptions-item>
                            <el-descriptions-item label='组件地址'>{{ selectedRoute.component }}</el-descriptions-item>
                            <el-descriptions-item label='图标编码'>{{ selectedRoute.meta?.icon || '未设置' }}</el-descriptions-item>
                        </el-descriptions>

                        <div v-if='layoutStore.getUserInfo.isPlatformSuperAdmin' class='route-detail__actions'>
                            <el-button class='workspace-ghost-btn' @click='openEditDialog'>编辑入口</el-button>
                            <el-button
                                type='danger'
                                plain
                                :disabled='Boolean(selectedRoute.children?.length)'
                                @click='handleDelete'
                            >
                                删除入口
                            </el-button>
                        </div>
                    </div>
                </el-card>

                <el-card shadow='never' class='workspace-panel'>
                    <template #header>
                        <div class='workspace-panel__header'>
                            <div>
                                <h3>可执行操作</h3>
                                <p>这里展示当前系统内统一使用的操作字典，方便核对页面权限按钮。</p>
                            </div>
                        </div>
                    </template>
                    <div class='permission-dictionary'>
                        <el-tag v-for='permission in permissionList' :key='permission.id' effect='plain' class='permission-chip'>
                            {{ formatPermissionLabel(permission.name) }}
                        </el-tag>
                    </div>
                </el-card>
            </div>
        </div>

        <el-dialog v-model='createDialogVisible' title='新增功能入口' width='620px' destroy-on-close>
            <el-form ref='createFormRef' :model='routeForm' :rules='routeRules' label-position='top'>
                <el-form-item label='页面标题' prop='title'>
                    <el-input v-model='routeForm.title' placeholder='例如：内容质检台' />
                </el-form-item>
                <el-form-item label='访问路径' prop='path'>
                    <el-input v-model='routeForm.path' placeholder='例如：/permission/content-audit' />
                </el-form-item>
                <el-form-item label='路由编码' prop='name'>
                    <el-input v-model='routeForm.name' placeholder='例如：content-audit' />
                </el-form-item>
                <el-form-item label='组件地址' prop='component'>
                    <el-input v-model='routeForm.component' placeholder='例如：/User/MenuManagement' />
                </el-form-item>
                <el-form-item label='图标编码' prop='icon'>
                    <el-input v-model='routeForm.icon' placeholder='例如：menu' />
                </el-form-item>
                <el-form-item label='排序值' prop='sort'>
                    <el-input-number v-model='routeForm.sort' :min='0' :max='999' />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click='createDialogVisible = false'>取消</el-button>
                <el-button type='primary' class='workspace-primary-btn' :loading='saving' @click='submitCreate'>确认新增</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model='editDialogVisible' title='编辑功能入口' width='620px' destroy-on-close>
            <el-form ref='editFormRef' :model='routeForm' :rules='routeRules' label-position='top'>
                <el-form-item label='页面标题' prop='title'>
                    <el-input v-model='routeForm.title' placeholder='例如：内容质检台' />
                </el-form-item>
                <el-form-item label='访问路径' prop='path'>
                    <el-input v-model='routeForm.path' placeholder='例如：/permission/content-audit' />
                </el-form-item>
                <el-form-item label='路由编码' prop='name'>
                    <el-input v-model='routeForm.name' placeholder='例如：content-audit' />
                </el-form-item>
                <el-form-item label='组件地址' prop='component'>
                    <el-input v-model='routeForm.component' placeholder='例如：/User/MenuManagement' />
                </el-form-item>
                <el-form-item label='图标编码' prop='icon'>
                    <el-input v-model='routeForm.icon' placeholder='例如：menu' />
                </el-form-item>
                <el-form-item label='排序值' prop='sort'>
                    <el-input-number v-model='routeForm.sort' :min='0' :max='999' />
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
import { IMenubarList } from '/@/type/store/layout'
import { getPermissionList, getRouteCatalog, IPermissionOption } from '/@/api/user'
import { createRoute, deleteRoute, getAllRoute, updateRoute } from '/@/api/system'
import { getPermissionDisplayName, getProductRouteTitle } from '/@/utils/productLabels'
import { useLayoutStore } from '/@/store/modules/layout'
import WorkspaceHero from '/@/views/User/components/WorkspaceHero.vue'

const layoutStore = useLayoutStore()
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const routeCatalog = ref<IMenubarList[]>([])
const permissionList = ref<IPermissionOption[]>([])
const selectedRoute = ref<IMenubarList>()
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const saving = ref(false)

const routeForm = reactive({
    title: '',
    path: '',
    name: '',
    component: '',
    icon: '',
    sort: 99
})

const routeRules = reactive<FormRules>({
    title: [{ required: true, message: '请输入页面标题', trigger: 'blur' }],
    path: [{ required: true, message: '请输入访问路径', trigger: 'blur' }],
    name: [{ required: true, message: '请输入路由编码', trigger: 'blur' }],
    component: [{ required: true, message: '请输入组件地址', trigger: 'blur' }]
})

const totalRoutes = computed(() => flattenRoutes(routeCatalog.value).length)

const formatPermissionLabel = (permissionName: string) => getPermissionDisplayName(permissionName)
const formatRouteTitle = (route: IMenubarList) => getProductRouteTitle(route.name, route.meta?.title || route.name)

function flattenRoutes(routes: IMenubarList[]) {
    const result: IMenubarList[] = []
    const walk = (list: IMenubarList[]) => {
        list.forEach((route) => {
            result.push(route)
            if (route.children?.length) {
                walk(route.children)
            }
        })
    }
    walk(routes)
    return result
}

function buildDisplayPath(route: IMenubarList) {
    return route.path || '/'
}

function resetRouteForm() {
    routeForm.title = ''
    routeForm.path = ''
    routeForm.name = ''
    routeForm.component = ''
    routeForm.icon = ''
    routeForm.sort = 99
}

async function loadRouteCatalog() {
    if (layoutStore.getUserInfo.isPlatformSuperAdmin) {
        const routeResponse = await getAllRoute()
        routeCatalog.value = routeResponse.data.data || []
    } else {
        routeCatalog.value = layoutStore.getMenubar.menuList || []
    }
    if (!selectedRoute.value && routeCatalog.value.length) {
        selectedRoute.value = flattenRoutes(routeCatalog.value)[0]
    }
}

async function loadData() {
    if (layoutStore.getUserInfo.isPlatformSuperAdmin) {
        const permissionResponse = await getPermissionList()
        permissionList.value = permissionResponse.data.data || []
    } else {
        permissionList.value = []
    }
    await loadRouteCatalog()
}

function handleRouteClick(route: IMenubarList) {
    selectedRoute.value = route
}

function openCreateDialog() {
    resetRouteForm()
    createDialogVisible.value = true
}

function openEditDialog() {
    if (!selectedRoute.value) {
        return
    }
    routeForm.title = selectedRoute.value.meta?.title || ''
    routeForm.path = selectedRoute.value.path || ''
    routeForm.name = selectedRoute.value.name || ''
    routeForm.component = String(selectedRoute.value.component || '')
    routeForm.icon = selectedRoute.value.meta?.icon || ''
    routeForm.sort = Number((selectedRoute.value as any).sort || 99)
    editDialogVisible.value = true
}

async function submitCreate() {
    if (!createFormRef.value) {
        return
    }
    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }
    saving.value = true
    try {
        const response = await createRoute({ ...routeForm })
        ElMessage.success(response.data.message || '功能入口创建成功')
        createDialogVisible.value = false
        routeCatalog.value = response.data.data.tree || []
        selectedRoute.value = response.data.data.route
        resetRouteForm()
    } finally {
        saving.value = false
    }
}

async function submitEdit() {
    if (!editFormRef.value || !selectedRoute.value?.id) {
        return
    }
    const valid = await editFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }
    saving.value = true
    try {
        const response = await updateRoute(Number(selectedRoute.value.id), { ...routeForm })
        ElMessage.success(response.data.message || '功能入口更新成功')
        editDialogVisible.value = false
        routeCatalog.value = response.data.data.tree || []
        selectedRoute.value = response.data.data.route
    } finally {
        saving.value = false
    }
}

async function handleDelete() {
    if (!selectedRoute.value?.id) {
        return
    }
    await ElMessageBox.confirm(
        `删除后，${formatRouteTitle(selectedRoute.value)} 这个功能入口将不再显示，是否继续？`,
        '删除功能入口',
        {
            type: 'warning',
            confirmButtonText: '确认删除',
            cancelButtonText: '取消'
        }
    )
    const response = await deleteRoute(Number(selectedRoute.value.id))
    ElMessage.success(response.data.message || '功能入口已删除')
    routeCatalog.value = response.data.data.tree || []
    selectedRoute.value = flattenRoutes(routeCatalog.value)[0]
}

onMounted(loadData)
</script>

<style lang='postcss' scoped>
.workspace-page {
    display: grid;
    gap: 18px;
}

.workspace-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.82fr);
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

.workspace-tree {
    min-height: 480px;
}

.menu-node {
    display: grid;
    gap: 4px;
    padding: 8px 0;
}

.menu-node__title {
    color: #17233b;
    font-weight: 600;
}

.menu-node__path {
    color: #7c8aa2;
    font-size: 12px;
}

:deep(.workspace-tree .el-tree-node__content) {
    height: auto;
    min-height: 38px;
    padding: 6px 0;
    align-items: flex-start;
}

:deep(.workspace-tree .el-tree-node__expand-icon) {
    margin-top: 8px;
}

:deep(.workspace-tree .el-tree-node__children) {
    overflow: visible;
}

.route-detail {
    display: grid;
    gap: 16px;
}

.route-detail__head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
}

.route-detail__head strong {
    display: block;
    color: #132039;
    font-size: 18px;
}

.route-detail__head span {
    display: block;
    margin-top: 6px;
    color: #6c7991;
    font-size: 12px;
}

.route-detail__actions {
    display: flex;
    gap: 12px;
}

.permission-dictionary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.permission-chip {
    border-radius: 999px;
    background: rgba(238, 244, 255, 0.75);
    border-color: rgba(73, 123, 255, 0.16);
    color: #2450a7;
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
    .workspace-grid {
        grid-template-columns: 1fr;
    }
}
</style>
