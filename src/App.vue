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
      @content-click="onContentClick"
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
import { ref, onMounted } from 'vue'
import { ArrowUp, PanelLeftOpen, PanelRightOpen } from 'lucide-vue-next'
import MobileHeader from './components/MobileHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import DocContent from './components/DocContent.vue'
import TableOfContents from './components/TableOfContents.vue'
import MobileToc from './components/MobileToc.vue'
import ImageZoom from './components/ImageZoom.vue'
import SearchPanel from './components/SearchPanel.vue'
import PwaPrompt from './components/PwaPrompt.vue'
import { useDocManager } from './composables/useDocManager.js'
import { useResize } from './composables/useResize.js'
import { useTheme } from './composables/useTheme.js'
import { useSearch } from './composables/useSearch.js'
import { useMobile } from './composables/useMobile.js'
import { usePwa } from './composables/usePwa.js'

// UI 状态
const sidebarCollapsed = ref(false)
const tocCollapsed = ref(false)
const zoomVisible = ref(false)
const zoomContent = ref('')

// composables
const {
  docsList, currentDoc, showWelcome, htmlContent, tocItems,
  scrollProgress, showBackToTop, activeHeading,
  handleScroll, scrollToHeading, scrollToTop,
  loadDocsList, loadFromUrl, goHome, loadDoc, loadFirstDoc,
  handleDocSelect, handleContentClick, handleSearchSelect, handleHotUpdate,
  toggleFolder, onExpandAll, onCollapseAll,
  prevDoc, nextDoc
} = useDocManager()

const { sidebarWidth, tocWidth, startResize } = useResize()
const { mode, toggleTheme } = useTheme()
const { searchVisible, searchQuery, searchResults, doSearch, openSearch, closeSearch } = useSearch()
const { isMobile, mobileDrawerOpen, mobileTocOpen } = useMobile()
const { canInstall, installApp, dismissInstall } = usePwa()

// 内容区点击：委托给 docManager，图片放大回调在这里处理
function onContentClick(event) {
  handleContentClick(event, {
    onZoom(content) {
      zoomContent.value = content
      zoomVisible.value = true
    }
  })
}

// 全局快捷键
window.addEventListener('popstate', () => loadFromUrl())
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch() }
})

onMounted(async () => {
  await loadDocsList()
  await loadFromUrl()

  // 文档热更新
  if (import.meta.hot) {
    import.meta.hot.on('md2ui:doc-change', handleHotUpdate)
  }
})
</script>
