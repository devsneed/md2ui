<template>
  <div class="container" :class="{ 'is-mobile': isMobile }">
    <!-- 移动端顶栏 -->
    <MobileHeader
      v-if="isMobile"
      :mode="mode"
      @open-drawer="mobileDrawerOpen = true"
      @go-home="goHome"
      @open-search="openSearch"
      @toggle-theme="toggleTheme"
    />
    <!-- 移动端遮罩 -->
    <transition name="fade">
      <div v-if="isMobile && mobileDrawerOpen" class="drawer-overlay" @click="mobileDrawerOpen = false"></div>
    </transition>
    <!-- 侧边栏 -->
    <AppSidebar
      v-if="!isMobile ? !sidebarCollapsed : true"
      :docsList="docsList"
      :currentDoc="currentDoc"
      :isMobile="isMobile"
      :drawerOpen="mobileDrawerOpen"
      :width="sidebarWidth"
      :mode="mode"
      @go-home="goHome"
      @toggle-theme="toggleTheme"
      @close-drawer="mobileDrawerOpen = false"
      @collapse="sidebarCollapsed = true"
      @open-search="openSearch"
      @expand-all="onExpandAll"
      @collapse-all="onCollapseAll"
      @toggle-folder="toggleFolder"
      @select-doc="handleDocSelect"
    />
    <!-- 左侧拖拽条 & 展开按钮（桌面端） -->
    <div v-if="!isMobile && !sidebarCollapsed" class="resizer resizer-left" @mousedown="startResize('left', $event)"></div>
    <button v-if="!isMobile && sidebarCollapsed" class="expand-btn expand-btn-left" @click="sidebarCollapsed = false" title="展开导航">
      <PanelLeftOpen :size="16" />
    </button>
    <!-- 内容区 -->
    <DocContent
      :showWelcome="showWelcome"
      :htmlContent="htmlContent"
      :prevDoc="prevDoc"
      :nextDoc="nextDoc"
      @scroll="handleScroll"
      @content-click="handleContentClick"
      @start="loadFirstDoc"
      @load-doc="loadDoc"
    />
    <!-- 桌面端 TOC -->
    <div v-if="!isMobile && !tocCollapsed && tocItems.length > 0" class="resizer resizer-right" @mousedown="startResize('right', $event)"></div>
    <TableOfContents v-if="!isMobile" :tocItems="tocItems" :activeHeading="activeHeading" :collapsed="tocCollapsed" :width="tocWidth" @toggle="tocCollapsed = !tocCollapsed" @scroll-to="scrollToHeading" />
    <button v-if="!isMobile && tocCollapsed && tocItems.length > 0" class="expand-btn expand-btn-right" @click="tocCollapsed = false" title="展开目录">
      <PanelRightOpen :size="16" />
    </button>
    <!-- 移动端 TOC -->
    <MobileToc
      v-if="isMobile"
      :tocItems="tocItems"
      :activeHeading="activeHeading"
      :open="mobileTocOpen"
      :showWelcome="showWelcome"
      @toggle="mobileTocOpen = !mobileTocOpen"
      @close="mobileTocOpen = false"
      @scroll-to="(id) => { scrollToHeading(id); mobileTocOpen = false }"
    />
    <!-- 返回顶部 -->
    <transition name="fade">
      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop" title="返回顶部">
        <ArrowUp :size="20" />
        <span class="progress-text">{{ scrollProgress }}%</span>
      </button>
    </transition>
    <!-- 图片放大 -->
    <ImageZoom :visible="zoomVisible" :imageContent="zoomContent" @close="zoomVisible = false" />
    <!-- 搜索面板 -->
    <SearchPanel
      :visible="searchVisible"
      :query="searchQuery"
      :results="searchResults"
      @close="closeSearch"
      @search="doSearch"
      @select="handleSearchSelect"
    />
    <!-- PWA 安装提示 -->
    <PwaPrompt
      :canInstall="canInstall"
      @install="installApp"
      @dismiss="dismissInstall"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ArrowUp, PanelLeftOpen, PanelRightOpen } from 'lucide-vue-next'
import MobileHeader from './components/MobileHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import DocContent from './components/DocContent.vue'
import TableOfContents from './components/TableOfContents.vue'
import MobileToc from './components/MobileToc.vue'
import ImageZoom from './components/ImageZoom.vue'
import SearchPanel from './components/SearchPanel.vue'
import PwaPrompt from './components/PwaPrompt.vue'
import { getDocsList } from './api/docs.js'
import { useMarkdown } from './composables/useMarkdown.js'
import { useScroll } from './composables/useScroll.js'
import { useResize } from './composables/useResize.js'
import { useTheme } from './composables/useTheme.js'
import { useSearch } from './composables/useSearch.js'
import { useMobile } from './composables/useMobile.js'
import { usePwa } from './composables/usePwa.js'
import { findDoc, findFirstDoc, findDocByHash, expandParents, flattenDocsList, expandAll, collapseAll } from './composables/useDocTree.js'

// 等待内容区域图片加载完成
async function waitForContentImages(timeoutMs = 3000) {
  const images = document.querySelectorAll('.markdown-content img')
  const pending = [...images].filter(img => !img.complete)
  if (!pending.length) return
  await Promise.race([
    Promise.all(pending.map(img => new Promise(r => { img.onload = img.onerror = r }))),
    new Promise(r => setTimeout(r, timeoutMs))
  ])
}

// 状态
const docsList = ref([])
const currentDoc = ref('')
const showWelcome = ref(true)
const sidebarCollapsed = ref(false)
const tocCollapsed = ref(false)
const zoomVisible = ref(false)
const zoomContent = ref('')

// composables
const { htmlContent, tocItems, renderMarkdown, docHash } = useMarkdown()
const { scrollProgress, showBackToTop, activeHeading, handleScroll: _handleScroll, scrollToHeading: _scrollToHeading, scrollToTop } = useScroll()
const { sidebarWidth, tocWidth, startResize } = useResize()
const { mode, toggleTheme } = useTheme()
const { searchVisible, searchQuery, searchResults, buildIndex, doSearch, openSearch, closeSearch } = useSearch()
const { isMobile, mobileDrawerOpen, mobileTocOpen } = useMobile()
const { canInstall, installApp, dismissInstall } = usePwa()

// 滚动处理，同步锚点到 URL
function handleScroll(e) {
  _handleScroll(e)
  // 滚动时持续同步当前可见标题到 URL hash
  if (activeHeading.value && currentDoc.value) {
    history.replaceState(null, '', `/${docHash(currentDoc.value)}#${activeHeading.value}`)
  }
}

function scrollToHeading(id) {
  _scrollToHeading(id)
  if (currentDoc.value) {
    history.replaceState(null, '', `/${docHash(currentDoc.value)}#${id}`)
  }
}

// 文档列表加载
async function loadDocsList() {
  docsList.value = await getDocsList()
  buildIndex(docsList.value)
}

// 回到欢迎页
function goHome() {
  currentDoc.value = ''
  showWelcome.value = true
  htmlContent.value = ''
  tocItems.value = []
  history.pushState(null, '', '/')
  if (isMobile.value) mobileDrawerOpen.value = false
}

// 加载文档
async function loadDoc(key, { replace = false, anchor = '' } = {}) {
  currentDoc.value = key
  showWelcome.value = false
  const hash = docHash(key)
  const url = anchor ? `/${hash}#${anchor}` : `/${hash}`
  if (replace) {
    history.replaceState(null, '', url)
  } else {
    history.pushState(null, '', url)
  }
  const doc = findDoc(docsList.value, key)
  if (!doc) return
  try {
    const response = await fetch(doc.path)
    if (response.ok) {
      const content = await response.text()
      await renderMarkdown(content, key, docsList.value)
      const contentEl = document.querySelector('.content')
      if (contentEl) contentEl.scrollTop = 0
    }
  } catch (error) {
    console.error('加载文档失败:', error)
  }
}

function loadFirstDoc() {
  const first = findFirstDoc(docsList.value)
  if (first) loadDoc(first.key)
}

// 选择文档（移动端自动关闭抽屉）
function handleDocSelect(key) {
  loadDoc(key)
  if (isMobile.value) mobileDrawerOpen.value = false
}

function toggleFolder(item) { item.expanded = !item.expanded }
function onExpandAll() { expandAll(docsList.value) }
function onCollapseAll() { collapseAll(docsList.value) }

// 内容区点击处理（链接跳转 + 图片放大）
function handleContentClick(event) {
  const target = event.target
  const link = target.closest('a')
  if (link) {
    const docKey = link.dataset.docKey
    if (docKey) {
      event.preventDefault()
      const anchor = link.dataset.anchor || ''
      expandParents(docsList.value, docKey)
      loadDoc(docKey).then(async () => {
        if (anchor) { await nextTick(); await waitForContentImages(); scrollToHeading(anchor) }
      })
      return
    }
    if (link.dataset.anchor && !docKey) {
      event.preventDefault()
      scrollToHeading(link.dataset.anchor)
      return
    }
    return
  }
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

// 上一篇/下一篇
const prevDoc = computed(() => {
  if (!currentDoc.value) return null
  const flat = flattenDocsList(docsList.value)
  const idx = flat.findIndex(d => d.key === currentDoc.value)
  return idx > 0 ? flat[idx - 1] : null
})

const nextDoc = computed(() => {
  if (!currentDoc.value) return null
  const flat = flattenDocsList(docsList.value)
  const idx = flat.findIndex(d => d.key === currentDoc.value)
  return idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null
})

// 搜索结果选中
function handleSearchSelect(key) {
  expandParents(docsList.value, key)
  loadDoc(key)
}

// URL 路由
async function loadFromUrl() {
  const pathname = window.location.pathname.replace(/^\//, '')
  const anchor = window.location.hash.replace('#', '')
  if (!pathname) {
    if (docsList.value.length === 0) {
      showWelcome.value = false
      renderMarkdown('# 当前目录没有 Markdown 文档\n\n请在当前目录下添加 `.md` 文件，然后刷新页面。')
    }
    return
  }
  const doc = findDocByHash(docsList.value, pathname, docHash)
  if (doc) {
    expandParents(docsList.value, doc.key)
    await loadDoc(doc.key, { replace: true, anchor: anchor ? decodeURIComponent(anchor) : '' })
    if (anchor) { await nextTick(); await waitForContentImages(); _scrollToHeading(decodeURIComponent(anchor)) }
  }
}

// 全局事件
window.addEventListener('popstate', () => loadFromUrl())
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch() }
})

onMounted(async () => {
  await loadDocsList()
  await loadFromUrl()

  // 监听文档热更新（CLI 模式下 md 文件变化自动刷新）
  if (import.meta.hot) {
    import.meta.hot.on('md2ui:doc-change', async () => {
      // 重新加载文档列表
      docsList.value = await getDocsList()
      buildIndex(docsList.value)
      // 如果当前有打开的文档，重新渲染
      if (currentDoc.value) {
        await loadDoc(currentDoc.value)
      }
    })
  }
})
</script>
