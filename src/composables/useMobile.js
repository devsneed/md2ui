import { ref, onMounted, onUnmounted } from 'vue'

const MOBILE_BREAKPOINT = 768

// 移动端检测 & 抽屉/TOC 面板状态
export function useMobile() {
  const isMobile = ref(false)
  const mobileDrawerOpen = ref(false)
  const mobileTocOpen = ref(false)

  function checkMobile() {
    isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
    if (!isMobile.value) {
      mobileDrawerOpen.value = false
      mobileTocOpen.value = false
    }
  }

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })

  return { isMobile, mobileDrawerOpen, mobileTocOpen }
}
