// 构建目录树结构（支持多层嵌套）
function buildTree(files) {
  const root = { children: [] }
  
  // 为每个文件创建完整的路径节点
  files.forEach(file => {
    const parts = file.relativePath.split('/')
    let currentLevel = root
    
    // 遍历路径的每一部分（除了最后的文件名）
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i]
      const folderPath = parts.slice(0, i + 1).join('/')
      
      // 查找是否已存在该文件夹
      let folder = currentLevel.children.find(item => item.key === folderPath)
      
      if (!folder) {
        // 解析文件夹名称（可能包含序号）
        const match = folderName.match(/^(\d+)-(.+)$/)
        const folderLabel = match ? match[2] : folderName
        // 去掉末尾的句号（中文或英文）
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
    
    // 添加文件到最后一级文件夹
    currentLevel.children.push({
      type: 'file',
      ...file
    })
  })
  
  // 递归排序所有层级
  function sortChildren(node) {
    if (node.children) {
      node.children.sort((a, b) => a.order - b.order)
      node.children.forEach(child => sortChildren(child))
    }
  }
  
  sortChildren(root)
  return root.children
}

// 获取文档列表（支持多级目录）
export async function getDocsList() {
  try {
    // 通过 import.meta.glob 获取所有 markdown 文件（包括子目录）
    const modules = import.meta.glob('/public/docs/**/*.md')
    const files = []
    
    for (const path in modules) {
      // 提取相对路径（去掉 /public/docs/ 前缀和 .md 后缀）
      const relativePath = path.replace('/public/docs/', '').replace('.md', '')
      
      // 分割路径
      const parts = relativePath.split('/')
      const fileName = parts[parts.length - 1]
      
      // 解析文件名格式：序号-名称
      const match = fileName.match(/^(\d+)-(.+)$/)
      if (match) {
        const [, order, name] = match
        // 去掉末尾的句号（中文或英文）
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
        // 没有序号的文件也加入列表，同样去掉末尾的句号
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
    
    // 构建树形结构
    return buildTree(files)
  } catch (error) {
    console.error('获取文档列表失败:', error)
    return []
  }
}
