# 云上内容生成平台前端 Codex 入口

本仓库是云上平台前端，主协调仓库是 `E:\houduan\director-video-service-cloud`。开始工作前先阅读：

1. `E:\houduan\director-video-service-cloud\AGENTS.md`
2. `E:\houduan\director-video-service-cloud\docs\Codex接手与当前状态.md`
3. `E:\houduan\director-video-service-cloud\docs\日常开发测试与发布操作手册.md`

## 前端规则

- 先执行 `git status --short`，不处理无关的 `.codex-temp/`、`.playwright-cli/`、压缩包、截图或用户文件。
- 接口以云上后端为准，不为旧接口增加无需求依据的兼容层。
- 路由可见性必须与后端权限一致，不能只隐藏菜单而允许直接输入路由访问。
- 面向用户使用“团队、成员、训练、数字人生成”等表达，不暴露“租户、worker、MQ”等内部术语。
- 普通成员不展示平台内部团队命名；平台管理员才可看到和切换团队。
- 团队素材共享必须同时覆盖数字人、声音、绑定关系；客户2默认保持仅本人可见。
- 不做移动端版本；桌面端必须避免溢出、挤压和只能在页面底部横向滚动。
- 视频和音频弹窗关闭时立即停止播放；列表优先展示封面，不能自动加载完整 MP4。
- 测试账号、脚本、截图和报告放 `测试文件/`，无复用价值的产物测试后清理。

## 最低验收

```powershell
Set-Location E:\qianduan\director-video-ui-cloud
npm run build
git diff --check
```

页面变更还必须用 Browser、Chrome 或 Playwright 做真实点击，至少检查登录、页面刷新、路由权限、不同身份数据边界、Network 中的 401/404 循环和异常媒体下载。未经用户明确授权，不发布生产。
