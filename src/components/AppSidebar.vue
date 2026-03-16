<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar-drawer': isMobile, 'drawer-open': drawerOpen }"
    :style="!isMobile ? { width: width + 'px' } : undefined"
  >
    <div class="logo">
      <div class="logo-group">
        <Logo @go-home="$emit('go-home')" />
        <a href="https://github.com/devsneed/md2ui" target="_blank" class="github-link" title="GitHub">
          <Github :size="14" />
        </a>
      </div>
      <div class="logo-actions">
        <ThemeToggle :mode="mode" :size="14" @toggle-theme="$emit('toggle-theme')" />
        <button v-if="isMobile" class="sidebar-toggle" @click="$emit('close-drawer')" title="关闭菜单">
          <X :size="16" />
        </button>
        <button v-else class="sidebar-toggle" @click="$emit('collapse')" title="收起导航">
          <PanelLeftClose :size="16" />
        </button>
      </div>
    </div>
    <nav class="nav-menu">
      <div class="nav-section">
        <span>文档目录</span>
        <div class="nav-actions">
          <button class="action-btn" @click="$emit('open-search')" title="搜索 (Ctrl+K)">
            <Search :size="14" />
          </button>
          <button class="action-btn" @click="$emit('expand-all')" title="全部展开">
            <ChevronsDownUp :size="14" />
          </button>
          <button class="action-btn" @click="$emit('collapse-all')" title="全部收起">
            <ChevronsUpDown :size="14" />
          </button>
        </div>
      </div>
      <!-- 过滤输入框 -->
      <div class="nav-filter">
        <Filter :size="12" class="nav-filter-icon" />
        <input
          v-model="filterText"
          type="text"
          class="nav-filter-input"
          placeholder="过滤文档..."
        />
        <button v-if="filterText" class="nav-filter-clear" @click="filterText = ''">
          <X :size="12" />
        </button>
      </div>
      <TreeNode
        v-for="item in filteredDocs"
        :key="item.key"
        :item="item"
        :currentDoc="currentDoc"
        @toggle="$emit('toggle-folder', $event)"
        @select="$emit('select-doc', $event)"
      />
      <div v-if="filterText && filteredDocs.length === 0" class="nav-filter-empty">
        没有匹配的文档
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Github, PanelLeftClose, X, Search, ChevronsDownUp, ChevronsUpDown, Filter } from 'lucide-vue-next'
import Logo from './Logo.vue'
import TreeNode from './TreeNode.vue'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps({
  docsList: { type: Array, default: () => [] },
  currentDoc: { type: String, default: '' },
  isMobile: { type: Boolean, default: false },
  drawerOpen: { type: Boolean, default: false },
  width: { type: Number, default: 320 },
  mode: { type: String, default: 'system' }
})

defineEmits([
  'go-home', 'toggle-theme', 'close-drawer', 'collapse',
  'open-search', 'expand-all', 'collapse-all',
  'toggle-folder', 'select-doc'
])

const filterText = ref('')

// 递归过滤文档树：保留匹配的文件和包含匹配文件的文件夹
function filterTree(items, keyword) {
  if (!keyword) return items
  const lower = keyword.toLowerCase()
  const result = []
  for (const item of items) {
    if (item.type === 'file') {
      if (item.label.toLowerCase().includes(lower) || item.key.toLowerCase().includes(lower)) {
        result.push(item)
      }
    } else if (item.type === 'folder' && item.children) {
      const children = filterTree(item.children, keyword)
      if (children.length > 0) {
        result.push({ ...item, children, expanded: true })
      }
    }
  }
  return result
}

const filteredDocs = computed(() => filterTree(props.docsList, filterText.value))
</script>
