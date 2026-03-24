import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { IMenubarList } from '/@/type/store/layout'
import { components } from '/@/router/asyncRouter'

const Components:IObject<() => Promise<typeof import('*.vue')>> = Object.assign({}, components, {
    Layout: (() => import('/@/layout/index.vue')) as unknown as () => Promise<typeof import('*.vue')>,
    Redirect: (() => import('/@/layout/redirect.vue')) as unknown as () => Promise<typeof import('*.vue')>,
    LayoutBlank: (() => import('/@/layout/blank.vue')) as unknown as () => Promise<typeof import('*.vue')>
})

// 静态路由页面
export const allowRouter:Array<IMenubarList> = [
    {
        name: 'Dashboard',
        path: '/',
        component: Components['Layout'],
        redirect: '/Dashboard/Workplace',
        meta: { title: '仪表盘', icon: 'el-icon-eleme' },
        children: [
            {
                name: 'Workplace',
                path: '/Dashboard/Workplace',
                component: Components['Workplace'],
                meta: { title: '工作台', icon: 'el-icon-tools' }
            }
            // {
            //     name: 'Welcome',
            //     path: '/Dashboard/Welcome',
            //     component: Components['Welcome'],
            //     meta: { title: '欢迎页', icon: 'el-icon-tools' }
            // }
        ]
    },
    {
        name: 'ErrorPage',
        path: '/ErrorPage',
        meta: { title: '错误页面', icon: 'el-icon-eleme' },
        component: Components.Layout,
        redirect: '/ErrorPage/404',
        children: [
            {
                name: '401',
                path: '/ErrorPage/401',
                component: Components['401'],
                meta: { title: '401', icon: 'el-icon-tools' }
            },
            {
                name: '404',
                path: '/ErrorPage/404',
                component: Components['404'],
                meta: { title: '404', icon: 'el-icon-tools' }
            }
        ]
    },
    {
        name: 'Permission',
        path: '/Permission',
        component: Components.Layout,
        meta: { title: '权限管理', icon: 'el-icon-phone' },
        redirect: '/Permission/UserManagement',
        children: [
            {
                name: 'UserManagement',
                path: '/Permission/UserManagement',
                component: Components['UserManagement'] || (() => import('/@/views/Permission/UserManagement.vue')),
                meta: { title: '用户管理', icon: 'el-icon-user' }
            }
            ,
            {
                name: 'RouteManagement',
                path: '/Permission/RouteManagement',
                component: Components['RouteManagement'] || (() => import('/@/views/Permission/RouteManagement.vue')),
                meta: { title: '路由管理', icon: 'el-icon-s-operation' }
            },
            {
                name: 'RoleManagement',
                path: '/Permission/RoleManagement',
                component: Components['RoleManagement'] || (() => import('/@/views/Permission/RoleManagement.vue')),
                meta: { title: '角色权限管理', icon: 'el-icon-s-check' }
            },
            {
                name: 'GroupManagement',
                path: '/Permission/GroupManagement',
                component: Components['GroupManagement'] || (() => import('/@/views/Permission/GroupManagement.vue')),
                meta: { title: '分组管理', icon: 'el-icon-user-solid' }
            }
        ]
    },
    {
        name: 'RedirectPage',
        path: '/redirect',
        component: Components['Layout'],
        meta: { title: '重定向页面', icon: 'el-icon-eleme', hidden: true },
        children: [
            {
                name: 'Redirect',
                path: '/redirect/:pathMatch(.*)*',
                meta: {
                    title: '重定向页面',
                    icon: ''
                },
                component: Components.Redirect
            }
        ]
    },
    {
        name: 'Login',
        path: '/Login',
        component: Components['Login'] || (() => import('/@/views/User/Login.vue')),
        meta: { title: '登录', icon: 'el-icon-eleme', hidden: true }
    },

]

const router = createRouter({
    history: createWebHashHistory(), // createWebHistory
    routes: allowRouter as RouteRecordRaw[]
})

export default router