import { ref, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'
import GithubSlugger from 'github-slugger'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { parseFrontmatter, calcReadingTime } from './useFrontmatter.js'
import { docHash, resolveDocKey, findDocInTree } from './useDocHash.js'

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose'
})

// 创建自定义渲染器，处理链接、标题锚点和 Mermaid
function createRenderer(currentDocKey, docsList) {
  const renderer = new marked.Renderer()
  const slugger = new GithubSlugger()

  // 标题渲染：使用 github-slugger 生成语义化锚点 ID
  renderer.heading = function(text, level) {
    const id = slugger.slug(text)
    const linkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
    return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" data-anchor="${id}" aria-hidden="true">${linkIcon}</a>${text}</h${level}>\n`
  }

  // 代码块渲染：Mermaid 图表 / 语法高亮 + 复制按钮
  renderer.code = function(code, language) {
    if (language === 'mermaid') {
      const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
      return `<div class="mermaid" id="${id}">${code}</div>`
    }
    let highlighted
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language }).value
    } else {
      highlighted = hljs.highlightAuto(code).value
    }
    const langLabel = language || ''
    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-lang-label">${langLabel}</span>
        <button class="copy-code-btn" title="复制代码">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span class="copy-text">复制</span>
        </button>
      </div>
      <pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>
    </div>`
  }

  // 链接渲染：站内/站外分类处理
  renderer.link = function(href, title, text) {
    const decoded = decodeURIComponent(href || '')
    const titleAttr = title ? ` title="${title}"` : ''

    // 站外链接
    if (/^(https?|mailto|tel):/.test(decoded)) {
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`
    }
    // 站内纯锚点
    if (decoded.startsWith('#')) {
      const anchor = slugger.slug(decoded.slice(1), false)
      return `<a href="javascript:void(0)" data-anchor="${anchor}"${titleAttr}>${text}</a>`
    }
    // 站内 .md 文档链接
    if (decoded.endsWith('.md') || decoded.includes('.md#')) {
      const [mdPath, anchor] = decoded.includes('#') ? decoded.split('#') : [decoded, '']
      const targetKey = resolveDocKey(mdPath, currentDocKey)
      const doc = findDocInTree(docsList, targetKey)
      if (doc) {
        const hash = docHash(doc.key)
        const anchorSlug = anchor ? slugger.slug(anchor, false) : ''
        const url = anchorSlug ? `/${hash}#${anchorSlug}` : `/${hash}`
        return `<a href="${url}" data-doc-key="${doc.key}"${anchorSlug ? ` data-anchor="${anchorSlug}"` : ''}${titleAttr}>${text}</a>`
      }
      return `<a href="javascript:void(0)" class="broken-link" title="文档未找到: ${decoded}">${text}</a>`
    }
    // 其他相对链接
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`
  }

  return renderer
}


// ---- 后处理器 ----

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
      element.classList.add('zoomable-image')
      element.style.cursor = 'zoom-in'
      element.title = '点击放大查看'
    } catch (error) {
      console.error('Mermaid 渲染失败:', error)
      element.innerHTML = `<pre class="mermaid-error">图表渲染失败\n${error.message}</pre>`
    }
  }
}

// 为表格添加滚动容器
function wrapTables() {
  nextTick(() => {
    const tables = document.querySelectorAll('.markdown-content table')
    tables.forEach(table => {
      if (!table.parentElement.classList.contains('table-wrapper')) {
        const wrapper = document.createElement('div')
        wrapper.className = 'table-wrapper'
        table.parentNode.insertBefore(wrapper, table)
        wrapper.appendChild(table)
      }
    })
  })
}

// 为图片添加放大功能
function addImageZoomHandlers() {
  nextTick(() => {
    const images = document.querySelectorAll('.markdown-content img')
    images.forEach(img => {
      img.classList.add('zoomable-image')
      img.style.cursor = 'zoom-in'
      img.title = '点击放大查看'
    })
  })
}

// 为代码块添加复制按钮事件
function addCopyCodeHandlers() {
  nextTick(() => {
    const buttons = document.querySelectorAll('.copy-code-btn')
    buttons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const wrapper = btn.closest('.code-block-wrapper')
        const code = wrapper.querySelector('code')
        if (!code) return
        try {
          await navigator.clipboard.writeText(code.textContent)
          const textEl = btn.querySelector('.copy-text')
          textEl.textContent = '已复制'
          btn.classList.add('copied')
          setTimeout(() => {
            textEl.textContent = '复制'
            btn.classList.remove('copied')
          }, 2000)
        } catch {
          const range = document.createRange()
          range.selectNodeContents(code)
          window.getSelection().removeAllRanges()
          window.getSelection().addRange(range)
        }
      })
    })
  })
}

// 提取文档大纲
function extractTOC(tocItems) {
  tocItems.value = []
  nextTick(() => {
    const headings = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6')
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1))
      const clone = heading.cloneNode(true)
      clone.querySelectorAll('.heading-anchor').forEach(a => a.remove())
      const text = clone.textContent.trim()
      const id = heading.id
      if (id) {
        tocItems.value.push({ id, text, level })
      }
    })
  })
}

// ---- 主 composable ----

export function useMarkdown() {
  const htmlContent = ref('')
  const tocItems = ref([])

  // 渲染 Markdown，传入当前文档 key 和文档列表用于链接改写
  async function renderMarkdown(markdown, currentDocKey = '', docsList = []) {
    const { data: frontmatter, content } = parseFrontmatter(markdown)
    const renderer = createRenderer(currentDocKey, docsList)
    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    })
    htmlContent.value = marked.parse(content)

    // frontmatter.title 覆盖第一个 h1
    if (frontmatter.title) {
      htmlContent.value = htmlContent.value.replace(
        /<h1[^>]*>[\s\S]*?<\/h1>/,
        `<h1 id="${new GithubSlugger().slug(frontmatter.title)}">${frontmatter.title}</h1>`
      )
    }

    // 在第一个 h1 后插入阅读元信息
    const { totalChars, minutes } = calcReadingTime(content)
    if (totalChars > 0) {
      const metaParts = [`${totalChars} 字`, `约 ${minutes} 分钟`]
      if (frontmatter.description) metaParts.push(frontmatter.description)
      const metaHtml = `<div class="doc-meta">${metaParts.map(p => `<span class="doc-meta-item">${p}</span>`).join('<span class="doc-meta-sep">·</span>')}</div>`
      htmlContent.value = htmlContent.value.replace(/(<\/h1>)/, `$1\n${metaHtml}`)
    }

    // 后处理
    await renderMermaid()
    wrapTables()
    addImageZoomHandlers()
    addCopyCodeHandlers()
    extractTOC(tocItems)
  }

  return {
    htmlContent,
    tocItems,
    renderMarkdown,
    addImageZoomHandlers,
    docHash
  }
}
