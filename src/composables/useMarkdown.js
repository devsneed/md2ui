import { ref, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'
import GithubSlugger from 'github-slugger'
import hljs from 'highlight.js'
import { parseFrontmatter, calcReadingTime } from './useFrontmatter.js'
import { docHash, resolveDocKey, findDocInTree } from './useDocHash.js'

// 初始化 Mermaid — 基于 base 主题自定义柔和蓝紫色调
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  // Mermaid 内置主题有这几个：default、neutral、dark、forest、base。
  securityLevel: 'loose',
  themeVariables: {
    // 基础色调
    primaryColor: '#e8eaf6',
    primaryTextColor: '#37474f',
    primaryBorderColor: '#7986cb',
    // 线条与标签
    lineColor: '#90a4ae',
    textColor: '#455a64',
    // 次要 / 第三色
    secondaryColor: '#f3e5f5',
    secondaryBorderColor: '#ba68c8',
    secondaryTextColor: '#4a148c',
    tertiaryColor: '#e0f7fa',
    tertiaryBorderColor: '#4dd0e1',
    tertiaryTextColor: '#006064',
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    // 节点样式
    nodeBorder: '#7986cb',
    nodeTextColor: '#37474f',
    // 序列图
    actorBkg: '#e8eaf6',
    actorBorder: '#7986cb',
    actorTextColor: '#37474f',
    signalColor: '#5c6bc0',
    signalTextColor: '#37474f',
    // 甘特图
    sectionBkgColor: '#e8eaf6',
    altSectionBkgColor: '#f3e5f5',
    taskBkgColor: '#7986cb',
    taskTextColor: '#ffffff',
    activeTaskBkgColor: '#5c6bc0',
    doneTaskBkgColor: '#9fa8da',
    // 饼图
    pie1: '#7986cb',
    pie2: '#ba68c8',
    pie3: '#4dd0e1',
    pie4: '#ffb74d',
    pie5: '#a1887f',
    // 类图
    classText: '#37474f',
    // 状态图
    labelColor: '#37474f',
    // 背景
    mainBkg: '#e8eaf6',
    nodeBkg: '#e8eaf6',
    background: '#ffffff',
  }
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
    // 高亮代码
    let highlighted
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language }).value
    } else {
      highlighted = hljs.highlightAuto(code).value
    }

    // 生成行号（按换行拆分）
    const lines = code.split('\n')
    const lineCount = lines.length
    const lineNums = lines.map((_, i) => `<span class="line-num">${i + 1}</span>`).join('')

    const langLabel = (language || '').toUpperCase()
    // 切换行号按钮（列表图标）
    const toggleLineNumIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
    // 切换高亮按钮（</> 文本图标）
    const toggleHighlightIcon = `<span class="code-icon-text">&lt;/&gt;</span>`
    // 复制按钮图标
    const copyIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`

    return `<div class="code-block-wrapper" data-raw-code="${encodeURIComponent(code)}" data-lang="${language || ''}">
      <div class="code-block-header">
        <span class="code-lang-label">${langLabel}</span>
        <div class="code-block-actions">
          <button class="code-action-btn toggle-line-num-btn active" data-tooltip="隐藏行号">${toggleLineNumIcon}</button>
          <button class="code-action-btn toggle-highlight-btn active" data-tooltip="关闭高亮">${toggleHighlightIcon}</button>
          <button class="code-action-btn copy-code-btn" data-tooltip="复制代码">${copyIcon}<span class="copy-text">复制</span></button>
        </div>
      </div>
      <div class="code-block-body">
        <div class="line-numbers" aria-hidden="true">${lineNums}</div>
        <pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>
      </div>
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

// 为代码块添加交互事件（复制、切换行号、切换高亮）
function addCodeBlockHandlers() {
  nextTick(() => {
    // 复制按钮
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
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

    // 切换行号
    document.querySelectorAll('.toggle-line-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.code-block-wrapper')
        const lineNumbers = wrapper.querySelector('.line-numbers')
        if (!lineNumbers) return
        btn.classList.toggle('active')
        lineNumbers.classList.toggle('hidden')
        btn.dataset.tooltip = btn.classList.contains('active') ? '隐藏行号' : '显示行号'
      })
    })

    // 切换语法高亮
    document.querySelectorAll('.toggle-highlight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.code-block-wrapper')
        const codeEl = wrapper.querySelector('code')
        if (!codeEl) return
        const rawCode = decodeURIComponent(wrapper.dataset.rawCode || '')
        const lang = wrapper.dataset.lang || ''
        const isHighlighted = btn.classList.contains('active')

        if (isHighlighted) {
          // 关闭高亮：显示纯文本
          codeEl.textContent = rawCode
          codeEl.className = 'code-plain'
          btn.classList.remove('active')
          btn.dataset.tooltip = '开启高亮'
        } else {
          // 开启高亮：重新渲染
          let highlighted
          if (lang && hljs.getLanguage(lang)) {
            highlighted = hljs.highlight(rawCode, { language: lang }).value
          } else {
            highlighted = hljs.highlightAuto(rawCode).value
          }
          codeEl.innerHTML = highlighted
          codeEl.className = `hljs${lang ? ` language-${lang}` : ''}`
          btn.classList.add('active')
          btn.dataset.tooltip = '关闭高亮'
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
    addCodeBlockHandlers()
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
