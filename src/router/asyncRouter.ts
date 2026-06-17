import { IMenubarList } from '/@/type/store/layout'
import { routeTitleMap } from '/@/utils/productLabels'

const modules = import.meta.glob('../views/**/**.vue')

const orphanRouteParentMap: Record<string, { name: string; path: string; title: string; icon: string }> = {
    'menu-management': { name: 'permission', path: '/permission', title: '账号与功能', icon: 'lock' },
    'role-permission-management': { name: 'permission', path: '/permission', title: '账号与功能', icon: 'lock' },
    'user-management': { name: 'permission', path: '/permission', title: '账号与功能', icon: 'lock' },
    'tenant-management': { name: 'permission', path: '/permission', title: '账号与功能', icon: 'lock' },
    'tenant-route-management': { name: 'permission', path: '/permission', title: '账号与功能', icon: 'lock' },
    'material-management': { name: 'prior-disposal', path: '/prior-disposal', title: '素材管理', icon: 'operation' },
    'document-management': { name: 'prior-disposal', path: '/prior-disposal', title: '素材管理', icon: 'operation' },
    'fast-task': { name: 'generate-materials', path: '/generate-materials', title: '内容生成', icon: 'video-camera' },
    'video-task': { name: 'generate-materials', path: '/generate-materials', title: '内容生成', icon: 'video-camera' }
}

const components: IObject<() => Promise<typeof import('*.vue')>> = {
    Layout: (() => import('/@/layout/index.vue')) as unknown as () => Promise<typeof import('*.vue')>,
    Redirect: (() => import('/@/layout/redirect.vue')) as unknown as () => Promise<typeof import('*.vue')>,
    LayoutBlank: (() => import('/@/layout/blank.vue')) as unknown as () => Promise<typeof import('*.vue')>
}

Object.keys(modules).forEach((key) => {
    const match = key.match(/^\.\.\/views\/(.+)\.vue$/)
    if (!match) {
        return
    }

    if (match[1].includes('_Components')) {
        return
    }

    const rawPath = match[1]
    const normalizedPath = rawPath.replace(/\/index$/i, '')
    const pathSegments = normalizedPath.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    const importer = modules[key] as () => Promise<typeof import('*.vue')>

    components[rawPath] = importer
    components[normalizedPath] = importer
    components[`/${rawPath}`] = importer
    components[`/${normalizedPath}`] = importer
    components[lastSegment] = importer
})

function resolveComponent(componentName: string) {
    const normalized = componentName.replace(/\.vue$/i, '').replace(/^\//, '')
    const lastSegment = normalized.split('/').pop() || normalized
    return (
        components[componentName] ||
        components[normalized] ||
        components[`/${normalized}`] ||
        components[lastSegment]
    )
}

function normalizeDashboardRoute(route: IMenubarList): IMenubarList {
    if (
        route.name === 'dashboard' &&
        route.component === 'Layout' &&
        (!route.children || route.children.length === 0)
    ) {
        return {
            ...route,
            redirect: '/dashboard/workplace',
            children: [
                {
                    id: `${route.id || 'dashboard'}-workplace`,
                    parentId: route.id,
                    name: 'Workplace',
                    path: 'workplace',
                    component: 'Dashboard/Workplace',
                    meta: {
                        title: '工作台',
                        icon: route.meta.icon,
                        permission: route.meta.permission || []
                    }
                }
            ]
        }
    }
    return route
}

function rebuildOrphanRoutes(routes: IMenubarList[]): IMenubarList[] {
    const rebuiltRoutes: IMenubarList[] = []
    const parentRouteMap = new Map<string, IMenubarList>()

    const rememberParent = (route: IMenubarList) => {
        if (!route.name) {
            return
        }
        parentRouteMap.set(route.name, route)
    }

    routes.forEach((route) => {
        const fallbackParent = route.name ? orphanRouteParentMap[route.name] : undefined
        const isRelativeOrphanRoute = Boolean(
            fallbackParent &&
            route.path &&
            !route.path.startsWith('/') &&
            (!route.children || route.children.length === 0)
        )

        if (!isRelativeOrphanRoute) {
            const nextRoute = {
                ...route,
                children: route.children ? [...route.children] : route.children
            }
            rebuiltRoutes.push(nextRoute)
            rememberParent(nextRoute)
            return
        }
        if (!fallbackParent) {
            return
        }

        let parentRoute = parentRouteMap.get(fallbackParent.name)
        if (!parentRoute) {
            parentRoute = {
                id: `synthetic-${fallbackParent.name}`,
                parentId: 0,
                name: fallbackParent.name,
                path: fallbackParent.path,
                component: 'Layout',
                meta: {
                    title: fallbackParent.title,
                    icon: fallbackParent.icon,
                    permission: []
                },
                children: []
            }
            rebuiltRoutes.push(parentRoute)
            rememberParent(parentRoute)
        }

        parentRoute.children = parentRoute.children || []
        parentRoute.children.push({
            ...route,
            meta: {
                ...route.meta,
                activeMenu: fallbackParent.path
            }
        })
    })

    return rebuiltRoutes
}

function normalizeRoutes(routes: IMenubarList[]): IMenubarList[] {
    return routes.map((route) => {
        const normalizedRoute = normalizeDashboardRoute({
            ...route,
            meta: {
                icon: route.meta?.icon || '',
                title: routeTitleMap[route.name] || route.meta?.title || route.name,
                permission: route.meta?.permission || [],
                activeMenu: route.meta?.activeMenu,
                noCache: route.meta?.noCache,
                hidden: route.meta?.hidden,
                alwaysShow: route.meta?.alwaysShow,
                routeScope: route.meta?.routeScope
            }
        })

        if (
            normalizedRoute.component === 'Layout' &&
            (!normalizedRoute.children || normalizedRoute.children.length === 0) &&
            normalizedRoute.name !== 'dashboard'
        ) {
            return null
        }

        const nextRoute: IMenubarList = {
            ...normalizedRoute,
            component:
                typeof normalizedRoute.component === 'string'
                    ? (resolveComponent(normalizedRoute.component) || components.LayoutBlank)
                    : normalizedRoute.component
        }

        if (normalizedRoute.children && normalizedRoute.children.length > 0) {
            nextRoute.children = normalizeRoutes(normalizedRoute.children)
        }

        return nextRoute
    }).filter((route): route is IMenubarList => Boolean(route))
}

const generatorDynamicRouter = (data: IMenubarList[]): IMenubarList[] => {
    return normalizeRoutes(rebuildOrphanRoutes(data))
}

export {
    components,
    generatorDynamicRouter
}
