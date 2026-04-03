# A2EPlanVideoViews - 计划视频 API 接口文档

## 基础信息
- **模块名**: A2E 计划视频管理
- **接口前缀**: `/api/material/`
- **请求格式**: JSON
- **响应格式**: JSON

---

## 接口列表

### 1. 新增/修改计划视频
**端点**: `POST /api/material/plan/video/create/`

#### 请求参数
```json
{
  "id": "视频计划ID (可选，不传则新增，传则修改)",
  "plan_name": "计划名称 (必填)",
  "msg": "视频描述/信息",
  "language": "视频语言",
  "subtitleSelector": "是否启用字幕 (0=关闭, 1=启用) (默认:0)",
  "colour": "字幕颜色 (white/yellow/black, 仅当subtitleSelector=1时有效，默认:white)"
}
```

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "提交成功",
  "data": {
    "id": 123
  }
}
```

#### 响应示例（失败）
```json
{
  "code": 1,
  "msg": "提交失败，请联系管理员",
  "data": null
}
```

---

### 2. 删除计划视频
**端点**: `DELETE /api/material/plan/video/delete/{id}/`

#### 路径参数
- `id` (int): 视频计划 ID

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "删除成功",
  "data": null
}
```

#### 响应示例（失败）
```json
{
  "code": 1,
  "msg": "数据不存在",
  "data": null
}
```

---

### 3. 验证计划视频名称唯一性
**端点**: `POST /api/material/plan/video/validate-name/`

#### 请求参数
```json
{
  "name": "要验证的计划名称 (必填)"
}
```

#### 响应示例（名称可用）
```json
{
  "code": 0,
  "msg": "验证成功",
  "data": {
    "is_valid": true,
    "recommended_name": "推荐名称 (如果不可用会提供)"
  }
}
```

#### 响应示例（名称不可用）
```json
{
  "code": 0,
  "msg": "验证成功",
  "data": {
    "is_valid": false,
    "recommended_name": "计划_1"
  }
}
```

#### 响应示例（名称为空）
```json
{
  "code": 1,
  "msg": "名字不能为空",
  "data": null
}
```

---

### 4. 分页查询计划视频
**端点**: `POST /api/material/plan/video/paginate/`

#### 请求参数
```json
{
  "page": "页码 (默认:1)",
  "pageSize": "每页条数 (默认:10)",
  "search": {
    "plan_name": "计划名称(可选，模糊查询)",
    "language": "视频语言(可选)",
    "task_status": "任务状态(可选)"
  }
}
```

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "list": [
      {
        "id": 1,
        "plan_name": "计划1",
        "msg": "描述",
        "language": "zh-CN",
        "task_status": 0,
        "subtitleSelector": 1,
        "colour": "white",
        "create_time": "2024-03-24 10:30:00",
        "update_time": "2024-03-24 10:30:00"
      }
    ]
  }
}
```

---

### 5. 获取计划视频详情
**端点**: `GET /api/material/plan/video/{id}/`

#### 路径参数
- `id` (int): 视频计划 ID

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "plan_name": "计划1",
    "msg": "描述",
    "language": "zh-CN",
    "task_status": 0,
    "subtitleSelector": 1,
    "colour": "white",
    "subtitle": {
      "language": "zh-CN",
      "PrimaryColour": "rgba(255, 255, 255, 1)",
      "OutlineColour": "rgba(0, 0, 0, 1)",
      "BorderStyle": 4,
      "BackColour": "rgba(0, 0, 0, 0)",
      "FontName": "SJbangkaijianti",
      "Fontsize": 80,
      "subtitle_position": 0.22
    },
    "create_time": "2024-03-24 10:30:00",
    "update_time": "2024-03-24 10:30:00"
  }
}
```

---

### 6. 启动计划中的所有任务
**端点**: `POST /api/material/plan/video/start/{id}/`

#### 路径参数
- `id` (int): 视频计划 ID

#### 响应示例（有待启动任务）
```json
{
  "code": 0,
  "msg": "成功启动 5 个任务",
  "data": {
    "count": 5
  }
}
```

#### 响应示例（无待启动任务）
```json
{
  "code": 0,
  "msg": "该计划没有待启动的任务",
  "data": {
    "count": 0
  }
}
```

---

## 字幕配置说明

### 字幕颜色选项
- `white`: 白色字幕
- `yellow`: 黄色字幕  
- `black`: 黑色字幕

### 字幕配置详情
当 `subtitleSelector=1` 时，后端会根据 `colour` 参数自动生成对应的字幕配置：

```json
{
  "language": "zh-CN",
  "PrimaryColour": "rgba(255, 255, 255, 1)",    // 字幕主色
  "OutlineColour": "rgba(0, 0, 0, 1)",         // 字幕描边色
  "BorderStyle": 4,                             // 字幕边框样式
  "BackColour": "rgba(0, 0, 0, 0)",            // 字幕背景色
  "FontName": "SJbangkaijianti",               // 字体名称
  "Fontsize": 80,                               // 字体大小
  "subtitle_position": 0.22                     // 字幕位置（0-1之间）
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1 | 失败（具体原因见 msg 字段） |

---

## 注意事项

1. **用户身份**: 所有接口都需要通过 JWT 认证（在请求头中添加 Authorization: Bearer {token}）
2. **用户ID自动获取**: 新增/修改时，用户ID会从请求上下文自动获取，无需手动传入
3. **字幕配置**: 仅当 `subtitleSelector=1` 时，才需要传入 `colour` 参数
4. **分页参数**: `pageSize` 和 `page_size` 都支持，推荐使用 `pageSize`

