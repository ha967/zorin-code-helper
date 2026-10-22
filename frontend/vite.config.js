import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Spring Boot 后端地址（application.yml 中是 8081 + context-path /api）
const BACKEND_ORIGIN = process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8081'

// 开发环境通过代理转发 /api 请求：
// 1. 前端代码里只需写相对路径，不需要硬编码后端地址
// 2. 浏览器同源，避免 CORS
// 3. SSE 分片由代理原样透传，不会整包缓冲
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
    },
  },
})
