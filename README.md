# DriveWeb
疲劳驾驶与分心检测Web端

## 文档
- Web前端界面功能设计文档：`docs/web-frontend-design.md`

## 项目结构
- `docs/`：设计文档与说明文档。
- `web/`：Web 前端工程（Vue 3 + TypeScript + Vite）。

## Web端开发环境
以下步骤适用于本地开发与联调。

### 1) 准备 Node.js
- 建议版本：Node.js `>= 20`
- 当前验证版本：Node.js `25.9.0`、npm `11.12.1`

如果本机未安装 Node.js（macOS）：

```bash
brew install node
```

### 2) 安装依赖
```bash
cd web
npm install
```

### 3) 启动开发环境
```bash
cd web
npm run dev
```

### 4) 构建产物
```bash
cd web
npm run build
```

### 5) 本地预览构建结果
```bash
cd web
npm run preview
```
