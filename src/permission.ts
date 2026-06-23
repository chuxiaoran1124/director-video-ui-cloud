import router from '/@/router'
import { configure, done, start } from 'nprogress'
import { encode } from '/@/utils/tools'
import { useLayoutStore } from '/@/store/modules/layout'

configure({ showSpinner: false })

const loginRoutePath = '/login'
const defaultRoutePath = '/'
const whiteList = new Set([loginRoutePath, '/link-entry', '/error/401', '/error/404'])

router.beforeEach(async(to, from) => {
    start()
    const layoutStore = useLayoutStore()
    const { getStatus, getMenubar, changeTagNavList, addCachedViews, getTags, changeNocacheViewStatus } = layoutStore

    const appTitle = import.meta.env.VITE_APP_TITLE || '内容支持工具'
    document.title = to.meta.title ? `${to.meta.title} | ${appTitle}` : appTitle

    if (to.path.toLowerCase() === loginRoutePath) {
        if (getStatus.ACCESS_TOKEN) {
            done()
            return layoutStore.getDefaultLandingPath()
        }
        done()
        return true
    }

    if (!getStatus.ACCESS_TOKEN && !sessionStorage.getItem('accessToken')) {
        if (whiteList.has(to.path)) {
            done()
            return true
        }
        done()
        return `${loginRoutePath}?from=${encode(to.fullPath || defaultRoutePath)}`
    }

    const hadRoutesBeforeBootstrap = getStatus.isRoutesLoaded && getMenubar.menuList.length > 0

    try {
        await layoutStore.bootstrapSession()
    } catch (error) {
        layoutStore.clearAuthState()
        done()
        return `${loginRoutePath}?from=${encode(to.fullPath || defaultRoutePath)}`
    }

    const hasRoutesAfterBootstrap = layoutStore.getStatus.isRoutesLoaded && layoutStore.getMenubar.menuList.length > 0

    if (!hadRoutesBeforeBootstrap && hasRoutesAfterBootstrap) {
        const hydratedTarget = router.resolve(to.fullPath)
        if (hydratedTarget.matched.length > 0) {
            return {
                path: hydratedTarget.fullPath,
                replace: true
            }
        }
        return layoutStore.getDefaultLandingPath()
    }

    if (to.path === '/') {
        return layoutStore.getDefaultLandingPath()
    }

    const resolvedTarget = router.resolve(to.fullPath)
    if (!whiteList.has(to.path) && to.matched.length === 0 && resolvedTarget.matched.length > 0) {
        return {
            path: resolvedTarget.fullPath,
            replace: true
        }
    }

    if (!whiteList.has(to.path) && to.matched.length === 0) {
        done()
        return '/error/404'
    }

    changeTagNavList(to)

    if (
        !/^\/redirect\//.test(from.path) &&
        getTags.tagsList.some((item) => item.name === from.name) &&
        !getTags.cachedViews.some((item) => item === from.name) &&
        !getTags.isNocacheView
    ) {
        addCachedViews({ name: from.name as string, noCache: Boolean(from.meta.noCache) })
    }
    changeNocacheViewStatus(false)
    return true
})

router.afterEach(() => {
    done()
})
