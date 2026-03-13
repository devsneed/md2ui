<template>
  <header class="mobile-header">
    <button class="mobile-menu-btn" @click="$emit('open-drawer')" title="打开菜单">
      <Menu :size="20" />
    </button>
    <Logo @go-home="$emit('go-home')" />
    <div class="mobile-header-actions">
      <button class="mobile-action-btn" @click="$emit('open-search')" title="搜索">
        <Search :size="18" />
      </button>
      <button class="mobile-action-btn" @click="$emit('toggle-theme')" :title="themeTitle">
        <Sun v-if="mode === 'light'" :size="18" />
        <Moon v-else-if="mode === 'dark'" :size="18" />
        <Monitor v-else :size="18" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { Menu, Search, Sun, Moon, Monitor } from 'lucide-vue-next'
import Logo from './Logo.vue'

const props = defineProps({
  mode: { type: String, default: 'system' }
})

defineEmits(['open-drawer', 'go-home', 'open-search', 'toggle-theme'])

const themeTitle = computed(() => {
  if (props.mode === 'light') return '切换暗色'
  if (props.mode === 'dark') return '跟随系统'
  return '切换亮色'
})
</script>
