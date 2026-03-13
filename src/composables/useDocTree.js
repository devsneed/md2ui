// 文档树操作：查找、展开、扁平化等纯逻辑

// 在文档树中查找文档
export function findDoc(items, key) {
  for (const item of items) {
    if (item.type === 'file' && item.key === key) return item
    if (item.type === 'folder' && item.children) {
      const found = findDoc(item.children, key)
      if (found) return found
    }
  }
  return null
}

// 查找第一个文档
export function findFirstDoc(items) {
  for (const item of items) {
    if (item.type === 'file') return item
    if (item.type === 'folder' && item.children) {
      const found = findFirstDoc(item.children)
      if (found) return found
    }
  }
  return null
}

// 根据 hash 查找文档
export function findDocByHash(items, hash, docHash) {
  for (const item of items) {
    if (item.type === 'file' && docHash(item.key) === hash) return item
    if (item.type === 'folder' && item.children) {
      const found = findDocByHash(item.children, hash, docHash)
      if (found) return found
    }
  }
  return null
}

// 展开文档所在的所有父级文件夹
export function expandParents(items, targetKey) {
  for (const item of items) {
    if (item.type === 'file' && item.key === targetKey) return true
    if (item.type === 'folder' && item.children) {
      if (expandParents(item.children, targetKey)) {
        item.expanded = true
        return true
      }
    }
  }
  return false
}

// 扁平化文档树，按顺序提取所有文件节点
export function flattenDocsList(items, result = []) {
  for (const item of items) {
    if (item.type === 'file') result.push(item)
    if (item.type === 'folder' && item.children) flattenDocsList(item.children, result)
  }
  return result
}

// 全部展开
export function expandAll(items) {
  items.forEach(item => {
    if (item.type === 'folder') {
      item.expanded = true
      if (item.children) expandAll(item.children)
    }
  })
}

// 全部收起
export function collapseAll(items) {
  items.forEach(item => {
    if (item.type === 'folder') {
      item.expanded = false
      if (item.children) collapseAll(item.children)
    }
  })
}
