# 视频角标任务 API 文档

## 基础信息
- **基础URL**: `/api/material/corner-mark-task/`
- **Content-Type**: `application/json`

---

## 1. 创建视频角标任务
**请求方式**: `POST`  
**URL**: `/api/material/corner-mark-task/create/`  
**需要认证**: 是（需要在请求头中包含 token）

### 请求 JSON 示例
```json
{
    "title": "我的角标任务",
    "sourceVideoUrl": "https://example.com/video.mp4",
    "cornerMarkImageUrl": "https://example.com/mark.png"
}
```

### 请求参数说明
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 角标任务标题 |
| sourceVideoUrl | string | 是 | 源视频URL |
| cornerMarkImageUrl | string | 是 | 角标图片URL |

### 返回示例
**成功 (200)**
```json
{
    "code": 0,
    "data": {
        "id": 1,
        "title": "我的角标任务",
        "taskId": "550e8400-e29b-41d4-a716-446655440000",
        "sourceVideoUrl": "https://example.com/video.mp4",
        "cornerMarkImageUrl": "https://example.com/mark.png",
        "outputVideoUrl": null,
        "taskStatus": 0,
        "userId": 123,
        "userGroup": "default",
        "deleted": "0",
        "createTime": "2026-03-20T10:00:00Z",
        "updateTime": "2026-03-20T10:00:00Z"
    },
    "msg": "视频角标任务创建成功，已推送到队列"
}
```

**失败 (400)**
```json
{
    "code": 400,
    "data": {
        "recommendedName": "我的角标任务2"
    },
    "msg": "标题已存在，建议使用：我的角标任务2"
}
```

---

## 2. 获取视频角标任务详情
**请求方式**: `GET`  
**URL**: `/api/material/corner-mark-task/{id}/`

### 返回示例
**成功 (200)**
```json
{
    "code": 0,
    "data": {
        "id": 1,
        "title": "我的角标任务",
        "taskId": "550e8400-e29b-41d4-a716-446655440000",
        "sourceVideoUrl": "https://example.com/video.mp4",
        "cornerMarkImageUrl": "https://example.com/mark.png",
        "outputVideoUrl": "https://example.com/output.mp4",
        "taskStatus": 5,
        "userId": 123,
        "userGroup": "default",
        "deleted": "0",
        "createTime": "2026-03-20T10:00:00Z",
        "updateTime": "2026-03-20T10:05:00Z"
    },
    "msg": "获取成功"
}
```

---

## 3. 获取所有视频角标任务
**请求方式**: `GET`  
**URL**: `/api/material/corner-mark-task/all/`

### 返回示例
**成功 (200)**
```json
{
    "code": 0,
    "data": [
        {
            "id": 1,
            "title": "我的角标任务",
            "taskId": "550e8400-e29b-41d4-a716-446655440000",
            "sourceVideoUrl": "https://example.com/video.mp4",
            "cornerMarkImageUrl": "https://example.com/mark.png",
            "outputVideoUrl": "https://example.com/output.mp4",
            "taskStatus": 5,
            "userId": 123,
            "userGroup": "default",
            "deleted": "0",
            "createTime": "2026-03-20T10:00:00Z",
            "updateTime": "2026-03-20T10:05:00Z"
        }
    ],
    "msg": "获取成功"
}
```

---

## 4. 分页查询视频角标任务
**请求方式**: `POST`  
**URL**: `/api/material/corner-mark-task/paginate/`  
**需要认证**: 是

### 请求 JSON 示例
```json
{
    "page": 1,
    "pageSize": 10,
    "search": {
        "taskStatus": 0
    }
}
```

### 请求参数说明
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认为 1 |
| pageSize | int | 否 | 每页数量，默认为 10 |
| search | object | 否 | 搜索条件对象 |
| search.taskStatus | int | 否 | 按任务状态搜索（0=初始, 1=处理中, 2=等待, 5=完成, -1=失败） |

### 返回示例
**成功 (200)**
```json
{
    "code": 0,
    "data": {
        "total": 100,
        "pageNum": 1,
        "pageSize": 10,
        "records": [
            {
                "id": 1,
                "title": "我的角标任务",
                "taskId": "550e8400-e29b-41d4-a716-446655440000",
                "sourceVideoUrl": "https://example.com/video.mp4",
                "cornerMarkImageUrl": "https://example.com/mark.png",
                "outputVideoUrl": "https://example.com/output.mp4",
                "taskStatus": 5,
                "userId": 123,
                "userGroup": "default",
                "deleted": "0",
                "createTime": "2026-03-20T10:00:00Z",
                "updateTime": "2026-03-20T10:05:00Z"
            }
        ]
    },
    "msg": "查询成功"
}
```

---

## 5. 删除视频角标任务
**请求方式**: `DELETE`  
**URL**: `/api/material/corner-mark-task/delete/{id}/`

### 返回示例
**成功 (200)**
```json
{
    "code": 0,
    "data": null,
    "msg": "删除成功"
}
```

---

## 6. 检查视频角标任务标题是否重复
**请求方式**: `POST`  
**URL**: `/api/material/corner-mark-task/check-name/`

### 请求 JSON 示例
```json
{
    "title": "我的角标任务"
}
```

### 返回示例
**成功 - 标题可用 (200)**
```json
{
    "code": 0,
    "data": {
        "isValid": true,
        "recommendedName": ""
    },
    "msg": "检查成功"
}
```

**成功 - 标题已存在 (200)**
```json
{
    "code": 0,
    "data": {
        "isValid": false,
        "recommendedName": "我的角标任务2"
    },
    "msg": "检查成功"
}
```

---

## 任务状态说明
| 状态值 | 状态名 | 说明 |
|--------|--------|------|
| -1 | failed | 失败 |
| 0 | init | 初始化 |
| 1 | processing | 处理中 |
| 2 | pending | 等待中 |
| 5 | success | 完成 |

---

## 错误响应示例
```json
{
    "code": 400,
    "data": null,
    "msg": "标题不能为空"
}
```

---

## 常见错误码
| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误或业务逻辑错误 |
| 401 | 未授权，需要登录 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

