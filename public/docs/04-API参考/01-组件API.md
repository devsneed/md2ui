# 组件 API

md2ui 的核心组件及其接口说明。

## TreeNode

树形节点组件，用于渲染文档导航。

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| item | Object | 节点数据 |
| currentDoc | String | 当前选中的文档 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| toggle | folder | 切换文件夹展开状态 |
| select | docKey | 选中文档 |

### item 数据结构

```javascript
{
  key: 'docs/guide.md',      // 唯一标识
  name: '使用指南',           // 显示名称
  type: 'file',              // 类型: file | folder
  path: '/docs/guide.md',    // 文件路径
  expanded: false,           // 是否展开(仅文件夹)
  children: []               // 子节点(仅文件夹)
}
```

## TableOfContents

文档目录组件，显示当前文档的标题大纲。

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| tocItems | Array | 目录项列表 |
| activeHeading | String | 当前高亮的标题 ID |
| collapsed | Boolean | 是否折叠 |
| width | Number | 组件宽度 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| scroll-to | headingId | 跳转到指定标题 |

### tocItems 数据结构

```javascript
[
  { id: 'heading-1', text: '快速开始', level: 1 },
  { id: 'heading-2', text: '安装', level: 2 },
  { id: 'heading-3', text: '配置', level: 2 }
]
```

## ImageZoom

图片放大组件。

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| visible | Boolean | 是否显示 |
| imageContent | String | 图片 HTML 内容 |

### Events

| 事件 | 说明 |
|------|------|
| close | 关闭放大视图 |
