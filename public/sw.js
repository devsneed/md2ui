// md2ui Service Worker - SPA 模式离线缓存
// 缓存策略：
//   - 静态资源（JS/CSS/SVG）：Cache First
//   - 文档内容（.md）：Network First，回退缓存
//   - HTML：Network First，回退缓存

const CACHE_NAME = 'md2ui-spa-v1'

// 安装：预缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['/', '/logo.svg']))
      .then(() => self.skipWaiting())
  )
})

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('md2ui-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// 请求拦截
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 跳过 Vite HMR 和开发工具请求
  if (url.pathname.startsWith('/@') || url.pathname.includes('__vite')) return

  // 文档内容请求（.md 文件）：Network First
  if (url.pathname.endsWith('.md') || url.pathname.includes('user-docs')) {
    event.respondWith(networkFirst(request))
    return
  }

  // 静态资源：Cache First
  if (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|woff2?)$/)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // 其他请求（HTML 等）：Network First
  event.respondWith(networkFirst(request))
})

// Cache First 策略
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('离线不可用', { status: 503 })
  }
}

// Network First 策略
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // HTML 请求回退到首页（SPA）
    if (request.headers.get('accept')?.includes('text/html')) {
      const index = await caches.match('/')
      if (index) return index
    }
    return new Response('离线不可用', { status: 503 })
  }
}
