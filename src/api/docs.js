// 构建目录树结构（支持多层嵌套）
function buildTree(files) {
  const root = { children: [] }
  
  files.forEach(file => {
    const parts = file.relativePath.split('/')
    let currentLevel = root
    
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i]
      const folderPath = parts.slice(0, i + 1).join('/')
      
      let folder = currentLevel.children.find(item => item.key === folderPath)
      
      if (!folder) {
        const match = folderName.match(/^(\d+)-(.+)$/)
        const folderLabel = match ? match[2] : folderName
        const cleanFolderLabel = folderLabel.replace(/[。.]$/, '')
        folder = {
          type: 'folder',
          key: folderPath,
          label: cleanFolderLabel,
          order: match ? parseInt(match[1]) : 999,
          level: i,
          children: [],
          expanded: false
        }
        currentLevel.children.push(folder)
      }
      
      currentLevel = folder
    }
    
    currentLevel.children.push({
      type: 'file',
      ...file
    })
  })
  
  function sortChildren(node) {
    if (node.children) {
      node.children.sort((a, b) => a.order - b.order)
      node.children.forEach(child => sortChildren(child))
    }
  }
  
  sortChildren(root)
  return root.children
}

// 获取文档列表
export async function getDocsList() {
  // 尝试 CLI 模式：检查是否有用户文档 API
  try {
    const response = await fetch('/@user-docs-list')
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // 忽略错误，继续使用开发模式
  }

  // 开发模式：扫描 public/docs 目录
  try {
    const modules = import.meta.glob('/public/docs/**/*.md')
    const files = []
    
    for (const path in modules) {
      const relativePath = path.replace('/public/docs/', '').replace('.md', '')
      const parts = relativePath.split('/')
      const fileName = parts[parts.length - 1]
      
      const match = fileName.match(/^(\d+)-(.+)$/)
      if (match) {
        const [, order, name] = match
        const cleanName = name.replace(/[。.]$/, '')
        files.push({
          key: relativePath,
          label: cleanName,
          order: parseInt(order),
          path: `/docs/${relativePath}.md`,
          relativePath,
          level: parts.length - 1
        })
      } else {
        const cleanFileName = fileName.replace(/[。.]$/, '')
        files.push({
          key: relativePath,
          label: cleanFileName,
          order: 999,
          path: `/docs/${relativePath}.md`,
          relativePath,
          level: parts.length - 1
        })
      }
    }
    
    return buildTree(files)
  } catch (error) {
    console.error('获取文档列表失败:', error)
    return []
  }
}
