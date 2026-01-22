<template>
    <el-dropdown trigger='click'>
        <el-badge :value='0' type='danger' class='el-dropdown-link item mx-2 cursor-pointer leading-none'>
            <el-icon class='text-xl'><el-icon-bell /></el-icon>
        </el-badge>
        <template #dropdown>
            <el-dropdown-menu>
                <el-tabs type='border-card' class='notice-tabs z-10'>
                    <el-tab-pane label='通知' class='notice-tabs-pane'>
                        <el-scrollbar class='scrollbar-wrapper'>
                            <list v-if='data.length > 0' :data='data' />
                            <div v-else class='text-center text-gray-400 py-8'>暂无通知</div>
                            <el-pagination
                                v-if='data.length > 0'
                                layout='prev, pager, next'
                                :total='1000'
                                :hide-on-single-page='false'
                                small
                                :pager-count='5'
                            />
                        </el-scrollbar>
                    </el-tab-pane>
                    <el-tab-pane label='关注' class='notice-tabs-pane'>
                        <el-scrollbar class='scrollbar-wrapper'>
                            <list v-if='data.length > 0' :data='data' />
                            <div v-else class='text-center text-gray-400 py-8'>暂无关注</div>
                        </el-scrollbar>
                    </el-tab-pane>
                    <el-tab-pane label='待办' class='notice-tabs-pane'>
                        <el-scrollbar class='scrollbar-wrapper'>
                            <list v-if='data.length > 0' :data='data' />
                            <div v-else class='text-center text-gray-400 py-8'>暂无待办</div>
                        </el-scrollbar>
                    </el-tab-pane>
                </el-tabs>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import List, { IList } from '/@/components/List/index.vue'

export default defineComponent({
    name: 'Notice',
    components: {
        List
    },
    setup() {
        const data:IList[] = []
        return {
            data
        }
    }
})
</script>

<style lang='postcss' scoped>
.notice-tabs {
    margin: -10px 0;
    border: none;
    width: 300px;
}
.el-dropdown-menu{
    padding: 10px 0;
}
.notice-tabs-pane {
    height: 400px;
    overflow: hidden;
    margin: -15px;
}

.scrollbar-wrapper {
    padding: 15px;
}
</style>