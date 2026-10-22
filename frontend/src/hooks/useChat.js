import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHistory, streamChat } from '../api/chat'

let messageSeq = 0
const nextMessageId = () => ++messageSeq

const toMessage = (message) => ({
  id: nextMessageId(),
  role: message.role,
  content: message.content,
  status: 'done',
})

/**
 * 一轮对话的状态管理：用户消息 + 一条正在流式填充的 AI 消息。
 * 切换会话时也会从后端拉取该会话的历史记录。
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)
  // 历史加载完成前用户已经开始发消息时，不要把历史覆盖到当前对话上
  const touchedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    touchedRef.current = false
    setMessages([])

    fetchHistory(sessionId)
      .then((history) => {
        if (cancelled || touchedRef.current) return
        setMessages(history.map(toMessage))
      })
      .catch(() => {
        // 历史加载失败不阻塞聊天，用户可以继续发消息
      })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  const patchAiMessage = (id, updater) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)))

  const send = useCallback(
    (rawText) => {
      const content = rawText.trim()
      if (!content || isStreaming) return

      touchedRef.current = true
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
        onDelta: (chunk) => {
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
          patchAiMessage(aiMessageId, (m) => ({
            ...m,
            status: 'error',
            error: error?.message || '请求失败，请稍后重试',
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
    touchedRef.current = false
    setIsStreaming(false)
    setMessages([])
  }, [])

  return { messages, isStreaming, send, stop, clear }
}
