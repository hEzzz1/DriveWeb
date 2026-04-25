# Web 前端代码结构速查

这份文档的目标很直接：以后改代码时，先看这里，再决定要不要全局搜索。

## 一眼看懂主链路

`web/index.html` -> `web/src/main.ts` -> `web/src/App.vue` -> `web/src/router/index.ts` -> `web/src/views/*`

同时，业务逻辑通常分到这几层：

- `src/api/`：只放接口请求和请求封装。
- `src/stores/`：只放跨页面状态。
- `src/utils/`：只放纯函数和格式化/归一化逻辑。
- `src/types/`：只放类型定义和枚举常量。
- `src/views/`：页面级组件。
- `src/components/`：跨页面可复用组件。

## 目录结构

### `web/`

- `index.html`：Vite 入口 HTML。
- `public/`：静态资源，构建时原样输出。
- `src/`：前端主代码。
- `vite.config.ts`：构建、代理、环境变量相关配置。
- `tsconfig*.json`：TypeScript 配置。

### `web/src/`

#### `main.ts`

应用启动入口。这里负责把 `App.vue`、`router`、`pinia`、`Element Plus` 装配起来。

#### `App.vue`

全局壳层，负责：

- 判断公共页和登录后页面。
- 控制顶部导航和用户区。
- 展示实时连接状态。
- 退出登录和页面切换。

如果你要改全局导航、顶部标题、登录后壳层布局，先看这里。

#### `router/`

- `router/index.ts`：路由定义和登录守卫。

这里决定：

- 哪些页面需要登录。
- 登录后跳哪里。
- 未登录访问受限页时跳到哪里。

#### `api/`

- `api/http.ts`：Axios 实例、token 注入、错误归一化、全局错误提示。
- `api/auth.ts`：登录相关接口。
- `api/alerts.ts`：告警列表、详情、处置相关接口。

如果接口报错样式、401/403 处理、请求超时提示要改，优先看 `http.ts`。

#### `stores/`

- `stores/auth.ts`：登录态、token、角色、过期时间、本地持久化。
- `stores/realtime.ts`：WebSocket 实时连接、重连、订阅、去重。

如果是“页面不刷新还想保持登录态”或者“实时告警没推过来”，先看这层。

#### `views/`

- `views/LoginView.vue`：登录页。
- `views/AuthStatusView.vue`：实时总览/鉴权状态页。
- `views/AlertsListView.vue`：告警列表页。
- `views/AlertDetailView.vue`：告警详情页。

页面级逻辑尽量只放这里，不要散到工具层。

#### `components/`

- `components/AlertActionDialog.vue`：告警处置弹窗。
- `components/HelloWorld.vue`：Vite 默认示例组件，通常可以忽略或删除。

如果一个 UI 片段只在一个页面用，先放 `views/`；如果会被多个页面复用，再提到 `components/`。

#### `utils/`

- `utils/alerts.ts`：告警数据格式化、枚举映射、实时事件归一化、筛选匹配。
- `utils/auth.ts`：token 过期判断、本地存储字段、时间格式化。

这里应该保持“无副作用”。有网络请求、Vue 响应式、路由跳转的逻辑，不要放这里。

#### `types/`

- `types/api.ts`：接口通用返回结构、登录请求/响应、用户角色。
- `types/alerts.ts`：告警领域类型、实时事件类型、状态/风险等级枚举。

如果某个字段是后端契约的一部分，优先在这里收口，再让 API、store、view 去消费它。

#### `assets/` 和 `style.css`

- `assets/`：图片、图标等静态资源。
- `style.css`：全局样式入口。

## 核心数据流

### 登录

1. `LoginView.vue` 提交表单。
2. `stores/auth.ts` 调用 `api/auth.ts`。
3. `api/http.ts` 统一处理 token 注入和错误提示。
4. 成功后把 token、角色、过期时间写入本地存储。
5. `router/index.ts` 的守卫根据登录态决定跳转。

### 告警列表和详情

1. `AlertsListView.vue` 和 `AlertDetailView.vue` 调用 `api/alerts.ts`。
2. 返回数据先走 `types/alerts.ts` 和 `utils/alerts.ts` 的归一化。
3. 页面只负责展示、筛选、处置动作和路由跳转。

### 实时更新

1. `App.vue` 监听登录态变化。
2. 登录后调用 `stores/realtime.ts` 建立 WebSocket。
3. 实时消息先归一化，再分发给页面订阅者。
4. 列表页和详情页按自己的规则决定是否消费这条事件。

## 常见修改先看哪里

- 改登录校验、角色、 token 过期逻辑：`stores/auth.ts` + `utils/auth.ts` + `router/index.ts`
- 改全局导航、顶部栏、退出登录：`App.vue`
- 改请求错误提示、401/403 处理、接口基地址：`api/http.ts`
- 改告警列表筛选、分页、路由参数同步：`views/AlertsListView.vue`
- 改告警详情展示、处置动作、时间线：`views/AlertDetailView.vue`
- 改实时消息格式、去重、重连策略：`stores/realtime.ts` + `utils/alerts.ts`
- 改后端返回字段映射：先看 `types/alerts.ts`，再看 `utils/alerts.ts`
- 新增一个页面：先改 `router/index.ts`，再决定是否需要在 `App.vue` 加导航入口

## 推荐的定位顺序

当你要改一个需求时，建议按这个顺序查：

1. 先看这份文档，确认属于哪一层。
2. 再打开对应的 `types` 或 `utils`，确认数据长什么样。
3. 然后看 `api` 或 `store`，确认数据怎么进来、怎么流转。
4. 最后看 `views` 或 `App.vue`，做页面改动。

这样通常不需要全局搜索。
