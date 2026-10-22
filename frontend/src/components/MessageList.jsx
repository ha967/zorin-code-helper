import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

const SUGGESTIONS = [
  '用 Java 写一个快速排序，并解释时间复杂度',
  'Spring Boot 里 SSE 和 WebSocket 该怎么选？',
  '帮我 review 这段代码：List<User> list = new ArrayList<>()',
]

export default function MessageList({ messages, onPickSuggestion }) {
  const scrollRef = useRef(null)
  // 用户往上翻看历史时不要强行把视图拽到底部
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  return (
    <main className="chat-list" ref={scrollRef} onScroll={handleScroll}>
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__logo">Z</div>
          <h2>今天想写点什么？</h2>
          <p>我是你的 AI 编程助手，可以帮你写代码、解释报错、做代码评审。</p>
          <div className="empty-state__suggestions">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                className="suggestion"
                onClick={() => onPickSuggestion(text)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
    </main>
  )
}
