# 标签（Label）接口文档

> 基础路径：`/api/material/`  
> 认证：带 `Authorization: Bearer <token>` 的接口已标注，其余无需认证

---

## 1. 获取全部标签

**GET** `/api/material/label/all/`

### 请求参数（Query）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| level | integer | ❌ | 按层级筛选（1=一级，2=二级），不传则返回全部 |

### 响应示例

```json
{
    "code": 200,
    "data": [
        {
            "id": 1,
            "name": "阿里",
            "level": 1,
            "is_public": true,
            "is_shared": false,
            "createUserId": 1,
            "sort": 0,
            "toTop": false,
            "updateTime": "2026-05-06 10:00:00",
            "createTime": "2026-05-05 10:00:00"
        }
    ],
    "message": "获取成功"
}
```

---

## 2. 获取全部标签（分组）

**GET** `/api/material/label/all/grouped/`

> 按层级分组返回

### 请求参数

无

### 响应示例

```json
{
    "code": 200,
    "data": {
        "1": [
            {
                "id": 1,
                "name": "阿里",
                "level": 1,
                "is_public": true,
                "is_shared": false,
                "createUserId": 1,
                "sort": 0,
                "toTop": false,
                "updateTime": "2026-05-06 10:00:00",
                "createTime": "2026-05-05 10:00:00"
            }
        ],
        "2": [
            {
                "id": 3,
                "name": "腾讯云",
                "level": 2,
                "is_public": false,
                "is_shared": false,
                "createUserId": 1,
                "sort": 0,
                "toTop": false,
                "updateTime": "2026-05-06 10:00:00",
                "createTime": "2026-05-05 10:00:00"
            }
        ]
    },
    "message": "获取成功"
}
```

---

## 3. 获取当前用户可见的全部标签

**GET** `/api/material/label/all/by-user/`

> 需要认证：`Authorization: Bearer <token>`

### 请求参数（Query）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| level | integer | ❌ | 按层级筛选，不传则返回全部 |

### 响应示例

同接口 1，返回当前用户有权限查看的标签列表。

---

## 4. 获取当前用户可见的全部标签（分组）

**GET** `/api/material/label/all/grouped/by-user/`

> 需要认证：`Authorization: Bearer <token>`

### 请求参数

无

### 响应示例

同接口 2，返回当前用户有权限查看的标签，按层级分组。

---

## 5. 根据 ID 获取标签

**GET** `/api/material/label/<id>/`

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ | 标签 ID |

### 响应示例

```json
{
    "code": 200,
    "data": {
        "id": 2,
        "name": "腾讯",
        "level": 2,
        "is_public": false,
        "is_shared": false,
        "createUserId": 1,
        "sort": 0,
        "toTop": false,
        "updateTime": "2026-05-05 13:51:42",
        "createTime": "2026-05-05 10:54:47"
    },
    "message": "获取成功"
}
```

### 失败响应

```json
{
    "code": 400,
    "data": null,
    "message": "数据不存在"
}
```

---

## 6. 分页查询标签（管理员）

**POST** `/api/material/label/paginate/`

### 请求体

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | ❌ | 页码，默认 1 |
| pageSize | integer | ❌ | 每页条数，默认 10 |
| search | object | ❌ | 筛选条件，见下表 |

**search 可用字段**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | string | 标签名称（模糊匹配） |
| level | integer | 标签层级 |
| is_public | boolean | 是否公开 |

### 请求示例

```json
{
    "page": 1,
    "pageSize": 10,
    "search": {
        "name": "腾",
        "level": 2
    }
}
```

### 响应示例

```json
{
    "code": 200,
    "data": {
        "total": 1,
        "page": 1,
        "pageSize": 10,
        "list": [
            {
                "id": 2,
                "name": "腾讯",
                "level": 2,
                "is_public": false,
                "is_shared": false,
                "createUserId": 1,
                "sort": 0,
                "toTop": false,
                "updateTime": "2026-05-05 13:51:42",
                "createTime": "2026-05-05 10:54:47"
            }
        ]
    },
    "message": "获取成功"
}
```

---

## 7. 分页查询标签（当前用户可见）

**POST** `/api/material/label/paginate/by-user/`

> 需要认证：`Authorization: Bearer <token>`

### 请求体

同接口 6，返回当前用户有权限查看的标签。

---

## 8. 创建标签

**POST** `/api/material/label/create/`

> 需要认证：`Authorization: Bearer <token>`

### 请求体

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | ✅ | 标签名称 |
| level | integer | ❌ | 标签层��（1=一级，2=二级） |
| is_public | boolean | ❌ | 是否公开，默认 false |
| is_shared | boolean | ❌ | 是否共享，默认 false |
| sort | integer | ❌ | 排序值，默认 0 |
| to_top | boolean | ❌ | 是否置顶，默认 false |

### 请求示例

```json
{
    "name": "字节",
    "level": 1,
    "is_public": true,
    "is_shared": false,
    "sort": 0,
    "to_top": false
}
```

### 响应示例

```json
{
    "code": 200,
    "data": {
        "id": 5,
        "name": "字节",
        "level": 1,
        "is_public": true,
        "is_shared": false,
        "createUserId": 3,
        "sort": 0,
        "toTop": false,
        "updateTime": "2026-05-06 10:00:00",
        "createTime": "2026-05-06 10:00:00"
    },
    "message": "创建成功"
}
```

---

## 9. 更新标签

**POST** `/api/material/label/update/`

### 请求体

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ | 要修改的标签 ID |
| name | string | ❌ | 标签名称 |
| level | integer | ❌ | 标签层级（1=一级，2=二级） |
| is_public | boolean | ❌ | 是否公开 |
| is_shared | boolean | ❌ | 是否共享 |
| sort | integer | ❌ | 排序值 |
| to_top | boolean | ❌ | 是否置顶 |

> 只传需要修改的字段即可，`id` 必填。

### 请求示例

```json
{
    "id": 2,
    "name": "腾讯",
    "level": 1,
    "is_public": true,
    "is_shared": true,
    "sort": 1,
    "to_top": false
}
```

### 响应示例

```json
{
    "code": 200,
    "data": {
        "id": 2,
        "name": "腾讯",
        "level": 1,
        "is_public": true,
        "is_shared": true,
        "createUserId": 1,
        "sort": 1,
        "toTop": false,
        "updateTime": "2026-05-06 10:00:00",
        "createTime": "2026-05-05 10:54:47"
    },
    "message": "更新成功"
}
```

### 失败响应

```json
{
    "code": 400,
    "data": null,
    "message": "缺少id参数"
}
```

```json
{
    "code": 400,
    "data": null,
    "message": "数据不存在"
}
```

---

## 10. 删���标签

**POST** `/api/material/label/delete/`

### 请求体

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ | 要删除的标签 ID |

### 请求示例

```json
{
    "id": 2
}
```

### 成功响应

```json
{
    "code": 200,
    "data": null,
    "message": "删除成功"
}
```

### 失败响应

```json
{
    "code": 400,
    "data": null,
    "message": "缺少id参数"
}
```

```json
{
    "code": 400,
    "data": null,
    "message": "数据不存在"
}
```

---

## 11. 标签置顶

**POST** `/api/material/label/to-top/`

### 请求体

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ | 要置顶的标签 ID |

### 请求示例

```json
{
    "id": 2
}
```

### 成功响应

```json
{
    "code": 200,
    "data": {
        "id": 2,
        "name": "腾讯",
        "level": 2,
        "is_public": false,
        "is_shared": false,
        "createUserId": 1,
        "sort": 0,
        "toTop": true,
        "updateTime": "2026-05-06 10:00:00",
        "createTime": "2026-05-05 10:54:47"
    },
    "message": "操作成功"
}
```

### 失败响应

```json
{
    "code": 400,
    "data": null,
    "message": "缺少id参数"
}
```

```json
{
    "code": 400,
    "data": null,
    "message": "数据不存在"
}
```

---

## 通用响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 标签 ID |
| name | string | 标签名称 |
| level | integer | 标签层级（1=一级，2=二级） |
| is_public | boolean | 是否公开 |
| is_shared | boolean | 是否共享 |
| createUserId | integer | 创建者用户 ID |
| sort | integer | 排序值，值越大越靠前 |
| toTop | boolean | 是否置顶 |
| updateTime | string | 最后更新时间，格式 `yyyy-MM-dd HH:mm:ss` |
| createTime | string | 创建时间，格式 `yyyy-MM-dd HH:mm:ss` |

---

## 错误码说明

| code | 说明 |
|------|------|
| 200 | 操作成功 |
| 400 | 参数错误 / 数据不���在 |
| 401 | 未认证 / token 无效 |

