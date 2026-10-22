import axios from 'axios'
import { createSseParser } from './sseParser'

// 开发环境走 vite 代理（vite.config.js 里把 /api 转到 8081），
// 部署到其它环境时可以用 VITE_API_BASE_URL 覆盖，比如 http://10.0.0.8:8081/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// timeout: 0 —— 流式响应可以持续很久，不能被默认超时中断
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0,
})

/**
 * 调用后端的流式对话接口：GET /api/ai/chat?memoryId=..&message=..
 *
 * 浏览器里 axios 走 XHR 适配器，onDownloadProgress 会随着网络分片不断回调，
 * 每次通过 event.target.responseText 拿到「累计」的响应文本，我们自己算出增量再解析 SSE。
 *
 * @param {object}   options
 * @param {number}   options.memoryId 会话 id，后端按它隔离会话记忆
 * @param {string}   options.message  用户发送的内容
 * @param {AbortSignal} [options.signal] 用于中断流式请求
 * @param {(chunk: string) => void} [options.onChunk] 每收到一段增量文本时触发
 * @param {() => void} [options.onDone]  正常结束
 * @param {(error: Error) => void} [options.onError] 出错
 * @returns {Promise<void>}
 */
export function streamChat({ memoryId, message, signal, onChunk, onDone, onError }) {
  // 已经消费到的 responseText 长度，用来从累计文本里切出本次增量
  let consumed = 0

  const parser = createSseParser({
    onData: (data) => {
      if (data) onChunk?.(data)
    },
  })

  return http
    .get('/ai/chat', {
      params: { memoryId, message },
      responseType: 'text',
      signal,
      headers: { Accept: 'text/event-stream' },
      onDownloadProgress: (event) => {
        const fullText = event.event?.target?.responseText ?? ''
        if (fullText.length <= consumed) return
        const delta = fullText.slice(consumed)
        consumed = fullText.length
        parser.push(delta)
      },
    })
    .then(() => {
      parser.flush()
      onDone?.()
    })
    .catch((error) => {
      // 用户主动中断（点了「停止」）不算失败
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
        onDone?.({ aborted: true })
        return
      }
      onError?.(error)
    })
}

export default http
