import { useCallback, useRef, useState } from 'react'
import { streamChat } from '../api/chat'

let messageSeq = 0
const nextMessageId = () => ++messageSeq

/**
 * 一轮对话的状态管理：用户消息 + 一条正在流式填充的 AI 消息。
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  const patchAiMessage = (id, updater) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)))

  const send = useCallback(
    (rawText) => {
      const content = rawText.trim()
      if (!content || isStreaming) return

      const userMessage = { id: nextMessageId(), role: 'user', content }
      const aiMessageId = nextMessageId()
      const aiMessage = { id: aiMessageId, role: 'assistant', content: '', status: 'streaming' }

      setMessages((prev) => [...prev, userMessage, aiMessage])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      streamChat({
        memoryId: sessionId,
        message: content,
        signal: controller.signal,
        onChunk: (chunk) => {
          patchAiMessage(aiMessageId, (m) => ({ ...m, content: m.content + chunk }))
        },
        onDone: ({ aborted } = {}) => {
          abortRef.current = null
          setIsStreaming(false)
          patchAiMessage(aiMessageId, (m) => ({
            ...m,
            status: aborted ? 'aborted' : 'done',
          }))
        },
        onError: (error) => {
          abortRef.current = null
          setIsStreaming(false)
          const detail = error?.response?.status
            ? `HTTP ${error.response.status}`
            : error?.message || '未知错误'
          patchAiMessage(aiMessageId, (m) => ({
            ...m,
            status: 'error',
            error: `请求失败：${detail}`,
          }))
        },
      })
    },
    [isStreaming, sessionId],
  )

  /** 中断当前流式输出 */
  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  /** 切换会话时清空消息 */
  const clear = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
    setMessages([])
  }, [])

  return { messages, isStreaming, send, stop, clear }
}
