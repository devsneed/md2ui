<template>
  <div class="container">
    <!-- 左侧收起/展开按钮 -->
    <button
      v-if="!sidebarCollapsed"
      class="collapse-btn collapse-btn-left"
      @click="toggleSidebar"
      title="收起侧边栏"
    >
      <PanelLeftClose :size="16" />
    </button>

    <button
      v-if="sidebarCollapsed"
      class="expand-btn expand-btn-left"
      @click="toggleSidebar"
      title="展开侧边栏"
    >
      <PanelLeftOpen :size="16" />
    </button>

    <!-- 左侧导航栏 -->
    <aside class="sidebar" v-show="!sidebarCollapsed" :style="{ width: sidebarWidth + 'px' }">
      <div class="logo">
        <Logo @go-home="loadDoc('home')" />
      </div>
      <nav class="nav-menu">
        <!-- 文档目录标题 -->
        <div class="nav-section">
          <span>文档目录</span>
          <div class="nav-actions">
            <button class="action-btn" @click="expandAll" title="全部展开">
              <ChevronsDown :size="14" />
            </button>
            <button class="action-btn" @click="collapseAll" title="全部收起">
              <ChevronsUp :size="14" />
            </button>
          </div>
        </div>

        <!-- 文档树 -->
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

    <!-- 左侧拖拽条 -->
    <div
      v-show="!sidebarCollapsed"
      class="resizer resizer-left"
      @mousedown="startResize('left', $event)"
    ></div>

    <!-- 主内容区 -->
    <main class="content" @scroll="handleScroll">
      <div class="markdown-content" v-html="htmlContent" @click="handleContentClick"></div>

      <!-- 返回顶部按钮 -->
      <transition name="fade">
        <button
          v-if="showBackToTop"
          class="back-to-top"
          @click="scrollToTop"
          :title="`阅读进度: ${scrollProgress}%`"
        >
          <ArrowUp :size="20" />
          <span class="progress-text">{{ scrollProgress }}%</span>
        </button>
      </transition>
    </main>

    <!-- 右侧拖拽条 -->
    <div
      v-if="tocItems.length > 0 && !tocCollapsed"
      class="resizer resizer-right"
      @mousedown="startResize('right', $event)"
    ></div>

    <!-- 右侧目录 -->
    <TableOfContents
      :tocItems="tocItems"
      :activeHeading="activeHeading"
      :collapsed="tocCollapsed"
      :width="tocWidth"
      @scroll-to="scrollToHeading"
    />

    <!-- 右侧收起/展开按钮 -->
    <button
      v-if="tocItems.length > 0 && !tocCollapsed"
      class="collapse-btn collapse-btn-right"
      @click="toggleToc"
      title="收起目录"
    >
      <PanelRightClose :size="16" />
    </button>

    <button
      v-if="tocItems.length > 0 && tocCollapsed"
      class="expand-btn expand-btn-right"
      @click="toggleToc"
      title="展开目录"
    >
      <PanelRightOpen :size="16" />
    </button>

    <!-- 图片放大组件 -->
    <ImageZoom
      :visible="zoomVisible"
      :imageContent="zoomImageContent"
      @close="closeZoom"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ChevronsDown, ChevronsUp, ArrowUp, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-vue-next'
import TreeNode from './components/TreeNode.vue'
import TableOfContents from './components/TableOfContents.vue'
import Logo from './components/Logo.vue'
import ImageZoom from './components/ImageZoom.vue'
import { getDocsList } from './api/docs.js'
import { useMarkdown } from './composables/useMarkdown.js'
import { useScroll } from './composables/useScroll.js'
import { useResize } from './composables/useResize.js'
import CryptoJS from 'crypto-js'

// 状态管理
const currentDoc = ref('home')
const docsList = ref([])
const sidebarCollapsed = ref(false)
const tocCollapsed = ref(false)

// 图片放大状态
const zoomVisible = ref(false)
const zoomImageContent = ref('')

// 使用组合式函数
const { htmlContent, tocItems, renderMarkdown } = useMarkdown()
const { scrollProgress, showBackToTop, activeHeading, handleScroll, scrollToHeading, scrollToTop } = useScroll()
const { sidebarWidth, tocWidth, startResize } = useResize()

// 生成文件路径的 MD5 哈希
function generateFileHash(filePath) {
  return CryptoJS.MD5(filePath).toString()
}

// 构建文档路径映射（支持 MD5 哈希 URL）
const docMap = computed(() => {
  const map = { 'home': '/README.md' }
  const hashMap = {} // MD5 哈希到文件路径的映射

  function traverse(items) {
    items.forEach(item => {
      if (item.type === 'file') {
        map[item.key] = item.path
        // 为每个文件生成 MD5 哈希
        const hash = generateFileHash(item.key)
        hashMap[hash] = item.key
        // 将哈希也作为 key 添加到映射中
        map[hash] = item.path
      } else if (item.type === 'folder' && item.children) {
        traverse(item.children)
      }
    })
  }

  traverse(docsList.value)
  
  // 将哈希映射存储到全局，供其他地方使用
  window.docHashMap = hashMap
  
  return map
})

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 切换目录
function toggleToc() {
  tocCollapsed.value = !tocCollapsed.value
}

// 切换文件夹展开/折叠
function toggleFolder(folder) {
  folder.expanded = !folder.expanded
}

// 全部展开
function expandAll() {
  function expand(items) {
    items.forEach(item => {
      if (item.type === 'folder') {
        item.expanded = true
        if (item.children) {
          expand(item.children)
        }
      }
    })
  }
  expand(docsList.value)
}

// 全部收起
function collapseAll() {
  function collapse(items) {
    items.forEach(item => {
      if (item.type === 'folder') {
        item.expanded = false
        if (item.children) {
          collapse(item.children)
        }
      }
    })
  }
  collapse(docsList.value)
}

// 更新浏览器 URL
function updateUrl(docName) {
  if (docName === 'home') {
    // 首页使用根路径
    window.history.pushState({}, '', '/')
  } else {
    // 其他文档使用 /doc/hash 格式
    const hash = generateFileHash(docName)
    window.history.pushState({}, '', `/doc/${hash}`)
  }
}

// 从 URL 解析文档名称
function parseUrlToDoc() {
  const pathname = window.location.pathname
  
  // 检查是否是文档路径格式 /doc/hash
  const docMatch = pathname.match(/^\/doc\/([a-f0-9]{32})$/)
  if (docMatch) {
    const hash = docMatch[1]
    // 检查是否是有效的 MD5 哈希
    if (window.docHashMap && window.docHashMap[hash]) {
      return window.docHashMap[hash]
    }
  }
  
  // 默认返回首页
  return 'home'
}

// 加载文档
async function loadDoc(docName, updateHistory = true) {
  currentDoc.value = docName
  const filePath = docMap.value[docName]

  if (!filePath) {
    htmlContent.value = '<p>文档未找到</p>'
    return
  }

  try {
    htmlContent.value = '<p>加载中...</p>'
    const response = await fetch(filePath)

    if (!response.ok) {
      throw new Error('文档加载失败')
    }

    const markdown = await response.text()
    await renderMarkdown(markdown)

    // 更新 URL（如果需要）
    if (updateHistory) {
      updateUrl(docName)
    }

    // 滚动到顶部并重置状态
    document.querySelector('.content').scrollTop = 0
    showBackToTop.value = false
    scrollProgress.value = 0
  } catch (error) {
    console.error('加载文档失败:', error)
    htmlContent.value = '<p>文档加载失败，请检查文件路径</p>'
  }
}

// 处理浏览器前进后退
function handlePopState() {
  const docName = parseUrlToDoc()
  loadDoc(docName, false) // 不更新历史记录，避免循环
}

// 处理内容区点击事件，用于图片放大
function handleContentClick(event) {
  const target = event.target
  
  // 检查是否点击了可放大的图片或Mermaid图表
  if (target.classList.contains('zoomable-image') || 
      target.closest('.zoomable-image') || 
      target.tagName === 'IMG' ||
      target.closest('.mermaid')) {
    
    let elementToZoom = target
    
    // 如果点击的是Mermaid图表内的元素，找到最外层的mermaid容器
    if (target.closest('.mermaid')) {
      elementToZoom = target.closest('.mermaid')
    }
    
    // 获取要放大的内容
    let content = ''
    if (elementToZoom.classList.contains('mermaid')) {
      // Mermaid图表
      content = elementToZoom.innerHTML
    } else if (elementToZoom.tagName === 'IMG') {
      // 普通图片
      content = `<img src="${elementToZoom.src}" alt="${elementToZoom.alt || ''}" style="max-width: none; max-height: none;" />`
    }
    
    if (content) {
      zoomImageContent.value = content
      zoomVisible.value = true
    }
  }
}

// 关闭图片放大
function closeZoom() {
  zoomVisible.value = false
  zoomImageContent.value = ''
}

// 初始化
onMounted(async () => {
  docsList.value = await getDocsList()
  
  // 监听浏览器前进后退
  window.addEventListener('popstate', handlePopState)
  
  // 根据当前 URL 加载对应文档
  const initialDoc = parseUrlToDoc()
  loadDoc(initialDoc, false)
})

// 监听 docsList 变化，重新解析 URL
watch(docsList, () => {
  const currentUrlDoc = parseUrlToDoc()
  if (currentUrlDoc !== currentDoc.value) {
    loadDoc(currentUrlDoc, false)
  }
})
</script>
