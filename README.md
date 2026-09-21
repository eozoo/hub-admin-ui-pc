# hub-admin-ui-pc

Cowave Hub 管理后台的 Vue 3 PC 端工程。

## 技术栈

- Vue 3 + TypeScript + Vite
- Pinia + Vue Router 4
- Element Plus
- Axios

## 本地开发

```bash
npm install
npm run dev
npm run build:uat
```

开发服务器固定运行在 `http://localhost:8081`，`/dev-api/admin` 会代理到 `http://localhost:19010/admin`。

## 目录约定

```text
src/
├── api/          按 auth/rbac/sys/tenant/notice/flow/home 领域归类
├── components/   通用组件
├── composables/  组合式能力（如字典）
├── directives/   权限指令
├── layouts/      页面布局
├── router/       静态路由、守卫、动态路由转换
├── stores/       Pinia 状态
├── styles/       全局样式
├── types/        领域类型
├── utils/        请求、缓存、权限等基础设施
└── views/        按领域归类的页面
```

按钮权限使用 `v-has-permi="['sys:user:add']"`，角色权限使用 `v-has-role="['admin']"`。字典通过 `useDict('dict_type')` 获取并由 Pinia 统一缓存。

SVG 图标放入 `src/assets/icons/svg` 后即可通过 `<svg-icon icon-class="user" />` 使用，`icon-class` 与文件名一致，不包含 `.svg` 后缀。
