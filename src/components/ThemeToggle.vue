<template>
  <button class="theme-toggle" @click="$emit('toggle-theme')" :title="themeTitle">
    <Sun v-if="mode === 'light'" :size="size" />
    <Moon v-else-if="mode === 'dark'" :size="size" />
    <Monitor v-else :size="size" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

const props = defineProps({
  mode: { type: String, default: 'system' },
  size: { type: Number, default: 14 }
})

defineEmits(['toggle-theme'])

const themeTitle = computed(() => {
  if (props.mode === 'light') return '切换暗色'
  if (props.mode === 'dark') return '跟随系统'
  return '切换亮色'
})
</script>
