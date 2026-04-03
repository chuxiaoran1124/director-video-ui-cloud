## 字幕消除任务 - API 对接文档

### API 端点概览

| 功能 | 方法 | 端点 | 认证 |
|------|------|------|------|
| 创建任务 | POST | `/api/material/subtitle-remove/task/create/` | ✓ |
| 查询单个 | GET | `/api/material/subtitle-remove/task/<id>/` | ✓ |
| 查询列表 | GET | `/api/material/subtitle-remove/task/all/` | ✓ |
| 分页查询 | POST | `/api/material/subtitle-remove/task/paginate/` | ✓ |
| 删除任务 | POST | `/api/material/subtitle-remove/task/delete/<id>/` | ✓ |
| 更新状态 | POST | `/api/material/subtitle-remove/task/update-status/<id>/` | ✓ |

---

### 1. 创建字幕消除任务

**请求**
```
POST /api/material/subtitle-remove/task/create/
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parameters:
- file: 视频文件（必需）
- title: 任务标题（可选）
```

**响应**
```json
{
  "code": 200,
  "data": {
    "id": 1
  },
  "message": "字幕消除任务已创建，正在异步处理"
}
```

---

### 2. 分页查询

**请求**
```
POST /api/material/subtitle-remove/task/paginate/
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "taskStatus": 1
  }
}
```

**响应**
```json
{
  "code": 200,
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "data": [
      {
        "id": 1,
        "title": "字幕消除",
        "sourceVideoUrl": "https://...",
        "outputVideoUrl": "https://...",
        "taskStatus": 5,
        "createTime": "2026-04-02T10:00:00Z",
        "updateTime": "2026-04-02T10:05:00Z"
      }
    ]
  },
  "message": "获取成功"
}
```

**查询条件**
- `taskStatus`: 0=待处理, 1=处理中, 2=轮询中, 5=已完成, -1=失败

---

### 3. 查询单个任务

**请求**
```
GET /api/material/subtitle-remove/task/1/
Authorization: Bearer {token}
```

**响应**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "字幕消除",
    "sourceVideoUrl": "https://...",
    "outputVideoUrl": "https://...",
    "taskStatus": 5,
    "createTime": "2026-04-02T10:00:00Z",
    "updateTime": "2026-04-02T10:05:00Z"
  },
  "message": "获取成功"
}
```

---

### 4. 更新任务状态

**请求**
```
POST /api/material/subtitle-remove/task/update-status/1/
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "taskStatus": 5
}
```

**响应**
```json
{
  "code": 200,
  "data": { ... },
  "message": "更新成功"
}
```

---

### 任务字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 任务ID |
| title | string | 任务标题 |
| taskId | string | 调度系统任务ID |
| sourceVideoUrl | string | 原始视频URL |
| outputVideoUrl | string | 消除后视频URL |
| taskStatus | int | 任务状态 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

### 前端集成流程

1. **上传文件**
   ```javascript
   const formData = new FormData();
   formData.append('file', file);
   formData.append('title', '字幕消除');
   
   const response = await fetch('/api/material/subtitle-remove/task/create/', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: formData
   });
   const { data } = await response.json();
   const taskId = data.id;
   ```

2. **轮询查询状态**
   ```javascript
   const pollStatus = async (taskId) => {
     while (true) {
       const response = await fetch(`/api/material/subtitle-remove/task/${taskId}/`, {
         headers: { 'Authorization': `Bearer ${token}` }
       });
       const { data } = await response.json();
       
       if (data.taskStatus === 5) {
         console.log('完成:', data.outputVideoUrl);
         break;
       } else if (data.taskStatus === -1) {
         console.error('失败');
         break;
       }
       
       await new Promise(r => setTimeout(r, 5000));
     }
   };
   ```

---

### 注意事项

1. 所有请求需要 Bearer Token 认证
2. 文件大小建议不超过 2GB
3. 轮询间隔建议 5-10 秒
4. 文件上传后立即返回任务 ID，异步处理

