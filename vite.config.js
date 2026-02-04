import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { config } from './src/config.js'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: config.defaultPort
  },
  optimizeDeps: {
    include: ['vue', 'marked', 'mermaid']
  }
})
