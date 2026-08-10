import { defineStore } from 'pinia'
import {
    getCurrentTenant,
    getRouterList,
    getUser,
    ILoginParam,
    login,
    logout as logoutRequest,
    refreshToken,
    switchTenant
} from '/@/api/layout/index'
import { getTenantList as fetchTenantList } from '/@/api/tenant'
import {
    ILayout,
    IMenubar,
    IMenubarList,
    IMenubarStatus,
    ISetting,
    IStatus,
    ITags,
    ITagsList,
    ITenantSummary,
    IUserInfo
} from '/@/type/store/layout'
import router from '/@/router/index'
import { generatorDynamicRouter } from '/@/router/asyncRouter'
import { decode, deleteCookie, setCookie } from '/@/utils/tools'
import { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

const setting = JSON.parse(localStorage.getItem('setting') || '{}')

function buildDefaultPermissionFlags() {
    return {
        canManageUsers: false,
        canManageRoles: false,
        canManageRolePermissions: false,
        canManageTenantRoutes: false
    }
}

function buildDefaultUserInfo(): IUserInfo {
    return {
        userId: '',
        username: '',
        email: '',
        name: '',
        phone: '',
        status: 'inactive',
        role: 'user',
        photoUrl: '',
        tenantId: undefined,
        tenantCode: '',
        tenantRoleIds: [],
        tenantRoleCodes: [],
        tenantRoleNames: [],
        tenantRoleProfiles: [],
        globalRoleCodes: [],
        globalRoleNames: [],
        permissionFlags: buildDefaultPermissionFlags(),
        dataScope: 'self',
        isPlatformSuperAdmin: false
    }
}

function normalizeTenantSummaryList(tenantList: Array<any> = []): ITenantSummary[] {
    return tenantList.map((item) => ({
        id: Number(item.id),
        tenantCode: item.tenantCode,
        tenantName: item.tenantName,
        tenantShortName: item.tenantShortName ?? '',
        status: item.status,
        deployMode: item.deployMode
    }))
}

function buildJoinedRoutePath(parentPath: string, routePath: string): string {
    if (!routePath) {
        return parentPath || '/'
    }

    if (routePath.startsWith('/')) {
        return routePath
    }

    const normalizedParent = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
    return `${normalizedParent || ''}/${routePath}`.replace(/\/{2,}/g, '/')
}

function collectLeafRoutePaths(routeList: Array<IMenubarList>, parentPath = ''): string[] {
    const result: string[] = []

    routeList.forEach((route) => {
        if (route.meta?.hidden) {
            return
        }

        const currentPath = buildJoinedRoutePath(parentPath, route.path)
        if (route.children?.length) {
            result.push(...collectLeafRoutePaths(route.children, currentPath))
            return
        }

        if (!parentPath) {
            return
        }

        result.push(currentPath)
    })

    return result
}

function canRouteAccessByPath(routeList: Array<IMenubarList>, targetPath: string, parentPath = ''): boolean {
    return routeList.some((route) => {
        if (route.meta?.hidden) {
            return false
        }

        const currentPath = buildJoinedRoutePath(parentPath, route.path)
        if (currentPath === targetPath) {
            return true
        }

        if (route.children?.length) {
            return canRouteAccessByPath(route.children, targetPath, currentPath)
        }

        return false
    })
}

export const useLayoutStore = defineStore({
    id: 'layout',
    state: (): ILayout => ({
        menubar: {
            status: document.body.offsetWidth < 768 ? IMenubarStatus.PHN : IMenubarStatus.PCE,
            menuList: [],
            isPhone: document.body.offsetWidth < 768
        },
        userInfo: buildDefaultUserInfo(),
        tags: {
            tagsList: [],
            cachedViews: [],
            isNocacheView: false
        },
        setting: {
            theme: setting.theme !== undefined ? setting.theme : 0,
            showTags: setting.showTags !== undefined ? setting.showTags : true,
            color: {
                primary: setting.color !== undefined ? setting.color.primary : '#0f766e'
            },
            usePinyinSearch: setting.usePinyinSearch !== undefined ? setting.usePinyinSearch : false,
            mode: setting.mode || 'vertical'
        },
        status: {
            isLoading: false,
            ACCESS_TOKEN: sessionStorage.getItem(ACCESS_TOKEN_KEY) || '',
            REFRESH_TOKEN: sessionStorage.getItem(REFRESH_TOKEN_KEY) || '',
            isUserLoaded: false,
            isRoutesLoaded: false,
            isLoggingOut: false
        },
        currentTenant: null,
        tenantList: [],
        dynamicRouteNames: []
    }),
    getters: {
        getMenubar(): IMenubar {
            return this.menubar
        },
        getUserInfo(): IUserInfo {
            return this.userInfo
        },
        getTags(): ITags {
            return this.tags
        },
        getSetting(): ISetting {
            return this.setting
        },
        getStatus(): IStatus {
            return this.status
        },
        getCurrentTenant(): ITenantSummary | null {
            return this.currentTenant
        },
        getTenantList(): ITenantSummary[] {
            return this.tenantList
        }
    },
    actions: {
        changeCollapsed(): void {
            this.menubar.status = this.menubar.isPhone
                ? this.menubar.status === IMenubarStatus.PHN
                    ? IMenubarStatus.PHE
                    : IMenubarStatus.PHN
                : this.menubar.status === IMenubarStatus.PCN
                    ? IMenubarStatus.PCE
                    : IMenubarStatus.PCN
        },
        changeDeviceWidth(): void {
            this.menubar.isPhone = document.body.offsetWidth < 768
            this.menubar.status = this.menubar.isPhone ? IMenubarStatus.PHN : IMenubarStatus.PCE
        },
        changeTagNavList(currentRoute: RouteLocationNormalizedLoaded): void {
            if (!this.setting.showTags) {
                return
            }
            if (/^\/redirect/.test(currentRoute.path) || currentRoute.meta.hidden) {
                return
            }

            const index = this.tags.tagsList.findIndex((item) => item.path === currentRoute.path)
            this.tags.tagsList.forEach((item) => {
                item.isActive = false
            })

            if (index !== -1) {
                this.tags.tagsList[index].isActive = true
                return
            }

            this.tags.tagsList.push({
                name: String(currentRoute.name || currentRoute.path),
                title: String(currentRoute.meta.title || currentRoute.name || currentRoute.path),
                path: currentRoute.path,
                isActive: true
            })
        },
        removeTagNav(payload: { tagsList: ITagsList; cPath: string }): void {
            const index = this.tags.tagsList.findIndex((item) => item.path === payload.tagsList.path)
            if (index === -1) {
                return
            }

            const isCurrentRoute = this.tags.tagsList[index].path === payload.cPath
            this.tags.tagsList.splice(index, 1)
            this.removeCachedViews({ name: payload.tagsList.name, index })

            if (this.tags.tagsList.length === 0) {
                router.push('/dashboard/workplace')
                return
            }

            if (isCurrentRoute) {
                const nextIndex = index >= this.tags.tagsList.length ? this.tags.tagsList.length - 1 : index
                this.tags.tagsList[nextIndex].isActive = true
                router.push({ path: this.tags.tagsList[nextIndex].path })
            }
        },
        removeOtherTagNav(tagsList: ITagsList): void {
            this.tags.tagsList = this.tags.tagsList.filter((item) => item.path === tagsList.path)
            this.tags.cachedViews = this.tags.cachedViews.filter((item) => item === tagsList.name)
            router.push({ path: tagsList.path })
        },
        removeAllTagNav(): void {
            this.tags.tagsList = []
            this.tags.cachedViews = []
            router.push('/dashboard/workplace')
        },
        addCachedViews(payload: { name: string; noCache: boolean }): void {
            if (!this.setting.showTags || payload.noCache || this.tags.cachedViews.includes(payload.name)) {
                return
            }
            this.tags.cachedViews.push(payload.name)
        },
        removeCachedViews(payload: { name: string; index: number }): void {
            if (this.tags.tagsList.map((item) => item.name).includes(payload.name)) {
                return
            }
            this.tags.cachedViews.splice(payload.index, 1)
        },
        removeAllCachedViews(): void {
            this.tags.cachedViews = []
            this.refreshViews()
        },
        refreshViews(type: 'push' | 'replace' = 'replace', path = router.currentRoute.value.fullPath, name = router.currentRoute.value.name) {
            this.changeNocacheViewStatus(true)
            const index = this.tags.cachedViews.findIndex((item) => item === name)
            if (index !== -1) {
                this.tags.cachedViews.splice(index, 1)
            }
            const redirectPath = `/redirect${path}`
            if (type === 'push') {
                router.push(redirectPath)
            } else {
                router.replace(redirectPath)
            }
        },
        changeNocacheViewStatus(isNoCache: boolean) {
            this.tags.isNocacheView = isNoCache
        },
        setToken(token: string): void {
            this.status.ACCESS_TOKEN = token
            sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
        },
        setRefreshToken(token: string): void {
            this.status.REFRESH_TOKEN = token
            sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
        },
        setRoutes(data: Array<IMenubarList>): void {
            this.menubar.menuList = data
        },
        getDefaultLandingPath(): string {
            const leafPaths = collectLeafRoutePaths(this.menubar.menuList)
            const preferredPath = leafPaths.find((path) => !path.startsWith('/dashboard'))
            return preferredPath || leafPaths[0] || '/error/404'
        },
        resetDynamicRoutes(): void {
            this.dynamicRouteNames.forEach((name) => {
                if (router.hasRoute(name)) {
                    router.removeRoute(name)
                }
            })
            this.dynamicRouteNames = []
            this.status.isRoutesLoaded = false
        },
        appendDynamicRoutes(routes: Array<IMenubarList>): void {
            this.resetDynamicRoutes()

            const collectTopLevelRouteNames = (routeList: Array<IMenubarList>) => {
                this.dynamicRouteNames = routeList
                    .map((route) => route.name)
                    .filter((name): name is string => Boolean(name))
            }

            routes.forEach((route) => {
                if (route.name && !router.hasRoute(route.name)) {
                    router.addRoute(route as RouteRecordRaw)
                }
            })

            collectTopLevelRouteNames(routes)
        },
        clearUserState(): void {
            this.userInfo = buildDefaultUserInfo()
            this.currentTenant = null
            this.tenantList = []
            this.status.isUserLoaded = false
        },
        clearAuthState(): void {
            this.status.ACCESS_TOKEN = ''
            this.status.REFRESH_TOKEN = ''
            this.status.isLoggingOut = false
            sessionStorage.removeItem(ACCESS_TOKEN_KEY)
            sessionStorage.removeItem(REFRESH_TOKEN_KEY)
            try {
                deleteCookie('username')
            } catch {
                console.warn('清理用户名 cookie 失败')
            }
            this.clearUserState()
            this.resetDynamicRoutes()
            this.menubar.menuList = []
            this.tags.tagsList = []
            this.tags.cachedViews = []
        },
        applyLoginResponse(data: any): void {
            this.setToken(data.accessToken)
            this.setRefreshToken(data.refreshToken)
            this.currentTenant = data.currentTenant
            this.tenantList = normalizeTenantSummaryList(data.tenantList || [])
        },
        async syncTenantList(): Promise<void> {
            if (!this.status.ACCESS_TOKEN) {
                this.tenantList = []
                return
            }

            try {
                const response = await fetchTenantList({
                    page: 1,
                    pageSize: 500,
                    search: {}
                })
                this.tenantList = normalizeTenantSummaryList(response.data.data?.data || [])
            } catch {
                console.warn('刷新团队列表失败，已保留当前缓存')
            }
        },
        async login(param: ILoginParam): Promise<void> {
            const response = await login(param)
            this.applyLoginResponse(response.data.data)
            await this.initializeUserState()
            await this.loadDynamicRoutes()

            try {
                setCookie('username', this.userInfo.username, 365)
            } catch {
                console.warn('写入用户名 cookie 失败')
            }

            const { query } = router.currentRoute.value
            const redirectPath = typeof query.from === 'string' ? decode(query.from) : ''
            const nextPath = redirectPath && !redirectPath.startsWith('/error/')
                ? redirectPath
                : this.getDefaultLandingPath()
            await router.push(nextPath)
        },
        async initializeUserState(): Promise<void> {
            const [userResponse, tenantResponse] = await Promise.all([getUser(), getCurrentTenant()])
            this.userInfo = {
                ...buildDefaultUserInfo(),
                ...userResponse.data.data
            }
            this.currentTenant = tenantResponse.data.data
            this.userInfo.tenantId = tenantResponse.data.data.id
            this.userInfo.tenantCode = tenantResponse.data.data.tenantCode
            await this.syncTenantList()
            this.status.isUserLoaded = true
        },
        async loadDynamicRoutes(): Promise<void> {
            const response = await getRouterList()
            const routeList = generatorDynamicRouter(response.data.data || [])
            this.setRoutes(routeList)
            this.appendDynamicRoutes(routeList)
            this.status.isRoutesLoaded = true
        },
        async bootstrapSession(): Promise<void> {
            if (!this.status.ACCESS_TOKEN) {
                this.status.ACCESS_TOKEN = sessionStorage.getItem(ACCESS_TOKEN_KEY) || ''
            }
            if (!this.status.REFRESH_TOKEN) {
                this.status.REFRESH_TOKEN = sessionStorage.getItem(REFRESH_TOKEN_KEY) || ''
            }
            if (!this.status.ACCESS_TOKEN) {
                return
            }

            if (!this.status.isUserLoaded) {
                try {
                    await this.initializeUserState()
                } catch {
                    if (this.status.REFRESH_TOKEN) {
                        const refreshResponse = await refreshToken(this.status.REFRESH_TOKEN)
                        this.applyLoginResponse(refreshResponse.data.data)
                        await this.initializeUserState()
                    } else {
                        throw new Error('登录状态已失效')
                    }
                }
            }

            if (!this.status.isRoutesLoaded) {
                await this.loadDynamicRoutes()
            }
        },
        async getUser(): Promise<void> {
            await this.initializeUserState()
        },
        async GenerateRoutes(): Promise<void> {
            await this.loadDynamicRoutes()
        },
        async switchCurrentTenant(tenantId: number): Promise<void> {
            const currentPath = router.currentRoute.value.path
            const response = await switchTenant(tenantId)
            this.applyLoginResponse(response.data.data)
            await this.initializeUserState()
            await this.loadDynamicRoutes()

            const nextPath = canRouteAccessByPath(this.menubar.menuList, currentPath)
                ? currentPath
                : this.getDefaultLandingPath()
            await router.push(nextPath)
        },
        async logout(): Promise<void> {
            if (this.status.isLoggingOut) {
                return
            }
            this.status.isLoggingOut = true
            const refreshValue = this.status.REFRESH_TOKEN
            try {
                if (refreshValue) {
                    await logoutRequest(refreshValue)
                }
            } catch {
                console.warn('退出登录接口调用失败，已本地清理登录态')
            } finally {
                this.clearAuthState()
                await router.push('/login')
            }
        },
        async forceLogout(): Promise<void> {
            if (this.status.isLoggingOut) {
                return
            }
            this.status.isLoggingOut = true
            this.clearAuthState()
            if (router.currentRoute.value.path !== '/login') {
                await router.push('/login')
            }
        },
        canAccessPermission(permissionName: keyof IUserInfo['permissionFlags']): boolean {
            return Boolean(this.userInfo.permissionFlags?.[permissionName])
        },
        refreshPage(path: string): void {
            const name = this.tags.tagsList.find((item) => item.path === path)?.name
            if (!name) {
                return
            }
            const index = this.tags.cachedViews.findIndex((item) => item === name)
            if (index !== -1) {
                this.tags.cachedViews.splice(index, 1)
            }
        },
        changeTheme(num?: number): void {
            if (typeof num !== 'number') {
                return
            }
            if (num === this.setting.theme) {
                return
            }
            this.setting.theme = num
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        changeThemeColor(color: string): void {
            this.setting.color.primary = color
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        changeTagsSetting(showTags: boolean): void {
            this.setting.showTags = showTags
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        changePinSearchSetting(showPinyinSearch: boolean): void {
            this.setting.usePinyinSearch = showPinyinSearch
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        changemenubarMode(mode: 'horizontal' | 'vertical'): void {
            this.setting.mode = mode
            localStorage.setItem('setting', JSON.stringify(this.setting))
        }
    }
})
