<template>
  <div class="container">
    <aside v-if="!sidebarCollapsed" class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <div class="logo">
        <Logo @go-home="loadReadme" />
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
    <button v-else class="collapse-btn collapse-btn-left" @click="sidebarCollapsed = true" title="收起导航">
      <PanelLeftClose :size="16" />
    </button>
    <main class="content" @scroll="handleScroll" @click="handleContentClick">
      <article class="markdown-content" v-html="htmlContent"></article>
    </main>
    <div v-if="!tocCollapsed && tocItems.length > 0" class="resizer resizer-right" @mousedown="startResize('right', $event)"></div>
    <TableOfContents :tocItems="tocItems" :activeHeading="activeHeading" :collapsed="tocCollapsed" :width="tocWidth" @scroll-to="scrollToHeading" />
    <button v-if="tocCollapsed && tocItems.length > 0" class="expand-btn expand-btn-right" @click="tocCollapsed = false" title="展开目录">
      <PanelRightOpen :size="16" />
    </button>
    <button v-else-if="tocItems.length > 0" class="collapse-btn collapse-btn-right" @click="tocCollapsed = true" title="收起目录">
      <PanelRightClose :size="16" />
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
import { ref, onMounted } from 'vue'
import { ChevronsDownUp, ChevronsUpDown, ArrowUp, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose } from 'lucide-vue-next'
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
const { scrollProgress, showBackToTop, activeHeading, handleScroll, scrollToHeading, scrollToTop } = useScroll()
const { sidebarWidth, tocWidth, startResize } = useResize()

async function loadDocsList() {
  docsList.value = await getDocsList()
}

async function loadReadme() {
  currentDoc.value = ''
  try {
    const response = await fetch('/README.md')
    if (response.ok) {
      const content = await response.text()
      await renderMarkdown(content)
    }
  } catch (error) {
    console.error('加载首页失败:', error)
  }
}

async function loadDoc(key) {
  currentDoc.value = key
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

onMounted(async () => {
  await loadDocsList()
  await loadReadme()
})
</script>
