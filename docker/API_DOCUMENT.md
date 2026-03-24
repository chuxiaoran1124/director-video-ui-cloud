# Script 管理 API 文档

## 基础信息
- **Base URL**: `/api/material`
- **请求格式**: JSON
- **响应格式**: JSON

---

## 一、历史任务列表 API

### 1.1 创建历史任务
**终点**: `POST /api/material/script/history/create/`

**说明**: 创建新的历史任务。如果脚本内容相同，则更新创建日期到最新。

**请求示例**:
```json
{
    "user_id": 1,
    "task_content": "生成一个视频，背景是蓝色",
    "task_tags": ["视频", "生成", "蓝色"]
}
```

**或使用驼峰命名**:
```json
{
    "userId": 1,
    "taskContent": "生成一个视频，背景是蓝色",
    "taskTags": ["视频", "生成", "蓝色"]
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "taskId": 1,
        "taskContent": "生成一个视频，背景是蓝色",
        "taskTags": ["视频", "生成", "蓝色"],
        "usedTime": "2026-03-08T12:30:45Z",
        "editTime": "2026-03-08T12:30:45Z",
        "isInLibrary": false
    },
    "message": "创建/更新成功"
}
```

---

### 1.2 获取历史任务分页
**终点**: `POST /api/material/script/history/paginate/`

**说明**: 分页查询历史任务，支持按内容、用户ID、标签过滤。

**请求示例**:
```json
{
    "page": 1,
    "pageSize": 10,
    "search": {
        "taskContent": "视频",
        "userId": 1,
        "taskTags": ["视频", "生成"]
    }
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "page": 1,
        "pageSize": 10,
        "data": [
            {
                "taskId": 1,
                "taskContent": "生成一个视频",
                "taskTags": ["视频", "生成"],
                "usedTime": "2026-03-08T12:30:45Z",
                "editTime": "2026-03-08T12:30:45Z",
                "isInLibrary": false
            }
        ],
        "total": 1
    },
    "message": "获取成功"
}
```

---

### 1.3 获取所有历史任务
**终点**: `GET /api/material/script/history/all/`

**说明**: 获取所有未删除的历史任务列表。

**成功响应** (200):
```json
{
    "code": 200,
    "data": [
        {
            "taskId": 1,
            "taskContent": "生成一个视频",
            "taskTags": ["视频", "生成"],
            "usedTime": "2026-03-08T12:30:45Z",
            "editTime": "2026-03-08T12:30:45Z",
            "isInLibrary": false
        }
    ],
    "message": "获取成功"
}
```

---

### 1.4 根据ID获取历史任务
**终点**: `GET /api/material/script/history/<task_id>/`

**说明**: 根据任务ID获取单条历史任务。

**URL 示例**: `GET /api/material/script/history/1/`

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "taskId": 1,
        "taskContent": "生成一个视频",
        "taskTags": ["视频", "生成"],
        "usedTime": "2026-03-08T12:30:45Z",
        "editTime": "2026-03-08T12:30:45Z",
        "isInLibrary": false
    },
    "message": "获取成功"
}
```

---

### 1.5 更新历史任务状态
**终点**: `POST /api/material/script/history/update/<task_id>/`

**说明**: 更新历史任务的标签和是否入库状态。入库时会自动创建脚本库记录。

**请求示例**:
```json
{
    "task_tags": ["视频", "生成修改后"],
    "is_in_library": true
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "taskId": 1,
        "taskContent": "生成一个视频",
        "taskTags": ["视频", "生成修改后"],
        "usedTime": "2026-03-08T12:30:45Z",
        "editTime": "2026-03-08T12:30:45Z",
        "isInLibrary": true
    },
    "message": "更新成功"
}
```

---

## 二、脚本库 API

### 2.1 创建脚本
**终点**: `POST /api/material/script/library/create/`

**说明**: 创建新脚本。如果脚本内容相同，则更新创建时间到最新。

**请求示例**:
```json
{
    "script_title": "蓝色背景视频生成脚本",
    "script_content": "生成一个视频，背景是蓝色，角色站在中央",
    "script_tags": ["视频", "蓝色", "生成"],
    "create_user_id": 1,
    "user_id_group": "admin"
}
```

**或使用驼峰命名**:
```json
{
    "scriptTitle": "蓝色背景视频生成脚本",
    "scriptContent": "生成一个视频，背景是蓝色，角色站在中央",
    "scriptTags": ["视频", "蓝色", "生成"],
    "createUserId": 1,
    "userIdGroup": "admin"
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "scriptId": 1,
        "scriptTitle": "蓝色背景视频生成脚本",
        "scriptContent": "生成一个视频，背景是蓝色，角色站在中央",
        "scriptTags": ["视频", "蓝色", "生成"],
        "scriptCreateUserId": 1,
        "scriptUserIdGroup": "admin",
        "scriptCreateTime": "2026-03-08T12:30:45Z",
        "scriptEditTime": "2026-03-08T12:30:45Z"
    },
    "message": "创建/更新成功"
}
```

---

### 2.2 更新脚本
**终点**: `POST /api/material/script/library/update/<script_id>/`

**说明**: 更新脚本的标题、内容或标签。

**请求示例**:
```json
{
    "script_title": "蓝色背景视频生成脚本 v2",
    "script_content": "生成一个视频，背景是蓝色，角色站在中央，添加背景音乐",
    "script_tags": ["视频", "蓝色", "生成", "音乐"]
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "scriptId": 1,
        "scriptTitle": "蓝色背景视频生成脚本 v2",
        "scriptContent": "生成一个视频，背景是蓝色，角色站在中央，添加背景音乐",
        "scriptTags": ["视频", "蓝色", "生成", "音乐"],
        "scriptCreateUserId": 1,
        "scriptUserIdGroup": "admin",
        "scriptCreateTime": "2026-03-08T12:30:45Z",
        "scriptEditTime": "2026-03-08T12:30:50Z"
    },
    "message": "更新成功"
}
```

---

### 2.3 删除脚本
**终点**: `POST /api/material/script/library/delete/<script_id>/`

**说明**: 删除脚本（逻辑删除，标记 deleted=true）。

**URL 示例**: `POST /api/material/script/library/delete/1/`

**请求体**: 空

**成功响应** (200):
```json
{
    "code": 200,
    "data": null,
    "message": "删除成功"
}
```

---

### 2.4 获取所有脚本
**终点**: `GET /api/material/script/library/all/`

**说明**: 获取所有未删除的脚本库记录。

**成功响应** (200):
```json
{
    "code": 200,
    "data": [
        {
            "scriptId": 1,
            "scriptTitle": "蓝色背景视频生成脚本",
            "scriptContent": "生成一个视频，背景是蓝色",
            "scriptTags": ["视频", "蓝色", "生成"],
            "scriptCreateUserId": 1,
            "scriptUserIdGroup": "admin",
            "scriptCreateTime": "2026-03-08T12:30:45Z",
            "scriptEditTime": "2026-03-08T12:30:45Z"
        }
    ],
    "message": "获取成功"
}
```

---

### 2.5 根据ID获取脚本
**终点**: `GET /api/material/script/library/<script_id>/`

**说明**: 根据脚本ID获取单条脚本记录。

**URL 示例**: `GET /api/material/script/library/1/`

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "scriptId": 1,
        "scriptTitle": "蓝色背景视频生成脚本",
        "scriptContent": "生成一个视频，背景是蓝色",
        "scriptTags": ["视频", "蓝色", "生成"],
        "scriptCreateUserId": 1,
        "scriptUserIdGroup": "admin",
        "scriptCreateTime": "2026-03-08T12:30:45Z",
        "scriptEditTime": "2026-03-08T12:30:45Z"
    },
    "message": "获取成功"
}
```

---

### 2.6 根据标签查询脚本（GET）
**终点**: `GET /api/material/script/library/by-tags/`

**说明**: 根据标签查询脚本库，支持单个或多个标签（逗号分隔）。任意一个标签匹配即可。

**URL 示例**: 
- `GET /api/material/script/library/by-tags/?tags=视频`
- `GET /api/material/script/library/by-tags/?tags=视频,蓝色`
- `GET /api/material/script/library/by-tags/?scriptTags=视频,蓝色`

**成功响应** (200):
```json
{
    "code": 200,
    "data": [
        {
            "scriptId": 1,
            "scriptTitle": "蓝色背景视频生成脚本",
            "scriptContent": "生成一个视频，背景是蓝色",
            "scriptTags": ["视频", "蓝色", "生成"],
            "scriptCreateUserId": 1,
            "scriptUserIdGroup": "admin",
            "scriptCreateTime": "2026-03-08T12:30:45Z",
            "scriptEditTime": "2026-03-08T12:30:45Z"
        }
    ],
    "message": "获取成功"
}
```

---

### 2.7 根据标签查询脚本（POST）
**终点**: `POST /api/material/script/library/by-tags/post/`

**说明**: 根据标签查询脚本库（POST方式），支持单个或多个标签。

**请求示例**:
```json
{
    "tags": ["视频", "蓝色"]
}
```

**或使用 scriptTags**:
```json
{
    "scriptTags": ["视频", "蓝色"]
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": [
        {
            "scriptId": 1,
            "scriptTitle": "蓝色背景视频生成脚本",
            "scriptContent": "生成一个视频，背景是蓝色",
            "scriptTags": ["视频", "蓝色", "生成"],
            "scriptCreateUserId": 1,
            "scriptUserIdGroup": "admin",
            "scriptCreateTime": "2026-03-08T12:30:45Z",
            "scriptEditTime": "2026-03-08T12:30:45Z"
        }
    ],
    "message": "获取成功"
}
```

---

### 2.8 分页查询脚本库
**终点**: `POST /api/material/script/library/paginate/`

**说明**: 分页查询脚本库，支持按标题、内容、标签、时间范围过滤。

**请求示例**:
```json
{
    "page": 1,
    "pageSize": 10,
    "search": {
        "scriptTitle": "蓝色",
        "scriptContent": "视频",
        "scriptTags": ["视频", "蓝色"],
        "startTime": "2026-03-01T00:00:00Z",
        "endTime": "2026-03-31T23:59:59Z"
    }
}
```

**成功响应** (200):
```json
{
    "code": 200,
    "data": {
        "page": 1,
        "pageSize": 10,
        "data": [
            {
                "scriptId": 1,
                "scriptTitle": "蓝色背景视频生成脚本",
                "scriptContent": "生成一个视频，背景是蓝色",
                "scriptTags": ["视频", "蓝色", "生成"],
                "scriptCreateUserId": 1,
                "scriptUserIdGroup": "admin",
                "scriptCreateTime": "2026-03-08T12:30:45Z",
                "scriptEditTime": "2026-03-08T12:30:45Z"
            }
        ],
        "total": 1
    },
    "message": "获取成功"
}
```

---

## 三、错误响应

### 常见错误码

| 错误码 | 说明 | 示例响应 |
|-------|------|--------|
| 400 | 请求参数错误或必填字段缺失 | `{"code": 400, "data": null, "message": "用户ID和脚本内容必填"}` |
| 404 | 资源不存在 | `{"code": 400, "data": null, "message": "任务不存在"}` |
| 500 | 服务器内部错误 | `{"code": 500, "data": null, "message": "系统内部错误"}` |

---

## 四、字段说明

### 标签格式
- **存储格式**: `|标签1|标签2|标签3|`（pipe分隔）
- **输入格式**: 列表 `["标签1", "标签2"]` 或 字符串 `"标签1,标签2"`
- **输出格式**: 列表 `["标签1", "标签2"]`

### 时间字段
- **格式**: ISO 8601（如 `2026-03-08T12:30:45Z`）
- **时区**: UTC

### 状态字段
- **isInLibrary**: 历史任务是否已加入脚本库（true/false）
- **deleted**: 是否已删除，查询接口自动过滤 deleted=true 的记录

---

## 五、常见场景

### 场景1：从历史任务入库到脚本库
```
1. POST /api/material/script/history/create/ 
   → 创建历史任务

2. POST /api/material/script/history/update/{task_id}/
   → 更新 is_in_library=true
   → 自动创建脚本库记录

3. GET /api/material/script/library/{script_id}/
   → 验证脚本库记录是否已创建
```

### 场景2：根据标签快速查找脚本
```
GET /api/material/script/library/by-tags/?tags=视频,蓝色
或
POST /api/material/script/library/by-tags/post/
{
    "scriptTags": ["视频", "蓝色"]
}
```

### 场景3：添加重复脚本内容处理
```
POST /api/material/script/library/create/
{
    "scriptTitle": "脚本1",
    "scriptContent": "相同的内容"
    ...
}
→ 第一次：创建新记录
→ 第二次：更新create_time和edit_time，不创建新记录
```


