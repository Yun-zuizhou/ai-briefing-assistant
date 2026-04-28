# `src/demo`

这里存放 demo 页面和演示代码层，不属于正式前端页面主线。

## 当前角色

1. `src/demo/pages`
   - demo 页面原型
2. `src/demo/components`
   - demo 专属组件
3. `src/demo/context`
   - demo 本地状态
4. `src/demo/data`
   - demo 页面直接消费的本地数据种子

## 与 `demo/mock-data` 的区别

- `src/demo/*`
  - 代码层 demo
- `demo/mock-data/*`
  - 静态 JSON 资产
  - 给 demo/bootstrap/离线脚本提供种子

两者当前并存是刻意保留的：

1. 一个承接 React demo 代码。
2. 一个承接静态数据文件。

## 当前约束

1. demo 设计价值只能通过吸收到正式 UI 来体现。
2. 不要把这里的页面重新挂回正式 `BrowserRouter`。
3. 如果 demo 继续膨胀，优先考虑继续归档或独立 demo app，而不是回灌正式前端。
