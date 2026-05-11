# PromptWord / PromptTemplate 接口文档（新版）

统一前缀：`/api/material`

## 模块说明

- `PromptWord`：提示词词库，仍按 `positive/negative` 分类管理单词条。
- `PromptTemplate`：双向一体模板。每条模板同时包含：
- `positive_content`（正向）
- `negative_content`（负向）

业务效果：前端点击一个模板即可一次性填充正负两侧提示词。

## 统一响应格式

```json
{
  "code": 200,
  "data": {},
  "message": "获取成功"
}
```

分页 `data`：

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "data": []
}
```

---

## PromptTemplate（重点）

### 数据结构

- `id`
- `name`
- `positive_content`
- `negative_content`
- `sort`
- `toTop`
- `createUserId`
- `createTime`
- `updateTime`

### 1. 获取模板列表

`GET /api/material/prompt-template/all/`

请求示例：

```http
GET /api/material/prompt-template/all/
```

返回示例：

```json
{
  "code": 200,
  "data": [
    {
      "id": 101,
      "name": "主播写实模板A",
      "positive_content": "固定视角,自然光,面部清晰,口型稳定",
      "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
      "sort": 10,
      "toTop": false,
      "createUserId": 12,
      "createTime": "2026-05-09T10:00:00Z",
      "updateTime": "2026-05-09T10:00:00Z"
    }
  ],
  "message": "获取成功"
}
```

### 2. 获取当前用户模板列表

`GET /api/material/prompt-template/all/grouped/by-user/`

请求头：

```http
Authorization: Bearer <token>
```

说明：

- 名称虽保留 `grouped`，但新版返回的是“模板数组”，不再按正负拆成两组。

返回示例：

```json
{
  "code": 200,
  "data": [
    {
      "id": 101,
      "name": "主播写实模板A",
      "positive_content": "固定视角,自然光,面部清晰,口型稳定",
      "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
      "sort": 10,
      "toTop": false,
      "createUserId": 12,
      "createTime": "2026-05-09T10:00:00Z",
      "updateTime": "2026-05-09T10:00:00Z"
    }
  ],
  "message": "获取成功"
}
```

### 3. 根据 ID 查询模板

`GET /api/material/prompt-template/{id}/`

返回示例：

```json
{
  "code": 200,
  "data": {
    "id": 101,
    "name": "主播写实模板A",
    "positive_content": "固定视角,自然光,面部清晰,口型稳定",
    "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
    "sort": 10,
    "toTop": false,
    "createUserId": 12,
    "createTime": "2026-05-09T10:00:00Z",
    "updateTime": "2026-05-09T10:00:00Z"
  },
  "message": "获取成功"
}
```

### 4. 分页查询模板

`POST /api/material/prompt-template/paginate/`

请求体：

```json
{
  "page": 1,
  "pageSize": 20,
  "search": {
    "name": "主播"
  }
}
```

支持的查询字段：

- `search.name`
- `search.positive_content` / `search.positiveContent`
- `search.negative_content` / `search.negativeContent`

返回示例：

```json
{
  "code": 200,
  "data": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "data": [
      {
        "id": 101,
        "name": "主播写实模板A",
        "positive_content": "固定视角,自然光,面部清晰,口型稳定",
        "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
        "sort": 10,
        "toTop": false,
        "createUserId": 12,
        "createTime": "2026-05-09T10:00:00Z",
        "updateTime": "2026-05-09T10:00:00Z"
      }
    ]
  },
  "message": "获取成功"
}
```

### 5. 创建模板

`POST /api/material/prompt-template/create/`

请求头：

```http
Authorization: Bearer <token>
```

请求体：

```json
{
  "name": "主播写实模板A",
  "positive_content": "固定视角,自然光,面部清晰,口型稳定",
  "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
  "sort": 10,
  "to_top": false
}
```

返回示例：

```json
{
  "code": 200,
  "data": {
    "id": 101,
    "name": "主播写实模板A",
    "positive_content": "固定视角,自然光,面部清晰,口型稳定",
    "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
    "sort": 10,
    "toTop": false,
    "createUserId": 12,
    "createTime": "2026-05-09T10:00:00Z",
    "updateTime": "2026-05-09T10:00:00Z"
  },
  "message": "创建成功"
}
```

说明：

- 创建时会把 `positive_content` 自动拆词写入 `PromptWord(type=positive)`。
- 创建时会把 `negative_content` 自动拆词写入 `PromptWord(type=negative)`。
- 分隔符支持 `,`、`，`、`、`。

### 6. 更新模板

`POST /api/material/prompt-template/update/`

请求体：

```json
{
  "id": 101,
  "name": "主播写实模板A-新版",
  "positive_content": "固定视角,自然光,面部清晰,口型稳定,高清皮肤细节",
  "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
  "sort": 20,
  "to_top": true
}
```

返回示例：

```json
{
  "code": 200,
  "data": {
    "id": 101,
    "name": "主播写实模板A-新版",
    "positive_content": "固定视角,自然光,面部清晰,口型稳定,高清皮肤细节",
    "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
    "sort": 20,
    "toTop": true,
    "createUserId": 12,
    "createTime": "2026-05-09T10:00:00Z",
    "updateTime": "2026-05-09T10:30:00Z"
  },
  "message": "更新成功"
}
```

### 7. 删除模板

`POST /api/material/prompt-template/delete/`

请求体：

```json
{
  "id": 101
}
```

返回示例：

```json
{
  "code": 200,
  "data": null,
  "message": "删除成功"
}
```

### 8. 置顶/取消置顶

`POST /api/material/prompt-template/to-top/`

请求体：

```json
{
  "id": 101
}
```

返回示例：

```json
{
  "code": 200,
  "data": {
    "id": 101,
    "name": "主播写实模板A",
    "positive_content": "固定视角,自然光,面部清晰,口型稳定",
    "negative_content": "背景抖动,多余肢体,低清晰度,面部变形",
    "sort": 10,
    "toTop": true,
    "createUserId": 12,
    "createTime": "2026-05-09T10:00:00Z",
    "updateTime": "2026-05-09T10:20:00Z"
  },
  "message": "操作成功"
}
```

---

## PromptWord（保持现状）

`PromptWord` 接口保持原有行为，用于维护提示词词库（`positive/negative`）。
模板创建/更新会自动把模板内容拆词补充到词库，无需前端额外调用词库创建接口。
