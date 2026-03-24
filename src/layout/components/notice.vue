<template>
    <el-dropdown trigger='click'>
        <el-badge :value='unreadCount' :hidden='unreadCount === 0' type='danger' class='el-dropdown-link item mx-2 cursor-pointer leading-none'>
            <el-icon class='text-xl'><el-icon-bell /></el-icon>
        </el-badge>
        <template #dropdown>
            <el-dropdown-menu>
                <el-tabs type='border-card' class='notice-tabs z-10'>
                    <el-tab-pane label='通知' class='notice-tabs-pane'>
                        <el-scrollbar class='scrollbar-wrapper'>
                            <div v-if='tasks.length > 0'>
                                <div v-for='(item, index) in tasks' :key='index' 
                                     class='py-3 px-4 border-b hover:bg-blue-50 cursor-pointer transition-colors relative'
                                     @click='handleNoticeClick(item)'>
                                    <div class='flex items-start gap-3'>
                                        <!-- 任务图片或图标 -->
                                        <div class='mt-1 shrink-0'>
                                            <el-image v-if='item.image' :src='item.image' class='w-10 h-10 rounded border object-cover' />
                                            <el-avatar v-else :size='40' :class='getIconBg(item.taskType)'>
                                                <el-icon class='text-white'><component :is='getIcon(item.taskType)' /></el-icon>
                                            </el-avatar>
                                        </div>
                                        <div class='flex-1 overflow-hidden'>
                                            <div class='flex justify-between items-start'>
                                                <p class='text-sm font-bold text-gray-800 truncate pr-2'>{{ item.title || getTaskLabel(item.taskType) }}</p>
                                                <el-tag v-if='item.status === "running"' size='small' type='warning' effect='dark' class='!scale-75 origin-right shrink-0'>执行中</el-tag>
                                                <el-tag v-else-if='item.status === "success"' size='small' type='success' effect='dark' class='!scale-75 origin-right shrink-0'>已完成</el-tag>
                                            </div>
                                            <p class='text-xs text-gray-500 mt-1 line-clamp-1'>{{ item.subTitle }}</p>
                                            
                                            <!-- 进度条（执行中显示） -->
                                            <div v-if='item.status === "running"' class='mt-2'>
                                                <el-progress :percentage='item.progress' :stroke-width='4' :show-text='false' />
                                            </div>

                                            <p class='text-[10px] text-gray-400 mt-2 flex items-center justify-between'>
                                                <span class='flex items-center gap-1'>
                                                    <el-icon><el-icon-clock /></el-icon> {{ item.time }}
                                                </span>
                                                <span v-if='item.status === "running"' class='text-blue-500 font-medium'>{{ item.progress }}%</span>
                                            </p>
                                        </div>
                                    </div>
                                    <!-- 未读标记 -->
                                    <div v-if='!item.read' class='absolute right-2 top-11 w-1.5 h-1.5 bg-red-500 rounded-full'></div>
                                </div>
                            </div>
                            <div v-else class='text-center text-gray-400 py-12 flex flex-col items-center'>
                                <el-icon class='text-4xl opacity-20 mb-2'><el-icon-chat-dot-square /></el-icon>
                                <span>暂无新通知</span>
                            </div>
                        </el-scrollbar>
                        <div class='p-2 text-center border-t' v-if='tasks.length > 0'>
                            <el-button type='text' size='mini' @click='clearAll'>全部清空</el-button>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label='其他' class='notice-tabs-pane'>
                        <div class='text-center text-gray-400 py-8 italic text-xs'>此处暂无动态</div>
                    </el-tab-pane>
                </el-tabs>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { useTaskStore, IGlobalTask } from '/@/store/modules/task'

export default defineComponent({
    name: 'Notice',
    setup() {
        const router = useRouter()
        const taskStore = useTaskStore()
        
        const tasks = computed(() => taskStore.tasks)
        const unreadCount = computed(() => taskStore.unreadCount)

        let timer: any = null

        // 集中管理任务类型配置，避免在各个页面硬编码
        const TASK_CONFIG = {
            'VOICE_TASK': {
                label: '声音克隆',
                icon: 'el-icon-microphone',
                bg: '!bg-blue-500',
                routeName: 'GenerateAudio'
            },
            'VIDEO_TASK': {
                label: '视频制作',
                icon: 'el-icon-video-camera',
                bg: '!bg-green-500',
                routeName: 'GenerateVideo'
            },
            'VIDEO_PLAN_TASK': {
                label: '生成计划',
                icon: 'el-icon-document-copy',
                bg: '!bg-purple-500',
                routeName: 'GeneratePlan'
            },
            'DIGITAL_HUMAN_TASK': {
                label: '数字人处理',
                icon: 'el-icon-user',
                bg: '!bg-orange-500',
                routeName: 'GenerateDigitalHuman'
            }
        } as const

        const getIcon = (type: keyof typeof TASK_CONFIG) => TASK_CONFIG[type]?.icon || 'el-icon-bell'
        const getIconBg = (type: keyof typeof TASK_CONFIG) => TASK_CONFIG[type]?.bg || '!bg-gray-400'
        const getTaskLabel = (type: keyof typeof TASK_CONFIG) => TASK_CONFIG[type]?.label || '系统任务'

        const fetchNotices = () => {
             // 模拟：检查是否有刚运行完成的任务（如果是后端，这里就是调用轮询接口）
             taskStore.tasks.forEach(task => {
                if (task.status === 'success' && !task.notified) {
                    const taskName = task.title || task.subTitle
                    ElNotification({
                        title: `${getTaskLabel(task.taskType as any)}完成`,
                        message: `您的任务 ${taskName} 已处理成功`,
                        type: 'success',
                        position: 'top-right',
                        onClick: () => handleNoticeClick(task)
                    })
                    task.notified = true 
                }
             })
        }

        const handleNoticeClick = (item: IGlobalTask) => {
            item.read = true
            item.notified = true
            const config = TASK_CONFIG[item.taskType]
            if (config && config.routeName) {
                router.push({ name: config.routeName })
            }
        }

        const clearAll = () => {
            taskStore.clearTasks()
        }

        onMounted(() => {
            timer = setInterval(fetchNotices, 3000)
        })

        onUnmounted(() => {
            if (timer) clearInterval(timer)
        })

        return {
            unreadCount,
            tasks,
            handleNoticeClick,
            getIcon,
            getIconBg,
            getTaskLabel,
            clearAll
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