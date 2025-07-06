# 古籍阅读器 (Guji Reader)

一个基于 Vue3 + Element Plus 的古籍文献阅读与分析工具，集成了 PDF 阅读、AI 模型识别和古文解释功能。

## 功能特性

### 📖 PDF 阅读
- **PDF 文件支持**: 支持本地 PDF 文件上传和预览
- **分页阅读**: 提供翻页、缩放等基本阅读功能
- **PDF识别**: 将 PDF 页面转换为图片进行大模型识别

### 🤖 古文解释工具
- **实时解释**: 输入古文内容，获取现代汉语解释
- **流式响应**: 支持实时显示解释结果
- **专家级解释**: AI 模型

### ⚙️ 配置管理
- **模型配置**: 支持自定义 Base URL 和 API Key
- **模型选择**: 可选择不同的 AI 助手模型
- **本地存储**: 配置信息保存在浏览器本地

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Element Plus
- **构建工具**: Vite
- **状态管理**: Pinia
- **PDF 处理**: PDF.js
- **AI 服务**: Open AI API

## 项目结构

```
src/
├── components/
│   ├── SettingsPanel.vue        # 设置面板组件
│   ├── PdfViewer.vue            # PDF 预览组件
│   ├── TranslationPanel.vue     # 模型识别面板组件
│   └── AssistantTool.vue        # 古文解释工具
├── stores/
│   └── appStore.js              # Pinia 状态管理
├── utils/
│   ├── api.js                   # API 接口封装
│   └── pdfUtils.js              # PDF 处理工具
└── App.vue                      # 主应用组件
```

## 快速开始

### 环境要求
- Node.js 16.0 或更高版本
- 现代浏览器支持

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 使用说明

### 1. 初始配置
首次使用时需要配置大模型服务：
- 输入大模型 Base URL
- 配置 OPENAI_API_KEY（可选）
- 选择助手模型名称

### 2. PDF 阅读
- 点击选择PDF文件
- 使用翻页按钮浏览 PDF 内容
- 调整缩放比例（50%-200%）

### 3. 获取翻译
- 在 PDF 预览页面点击"获取大模型识别"按钮
- 系统自动将当前页面转换为图片
- 通过 AI 服务识别为简体中文
- 识别结果在右侧面板显示

### 4. 古文解释
- 在右边框输入古文内容
- 点击"解释"按钮获取现代汉语解释
- 支持实时流式显示解释结果

## 浏览器兼容性

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 PDF 阅读和 AI 识别
- 集成大模型古文解释工具
- 完整的配置管理功能
