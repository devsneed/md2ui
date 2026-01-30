#!/usr/bin/env node

import { createServer } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

// 获取 CLI 工具所在目录（即 md2ui 包的安装目录）
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkgRoot = resolve(__dirname, '..')

// 用户执行命令的目录
const userDir = process.cwd()

// 解析命令行参数
const args = process.argv.slice(2)
let port = 5000

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--port') {
    port = parseInt(args[i + 1]) || 5000
  }
}

// 虚拟模块插件：动态提供用户目录的文档列表
function docsPlugin() {
  const virtualModuleId = 'virtual:user-docs'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'user-docs-plugin',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        // 扫描用户目录下的 md 文件
        const docs = scanDocs(userDir)
        return `export default ${JSON.stringify(docs)}`
      }
    }
  }
}

// 扫描目录下的 md 文件
function scanDocs(dir, basePath = '', level = 0) {
  const items = []
  
  if (!fs.existsSync(dir)) return items
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      const children = scanDocs(fullPath, relativePath, level + 1)
      // 只有包含 md 文件的文件夹才加入目录
      if (children.length > 0) {
        const match = entry.name.match(/^(\d+)-(.+)$/)
        items.push({
          key: relativePath,
          label: match ? match[2] : entry.name,
          order: match ? parseInt(match[1]) : 999,
          type: 'folder',
          level,
          expanded: true,
          children
        })
      }
    } else if (entry.name.endsWith('.md')) {
      const match = entry.name.match(/^(\d+)-(.+)\.md$/)
      const label = match ? match[2] : entry.name.replace(/\.md$/, '')
      items.push({
        key: relativePath.replace(/\.md$/, ''),
        label,
        order: match ? parseInt(match[1]) : 999,
        type: 'file',
        level,
        path: `/@user-docs/${relativePath}`
      })
    }
  }

  // 按 order 排序
  items.sort((a, b) => a.order - b.order)
  return items
}

// 提供用户目录 md 文件的中间件
function serveUserDocs() {
  return {
    name: 'serve-user-docs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 提供文档列表 API
        if (req.url === '/@user-docs-list') {
          const docs = scanDocs(userDir)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(docs))
          return
        }
        // 提供文档内容
        if (req.url?.startsWith('/@user-docs/')) {
          const filePath = resolve(userDir, decodeURIComponent(req.url.replace('/@user-docs/', '')))
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end(fs.readFileSync(filePath, 'utf-8'))
            return
          }
        }
        next()
      })
    }
  }
}

// 检查目录下是否有 md 文件
function hasMdFiles(dir) {
  if (!fs.existsSync(dir)) return false
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
  
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      return true
    }
    if (entry.isDirectory()) {
      if (hasMdFiles(resolve(dir, entry.name))) {
        return true
      }
    }
  }
  return false
}

async function start() {
  console.log(`\n  md2ui - Markdown 文档预览工具\n`)
  console.log(`  扫描目录: ${userDir}\n`)

  // 检查是否有 md 文件
  if (!hasMdFiles(userDir)) {
    console.log('  当前目录下没有找到 Markdown 文件 (.md)\n')
    console.log('  请在包含 .md 文件的目录中运行此命令\n')
    process.exit(1)
  }

  const server = await createServer({
    root: pkgRoot,
    configFile: resolve(pkgRoot, 'vite.config.js'),
    plugins: [docsPlugin(), serveUserDocs()],
    server: {
      port
    }
  })

  await server.listen()
  server.printUrls()
}

start().catch(console.error)
