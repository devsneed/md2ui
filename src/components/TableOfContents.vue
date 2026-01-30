<template>
  <aside class="toc-sidebar" v-if="tocItems.length > 0 && !collapsed" :style="{ width: width + 'px' }">
    <div class="toc-header">
      <List :size="16" />
      <span>目录</span>
    </div>
    <nav class="toc-nav">
      <a 
        v-for="item in tocItems" 
        :key="item.id"
        :href="`#${item.id}`"
        :class="['toc-item', `toc-level-${item.level}`, { active: activeHeading === item.id }]"
        @click.prevent="$emit('scroll-to', item.id)"
      >
        {{ item.text }}
      </a>
    </nav>
  </aside>
</template>

<script setup>
import { List } from 'lucide-vue-next'

defineProps({
  tocItems: {
    type: Array,
    default: () => []
  },
  activeHeading: {
    type: String,
    default: ''
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  width: {
    type: Number,
    default: 240
  }
})

defineEmits(['scroll-to'])
</script>
