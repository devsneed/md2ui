<template>
  <transition name="slide-up">
    <div v-if="canInstall" class="pwa-prompt">
      <div class="pwa-prompt-content">
        <div class="pwa-prompt-icon">
          <Download :size="18" />
        </div>
        <div class="pwa-prompt-text">
          <span class="pwa-prompt-title">安装到桌面</span>
          <span class="pwa-prompt-desc">离线访问，随时阅读</span>
        </div>
      </div>
      <div class="pwa-prompt-actions">
        <button class="pwa-btn-install" @click="$emit('install')">
          安装
        </button>
        <button class="pwa-btn-dismiss" @click="$emit('dismiss')">
          <X :size="14" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { Download, X } from 'lucide-vue-next'
defineProps({ canInstall: { type: Boolean, default: false } })
defineEmits(['install', 'dismiss'])
</script>
