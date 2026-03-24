import { defineStore } from 'pinia'

export interface IGlobalTask {
    id: string | number
    taskType: 'VOICE_TASK' | 'VIDEO_TASK' | 'VIDEO_PLAN_TASK' | 'DIGITAL_HUMAN_TASK'
    title?: string
    subTitle: string
    status: 'running' | 'success' | 'failed'
    progress: number
    image?: string
    time: string
    read: boolean
    notified?: boolean // 是否已经弹出过通知
}

interface ITaskState {
    tasks: IGlobalTask[]
}

export const useTaskStore = defineStore({
    id: 'task',
    state: (): ITaskState => ({
        tasks: []
    }),
    actions: {
        addTask(task: Omit<IGlobalTask, 'id' | 'time' | 'read' | 'progress'>) {
            const newTask: IGlobalTask = {
                ...task,
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                read: false,
                progress: task.status === 'running' ? 0 : 100
            }
            this.tasks.unshift(newTask)
            
            // 如果是运行中，模拟进度增长并延时完成 (Demo逻辑)
            if (newTask.status === 'running') {
                this.simulateTaskCompletion(newTask.id)
            }
        },
        simulateTaskCompletion(id: string | number) {
            const timer = setInterval(() => {
                const task = this.tasks.find(t => t.id === id)
                if (task && task.status === 'running') {
                    task.progress += Math.floor(Math.random() * 20)
                    if (task.progress >= 100) {
                        task.progress = 100
                        task.status = 'success'
                        task.subTitle = '任务已成功处理完毕'
                        clearInterval(timer)
                    }
                } else {
                    clearInterval(timer)
                }
            }, 3000)
        },
        markAllAsRead() {
            this.tasks.forEach(t => t.read = true)
        },
        clearTasks() {
            this.tasks = []
        }
    },
    getters: {
        unreadCount(): number {
            return this.tasks.filter(t => !t.read).length
        }
    }
})
