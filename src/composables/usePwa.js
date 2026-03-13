import { ref, onMounted } from 'vue'

/**
 * PWA 安装提示 composable
 * - 监听 beforeinstallprompt 事件
 * - 提供安装到桌面的能力
 */
export function usePwa() {
  const canInstall = ref(false)
  const isInstalled = ref(false)
  let deferredPrompt = null

  // 监听安装提示事件
  function handleBeforeInstallPrompt(e) {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  }

  // 触发安装
  async function installApp() {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    canInstall.value = false
    if (outcome === 'accepted') {
      isInstalled.value = true
      return true
    }
    return false
  }

  // 关闭安装提示
  function dismissInstall() {
    canInstall.value = false
    // 记住用户选择，24 小时内不再提示
    try {
      localStorage.setItem('md2ui-pwa-dismissed', Date.now().toString())
    } catch {}
  }

  onMounted(() => {
    // 检查是否已在 PWA 模式运行
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return
    }

    // 检查是否最近关闭过提示
    try {
      const dismissed = localStorage.getItem('md2ui-pwa-dismissed')
      if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
        return
      }
    } catch {}

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      canInstall.value = false
    })
  })

  return { canInstall, isInstalled, installApp, dismissInstall }
}
