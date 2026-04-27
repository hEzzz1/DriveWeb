# DriveWeb Web Frontend

DriveWeb 前端工程，基于 `Vue 3 + TypeScript + Vite`。

## 代码结构
- 结构速查文档：`../docs/web-code-structure.md`

## 环境要求
- Node.js `>= 20`
- npm `>= 10`

## 安装依赖
```bash
npm install
```

## 本地开发
```bash
npm run dev
```

## 构建
```bash
npm run build
```

## 预览构建结果
```bash
npm run preview
```

## Docker 部署

1. 构建镜像
```bash
docker build -t driveweb-frontend .
```

2. 直接启动容器
```bash
docker run -d --name driveweb-frontend -p 80:80 --restart unless-stopped driveweb-frontend
```

3. 或使用 Compose
```bash
docker compose up -d --build
```

4. 如果前端路由刷新后返回 404，确认容器内使用的是 `nginx.conf`，并且已经启用 `try_files $uri $uri/ /index.html;`

## Push 即自动部署

如果这个仓库和后端仓库都部署在同一台服务器上，并且都托管在 GitHub，可以直接依赖仓库内的 GitHub Actions 自动发布：

1. 推送到 `master` 或 `main` 后自动触发
2. 通过 SSH 登录服务器
3. 在 `/opt/DriveServer` 执行 `FRONTEND_ROOT=/opt/DriveWeb ./deploy/release.sh compose`

需要在 GitHub Secrets 中配置：

1. `SERVER_HOST`
2. `SERVER_PORT`
3. `SERVER_USER`
4. `SERVER_SSH_KEY`

## 当前已安装核心依赖
- `vue-router`
- `pinia`
- `element-plus`
- `echarts`
- `axios`
- `async-validator`
