# Eastward — 农场模拟游戏

基于 Vite + React + TypeScript 的像素风农场经营游戏，Canvas 渲染，支持键盘与触屏操作。

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 生产构建，产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## 部署

推送到 `main` 分支后由 GitHub Actions 自动构建并发布到 GitHub Pages。

- 工作流：`.github/workflows/deploy.yml`
- 访问地址：https://ssssshql.github.io/Eastward/
- 首次部署需在仓库 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**

> 构建时通过 `GITHUB_ACTIONS` 环境变量自动把 `base` 切换为 `/Eastward/`，本地开发仍使用根路径。
