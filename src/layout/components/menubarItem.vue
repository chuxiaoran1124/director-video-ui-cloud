<template>
    <el-sub-menu v-if='menuList.children && menuList.children.length > 0' :key='resolvedPath' :index='resolvedPath'>
        <template #title>
            <component :is='UseElIcon(menuList.meta.icon || "el-icon-location")' />
            <span>{{ menuList.meta.title }}</span>
        </template>
        <el-menu-item-group>
            <menubar-item
                v-for='v in menuList.children'
                :key='resolveMenuPath(resolvedPath, v.path)'
                :menu-list='v'
                :resolved-path='resolveMenuPath(resolvedPath, v.path)'
            />
        </el-menu-item-group>
    </el-sub-menu>

    <el-menu-item
        v-else
        :key='resolvedPath'
        :index='resolvedPath'
        @click='navigateTo(resolvedPath)'
    >
        <component :is='UseElIcon(menuList.meta.icon || "el-icon-setting")' />
        <template #title>
            {{ menuList.meta.title }}
        </template>
    </el-menu-item>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMenubarList } from '/@/type/store/layout'
import { UseElIcon } from '/@/components/SvnIcon/elIcon'
import { useRouter } from 'vue-router'

export default defineComponent({
    name: 'MenubarItem',
    props: {
        menuList: {
            type: Object as PropType<IMenubarList>,
            default: () => {return {}}
        },
        resolvedPath: {
            type: String,
            default: '/'
        }
    },
    setup() {
        const router = useRouter()

        const resolveMenuPath = (parentPath: string, currentPath?: string) => {
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

        const navigateTo = (path: string) => {
            router.push({ path: resolveMenuPath('', path) })
        }

        return {
            UseElIcon,
            resolveMenuPath,
            navigateTo
        }
    }
})
</script>
