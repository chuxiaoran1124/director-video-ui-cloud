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
| videoContent | string | 是 | base64编码的视频文件内容 |
| videoName | string | 是 | 视频文件名称 |
| sourcePhotoUrl | string | 是 | 角标图片URL（由前端直接提供） |

### 返回示例
**成功 (200)**
```json
{
    "code": 0,
    "data": {
        "id": 1,
        "title": "我的角标任务",
        "taskId": "550e8400-e29b-41d4-a716-446655440000",
        "sourceVideoUrl": "",
        "sourcePhotoUrl": "https://example.com/mark.png",
        "outputVideoUrl": null,
        "taskStatus": 0,
        "userId": 123,
        "userGroup": "default",
        "deleted": "0",
        "createTime": "2026-03-20T10:00:00Z",
        "updateTime": "2026-03-20T10:00:00Z"
    },
    "msg": "视频角标任务创建成功，视频上传处理中"
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

---

## 7. 批量创建视频角标任务（新增）
**请求方式**: `POST`  
**完整URL**: `/api/material/corner-mark-task/batch/create/`  
**需要认证**: 是（`Authorization: Bearer {token}`）  
**Content-Type**: `multipart/form-data`

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sourcePhotoUrl | string | 是 | 批次统一角标图片 URL |
| files | file[] | 是 | 文件夹中的视频文件数组（同名参数多次上传） |
| title | string | 否 | 批次标题，未传默认 `角标批量任务` |

### 前端 FormData 示例
```javascript
const fd = new FormData();
fd.append('sourcePhotoUrl', 'https://xxx.com/corner.png');
fd.append('title', '5月活动批次');
files.forEach((f) => fd.append('files', f));

await request.post('/api/material/corner-mark-task/batch/create/', fd, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### cURL 示例
```bash
curl -X POST "http://{host}/api/material/corner-mark-task/batch/create/" \
  -H "Authorization: Bearer {token}" \
  -F "sourcePhotoUrl=https://xxx.com/corner.png" \
  -F "title=5月活动批次" \
  -F "files=@/path/a.mp4" \
  -F "files=@/path/b.mp4"
```

### 返回示例
**成功 (200)**
```json
{
  "code": 0,
  "data": {
    "batchId": 12,
    "totalCount": 2,
    "status": 0
  },
  "msg": "批量角标任务已创建，正在异步处理"
}
```

**失败 (400/401)**
```json
{
  "code": 400,
  "data": null,
  "msg": "files不能为空"
}
```

### 批量任务状态说明（当前实现）
| 字段 | 状态值 | 说明 |
|------|--------|------|
| batch.status | -1 | 全部失败 |
| batch.status | 0 | 刚创建（初始） |
| batch.status | 1 | 部分/全部处理中 |
| batch.status | 2 | 全部处理完成（含成功或失败） |
| batch_item.status | -1 | 子任务失败（上传或入队失败） |
| batch_item.status | 0 | 子任务初始化 |
| batch_item.status | 1 | 子任务处理中（上传中） |
| batch_item.status | 2 | 子任务已提交第三方处理队列 |

> 说明：`batch_item.status=2` 表示“已提交第三方处理”，不等于第三方最终出片完成。

---

## 8. 批量查询（新增）
**请求方式**: `POST`  
**完整URL**: `/api/material/corner-mark-task/batch/paginate/`  
**需要认证**: 是（`Authorization: Bearer {token}`）  
**Content-Type**: `application/json`

### 请求 JSON 示例
```json
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "title": "5月活动",
    "status": 1
  }
}
```

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 10 |
| search | object | 否 | 搜索条件 |
| search.title | string | 否 | 批次标题模糊匹配 |
| search.status | int | 否 | 批次状态（-1/0/1/2） |

### 返回示例
```json
{
  "code": 0,
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 3,
    "data": [
      {
        "id": 12,
        "title": "5月活动批次",
        "sourcePhotoUrl": "https://xxx.com/corner.png",
        "totalCount": 20,
        "successCount": 8,
        "failedCount": 1,
        "processingCount": 11,
        "status": 1,
        "userId": 1001,
        "deleted": "0",
        "createTime": "2026-05-12T09:20:00+08:00",
        "updateTime": "2026-05-12T09:25:30+08:00"
      }
    ]
  },
  "msg": "查询成功"
}
```

---

## 9. 批次子任务明细（新增）
**请求方式**: `GET`  
**完整URL**: `/api/material/corner-mark-task/batch/detail/{id}/`  
**需要认证**: 是（`Authorization: Bearer {token}`）

### Query 参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 子任务页码，默认 1 |
| pageSize | int | 否 | 子任务每页数量，默认 10 |

### 请求示例
`GET /api/material/corner-mark-task/batch/detail/12/?page=1&pageSize=10`

### 返回示例
```json
{
  "code": 0,
  "data": {
    "batch": {
      "id": 12,
      "title": "5月活动批次",
      "sourcePhotoUrl": "https://xxx.com/corner.png",
      "totalCount": 20,
      "successCount": 8,
      "failedCount": 1,
      "processingCount": 11,
      "status": 1,
      "userId": 1001,
      "deleted": "0",
      "createTime": "2026-05-12T09:20:00+08:00",
      "updateTime": "2026-05-12T09:25:30+08:00"
    },
    "items": {
      "page": 1,
      "pageSize": 10,
      "total": 20,
      "data": [
        {
          "id": 101,
          "batchId": 12,
          "title": "5月活动批次-1",
          "sourcePhotoUrl": "https://xxx.com/corner.png",
          "sourceVideoUrl": "http://minio/video/corner_mark_service/a.mp4",
          "outputVideoUrl": null,
          "status": 2,
          "errorMsg": null,
          "taskId": "2f3a9bcd",
          "singleTaskId": 5601,
          "userId": 1001,
          "deleted": "0",
          "createTime": "2026-05-12T09:20:00+08:00",
          "updateTime": "2026-05-12T09:20:03+08:00"
        }
      ]
    }
  },
  "msg": "查询成功"
}
```
