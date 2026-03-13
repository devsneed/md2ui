<template>
  <main class="content" @scroll="$emit('scroll', $event)" @click="$emit('content-click', $event)">
    <WelcomePage v-if="showWelcome" @start="$emit('start')" />
    <template v-else>
      <article class="markdown-content" v-html="htmlContent"></article>
      <nav v-if="prevDoc || nextDoc" class="doc-nav">
        <a v-if="prevDoc" class="doc-nav-link prev" @click.prevent="$emit('load-doc', prevDoc.key)">
          <ChevronLeft :size="16" />
          <div class="doc-nav-text">
            <span class="doc-nav-label">上一篇</span>
            <span class="doc-nav-title">{{ prevDoc.label }}</span>
          </div>
        </a>
        <div v-else></div>
        <a v-if="nextDoc" class="doc-nav-link next" @click.prevent="$emit('load-doc', nextDoc.key)">
          <div class="doc-nav-text">
            <span class="doc-nav-label">下一篇</span>
            <span class="doc-nav-title">{{ nextDoc.label }}</span>
          </div>
          <ChevronRight :size="16" />
        </a>
      </nav>
    </template>
  </main>
</template>

<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import WelcomePage from './WelcomePage.vue'

defineProps({
  showWelcome: { type: Boolean, default: true },
  htmlContent: { type: String, default: '' },
  prevDoc: { type: Object, default: null },
  nextDoc: { type: Object, default: null }
})

defineEmits(['scroll', 'content-click', 'start', 'load-doc'])
</script>
