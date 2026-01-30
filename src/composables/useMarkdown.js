import { ref, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'

// 初始化 Mermaid - 使用 neutral 主题
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose'
})

// 自定义 marked 渲染器，处理 Mermaid 代码块
const renderer = new marked.Renderer()
const originalCodeRenderer = renderer.code.bind(renderer)

renderer.code = function(code, language) {
  if (language === 'mermaid') {
    const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
    return `<div class="mermaid" id="${id}">${code}</div>`
  }
  return originalCodeRenderer(code, language)
}

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

export function useMarkdown() {
  const htmlContent = ref('')
  const tocItems = ref([])

  // 渲染 Markdown
  async function renderMarkdown(markdown) {
    htmlContent.value = marked.parse(markdown)
    await renderMermaid()
    wrapTables()
    addImageZoomHandlers()
    extractTOC()
  }

  // 为表格添加滚动容器
  function wrapTables() {
    nextTick(() => {
      const tables = document.querySelectorAll('.markdown-content table')
      tables.forEach(table => {
        // 检查是否已经被包裹
        if (!table.parentElement.classList.contains('table-wrapper')) {
          const wrapper = document.createElement('div')
          wrapper.className = 'table-wrapper'
          table.parentNode.insertBefore(wrapper, table)
          wrapper.appendChild(table)
        }
      })
    })
  }

  // 渲染 Mermaid 图表
  async function renderMermaid() {
    await nextTick()
    const mermaidElements = document.querySelectorAll('.mermaid')
    
    for (const element of mermaidElements) {
      try {
        const id = element.id
        const code = element.textContent
        const { svg } = await mermaid.render(id + '-svg', code)
        element.innerHTML = svg
        
        // 为Mermaid图表添加可点击样式
        element.classList.add('zoomable-image')
        element.style.cursor = 'zoom-in'
        element.title = '点击放大查看'
      } catch (error) {
        console.error('Mermaid 渲染失败:', error)
        element.innerHTML = `<pre class="mermaid-error">图表渲染失败\n${error.message}</pre>`
      }
    }
  }

  // 为图片和Mermaid图表添加放大功能
  function addImageZoomHandlers() {
    nextTick(() => {
      // 为所有图片添加放大功能
      const images = document.querySelectorAll('.markdown-content img')
      images.forEach(img => {
        img.classList.add('zoomable-image')
        img.style.cursor = 'zoom-in'
        img.title = '点击放大查看'
      })
    })
  }

  // 提取文档大纲
  function extractTOC() {
    tocItems.value = []
    
    nextTick(() => {
      const headings = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6')
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.substring(1))
        const text = heading.textContent.trim()
        const id = heading.id || `heading-${index}`
        
        if (!heading.id) {
          heading.id = id
        }
        
        tocItems.value.push({
          id,
          text,
          level
        })
      })
    })
  }

  return {
    htmlContent,
    tocItems,
    renderMarkdown,
    addImageZoomHandlers
  }
}
