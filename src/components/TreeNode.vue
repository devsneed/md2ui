<template>
  <div>
    <!-- 文件夹节点 -->
    <div 
      v-if="item.type === 'folder'"
      class="nav-item nav-folder"
      :class="{ expanded: item.expanded }"
      :style="{ paddingLeft: `${20 + item.level * 16}px` }"
      @click="$emit('toggle', item)"
      @mouseenter="showTooltip($event, item.label)"
      @mouseleave="hideTooltip"
    >
      <ChevronRight v-if="!item.expanded" class="nav-icon chevron-icon" :size="16" />
      <ChevronDown v-else class="nav-icon chevron-icon" :size="16" />
      <Folder v-if="!item.expanded" class="nav-icon folder-icon" :size="16" />
      <FolderOpen v-else class="nav-icon folder-icon" :size="16" />
      <span class="nav-label">{{ item.label }}</span>
    </div>
    
    <!-- 递归渲染子节点 -->
    <template v-if="item.type === 'folder' && item.expanded && item.children">
      <TreeNode 
        v-for="child in item.children" 
        :key="child.key"
        :item="child"
        :currentDoc="currentDoc"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </template>
    
    <!-- 文件节点 -->
    <div 
      v-if="item.type === 'file'"
      class="nav-item"
      :class="{ active: currentDoc === item.key }"
      :style="{ paddingLeft: `${20 + item.level * 16}px` }"
      @click="$emit('select', item.key)"
      @mouseenter="showTooltip($event, item.label)"
      @mouseleave="hideTooltip"
    >
      <FileText class="nav-icon file-icon" :size="16" />
      <span class="nav-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-vue-next'

defineProps({
  item: {
    type: Object,
    required: true
  },
  currentDoc: {
    type: String,
    required: true
  }
})

defineEmits(['toggle', 'select'])

let tooltipEl = null

function showTooltip(event, text) {
  hideTooltip()
  
  const target = event.currentTarget
  const label = target.querySelector('.nav-label')
  
  // 只有文字被截断时才显示 tooltip
  if (label && label.scrollWidth <= label.clientWidth) return
  
  tooltipEl = document.createElement('div')
  tooltipEl.className = 'nav-tooltip'
  tooltipEl.textContent = text
  tooltipEl.style.cssText = `
    position: fixed;
    background: #1f2328;
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 9999;
    max-width: 300px;
    word-break: break-all;
    user-select: text;
    cursor: text;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `
  
  document.body.appendChild(tooltipEl)
  
  const rect = target.getBoundingClientRect()
  tooltipEl.style.left = `${rect.right + 8}px`
  tooltipEl.style.top = `${rect.top}px`
  
  // 防止超出屏幕右侧
  const tooltipRect = tooltipEl.getBoundingClientRect()
  if (tooltipRect.right > window.innerWidth - 10) {
    tooltipEl.style.left = `${rect.left - tooltipRect.width - 8}px`
  }
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove()
    tooltipEl = null
  }
}
</script>


