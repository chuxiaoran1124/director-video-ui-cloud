# A2E 绑定关系接口

> Base URL：`/api/material/`
>
> 说明：
> - 绑定表模型：`MaterialA2EBinding`
> - 创建绑定时，前端只需要传本地 `voiceId` 和 `digitalHumanId`
> - 服务端会自动根据这两个 id 回填并保存当前的 `voiceName`、`digitalHumanName` 以及部分关联快照字段
> - 列表和分页查询时，会优先联表查询最新的声音名称和数字人名称返回给前端

---

## 1) 新增绑定

- **POST** `binding/create/`

### Body(JSON)
```json
{
  "voiceId": 1,
  "digitalHumanId": 2,
  "title": "直播带货组合"
}
```

### Response
```json
{
  "code": 200,
  "data": {
    "id": 10,
    "voiceId": 1,
    "digitalHumanId": 2,
    "voiceName": "甜美女声",
    "digitalHumanName": "客服数字人A",
    "voiceExternalId": "voice_xxx",
    "digitalHumanExternalId": "human_xxx",
    "digitalHumanCoverUrl": "https://xxx/cover.png",
    "voiceUrl": "https://xxx/voice.mp3",
    "digitalHumanUrl": "https://xxx/video.mp4",
    "createTime": "2026-03-08T12:00:00+08:00",
    "title": "直播带货组合",
    "deleted": null
  },
  "message": "创建成功"
}
```

---

## 2) 更新绑定

- **POST** `binding/update/<id>/`

### Body(JSON)
```json
{
  "voiceId": 3,
  "digitalHumanId": 2,
  "title": "新版组合"
}
```

> 如果更新了 `voiceId` 或 `digitalHumanId`，服务端会自动重新回填对应名称。

### Response
```json
{
  "code": 200,
  "data": {
    "id": 10,
    "voiceId": 3,
    "digitalHumanId": 2,
    "voiceName": "知性女声",
    "digitalHumanName": "客服数字人A",
    "title": "新版组合"
  },
  "message": "更新成功"
}
```

---

## 3) 删除绑定

- **POST** `binding/delete/<id>/`

### Response
```json
{
  "code": 200,
  "data": null,
  "message": "删除成功"
}
```

---

## 4) 查询全部（支持名称模糊查询）

- **GET** `binding/all/`

### Query 参数
- `title`：按标题模糊查询
- `voiceName`：按声音名称模糊查询
- `digitalHumanName`：按数字人名称模糊查询

### 示例
`/api/material/binding/all/?voiceName=甜美&digitalHumanName=客服`

### Response
```json
{
  "code": 200,
  "data": [
    {
      "id": 10,
      "voiceId": 1,
      "digitalHumanId": 2,
      "voiceName": "甜美女声",
      "digitalHumanName": "客服数字人A",
      "voiceExternalId": "voice_xxx",
      "digitalHumanExternalId": "human_xxx",
      "digitalHumanCoverUrl": "https://xxx/cover.png",
      "voiceUrl": "https://xxx/voice.mp3",
      "digitalHumanUrl": "https://xxx/video.mp4",
      "createTime": "2026-03-08T12:00:00+08:00",
      "title": "直播带货组合",
      "deleted": null
    }
  ],
  "message": "获取成功"
}
```

---

## 5) 按 ID 查询

- **GET** `binding/<id>/`

### Response
```json
{
  "code": 200,
  "data": {
    "id": 10,
    "voiceId": 1,
    "digitalHumanId": 2,
    "voiceName": "甜美女声",
    "digitalHumanName": "客服数字人A",
    "voiceExternalId": "voice_xxx",
    "digitalHumanExternalId": "human_xxx",
    "digitalHumanCoverUrl": "https://xxx/cover.png",
    "voiceUrl": "https://xxx/voice.mp3",
    "digitalHumanUrl": "https://xxx/video.mp4",
    "createTime": "2026-03-08T12:00:00+08:00",
    "title": "直播带货组合",
    "deleted": null
  },
  "message": "获取成功"
}
```

---

## 6) 分页查询（支持名称模糊查询）

- **POST** `binding/paginate/`

### Body(JSON)
```json
{
  "page": 1,
  "pageSize": 10,
  "search": {
    "title": "组合",
    "voiceName": "甜美",
    "digitalHumanName": "客服"
  }
}
```

### 说明
- `title`：按标题模糊查询
- `voiceName`：按声音名称模糊查询
- `digitalHumanName`：按数字人名称模糊查询
- `voiceId`：按声音 id 精确查询
- `digitalHumanId`：按数字人 id 精确查询

### Response
```json
{
  "code": 200,
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "data": [
      {
        "id": 10,
        "voiceId": 1,
        "digitalHumanId": 2,
        "voiceName": "甜美女声",
        "digitalHumanName": "客服数字人A",
        "voiceExternalId": "voice_xxx",
        "digitalHumanExternalId": "human_xxx",
        "digitalHumanCoverUrl": "https://xxx/cover.png",
        "voiceUrl": "https://xxx/voice.mp3",
        "digitalHumanUrl": "https://xxx/video.mp4",
        "createTime": "2026-03-08T12:00:00+08:00",
        "title": "直播带货组合",
        "deleted": null
      }
    ]
  },
  "message": "获取成功"
}
```
