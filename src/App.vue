<template>
  <div class="container" :class="{ 'is-mobile': isMobile }">
    <!-- 移动端顶栏 -->
    <MobileHeader
      v-if="isMobile"
      @open-drawer="mobileDrawerOpen = true"
      @go-home="goHome"
      @open-search="openSearch"
    />
    <!-- 桌面端顶栏 -->
    <TopBar
      v-if="!isMobile"
      @select-search="handleSearchSelect"
      @go-home="goHome"
    />
    <!-- 移动端遮罩 -->
    <transition name="fade">
      <div v-if="isMobile && mobileDrawerOpen" class="drawer-overlay" @click="mobileDrawerOpen = false"></div>
    </transition>
    <!-- 主体区域（侧边栏 + 内容 + TOC） -->
    <div class="main-body">
    <!-- 侧边栏 -->
    <AppSidebar
      v-if="!isMobile ? !sidebarCollapsed : true"
      :docsList="docsList"
      :currentDoc="currentDoc"
      :isMobile="isMobile"
      :drawerOpen="mobileDrawerOpen"
      :width="sidebarWidth"
      @go-home="goHome"
      @close-drawer="mobileDrawerOpen = false"
      @collapse="sidebarCollapsed = true"
      @expand-all="onExpandAll"
      @collapse-all="onCollapseAll"
      @toggle-folder="toggleFolder"
      @select-doc="handleDocSelect"
    />
    <!-- 左侧拖拽条 & 展开按钮（桌面端） -->
    <div v-if="!isMobile && !sidebarCollapsed" class="resizer resizer-left" @mousedown="startResize('left', $event)"></div>
    <button v-if="!isMobile && sidebarCollapsed" class="expand-btn expand-btn-left" @click="sidebarCollapsed = false" title="展开导航">
      <ChevronRight :size="14" />
    </button>
    <!-- 内容区 -->
    <DocContent
      :showWelcome="showWelcome"
      :htmlContent="htmlContent"
      :prevDoc="prevDoc"
      :nextDoc="nextDoc"
      :docTitle="currentDocTitle"
      @scroll="handleScroll"
      @content-click="onContentClick"
      @start="loadFirstDoc"
      @load-doc="loadDoc"
    />
    <!-- 桌面端 TOC -->
    <div v-if="!isMobile && !tocCollapsed && tocItems.length > 0" class="resizer resizer-right" @mousedown="startResize('right', $event)"></div>
    <TableOfContents v-if="!isMobile" :tocItems="tocItems" :activeHeading="activeHeading" :collapsed="tocCollapsed" :width="tocWidth" @toggle="tocCollapsed = !tocCollapsed" @scroll-to="(id) => scrollToHeading(id, { push: true })" />
    <button v-if="!isMobile && tocCollapsed && tocItems.length > 0" class="expand-btn expand-btn-right" @click="tocCollapsed = false" title="展开目录">
      <ChevronLeft :size="14" />
    </button>
    </div>
    <!-- 移动端 TOC -->
    <MobileToc
      v-if="isMobile"
      :tocItems="tocItems"
      :activeHeading="activeHeading"
      :open="mobileTocOpen"
      :showWelcome="showWelcome"
      @toggle="mobileTocOpen = !mobileTocOpen"
      @close="mobileTocOpen = false"
      @scroll-to="(id) => { scrollToHeading(id, { push: true }); mobileTocOpen = false }"
    />
    <!-- 返回顶部 -->
    <transition name="fade">
      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop" title="返回顶部">
        <ArrowUp :size="20" />
        <span class="progress-text">{{ scrollProgress }}%</span>
      </button>
    </transition>
    <!-- 图片放大 -->
    <ImageZoom :visible="zoomVisible" :images="zoomImages" :currentIndex="zoomIndex" @update:currentIndex="zoomIndex = $event" @close="zoomVisible = false" />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowUp, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import MobileHeader from './components/MobileHeader.vue'
import TopBar from './components/TopBar.vue'
import AppSidebar from './components/AppSidebar.vue'
import DocContent from './components/DocContent.vue'
import TableOfContents from './components/TableOfContents.vue'
import MobileToc from './components/MobileToc.vue'
import ImageZoom from './components/ImageZoom.vue'
import { useDocManager } from './composables/useDocManager.js'
import { useResize } from './composables/useResize.js'

import { useSearch } from './composables/useSearch.js'
import { useMobile } from './composables/useMobile.js'


// UI 状态
const sidebarCollapsed = ref(false)
const tocCollapsed = ref(false)
const zoomVisible = ref(false)
const zoomContent = ref('')
const zoomImages = ref([])
const zoomIndex = ref(0)

// composables
const {
  docsList, currentDoc, currentDocTitle, showWelcome, htmlContent, tocItems,
  scrollProgress, showBackToTop, activeHeading,
  handleScroll, scrollToHeading, scrollToTop,
  loadDocsList, loadFromUrl, goHome, loadDoc, loadFirstDoc,
  handleDocSelect, handleContentClick, handleSearchSelect,
  toggleFolder, onExpandAll, onCollapseAll,
  prevDoc, nextDoc
} = useDocManager()

const { sidebarWidth, tocWidth, startResize } = useResize()

const { openSearch } = useSearch()
const { isMobile, mobileDrawerOpen, mobileTocOpen } = useMobile()


// 内容区点击：委托给 docManager，图片放大回调在这里处理
function onContentClick(event) {
  handleContentClick(event, {
    onZoom({ images, index }) {
      zoomImages.value = images
      zoomIndex.value = index
      zoomVisible.value = true
    }
  })
}

// 全局快捷键
window.addEventListener('popstate', () => loadFromUrl())

onMounted(async () => {
  await loadDocsList()
  await loadFromUrl()
})
</script>
