# md2ui

一个基于 Vue 3 的文档渲染系统，将本地 Markdown 文档转换为美观的 HTML 页面。

## 功能特性

- 📚 **文档管理** - 自动扫描并构建文档目录树
- 🎨 **美观界面** - 三栏布局（导航栏、内容区、目录）
- 📝 **Markdown 渲染** - 支持 GFM 语法和代码高亮
- 📊 **Mermaid 图表** - 支持流程图、时序图等
- 🔍 **目录导航** - 自动提取文档大纲
- 📱 **响应式设计** - 适配不同屏幕尺寸
- ⚡ **快速加载** - 基于 Vite 构建

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Vite - 下一代前端构建工具
- Marked - Markdown 解析器
- Mermaid - 图表渲染库
- Lucide Vue - 图标库

## 项目结构

```
md2ui/
├── public/                    # 静态资源
│   ├── README.md             # 首页内容
│   └── docs/                 # 文档目录
│       ├── 00-项目概览.md
│       ├── 代码结构/
│       └── 架构设计/
├── src/
│   ├── api/                  # API 接口
│   │   └── docs.js          # 文档列表获取
│   ├── components/           # 组件
│   │   ├── TreeNode.vue     # 树形节点
│   │   └── TableOfContents.vue  # 目录组件
│   ├── composables/          # 组合式函数
│   │   ├── useMarkdown.js   # Markdown 渲染
│   │   ├── useScroll.js     # 滚动处理
│   │   └── useResize.js     # 拖拽调整
│   ├── App.vue              # 主组件
│   ├── main.js              # 入口文件
│   └── style.css            # 全局样式
├── index.html               # HTML 模板
├── vite.config.js           # Vite 配置
└── package.json             # 项目配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 文档组织

### 目录结构

文档放在 `public/docs/` 目录下，支持多级嵌套：

```
public/docs/
├── 00-项目概览.md
├── 代码结构/
│   ├── 业务层/
│   │   └── service包说明.md
│   └── 基础设施/
│       └── config包说明.md
└── 架构设计/
    └── 01-核心业务流程.md
```

### 文件命名规范

- 使用 `序号-名称.md` 格式，如 `00-项目概览.md`
- 序号用于控制排序，数字越小越靠前
- 文件夹也可以使用序号前缀

### 首页内容

首页内容来自 `public/README.md` 文件，可以自定义项目介绍、快速开始等内容。

## 功能说明

### 左侧导航栏

- 显示文档目录树
- 支持文件夹展开/折叠
- 支持全部展开/收起
- 可拖拽调整宽度
- 可收起/展开

### 中间内容区

- 渲染 Markdown 文档
- 支持代码高亮
- 支持 Mermaid 图表
- 显示阅读进度
- 返回顶部按钮

### 右侧目录

- 自动提取文档标题
- 支持多级标题
- 点击跳转到对应位置
- 高亮当前阅读位置
- 可拖拽调整宽度
- 可收起/展开

## 自定义配置

### 修改端口

编辑 `vite.config.js`：

```javascript
export default defineConfig({
  server: {
    port: 3000  // 修改为你想要的端口
  }
})
```

### 修改标题

编辑 `index.html`：

```html
<title>你的项目名称</title>
```

编辑 `src/App.vue` 中的 logo 部分：

```vue
<div class="logo">
  <h2>📚 你的项目名称</h2>
</div>
```

或修改 `src/components/Logo.vue` 中的 logo-text。

### 自定义样式

编辑 `src/style.css` 文件，可以修改颜色、字体、间距等样式。

## 部署

### 静态部署

构建后将 `dist` 目录部署到任何静态服务器：

```bash
pnpm build
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 开发指南

### 添加新功能

1. 在 `src/composables/` 创建组合式函数
2. 在 `src/components/` 创建 Vue 组件
3. 在 `src/App.vue` 中引入使用

### 代码规范

- 使用 Vue 3 Composition API
- 组件使用 `<script setup>` 语法
- 提取可复用逻辑到 composables
- 保持组件职责单一

## 常见问题

### 文档不显示？

检查文档路径是否正确，确保文件在 `public/docs/` 目录下。

### Mermaid 图表不渲染？

确保代码块使用 ` ```mermaid ` 标记，并检查图表语法是否正确。

### 样式显示异常？

清除浏览器缓存，或使用无痕模式测试。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
