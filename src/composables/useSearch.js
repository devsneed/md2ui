import { ref } from 'vue'
import MiniSearch from 'minisearch'

// 搜索索引实例
let searchIndex = null

// 扁平化文档树，提取所有文件节点
function flattenDocs(items, result = []) {
  for (const item of items) {
    if (item.type === 'file') result.push(item)
    if (item.type === 'folder' && item.children) {
      flattenDocs(item.children, result)
    }
  }
  return result
}

export function useSearch() {
  const searchVisible = ref(false)
  const searchQuery = ref('')
  const searchResults = ref([])
  const searchReady = ref(false)

  // 构建搜索索引：获取所有文档内容
  async function buildIndex(docsList) {
    const docs = flattenDocs(docsList)
    const documents = []

    for (const doc of docs) {
      try {
        const response = await fetch(doc.path)
        if (response.ok) {
          const content = await response.text()
          documents.push({
            id: doc.key,
            title: doc.label,
            content: content.replace(/^---[\s\S]*?---\n?/, ''), // 去掉 frontmatter
            path: doc.path
          })
        }
      } catch {
        // 忽略加载失败的文档
      }
    }

    searchIndex = new MiniSearch({
      fields: ['title', 'content'],
      storeFields: ['title'],
      searchOptions: {
        boost: { title: 3 },
        fuzzy: 0.2,
        prefix: true
      },
      // 中文分词：按标点、空格、换行分割
      tokenize: (text) => {
        // 先按常规分隔符分词
        const tokens = text.split(/[\s\n\r\t,.;:!?，。；：！？、（）()【】\[\]{}""''""]+/)
          .filter(t => t.length > 0)
        // 对中文文本额外做 bigram 分词
        const bigrams = []
        for (const token of tokens) {
          if (/[\u4e00-\u9fff]/.test(token) && token.length > 1) {
            for (let i = 0; i < token.length - 1; i++) {
              bigrams.push(token.slice(i, i + 2))
            }
          }
        }
        return [...tokens, ...bigrams]
      }
    })

    searchIndex.addAll(documents)
    searchReady.value = true
  }

  // 执行搜索
  function doSearch(query) {
    searchQuery.value = query
    if (!query.trim() || !searchIndex) {
      searchResults.value = []
      return
    }
    const results = searchIndex.search(query, { limit: 20 })
    searchResults.value = results.map(r => ({
      key: r.id,
      title: r.title,
      score: r.score
    }))
  }

  // 打开/关闭搜索面板
  function openSearch() { searchVisible.value = true }
  function closeSearch() {
    searchVisible.value = false
    searchQuery.value = ''
    searchResults.value = []
  }

  return {
    searchVisible,
    searchQuery,
    searchResults,
    searchReady,
    buildIndex,
    doSearch,
    openSearch,
    closeSearch
  }
}
