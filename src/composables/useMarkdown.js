import { ref, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'
import GithubSlugger from 'github-slugger'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// 初始化 Mermaid - 使用 neutral 主题
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose'
})

// base62 字符集
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

// 同步 hash：FNV-1a 变体，双轮 hash 拼接得到 64 bit，再转 base62 取 8 位
// 碰撞空间 62^8 ≈ 218 万亿，对文档站绰绰有余
function fnv1a64(str) {
  // 第一轮 FNV-1a（seed = 标准 FNV offset basis）
  let h1 = 0x811c9dc5 >>> 0
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193) >>> 0
  }
  // 第二轮 FNV-1a（不同 seed，避免对称碰撞）
  let h2 = 0x050c5d1f >>> 0
  for (let i = 0; i < str.length; i++) {
    h2 ^= str.charCodeAt(i)
    h2 = Math.imul(h2, 0x01000193) >>> 0
  }
  return [h1, h2]
}

// 将两个 32 位整数转为 base62 字符串，取前 8 位
function toBase62(h1, h2) {
  // 合并为 BigInt 进行 base62 编码
  const num = (BigInt(h1) << 32n) | BigInt(h2)
  let n = num
  let result = ''
  while (n > 0n && result.length < 12) {
    result = BASE62[Number(n % 62n)] + result
    n = n / 62n
  }
  return result.padStart(8, '0').slice(0, 8)
}

// 根据文档 key 生成 8 位 base62 短 hash（同步、确定性、零依赖）
function docHash(key) {
  const [h1, h2] = fnv1a64(key)
  return toBase62(h1, h2)
}

// 解析相对路径，基于当前文档 key 计算目标 key
function resolveDocKey(href, currentDocKey) {
  const currentParts = currentDocKey.split('/')
  currentParts.pop() // 去掉当前文件名
  const linkParts = href.replace(/\.md$/, '').split('/')
  const resolved = [...currentParts]
  for (const part of linkParts) {
    if (part === '.' || part === '') continue
    if (part === '..') { resolved.pop(); continue }
    resolved.push(part)
  }
  return resolved.join('/')
}

// 在文档树中查找文档
function findDocInTree(items, key) {
  for (const item of items) {
    if (item.type === 'file' && item.key === key) return item
    if (item.type === 'folder' && item.children) {
      const found = findDocInTree(item.children, key)
      if (found) return found
    }
  }
  return null
}

// 创建自定义渲染器，处理链接、标题锚点和 Mermaid
function createRenderer(currentDocKey, docsList) {
  const renderer = new marked.Renderer()
  const slugger = new GithubSlugger()

  // 标题渲染：使用 github-slugger 生成语义化锚点 ID，附带可点击锚点链接
  renderer.heading = function(text, level) {
    const id = slugger.slug(text)
    const linkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
    return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" data-anchor="${id}" aria-hidden="true">${linkIcon}</a>${text}</h${level}>\n`
  }

  // 代码块渲染：Mermaid 图表 / 语法高亮 + 复制按钮
  renderer.code = function(code, language) {
    // Mermaid 图表单独处理
    if (language === 'mermaid') {
      const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
      return `<div class="mermaid" id="${id}">${code}</div>`
    }

    // 语法高亮
    let highlighted
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language }).value
    } else {
      highlighted = hljs.highlightAuto(code).value
    }

    // 语言标签 + 复制按钮
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

    // 站外链接：http/https/mailto/tel，新标签页打开
    if (/^(https?|mailto|tel):/.test(decoded)) {
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`
    }

    // 站内：纯锚点（用户写的 #标题 会被 slugify）
    if (decoded.startsWith('#')) {
      const anchor = slugger.slug(decoded.slice(1), false)
      return `<a href="javascript:void(0)" data-anchor="${anchor}"${titleAttr}>${text}</a>`
    }

    // 站内：.md 文档链接（可能带锚点）
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

    // 其他相对链接（图片、文件等），新标签页打开
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`
  }

  return renderer
}

// 解析 YAML frontmatter（轻量实现，不依赖 Node.js）
// 支持 title / description / order / hidden 字段
function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: markdown }
  const yamlStr = match[1]
  const data = {}
  for (const line of yamlStr.split('\n')) {
    const m = line.match(/^(\w+)\s*:\s*(.+)$/)
    if (!m) continue
    let val = m[2].trim()
    // 布尔值
    if (val === 'true') val = true
    else if (val === 'false') val = false
    // 数字
    else if (/^\d+$/.test(val)) val = parseInt(val)
    // 去掉引号
    else val = val.replace(/^['"]|['"]$/g, '')
    data[m[1]] = val
  }
  return { data, content: markdown.slice(match[0].length) }
}

// 计算阅读时间（中文 400 字/分钟，英文 200 词/分钟）
function calcReadingTime(markdown) {
  // 去掉 frontmatter、代码块、HTML 标签
  const clean = markdown
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*_~`>\-|[\]()!]/g, '')
  // 中文字符数
  const cnChars = (clean.match(/[\u4e00-\u9fff]/g) || []).length
  // 英文单词数
  const enWords = clean.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0).length
  const totalChars = cnChars + enWords
  const minutes = Math.ceil(cnChars / 400 + enWords / 200)
  return { totalChars, minutes: Math.max(1, minutes) }
}

export function useMarkdown() {
  const htmlContent = ref('')
  const tocItems = ref([])

  // 渲染 Markdown，传入当前文档 key 和文档列表用于链接改写
  async function renderMarkdown(markdown, currentDocKey = '', docsList = []) {
    // 解析 frontmatter
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
    await renderMermaid()
    wrapTables()
    addImageZoomHandlers()
    addCopyCodeHandlers()
    extractTOC()
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
            // 降级：选中文本
            const range = document.createRange()
            range.selectNodeContents(code)
            window.getSelection().removeAllRanges()
            window.getSelection().addRange(range)
          }
        })
      })
    })
  }

  // 提取文档大纲（从已渲染的 DOM 中读取 heading ID）
  function extractTOC() {
    tocItems.value = []
    nextTick(() => {
      const headings = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6')
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1))
        // 克隆节点后移除锚点元素，避免提取到 # 符号
        const clone = heading.cloneNode(true)
        clone.querySelectorAll('.heading-anchor').forEach(a => a.remove())
        const text = clone.textContent.trim()
        const id = heading.id // 已由 renderer.heading 通过 github-slugger 生成
        if (id) {
          tocItems.value.push({ id, text, level })
        }
      })
    })
  }

  return {
    htmlContent,
    tocItems,
    renderMarkdown,
    addImageZoomHandlers,
    docHash
  }
}
