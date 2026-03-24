# 用户组 API 文档

## 基础信息
- **基础URL**: `http://127.0.0.1:8000/api/users`
- **请求头**: `Content-Type: application/json`

---

## 1. 创建用户组

### 请求
- **URL**: `POST /api/users/group/create/`
- **方法**: POST
- **请求头**: 
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

### 请求体示例
```json
{
  "groupName": "销售部",
  "groupCode": "SALES_DEPT",
  "msg": "销售部门",
  "number": 0
}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 1,
    "group_name": "销售部",
    "group_code": "SALES_DEPT",
    "msg": "销售部门",
    "number": 0,
    "create_time": "2026-03-20 14:30:00",
    "update_time": "2026-03-20 14:30:00",
    "deleted": 0
  }
}
```

### 响应示例（错误）
```json
{
  "code": 400,
  "msg": "组名已存在",
  "data": null
}
```

---

## 2. 更新用户组

### 请求
- **URL**: `POST /api/users/group/update/{id}/`
- **方法**: POST
- **参数**: 
  - `id` (int) - 用户组ID

### 请求体示例
```json
{
  "groupName": "销售部门",
  "msg": "销售部门(已更新)",
  "number": 5
}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "group_name": "销售部门",
    "group_code": "SALES_DEPT",
    "msg": "销售部门(已更新)",
    "number": 5,
    "create_time": "2026-03-20 14:30:00",
    "update_time": "2026-03-20 15:00:00",
    "deleted": 0
  }
}
```

---

## 3. 删除用户组

### 请求
- **URL**: `POST /api/users/group/delete/{id}/`
- **方法**: POST
- **参数**: 
  - `id` (int) - 用户组ID

### 请求体示例
```json
{}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

### 响应示例（错误）
```json
{
  "code": 400,
  "msg": "用户组不存在",
  "data": null
}
```

---

## 4. 获取所有用户组

### 请求
- **URL**: `GET /api/users/group/all/`
- **方法**: GET

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "group_name": "销售部",
      "group_code": "SALES_DEPT",
      "msg": "销售部门",
      "number": 5,
      "create_time": "2026-03-20 14:30:00",
      "update_time": "2026-03-20 15:00:00",
      "deleted": 0
    },
    {
      "id": 2,
      "group_name": "技术部",
      "group_code": "TECH_DEPT",
      "msg": "技术部门",
      "number": 8,
      "create_time": "2026-03-20 14:35:00",
      "update_time": "2026-03-20 14:35:00",
      "deleted": 0
    }
  ]
}
```

---

## 5. 根据ID获取用户组

### 请求
- **URL**: `GET /api/users/group/{id}/`
- **方法**: GET
- **参数**: 
  - `id` (int) - 用户组ID

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "group_name": "销售部",
    "group_code": "SALES_DEPT",
    "msg": "销售部门",
    "number": 5,
    "create_time": "2026-03-20 14:30:00",
    "update_time": "2026-03-20 15:00:00",
    "deleted": 0
  }
}
```

---

## 6. 分页查询用户组

### 请求
- **URL**: `POST /api/users/group/paginate/`
- **方法**: POST

### 请求体示例
```json
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "groupName": "销售",
    "groupCode": "SALES"
  }
}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "group_name": "销售部",
        "group_code": "SALES_DEPT",
        "msg": "销售部门",
        "number": 5,
        "create_time": "2026-03-20 14:30:00",
        "update_time": "2026-03-20 15:00:00",
        "deleted": 0
      }
    ]
  }
}
```

### 搜索参数说明
- `groupName` (string, optional) - 组名（模糊查询）
- `groupCode` (string, optional) - 组编码（模糊查询）

---

## 字段说明

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | int | 用户组ID | 主键，自增 |
| group_name | string | 组名 | 唯一，最长255个字符 |
| group_code | string | 组编码 | 唯一，最长255个字符 |
| msg | string | 描述 | 可选，最长255个字符 |
| number | int | 组人数 | 自动计算，不需要手动维护 |
| create_time | datetime | 创建时间 | 格式：YYYY-MM-DD HH:MM:SS |
| update_time | datetime | 更新时间 | 格式：YYYY-MM-DD HH:MM:SS |
| deleted | int | 删除标记 | 0=未删除，1=已删除（逻辑删除） |

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误或业务逻辑错误 |
| 500 | 服务器错误 |

---

## 约束条件

1. **groupName 和 groupCode 必填**
2. **groupName 全局唯一** - 创建或更新时需要检查重复
3. **groupCode 全局唯一** - 创建或更新时需要检查重复
4. **number 自动管理** - 当添加/删除组内人员时自动更新
5. **逻辑删除** - 删除组时设置 deleted=1，不从数据库物理删除

