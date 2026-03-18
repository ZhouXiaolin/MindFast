# MindFast

MindFast 是一个基于 `Tauri + React + TypeScript` 的桌面应用，围绕聊天式工作流、模型提供商配置和 Artifact 预览展开。

当前代码库已经按四层结构收敛：

```text
src/
  ai/      Agent、模型选择、Artifacts 运行时
  stores/  持久化、应用设置、存储封装
  utils/   纯函数与格式化工具
  ui/      页面、组件、hooks、主题、i18n
  init.ts  运行时初始化编排
```

## 主要能力

- 聊天会话创建、加载与持久化
- Provider / Model 管理
- Artifact 提取、列表展示与预览
- 主题、语言、聊天字体等应用设置
- Tauri 桌面容器集成

## 开发

安装依赖后可使用：

```bash
npm run dev
```

构建前端：

```bash
npm run build
```

启动 Tauri 命令：

```bash
npm run tauri
```

## 存储说明

- 聊天会话、Provider 配置和应用设置存储在浏览器侧的 IndexedDB
- 应用启动时会自动 hydrate 持久化设置
- 聊天消息更新后会自动回写会话元数据

## 目录说明

- [src/init.ts](/Users/solaren/Projects/MindFast/src/init.ts) 负责初始化 storage、agent 和 artifacts store
- [src/stores/app.ts](/Users/solaren/Projects/MindFast/src/stores/app.ts) 维护前端应用状态，并在启动后承接持久化设置
- [src/ui/chat/ChatUI.tsx](/Users/solaren/Projects/MindFast/src/ui/chat/ChatUI.tsx) 是聊天主界面
- [src/ui/settings/SettingsProvider.tsx](/Users/solaren/Projects/MindFast/src/ui/settings/SettingsProvider.tsx) 负责 Provider 配置
- [src/ui/artifacts/ArtifactPreview.tsx](/Users/solaren/Projects/MindFast/src/ui/artifacts/ArtifactPreview.tsx) 负责 Artifact 渲染分发
