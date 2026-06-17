<template>
    <el-menu
        :mode='getMenubar.isPhone ? "vertical" : getSetting.mode'
        :default-active='activeMenu'
        :default-openeds='defaultOpeneds'
        :collapse='getMenubar.status === 1 || getMenubar.status === 3'
        :class='{ 
            "el-menu-vertical-demo": true,
            "w-64": getMenubar.status === 0 || getMenubar.status === 2, 
            "w-0": getMenubar.status === 3, 
            "w-16": getMenubar.status === 1, 
            "w-full": getSetting.mode === "horizontal" && !getMenubar.isPhone, 
        }'
        :collapse-transition='false'
        :unique-opened='false'
    >
        <menubar-item
            v-for='v in filterMenubarData'
            :key='v.path'
            :menu-list='v'
            :resolved-path='resolveMenuPath("", v.path)'
        />
    </el-menu>
</template>

<script lang='ts'>
import { defineComponent, computed } from 'vue'
import MenubarItem from '/@/layout/components/menubarItem.vue'
import { useRoute } from 'vue-router'
import { IMenubarList } from '/@/type/store/layout'
import { useLayoutStore } from '/@/store/modules/layout'

const resolveMenuPathValue = (parentPath: string, currentPath?: string) => {
    const routePath = String(currentPath || '')
    if (!routePath) {
        return parentPath || '/'
    }
    if (routePath.startsWith('/')) {
        return routePath
    }
    const normalizedParent = parentPath && parentPath !== '/' ? parentPath.replace(/\/$/, '') : ''
    return `${normalizedParent}/${routePath}`.replace(/\/{2,}/g, '/')
}

// 过滤隐藏的菜单，并提取单条的子菜单
const filterMenubar = (menuList:IMenubarList[]) => {
    const f = (menuList:IMenubarList[]) => {
        let arr:IMenubarList[] = []
        menuList.filter(v => !v.meta.hidden).forEach(v => {
            let child = v.children && v.children.filter(v => !v.meta.hidden)
            let currentItem = v
            if(!v.meta.alwaysShow && child && child.length === 1) {
                const [singleChild] = child
                currentItem = {
                    ...singleChild,
                    path: resolveMenuPathValue(v.path, singleChild.path),
                    meta: {
                        ...singleChild.meta,
                        activeMenu: singleChild.meta?.activeMenu || v.path
                    }
                }
            }
            arr.push(currentItem)
            if(currentItem.children && currentItem.children.length > 0) {
                arr[arr.length - 1].children = f(currentItem.children)
            }
        })
        return arr
    }
    return f(menuList)
}
export default defineComponent ({
    name: 'LayoutMenubar',
    components: {
        MenubarItem
    },
    setup() {
        const route = useRoute()
        const { getMenubar, getSetting } = useLayoutStore()

        const resolveMenuPath = (parentPath: string, currentPath?: string) => {
            return resolveMenuPathValue(parentPath, currentPath)
        }

        const filterMenubarData = computed(() => filterMenubar(getMenubar.menuList))

        const defaultOpeneds = computed(() => {
            return filterMenubarData.value.map(v => v.path)
        })

        const activeMenu = computed(() => {
            if(route.meta.activeMenu) return route.meta.activeMenu
            return route.path
        })
        return {
            getMenubar,
            filterMenubarData,
            activeMenu,
            defaultOpeneds,
            getSetting,
            resolveMenuPath
        }
    }
})
</script>
