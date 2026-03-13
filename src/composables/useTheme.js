import { ref, watchEffect } from 'vue'

// 主题模式：light / dark / system
const STORAGE_KEY = 'md2ui-theme'

// 获取系统偏好
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 从 localStorage 读取用户偏好
function getSavedMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system'
  } catch {
    return 'system'
  }
}

export function useTheme() {
  const mode = ref(getSavedMode()) // light / dark / system
  const resolvedTheme = ref('light') // 实际应用的主题

  // 应用主题到 DOM
  function applyTheme() {
    const theme = mode.value === 'system' ? getSystemTheme() : mode.value
    resolvedTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
  }

  // 切换主题：light -> dark -> system -> light
  function toggleTheme() {
    const order = ['light', 'dark', 'system']
    const idx = order.indexOf(mode.value)
    mode.value = order[(idx + 1) % order.length]
    try {
      localStorage.setItem(STORAGE_KEY, mode.value)
    } catch { /* 忽略 */ }
    applyTheme()
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') applyTheme()
    })
  }

  // 初始化
  applyTheme()

  return {
    mode,
    resolvedTheme,
    toggleTheme
  }
}
