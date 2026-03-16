<template>
  <header class="top-bar">
    <!-- 左侧 Logo -->
    <Logo @go-home="$emit('go-home')" />
    <!-- 中间搜索框 -->
    <div class="top-bar-search" @click="$emit('open-search')" role="button" tabindex="0" @keydown.enter="$emit('open-search')">
      <Search :size="14" class="top-bar-search-icon" />
      <span class="top-bar-search-text">搜索文档...</span>
      <kbd class="top-bar-kbd">Ctrl+K</kbd>
    </div>
    <!-- 右侧操作 -->
    <div class="top-bar-actions">
      <ThemeToggle :mode="mode" :size="15" @toggle-theme="$emit('toggle-theme')" />
      <a href="https://github.com/devsneed/md2ui" target="_blank" class="top-bar-btn" title="GitHub">
        <Github :size="15" />
      </a>
    </div>
  </header>
</template>

<script setup>
import { Search, Github } from 'lucide-vue-next'
import Logo from './Logo.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  mode: { type: String, default: 'system' }
})

defineEmits(['open-search', 'toggle-theme', 'go-home'])
</script>
