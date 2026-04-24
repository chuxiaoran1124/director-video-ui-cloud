# 字幕模板 (SubtitleTemplate) API 文档

## 概述
这是字幕模板管理的完整 CRUD API。所有接口都需要在请求头中包含 JWT Token 进行身份验证，Token 中的 `user_id` 将自动绑定到数据记录。

## 认证方式
所有请求都需要在 HTTP Header 中包含：
```
Authorization: Bearer <token>
```

## API 端点

### 1. 创建字幕模板
**端点:** `POST /api/subtitle-template/create/`

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体:**
```json
{
  "subtitleTemplateName": "我的字幕模板",
  "subtitleConfig": "{\"fontSize\": 16, \"color\": \"#FFFFFF\"}"
}
```

**响应 (成功 200):**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "subtitleTemplateName": "我的字幕模板",
    "userId": 123,
    "subtitleConfig": "{\"fontSize\": 16, \"color\": \"#FFFFFF\"}",
    "createTime": "2026-04-14 10:30:00",
    "updateTime": "2026-04-14 10:30:00",
    "deleted": false
  },
  "msg": "字幕模板创建成功"
}
```

**响应 (错误 400):**
```json
{
  "code": -1,
  "data": null,
  "msg": "字幕模板名称已存在"
}
```

---

### 2. 更新字幕模板
**端点:** `POST /api/subtitle-template/update/`

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体:**
```json
{
  "id": 1,
  "subtitleTemplateName": "更新后的名称",
  "subtitleConfig": "{\"fontSize\": 20, \"color\": \"#FF0000\"}"
}
```

**响应 (成功 200):**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "subtitleTemplateName": "更新后的名称",
    "userId": 123,
    "subtitleConfig": "{\"fontSize\": 20, \"color\": \"#FF0000\"}",
    "createTime": "2026-04-14 10:30:00",
    "updateTime": "2026-04-14 11:00:00",
    "deleted": false
  },
  "msg": "字幕模板更新成功"
}
```

---

### 3. 删除字幕模板 (逻辑删除)
**端点:** `POST /api/subtitle-template/delete/`

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体:**
```json
{
  "id": 1
}
```

**响应 (成功 200):**
```json
{
  "code": 0,
  "data": null,
  "msg": "字幕模板删除成功"
}
```

---

### 4. 根据ID获取字幕模板
**端点:** `GET /api/subtitle-template/<id>/`

**请求头:**
```
Authorization: Bearer <token>
```

**URL 参数:**
- `id` (required): 模板ID，例如 `1`

**响应 (成功 200):**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "subtitleTemplateName": "我的字幕模板",
    "userId": 123,
    "subtitleConfig": "{\"fontSize\": 16, \"color\": \"#FFFFFF\"}",
    "createTime": "2026-04-14 10:30:00",
    "updateTime": "2026-04-14 10:30:00",
    "deleted": false
  },
  "msg": "获取成功"
}
```

---

### 5. 获取当前用户所有字幕模板
**端点:** `GET /api/subtitle-template/all/`

**请求头:**
```
Authorization: Bearer <token>
```

**响应 (成功 200):**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "subtitleTemplateName": "模板1",
      "userId": 123,
      "subtitleConfig": "{\"fontSize\": 16}",
      "createTime": "2026-04-14 10:30:00",
      "updateTime": "2026-04-14 10:30:00",
      "deleted": false
    },
    {
      "id": 2,
      "subtitleTemplateName": "模板2",
      "userId": 123,
      "subtitleConfig": "{\"fontSize\": 20}",
      "createTime": "2026-04-14 10:35:00",
      "updateTime": "2026-04-14 10:35:00",
      "deleted": false
    }
  ],
  "msg": "获取成功"
}
```

---

### 6. 分页查询当前用户的字幕模板
**端点:** `POST /api/subtitle-template/paginate/`

**请求头:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体:**
```json
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "subtitleTemplateName": "模板1"
  }
}
```

**响应 (成功 200):**
```json
{
  "code": 0,
  "data": {
    "results": [
      {
        "id": 1,
        "subtitleTemplateName": "模板1",
        "userId": 123,
        "subtitleConfig": "{\"fontSize\": 16}",
        "createTime": "2026-04-14 10:30:00",
        "updateTime": "2026-04-14 10:30:00",
        "deleted": false
      }
    ],
    "count": 1,
    "total_pages": 1,
    "current_page": 1
  },
  "msg": "获取成功"
}
```

---

## 核心特性

### 数据隔离
- ✅ **用户隔离**: 每个用户只能看到和操作自己的字幕模板
- ✅ **Token 自动绑定**: `user_id` 从 Token 中自动提取，无需手动传递
- ✅ **权限检查**: 所有操作都会验证模板是否属于当前用户

### 逻辑删除
- ✅ 删除操作不会物理删除数据，只会设置 `deleted` 字段为 `true`
- ✅ 所有查询自动过滤已删除的数据

### 名称验证
- ✅ 创建时检查名称是否重复
- ✅ 更新时也会检查新名称是否与其他模板冲突

---

## 错误处理

所有错误响应都遵循统一格式：

```json
{
  "code": -1,
  "data": null,
  "msg": "错误信息"
}
```

常见错误码：
- `401`: 认证失败（缺少 Token、Token 无效或已过期）
- `400`: 请求参数错误
- `404`: 模板不存在或无访问权限

---

## 数据库表结构

```sql
CREATE TABLE material_subbtitle_template (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  subtitle_template_name varchar(255) COMMENT '字幕模板名称',
  user_id int COMMENT '用户id',
  subtitle_config text COMMENT '字幕配置 (JSON)',
  create_time datetime COMMENT '创建时间',
  deleted tinyint(1) DEFAULT 0 COMMENT '是否已删除',
  update_time datetime COMMENT '更新时间',
  INDEX idx_user_deleted (user_id, deleted)
) COMMENT '字幕模板表';
```

---

## 文件结构

```
material/
├── models/
│   └── SubtitleTemplateModel.py          # Django 模型定义
├── serializer/
│   └── SubtitleTemplateSerializer.py     # DRF 序列化器
├── service/
│   └── SubtitleTemplateService.py        # 业务逻辑层
├── views/
│   └── SubtitleTemplateViews.py          # API 视图层
└── urls.py                                # 路由配置
```

---

## 测试示例

### 使用 Python requests 库

```python
import requests
import json

BASE_URL = "http://localhost:8000/api"
TOKEN = "your_jwt_token_here"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# 1. 创建字幕模板
response = requests.post(
    f"{BASE_URL}/subtitle-template/create/",
    headers=HEADERS,
    json={
        "subtitleTemplateName": "我的模板",
        "subtitleConfig": json.dumps({"fontSize": 16, "color": "#FFFFFF"})
    }
)
print(response.json())

# 2. 获取所有模板
response = requests.get(
    f"{BASE_URL}/subtitle-template/all/",
    headers=HEADERS
)
print(response.json())

# 3. 获取单个模板
response = requests.get(
    f"{BASE_URL}/subtitle-template/1/",
    headers=HEADERS
)
print(response.json())

# 4. 更新模板
response = requests.post(
    f"{BASE_URL}/subtitle-template/update/",
    headers=HEADERS,
    json={
        "id": 1,
        "subtitleTemplateName": "更新后的名称"
    }
)
print(response.json())

# 5. 删除模板
response = requests.post(
    f"{BASE_URL}/subtitle-template/delete/",
    headers=HEADERS,
    json={"id": 1}
)
print(response.json())
```

---

## 开发注意事项

1. **Token 解析**: 所有 View 都遵循统一的 Token 解析模式，支持 `user_id` 和 `userId` 两种格式
2. **错误处理**: 所有异常都被捕获并返回统一的错误响应
3. **时间戳**: 使用 `date_utils.get_local_now()` 获取本地时间
4. **分页**: 分页查询支持搜索条件，返回结果包含总数、总页数等信息

