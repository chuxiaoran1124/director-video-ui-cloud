本文件描述如何在本地运行、开发、测试和构建本项目。

先决条件

- Node.js（建议 14+ 或 16+）
- npm 或 cnpm/pnpm（根据团队偏好）
- Git

安装依赖

在项目根目录运行：

```powershell
npm install
```

开发环境运行（含 mock）

项目使用 Vite 开发服务器。开发时通常会启用 mock 服务来模拟后端接口。

```powershell
# 启动开发服务器
npm run dev
```

默认开发服务器会监听 `http://localhost:3002`（readme 中提到）。如果端口冲突，请在 `vite.config.ts` 或相应启动参数中调整。

如何启用/禁用 Mock

- Mock 相关代码位于 `src/mock/`，vite 插件 `vite-plugin-mock` 在开发时会加载这些 mock。查看 `vite.config.ts` 中 mock 插件配置以控制是否启用。
- 若要在生产环境测试 mock，可以参考 `src/mock/mockProdServer.ts`（该文件可能用于生产模式下的 mock 配置），生产环境通常不启用 mock。

配置部分接口使用真实后端

1. 在 `.env.development` 中设置后端地址和需要忽略 mock 的接口：
```bash
# API 地址（改为你的实际后端地址）
VITE_API_URL=http://localhost:8000

# 代理配置
VITE_PROXY=[["/api","http://localhost:8000"]]

# 设置不使用 mock 的接口
VITE_IGNORE_MOCK=["/api/users/login"]
```

2. 重启开发服务器使配置生效：
```powershell
npm run dev
```

注意：被忽略的接口请求会通过配置的代理转发到真实后端。其他接口仍然使用 mock 数据。

构建与预览

```powershell
# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

测试

项目使用 Jest 进行单元测试。

```powershell
# 运行测试
npm run test
```

代码检查

```powershell
# ESLint 自动修复
npm run eslint

# Stylelint 自动修复
npm run stylelint
```

常见问题与排查

- 启动报端口占用：修改 `vite.config.ts` 中 dev server 端口或使用环境变量覆盖。
- Mock 不生效：检查 `vite.config.ts` 中 `vite-plugin-mock` 的配置（开发环境是否开启 `localEnabled` 等），确认 mock 文件已正确导出。
- 类型错误阻止构建：运行 `npm run build` 时，脚本里包含 `vuedx-typecheck .`，如果报类型错误，请先修复 TS 类型或暂时注释该步骤，仅用于临时构建。

编辑与新增页面/组件的快速指南

- 新页面/视图：在 `src/views/` 新建文件或目录 -> 在 `src/router/asyncRouter.ts` 或路由配置中添加路由映射 -> 在需要的地方使用。
- 新可复用组件：在 `src/components/` 新建组件 -> 在页面或布局中导入并使用。
- 新 API：在 `src/api/` 新建模块（例如 `user.ts`），并在 `utils/request.ts` 中复用请求封装。

- 写类型：在 `src/type/` 中添加或扩展类型声明，保持类型可复用。
- 测试覆盖：为关键业务逻辑和组件编写测试，提升代码质量。

如果你希望，我可以：
- 把 `STRUCTURE.md` 的内容扩展成更详细的开发者指南。
- 在 `package.json` 中添加便捷脚本（如 `start:dev` 指向 `vite --port 3002`、`lint:fix` 组合命令等）。
