import { defineStore } from 'pinia'
import { login, loginParam, getRouterList, getUser } from '/@/api/layout/index'
import { ILayout, IMenubarStatus, ITagsList, IMenubarList, ISetting, IMenubar, IStatus, ITags, IUserInfo } from '/@/type/store/layout'
import router from '/@/router/index'
import { allowRouter } from '/@/router/index'
import { generatorDynamicRouter } from '/@/router/asyncRouter'
import { decode, decodeJwtPayload, setCookie, deleteCookie } from '/@/utils/tools'
import { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

const setting = JSON.parse(localStorage.getItem('setting') || '{}')
const ACCESS_TOKEN = sessionStorage.getItem('token') || ''

export const useLayoutStore = defineStore({
    id: 'layout',
    state: ():ILayout => ({
        menubar: {
            status: document.body.offsetWidth < 768 ? IMenubarStatus.PHN : IMenubarStatus.PCE,
            menuList: [],
            isPhone: document.body.offsetWidth < 768
        },
        // 用户信息
        userInfo: {
            id: '',
            user_id: '',
            name: '',
            username: '',
            role: []
        },
        // 标签栏
        tags: {
            tagsList: [],
            cachedViews: [],
            isNocacheView: false
        },
        setting: {
            theme: setting.theme !== undefined ? setting.theme : 0,
            showTags: setting.showTags !== undefined ? setting.showTags : true,
            color: {
                primary: setting.color !== undefined ? setting.color.primary : '#409eff'
            },
            usePinyinSearch: setting.usePinyinSearch !== undefined ? setting.usePinyinSearch : false,
            mode: setting.mode || 'vertical'
        },
        status: {
            isLoading: false,
            ACCESS_TOKEN: ACCESS_TOKEN
        }
    }),
    getters: {
        getMenubar():IMenubar {
            return this.menubar
        },
        getUserInfo():IUserInfo {
            return this.userInfo
        },
        getTags():ITags {
            return this.tags
        },
        getSetting():ISetting {
            return this.setting
        },
        getStatus():IStatus {
            return this.status
        }
    },
    actions: {
        changeCollapsed():void {
            this.menubar.status = this.menubar.isPhone
                ? this.menubar.status === IMenubarStatus.PHN 
                    ? IMenubarStatus.PHE 
                    : IMenubarStatus.PHN
                : this.menubar.status === IMenubarStatus.PCN 
                    ? IMenubarStatus.PCE 
                    : IMenubarStatus.PCN
        },
        changeDeviceWidth():void {
            this.menubar.isPhone = document.body.offsetWidth < 768
            this.menubar.status = this.menubar.isPhone ? IMenubarStatus.PHN : IMenubarStatus.PCE
        },
        // 切换导航，记录打开的导航
        changeTagNavList(cRouter:RouteLocationNormalizedLoaded):void {
            if(!this.setting.showTags) return // 判断是否开启多标签页
            // if(cRouter.meta.hidden && !cRouter.meta.activeMenu) return // 隐藏的菜单如果不是子菜单则不添加到标签
            if(new RegExp('^\/redirect').test(cRouter.path)) return
            const index = this.tags.tagsList.findIndex(v => v.path === cRouter.path)
            this.tags.tagsList.forEach(v => v.isActive = false)
            // 判断页面是否打开过
            if(index !== -1) {
                this.tags.tagsList[index].isActive = true
                return
            }
            const tagsList:ITagsList = {
                name: cRouter.name as string,
                title: cRouter.meta.title as string,
                path: cRouter.path,
                isActive: true
            }
            this.tags.tagsList.push(tagsList)
        },
        removeTagNav(obj:{tagsList:ITagsList, cPath: string}):void {
            const index = this.tags.tagsList.findIndex(v => v.path === obj.tagsList.path)
            if(this.tags.tagsList[index].path === obj.cPath) {
                this.tags.tagsList.splice(index, 1)
                const i = index === this.tags.tagsList.length ? index - 1 : index
                this.tags.tagsList[i].isActive = true
                this.removeCachedViews({ name: obj.tagsList.name, index })
                router.push({ path: this.tags.tagsList[i].path })
            }else{
                this.tags.tagsList.splice(index, 1)
                this.removeCachedViews({ name: obj.tagsList.name, index })
            }
        },
        removeOtherTagNav(tagsList:ITagsList):void {
            const index = this.tags.tagsList.findIndex(v => v.path === tagsList.path)
            this.tags.tagsList.splice(index + 1)
            this.tags.tagsList.splice(0, index)
            this.tags.cachedViews.splice(index + 1)
            this.tags.cachedViews.splice(0, index)
            router.push({ path: tagsList.path })
        },
        removeAllTagNav():void {
            this.tags.tagsList.splice(0)
            this.tags.cachedViews.splice(0)
            router.push({ path: '/redirect/' })
        },
        // 添加缓存页面
        addCachedViews(obj: {name: string, noCache: boolean}):void {
            if(!this.setting.showTags) return // 判断是否开启多标签页
            if(obj.noCache || this.tags.cachedViews.includes(obj.name)) return
            this.tags.cachedViews.push(obj.name)
        },
        // 删除缓存页面
        removeCachedViews(obj: { name: string, index: number }):void {
            // 判断标签页是否还有该页面
            if(this.tags.tagsList.map(v => v.name).includes(obj.name)) return
            this.tags.cachedViews.splice(obj.index, 1)
        },
        // 删除所有缓存页面并刷新当前页面
        removeAllCachedViews() {
            this.tags.cachedViews.splice(0)
            this.refreshViews()
        },
        // 刷新页面，默认刷新当前页面
        refreshViews(type: 'push' | 'replace' = 'replace', path = router.currentRoute.value.fullPath, name = router.currentRoute.value.name) {
            this.changeNocacheViewStatus(true)
            // 删除页面的缓存
            const index = this.tags.cachedViews.findIndex(v => v === name)
            index !== -1 && this.tags.cachedViews.splice(index, 1)
            if(type === 'push') {
                router.push(`/redirect${path}`)
            }else{
                router.replace(`/redirect${path}`)
            }
            
        },
        changeNocacheViewStatus(isNoCache: boolean) {
            this.tags.isNocacheView = isNoCache
        },
        logout():void {
            this.status.ACCESS_TOKEN = ''
            sessionStorage.removeItem('token')
            try { deleteCookie('username') } catch {}
            history.go(0) // 已注释，防止自动刷新页面，便于调试
        },
        setToken(token:string):void {
            this.status.ACCESS_TOKEN = token
            sessionStorage.setItem('token', token)
        },
        setRoutes(data: Array<IMenubarList>):void {
            this.menubar.menuList = data
        },
        concatAllowRoutes():void {
            const existNames = new Set(this.menubar.menuList.map(v => v.name))
            // 仅在菜单中不存在时再合并静态路由，避免重复
            allowRouter.forEach(v => {
                if(!existNames.has(v.name)) {
                    this.menubar.menuList.unshift(v)
                }
            })
        },
        // 修改主题
        changeTheme(num?:number):void {
            if(num === this.setting.theme) return
            if(typeof num !== 'number') num = this.setting.theme
            this.setting.theme = num
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        // 修改主题色
        changeThemeColor(color: string):void {
            this.setting.color.primary = color
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        changeTagsSetting(showTags:boolean):void {
            this.setting.showTags = showTags
            localStorage.setItem('setting', JSON.stringify(this.setting))
    
            if(showTags) {
                const index = this.tags.tagsList.findIndex(v => v.path === router.currentRoute.value.path)
                if(index !== -1) {
                    this.tags.tagsList.forEach(v => v.isActive = false)
                    this.tags.tagsList[index].isActive = true
                }else{
                    this.changeTagNavList(router.currentRoute.value)
                }
            }
        },
        changePinSearchSetting(showPinyinSearch:boolean):void {
            this.setting.usePinyinSearch = showPinyinSearch
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        // 下次进去该页面刷新该页面(解决子页面保存之后，回到父页面页面不刷新问题)
        refreshPage(path: string):void {
            const name = this.tags.tagsList.filter(v => v.path === path)[0]?.name
            if(!name) return
            const index = this.tags.cachedViews.findIndex(v => v === name)
            this.tags.cachedViews.splice(index, 1)
        },
        changemenubarMode(mode: 'horizontal' | 'vertical'):void {
            this.setting.mode = mode
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        async login(param: loginParam):Promise<void> {
            const res = await login(param)
            // 从返回数据中获取token和用户信息
            const { token, name, role } = res.data.data
            const tokenPayload = decodeJwtPayload<any>(token)
            const userId =
                tokenPayload?.user_id ??
                tokenPayload?.userId ??
                (res.data.data as any).user_id ??
                (res.data.data as any).id ??
                ''
            // 设置token
            this.status.ACCESS_TOKEN = token
            sessionStorage.setItem('token', token)
            // 设置用户信息（兼容后端 role 可能为字符串或数组）
            this.userInfo.id = userId
            this.userInfo.user_id = userId
            this.userInfo.name = name
            this.userInfo.username = tokenPayload?.username || param.username
            try { setCookie('username', name, 365) } catch {}
            const nextRole = tokenPayload?.role ?? role
            if (Array.isArray(nextRole)) {
                this.userInfo.role = nextRole
            } else if (typeof nextRole === 'string') {
                this.userInfo.role = [nextRole]
            } else {
                this.userInfo.role = []
            }
            

            // 先生成并挂载动态路由，确保后续跳转能找到对应页面
            await this.GenerateRoutes()
            // 把生成的路由添加到 router（与 permission 中逻辑一致）
            try {
                for (let i = 0; i < this.menubar.menuList.length; i++) {
                    const r = this.menubar.menuList[i] as RouteRecordRaw
                    // 避免覆盖根路由或重复添加已存在的路由
                    if (r.path === '/') continue
                    if (r.name && router.hasRoute(r.name as string)) continue
                    router.addRoute(r)
                }
            } catch (e) {
                console.error('[debug] layout.login addRoute error:', e)
            }

            const { query } = router.currentRoute.value
            await router.push(typeof query.from === 'string' ? decode(query.from) : '/')
        },
        async getUser():Promise<void> {
            const res = await getUser()
            const userInfo = res.data.data
            const userId = (userInfo as any).user_id ?? (userInfo as any).id ?? ''
            this.userInfo.id = userId
            this.userInfo.user_id = userId
            this.userInfo.name = userInfo.name
            this.userInfo.username = userInfo.username || this.userInfo.username
            // API 返回 role 已经是数组类型
            this.userInfo.role = userInfo.role
        },

        async GenerateRoutes():Promise<void> {
            const res = await getRouterList()
            const { data } = res.data
            generatorDynamicRouter(data)
        }
    }
})
