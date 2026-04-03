# A2EPlanVideoTaskViews - 计划视频任务 API 接口文档

## 基础信息
- **模块名**: A2E 计划视频任务管理
- **接口前缀**: `/api/material/`
- **请求格式**: JSON
- **响应格式**: JSON

---

## 接口列表

### 1. 创建视频任务
**端点**: `POST /api/material/plan/video/task/create/`

#### 请求参数
```json
{
  "id": "任务ID (可选，不传则新增，传则修改)",
  "title": "任务标题 (必填)",
  "msg": "任务描述",
  "plan_id": "所属计划ID (必填)",
  "voice_id": "配音ID",
  "digital_human_id": "数字人物ID",
  "base_voice_url": "基础语音URL",
  "language": "任务语言",
  "speechRate": "语速 (1-2之间，1为正常速度)",
  "anchor_type": "主播类型",
  "isSkipRs": "是否跳过某些处理",
  "video_cover_url": "视频封面URL",
  "user_group": "用户分组",
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
    "id": 456
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

### 2. 删除视频任务
**端点**: `DELETE /api/material/plan/video/task/delete/{id}/`

#### 路径参数
- `id` (int): 视频任务 ID

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

### 3. 获取所有视频任务
**端点**: `GET /api/material/plan/video/task/all/`

#### 请求参数
无

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "title": "任务1",
      "msg": "任务描述",
      "plan_id": 100,
      "voice_id": 10,
      "digital_human_id": 20,
      "language": "zh-CN",
      "speechRate": 1.0,
      "anchor_type": "type_a",
      "task_status": 0,
      "subtitleSelector": 1,
      "colour": "white",
      "create_time": "2024-03-24 10:30:00",
      "update_time": "2024-03-24 10:30:00"
    },
    {
      "id": 2,
      "title": "任务2",
      "msg": "任务描述2",
      "plan_id": 101,
      "voice_id": 11,
      "digital_human_id": 21,
      "language": "en-US",
      "speechRate": 1.2,
      "anchor_type": "type_b",
      "task_status": 1,
      "subtitleSelector": 0,
      "colour": null,
      "create_time": "2024-03-24 11:00:00",
      "update_time": "2024-03-24 11:00:00"
    }
  ]
}
```

---

### 4. 获取视频任务详情
**端点**: `GET /api/material/plan/video/task/{id}/`

#### 路径参数
- `id` (int): 视频任务 ID

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "title": "任务1",
    "msg": "任务描述",
    "plan_id": 100,
    "voice_id": 10,
    "digital_human_id": 20,
    "base_voice_url": "https://example.com/voice.mp3",
    "language": "zh-CN",
    "speechRate": 1.0,
    "anchor_type": "type_a",
    "isSkipRs": false,
    "video_cover_url": "https://example.com/cover.jpg",
    "user_group": "group_a",
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

### 5. 按计划ID获取视频任务（POST方式）
**端点**: `POST /api/material/plan/video/task/`

#### 请求参数
```json
{
  "plan_id": "计划ID (必填)"
}
```

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "title": "任务1",
      "msg": "任务描述",
      "plan_id": 100,
      "voice_id": 10,
      "digital_human_id": 20,
      "language": "zh-CN",
      "speechRate": 1.0,
      "anchor_type": "type_a",
      "task_status": 0,
      "subtitleSelector": 1,
      "colour": "white",
      "create_time": "2024-03-24 10:30:00",
      "update_time": "2024-03-24 10:30:00"
    }
  ]
}
```

---

### 6. 分页查询视频任务（GET方式）
**端点**: `GET /api/material/plan/video/task/paginate/`

#### 请求参数（Query String）
```
?page=1&page_size=10&search={}
```

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| page | int | 页码 | 1 |
| page_size | int | 每页条数 | 10 |
| search | json | 搜索条件（可选） | {} |

#### 响应示例（成功）
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 50,
    "list": [
      {
        "id": 1,
        "title": "任务1",
        "msg": "任务描述",
        "plan_id": 100,
        "voice_id": 10,
        "digital_human_id": 20,
        "language": "zh-CN",
        "speechRate": 1.0,
        "anchor_type": "type_a",
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

### 7. 分页查询视频任务（POST方式）⭐ 推荐使用
**端点**: `POST /api/material/plan/video/task/paginate/post/`

#### 请求参数
```json
{
  "page": "页码 (默认:1)",
  "pageSize": "每页条数 (默认:10)",
  "search": {
    "title": "任务标题(可选，模糊查询)",
    "plan_id": "计划ID(可选)",
    "task_status": "任务状态(可选, 0=待处理, 1=处理中, 2=已完成, 3=失败)",
    "language": "任务语言(可选)"
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
    "total": 50,
    "list": [
      {
        "id": 1,
        "title": "任务1",
        "msg": "任务描述",
        "plan_id": 100,
        "voice_id": 10,
        "digital_human_id": 20,
        "language": "zh-CN",
        "speechRate": 1.0,
        "anchor_type": "type_a",
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

## 任务状态说明

| 状态码 | 状态名 | 说明 |
|--------|--------|------|
| 0 | 待处理 | 新创建的任务 |
| 1 | 处理中 | 任务正在执行 |
| 2 | 已完成 | 任务执行成功 |
| 3 | 失败 | 任务执行失败 |

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
4. **推荐使用 POST 版分页**: 建议使用 `/plan/video/task/paginate/post/` 接口进行分页查询，更易维护和扩展
5. **异步处理**: 创建任务时，任务会异步推入调度系统，需要通过轮询或 WebSocket 获取执行结果

---

## 常见使用场景

### 场景1：创建完整的视频生成任务流程
1. 先调用 `/plan/video/create/` 创建计划
2. 然后调用 `/plan/video/task/create/` 创建该计划下的任务
3. 最后调用 `/plan/video/start/{id}/` 启动计划中的所有任务

### 场景2：查看计划下的所有任务
调用 `/plan/video/task/` 并传入 `plan_id`，或使用分页接口过滤 `plan_id`

### 场景3：监控任务执行状态
定期调用分页接口并查询 `task_status` 字段，或使用 WebSocket 实时推送

