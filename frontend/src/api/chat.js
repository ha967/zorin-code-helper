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
 * 调用后端的流式对话接口：POST /api/ai/chat，body 为 { memoryId, message }。
 *
 * 每一帧 SSE 的 data 是一个 JSON 对象：
 *   { type: 'delta', text: '...' }
 *   { type: 'error', code: '...', message: '...' }
 *   { type: 'done' }
 *
 * 浏览器里 axios 走 XHR 适配器，onDownloadProgress 会随着网络分片不断回调，
 * 每次通过 event.target.responseText 拿到「累计」的响应文本，我们自己算出增量再解析 SSE。
 *
 * @param {object}   options
 * @param {number}   options.memoryId 会话 id，后端按它隔离会话记忆
 * @param {string}   options.message  用户发送的内容
 * @param {AbortSignal} [options.signal] 用于中断流式请求
 * @param {(chunk: string) => void} [options.onDelta] 每收到一段增量文本时触发
 * @param {() => void} [options.onDone]  正常结束
 * @param {(error: { code: string, message: string }) => void} [options.onError] 出错
 * @returns {Promise<void>}
 */
export function streamChat({ memoryId, message, signal, onDelta, onDone, onError }) {
  // 已经消费到的 responseText 长度，用来从累计文本里切出本次增量
  let consumed = 0
  let serverError = null

  const parser = createSseParser({
    onData: (data) => {
      let event
      try {
        event = JSON.parse(data)
      } catch {
        // 不是约定协议的数据直接忽略，避免一帧脏数据打断整个对话
        return
      }

      if (event.type === 'delta') {
        if (event.text) onDelta?.(event.text)
      } else if (event.type === 'error') {
        serverError = {
          code: event.code || 'MODEL_ERROR',
          message: event.message || '生成失败，请稍后重试',
        }
        onError?.(serverError)
      }
    },
  })

  return http
    .post(
      '/ai/chat',
      { memoryId, message },
      {
        responseType: 'text',
        signal,
        headers: { Accept: 'text/event-stream' },
        onDownloadProgress: (event) => {
          const fullText = event.event?.target?.responseText ?? ''
          if (fullText.length <= consumed) return
          parser.push(fullText.slice(consumed))
          consumed = fullText.length
        },
      },
    )
    .then(() => {
      // 流结束时把末尾缺少空行的残帧也吐出去
      parser.flush()
      // 服务端已经通过 error 帧报告过错误，不再重复回调
      if (serverError) return
      onDone?.()
    })
    .catch((error) => {
      // 用户主动中断（点了「停止」）不算失败
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
        onDone?.({ aborted: true })
        return
      }
      if (serverError) return
      const detail = error?.response?.status
        ? `HTTP ${error.response.status}`
        : error?.message || '未知错误'
      onError?.({ code: 'NETWORK', message: `请求失败：${detail}` })
    })
}

/** 读取某个会话的历史消息，用于页面刷新后恢复对话。 */
export async function fetchHistory(memoryId) {
  const { data } = await http.get('/ai/history', { params: { memoryId } })
  return data?.messages ?? []
}

/**
 * 为一轮刚结束的问答生成追问建议（POST /api/ai/suggestions）。
 * 这是旁路请求：失败时由调用方忽略，不显示建议即可。
 */
export async function fetchSuggestions({ question, answer, signal }) {
  const { data } = await http.post('/ai/suggestions', { question, answer }, { signal })
  return Array.isArray(data?.questions) ? data.questions : []
}

export default http
