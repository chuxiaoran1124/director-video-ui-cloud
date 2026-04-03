## 字幕消除任务模块 (Subtitle Remove)

### 已创建的文件结构

#### 1. 模型层 (Models)
- **文件**: `material/models/A2ESubtitleRemoveModels.py`
- **主要模型**: `A2ESubtitleRemoveTask`
- **字段**:
  - `id` - 主键
  - `external_id` - 外部任务ID
  - `task_id` - 调度系统任务ID
  - `source_type` - 源视频类型 (video_realtime/video_scheduled)
  - `source_id` - 源视频ID
  - `source_video_url` - 源视频URL
  - `output_video_url` - 消除后视频URL
  - `task_status` - 任务状态 (0=待处理, 1=处理中, 2=轮询中, 5=已完成, -1=失败)
  - `progress` - 处理进度(%)
  - `error_message` - 错误信息
  - `user_id` - 用户ID
  - `user_group` - 用户组
  - `create_time` - 创建时间
  - `update_time` - 更新时间
  - `deleted` - 是否删除

#### 2. 序列化器 (Serializer)
- **文件**: `material/serializer/A2ESubtitleRemoveTaskSerializer.py`
- **类**: `A2ESubtitleRemoveTaskSerializer`
- **驼峰命名映射**:
  - externalId ↔ external_id
  - taskId ↔ task_id
  - sourceType ↔ source_type
  - sourceId ↔ source_id
  - sourceVideoUrl ↔ source_video_url
  - outputVideoUrl ↔ output_video_url
  - taskStatus ↔ task_status
  - errorMessage ↔ error_message
  - userId ↔ user_id
  - userGroup ↔ user_group
  - createTime ↔ create_time
  - updateTime ↔ update_time

#### 3. 服务层 (Service)
- **文件**: `material/service/A2ESubtitleRemoveService/A2ESubtitleRemoveTaskService.py`
- **主要方法**:
  - `upsert_subtitle_remove_task(**kwargs)` - 创建或更新任务
  - `get_task_by_id(id_)` - 根据ID获取任务
  - `get_task_by_task_id(task_id)` - 根据调度任务ID获取
  - `get_task_by_source(source_type, source_id)` - 根据源获取
  - `get_all_tasks(source_type=None, task_status=None)` - 获取所有任务
  - `get_task_paginate(page=1, page_size=10, search=None)` - 分页查询
  - `delete_task(id_)` - 删除任务
  - `update_task_status(id_, task_status, progress=None, error_message=None)` - 更新状态

#### 4. 视图层 (Views)
- **文件**: `material/views/A2ESubtitleRemoveViews/A2ESubtitleRemoveTaskViews.py`
- **视图类**:
  - `A2ESubtitleRemoveTaskCreateView` - 创建任务
  - `A2ESubtitleRemoveTaskDeleteView` - 删除任务
  - `A2ESubtitleRemoveTaskGetAllView` - 获取所有任务
  - `A2ESubtitleRemoveTaskGetByIdView` - 根据ID获取任务
  - `A2ESubtitleRemoveTaskPaginateView` - 分页查询
  - `A2ESubtitleRemoveTaskUpdateStatusView` - 更新任务状态

### API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/material/subtitle-remove/task/create/` | 创建字幕消除任务 |
| POST | `/api/material/subtitle-remove/task/delete/<id>/` | 删除字幕消除任务 |
| GET | `/api/material/subtitle-remove/task/all/` | 获取所有字幕消除任务 |
| GET | `/api/material/subtitle-remove/task/<id>/` | 根据ID获取字幕消除任务 |
| POST | `/api/material/subtitle-remove/task/paginate/` | 分页查询字幕消除任务 |
| POST | `/api/material/subtitle-remove/task/update-status/<id>/` | 更新任务状态 |

### 使用示例

#### 创建字幕消除任务
```json
POST /api/material/subtitle-remove/task/create/
{
  "sourceType": "video_realtime",
  "sourceId": 1,
  "sourceVideoUrl": "https://example.com/video.mp4"
}
```

#### 分页查询
```json
POST /api/material/subtitle-remove/task/paginate/
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "sourceType": "video_realtime",
    "taskStatus": 1
  }
}
```

#### 更新任务状态
```json
POST /api/material/subtitle-remove/task/update-status/1/
{
  "taskStatus": 5,
  "progress": 100,
  "errorMessage": null
}
```

### 与 VideoAPIService 的集成

在 `api/service/VideoAPIService/VideoAPIService.py` 中已添加：
- `submit_subtitle_remove_task(data_id, video_url, task_service="subtitle_remove", step1_type=1, step1_worker=1)`

### 与 handle_task.py 的集成

在 `scheduling/service/handle_task.py` 中已实现：
- `execute_video_subtitle_remove(task_id, worker_id, data_id)` - 字幕消除任务执行函数

工作流程：
1. 调用 VideoAPIService.submit_subtitle_remove_task() 提交任务
2. 轮询 Redis key: `video:post-production:{service}:{data_id}`
3. 检查 `step1_status == '2'` 表示完成
4. 获取 `output_url` 并回写数据库

### 数据库表
- 表名: `material_a2e_subtitle_remove_task`
- 包含索引: source_type+source_id, task_status, user_id

### 认证要求
所有API端点均需要 Bearer Token 认证，通过 HTTP_AUTHORIZATION 头传递。

