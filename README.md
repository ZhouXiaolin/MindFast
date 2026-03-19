# MindFast

基于 Tauri + React + TypeScript 的桌面应用，围绕聊天式工作流、模型提供商配置和 Artifact 预览展开。

## 技术栈

- **桌面框架**: Tauri 2.x
- **前端框架**: React 19 + TypeScript 5.8
- **构建工具**: Vite 7 + TailwindCSS 4
- **状态管理**: Zustand 5
- **AI 集成**: @mariozechner/pi-agent-core, @mariozechner/pi-ai
- **UI 组件**: Radix UI
- **国际化**: i18next + react-i18next

## 项目结构

```
src/
├── ai/           # Agent、模型选择、Artifacts 运行时
├── stores/       # 持久化、应用设置、存储封装
├── utils/        # 纯函数与格式化工具
├── ui/           # 页面、组件、hooks、主题、i18n
│   ├── chat/           # 聊天界面
│   ├── settings/       # 设置页面
│   ├── artifacts/      # Artifact 预览
│   ├── layouts/        # 布局组件
│   ├── themes/         # 主题配置
│   └── ...
├── styles/       # 全局样式
├── assets/       # 静态资源
├── init.ts       # 运行时初始化编排
├── main.tsx      # React 入口
├── App.tsx       # 根组件
└── routes.tsx    # 路由配置
```

## 主要功能

- 聊天会话创建、加载与持久化
- Provider / Model 管理与配置
- Artifact 提取、列表展示与预览
- 主题、语言、聊天字体等应用设置
- Tauri 桌面容器集成

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发模式

```bash
bun run dev
```

### 构建前端

```bash
bun run build
```

### 启动 Tauri 桌面应用

```bash
bun run tauri dev
```

### 构建生产版本

```bash
bun run tauri build
```

## 存储说明

- 聊天会话、Provider 配置和应用设置存储在浏览器侧的 IndexedDB
- 应用启动时会自动 hydrate 持久化设置
- 聊天消息更新后会自动回写会话元数据

## 代码约定

- 使用 bun 代替 npm（项目约定）
- 函数组件优先，使用 Hooks
- Zustand 管理应用状态
- TailwindCSS 编写样式
- 遵循 React 最佳实践

## 相关文档

- [初始化流程](./src/init.ts) - 负责初始化 storage、agent 和 artifacts store
- [应用状态](./src/stores/app.ts) - 维护前端应用状态，并在启动后承接持久化设置
- [聊天界面](./src/ui/chat/ChatUI.tsx) - 聊天主界面
- [设置页面](./src/ui/settings/SettingsProvider.tsx) - Provider 配置
- [Artifact 预览](./src/ui/artifacts/ArtifactPreview.tsx) - Artifact 渲染分发