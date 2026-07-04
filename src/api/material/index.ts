import request from '/@/utils/request'

// ===== 视频计划管理（A2EPlanVideoViews）相关接�?=====

/**
 * 分页查询视频计划
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回计划列表及分页信�?
 */
export function getPlanVideoList(page: number = 1, pageSize: number = 20, search: any = {}) {
    return request({
        url: '/api/material/plan/video/paginate/',
        method: 'post',
        data: { page, pageSize, ...search }
    })
}

/**
 * 获取视频计划详情
 * @param id 计划ID
 * @returns 返回计划详情
 */
export function getPlanVideoDetail(id: number | string) {
    return request({
        url: `/api/material/plan/video/${id}/`,
        method: 'get'
    })
}

/**
 * 创建/更新视频计划
 * @param data 计划数据 {id?, plan_name, msg, language, subtitleSelector, colour?}
 * @returns 创建结果
 */
export function createPlanVideo(data: any) {
    return request({
        url: '/api/material/plan/video/create/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 更新视频计划（可直接使用createPlanVideo with id�?
 * @param id 计划ID
 * @param data 计划数据
 * @returns 更新结果
 */
export function updatePlanVideo(id: number | string, data: any) {
    return request({
        url: `/api/material/plan/video/create/`,
        method: 'post',
        data: { ...data, id },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 删除视频计划
 * @param id 计划ID
 * @returns 删除结果
 */
export function deletePlanVideo(id: number | string) {
    return request({
        url: `/api/material/plan/video/delete/${id}/`,
        method: 'delete'
    })
}

/**
 * 校验计划名称是否可用
 * @param name 名称
 * @returns 可用性与推荐名称
 */
export function validatePlanVideoName(name: string) {
    return request({
        url: '/api/material/plan/video/validate-name/',
        method: 'post',
        data: { name },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

// ===== 计划视频任务（A2EPlanVideoTaskViews）相关接�?=====

/**
 * 创建/修改视频任务
 * @param data 任务数据 {id?, title, msg, plan_id, voice_id, digital_human_id, language, speechRate, subtitleSelector, colour?}
 * @returns 创建结果
 */
export function createPlanVideoTask(data: any) {
    return request({
        url: '/api/material/plan/video/task/create/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 删除视频任务
 * @param id 任务ID
 * @returns 删除结果
 */
export function deletePlanVideoTask(id: number | string) {
    return request({
        url: `/api/material/plan/video/task/delete/${id}/`,
        method: 'delete'
    })
}

/**
 * 获取所有视频任�?
 * @returns 任务列表
 */
export function getAllPlanVideoTasks() {
    return request({
        url: '/api/material/plan/video/task/all/',
        method: 'get'
    })
}

/**
 * 获取视频任务详情
 * @param id 任务ID
 * @returns 任务详情
 */
export function getPlanVideoTaskDetail(id: number | string) {
    return request({
        url: `/api/material/plan/video/task/${id}/`,
        method: 'get'
    })
}

/**
 * 按计划ID获取视频任务
 * @param planId 计划ID
 * @returns 任务列表
 */
export function getPlanVideoTasksByPlanId(planId: number | string) {
    return request({
        url: '/api/material/plan/video/task/',
        method: 'post',
        data: { plan_id: planId },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 分页查询视频任务（推荐使用）
 * @param page 页码
 * @param pageSize 每页大小
 * @param search 搜索条件
 * @returns 任务分页数据
 */
export function getPlanVideoTasksPaginate(page: number = 1, pageSize: number = 20, search: any = {}) {
    return request({
        url: '/api/material/plan/video/task/paginate/post/',
        method: 'post',
        data: { page, pageSize, search },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 启动视频任务（立即执行）
 * @param taskId 任务ID
 * @returns 启动结果
 */
export function startPlanVideoTask(taskId: number | string) {
    return request({
        url: '/api/material/plan/video/task/start/',
        method: 'post',
        data: { task_id: taskId },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 批量启动计划下的所有任�?
 * @param planId 计划ID
 * @returns 批量启动结果
 */
export function startAllPlanTasks(planId: number | string) {
    return request({
        url: '/api/material/plan/video/task/start-all/',
        method: 'post',
        data: { plan_id: planId },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

// ===== 其他接口 =====

export function getVoices() {
    return request({
        url: '/api/material/getVoices',
        method: 'get',
        baseURL: ''
    })
}

export function getDigitalHumans() {
    return request({
        url: '/api/material/getDigitalHumans',
        method: 'get',
        baseURL: ''
    })
}

export function getRelations() {
    return request({
        url: '/api/material/getRelations',
        method: 'get',
        baseURL: ''
    })
}

// ===== 声音克隆相关接口 =====

/**
 * 创建声音克隆任务
 * @param formData FormData 对象，包�?file, name, gender, language, model
 * @returns 返回任务ID
 */
export function createVoiceTask(formData: FormData) {
    return request({
        url: '/api/material/voice/create/',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * 分页查询声音克隆任务
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回任务列表及分页信�?
 */
export function getVoiceTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/voice/task/paginate/post/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 查询所有声音克隆任务（不分页）
 * @returns 返回所有任务列�?
 */
export function getVoiceTaskWaiting() {
    return request({
        url: '/api/material/voice/task/waiting/',
        method: 'get'
    })
}
export function getAllVoiceTasks() {
    return request({
        url: '/api/material/voice/task/all/',
        method: 'get'
    })
}

/**
 * 按ID查询声音克隆任务
 * @param id 任务ID
 * @returns 返回单个任务详情
 */
export function getVoiceTaskById(id: number) {
    return request({
        url: `/api/material/voice/task/${id}/`,
        method: 'get'
    })
}

/**
 * 删除声音克隆任务（逻辑删除�?
 * @param id 任务ID
 * @returns 返回删除结果
 */
export function deleteVoiceTask(id: number) {
    return request({
        url: `/api/material/voice/task/delete/${id}/`,
        method: 'post'
    })
}

/**
 * 校验声音任务名称是否可用
 * @param name 名称
 * @returns 返回可用性与推荐名称
 */
export function validateVoiceTaskName(name: string) {
    return request({
        url: '/api/material/voice/task/validate-name/',
        method: 'post',
        data: { name },
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

// ===== 数字人相关接�?=====

/**
 * 创建数字人任�?
 * @param formData FormData 对象，包�?file, name, gender, model, language, positivePrompt, negativePrompt
 * @returns 返回任务ID
 */
export function createDigitalHumanTask(formData: FormData) {
    return request({
        url: '/api/material/digital-human/task/create/',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * 分页查询数字人任�?
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回任务列表及分页信�?
 */
export function getDigitalHumanTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/digital-human/task/paginate/post/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 获取数字人任务统�?
 * @returns 返回 total, processing, waiting, completed
 */
export function getDigitalHumanTaskStatistics() {
    return request({
        url: '/api/material/fast-task/statistics/',
        method: 'get'
    })
}

export function getDigitalHumanTaskWaiting() {
    return request({
        url: '/api/material/digital-human/task/waiting/',
        method: 'get'
    })
}

/**
 * 获取今天指定/当前快速克隆任务前面还有多少等待任务
 */
export function getFastTaskWaitingBefore(taskId?: number | string) {
    return request({
        url: '/api/material/fast-task/waiting-before/',
        method: 'get',
        params: taskId ? { taskId } : undefined
    })
}

/**
 * 删除数字人任务（逻辑删除�?
 * @param id 任务ID
 * @returns 返回删除结果
 */
export function deleteDigitalHumanTask(id: number | string) {
    return request({
        url: `/api/material/digital-human/task/delete/${id}/`,
        method: 'post'
    })
}

/**
 * 分页查询数字人管理列�?
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回数字人列表及分页信息
 */
export function getDigitalHumanPaginateList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/digital-human/paginate/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 更新数字人信息（本地数据�?
 * @param id 数字人ID
 * @param data 更新数据对象，包�?digital_human_name, title, cover_url, language, gender �?
 * @returns 返回更新后的数字人信�?
 */
export function updateDigitalHuman(id: number | string, data: any) {
    return request({
        url: `/api/material/digital-human/update/${id}/`,
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 更新声音信息
 * @param id 声音ID
 * @param data 更新数据对象，包�?voice_name, title, url �?
 * @returns 返回更新后的声音信息
 */
export function updateVoice(id: number | string, data: any) {
    return request({
        url: `/api/material/voice/update/${id}/`,
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 删除声音素材
 * @param id 声音ID
 * @returns 返回删除结果
 */
export function deleteVoice(id: number | string) {
    return request({
        url: `/api/material/voice/delete/${id}/`,
        method: 'post'
    })
}

/**
 * 删除数字人素�?
 * @param id 数字人ID
 * @returns 返回删除结果
 */
export function deleteDigitalHuman(id: number | string) {
    return request({
        url: `/api/material/digital-human/delete/${id}/`,
        method: 'post'
    })
}

// ===== 标签管理接口 =====

/**
 * 获取当前用户可见的标签分�?
 * @returns 按层级分组的标签数据
 */
export function getUserVisibleLabelGroups() {
    return request({
        url: '/api/material/label/all/grouped/by-user/',
        method: 'get'
    })
}

/**
 * 创建标签
 * @param data 标签数据
 * @returns 创建结果
 */
export function createLabel(data: {
    name: string
    level?: number
    is_public?: boolean
    is_shared?: boolean
    sort?: number
    to_top?: boolean
}) {
    return request({
        url: '/api/material/label/create/',
        method: 'post',
        data,
        silentError: true,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    } as any)
}

/**
 * 更新标签
 * @param data 标签更新数据
 * @returns 更新结果
 */
export function updateLabel(data: {
    id: number | string
    name?: string
    level?: number
    is_public?: boolean
    is_shared?: boolean
    sort?: number
    to_top?: boolean
}) {
    return request({
        url: '/api/material/label/update/',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 删除标签
 * @param id 标签ID
 * @returns 删除结果
 */
export function deleteLabel(id: number | string) {
    return request({
        url: '/api/material/label/delete/',
        method: 'post',
        data: { id },
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 标签置顶
 * @param id 标签ID
 * @returns 操作结果
 */
export function topLabel(id: number | string) {
    return request({
        url: '/api/material/label/to-top/',
        method: 'post',
        data: { id },
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

// ===== 快速生成相关接�?=====

/**
 * 创建快速生成任�?
 * @param formData FormData 对象，包�?file, name, title, gender
 * @returns 返回任务ID
 */
export function createFastTask(formData: FormData, config: any = {}) {
    return request({
        url: '/api/material/fast-task/create/',
        method: 'post',
        data: formData,
        timeout: 10 * 60 * 1000,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        ...config
    })
}

/**
 * 获取快速克隆批量直传 TOS 预签名地址
 */
export function createFastTaskTosPresign(data: any) {
    return request({
        url: '/api/material/fast-task/tos/presign/',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 快速克隆批量直传完成后创建任务
 */
export function createFastTaskDirectBatch(data: any) {
    return request({
        url: '/api/material/fast-task/direct/batch-create/',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 分页查询快速生成任�?
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回任务列表及分页信�?
 */
export function getFastTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/fast-task/paginate/post/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 校验数字人任务名称是否可�?
 * @param name 名称
 * @returns 返回可用性与推荐名称
 */
export function validateDigitalHumanTaskName(name: string) {
    return request({
        url: '/api/material/digital-human/task/validate-name/',
        method: 'post',
        data: { name },
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 删除快速生成任务（逻辑删除�?
 * @param id 任务ID
 * @returns 返回删除结果
 */
export function deleteFastTask(id: number | string) {
    return request({
        url: `/api/material/fast-task/delete/${id}/`,
        method: 'post'
    })
}

/**
 * 重推失败的快速生成任务
 * @param id 任务ID
 * @returns 返回重新入队结果
 */
export function retryFastTask(id: number | string) {
    return request({
        url: `/api/material/fast-task/retry/${id}/`,
        method: 'post'
    })
}

/**
 * 获取快速生成任务详�?
 * @param id 任务ID
 * @returns 返回任务详情
 */
export function getFastTaskDetail(id: number | string) {
    return request({
        url: `/api/material/fast-task/${id}/`,
        method: 'get'
    })
}

// ===== 视频生成相关接口 =====

/**
 * 创建视频生成任务
 * @param formData FormData 对象，包�?title, msg, voice_id, digital_human_id, language, speechRate, anchor_type, isSkipRs, video_cover_url, user_group�?
 * @returns 返回任务ID
 */
/**
 * 视频制作 - 直接上传音频（实时合成）
 */
export function createAudioVideoTask(formData: FormData, options: Record<string, any> = {}) {
    return request({
        url: '/api/material/video/realtime/',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        ...options
    })
}

export function createVideoTask(formData: FormData) {
    return request({
        url: '/api/material/video/task/create/',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * 分页查询视频生成任务
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回任务列表及分页信�?
 */
export function getVideoTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/video/task/paginate/post/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 获取今天视频单次生成还在等待的任务数
 */
export function getVideoTaskWaiting() {
    return request({
        url: '/api/material/video/task/waiting/',
        method: 'get'
    })
}

/**
 * 查询所有视频生成任务（不分页）
 * @returns 返回所有任务列�?
 */
export function getAllVideoTasks() {
    return request({
        url: '/api/material/video/task/all/',
        method: 'get'
    })
}

/**
 * 按ID查询视频生成任务
 * @param id 任务ID
 * @returns 返回单个任务详情
 */
export function getVideoTaskDetail(id: number | string) {
    return request({
        url: `/api/material/video/task/${id}/`,
        method: 'get'
    })
}

/**
 * 删除视频生成任务
 * @param id 任务ID
 * @returns 返回删除结果
 */
export function deleteVideoTask(id: number | string) {
    return request({
        url: `/api/material/video/task/delete/${id}/`,
        method: 'delete'
    })
}

// ===== 数字人相关接�?=====

/**
 * 获取数字人列表（用于选择数字人形象）
 * @param name 数字人名称搜索关键词（可选）
 * @returns 返回数字人列�?
 */
export function getDigitalHumanList(name?: string) {
    return request({
        url: '/api/material/digital-human/all/',
        method: 'get',
        params: {
            ...(name && { name })
        }
    })
}

// ===== 音频/配音相关接口 =====

/**
 * 获取音频列表（用于配音选择�?
 * @param name 音频名称搜索关键词（可选）
 * @returns 返回音频列表
 */
export function getVoiceList(name?: string) {
    return request({
        url: '/api/material/voice/all/',
        method: 'get',
        params: name ? { name } : {}
    })
}

/**
 * 分页查询音频
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回音频列表及分页信�?
 */
export function getVoicePaginateList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/voice/paginate/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

// ===== A2E 绑定关系接口 =====

/**
 * 分页查询绑定关系
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象（title, voiceName, digitalHumanName等）
 * @returns 返回绑定关系列表及分页信�?
 */
export function getBindingList(page: number = 1, pageSize: number = 10, search?: any) {
    return request({
        url: '/api/material/binding/paginate/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 创建绑定关系
 * @param data 包含 voiceId, digitalHumanId, title
 * @returns 返回新创建的绑定关系
 */
export function createBinding(data: any) {
    return request({
        url: '/api/material/binding/create/',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 更新绑定关系
 * @param id 绑定关系ID
 * @param data 包含 voiceId, digitalHumanId, title
 * @returns 返回更新后的绑定关系
 */
export function updateBinding(id: number | string, data: any) {
    return request({
        url: `/api/material/binding/update/${id}/`,
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 删除绑定关系
 * @param id 绑定关系ID
 * @returns 返回删除结果
 */
export function deleteBinding(id: number | string) {
    return request({
        url: `/api/material/binding/delete/${id}/`,
        method: 'post'
    })
}

// ===== 历史脚本相关接口 =====

/**
 * 创建历史脚本
 * @param data 包含 user_id, task_content, task_tags
 * @returns 返回创建/更新后的历史脚本
 */
export function createScriptHistory(data: any) {
    return request({
        url: '/api/material/script/history/create/',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 分页查询历史脚本
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回历史脚本列表及分页信�?
 */
export function getScriptHistoryList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/script/history/paginate/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 获取所有历史脚�?
 * @returns 返回所有历史脚本列�?
 */
export function getAllScriptHistory() {
    return request({
        url: '/api/material/script/history/all/',
        method: 'get'
    })
}

/**
 * 按ID获取历史脚本
 * @param taskId 任务ID
 * @returns 返回单个历史脚本详情
 */
export function getScriptHistoryById(taskId: number | string) {
    return request({
        url: `/api/material/script/history/${taskId}/`,
        method: 'get'
    })
}

/**
 * 更新历史脚本
 * @param taskId 任务ID
 * @param data 包含 task_tags, is_in_library
 * @returns 返回更新后的历史脚本
 */
export function updateScriptHistory(taskId: number | string, data: any) {
    return request({
        url: `/api/material/script/history/update/${taskId}/`,
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

// ===== 脚本库相关接�?=====

/**
 * 创建脚本�?
 * @param data 包含 script_title, script_content, script_tags, create_user_id, user_id_group
 * @returns 返回创建/更新后的脚本
 */
export function createScript(data: any) {
    return request({
        url: '/api/material/script/library/create/',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 更新脚本�?
 * @param scriptId 脚本ID
 * @param data 包含 script_title, script_content, script_tags
 * @returns 返回更新后的脚本
 */
export function updateScript(scriptId: number | string, data: any) {
    return request({
        url: `/api/material/script/library/update/${scriptId}/`,
        method: 'post',
        data,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 删除脚本�?
 * @param scriptId 脚本ID
 * @returns 返回删除结果
 */
export function deleteScript(scriptId: number | string) {
    return request({
        url: `/api/material/script/library/delete/${scriptId}/`,
        method: 'post'
    })
}

/**
 * 将脚本设置为组内公开
 * @param scriptIds 脚本ID数组
 * @param groupCode 组代�?
 * @returns 返回操作结果
 */
export function makeScriptGroupPublic(scriptIds: (number | string)[], groupCode: string) {
    return request({
        url: '/api/material/script/library/make-group-public/',
        method: 'post',
        data: {
            scriptIds,
            groupCode
        }
    })
}

// ===== 配音/文案生成相关接口 =====

/**
 * 创建配音任务（文案生成音频）
 * @param data 请求数据对象，包�?dubbing_name, msg, voice_external_id, country, speechRate
 * @returns 返回任务ID
 */
export function createDubbingTask(data: any) {
    return request({
        url: '/api/material/dubbing/create/',
        method: 'post',
        data: data
    })
}

/**
 * 分页查询配音任务
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回任务列表及分页信�?
 */
export function getDubbingTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/dubbing/paginate/post/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 删除配音任务
 * @param id 任务ID
 * @returns 返回删除结果
 */
export function deleteDubbingTask(id: number | string) {
    return request({
        url: `/api/material/dubbing/${id}/`,
        method: 'delete'
    })
}
/**
 * 获取单个配音任务的详细信息及状�?
 * @param id 任务ID
 * @returns 返回任务详情
 */
export function getDubbingTaskDetail(id: number | string) {
    return request({
        url: `/api/material/dubbing/${id}`,
        method: 'get'
    })
}
/**
 * 检查配音名称是否有效（是否重复�?
 * @param dubbingName 配音名称
 * @returns 返回检查结果，is_valid: true表示有效，false表示重复
 */
export function checkDubbingName(dubbingName: string) {
    return request({
        url: '/api/material/dubbing/check-name/',
        method: 'post',
        data: {
            dubbing_name: dubbingName
        }
    })
}

/**
 * 获取所有脚本库
 * @returns 返回所有脚本列�?
 */
export function getAllScripts() {
    return request({
        url: '/api/material/script/library/all/',
        method: 'get'
    })
}

/**
 * 按ID获取脚本�?
 * @param scriptId 脚本ID
 * @returns 返回单个脚本详情
 */
export function getScriptById(scriptId: number | string) {
    return request({
        url: `/api/material/script/library/${scriptId}/`,
        method: 'get'
    })
}

/**
 * 按标签查询脚本库（POST方式�?
 * @param tags 标签列表
 * @returns 返回匹配标签的脚本列�?
 */
export function getScriptsByTags(tags: string[]) {
    return request({
        url: '/api/material/script/library/by-tags/post/',
        method: 'post',
        data: {
            scriptTags: tags
        }
    })
}

/**
 * 分页查询脚本�?
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象
 * @returns 返回脚本列表及分页信�?
 */
export function getScriptPaginateList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/script/library/paginate/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 获取角标列表
 * @returns 返回角标列表
 */
export function getCornerMarkList() {
    return request({
        url: '/api/material/corner-mark/all/',
        method: 'get'
    })
}

/**
 * 分页查询角标素材
 * @param page 页码
 * @param pageSize 每页大小
 * @param search 搜索条件
 */
export function getCornerMarkPaginateList(page: number = 1, pageSize: number = 10, search: any = {}) {
    return request({
        url: '/api/material/corner-mark/paginate/',
        method: 'post',
        data: {
            page,
            pageSize,
            ...(search && { search })
        }
    })
}

/**
 * 创建角标素材
 * @param formData 角标表单数据
 */
export function createCornerMarkMaterial(formData: FormData) {
    return request({
        url: '/api/material/corner-mark/create/',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * 更新角标素材
 * @param formData 角标表单数据
 */
export function updateCornerMarkMaterial(formData: FormData) {
    return request({
        url: '/api/material/corner-mark/update/',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * 删除角标素材
 * @param cornerMarkId 角标主键
 */
export function deleteCornerMarkMaterial(cornerMarkId: number | string) {
    return request({
        url: '/api/material/corner-mark/delete/',
        method: 'post',
        data: { cornerMarkId },
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 校验角标名称是否可用
 * @param name 角标名称
 * @param cornerMarkId 编辑时可传当前主键
 */
export function validateCornerMarkName(name: string, cornerMarkId?: number | string) {
    return request({
        url: '/api/material/corner-mark/validate-name/',
        method: 'post',
        data: {
            name,
            ...(cornerMarkId !== undefined && cornerMarkId !== null ? { cornerMarkId } : {})
        },
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
}

/**
 * 角标置顶/取消置顶
 * @param id 角标ID
 */
export function toTopCornerMark(id: string | number) {
    return request({
        url: '/api/material/corner-mark/to-top/',
        method: 'post',
        data: { id }
    })
}

// ===== 字幕消除相关接口 =====

/**
 * 创建字幕消除任务（直接上传视频文件）
 * @param formData 包含 file（视频文件，必需）、title（任务标题，可选）
 * @returns 返回 { id } 任务ID
 */
export function createSubtitleRemoveTask(formData: FormData) {
    return request({
        url: '/api/material/subtitle-remove/task/create/',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

/**
 * 检查字幕消除任务标题是否重�?
 * @param title 标题名称
 * @returns { is_valid, title, recommended_name }
 */
export function checkSubtitleRemoveTitle(title: string) {
    return request({
        url: '/api/material/subtitle-remove/task/check-title/',
        method: 'post',
        data: { title },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 分页查询字幕消除任务列表
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @param search 搜索条件对象（taskStatus 等）
 * @returns 返回任务列表及分页信�?
 */
export function getSubtitleRemoveTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/subtitle-remove/task/paginate/',
        method: 'post',
        data: { page, pageSize, ...(search && { search }) }
    })
}

/**
 * 查询单个字幕消除任务
 * @param id 任务ID
 * @returns 返回任务详情
 */
export function getSubtitleRemoveTaskById(id: number | string) {
    return request({
        url: `/api/material/subtitle-remove/task/${id}/`,
        method: 'get'
    })
}

/**
 * 删除字幕消除任务
 * @param id 任务ID
 * @returns 返回删除结果
 */
export function deleteSubtitleRemoveTask(id: number | string) {
    return request({
        url: `/api/material/subtitle-remove/task/delete/${id}/`,
        method: 'post'
    })
}

// ===== 视频角标任务相关接口 =====

/**
 * 创建视频角标任务
 */
export function createCornerMarkTask(data: FormData) {
    return request({
        url: '/api/material/corner-mark-task/create/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

// 创建视频角标任务（直传模式 - 单文件）
export function createCornerMarkTaskDirectSingle(data: {
  file_name: string
  file_size: number
  content_type?: string
  sourcePhotoUrl: string
  title?: string
}) {
  return request({
    url: '/api/material/corner-mark/direct/create',
    method: 'post',
    data,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })
}

// 批量创建视频角标任务（直传模式 - 文件夹多文件）
export function createCornerMarkDirectBatch(data: {
  files: {
    name: string
    size: number
    content_type?: string
    relative_path?: string
  }[]
  sourcePhotoUrl: string
  title?: string
}) {
  return request({
    url: '/api/material/corner-mark/direct/batch-create',
    method: 'post',
    data,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })
}

// 确认 MinIO 上传完成
export function confirmCornerMarkUpload(data: {
  files: {
    file_id: string | number
    object_name: string
    file_size: number
  }[]
}) {
  return request({
    url: '/api/material/corner-mark/direct/upload-confirm',
    method: 'post',
    data,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })
}

/**
 * 批量创建视频角标任务（文件夹上传�?
 */
export function createCornerMarkBatchTask(data: FormData) {
    return request({
        url: '/api/material/corner-mark-task/batch/create/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

// ===== PromptWord / PromptTemplate 相关接口 =====

/** 获取当前用户分组提示�?*/
export function getPromptWordGroupedByUser() {
    return request({
        url: '/api/material/prompt-word/all/grouped/by-user/',
        method: 'get'
    })
}

/** 获取分组提示�?*/
export function getPromptWordGrouped() {
    return request({
        url: '/api/material/prompt-word/all/grouped/',
        method: 'get'
    })
}

/** 创建提示�?*/
export function createPromptWord(data: {
    name: string
    content: string
    type: 'positive' | 'negative'
    sort?: number
    to_top?: boolean
}) {
    return request({
        url: '/api/material/prompt-word/create/',
        method: 'post',
        data
    })
}

/** 获取当前用户分组提示词模�?*/
export function getPromptTemplateGroupedByUser() {
    return request({
        url: '/api/material/prompt-template/all/grouped/by-user/',
        method: 'get'
    })
}

/** 获取分组提示词模�?*/
export function getPromptTemplateGrouped() {
    return request({
        url: '/api/material/prompt-template/all/grouped/',
        method: 'get'
    })
}

/** 创建提示词模�?*/
export function createPromptTemplate(data: {
    name: string
    positive_content: string
    negative_content: string
    sort?: number
    to_top?: boolean
}) {
    return request({
        url: '/api/material/prompt-template/create/',
        method: 'post',
        data
    })
}

/**
 * 检查角标任务标题是否重�?
 */
export function checkCornerMarkTaskTitle(title: string) {
    return request({
        url: '/api/material/corner-mark-task/check-name/',
        method: 'post',
        data: { title },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 分页查询角标任务列表
 */
export function getCornerMarkTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/corner-mark-task/paginate/',
        method: 'post',
        data: { page, pageSize, ...(search && { search }) }
    })
}

/**
 * 分页查询角标批量任务列表
 */
export function getCornerMarkBatchTaskList(page: number = 1, pageSize: number = 20, search?: any) {
    return request({
        url: '/api/material/corner-mark-task/batch/paginate/',
        method: 'post',
        data: { page, pageSize, ...(search && { search }) }
    })
}

/**
 * 查询角标批量任务明细（子任务�?
 */
export function getCornerMarkBatchTaskDetail(id: number | string, page: number = 1, pageSize: number = 10) {
    return request({
        url: `/api/material/corner-mark-task/batch/detail/${id}/`,
        method: 'get',
        params: { page, pageSize }
    })
}

/**
 * 删除角标任务
 */
export function deleteCornerMarkTask(id: number | string) {
    return request({
        url: `/api/material/corner-mark-task/delete/${id}/`,
        method: 'delete'
    })
}

/**
 * 获取视频字幕预览帧（后端渲染�?
 * @param data 支持�?video_url（由后端提取首帧）或 frame_base64（直接作为背景帧），以及字幕样式参数
 * @returns 返回 base64 渲染结果�?
 */
export function getSubtitlePreviewFrame(data: {
    video_url?: string
    frame_base64?: string
    frame_time?: number
    process_types?: string[]
    preview_text?: string
    image_url?: string
    banner_overlay_base64?: string
    subtitle_config?: {
        font_size?: number
        margin_v?: number
        primary_colour?: string
        outline?: number
        outline_colour?: string
        bold?: number
        font_name?: string
        bg_mode?: string
        bg_height?: number
        blur_strength?: number
        bg_colour?: string
        blur_subtitles?: boolean
    }
}) {
    return request({
        url: '/api/material/video/preview-frame/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/**
 * 通过后端代理下载文件（解决跨域问题）
 * @param fileUrl 需要下载的文件 URL
 */
export function downloadFileByProxy(fileUrl: string, taskId?: string | number, assetType?: string) {
    return request({
        url: '/api/material/download-proxy/',
        method: 'get',
        params: {
            url: fileUrl,
            ...(taskId !== undefined && taskId !== null ? { taskId } : {}),
            ...(assetType ? { assetType } : {}),
        },
        responseType: 'blob',
        timeout: 120000
    })
}

// ===== 字幕模板 (SubtitleTemplate) 相关接口 =====

/** 获取当前用户所有字幕模�?*/
export function getSubtitleTemplateAll() {
    return request({
        url: '/api/material/subtitle-template/all/',
        method: 'get'
    })
}

/** 创建字幕模板 */
export function createSubtitleTemplate(data: { subtitleTemplateName: string; subtitleConfig: string }) {
    return request({
        url: '/api/material/subtitle-template/create/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/** 更新字幕模板 */
export function updateSubtitleTemplate(data: { id: number; subtitleTemplateName?: string; subtitleConfig?: string }) {
    return request({
        url: '/api/material/subtitle-template/update/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/** 删除字幕模板（逻辑删除�?*/
export function deleteSubtitleTemplate(id: number) {
    return request({
        url: '/api/material/subtitle-template/delete/',
        method: 'post',
        data: { id },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

/** 获取用户最近使用的角标列表 */
export function getRecentCornerMarks() {
    return request({
        url: '/api/material/corner-mark/recent/',
        method: 'get'
    })
}

/** 记录用户选择的角�?*/
export function recordRecentCornerMark(cornerMarkId: number | string) {
    return request({
        url: '/api/material/corner-mark/record-recent/',
        method: 'post',
        data: { corner_mark_id: cornerMarkId },
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
}

// ===== ������� (TestBannerOverlay) ��ؽӿ� =====

/** ������ӳ�ʼ�� */
export function bannerOverlayInit(data: { background_url: string; overlay_url: string; default_scale?: number }) {
    return request({ url: '/api/material/banner-overlay/init/', method: 'post', data, headers: { 'Content-Type': 'application/json;charset=UTF-8' } })
}

/** �������Ԥ�� */
export function bannerOverlayPreview(data: { background_base64: string; overlay_base64: string; x?: number; y?: number; scale_x?: number; scale_y?: number; rotate?: number; opacity?: number }) {
    return request({ url: '/api/material/banner-overlay/preview/', method: 'post', data, headers: { 'Content-Type': 'application/json;charset=UTF-8' } })
}

/** ������ӱ��� */
export function bannerOverlaySave(data: { background_base64: string; overlay_base64: string; x?: number; y?: number; scale_x?: number; scale_y?: number; rotate?: number; opacity?: number; file_name?: string; title?: string; background_url?: string; overlay_url?: string }) {
    return request({ url: '/api/material/banner-overlay/save/', method: 'post', data, headers: { 'Content-Type': 'application/json;charset=UTF-8' } })
}

export function getVideoDurationStats(data: { xAxis: string[]; title?: string }) {
    return request({
        url: '/api/material/video/task/stats-duration/',
        method: 'post',
        data
    })
}

export function getBindingStats(data: { xAxis: string[]; title?: string }) {
    return request({
        url: '/api/material/stats/binding/',
        method: 'post',
        data
    })
}

export function getDigitalHumanStats(data: { xAxis: string[]; title?: string }) {
    return request({
        url: '/api/material/stats/digital-human/',
        method: 'post',
        data
    })
}

export function getVoiceStats(data: { xAxis: string[]; title?: string }) {
    return request({
        url: '/api/material/stats/voice/',
        method: 'post',
        data
    })
}

export function syncWindowsShareFolder(data: {
    folder_id: number | string
    folder_real_path?: string
}) {
    return request({
        url: '/api/material/sync/windows-share/folder/',
        method: 'post',
        data,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        timeout: 120000
    })
}


export function getDigitalHumanTaskStatusStats(data: any) {
  return request({
    url: '/api/material/a2e/task-stats/digital-human/',
    method: 'post',
    data
  })
}

export function getFastTaskStatusStats(data: any) {
  return request({
    url: '/api/material/a2e/task-stats/fast-task/',
    method: 'post',
    data
  })
}

export function getPlanVideoTaskStatusStats(data: any) {
  return request({
    url: '/api/material/a2e/task-stats/plan-video/',
    method: 'post',
    data
  })
}

export function getVideoTaskStatusStats(data: any) {
  return request({
    url: '/api/material/a2e/task-stats/video/',
    method: 'post',
    data
  })
}

