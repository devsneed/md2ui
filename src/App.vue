<template>
  <div class="container">
    <aside v-if="!sidebarCollapsed" class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <div class="logo">
        <div class="logo-group">
          <Logo @go-home="loadFirstDoc" />
          <a href="https://github.com/devsneed/md2ui" target="_blank" class="github-link" title="GitHub">
            <Github :size="14" />
          </a>
        </div>
        <button class="sidebar-toggle" @click="sidebarCollapsed = true" title="收起导航">
          <PanelLeftClose :size="16" />
        </button>
      </div>
      <nav class="nav-menu">
        <div class="nav-section">
          <span>文档目录</span>
          <div class="nav-actions">
            <button class="action-btn" @click="expandAll" title="全部展开">
              <ChevronsDownUp :size="14" />
            </button>
            <button class="action-btn" @click="collapseAll" title="全部收起">
              <ChevronsUpDown :size="14" />
            </button>
          </div>
        </div>
        <TreeNode
          v-for="item in docsList"
          :key="item.key"
          :item="item"
          :currentDoc="currentDoc"
          @toggle="toggleFolder"
          @select="loadDoc"
        />
      </nav>
    </aside>
    <div v-if="!sidebarCollapsed" class="resizer resizer-left" @mousedown="startResize('left', $event)"></div>
    <button v-if="sidebarCollapsed" class="expand-btn expand-btn-left" @click="sidebarCollapsed = false" title="展开导航">
      <PanelLeftOpen :size="16" />
    </button>
    <main class="content" @scroll="handleScroll" @click="handleContentClick">
      <article class="markdown-content" v-html="htmlContent"></article>
    </main>
    <div v-if="!tocCollapsed && tocItems.length > 0" class="resizer resizer-right" @mousedown="startResize('right', $event)"></div>
    <TableOfContents :tocItems="tocItems" :activeHeading="activeHeading" :collapsed="tocCollapsed" :width="tocWidth" @toggle="tocCollapsed = !tocCollapsed" @scroll-to="scrollToHeading" />
    <button v-if="tocCollapsed && tocItems.length > 0" class="expand-btn expand-btn-right" @click="tocCollapsed = false" title="展开目录">
      <PanelRightOpen :size="16" />
    </button>
    <transition name="fade">
      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop" title="返回顶部">
        <ArrowUp :size="20" />
        <span class="progress-text">{{ scrollProgress }}%</span>
      </button>
    </transition>
    <ImageZoom :visible="zoomVisible" :imageContent="zoomContent" @close="zoomVisible = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ChevronsDownUp, ChevronsUpDown, ArrowUp, PanelLeftOpen, PanelLeftClose, PanelRightOpen, Github } from 'lucide-vue-next'
import MD5 from 'crypto-js/md5'
import Logo from './components/Logo.vue'
import TreeNode from './components/TreeNode.vue'
import TableOfContents from './components/TableOfContents.vue'
import ImageZoom from './components/ImageZoom.vue'
import { getDocsList } from './api/docs.js'
import { useMarkdown } from './composables/useMarkdown.js'
import { useScroll } from './composables/useScroll.js'
import { useResize } from './composables/useResize.js'

const docsList = ref([])
const currentDoc = ref('')
const sidebarCollapsed = ref(false)
const tocCollapsed = ref(false)
const zoomVisible = ref(false)
const zoomContent = ref('')

const { htmlContent, tocItems, renderMarkdown } = useMarkdown()
const { scrollProgress, showBackToTop, activeHeading, handleScroll: _handleScroll, scrollToHeading: _scrollToHeading, scrollToTop } = useScroll()

// 包装滚动处理，同步锚点到 URL
function handleScroll(e) {
  _handleScroll(e)
  // 滚动时更新 URL 锚点
  if (activeHeading.value) {
    updateHash(activeHeading.value)
  } else {
    updateHash('')
  }
}

// 包装目录点击，同步锚点到 URL
function scrollToHeading(id) {
  _scrollToHeading(id)
  updateHash(id)
}
const { sidebarWidth, tocWidth, startResize } = useResize()

async function loadDocsList() {
  docsList.value = await getDocsList()
}

// 加载第一个文档
function loadFirstDoc() {
  const firstDoc = findFirstDoc(docsList.value)
  if (firstDoc) {
    loadDoc(firstDoc.key)
  }
}

// 根据 key 生成 hash
function docHash(key) {
  return MD5(key).toString()
}

// 更新 URL hash（文档hash + 可选锚点）
function updateHash(anchor) {
  if (!currentDoc.value) return
  const base = docHash(currentDoc.value)
  window.location.hash = anchor ? `${base}/${anchor}` : base
}

async function loadDoc(key) {
  currentDoc.value = key
  updateHash('')
  const doc = findDoc(docsList.value, key)
  if (!doc) return
  try {
    const response = await fetch(doc.path)
    if (response.ok) {
      const content = await response.text()
      await renderMarkdown(content)
      const contentEl = document.querySelector('.content')
      if (contentEl) contentEl.scrollTop = 0
    }
  } catch (error) {
    console.error('加载文档失败:', error)
  }
}

function findDoc(items, key) {
  for (const item of items) {
    if (item.type === 'file' && item.key === key) return item
    if (item.type === 'folder' && item.children) {
      const found = findDoc(item.children, key)
      if (found) return found
    }
  }
  return null
}

function toggleFolder(item) {
  item.expanded = !item.expanded
}

function expandAll() {
  function expand(items) {
    items.forEach(item => {
      if (item.type === 'folder') {
        item.expanded = true
        if (item.children) expand(item.children)
      }
    })
  }
  expand(docsList.value)
}

function collapseAll() {
  function collapse(items) {
    items.forEach(item => {
      if (item.type === 'folder') {
        item.expanded = false
        if (item.children) collapse(item.children)
      }
    })
  }
  collapse(docsList.value)
}

function handleContentClick(event) {
  const target = event.target
  if (target.tagName === 'IMG' && target.classList.contains('zoomable-image')) {
    zoomContent.value = `<img src="${target.src}" alt="${target.alt || ''}" style="max-width: 100%; height: auto;" />`
    zoomVisible.value = true
    return
  }
  const mermaidEl = target.closest('.mermaid')
  if (mermaidEl && mermaidEl.classList.contains('zoomable-image')) {
    zoomContent.value = mermaidEl.innerHTML
    zoomVisible.value = true
  }
}

// 查找第一个文档
function findFirstDoc(items) {
  for (const item of items) {
    if (item.type === 'file') return item
    if (item.type === 'folder' && item.children) {
      const found = findFirstDoc(item.children)
      if (found) return found
    }
  }
  return null
}

// 显示无文档提示
function showEmptyMessage() {
  renderMarkdown(`# 当前目录没有 Markdown 文档

请在当前目录下添加 \`.md\` 文件，然后刷新页面。

## 文档组织示例

\`\`\`
your-docs/
├── 00-快速开始.md
├── 01-功能特性.md
└── 02-进阶指南/
    ├── 01-目录结构.md
    └── 02-自定义配置.md
\`\`\`
`)
}

// 根据 hash 查找文档
function findDocByHash(items, hash) {
  for (const item of items) {
    if (item.type === 'file' && docHash(item.key) === hash) return item
    if (item.type === 'folder' && item.children) {
      const found = findDocByHash(item.children, hash)
      if (found) return found
    }
  }
  return null
}

// 展开文档所在的所有父级文件夹
function expandParents(items, targetKey) {
  for (const item of items) {
    if (item.type === 'file' && item.key === targetKey) return true
    if (item.type === 'folder' && item.children) {
      if (expandParents(item.children, targetKey)) {
        item.expanded = true
        return true
      }
    }
  }
  return false
}

onMounted(async () => {
  await loadDocsList()
  
  const rawHash = window.location.hash.replace('#', '')
  const [hash, anchor] = rawHash.includes('/') 
    ? [rawHash.split('/')[0], rawHash.split('/').slice(1).join('/')]
    : [rawHash, '']
  
  if (hash) {
    const doc = findDocByHash(docsList.value, hash)
    if (doc) {
      expandParents(docsList.value, doc.key)
      await loadDoc(doc.key)
      // 恢复锚点位置
      if (anchor) {
        await nextTick()
        // 等待 DOM 渲染完成后再滚动
        setTimeout(() => {
          _scrollToHeading(anchor)
          updateHash(anchor)
        }, 100)
      }
      return
    }
  }
  
  // 没有 hash 或找不到对应文档，加载第一个
  const firstDoc = findFirstDoc(docsList.value)
  if (firstDoc) {
    await loadDoc(firstDoc.key)
  } else {
    showEmptyMessage()
  }
})
</script>
