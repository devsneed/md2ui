#!/usr/bin/env node

// 子命令路由：build 命令走独立的 SSG 构建流程
const subCommand = process.argv[2]
if (subCommand === 'build') {
  await import('./build.js')
  process.exit(0)
}

import { createServer } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { pathToFileURL } from 'url'

// 获取 CLI 工具所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkgRoot = resolve(__dirname, '..')

// 用户执行命令的目录
const userDir = process.cwd()

// 默认配置
const defaultConfig = {
  title: 'md2ui',
  port: 3000,
  folderExpanded: false,
  github: '',
  footer: '',
  themeColor: '#3eaf7c'
}

// 加载用户配置文件（md2ui.config.js 或 .md2uirc.json）
async function loadUserConfig() {
  // 尝试 md2ui.config.js
  const jsPath = resolve(userDir, 'md2ui.config.js')
  if (fs.existsSync(jsPath)) {
    try {
      const mod = await import(pathToFileURL(jsPath).href)
      console.log('  配置文件: md2ui.config.js\n')
      return mod.default || mod
    } catch (e) {
      console.warn('  配置文件加载失败:', e.message, '\n')
    }
  }
  // 尝试 .md2uirc.json
  const jsonPath = resolve(userDir, '.md2uirc.json')
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8')
      console.log('  配置文件: .md2uirc.json\n')
      return JSON.parse(raw)
    } catch (e) {
      console.warn('  配置文件加载失败:', e.message, '\n')
    }
  }
  return {}
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' || args[i] === '--port') {
      result.port = parseInt(args[i + 1]) || undefined
      i++
    }
  }
  return result
}

// 扫描目录下的 md 文件
function scanDocs(dir, basePath = '', level = 0, folderExpanded = false) {
  const items = []
  if (!fs.existsSync(dir)) return items

  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      const children = scanDocs(fullPath, relativePath, level + 1, folderExpanded)
      if (children.length > 0) {
        const match = entry.name.match(/^(\d+)-(.+)$/)
        items.push({
          key: relativePath,
          label: match ? match[2] : entry.name,
          order: match ? parseInt(match[1]) : 999,
          type: 'folder',
          level,
          expanded: folderExpanded,
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

  items.sort((a, b) => a.order - b.order)
  return items
}

// 检查目录下是否有 md 文件
function hasMdFiles(dir) {
  if (!fs.existsSync(dir)) return false
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.name !== 'node_modules')
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) return true
    if (entry.isDirectory() && hasMdFiles(resolve(dir, entry.name))) return true
  }
  return false
}

// Vite 插件：提供用户文档 API + 配置 API + 热更新
function md2uiPlugin(siteConfig) {
  return {
    name: 'md2ui-server',
    configureServer(server) {
      // API 中间件
      server.middlewares.use((req, res, next) => {
        // 文档列表 API
        if (req.url === '/@user-docs-list') {
          const docs = scanDocs(userDir, '', 0, siteConfig.folderExpanded)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(docs))
          return
        }
        // 站点配置 API
        if (req.url === '/@site-config') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(siteConfig))
          return
        }
        // 文档内容
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

      // SPA fallback
      return () => {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] || ''
          if (url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/') || url.match(/\.\w+$/)) {
            next()
            return
          }
          req.url = '/index.html'
          next()
        })
      }
    }
  }
}

async function start() {
  console.log(`\n  md2ui - Markdown 文档预览工具\n`)
  console.log(`  扫描目录: ${userDir}\n`)

  if (!hasMdFiles(userDir)) {
    console.log('  当前目录下没有找到 Markdown 文件 (.md)\n')
    console.log('  请在包含 .md 文件的目录中运行此命令\n')
    process.exit(1)
  }

  // 加载配置
  const userConfig = await loadUserConfig()
  const cliArgs = parseArgs()
  const siteConfig = { ...defaultConfig, ...userConfig, ...cliArgs }

  const server = await createServer({
    root: pkgRoot,
    configFile: resolve(pkgRoot, 'vite.config.js'),
    plugins: [md2uiPlugin(siteConfig)],
    server: {
      port: siteConfig.port
    }
  })

  await server.listen()
  server.printUrls()

  if (siteConfig.title !== defaultConfig.title) {
    console.log(`  站点标题: ${siteConfig.title}`)
  }
  console.log('')

  // 自动打开浏览器
  const address = server.httpServer.address()
  const url = `http://localhost:${address.port}`
  const platform = process.platform
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
}

start().catch(console.error)
