import { ref } from 'vue'

export function useScroll() {
  const scrollProgress = ref(0)
  const showBackToTop = ref(false)
  const activeHeading = ref('')

  // 监听滚动
  function handleScroll(e) {
    const element = e.target
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    
    if (scrollHeight > 0) {
      scrollProgress.value = Math.round((scrollTop / scrollHeight) * 100)
      showBackToTop.value = scrollTop > 300
    }
    
    updateActiveHeading()
  }

  // 更新当前激活的标题
  function updateActiveHeading() {
    const content = document.querySelector('.content')
    if (!content) return
    
    const headings = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6')
    const scrollTop = content.scrollTop
    
    let currentId = ''
    headings.forEach(heading => {
      const rect = heading.getBoundingClientRect()
      const contentRect = content.getBoundingClientRect()
      const offsetTop = rect.top - contentRect.top + scrollTop
      
      if (offsetTop <= scrollTop + 100) {
        currentId = heading.id
      }
    })
    
    activeHeading.value = currentId
  }

  // 滚动到指定标题
  function scrollToHeading(id) {
    const element = document.getElementById(id)
    const content = document.querySelector('.content')
    
    if (element && content) {
      const contentRect = content.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const offsetTop = elementRect.top - contentRect.top + content.scrollTop
      
      content.scrollTo({
        top: offsetTop - 20,
        behavior: 'smooth'
      })
    }
  }

  // 返回顶部
  function scrollToTop() {
    const content = document.querySelector('.content')
    if (content) {
      content.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return {
    scrollProgress,
    showBackToTop,
    activeHeading,
    handleScroll,
    scrollToHeading,
    scrollToTop
  }
}
