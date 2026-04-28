# API设计与类型一致性问题

## 问题概述
在审查 edge-worker（后端）与 web（前端）的代码过程中，发现 API 契约、类型定义及数据转换层存在多处不一致或设计隐患。此类问题可能导致运行时错误、类型安全失效及前后端联调成本增加。

---

## 1. 类型定义分散且存在重复定义风险

**问题描述：**
- 前后端共享类型（如 `User`, `Todo`, `Note`, `Report` 等）分散在多个文件中，部分类型在前后端各自独立定义，未形成统一的 Single Source of Truth。
- 例如，`apps/web/src/services/api.ts` 中定义的接口类型与 `apps/edge-worker/src/` 下的类型存在字段命名差异（如 `snake_case` vs `camelCase`）。

**影响范围：**
- 前后端数据交互时容易出现字段映射错误。
- 重构时容易遗漏，导致类型不同步。

**建议：**
- 建立 `packages/shared-types` 或类似共享包，集中管理前后端共用的 TypeScript 类型。
- 在数据库模型层统一使用 `snake_case`，在 API 序列化/反序列化层统一转换为 `camelCase`。

---

## 2. API 错误处理与状态码不一致

**问题描述：**
- 部分 API 路由在异常情况下返回的状态码和错误消息体格式不统一。例如：
  - `auth-guard.route.test.ts` 中期望返回 `401` 和 `Authentication required` 文本。
  - 但部分路由可能返回 JSON 格式的错误对象，部分返回纯文本。
- `apps/edge-worker/src/utils/internal-auth.ts` 中的错误处理逻辑与路由层的错误捕获逻辑存在重复。

**影响范围：**
- 前端难以统一处理错误响应。
- 测试用例需要针对不同路由写不同的错误断言逻辑。

**建议：**
- 统一错误响应格式，例如：`{ error: string, code: string, status: number }`。
- 引入全局异常过滤器（或 Hono 的 Error Handler），统一捕获并格式化所有未处理异常。

---

## 3. 数据库工具函数缺乏类型安全

**问题描述：**
- `apps/edge-worker/src/utils/db.ts` 中的数据库工具函数（如查询构造器）返回类型多为 `any` 或泛型约束不足。
- 部分 SQL 查询使用字符串拼接，存在潜在的 SQL 注入风险（尽管 D1 使用参数化查询，但工具层封装不够完善）。

**影响范围：**
- 数据库操作缺乏编译期类型检查。
- 开发者体验差，容易写错字段名。

**建议：**
- 为 db 工具函数增加更强的泛型约束，确保返回类型与查询目标一致。
- 审查所有 SQL 拼接逻辑，确保 100% 使用参数化查询。

---

## 4. 路由层缺乏统一的请求校验中间件

**问题描述：**
- 各路由文件（如 `dashboard.ts`, `actions.ts`, `reports.ts`）中，请求参数校验逻辑分散，部分路由甚至缺少显式校验。
- 例如，`/api/v1/actions/check-in` 的 POST 请求体未在路由层看到明确的 schema 校验。

**影响范围：**
- 无效请求可能直达业务逻辑层，导致运行时错误或数据污染。
- 各路由各自实现校验，代码重复。

**建议：**
- 引入 Zod 或 Valibot 作为统一的请求校验库。
- 在 Hono 应用实例上挂载全局校验中间件，或为每个路由模块定义标准的校验流程。

---

## 5. 部分 API 返回数据结构不够稳定

**问题描述：**
- `apps/edge-worker/src/services/reports/builder.ts` 中的报告生成逻辑，在数据缺失时（如 `interests` 为空数组），会填充默认文案。这种“兜底”逻辑虽然友好，但导致 API 返回的数据结构不够纯粹，前端难以判断哪些是真实数据、哪些是默认值。
- `buildGrowthKeywords` 和 `buildPersonaSummary` 等函数将业务文案硬编码在服务端。

**影响范围：**
- 前端无法根据数据状态做差异化展示。
- 国际化（i18n）时，服务端硬编码中文文案会成为阻碍。

**建议：**
- API 返回原始数据，文案填充逻辑移至前端或由专门的文案服务处理。
- 或者，在返回体中增加 `meta` 字段标识哪些数据是默认值。

---

## 关联文件
- `apps/edge-worker/src/utils/db.ts`
- `apps/edge-worker/src/routes/*.ts`
- `apps/edge-worker/src/services/reports/builder.ts`
- `apps/web/src/services/api.ts`
- `apps/edge-worker/tests/auth-guard.route.test.ts`
