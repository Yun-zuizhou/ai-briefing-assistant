# `apps/web`

正式前端应用目录。

## 当前角色

1. 这里是当前唯一正式前端代码入口。
2. 正式页面只保留在 `src/pages`。
3. 正式前端通过 `src/services/api.ts` 访问 `apps/edge-worker`。
4. `/preview` 是当前公开预览入口；`/ai-digest-lab` 是当前受保护的调试/联调页。

## 目录说明

- `src/`
  - 正式 React 应用源码
- `src/demo/`
  - demo 页面、demo 组件、demo 本地状态与演示数据装配代码
- `demo/mock-data/`
  - demo/bootstrap 用的静态 JSON 资产
- `public/`
  - 当前正式前端仍需要保留的静态文件
- `cloudflare-pages.md`
  - 当前 Pages 部署说明

## 已退出正式主线的资产

以下历史资产已从当前应用目录移出，不再混放在正式前端目录中：

1. 历史设计预览 HTML
2. `design-preview/` 下的旧设计稿
3. 旧 `vercel.json`
4. 图标预览页与模板残留文件

归档位置：

- `_archive_workspace/design-and-drafts/apps-web-legacy-assets/`

## 当前约束

1. 不要把 demo 路由重新挂回正式 `BrowserRouter`。
2. 不要把演示 HTML、旧预览页和旧部署配置再放回这里。
3. 正式前端结构问题优先在这里收口，不回退到历史 `prototype` 口径。
