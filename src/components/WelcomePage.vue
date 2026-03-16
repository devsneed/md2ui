<template>
  <div class="welcome-page">
    <div class="welcome-hero">
      <!-- 图标 + 标题同行 -->
      <div class="welcome-brand">
        <div class="welcome-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="10" y1="16" x2="22" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="10" y1="22" x2="17" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="welcome-title">md2ui</h1>
      </div>
      <p class="welcome-desc">将 Markdown 文档转换为美观易读的网页</p>
      <!-- 操作区 -->
      <div class="welcome-actions">
        <button class="welcome-btn primary" @click="$emit('start')">
          <BookOpen :size="16" />
          <span>开始阅读</span>
          <ArrowRight :size="14" class="btn-arrow" />
        </button>
      </div>
      <!-- GitHub -->
      <a class="welcome-github" href="https://github.com/devsneed/md2ui" target="_blank">
        <GitHubIcon :size="16" />
        <span>GitHub</span>
        <span class="welcome-github-sep"></span>
        <span class="welcome-github-repo">devsneed/md2ui</span>
        <ExternalLink :size="12" class="welcome-github-arrow" />
      </a>
    </div>
    <!-- 特性卡片 -->
    <div class="welcome-features">
      <div class="feature-card" v-for="f in features" :key="f.title">
        <div class="feature-icon-wrap">
          <component :is="f.icon" :size="20" />
        </div>
        <h3>{{ f.title }}</h3>
        <p>{{ f.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BookOpen, Github as GitHubIcon, ArrowRight, ExternalLink, FileText, Palette, Zap } from 'lucide-vue-next'

defineEmits(['start'])

const features = [
  { icon: FileText, title: 'Markdown 驱动', desc: '直接读取 .md 文件，零配置即可使用' },
  { icon: Palette, title: '简洁优雅', desc: '清晰的排版与舒适的阅读体验' },
  { icon: Zap, title: '开箱即用', desc: '一行命令启动，支持目录结构与 Mermaid 图表' }
]
</script>

<style scoped>
.welcome-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 64px 32px;
  user-select: none;
}

/* ===== Hero 区域 ===== */
.welcome-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 56px;
}

/* 图标 + 标题 */
.welcome-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border-radius: 14px;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
  border: none;
  padding: 0;
  margin: 0;
}

.welcome-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* 操作按钮 */
.welcome-actions {
  margin-top: 8px;
}

.welcome-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  border: none;
  font-family: inherit;
}

.welcome-btn.primary {
  background: var(--color-accent);
  color: #fff;
  box-shadow: 0 2px 12px rgba(62, 175, 124, 0.25);
}

.welcome-btn.primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 4px 16px rgba(62, 175, 124, 0.35);
  transform: translateY(-1px);
}

.btn-arrow {
  opacity: 0.7;
  transition: all 0.2s;
}

.welcome-btn.primary:hover .btn-arrow {
  opacity: 1;
  transform: translateX(2px);
}

/* GitHub 链接 */
.welcome-github {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.welcome-github:hover {
  border-color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.welcome-github-sep {
  width: 1px;
  height: 14px;
  background: var(--color-border);
}

.welcome-github-repo {
  color: var(--color-text-secondary);
  font-weight: 400;
  font-size: 13px;
}

.welcome-github-arrow {
  color: var(--color-text-tertiary);
  transition: all 0.15s;
}

.welcome-github:hover .welcome-github-arrow {
  color: var(--color-text-secondary);
  transform: translateX(1px);
}

/* ===== 特性卡片 ===== */
.welcome-features {
  display: flex;
  gap: 20px;
  max-width: 680px;
  width: 100%;
}

.feature-card {
  flex: 1;
  text-align: center;
  padding: 24px 16px 20px;
  border-radius: 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  transition: all 0.2s;
}

.feature-card:hover {
  border-color: var(--color-border);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.feature-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border-radius: 10px;
  margin-bottom: 14px;
}

.feature-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.feature-card p {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .welcome-page {
    padding: 48px 20px;
  }
  .welcome-features {
    flex-direction: column;
    gap: 12px;
  }
  .feature-card {
    padding: 20px 16px 16px;
  }
  .welcome-title {
    font-size: 28px;
  }
  .welcome-logo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
  .welcome-logo svg {
    width: 26px;
    height: 26px;
  }
}
</style>
