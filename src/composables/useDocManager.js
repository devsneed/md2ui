import { ref, computed, nextTick } from 'vue'
import { getDocsList } from '../api/docs.js'
import { useMarkdown } from './useMarkdown.js'
import { useSearch } from './useSearch.js'
import { useScroll } from './useScroll.js'
import { useMobile } from './useMobile.js'
import { findDoc, findFirstDoc, findDocByHash, expandParents, flattenDocsList, expandAll, collapseAll } from './useDocTree.js'

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

export function useDocManager() {
  // 文档状态
  const docsList = ref([])
  const currentDoc = ref('')
  const showWelcome = ref(true)

  // composables
  const { htmlContent, tocItems, renderMarkdown, docHash } = useMarkdown()
  const { buildIndex } = useSearch()
  const {
    scrollProgress, showBackToTop, activeHeading,
    handleScroll: _handleScroll,
    scrollToHeading: _scrollToHeading,
    scrollToTop
  } = useScroll()
  const { isMobile, mobileDrawerOpen } = useMobile()

  // 滚动处理，同步锚点到 URL
  function handleScroll(e) {
    _handleScroll(e)
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

  // 加载文档列表
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

  // 加载第一篇文档
  function loadFirstDoc() {
    const first = findFirstDoc(docsList.value)
    if (first) loadDoc(first.key)
  }

  // 选择文档（移动端自动关闭抽屉）
  function handleDocSelect(key) {
    loadDoc(key)
    if (isMobile.value) mobileDrawerOpen.value = false
  }

  // 文件夹操作
  function toggleFolder(item) { item.expanded = !item.expanded }
  function onExpandAll() { expandAll(docsList.value) }
  function onCollapseAll() { collapseAll(docsList.value) }

  // 内容区点击处理（链接跳转 + 图片放大）
  function handleContentClick(event, { onZoom }) {
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
    // 图片放大
    if (target.tagName === 'IMG' && target.classList.contains('zoomable-image')) {
      onZoom(`<img src="${target.src}" alt="${target.alt || ''}" style="max-width: 100%; height: auto;" />`)
      return
    }
    // Mermaid 图表放大
    const mermaidEl = target.closest('.mermaid')
    if (mermaidEl && mermaidEl.classList.contains('zoomable-image')) {
      onZoom(mermaidEl.innerHTML)
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

  // 热更新处理
  async function handleHotUpdate() {
    docsList.value = await getDocsList()
    buildIndex(docsList.value)
    if (currentDoc.value) {
      await loadDoc(currentDoc.value)
    }
  }

  return {
    // 状态
    docsList,
    currentDoc,
    showWelcome,
    htmlContent,
    tocItems,
    // 滚动
    scrollProgress,
    showBackToTop,
    activeHeading,
    handleScroll,
    scrollToHeading,
    scrollToTop,
    // 文档操作
    loadDocsList,
    loadFromUrl,
    goHome,
    loadDoc,
    loadFirstDoc,
    handleDocSelect,
    handleContentClick,
    handleSearchSelect,
    handleHotUpdate,
    // 文件夹操作
    toggleFolder,
    onExpandAll,
    onCollapseAll,
    // 导航
    prevDoc,
    nextDoc,
    // 工具
    docHash
  }
}
