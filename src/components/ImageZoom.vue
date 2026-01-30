<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="image-zoom-overlay"
      @click="handleOverlayClick"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div class="image-zoom-container">
        <!-- 工具栏 -->
        <div class="zoom-toolbar">
          <button class="zoom-btn" @click="handleZoomIn" title="放大">
            <ZoomIn :size="16" />
          </button>
          <button class="zoom-btn" @click="handleZoomOut" title="缩小">
            <ZoomOut :size="16" />
          </button>
          <button class="zoom-btn" @click="resetZoom" title="重置">
            <RotateCcw :size="16" />
          </button>
          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
          <button class="zoom-btn close-btn" @click="close" title="关闭">
            <X :size="16" />
          </button>
        </div>

        <!-- 图片容器 -->
        <div
          class="image-wrapper"
          :style="{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: 'center center'
          }"
          v-html="imageContent"
        ></div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-vue-next'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageContent: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close'])

// 缩放和拖拽状态
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// 缩放控制
const minScale = 0.1
const maxScale = 10
const scaleStep = 0.2

// 放大
function handleZoomIn() {
  if (scale.value < maxScale) {
    scale.value = Math.min(scale.value + scaleStep, maxScale)
  }
}

// 缩小
function handleZoomOut() {
  if (scale.value > minScale) {
    scale.value = Math.max(scale.value - scaleStep, minScale)
  }
}

// 重置缩放
function resetZoom() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

// 关闭
function close() {
  resetZoom()
  emit('close')
}

// 处理遮罩层点击
function handleOverlayClick(event) {
  if (event.target.classList.contains('image-zoom-overlay')) {
    close()
  }
}

// 处理滚轮缩放
function handleWheel(event) {
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? -scaleStep : scaleStep
  const newScale = Math.max(minScale, Math.min(maxScale, scale.value + delta))
  
  if (newScale !== scale.value) {
    scale.value = newScale
  }
}

// 处理鼠标按下
function handleMouseDown(event) {
  if (event.target.closest('.zoom-toolbar')) return
  
  isDragging.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
  event.preventDefault()
}

// 处理鼠标移动
function handleMouseMove(event) {
  if (!isDragging.value) return
  
  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value
  
  translateX.value += deltaX
  translateY.value += deltaY
  
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
}

// 处理鼠标释放
function handleMouseUp() {
  isDragging.value = false
}

// 监听键盘事件
function handleKeyDown(event) {
  if (!props.visible) return
  
  switch (event.key) {
    case 'Escape':
      close()
      break
    case '+':
    case '=':
      handleZoomIn()
      break
    case '-':
      handleZoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

// 添加键盘监听
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyDown)
}
</script>

<style scoped>
.image-zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.image-zoom-overlay:active {
  cursor: grabbing;
}

.image-zoom-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: auto;
  padding: 40px;
}

.zoom-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  pointer-events: auto;
}

.zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #4a5568;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.zoom-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.close-btn {
  color: #e53e3e;
}

.close-btn:hover {
  background: #fed7d7;
  color: #c53030;
}

.zoom-level {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  padding: 0 8px;
  min-width: 50px;
  text-align: center;
}

.image-wrapper {
  transition: transform 0.2s ease-out;
  cursor: grab;
  background: rgba(255, 255, 255, 0.98);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

.image-wrapper:active {
  cursor: grabbing;
}

/* 确保SVG在放大时保持清晰 */
.image-wrapper :deep(svg) {
  display: block !important;
  background: white;
  border-radius: 4px;
  min-width: 800px;
  width: auto !important;
  height: auto !important;
}
</style>