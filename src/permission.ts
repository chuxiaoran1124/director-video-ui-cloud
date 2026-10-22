import router from '/@/router'
import { configure, done, start } from 'nprogress'
import { encode } from '/@/utils/tools'
import { useLayoutStore } from '/@/store/modules/layout'

configure({ showSpinner: false })

const loginRoutePath = '/login'
const defaultRoutePath = '/'
const whiteList = new Set([loginRoutePath, '/platform-login-entry', '/link-entry', '/error/401', '/error/404'])
const authorizationEntryPaths = new Set(['/platform-login-entry', '/link-entry'])

router.beforeEach(async(to, from) => {
    start()
    const layoutStore = useLayoutStore()
    const { getStatus, getMenubar, changeTagNavList, addCachedViews, getTags, changeNocacheViewStatus } = layoutStore

    const appTitle = import.meta.env.VITE_APP_TITLE || '内容支持工具'
    document.title = to.meta.title ? `${to.meta.title} | ${appTitle}` : appTitle

    // Entry pages exchange their own credentials. A stale session must not
    // redirect away before that exchange; the backend still validates the link.
    if (authorizationEntryPaths.has(to.path)) {
        done()
        return true
    }

    if (to.path.toLowerCase() === loginRoutePath) {
        // Both the initial grant URL and its normalized URL use entry=link or
        // entry=platform. Leave grant validation to Login.vue instead of
        // restoring an unrelated/expired cookie session over this login flow.
        if (to.query.entry === 'link' || to.query.entry === 'platform') {
            done()
            return true
        }
        try {
            await layoutStore.bootstrapSession()
            if (layoutStore.getStatus.ACCESS_TOKEN) {
                done()
                return layoutStore.getDefaultLandingPath()
            }
        } catch { layoutStore.clearAuthState() }
        done()
        return true
    }

    if (whiteList.has(to.path) && !getStatus.ACCESS_TOKEN && !sessionStorage.getItem('accessToken')) {
        done()
        return true
    }

    const hadRoutesBeforeBootstrap = getStatus.isRoutesLoaded && getMenubar.menuList.length > 0

    try {
        await layoutStore.bootstrapSession()
    } catch (error) {
        layoutStore.clearAuthState()
        done()
        return `${loginRoutePath}?from=${encode(to.fullPath || defaultRoutePath)}`
    }

    if (!layoutStore.getStatus.ACCESS_TOKEN) {
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
