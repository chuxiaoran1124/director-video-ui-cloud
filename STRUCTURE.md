# 项目结构说明（STRUCTURE）

根目录说明

- `package.json`：项目依赖、脚本、元信息。
- `vite.config.ts`：Vite 构建配置。
- `tsconfig.json`：TypeScript 编译配置。
- `tailwind.config.js`：TailwindCSS 配置（如果使用 Tailwind）。
- `readme.md`：项目总体说明（启动、构建、技术栈等）。

src/（源码）

- `main.ts`
  - 应用入口。创建 Vue 应用并挂载 `App.vue`。
  - 注册 Element Plus、Pinia、router、全局指令、全局组件（SvgIcon）和图标集合。
  - 导入全局 CSS、svg 注册等。

- `App.vue`
  - 根组件。
  - 使用 Element Plus 的 `ElConfigProvider` 管理组件国际化和主题相关的全局逻辑。
  - 监听并处理主题变换（调用 `changeThemeDefaultColor`、读取 `config/theme`）。

- `router/`
  - `index.ts`：静态路由注册（`allowRouter`），使用 `createRouter`。
  - `asyncRouter.ts`：按需组件映射（用于路由动态或组件懒加载）——项目使用组件集合合并到路由中。

- `store/`
  - `index.ts`：Pinia 实例初始化并导出（`pinia`）。
  - `modules/`：各个状态模块（示例：`layout.ts` 管理布局和主题设置）。

- `layout/`
  - `index.vue`：主布局（侧边栏 + 顶栏 + 标签 + 内容区）。
  - `components/`：布局内子组件（`content.vue`、`menubar.vue`、`navbar.vue`、`tags.vue`、`sideSetting.vue` 等）。
  - `blank.vue`、`redirect.vue`：特殊用途布局或重定向页面。

- `views/`
  - 页面视图目录，按功能分组（例如 `Dashboard/Workplace`、`Project`、`User`、`ErrorPage` 等）。每个文件或文件夹通常对应若干路由页面。

- `components/`
  - 可复用 UI 组件，如 `CardList`、`List`、`OpenWindow`、`SvnIcon` 等。

- `api/`
  - 业务接口封装，按模块组织（例如 `components/index.ts`, `layout/index.ts`），方便在页面中调用。

- `assets/`
  - 静态资源，如图片、全局 css（`css/index.css`）和本地 element-plus 样式。

- `mock/`
  - mock 数据和 mock server（`index.ts`, `mockProdServer.ts`, `response.ts`），以及 `data/` 下的模拟数据文件（如 `user.ts`）。用于开发阶段模拟后端接口。

- `utils/`
  - 常用工具函数与封装（`request.ts`, `tools.ts`, `permission.ts`, `changeThemeColor.ts` 等）。

- `directive/`
  - 自定义指令集合（`action.ts`, `format.ts`, `index.ts`），并在 `main.ts` 中注册。

- `icons/` / `src/icons/svg/`
  - svg 图标资源及注册相关文件（结合 `vite-plugin-svg-icons` 使用）。

- `type/`
  - TypeScript 类型声明（全局声明 `index.d.ts`, `shims-vue.d.ts`）以及按功能的类型文件（`config/`, `store/`, `views/` 等）。

- `test/`
  - Jest 单元测试（组件与工具函数测试）。

