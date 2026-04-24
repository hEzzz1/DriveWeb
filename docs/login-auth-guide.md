# DriveWeb 登录与鉴权联调文档

## 1. 文档目的
用于说明 DriveWeb 登录与鉴权页面的本地运行、接口映射与联调步骤，确保前后端可以稳定对接。

后端接口依据：
- `/Users/m1ngyangg/Documents/DriveServer/docs/server-design/03-api-spec.md`

## 2. 实现范围
当前已完成：
1. 登录页（用户名/密码、表单校验、错误提示、traceId展示）。
2. 鉴权状态页（当前用户、角色、过期时间、剩余时长、退出登录）。
3. JWT 持久化与自动注入 `Authorization: Bearer <token>`。
4. 路由守卫（未登录重定向登录页，已登录阻止重复进入登录页）。
5. 统一响应解析（`code/message/data/traceId`）。

## 3. 接口映射
Base URL：
- 默认：`/api/v1`（开发环境推荐配合 Vite 代理）
- 生产或跨域部署时可通过 `VITE_API_BASE_URL` 覆盖

登录接口：
- 方法：`POST`
- 路径：`/auth/login`
- 完整地址（默认）：`/api/v1/auth/login`

请求示例：
```json
{
  "username": "admin",
  "password": "123456"
}
```

成功响应示例：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "<jwt>",
    "expireAt": "2026-04-07T12:00:00Z",
    "roles": ["ADMIN"]
  },
  "traceId": "trc_xxx"
}
```

## 4. 关键代码位置
- 登录页：`web/src/views/LoginView.vue`
- 鉴权状态页：`web/src/views/AuthStatusView.vue`
- 请求封装：`web/src/api/http.ts`
- 登录 API：`web/src/api/auth.ts`
- 鉴权 Store：`web/src/stores/auth.ts`
- 路由守卫：`web/src/router/index.ts`
- 开发代理：`web/vite.config.ts`

## 5. 本地启动
在项目根目录执行：
```bash
cd /Users/m1ngyangg/Documents/DriveWeb/web
npm install
npm run dev
```

打开：
- `http://localhost:5173`

## 6. 开发联调配置（推荐）
为了避免跨域问题，开发模式建议通过 Vite 代理访问后端。

1. 复制配置模板：
```bash
cd /Users/m1ngyangg/Documents/DriveWeb/web
cp .env.development.example .env.development
```

2. 修改 `.env.development`：
```env
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://<your-server-host>:8080
# 仅在前后端不共域时才需要
# VITE_WS_BASE_URL=ws://<your-server-host>:8080/ws/alerts
```

说明：
- `VITE_PROXY_TARGET` 需要改成 DriveServer 实际地址和端口。
- 不要把真实公网 IP、域名或内网地址提交到仓库。
- 修改后需要重启 `npm run dev`。

## 7. 联调检查步骤
1. 确认后端可访问（按实际端口调整）：
```bash
curl -X POST http://<your-server-host>:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

2. 浏览器访问登录页并输入账号密码。
3. 登录成功后应跳转鉴权状态页，显示角色与过期时间。
4. 浏览器开发者工具中检查请求头包含：
   - `Authorization: Bearer <token>`
5. 点击退出登录后应清理本地会话并返回登录页。

## 8. 登录失败提示说明
说明：
- 业务错误会按接口 `code` 解析。
- `40101`：账号密码错误或 token 失效。
- `40301`：无权限。
- 页面会展示 `traceId`，可用于后端日志追踪。

## 9. 验证命令
```bash
cd /Users/m1ngyangg/Documents/DriveWeb/web
npm run build
```

若构建通过，说明当前 TypeScript 类型与页面代码可正常编译。
