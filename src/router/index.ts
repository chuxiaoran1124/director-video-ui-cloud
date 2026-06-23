import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { IMenubarList } from '/@/type/store/layout'
import { components } from '/@/router/asyncRouter'

export const allowRouter: Array<IMenubarList> = [
    {
        name: 'Root',
        path: '/',
        component: 'LayoutBlank',
        meta: {
            title: '首页跳转',
            icon: '',
            hidden: true
        }
    },
    {
        name: 'Login',
        path: '/login',
        component: 'Login',
        meta: {
            title: '登录',
            icon: '',
            hidden: true
        }
    },
    {
        name: 'TemporaryAccessEntry',
        path: '/link-entry',
        component: 'TemporaryAccessEntry',
        meta: {
            title: '临时访问入口',
            icon: '',
            hidden: true
        }
    },
    {
        name: 'RedirectPage',
        path: '/redirect',
        component: 'Layout',
        meta: {
            title: '重定向',
            icon: '',
            hidden: true
        },
        children: [
            {
                name: 'Redirect',
                path: '/redirect/:pathMatch(.*)*',
                component: 'Redirect',
                meta: {
                    title: '重定向',
                    icon: '',
                    hidden: true
                }
            }
        ]
    },
    {
        name: 'ErrorPage',
        path: '/error',
        component: 'LayoutBlank',
        meta: {
            title: '错误页',
            icon: '',
            hidden: true
        },
        children: [
            {
                name: '401',
                path: '401',
                component: '401',
                meta: {
                    title: '无权限',
                    icon: '',
                    hidden: true
                }
            },
            {
                name: '404',
                path: '404',
                component: '404',
                meta: {
                    title: '页面不存在',
                    icon: '',
                    hidden: true
                }
            }
        ]
    }
]

const staticRoutes = allowRouter.map((route) => ({
    ...route,
    component: typeof route.component === 'string' ? components[route.component] : route.component,
    children: route.children?.map((child) => ({
        ...child,
        component: typeof child.component === 'string' ? components[child.component] : child.component
    }))
})) as RouteRecordRaw[]

const router = createRouter({
    history: createWebHashHistory(),
    routes: staticRoutes
})

export default router
