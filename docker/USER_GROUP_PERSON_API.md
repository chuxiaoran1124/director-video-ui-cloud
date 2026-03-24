# 用户组人员 API 文档

## 基础信息
- **基础URL**: `http://127.0.0.1:8000/api/users`
- **请求头**: `Content-Type: application/json`

---

## 1. 创建用户组人员

### 请求
- **URL**: `POST /api/users/group-person/create/`
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
  "groupId": 1,
  "personName": "张三",
  "userName": "zhangsan",
  "role": "销售经理"
}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 1,
    "person_name": "张三",
    "user_name": "zhangsan",
    "group_id": 1,
    "role": "销售经理",
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
  "msg": "该用户已存在于此组",
  "data": null
}
```

### 说明
- 创建成功时，关联组的 `number` 字段会自动加 1
- `userName` 可选，但如果提供了就会进行重复检查

---

## 2. 更新用户组人员

### 请求
- **URL**: `POST /api/users/group-person/update/{id}/`
- **方法**: POST
- **参数**: 
  - `id` (int) - 用户组人员ID

### 请求体示例
```json
{
  "personName": "张三（已更新）",
  "role": "销售总监"
}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "person_name": "张三（已更新）",
    "user_name": "zhangsan",
    "group_id": 1,
    "role": "销售总监",
    "create_time": "2026-03-20 14:30:00",
    "update_time": "2026-03-20 15:00:00",
    "deleted": 0
  }
}
```

---

## 3. 删除用户组人员

### 请求
- **URL**: `POST /api/users/group-person/delete/{id}/`
- **方法**: POST
- **参数**: 
  - `id` (int) - 用户组人员ID

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
  "msg": "用户组人员不存在",
  "data": null
}
```

### 说明
- 删除成功时，关联组的 `number` 字段会自动减 1

---

## 4. 获取所有用户组人员

### 请求
- **URL**: `GET /api/users/group-person/all/`
- **方法**: GET

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "person_name": "张三",
      "user_name": "zhangsan",
      "group_id": 1,
      "role": "销售经理",
      "create_time": "2026-03-20 14:30:00",
      "update_time": "2026-03-20 14:30:00",
      "deleted": 0
    },
    {
      "id": 2,
      "person_name": "李四",
      "user_name": "lisi",
      "group_id": 1,
      "role": "销售专员",
      "create_time": "2026-03-20 14:35:00",
      "update_time": "2026-03-20 14:35:00",
      "deleted": 0
    }
  ]
}
```

---

## 5. 根据ID获取用户组人员

### 请求
- **URL**: `GET /api/users/group-person/{id}/`
- **方法**: GET
- **参数**: 
  - `id` (int) - 用户组人员ID

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "person_name": "张三",
    "user_name": "zhangsan",
    "group_id": 1,
    "role": "销售经理",
    "create_time": "2026-03-20 14:30:00",
    "update_time": "2026-03-20 14:30:00",
    "deleted": 0
  }
}
```

---

## 6. 根据组ID获取该组的所有人员

### 请求
- **URL**: `GET /api/users/group-person/by-group/{group_id}/`
- **方法**: GET
- **参数**: 
  - `group_id` (int) - 用户组ID

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "person_name": "张三",
      "user_name": "zhangsan",
      "group_id": 1,
      "role": "销售经理",
      "create_time": "2026-03-20 14:30:00",
      "update_time": "2026-03-20 14:30:00",
      "deleted": 0
    },
    {
      "id": 2,
      "person_name": "李四",
      "user_name": "lisi",
      "group_id": 1,
      "role": "销售专员",
      "create_time": "2026-03-20 14:35:00",
      "update_time": "2026-03-20 14:35:00",
      "deleted": 0
    }
  ]
}
```

---

## 7. 分页查询用户组人员

### 请求
- **URL**: `POST /api/users/group-person/paginate/`
- **方法**: POST

### 请求体示例
```json
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "personName": "张",
    "userName": "zhangsan",
    "groupId": 1,
    "role": "销售经理"
  }
}
```

### 响应示例（成功）
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "person_name": "张三",
        "user_name": "zhangsan",
        "group_id": 1,
        "role": "销售经理",
        "create_time": "2026-03-20 14:30:00",
        "update_time": "2026-03-20 14:30:00",
        "deleted": 0
      },
      {
        "id": 2,
        "person_name": "李四",
        "user_name": "lisi",
        "group_id": 1,
        "role": "销售专员",
        "create_time": "2026-03-20 14:35:00",
        "update_time": "2026-03-20 14:35:00",
        "deleted": 0
      }
    ]
  }
}
```

### 搜索参数说明
- `personName` (string, optional) - 姓名（模糊查询）
- `userName` (string, optional) - 用户名（模糊查询）
- `groupId` (int, optional) - 组ID（精确查询）
- `role` (string, optional) - 角色（精确查询）

---

## 字段说明

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | int | 用户组人员ID | 主键，自增 |
| person_name | string | 姓名 | 必填，最长255个字符 |
| user_name | string | 用户名 | 可选，最长255个字符 |
| group_id | int | 分组ID | 必填，关联 user_group 表 |
| role | string | 角色 | 可选，最长255个字符 |
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

## 约束条件和特殊说明

1. **personName 和 groupId 必填** - 创建人员时必须提供
2. **userName 可选** - 如果提供了就会进行重复检查（同一组内不能有相同的 userName）
3. **自动维护 group 的 number** 
   - 创建人员时：关联组的 number 自动加 1
   - 删除人员时：关联组的 number 自动减 1
4. **逻辑删除** - 删除人员时设置 deleted=1，不从数据库物理删除
5. **服务层提供的额外接口（仅供后端使用）**
   - `get_group_codes_by_user_id(user_id)` - 根据 user_id 获取用户所属的所有 group 的 code 列表（去重）
   - `get_group_codes_by_user_name(user_name)` - 根据 user_name 获取用户所属的所有 group 的 code 列表（去重）

---

## 使用示例

### 场景1：创建销售部门及其人员

1. **创建销售部门**
```bash
curl -X POST http://127.0.0.1:8000/api/users/group/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "销售部",
    "groupCode": "SALES_DEPT",
    "msg": "销售部门"
  }'
```

2. **添加部门人员**
```bash
curl -X POST http://127.0.0.1:8000/api/users/group-person/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": 1,
    "personName": "张三",
    "userName": "zhangsan",
    "role": "销售经理"
  }'
```

3. **查询部门人员列表**
```bash
curl -X GET http://127.0.0.1:8000/api/users/group-person/by-group/1/
```

### 场景2：按条件查询人员

```bash
curl -X POST http://127.0.0.1:8000/api/users/group-person/paginate/ \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 10,
    "search": {
      "groupId": 1,
      "role": "销售经理"
    }
  }'
```

