# A2E 配音 API 文档

## 概述
A2E 配音模块提供了完整的配音管理API，包括创建、更新、删除、查询等操作。

---

## 接口列表

### 1. 创建配音
**接口地址：** `POST /api/material/dubbing/create/`

**请求参数：**
- dubbing_name (string, 必须) - 配音名称
- voice_id (string, 必须) - 声音第三方ID
- language (string, 必须) - 语种
- speechRate (float, 可选) - 语速
- msg (string, 必须) - 配音脚本内容

**响应示例（成功）：**
```json
{
  "code": 0,
  "msg": "创建成功",
  "data": {
    "id": 1,
    "dubbing_name": "企业宣传配音",
    "voice_id": "voice_001",
    "language": "zh",
    "speechRate": 1.0,
    "msg": "欢迎来到我们的公司",
    "url": "https://...",
    "create_time": "2024-03-18 10:30:00",
    "update_time": "2024-03-18 10:30:00",
    "task_status": "0"
  }
}
```

---

### 2. 更新配音
**接口地址：** `PUT /api/material/dubbing/{id}/`

**URL参数：** 
- id (int) - 配音ID

**请求参数：** 同创建配音（可选择性更新）

**响应示例（成功）：**
```json
{
  "code": 0,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "dubbing_name": "企业宣传配音-更新版",
    "update_time": "2024-03-18 11:00:00"
  }
}
```

---

### 3. 删除配音
**接口地址：** `DELETE /api/material/dubbing/{id}/`

**URL参数：** 
- id (int) - 配音ID

**响应示例（成功）：**
```json
{
  "code": 0,
  "msg": "删除成功",
  "data": null
}
```

---

### 4. 获取单个配音
**接口地址：** `GET /api/material/dubbing/{id}/`

**URL参数：** 
- id (int) - 配音ID

**响应示例（成功）：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "dubbing_name": "企业宣传配音",
    "voice_id": "voice_001",
    "language": "zh",
    "msg": "欢迎来到我们的公司",
    "url": "https://...",
    "create_time": "2024-03-18 10:30:00",
    "update_time": "2024-03-18 10:30:00",
    "task_status": 0
  }
}
```

---

### 5. 获取所有配音
**接口地址：** `GET /api/material/dubbing/list/`

**响应示例（成功）：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "dubbing_name": "企业宣传配音",
      "...": "..."
    }
  ]
}
```

---

### 6. 分页查询配音
**接口地址：** `POST /api/material/dubbing/paginate/post/`

**请求参数：**
- page (int, 默认1) - 页码
- pageSize (int, 默认10) - 每页数量  
- search (object, 可选) - 搜索条件

**搜索条件说明：**
- dubbing_name (string) - 配音名称
- language (string) - 语种
- task_status (int) - 任务状态

**请求示例：**
```json
{
  "page": 1,
  "pageSize": 20,
  "search": {
    "dubbing_name": "企业"
  }
}
```

**响应示例（成功）：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "count": 50,
    "next": "http://api.com/api/material/dubbing/paginate/post/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "dubbing_name": "中文女性配音-温柔版",
        "voice_id": "voice_001",
        "language": "zh",
        "msg": "欢迎来到我们的公司",
        "url": "https://...",
        "create_time": "2024-03-18 10:30:00",
        "update_time": "2026-03-16 18:10:34",
        "task_status": 2
      }
    ]
  }
}
```

---

### 7. 检查配音名称是否有效
**接口地址：** `POST /api/material/dubbing/check-name/`

**请求参数：**
- dubbing_name (string, 必须) - 配音名称

**请求示例：**
```json
{
  "dubbing_name": "企业宣传配音"
}
```

**响应示例（名称有效）：**
```json
{
  "code": 0,
  "msg": "检查成功",
  "data": {
    "is_valid": true,
    "dubbing_name": "企业宣传配音",
    "recommended_name": ""
  }
}
```

**响应示例（名称重复）：**
```json
{
  "code": 0,
  "msg": "检查成功",
  "data": {
    "is_valid": false,
    "dubbing_name": "企业宣传配音",
    "recommended_name": "企业宣传配音2"
  }
}
```

---

## 任务状态码说明

| 任务状态码 | 状态说明 |
|-----------|---------|
| 0 | 等待中（任务已创建，等待处理） |
| 1 | 进行中（任务正在处理） |
| 2 | 已完成（任务成功完成） |
| -1 | 失败（任务执行失败） |

---

## HTTP 响应状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 错误响应示例

**数据不存在：**
```json
{
  "code": -1,
  "msg": "数据不存在",
  "data": null
}
```

**创建失败：**
```json
{
  "code": -1,
  "msg": "创建失败: 字段不能为空",
  "data": null
}
```

---

## 注意事项

1. 所有POST/PUT请求需要在请求头中设置 `Content-Type: application/json`
2. 删除操作使用逻辑删除，数据库记录保留
3. 分页查询推荐使用 POST 方式，便于传递复杂的搜索条件
4. `create_time` 和 `update_time` 为服务器自动填充的时间戳（格式：2026-03-16 18:10:34）
5. 配音名称检查接口支持防止重名，如有重复会返回推荐的名称
6. 新建配音前应先调用检查接口验证名称有效性

---

## 快速开始

### Python示例
```python
import requests

# 检查配音名称
def check_dubbing_name(dubbing_name):
    url = "http://localhost:8000/api/material/dubbing/check-name/"
    data = {
        "dubbing_name": dubbing_name
    }
    response = requests.post(url, json=data)
    return response.json()

# 创建配音
def create_dubbing():
    url = "http://localhost:8000/api/material/dubbing/create/"
    data = {
        "dubbing_name": "企业宣传配音",
        "voice_id": "voice_001",
        "language": "zh",
        "speechRate": 1.0,
        "msg": "欢迎来到我们的公司"
    }
    response = requests.post(url, json=data)
    return response.json()

# 分页查询
def list_dubbings(page=1, page_size=10):
    url = "http://localhost:8000/api/material/dubbing/paginate/post/"
    data = {
        "page": page,
        "pageSize": page_size,
        "search": {}
    }
    response = requests.post(url, json=data)
    return response.json()
```

### JavaScript示例
```javascript
// 检查配音名称
async function checkDubbingName(dubbingName) {
  const response = await fetch('http://localhost:8000/api/material/dubbing/check-name/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dubbing_name: dubbingName
    })
  });
  return await response.json();
}

// 创建配音
async function createDubbing() {
  const response = await fetch('http://localhost:8000/api/material/dubbing/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dubbing_name: '企业宣传配音',
      voice_id: 'voice_001',
      language: 'zh',
      speechRate: 1.0,
      msg: '欢迎来到我们的公司'
    })
  });
  return await response.json();
}

// 分页查询
async function listDubbings(page = 1, pageSize = 10) {
  const response = await fetch('http://localhost:8000/api/material/dubbing/paginate/post/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: page,
      pageSize: pageSize,
      search: {}
    })
  });
  return await response.json();
}
```

---

## 更新日志

### 2024-03-18
- 创建初始版本
- 提供8个API接口
- 支持完整的CRUD操作及名称检查
- 修正URL路径，添加 `/material/` 中间件路径
- 分页查询接口地址为 `/paginate/post/`
- 任务状态码：0=等待中，1=进行中，2=已完成，-1=失败

