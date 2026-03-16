<template>
  <header class="top-bar">
    <div class="top-bar-search" @click="$emit('open-search')" role="button" tabindex="0" @keydown.enter="$emit('open-search')">
      <Search :size="14" class="top-bar-search-icon" />
      <span class="top-bar-search-text">搜索文档...</span>
      <kbd class="top-bar-kbd">Ctrl+K</kbd>
    </div>
    <div class="top-bar-actions">
      <button class="top-bar-btn" @click="$emit('toggle-theme')" :title="themeTitle">
        <Sun v-if="mode === 'light'" :size="15" />
        <Moon v-else-if="mode === 'dark'" :size="15" />
        <Monitor v-else :size="15" />
      </button>
      <a href="https://github.com/devsneed/md2ui" target="_blank" class="top-bar-btn" title="GitHub">
        <Github :size="15" />
      </a>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { Search, Sun, Moon, Monitor, Github } from 'lucide-vue-next'

const props = defineProps({
  mode: { type: String, default: 'system' }
})

defineEmits(['open-search', 'toggle-theme'])

const themeTitle = computed(() => {
  if (props.mode === 'light') return '切换暗色'
  if (props.mode === 'dark') return '跟随系统'
  return '切换亮色'
})
</script>
