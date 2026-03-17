<template>
  <header class="top-bar">
    <!-- 左侧 Logo -->
    <Logo @go-home="$emit('go-home')" />
    <!-- 中间搜索框（内联下拉） -->
    <div class="top-bar-search-wrapper" ref="searchWrapperRef">
      <div class="top-bar-search" :class="{ focused: searchFocused }" @click="focusInput">
        <Search :size="14" class="top-bar-search-icon" />
        <input
          ref="inputRef"
          type="text"
          class="top-bar-search-input"
          placeholder="搜索文档..."
          v-model="searchQuery"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="doSearch(searchQuery)"
          @keydown.escape="handleEscape"
          @keydown.enter="handleEnter"
          @keydown.up.prevent="moveSelection(-1)"
          @keydown.down.prevent="moveSelection(1)"
        />
        <kbd class="top-bar-kbd">Ctrl+K</kbd>
      </div>
      <!-- 下拉搜索结果 -->
      <transition name="dropdown">
        <div v-if="showDropdown" class="search-dropdown">
          <div v-if="!searchReady && indexBuilding" class="search-dropdown-tip">
            正在构建索引...
          </div>
          <div v-else-if="searchQuery && searchResults.length === 0" class="search-dropdown-empty">
            没有找到相关文档
          </div>
          <template v-else>
            <div
              v-for="(item, index) in searchResults"
              :key="item.key"
              :class="['search-dropdown-item', { active: index === selectedIndex }]"
              @mousedown.prevent="selectResult(item)"
              @mouseenter="selectedIndex = index"
            >
              <FileText :size="14" class="search-dropdown-item-icon" />
              <span class="search-dropdown-item-title">{{ item.title }}</span>
            </div>
          </template>
          <div v-if="!searchQuery" class="search-dropdown-tip">
            输入关键词搜索文档内容
          </div>
        </div>
      </transition>
    </div>
    <!-- 右侧操作 -->
    <div class="top-bar-actions">
      <a href="https://github.com/devsneed/md2ui" target="_blank" class="top-bar-btn" title="GitHub">
        <Github :size="15" />
      </a>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Search, Github, FileText } from 'lucide-vue-next'
import Logo from './Logo.vue'
import { useSearch } from '../composables/useSearch.js'

defineProps({})

const emit = defineEmits(['go-home', 'select-search'])

const { searchQuery, searchResults, searchReady, indexBuilding, doSearch, openSearch, closeSearch } = useSearch()

const inputRef = ref(null)
const searchWrapperRef = ref(null)
const searchFocused = ref(false)
const selectedIndex = ref(0)

// 下拉是否展示：聚焦状态下，有输入内容或刚聚焦时
const showDropdown = computed(() => {
  return searchFocused.value && (searchQuery.value.length > 0 || indexBuilding.value)
})

// 搜索结果变化时重置选中
watch(searchResults, () => {
  selectedIndex.value = 0
})

function focusInput() {
  inputRef.value?.focus()
}

async function handleFocus() {
  searchFocused.value = true
  await openSearch()
}

function handleBlur() {
  // 延迟关闭，让 mousedown 事件先触发
  setTimeout(() => {
    searchFocused.value = false
  }, 150)
}

function handleEscape() {
  searchQuery.value = ''
  searchResults.value = []
  inputRef.value?.blur()
}

function moveSelection(delta) {
  const len = searchResults.value.length
  if (len === 0) return
  selectedIndex.value = (selectedIndex.value + delta + len) % len
}

function handleEnter() {
  if (searchResults.value.length > 0) {
    selectResult(searchResults.value[selectedIndex.value])
  }
}

function selectResult(item) {
  emit('select-search', item.key)
  searchQuery.value = ''
  searchResults.value = []
  inputRef.value?.blur()
}

// 全局快捷键 Ctrl+K
function handleGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    focusInput()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
