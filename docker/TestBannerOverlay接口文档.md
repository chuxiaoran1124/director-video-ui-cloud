"# 测试横幅叠加接口文档

> 基础路径：`/api/material/test/banner/overlay/`

---

## 1. 横幅叠加初始化

初始化合成任务，传入背景图和叠加图的 URL，返回初始化结果。

| 项目 | 内容 |
|------|------|
| **路径** | `/api/material/test/banner/overlay/init/` |
| **方法** | `POST` |
| **认证** | 无需 |
| **Content-Type** | `application/json` |

### 请求参数（Body JSON）

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `background_url` | string | 是 | - | 背景图 URL |
| `overlay_url` | string | 是 | - | 叠加图 URL |
| `default_scale` | float | 否 | `0.5` | 默认缩放比例 |

### 请求示例

```json
{
  \"background_url\": \"https://example.com/bg.png\",
  \"overlay_url\": \"https://example.com/overlay.png\",
  \"default_scale\": 0.5
}
```

### 响应格式

```json
{
  \"code\": 200,
  \"message\": \"测试成功\",
  \"data\": { }
}
```

---

## 2. 横幅叠加预览

根据 base64 编码的图片和变换参数，实时生成预览效果。

| 项目 | 内容 |
|------|------|
| **路径** | `/api/material/test/banner/overlay/preview/` |
| **方法** | `POST` |
| **认证** | 无需 |
| **Content-Type** | `application/json` |

### 请求参数（Body JSON）

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `background_base64` | string | 是 | - | 背景图的 Base64 编码 |
| `overlay_base64` | string | 是 | - | 叠加图的 Base64 编码 |
| `x` | float | 否 | `0` | 叠加图 X 轴偏移 |
| `y` | float | 否 | `0` | 叠加图 Y 轴偏移 |
| `scale_x` | float | 否 | `0` | X 轴缩放比例 |
| `scale_y` | float | 否 | `0` | Y 轴缩放比例 |
| `rotate` | float | 否 | `0` | 旋转角度（度） |
| `opacity` | float | 否 | `1` | 叠加图不透明度（0~1） |

### 请求示例

```json
{
  \"background_base64\": \"iVBORw0KGgoAAAANSUhEUgAA...\",
  \"overlay_base64\": \"iVBORw0KGgoAAAANSUhEUgAA...\",
  \"x\": 100,
  \"y\": 200,
  \"scale_x\": 0.8,
  \"scale_y\": 0.8,
  \"rotate\": 45,
  \"opacity\": 0.9
}
```

### 响应格式

```json
{
  \"code\": 200,
  \"message\": \"测试成功\",
  \"data\": { }
}
```

---

## 3. 横幅叠加保存

根据变换参数生成最终合成图，上传至存储并返回结果。

| 项目 | 内容 |
|------|------|
| **路径** | `/api/material/test/banner/overlay/save/` |
| **方法** | `POST` |
| **认证** | 需要（Header 传 Token） |
| **Content-Type** | `application/json` |

### 请求头

| 参数名 | 说明 |
|--------|------|
| `Authorization` | `Bearer <token>` |

### 请求参数（Body JSON）

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `background_base64` | string | 是 | - | 背景图的 Base64 编码 |
| `overlay_base64` | string | 是 | - | 叠加图的 Base64 编码 |
| `x` | float | 否 | `0` | 叠加图 X 轴偏移 |
| `y` | float | 否 | `0` | 叠加图 Y 轴偏移 |
| `scale_x` | float | 否 | `0` | X 轴缩放比例 |
| `scale_y` | float | 否 | `0` | Y 轴缩放比例 |
| `rotate` | float | 否 | `0` | 旋转角度（度） |
| `opacity` | float | 否 | `1` | 叠加图不透明度（0~1） |
| `file_name` | string | 否 | `\"test_output.png\"` | 输出文件名 |

### 请求示例

```json
{
  \"background_base64\": \"iVBORw0KGgoAAAANSUhEUgAA...\",
  \"overlay_base64\": \"iVBORw0KGgoAAAANSUhEUgAA...\",
  \"x\": 100,
  \"y\": 200,
  \"scale_x\": 0.8,
  \"scale_y\": 0.8,
  \"rotate\": 45,
  \"opacity\": 0.9,
  \"file_name\": \"my_banner.png\"
}
```

### 响应格式

```json
{
  \"code\": 200,
  \"message\": \"测试成功\",
  \"data\": { }
}
```

### 错误响应

| HTTP 状态码 | 说明 |
|-------------|------|
| `401` | 缺少认证信息 / Token 无效 / 无法获取用户信息 |

---

## 通用说明

- 所有接口统一返回格式为 `{ \"code\": number, \"message\": \"string\", \"data\": ... }`
- 成功时 `code` 为 `200`
- `data` 的具体结构由 `VideoAPIService` 的对应方法决定
"