<template>
    <div v-if='getSetting.mode === "vertical" || getMenubar.isPhone' class='flex items-center px-4 flex-wrap h-12 leading-12'>
        <el-icon class='text-2xl cursor-pointer h-12 leading-12' @click='changeCollapsed'>
            <el-icon-expand v-if='getMenubar.status' />
            <el-icon-fold v-else />
        </el-icon>
        <!-- 面包屑导航 -->
        <div class='px-4'>
            <el-breadcrumb separator='/'>
                <transition-group name='breadcrumb'>
                    <el-breadcrumb-item key='/' :to='{ path: "/" }'>主页</el-breadcrumb-item>
                    <el-breadcrumb-item v-for='v in data.breadcrumbList' :key='v.path' :to='v.path'>{{ v.title }}</el-breadcrumb-item>
                </transition-group>
            </el-breadcrumb>
        </div>
    </div>
    <div v-else class='flex items-center px-4 flex-wrap h-12 flex-1'>
        <div class='layout-sidebar-logo flex relative shadow-lg w-40 leading-12 items-center'>
            <img class='w-6 h-8' :src='icon'>
            <span v-if='getMenubar.status === 0 || getMenubar.status === 2' class='pl-2'>内容生成工具</span>
        </div>
        <div class='layout-sidebar-menubar flex flex-1 overflow-hidden'>
            <layout-menubar />
        </div>
    </div>
    <div class='flex items-center flex-row-reverse px-4 min-width-32'>
        <!-- 用户下拉 -->
        <el-dropdown>
            <span class='el-dropdown-link flex flex-center px-2'>
                <el-avatar :size='30' src='https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' />
                <span class='ml-2'>{{ accountDisplayName }}</span>
                <el-icon><el-icon-arrow-down /></el-icon>
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item v-if="false">
                        <el-link href='https://github.com/hsiangleev' target='_blank' :underline='false'>个人中心</el-link>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="false">
                        <el-link href='https://github.com/hsiangleev/element-plus-admin' target='_blank' :underline='false'>项目地址</el-link>
                    </el-dropdown-item>
                    <el-dropdown-item @click='openPasswordDialog'>修改密码</el-dropdown-item>
                    <el-dropdown-item  @click='logout'>退出登录</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <el-dropdown v-if='tenantList.length > 1' class='mr-4' @command='handleTenantSwitch'>
            <span class='el-dropdown-link flex flex-center px-2'>
                <el-tag effect='plain' type='success'>{{ currentTenant?.tenantName || '当前团队未设置' }}</el-tag>
                <el-icon class='ml-2'><el-icon-arrow-down /></el-icon>
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item
                        v-for='tenant in tenantList'
                        :key='tenant.id'
                        :command='tenant.id'
                        :disabled='tenant.id === currentTenant?.id'
                    >
                        {{ tenant.tenantName }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
        
        <Notice />
        <Screenfull />
        <Search />
    </div>

    <el-dialog v-model='passwordDialogVisible' title='修改密码' width='460px' destroy-on-close>
        <el-form ref='passwordFormRef' :model='passwordForm' :rules='passwordRules' label-position='top' autocomplete='off'>
            <el-form-item label='原密码' prop='oldPassword'>
                <el-input
                    v-model='passwordForm.oldPassword'
                    placeholder='请输入当前登录密码'
                    show-password
                    autocomplete='new-password'
                />
            </el-form-item>
            <el-form-item label='新密码' prop='newPassword'>
                <el-input
                    v-model='passwordForm.newPassword'
                    placeholder='请输入新的登录密码'
                    show-password
                    autocomplete='new-password'
                />
            </el-form-item>
            <el-form-item label='确认新密码' prop='confirmPassword'>
                <el-input
                    v-model='passwordForm.confirmPassword'
                    placeholder='请再次输入新的登录密码'
                    show-password
                    autocomplete='new-password'
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click='passwordDialogVisible = false'>取消</el-button>
            <el-button type='primary' :loading='passwordSubmitting' @click='submitPasswordChange'>确认修改</el-button>
        </template>
    </el-dialog>
</template>

<script lang='ts'>
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLayoutStore } from '/@/store/modules/layout'
import { useRoute, RouteLocationNormalizedLoaded } from 'vue-router'
import Notice from '/@/layout/components/notice.vue'
import Screenfull from '/@/layout/components/screenfull.vue'
import Search from '/@/layout/components/search.vue'
import LayoutMenubar from '/@/layout/components/menubar.vue'
import icon from '/@/assets/img/icon.png'
import { changePassword } from '/@/api/user'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getRoleDisplayName } from '/@/utils/productLabels'


interface IBreadcrumbList {
    path: string
    title: string | symbol
}
// 面包屑导航
const breadcrumb = (route: RouteLocationNormalizedLoaded) => {
    const fn = () => {
        const breadcrumbList:Array<IBreadcrumbList> = []
        const notShowBreadcrumbList = ['Dashboard', 'RedirectPage'] // 不显示面包屑的导航
        if(route.matched[0] && (notShowBreadcrumbList.includes(route.matched[0].name as string))) return breadcrumbList
        route.matched.forEach(v => {
            const obj:IBreadcrumbList = {
                title: v.meta.title as string,
                path: v.path
            }
            breadcrumbList.push(obj)
        })
        return breadcrumbList
    }
    let data = reactive({
        breadcrumbList: fn()
    })
    watch(() => route.path, () => data.breadcrumbList = fn())
    return { data }
}

export default defineComponent ({
    name: 'LayoutNavbar',
    components: {
        Notice,
        Search,
        Screenfull,
        LayoutMenubar
    },
    setup() {
        const layoutStore = useLayoutStore()
        const { getMenubar, getUserInfo, getSetting, getCurrentTenant, getTenantList } = storeToRefs(layoutStore)
        const { changeCollapsed, logout } = layoutStore
        const route = useRoute()
        const passwordDialogVisible = ref(false)
        const passwordSubmitting = ref(false)
        const accountDisplayName = computed(() => {
            if (getUserInfo.value.isPlatformSuperAdmin) {
                return '平台管理员'
            }
            const roleName = getUserInfo.value.tenantRoleNames?.[0]
            return roleName ? getRoleDisplayName(roleName) : '成员'
        })
        const passwordFormRef = ref<FormInstance>()
        const passwordForm = reactive({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        })
        const passwordRules = reactive<FormRules>({
            oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
            newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
            confirmPassword: [
                { required: true, message: '请再次输入新密码', trigger: 'blur' },
                {
                    validator: (_rule, value, callback) => {
                        if (!value) {
                            callback(new Error('请再次输入新密码'))
                            return
                        }
                        if (value !== passwordForm.newPassword) {
                            callback(new Error('两次输入的新密码不一致'))
                            return
                        }
                        callback()
                    },
                    trigger: 'blur'
                }
            ]
        })

        const resetPasswordForm = () => {
            passwordForm.oldPassword = ''
            passwordForm.newPassword = ''
            passwordForm.confirmPassword = ''
            passwordFormRef.value?.clearValidate()
        }

        const openPasswordDialog = () => {
            resetPasswordForm()
            passwordDialogVisible.value = true
        }

        const submitPasswordChange = async() => {
            if (!passwordFormRef.value) {
                return
            }
            const valid = await passwordFormRef.value.validate().catch(() => false)
            if (!valid) {
                return
            }

            passwordSubmitting.value = true
            try {
                await changePassword({
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword
                })
                ElMessage.success('密码修改成功')
                passwordDialogVisible.value = false
                resetPasswordForm()
            } finally {
                passwordSubmitting.value = false
            }
        }

        const handleTenantSwitch = async(tenantId: number) => {
            if (tenantId === getCurrentTenant.value?.id) {
                return
            }
            await ElMessageBox.confirm(
                '切换团队后，当前工作入口和可查看内容会按新团队重新刷新，是否继续？',
                '切换团队',
                {
                    type: 'warning',
                    confirmButtonText: '继续切换',
                    cancelButtonText: '取消'
                }
            )
            await layoutStore.switchCurrentTenant(tenantId)
        }

        return {
            getMenubar,
            userInfo: getUserInfo,
            accountDisplayName,
            changeCollapsed,
            logout,
            ...breadcrumb(route),
            getSetting,
            icon,
            currentTenant: getCurrentTenant,
            tenantList: getTenantList,
            handleTenantSwitch,
            openPasswordDialog,
            passwordDialogVisible,
            passwordSubmitting,
            passwordFormRef,
            passwordForm,
            passwordRules,
            submitPasswordChange
        }
    }
})
</script>

<style lang='postcss' scoped>
.breadcrumb-enter-active,
.breadcrumb-leave-active {
    transition: all 0.5s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-active {
    opacity: 0;
    transform: translateX(20px);
}

.breadcrumb-move {
    transition: all 0.5s;
}

.breadcrumb-leave-active {
    position: absolute;
}
</style>
