<template>
    <div class='workspace-page'>
        <WorkspaceHero
            eyebrow='开放策略'
            title='团队开放策略'
            description='按团队查看当前开放的工作入口。平台管理员可以切换不同团队巡检，团队管理员则只会维护自己负责空间的可用范围。'
        >
            <template #actions>
                <el-button class='workspace-ghost-btn' @click='loadRoleList'>刷新策略</el-button>
            </template>
            <template #metrics>
                <div class='metric-card'>
                    <span>当前团队</span>
                    <strong>{{ currentTenantName }}</strong>
                    <small>团队切换后会同步刷新身份与策略</small>
                </div>
                <div class='metric-card'>
                    <span>身份数量</span>
                    <strong>{{ roleList.length }}</strong>
                    <small>用于配置当前团队内不同岗位的开放范围</small>
                </div>
                <div class='metric-card'>
                    <span>当前重点</span>
                    <strong>{{ currentRoleDisplayName }}</strong>
                    <small>保存时会写回当前选中身份的策略配置</small>
                </div>
            </template>
        </WorkspaceHero>

        <el-card shadow='never' class='workspace-panel workspace-panel--toolbar'>
            <div class='toolbar'>
                <div class='toolbar__group'>
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
                        type='success'
                        :closable='false'
                        show-icon
                        :title='`当前正在检查：${currentTenantName}`'
                    />
                </div>
                <div class='toolbar__summary'>
                    <span>建议先选身份，再勾选这个身份可见的工作页面。</span>
                </div>
            </div>
        </el-card>

        <RoleRoutePermissionEditor
            :tenant-id='selectedTenantId'
            :role-list='roleList'
            :show-action-permissions='false'
            @role-change='handleRoleChange'
        />
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, ref } from 'vue'
import { getRoleList, IUserRoleItem } from '/@/api/user'
import { getTenantList, ITenantListItem } from '/@/api/tenant'
import { useLayoutStore } from '/@/store/modules/layout'
import { getRoleDisplayName } from '/@/utils/productLabels'
import RoleRoutePermissionEditor from '/@/views/User/components/RoleRoutePermissionEditor.vue'
import WorkspaceHero from '/@/views/User/components/WorkspaceHero.vue'

const layoutStore = useLayoutStore()
const tenantList = ref<ITenantListItem[]>([])
const roleList = ref<IUserRoleItem[]>([])
const selectedTenantId = ref<number | undefined>(layoutStore.getCurrentTenant?.id)
const currentRole = ref<IUserRoleItem>()

const currentTenantName = computed(() => {
    return tenantList.value.find((item) => item.id === selectedTenantId.value)?.tenantName || layoutStore.getCurrentTenant?.tenantName || '未选择团队'
})

const currentRoleDisplayName = computed(() => {
    return currentRole.value ? getRoleDisplayName(currentRole.value.roleName) : '未选择身份'
})

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
    currentRole.value = roleList.value[0]
}

const handleRoleChange = (role?: IUserRoleItem) => {
    currentRole.value = role
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
    gap: 16px;
    flex-wrap: wrap;
}

.toolbar__group {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.toolbar__tenant {
    min-width: 260px;
}

.toolbar__summary {
    color: #6c7991;
    font-size: 13px;
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
    line-height: 1.6;
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
    .toolbar,
    .toolbar__group {
        align-items: stretch;
    }

    .toolbar__tenant {
        width: 100%;
        min-width: 0;
    }
}
</style>
