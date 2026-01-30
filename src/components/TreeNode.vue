<template>
  <div>
    <!-- 文件夹节点 -->
    <div 
      v-if="item.type === 'folder'"
      class="nav-item nav-folder"
      :class="{ expanded: item.expanded }"
      :style="{ paddingLeft: `${20 + item.level * 16}px` }"
      @click="$emit('toggle', item)"
    >
      <ChevronRight v-if="!item.expanded" class="nav-icon chevron-icon" :size="16" />
      <ChevronDown v-else class="nav-icon chevron-icon" :size="16" />
      <Folder v-if="!item.expanded" class="nav-icon folder-icon" :size="16" />
      <FolderOpen v-else class="nav-icon folder-icon" :size="16" />
      <span>{{ item.label }}</span>
    </div>
    
    <!-- 递归渲染子节点 -->
    <template v-if="item.type === 'folder' && item.expanded && item.children">
      <TreeNode 
        v-for="child in item.children" 
        :key="child.key"
        :item="child"
        :currentDoc="currentDoc"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </template>
    
    <!-- 文件节点 -->
    <div 
      v-if="item.type === 'file'"
      class="nav-item"
      :class="{ active: currentDoc === item.key }"
      :style="{ paddingLeft: `${20 + item.level * 16}px` }"
      @click="$emit('select', item.key)"
    >
      <FileText class="nav-icon file-icon" :size="16" />
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-vue-next'

defineProps({
  item: {
    type: Object,
    required: true
  },
  currentDoc: {
    type: String,
    required: true
  }
})

defineEmits(['toggle', 'select'])
</script>


